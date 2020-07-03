import mongoose from "mongoose";
import { Arrays, BaseModel } from "@ikoabo/core_srv";
import { Token, RefreshToken } from "oauth2-server";
import {
  prop,
  index,
  pre,
  modelOptions,
  getModelForClass,
  DocumentType,
} from "@typegoose/typegoose";
import {
  Application,
  ApplicationDocument,
} from "@/packages/Applications/models/applications.model";
import {
  Account,
  AccountDocument,
} from "@/packages/Accounts/models/accounts.model";

@modelOptions({
  schemaOptions: { collection: "oauth2.tokens", timestamps: true },
  options: { automaticName: false },
})
@pre<OAuth2Token>("save", function (next) {
  const obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
@pre<OAuth2Token>("findOneAndUpdate", function (next) {
  const obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
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

  @prop()
  scope?: string[];

  @prop({ required: true, type: mongoose.Types.ObjectId, ref: Application })
  application?: string | ApplicationDocument;

  @prop({ type: mongoose.Types.ObjectId, ref: Account })
  user?: string | ApplicationDocument | AccountDocument;

  @prop({ required: true, default: false })
  keep?: boolean;

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
      keep: this.keep,
      createdAt: this.createdAt,
    };
    token.scope.push(token.client.id == token.user.id ? "application" : "user");
    token.scope.push("default");
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
    return getModelForClass(OAuth2Token);
  }
}

export type OAuth2TokenDocument = DocumentType<OAuth2Token>;
export const OAuth2TokenModel: mongoose.Model<OAuth2TokenDocument> =
  OAuth2Token.shared;
