/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: application.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T03:49:28-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { Arrays } from '@ikoabo/core_srv';
import { ISocialCredential, DSocialCredential, SSocialCredential } from '@/models/schemas/accounts/social';
import { ACCOUNT_STATUS } from '@/models/types/account';

/**
 * User account project interface
 */
export interface IAccountProject {
  id?: string;
  account: string;
  project: string;
  scope?: string[];
  social?: ISocialCredential[] | DSocialCredential[];
  status?: number;
  profile?: {
    [key: string]: any;
  }
}

/**
 * User account project document
 */
export type DAccountProject = mongoose.Document & IAccountProject;

/**
 * User account project schema
 */
export const SAccountProject = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts.user' },
  scope: [String],
  social: [SSocialCredential],
  profile: {},
  status: { type: Number, required: true, default: ACCOUNT_STATUS.AS_UNKNOWN },
}, { timestamps: true, discriminatorKey: 'project' });
SAccountProject.index({ project: 1, account: 1 }, { unique: true });
SAccountProject.index({ status: 1 });

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
