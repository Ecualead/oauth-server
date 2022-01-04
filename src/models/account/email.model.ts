/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ecualead/server";
import { prop, index, getModelForClass, DocumentType, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { EMAIL_STATUS, TOKEN_STATUS } from "@/constants/account.enum";
import { Account } from "@/models/account/account.model";

@index({ token: 1 })
@index({ status: 1 })
@index({ expire: 1 })
export class AccountToken {
  @prop({ required: true })
  token!: string;

  @prop({ required: true, default: 0 })
  attempts?: number;

  @prop({ required: true, default: TOKEN_STATUS.DISABLED })
  status?: number;

  @prop({ required: true, default: 0 })
  expire?: number;
}

@index({ account: 1 })
@index({ email: 1 })
@index({ email: 1, account: 1 }, { unique: true })
export class AccountEmail extends BaseModel {
  @prop({ ref: Account })
  account?: Ref<Account>;

  @prop()
  description?: string;

  @prop({ required: true })
  email!: string;

  @prop({ enum: EMAIL_STATUS, required: true, default: EMAIL_STATUS.REGISTERED })
  status!: EMAIL_STATUS;

  @prop({ required: true })
  token!: AccountToken;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountEmail, {
      schemaOptions: {
        collection: "accounts.emails",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
              description: ret.description,
              email: ret.email,
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

export type AccountEmailDocument = DocumentType<AccountEmail>;
export const AccountEmailModel: mongoose.Model<AccountEmailDocument> = AccountEmail.shared;
