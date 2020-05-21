/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: application.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-30T01:39:17-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { Arrays, Token } from '@ikoabo/core_srv';
import { Client } from 'oauth2-server';
import { IApplicationRestrictIp, SApplicationRestrictIp, DApplicationRestrictIp } from '@/models/schemas/applications/restrict_ip';
import { DProject } from '@/models/schemas/projects/project';
import { LIFETIME_TYPES, APPLICATION_STATUS } from '@/models/types/state';
import { APPLICATION_TYPES, APPLICATION_RECOVER_TYPE } from '@/models/types/application';

/**
 * Application interface
 */
export interface IApplication {
  id?: string;
  name: string;
  description?: string;
  type: number;
  project?: string | DProject;
  secret?: string;
  domain?: string;
  owner?: string;
  authTypes?: string[];
  settings?: {
    lifetime?: {
      accessToken?: number;
      refreshToken?: number;
    };
    recover?: number;
    restrictIps?: IApplicationRestrictIp[] | DApplicationRestrictIp;
  };
  scope?: string[];
  status?: number;
  createdAt?: Date;
}

/**
 * Application document
 */
export type DApplication = mongoose.Document & IApplication & {
  toClient: () => Client;
  getBase64Secret: () => string;
};

/**
 * Application mongoose schema
 */
const SApplication = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: Number, required: true, default: APPLICATION_TYPES.APP_UNKNOWN },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'project', required: true },
  secret: { type: String, required: true },
  domain: { type: String, required: true, default: 'default' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'accounts.user' },
  authTypes: [String],
  settings: {
    lifetime: {
      accessToken: { type: Number, required: true, default: LIFETIME_TYPES.LT_ONE_MONTH },
      refreshToken: { type: Number, required: true, default: LIFETIME_TYPES.LT_ONE_YEAR },
    },
    recover: { type: Number, required: true, default: APPLICATION_RECOVER_TYPE.APP_RT_DISABLED },
    restrictIps: [SApplicationRestrictIp],
  },
  scope: [String],
  status: { type: Number, required: true, default: APPLICATION_STATUS.AS_ENABLED },
}, { timestamps: true });
SApplication.index({ project: 1 });

/**
 * Auto generate application secret on application creation
 */
SApplication.pre('save', function save(next) {
  const app: DApplication = <DApplication>this;
  if (app.isNew) {
    app.secret = Token.longToken
  }
  app.scope = Arrays.force(app.scope);
  next();
});

/**
 * Ensure that `scope` is always an array
 */
SApplication.pre('findOneAndUpdate', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope);
  next();
});

/**
 * Convert application credentials to base64 string
 */
SApplication.methods.getBase64Secret = function(): string {
  return Buffer.from([this.id, this.secret].join(':')).toString('base64');
};

/**
 * Convert application to OAuth client
 */
SApplication.methods.toClient = function(): Client {
  let client = {
    id: this.id,
    redirectUris: this.redirectUri,
    grants: this.authTypes,
    accessTokenLifetime: this.settings.lifetime.accessToken,
    refreshTokenLifetime: this.settings.lifetime.refreshToken,
    scope: this.scope,
    project: this.project,
  };
  return client;
};

/**
 * Application mongoose model
 */
export const MApplication: mongoose.Model<DApplication> = mongoose.model<DApplication>('application', SApplication);
