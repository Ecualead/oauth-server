import {
  prop,
  getModelForClass,
  DocumentType
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { BaseModel } from "@ikoabo/core_srv";

export class Module extends BaseModel {
  @prop({ required: true })
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
}

export type ModuleDocument = DocumentType<Module>;
export const ModuleModel: mongoose.Model<ModuleDocument> = Module.shared;
