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
import { VALIDATION_STATUS } from "../../constants/account.enum";
import { Account } from "./account.model";
import { ValidationToken } from "./validation.token.model";

@index({ account: 1 })
@index({ email: 1 })
@index({ email: 1, account: 1 }, { unique: true })
export class Email extends BaseModel {
  @prop({ ref: Account })
  account?: Ref<Account>;

  @prop({ required: true })
  email!: string;

  @prop({ enum: VALIDATION_STATUS, required: true, default: VALIDATION_STATUS.REGISTERED })
  status!: VALIDATION_STATUS;

  @prop({ required: true })
  validation!: ValidationToken;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Email, {
      schemaOptions: {
        collection: "oauth2.accounts.emails",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
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

export type EmailDocument = DocumentType<Email>;
export const EmailModel: mongoose.Model<EmailDocument> = Email.shared;
