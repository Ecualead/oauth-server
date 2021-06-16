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
import { prop, Ref, index, getModelForClass, DocumentType } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Account } from "../account/account.model";
import { Application } from "../application/application.model";
import { ProjectExternalAuth } from "../project/external-auth.model";

@index({ application: 1 })
@index({ user: 1 })
export class ExternalAuthRequest extends BaseModel {
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

  @prop({ required: true, ref: ProjectExternalAuth })
  externalAuth!: Ref<ProjectExternalAuth>;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(ExternalAuthRequest, {
      schemaOptions: {
        collection: "oauth2.external-auth",
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
              referral: ret.referral,
              externalAuth: ret.externalAuth,
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

export type ExternalAuthRequestDocument = DocumentType<ExternalAuthRequest>;
export const ExternalAuthRequestModel: mongoose.Model<ExternalAuthRequestDocument> =
  ExternalAuthRequest.shared;
