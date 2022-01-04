/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Objects } from "@ikoabo/core";
import { BaseModel } from "@ikoabo/server";
import { prop, index, getModelForClass, DocumentType, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Token, RefreshToken } from "oauth2-server";
import { Account } from "@/models/account/account.model";
import { Application } from "@/models/application/application.model";
import { OAUTH2_TOKEN_TYPE } from "@/constants/oauth2.enum";

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

  @prop({ enum: OAUTH2_TOKEN_TYPE, required: true, default: OAUTH2_TOKEN_TYPE.UNKNOWN })
  type?: OAUTH2_TOKEN_TYPE;

  /**
   * Convert the document into Access Token
   */
  public toToken(): Token {
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

    let applicationOwner, projectOwner, user: any;
    token.scope.push("default");
    switch (token.type) {
      case OAUTH2_TOKEN_TYPE.APPLICATION:
        token.scope.push("non_user");
        token.scope.push("application");
        break;
      case OAUTH2_TOKEN_TYPE.EXTERNAL_AUTH:
        token.scope.push("external_auth");
      // eslint-disable-next-line no-fallthrough
      case OAUTH2_TOKEN_TYPE.USER:
        /* Get application parameters */
        applicationOwner = Objects.get(token.client, "owner", "").toString();
        projectOwner = Objects.get(token.client, "project.owner", "").toString();
        user = Objects.get(token.user, "id", this.user).toString();

        /* Check if the user is the application owner */
        if (applicationOwner === user) {
          token.scope.push("application_owner");
        }

        /* Check if the user is the project owner */
        if (projectOwner === user) {
          token.scope.push("project_owner");
        }

        token.scope.push("user");
        break;
    }
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
      keep: this.keep,
      username: this.username,
      createdAt: this.createdAt
    };
    token.scope.push(token.client.id === token.user.id ? "application" : "user");
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
            const token = {
              accessToken: ret.accessToken,
              accessTokenExpiresAt: ret.accessTokenExpiresAt,
              refreshToken: ret.refreshToken,
              refreshTokenExpiresAt: ret.refreshTokenExpiresAt,
              scope: ret.scope || [],
              client: ret.application,
              user: ret.user ? ret.user : ret.application,
              keep: ret.keep,
              username: ret.username,
              createdAt: ret.createdAt
            };
            token.scope.push(token.client.id === token.user.id ? "application" : "user");
            token.scope.push("default");
            return token;
          }
        }
      },
      options: { automaticName: false }
    });
  }
}

export type OAuth2TokenDocument = DocumentType<OAuth2Token>;
export const OAuth2TokenModel: mongoose.Model<OAuth2TokenDocument> = OAuth2Token.shared;
