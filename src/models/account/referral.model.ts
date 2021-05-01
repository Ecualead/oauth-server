/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ikoabo/server";
import { prop, index, Ref, getModelForClass, DocumentType } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Account } from "@/models/account/account.model";

@index({ account: 1 }, { unique: true })
export class AccountReferral extends BaseModel {
  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Account })
  account!: Ref<Account>;

  @prop({ type: String, default: [] })
  tree?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountReferral, {
      schemaOptions: {
        collection: "accounts.referrals",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
              tree: ret.tree
            };
          }
        }
      },
      options: { automaticName: false }
    });
  }
}

export type AccountReferralDocument = DocumentType<AccountReferral>;
export const AccountReferralModel: mongoose.Model<AccountReferralDocument> = AccountReferral.shared;
