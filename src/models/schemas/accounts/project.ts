/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: application.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T05:32:35-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { Arrays } from '@ikoabo/core_srv';
import { ISocialCredential, DSocialCredential, SSocialCredential } from './social';
import { ACCOUNT_STATUS } from '../../types/account';

/**
 * User account project interface
 */
export interface IAccountProject {
  id?: string;
  project: string;
  profile?: string;
  scope?: string[];
  social?: ISocialCredential[] | DSocialCredential[];
  status?: number;
  [key: string]: any;
}

/**
 * User account project document
 */
export type DAccountProject = mongoose.Document & IAccountProject;

/**
 * User account project schema
 */
export const SAccountProject = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'project', required: true },
  uid: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts.user' },
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts.profile' },
  scope: [String],
  social: [SSocialCredential],
  status: { type: Number, default: ACCOUNT_STATUS.AS_UNKNOWN },
}, { timestamps: true });
SAccountProject.index({ app: 1, uid: 1 }, { unique: true });
SAccountProject.index({ profile: 1 });

/**
 * Ensure that `scope` is always an array
 */
SAccountProject.pre('save', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope);
  next();
});
SAccountProject.pre('findOneAndUpdate', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope);
  next();
});

/**
 * User account project model
 */
export const MAccountProject: mongoose.Model<DAccountProject> = mongoose.model<DAccountProject>('accounts.project', SAccountProject);