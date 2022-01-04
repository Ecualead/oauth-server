/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ikoabo/server";
import { prop, index, getModelForClass, DocumentType, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { EMAIL_STATUS } from "@/constants/account.enum";
import { Account } from "@/models/account/account.model";
import { AccountToken } from "@/models/account/email.model";

@index({ account: 1 })
@index({ phone: 1 })
@index({ phone: 1, account: 1 }, { unique: true })
export class AccountPhone extends BaseModel {
  @prop({ ref: Account })
  account?: Ref<Account>;

  @prop()
  description?: string;

  @prop({ required: true })
  phone!: string;

  @prop({ enum: EMAIL_STATUS, required: true, default: EMAIL_STATUS.REGISTERED })
  status!: EMAIL_STATUS;

  @prop()
  token?: AccountToken;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountPhone, {
      schemaOptions: {
        collection: "accounts.phones",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
              description: ret.description,
              phone: ret.phone,
              status: ret.status,
              createdAt: ret.createdAt,
              updatedAt: ret.updatedAt
            };
          }
        }
      },
      options: { automaticName: false }
    });
  }
}

export type AccountPhoneDocument = DocumentType<AccountPhone>;
export const AccountPhoneModel: mongoose.Model<AccountPhoneDocument> = AccountPhone.shared;
