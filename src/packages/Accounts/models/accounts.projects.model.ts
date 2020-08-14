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
import {
  prop,
  index,
  Ref,
  getModelForClass,
  DocumentType,
} from "@typegoose/typegoose";
import { Project } from "@/Projects/models/projects.model";
import { SocialNetworkCredential } from "@/SocialNetworks/models/social.networks.model";
import { Account } from "@/Accounts/models/accounts.model";

@index({ account: 1 })
@index({ project: 1 })
@index({ account: 1, project: 1 }, { unique: true })
export class AccountProjectProfile extends BaseModel {
  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Account })
  account!: Ref<Account>;

  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Project })
  project: Ref<Project>;

  @prop({ type: String })
  scope?: string[];

  @prop({ type: SocialNetworkCredential })
  social?: SocialNetworkCredential[];

  @prop()
  referral?: string;

  @prop({ default: 0 })
  type?: number;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountProjectProfile, {
      schemaOptions: {
        collection: "accounts.projects",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
              project: ret.project,
              scope: ret.scope,
              social: ret.social,
              type: ret.type,
              status: ret.status,
              createdAt: ret.createdAt,
              updatedAt: ret.updatedAt,
            };
          },
        },
      },
      options: { automaticName: false },
    });
  }
}

export type AccountProjectProfileDocument = DocumentType<AccountProjectProfile>;
export const AccountProjectProfileModel: mongoose.Model<AccountProjectProfileDocument> =
  AccountProjectProfile.shared;
