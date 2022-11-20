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
import { prop, Ref, index, getModelForClass, DocumentType } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Account } from "../account/account";
import { Application } from "../application/application";

@index({ application: 1 })
@index({ user: 1 })
export class ExternalRequest extends BaseModel {
  @prop({ required: true })
  external!: string;

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

  @prop()
  parent?: string;

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
              external: ret.external,
              token: ret.token,
              type: ret.type,
              application: ret.application,
              account: ret.account,
              redirect: ret.redirect,
              referral: ret.referral,
              parent: ret.parent
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
