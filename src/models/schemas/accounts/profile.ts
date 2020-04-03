/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: profile.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-02T23:59:49-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';

/**
 * Account profile per application interface
 */
export interface IAccountProfile {
  uid: string;
  app: string;
  [field: string]: any;
}

/**
 * Account profile per application document
 */
export type DAccountProfile = mongoose.Document & IAccountProfile;

/**
 * Account profile per application schema
 */
const SAccountProfile = new mongoose.Schema({
  uid: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts.user', required: true }
}, { timestamps: true, discriminatorKey: 'app' });
SAccountProfile.index({ uid: 1, app: 1 }, { unique: true });

/**
 * Account profile per application model
 */
export const MAccountProfile = mongoose.model<DAccountProfile>('accounts.profile', SAccountProfile);
