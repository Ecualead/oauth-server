import { prop, arrayProp, modelOptions, getModelForClass, DocumentType } from '@typegoose/typegoose';
import mongoose from 'mongoose';

export enum MODULES_STATUS {
  MS_UNKNOWN = 0,
  MS_ENABLED = 1,
  MS_DISABLED = 2,
}

@modelOptions({ schemaOptions: { collection: 'modules', timestamps: true }, options: { automaticName: false } })
export class Module {
  @prop({ required: true })
  name!: string;

  @prop()
  description?: string;

  @arrayProp({ items: String })
  scope?: string[];

  @prop()
  url?: string;

  @prop()
  terms?: string;

  @prop({ required: true })
  secret?: string;

  @prop({ required: true, default: MODULES_STATUS.MS_ENABLED })
  status?: number;

  @prop({ type: mongoose.Types.ObjectId, ref: 'accounts.users', required: true })
  owner?: string;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Module);
  }
}

export type ModuleDocument = DocumentType<Module>;
export const ModuleModel: mongoose.Model<ModuleDocument> = Module.shared;
