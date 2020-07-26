/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import mongoose from "mongoose";
import { Token, BaseModel, Objects } from "@ikoabo/core_srv";
import {
  getModelForClass,
  prop,
  pre,
  DocumentType,
  index,
  Ref,
} from "@typegoose/typegoose";
import { APPLICATION_TYPES } from "@/Applications/models/applications.enum";
import { Project } from "@/Projects/models/projects.model";
import { Client } from "oauth2-server";
import { PROJECT_LIFETIME_TYPES } from "@/Projects/models/projects.enum";
import { OAUTH2_TOKEN_TYPE } from "@/OAuth2/models/oauth2.enum";

@pre<Application>("save", function (next) {
  const obj: any = this;
  if (obj.isNew) {
    obj.secret = Token.longToken;
  }
  next();
})
@index({ project: 1 })
@index({ type: 1 })
@index({ canonical: 1 }, { unique: true })
export class Application extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, unique: true })
  canonical?: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({
    enum: APPLICATION_TYPES,
    required: true,
    default: APPLICATION_TYPES.APP_UNKNOWN,
  })
  type?: APPLICATION_TYPES;

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

  @prop({ type: String })
  restriction?: string[];

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
              updatedAt: ret.updatedAt,
            };
          },
        },
      },
      options: { automaticName: false },
    });
  }

  public getBase64Secret?(): string {
    return Buffer.from([(<any>this).id, this.secret].join(":")).toString(
      "base64"
    );
  }

  public toClient?(): Client {
    const obj: any = this;
    let client = {
      id: obj._id.toString(),
      type: this.type,
      grants: obj.grants,
      accessTokenLifetime:
        obj.type === APPLICATION_TYPES.APP_SERVICE
          ? -1
          : Objects.get(
              obj,
              "project.settings.tokenLifetime.accessToken",
              PROJECT_LIFETIME_TYPES.LT_ONE_MONTH
            ),
      refreshTokenLifetime: Objects.get(
        obj,
        "project.settings.tokenLifetime.refreshToken",
        PROJECT_LIFETIME_TYPES.LT_ONE_YEAR
      ),
      scope: obj.scope,
      project: obj.project,
      restriction: obj.restriction,
    };
    return client;
  }
}

export type ApplicationDocument = DocumentType<Application>;
export const ApplicationModel: mongoose.Model<ApplicationDocument> =
  Application.shared;
