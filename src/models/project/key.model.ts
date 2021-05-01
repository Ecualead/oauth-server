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
import { prop, getModelForClass, DocumentType, index, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Project } from "@/models/project/project.model";

@index({ project: 1 })
@index({ key: 1 })
@index({ name: 1 })
@index({ project: 1, name: 1 }, { unique: true })
export class ProjectKey extends BaseModel {
  @prop({ required: true, ref: Project })
  project?: Ref<Project>;

  @prop({ required: true })
  name!: string;

  @prop({ required: true, unique: true })
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
              key: ret.key,
              description: ret.description,
              scope: ret.scope,
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
