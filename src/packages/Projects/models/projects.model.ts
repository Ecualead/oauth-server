/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Objects } from "@ikoabo/core";
import { BaseModel } from "@ikoabo/server";
import { prop, mongoose, index, DocumentType, getModelForClass, Ref } from "@typegoose/typegoose";
import { Domain } from "@/Domains/models/domains.model";
import { Module } from "@/Modules/models/modules.model";
import { ProjectLink } from "@/Projects/models/projects.links.model";
import { ProjectSetting } from "@/Projects/models/projects.settings.model";

@index({ domain: 1 })
@index({ canonical: 1 }, { unique: true })
@index({ name: 1 })
@index({ canonical: 1, "settings.socialNetworks.type": 1 }, { unique: true })
@index({ canonical: 1, "settings.socialNetworks.clientId": 1 }, { unique: true })
@index({ canonical: 1, "settings.notifications.type": 1 }, { unique: true })
export class Project extends BaseModel {
  @prop({ required: true, ref: Domain })
  domain?: Ref<Domain>;

  @prop({ required: true, unique: true })
  canonical?: string;

  @prop({ required: true })
  name!: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop()
  links?: ProjectLink;

  @prop({ type: String })
  scope?: string[];

  @prop()
  settings?: ProjectSetting;

  @prop({ type: mongoose.Types.ObjectId, ref: Module })
  modules?: Ref<Module>[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Project, {
      schemaOptions: {
        collection: "projects",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              domain: ret.domain,
              name: ret.name,
              image: ret.image,
              description: ret.description,
              canonical: ret.canonical,
              links: {
                app: Objects.get(ret, "links.app"),
                web: Objects.get(ret, "links.web"),
                facebook: Objects.get(ret, "links.facebook"),
                twitter: Objects.get(ret, "links.twitter"),
                instagram: Objects.get(ret, "links.instagram"),
                youtube: Objects.get(ret, "links.youtube"),
                privacy: Objects.get(ret, "links.privacy"),
                terms: Objects.get(ret, "links.terms")
              },
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

export type ProjectDocument = DocumentType<Project>;
export const ProjectModel: mongoose.Model<ProjectDocument> = Project.shared;
