/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ecualead/server";
import { prop, index, getModelForClass, DocumentType, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { AuthorizationCode } from "oauth2-server";
import { Account } from "../account/account";
import { Application } from "../application/application";

@index({ code: 1 })
@index({ expiresAt: 1 })
@index({ application: 1 })
@index({ user: 1 })
export class Code extends BaseModel {
  @prop()
  code: string;

  @prop()
  expiresAt?: Date;

  @prop()
  redirectUri?: string;

  @prop({ type: String })
  scope: string[];

  @prop({ required: true, ref: Application })
  application: Ref<Application>;

  @prop({ ref: Account })
  user?: Ref<Account>;

  /**
   * Convert the document into OAuth Authorization Code
   */
  public toAuthCode(): AuthorizationCode {
    const authCode = {
      authorizationCode: this.code,
      expiresAt: this.expiresAt,
      redirectUri: this.redirectUri,
      scope: this.scope || [],
      client: <any>this.application,
      user: <any>(this.user ? this.user : this.application)
    };
    authCode.scope.push(authCode.client.id === authCode.user.id ? "application" : "user");
    authCode.scope.push("default");
    return authCode;
  }

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Code, {
      schemaOptions: {
        collection: "oauth2.codes",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            const authCode = {
              authorizationCode: ret.code,
              expiresAt: ret.expiresAt,
              redirectUri: ret.redirectUri,
              scope: ret.scope || [],
              client: ret.application,
              user: ret.user ? ret.user : ret.application
            };
            authCode.scope.push(authCode.client.id === authCode.user.id ? "application" : "user");
            authCode.scope.push("default");
            return authCode;
          }
        }
      },
      options: { automaticName: false }
    });
  }
}

export type CodeDocument = DocumentType<Code>;
export const CodeModel: mongoose.Model<CodeDocument> = Code.shared;
