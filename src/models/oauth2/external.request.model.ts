/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EXTERNAL_AUTH_TYPE } from "../../constants/oauth2.enum";
import { BaseModel } from "@ecualead/server";
import { prop, Ref, index, getModelForClass, DocumentType } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Account } from "../account/account.model";
import { Application } from "../application/application.model";

export class ExternalAuthSettings {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, enum: EXTERNAL_AUTH_TYPE })
  type!: EXTERNAL_AUTH_TYPE;

  @prop({ required: true })
  clientId!: string;

  @prop({ required: true })
  clientSecret!: string;

  @prop()
  scope?: string;

  @prop({ type: String })
  profile?: string[];

  @prop({ type: String })
  redirect?: string[];
}

@index({ application: 1 })
@index({ user: 1 })
export class ExternalRequest extends BaseModel {
  @prop({ required: true })
  token!: string;

  @prop({ required: true, ref: Application })
  application!: Ref<Application>;

  @prop({ ref: Account })
  account?: Ref<Account>;

  @prop({ required: true })
  redirect!: string;

  @prop()
  referral?: string;

  @prop()
  type?: number;

  @prop({ required: true })
  settings!: ExternalAuthSettings;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(ExternalRequest, {
      schemaOptions: {
        collection: "oauth2.external-requests",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              token: ret.token,
              type: ret.type,
              application: ret.application,
              user: ret.user,
              redirect: ret.redirect,
              referral: ret.referral,
              settings: ret.settings,
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

export type ExternalRequestDocument = DocumentType<ExternalRequest>;
export const ExternalRequestModel: mongoose.Model<ExternalRequestDocument> = ExternalRequest.shared;
