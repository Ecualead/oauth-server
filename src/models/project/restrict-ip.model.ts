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

/**
 * Project IP address access restriction data model
 */
@index({ project: 1 })
@index({ ip: 1 })
@index({ project: 1, ip: 1 }, { unique: true })
export class ProjectRestrictIp extends BaseModel {
  @prop({ required: true, ref: Project })
  project?: Ref<Project>;

  @prop({ required: true })
  ip!: string;

  @prop()
  description?: string;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(ProjectRestrictIp, {
      schemaOptions: {
        collection: "projects.restrictIps",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              project: ret.project,
              ip: ret.ip,
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

export type ProjectRestrictIpDocument = DocumentType<ProjectRestrictIp>;
export const ProjectRestrictIpModel: mongoose.Model<ProjectRestrictIpDocument> =
  ProjectRestrictIp.shared;
