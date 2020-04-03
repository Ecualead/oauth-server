/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: token.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:00:19-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { Arrays } from '@ikoabo/core_srv';
import { Client, User, Token, RefreshToken } from 'oauth2-server';
import { DAccount } from '../accounts/account';
import { DApplication } from '../applications/application';

/**
 * Token interface
 */
export interface IToken {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  scope: string[];
  application: string | Client | DApplication;
  user: string | User | Client | DAccount;
  keep: boolean;
  createdAt: Date;
}

/**
 * Token data model
 */
export type DToken = mongoose.Document & IToken & {
  toToken: () => Token;
  toRefreshToken: () => RefreshToken;
}

/**
 * Token schema
 */
const SToken = new mongoose.Schema({
  accessToken: { type: String, required: true },
  accessTokenExpiresAt: Date,
  refreshToken: String,
  refreshTokenExpiresAt: Date,
  scope: [String],
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'application', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'account', required: true },
  keep: { type: Boolean, required: true, default: false },
}, { timestamps: true });
SToken.index({ accessToken: 1 });
SToken.index({ accessTokenExpiresAt: 1 });
SToken.index({ refreshToken: 1 });
SToken.index({ refreshTokenExpiresAt: 1 });
SToken.index({ application: 1 });
SToken.index({ user: 1 });

/**
 * Convert the document into Access Token
 */
SToken.methods.toToken = function(): Token {
  let token = {
    accessToken: this.accessToken,
    accessTokenExpiresAt: this.accessTokenExpiresAt,
    refreshToken: this.refreshToken,
    refreshTokenExpiresAt: this.refreshTokenExpiresAt,
    scope: this.scope || [],
    client: this.application,
    user: this.user ? this.user : this.application,
    keep: this.keep,
    createdAt: this.createdAt
  };
  token.scope.push(token.client.id == token.user.id ? 'application' : 'user');
  token.scope.push('default');
  return token;
};

/**
 * Convert the document into Refresh Token
 */
SToken.methods.toRefreshToken = function(): RefreshToken {
  let token = {
    refreshToken: this.refreshToken,
    refreshTokenExpiresAt: this.refreshTokenExpiresAt,
    scope: this.scope || [],
    client: this.application,
    user: this.user,
    keep: this.keep,
    createdAt: this.createdAt,
  };
  token.scope.push(token.client.id == token.user.id ? 'application' : 'user');
  token.scope.push('default');
  return token;
};

/**
 * Ensure that `scope` is always an array
 */
SToken.pre('save', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope);
  next();
});
SToken.pre('findOneAndUpdate', function save(next) {
  const value: any = <any>this;
  value.scope = Arrays.force(value.scope);
  next();
});

export const MToken: mongoose.Model<DToken> = mongoose.model<DToken>('token', SToken);
