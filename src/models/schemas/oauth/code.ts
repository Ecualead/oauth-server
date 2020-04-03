/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: code.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T04:59:16-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { Arrays } from '@ikoabo/core_srv';
import { AuthorizationCode, Client } from 'oauth2-server';

/**
 * Authorization code interface
 */
export interface ICode {
  code: string;
  expiresAt?: Date;
  redirectUri?: string;
  scope: string[];
  application: string | Client,
  user?: string;
}

/**
 * Authorization code document
 */
export type DCode = mongoose.Document & ICode & {
  toAuthCode: () => AuthorizationCode,
};

/**
 * Authorization code schema
 */
const SCode = new mongoose.Schema({
  code: { type: String, required: true },
  expiresAt: Date,
  redirectUri: String,
  scope: [String],
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'application', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'account' }
}, { timestamps: true });
SCode.index({ code: 1 });
SCode.index({ expiresAt: 1 });
SCode.index({ client: 1 });
SCode.index({ user: 1 });

/**
 * Convert the document into OAuth Authorization Code
 */
SCode.methods.toAuthCode = function(): AuthorizationCode {
  let authCode: AuthorizationCode = {
    authorizationCode: this.code,
    expiresAt: this.expiresAt,
    redirectUri: this.redirectUri,
    scope: this.scope || [],
    client: this.application,
    user: ((this.user) ? this.user.id : this.application.id),
  };
  (<string[]>authCode.scope).push(authCode.user === authCode.client ? 'application' : 'user');
  (<string[]>authCode.scope).push('default');
  return authCode;
};

/**
 * Ensure that `scope` is always an array
 */
SCode.pre('save', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope);
  next();
});
SCode.pre('findOneAndUpdate', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope);
  next();
});

export const MCode: mongoose.Model<DCode> = mongoose.model<DCode>('code', SCode);
