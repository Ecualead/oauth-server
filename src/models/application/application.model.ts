/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { APPLICATION_TYPE } from "../../constants/oauth2.enum";
import { BaseModel } from "@ecualead/server";
import { getModelForClass, prop, DocumentType, index } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { LIFETIME_TYPE } from "@ecualead/auth";
import { Client } from "oauth2-server";
import { Settings } from "../../controllers/settings.controller";

@index({ type: 1 })
@index({ canonical: 1 }, { unique: true })
export class Application extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, unique: true })
  canonical: string;

  @prop()
  description?: string;

  @prop({ enum: APPLICATION_TYPE, required: true, default: APPLICATION_TYPE.UNKNOWN })
  type?: APPLICATION_TYPE;

  @prop({ required: true })
  secret?: string;

  @prop({ type: String })
  grants?: string[];

  @prop({ type: String })
  scope?: string[];

  @prop({ type: String })
  restrictions?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Application, {
      schemaOptions: {
        collection: "oauth2.applications",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              name: ret.name,
              description: ret.description,
              type: ret.type,
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

  public getBase64Secret?(): string {
    return Buffer.from([this._id.toString(), this.secret].join(":")).toString("base64");
  }

  public toClient?(): Client {
    const client = {
      id: this._id.toString(),
      type: this.type,
      grants: this.grants,
      accessTokenLifetime:
        this.type === APPLICATION_TYPE.SERVICE || this.type === APPLICATION_TYPE.MODULE
          ? LIFETIME_TYPE.INFINITE
          : Settings.shared.value?.tokenPolicy?.accessTokenTtl || LIFETIME_TYPE.MONTH,
      refreshTokenLifetime:
        Settings.shared.value?.tokenPolicy?.refreshTokenTtl || LIFETIME_TYPE.YEAR,
      scope: this.scope
    };
    return client;
  }
}

export type ApplicationDocument = DocumentType<Application>;
export const ApplicationModel: mongoose.Model<ApplicationDocument> = Application.shared;
