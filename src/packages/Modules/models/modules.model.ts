/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import {
  prop,
  getModelForClass,
  DocumentType,
  index,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { BaseModel } from "@ikoabo/core_srv";
import { Client } from "oauth2-server";
import { PROJECT_LIFETIME_TYPES } from "@/Projects/models/projects.enum";
import { OAUTH2_TOKEN_TYPE } from "@/OAuth2/models/oauth2.enum";

@index({ name: 1 }, { unique: true })
@index({ secret: 1 })
export class Module extends BaseModel {
  @prop({ required: true, unique: true })
  name!: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({ type: String })
  scope?: string[];

  @prop()
  url?: string;

  @prop()
  terms?: string;

  @prop({ required: true })
  secret?: string;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Module, {
      schemaOptions: {
        collection: "modules",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              name: ret.name,
              image: ret.image,
              description: ret.description,
              url: ret.url,
              terms: ret.terms,
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

  public toClient?(): Client {
    const obj: any = this;
    let client = {
      id: obj.id,
      type: OAUTH2_TOKEN_TYPE.TT_MODULE,
      grants: ["client_credentials"],
      accessTokenLifetime: PROJECT_LIFETIME_TYPES.LT_INFINITE,
      refreshTokenLifetime: PROJECT_LIFETIME_TYPES.LT_INFINITE,
      scope: obj.scope,
    };
    return client;
  }
}

export type ModuleDocument = DocumentType<Module>;
export const ModuleModel: mongoose.Model<ModuleDocument> = Module.shared;
