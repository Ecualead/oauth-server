/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import mongoose from "mongoose";
import { BaseModel } from "@ikoabo/core_srv";
import { AuthorizationCode } from "oauth2-server";
import {
  prop,
  index,
  getModelForClass,
  DocumentType,
  Ref,
} from "@typegoose/typegoose";
import { Account } from "@/Accounts/models/accounts.model";
import { Application } from "@/Applications/models/applications.model";

@index({ code: 1 })
@index({ expiresAt: 1 })
@index({ application: 1 })
@index({ user: 1 })
export class OAuth2Code extends BaseModel {
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
    let authCode = {
      authorizationCode: this.code,
      expiresAt: this.expiresAt,
      redirectUri: this.redirectUri,
      scope: this.scope || [],
      client: <any>this.application,
      user: <any>(this.user ? this.user : this.application),
    };
    authCode.scope.push(
      authCode.client.id == authCode.user.id ? "application" : "user"
    );
    authCode.scope.push("default");
    return authCode;
  }

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(OAuth2Code, {
      schemaOptions: {
        collection: "oauth2.codes",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            let authCode = {
              authorizationCode: ret.code,
              expiresAt: ret.expiresAt,
              redirectUri: ret.redirectUri,
              scope: ret.scope || [],
              client: ret.application,
              user: (ret.user ? ret.user : ret.application),
            };
            authCode.scope.push(
              authCode.client.id == authCode.user.id ? "application" : "user"
            );
            authCode.scope.push("default");
            return authCode;
          },
        },
      },
      options: { automaticName: false },
    });
  }
}

export type OAuth2CodeDocument = DocumentType<OAuth2Code>;
export const OAuth2CodeModel: mongoose.Model<OAuth2CodeDocument> =
  OAuth2Code.shared;
