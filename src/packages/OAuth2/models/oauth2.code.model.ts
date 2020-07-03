import mongoose from "mongoose";
import { Arrays, BaseModel } from "@ikoabo/core_srv";
import { AuthorizationCode, Client } from "oauth2-server";
import {
  prop,
  index,
  pre,
  modelOptions,
  getModelForClass,
  DocumentType,
} from "@typegoose/typegoose";
import { Account, AccountDocument } from "@/packages/Accounts/models/accounts.model";
import { Application, ApplicationDocument } from "@/packages/Applications/models/applications.model";

@modelOptions({
  schemaOptions: { collection: "oauth2.tokens", timestamps: true },
  options: { automaticName: false },
})
@pre<OAuth2Code>("save", function (next) {
  const obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
@pre<OAuth2Code>("findOneAndUpdate", function (next) {
  const obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
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

  @prop()
  scope: string[];

  @prop({ required: true, type: mongoose.Types.ObjectId, ref: Application })
  application: string | ApplicationDocument;

  @prop({ type: mongoose.Types.ObjectId, ref: Account })
  user?: string | ApplicationDocument | AccountDocument;

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
    return getModelForClass(OAuth2Code);
  }
}

export type OAuth2CodeDocument = DocumentType<OAuth2Code>;
export const OAuth2CodeModel: mongoose.Model<OAuth2CodeDocument> =
  OAuth2Code.shared;
