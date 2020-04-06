/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: project.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-02T23:54:00-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { IProjectSocial, DProjectSocial, SProjectSocial } from './social';
import { IApplicationRestrictIp, SApplicationRestrictIp, DApplicationRestrictIp } from '../applications/restrict_ip';
import { INotificationSettings, DNotificationSettings, SNotificationSettings } from './notification_settings';
import { IProjectProfileField, DProjectProfileField, SProjectProfileField, IProjectProfileFieldIndex, DProjectProfileFieldIndex, SProjectProfileFieldIndex } from './profile';
import { APPLICATION_RECOVER_TYPE } from '../../types/application';
import { LIFETIME_TYPES, EMAIL_CONFIRMATION, PROJECT_STATUS } from '../../types/state';

/**
 * Project interface
 */
export interface IProject {
  id?: string;
  domain?: string;
  name: string;
  description?: string;
  owner?: string;
  links?: {
    app?: string;
    web?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    privacy?: string;
    terms?: string;
  };
  social?: IProjectSocial[] | DProjectSocial[];
  scope?: string[];
  status?: number;
  settings?: {
    lifetime?: {
      accessToken?: number;
      refreshToken?: number;
    };
    recover: number;
    restrictIps: IApplicationRestrictIp[] | DApplicationRestrictIp[];
    emailConfirmation: {
      type: number;
      time: number;
    };
    passwordPolicy: {
      mLen: number;
      uCase: boolean;
      lCase: boolean;
      sChars: boolean;
      numbs: boolean;
    };
    notifications: INotificationSettings[] | DNotificationSettings[];
    profile?: {
      fields?: IProjectProfileField[] | DProjectProfileField[];
      indexes?: IProjectProfileFieldIndex[] | DProjectProfileFieldIndex[];
      unique?: IProjectProfileFieldIndex[] | DProjectProfileFieldIndex[];
    };
  };
  createdAt?: Date;
}

/**
 * Project document
 */
export type DProject = mongoose.Document & IProject;

/**
 * Project schema
 */
export const SProject = new mongoose.Schema({
  domain: { type: mongoose.Schema.Types.ObjectId, ref: 'domain', required: true },
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts.user' },
  links: {
    app: String,
    web: String,
    facebook: String,
    twitter: String,
    instagram: String,
    privacy: String,
    terms: String,
  },
  social: [SProjectSocial],
  scope: [String],
  status: { type: Number, required: true, default: PROJECT_STATUS.PS_ENABLED },
  settings: {
    lifetime: {
      accessToken: { type: Number, required: true, default: LIFETIME_TYPES.LT_ONE_MONTH },
      refreshToken: { type: Number, required: true, default: LIFETIME_TYPES.LT_ONE_YEAR },
    },
    recover: { type: Number, required: true, default: APPLICATION_RECOVER_TYPE.APP_RT_DISABLED },
    restrictIps: [SApplicationRestrictIp],
    emailConfirmation: {
      type: { type: Number, default: EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED },
      time: { type: Number, default: LIFETIME_TYPES.LT_ONE_WEEK }
    },
    passwordPolicy: {
      mLen: { type: Number, default: 5 },
      uCase: { type: Boolean, default: true },
      lCase: { type: Boolean, default: true },
      sChars: { type: Boolean, default: false },
      numbs: { type: Boolean, default: true },
    },
    notifications: [SNotificationSettings],
    profile: {
      fields: [SProjectProfileField],
      indexes: [SProjectProfileFieldIndex],
      unique: [SProjectProfileFieldIndex]
    },
  },
}, { timestamps: true });
SProject.index({ name: 1 });
SProject.index({ owner: 1 });

/**
 * Ensure that `scope` is always an array
 */
SProject.pre('save', function save(next) {
  //    this['scope'] = Arrays.forceArray(this['scope']);
  next();
});
SProject.pre('findOneAndUpdate', function save(next) {
  //    this['scope'] = Arrays.forceArray(this['scope']);
  next();
});

/**
 * Project model
 */
export const MProject: mongoose.Model<DProject> = mongoose.model<DProject>('project', SProject);
