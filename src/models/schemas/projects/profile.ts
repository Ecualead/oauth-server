/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: profile.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:00:29-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { PROFILE_FIELD_TYPES } from '../../types/profile';

/**
 * Project profile field interface
 */
export interface IProjectProfileField {
  name: string;
  description?: string;
  type: number;
  defaultValue?: string;
  required?: boolean;
}

/**
 * Project profile field index interface
 */
export interface IProjectProfileFieldIndex {
  fields: {
    name: string,
    order: number
  }[];
}

/**
 * Project profile field document
 */
export type DProjectProfileField = mongoose.Document & IProjectProfileField;

/**
 * Project profile field index document
 */
export type DProjectProfileFieldIndex = mongoose.Document & IProjectProfileFieldIndex;

/**
 * Project profile field definition
 */
export const SProjectProfileField = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  type: { type: Number, required: true, default: PROFILE_FIELD_TYPES.PF_STRING },
  defaultValue: { type: String },
  required: { type: Boolean, default: false }
});
SProjectProfileField.index({ name: 1 });

/**
 * IAM applications custom user profile field index schema
 * @type {module:mongoose.Schema}
 */
export const SProjectProfileFieldIndex = new mongoose.Schema({
  fields: [{
    name: String,
    order: { type: Number, default: 1 }
  }],
}, { timestamps: true });
