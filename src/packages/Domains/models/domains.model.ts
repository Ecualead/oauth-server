import {
  Ref,
  prop,
  getModelForClass,
  DocumentType,
  pre,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { BaseModel, Arrays } from "@ikoabo/core_srv";
import { Module } from "@/Modules/models/modules.model";

@pre<Domain>("save", function (next) {
  const obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
@pre<Domain>("findOneAndUpdate", function (next) {
  const obj: any = this;
  obj.scope = Arrays.force(obj.scope);
  next();
})
export class Domain extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({ type: String })
  scope?: string[];

  @prop({ ref: Module })
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
              updatedAt: ret.updatedAt,
            };
          },
        },
      },
      options: { automaticName: false },
    });
  }
}

export type DomainDocument = DocumentType<Domain>;
export const DomainModel: mongoose.Model<DomainDocument> = Domain.shared;
