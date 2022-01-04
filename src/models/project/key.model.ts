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

/**
 * Project access key data model
 */
@index({ project: 1 })
@index({ key: 1 })
@index({ name: 1 })
@index({ project: 1, key: 1 }, { unique: true })
export class ProjectKey extends BaseModel {
  @prop({ required: true, ref: Project })
  project?: Ref<Project>;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  key!: string;

  @prop()
  description?: string;

  @prop({ type: String })
  scope?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(ProjectKey, {
      schemaOptions: {
        collection: "projects.keys",
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

export type ProjectKeyDocument = DocumentType<ProjectKey>;
export const ProjectKeyModel: mongoose.Model<ProjectKeyDocument> = ProjectKey.shared;
