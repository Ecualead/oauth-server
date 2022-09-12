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
import { VALIDATION_STATUS } from "../../constants/oauth2.enum";
import { Account } from "./account.model";
import { ValidationToken } from "./validation.token.model";

@index({ account: 1 })
@index({ phone: 1 }, { unique: true })
export class Phone extends BaseModel {
  @prop({ ref: Account })
  account?: Ref<Account>;

  @prop({ required: true })
  phone!: string;

  @prop({ enum: VALIDATION_STATUS, required: true, default: VALIDATION_STATUS.REGISTERED })
  status!: VALIDATION_STATUS;

  @prop({ required: true })
  validation!: ValidationToken;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Phone, {
      schemaOptions: {
        collection: "oauth2.accounts.phones",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
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

export type PhoneDocument = DocumentType<Phone>;
export const PhoneModel: mongoose.Model<PhoneDocument> = Phone.shared;
