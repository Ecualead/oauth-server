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
import { prop, index, Ref, getModelForClass, DocumentType, Severity } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Account } from "@/models/account/account.model";
import { EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";

@index({ account: 1 })
@index({ type: 1 })
@index({ externalId: 1 })
@index({ account: 1, type: 1, externalId: 1 }, { unique: true })
export class AccountExternalAuth extends BaseModel {
  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Account })
  account!: Ref<Account>;

  @prop({ required: true, enum: EXTERNAL_AUTH_TYPE, default: EXTERNAL_AUTH_TYPE.UNKNOWN })
  type!: EXTERNAL_AUTH_TYPE;

  @prop({ required: true })
  externalId!: string;

  @prop({ required: true })
  accessToken!: string;

  @prop()
  refreshToken?: string;

  @prop()
  profile?: any;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountExternalAuth, {
      schemaOptions: {
        collection: "accounts.externalAuth",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
              type: ret.type,
              externalId: ret.externalId,
              profile: ret.profile
            };
          }
        }
      },
      options: { automaticName: false, allowMixed: Severity.ALLOW }
    });
  }
}

export type AccountExternalAuthDocument = DocumentType<AccountExternalAuth>;
export const AccountExternalAuthModel: mongoose.Model<AccountExternalAuthDocument> =
  AccountExternalAuth.shared;
