/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: social.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:00:38-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { SOCIAL_NETWORK_TYPES } from '@/models/types/social_network';

/**
 * Project social mapping fields to profile
 */
export interface IProjectSocialMapping {
  key?: string;
  fields?: string[];
}

/**
 * Project social network interface
 */
export interface IProjectSocial {
  id: string;
  type: number;
  ci: string;
  cs: string;
  scope?: string;
  profile?: string[];
  profileMap?: IProjectSocialMapping[];
}

/**
 * Project social network document
 */
export type DProjectSocial = mongoose.Document & IProjectSocial;

/**
 * Project social network schema
 */
export const SProjectSocial = new mongoose.Schema({
  type: { type: Number, required: true, default: SOCIAL_NETWORK_TYPES.SN_UNKNOWN },
  ci: { type: String, required: true },
  cs: { type: String, required: true },
  scope: { type: String, default: '' },
  profile: [String],
  profileMap: [{
    key: String,
    fields: [String]
  }]

}, { timestamps: true });
SProjectSocial.index({ ci: 1 });
SProjectSocial.index({ cs: 1 });
