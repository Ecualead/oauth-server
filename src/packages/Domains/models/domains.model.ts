import { prop, arrayProp, modelOptions, getModelForClass, DocumentType } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { BaseModel } from '@ikoabo/core_srv';

@modelOptions({ schemaOptions: { collection: 'domains', timestamps: true }, options: { automaticName: false } })
export class Domain extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop()
  description?: string;

  @arrayProp({ items: String })
  scope?: string[];

  @arrayProp({ items: mongoose.Types.ObjectId, ref: 'modules' })
  modules?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Domain);
  }
}

export type DomainDocument = DocumentType<Domain>;
export const DomainModel: mongoose.Model<DomainDocument> = Domain.shared;
