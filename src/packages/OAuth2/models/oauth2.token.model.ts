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
import { BaseModel, Objects } from "@ikoabo/core_srv";
import { Token, RefreshToken } from "oauth2-server";
import {
  prop,
  index,
  getModelForClass,
  DocumentType,
  Ref,
} from "@typegoose/typegoose";
import { Application } from "@/Applications/models/applications.model";
import { Account } from "@/Accounts/models/accounts.model";
import { OAUTH2_TOKEN_TYPE } from "./oauth2.enum";

@index({ accessToken: 1 })
@index({ accessTokenExpiresAt: 1 })
@index({ refreshToken: 1 })
@index({ refreshTokenExpiresAt: 1 })
@index({ application: 1 })
@index({ user: 1 })
export class OAuth2Token extends BaseModel {
  @prop({ required: true })
  accessToken!: string;

  @prop()
  accessTokenExpiresAt?: Date;

  @prop()
  refreshToken?: string;

  @prop()
  refreshTokenExpiresAt?: Date;

  @prop({ type: String })
  scope?: string[];

  @prop({ required: true, ref: Application })
  application?: Ref<Application>;

  @prop({ ref: Account })
  user?: Ref<Account>;

  @prop({ required: true, default: false })
  keep?: boolean;

  @prop()
  username?: string;

  @prop({ required: true, default: OAUTH2_TOKEN_TYPE.TT_UNKNOWN })
  type?: number;

  /**
   * Convert the document into Access Token
   */
  public toToken(): Token {
    let token = {
      accessToken: this.accessToken,
      accessTokenExpiresAt: this.accessTokenExpiresAt,
      refreshToken: this.refreshToken,
      refreshTokenExpiresAt: this.refreshTokenExpiresAt,
      scope: this.scope || [],
      client: <any>this.application,
      user: <any>(this.user ? this.user : this.application),
      type: this.type,
      keep: this.keep,
      createdAt: this.createdAt,
    };

    token.scope.push("default");
    switch (token.type) {
      case OAUTH2_TOKEN_TYPE.TT_MODULE:
        token.scope.push("non_user");
        token.scope.push("module");
        break;
      case OAUTH2_TOKEN_TYPE.TT_APPLICATION:
        token.scope.push("non_user");
        token.scope.push("application");
        break;
      case OAUTH2_TOKEN_TYPE.TT_USER:
        token.scope.push("user");
        break;
    }
    return token;
  }

  /**
   * Convert the document into Refresh Token
   */
  public toRefreshToken(): RefreshToken {
    let token = {
      refreshToken: this.refreshToken,
      refreshTokenExpiresAt: this.refreshTokenExpiresAt,
      scope: this.scope || [],
      client: <any>this.application,
      user: <any>(this.user ? this.user : this.application),
      keep: this.keep,
      createdAt: this.createdAt,
    };
    token.scope.push(token.client.id == token.user.id ? "application" : "user");
    token.scope.push("default");
    return token;
  }

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(OAuth2Token, {
      schemaOptions: {
        collection: "oauth2.tokens",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            let token = {
              accessToken: ret.accessToken,
              accessTokenExpiresAt: ret.accessTokenExpiresAt,
              refreshToken: ret.refreshToken,
              refreshTokenExpiresAt: ret.refreshTokenExpiresAt,
              scope: ret.scope || [],
              client: ret.application,
              user: ret.user ? ret.user : ret.application,
              keep: ret.keep,
              createdAt: ret.createdAt,
            };
            token.scope.push(
              token.client.id == token.user.id ? "application" : "user"
            );
            token.scope.push("default");
            return token;
          },
        },
      },
      options: { automaticName: false },
    });
  }
}

export type OAuth2TokenDocument = DocumentType<OAuth2Token>;
export const OAuth2TokenModel: mongoose.Model<OAuth2TokenDocument> =
  OAuth2Token.shared;
