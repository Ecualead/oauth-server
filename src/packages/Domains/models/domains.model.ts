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
import { BaseModel } from "@ikoabo/server";
import { Ref, prop, getModelForClass, DocumentType, index } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Module } from "@/Modules/models/modules.model";

@index({ canonical: 1 }, { unique: true })
export class Domain extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, unique: true })
  canonical?: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({ type: String })
  scope?: string[];

  @prop({ type: mongoose.Types.ObjectId, ref: Module })
  modules?: Ref<Module>[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Domain, {
      schemaOptions: {
        collection: "domains",
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

export type DomainDocument = DocumentType<Domain>;
export const DomainModel: mongoose.Model<DomainDocument> = Domain.shared;
