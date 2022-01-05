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
import { Token as OAuth2Token, RefreshToken } from "oauth2-server";
import { Account } from "../../models/account/account.model";
import { Application } from "../../models/application/application.model";
import { OAUTH2_TOKEN_TYPE } from "@ecualead/auth";

function fillTokenTypeScope(token: any, scope: string[]): string[] {
  /* Check for invalid token */
  if (!token || !token.client || !token.user) {
    return [];
  }

  /* Check for valid scope array */
  if (!scope) {
    scope = [];
  }
  scope.push("default");

  /* Check if the token belongs to user or application */
  if (token.client?.id === token.user?.id) {
    scope.push("application");
    scope.push("non_user");
  } else {
    scope.push("user");
  }

  /* Check for external auth token */
  if (token?.type === OAUTH2_TOKEN_TYPE.EXTERNAL_AUTH) {
    scope.push("external_auth");
  }

  return scope;
}

@index({ accessToken: 1 })
@index({ accessTokenExpiresAt: 1 })
@index({ refreshToken: 1 })
@index({ refreshTokenExpiresAt: 1 })
@index({ application: 1 })
@index({ user: 1 })
export class Token extends BaseModel {
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

  @prop({ enum: OAUTH2_TOKEN_TYPE, required: true, default: OAUTH2_TOKEN_TYPE.UNKNOWN })
  type?: OAUTH2_TOKEN_TYPE;

  /**
   * Convert the document into Access Token
   */
  public toToken(): OAuth2Token {
    const token = {
      accessToken: this.accessToken,
      accessTokenExpiresAt: this.accessTokenExpiresAt,
      refreshToken: this.refreshToken,
      refreshTokenExpiresAt: this.refreshTokenExpiresAt,
      scope: this.scope || [],
      client: <any>this.application,
      user: <any>(this.user ? this.user : this.application),
      type: this.type,
      keep: this.keep,
      username: this.username,
      createdAt: this.createdAt
    };

    token.scope = fillTokenTypeScope(token, token.scope);
    return token;
  }

  /**
   * Convert the document into Refresh Token
   */
  public toRefreshToken(): RefreshToken {
    const token = {
      refreshToken: this.refreshToken,
      refreshTokenExpiresAt: this.refreshTokenExpiresAt,
      scope: this.scope || [],
      client: <any>this.application,
      user: <any>(this.user ? this.user : this.application),
      type: this.type,
      keep: this.keep,
      username: this.username,
      createdAt: this.createdAt
    };

    token.scope = fillTokenTypeScope(token, token.scope);
    return token;
  }

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Token, {
      schemaOptions: {
        collection: "oauth2.tokens",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            const token = {
              accessToken: ret.accessToken,
              accessTokenExpiresAt: ret.accessTokenExpiresAt,
              refreshToken: ret.refreshToken,
              refreshTokenExpiresAt: ret.refreshTokenExpiresAt,
              scope: ret.scope || [],
              client: ret.application,
              user: ret.user ? ret.user : ret.application,
              type: ret.type,
              keep: ret.keep,
              username: ret.username,
              createdAt: ret.createdAt
            };

            token.scope = fillTokenTypeScope(token, token.scope);
            return token;
          }
        }
      },
      options: { automaticName: false }
    });
  }
}

export type TokenDocument = DocumentType<Token>;
export const TokenModel: mongoose.Model<TokenDocument> = Token.shared;
