/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: domain.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T17:39:08-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import mongoose from 'mongoose';
import { Arrays } from '@ikoabo/core_srv';
import { DOMAIN_STATUS } from '../types/state';
import { SCP_DOMAIN_DEFAULT, SCP_PREVENT } from '../types/scope';

/**
 * Domain interface
 */
export interface IDomain {
  id?: string;
  name: string;
  description?: string;
  owner?: string;
  scope?: string | string[];
  status?: number;
  createdAt?: Date;
}

/**
 * Domain document
 */
export type DDomain = mongoose.Document & IDomain;

/**
 * Domain mongoose schema
 */
const SDomain = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts.user' },
  scope: [String],
  status: { type: Number, required: true, default: DOMAIN_STATUS.DS_ENABLED }
}, { timestamps: true });
SDomain.index({ name: 1 });
SDomain.index({ owner: 1 });

/**
 * Ensure that `scope` is always an array
 */
SDomain.pre('save', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope, SCP_DOMAIN_DEFAULT, SCP_PREVENT);
  next();
});
SDomain.pre('findOneAndUpdate', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope, SCP_DOMAIN_DEFAULT, SCP_PREVENT);
  next();
});

/**
 * Domain mongoose model
 */
export const MDomain: mongoose.Model<DDomain> = mongoose.model<DDomain>('domain', SDomain);
