/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ikoabo/server";
import { prop, getModelForClass, DocumentType, index } from "@typegoose/typegoose";
import mongoose from "mongoose";

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
              canonical: ret.canonical,
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
