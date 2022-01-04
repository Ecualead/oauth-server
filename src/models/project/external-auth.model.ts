/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ecualead/server";
import { prop, getModelForClass, DocumentType, index, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Project } from "@/models/project/project.model";
import { EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";

/**
 * Project external auth data model
 */
@index({ project: 1 })
@index({ name: 1 })
@index({ type: 1 })
@index({ project: 1, name: 1 }, { unique: true })
@index({ project: 1, clientId: 1, clientSecret: 1 }, { unique: true })
export class ProjectExternalAuth extends BaseModel {
  @prop({ required: true, ref: Project })
  project?: Ref<Project>;

  @prop({ required: true })
  name!: string;

  @prop()
  description?: string;

  @prop({ enum: EXTERNAL_AUTH_TYPE, required: true, default: EXTERNAL_AUTH_TYPE.UNKNOWN })
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

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(ProjectExternalAuth, {
      schemaOptions: {
        collection: "projects.externalAuth",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              project: ret.project,
              name: ret.name,
              description: ret.description,
              status: ret.status
            };
          }
        }
      },
      options: { automaticName: false }
    });
  }
}

export type ProjectExternalAuthDocument = DocumentType<ProjectExternalAuth>;
export const ProjectExternalAuthModel: mongoose.Model<ProjectExternalAuthDocument> =
  ProjectExternalAuth.shared;
