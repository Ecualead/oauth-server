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
import {
  prop,
  Ref,
  index,
  getModelForClass,
  DocumentType,
} from "@typegoose/typegoose";
import { BaseModel } from "@ikoabo/core_srv";
import { Application } from "@/Applications/models/applications.model";
import { Account } from "@/Accounts/models/accounts.model";

@index({ application: 1 })
@index({ user: 1 })
export class AccountSocialRequest extends BaseModel {
  @prop({ required: true })
  token!: string;

  @prop({ required: true, ref: Application })
  application!: Ref<Application>;

  @prop({ ref: Account })
  user?: Ref<Account>;

  @prop({ required: true })
  redirect!: string;

  @prop()
  referral?: string;

  @prop({ required: true })
  social!: string;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountSocialRequest, {
      schemaOptions: {
        collection: "accounts.social.requests",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              token: ret.token,
              application: ret.application,
              user: ret.user,
              redirect: ret.redirect,
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

export type AccountSocialRequestDocument = DocumentType<AccountSocialRequest>;
export const AccountSocialRequestModel: mongoose.Model<AccountSocialRequestDocument> =
  AccountSocialRequest.shared;
