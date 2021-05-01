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
import { APPLICATION_TYPE } from "@/constants/application.enum";
import { LIFETIME_TYPE } from "@/constants/project.enum";
import { Objects } from "@ikoabo/core";
import { BaseModel } from "@ikoabo/server";
import { getModelForClass, prop, pre, DocumentType, index, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Client } from "oauth2-server";
import { Project } from "@/models/project/project.model";

@index({ project: 1 })
@index({ type: 1 })
@index({ project: 1, canonical: 1 }, { unique: true })
export class Application extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, unique: true })
  canonical?: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({ enum: APPLICATION_TYPE, required: true, default: APPLICATION_TYPE.UNKNOWN })
  type?: APPLICATION_TYPE;

  @prop({ required: true, ref: Project })
  project?: Ref<Project>;

  @prop({ required: true })
  secret?: string;

  @prop({ required: true, default: "default" })
  domain?: string;

  @prop({ type: String })
  grants?: string[];

  @prop({ type: String })
  scope?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Application, {
      schemaOptions: {
        collection: "applications",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              project: ret.project,
              name: ret.name,
              image: ret.image,
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
        this.type === APPLICATION_TYPE.SERVICE
          ? -1
          : Objects.get(this, "project.settings.tokenLifetime.accessToken", LIFETIME_TYPE.MONTH),
      refreshTokenLifetime: Objects.get(
        this,
        "project.settings.tokenLifetime.refreshToken",
        LIFETIME_TYPE.YEAR
      ),
      scope: this.scope,
      project: this.project
    };
    return client;
  }
}

export type ApplicationDocument = DocumentType<Application>;
export const ApplicationModel: mongoose.Model<ApplicationDocument> = Application.shared;
