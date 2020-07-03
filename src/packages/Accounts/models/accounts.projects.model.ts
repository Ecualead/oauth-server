import mongoose from "mongoose";
import { Arrays, BaseModel } from "@ikoabo/core_srv";
import {
  prop,
  pre,
  index,
  getModelForClass,
  DocumentType,
  modelOptions,
} from "@typegoose/typegoose";
import { Project, ProjectDocument } from "@/Projects/models/projects.model";
import { AccountSocialCredential } from "@/Accounts/models/accounts.social.model";
import { Account, AccountDocument } from "@/Accounts/models/accounts.model";

@modelOptions({
  schemaOptions: {
    collection: "accountsProjects",
    timestamps: true,
    discriminatorKey: "project",
  },
  options: { automaticName: false },
})
@index({ account: 1 })
@index({ project: 1 })
@index({ account: 1, project: 1 }, { unique: true })
@pre<AccountProjectProfile>("save", function (next) {
  let obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
@pre<AccountProjectProfile>("findOneAndUpdate", function (next) {
  let obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
export class AccountProjectProfile extends BaseModel {
  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Account })
  account!: string | AccountDocument;

  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Project })
  project: string | ProjectDocument;

  @prop()
  scope?: string[];

  @prop()
  social?: AccountSocialCredential[];

  @prop({type: Object})
  profile?: {
    [key: string]: any;
  };

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountProjectProfile);
  }
}

export type AccountProjectProfileDocument = DocumentType<AccountProjectProfile>;
export const AccountProjectProfileModel: mongoose.Model<AccountProjectProfileDocument> =
  AccountProjectProfile.shared;
