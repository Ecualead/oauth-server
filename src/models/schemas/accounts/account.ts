/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: account.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-05-03T16:47:45-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { DFacebook, SFacebook, DGoogle, SGoogle, DTwitter, STwitter } from './social';
import { ACCOUNT_STATUS } from '@/models/types/account';

/**
 * User account interface
 */
export interface IAccount {
  id?: string;
  name?: string;
  code?: string;
  email: string;
  phone?: string;
  password: string;
  passwordExpires?: number;
  passwordUpdated?: number;
  confirmationExpires?: number;
  status?: number;
  resetToken?: {
    token?: string;
    attempts?: number;
    status?: number;
    expires?: number;
  };
  social?: {
    facebook?: DFacebook,
    google?: DGoogle,
    twitter?: DTwitter
  };
  createdAt?: Date;
}

/**
 * User account document
 */
export type DAccount = mongoose.Document & IAccount & {
  validPassword: (password: string, cb: (err: any, isMatch: boolean) => void) => void
};

/**
 * User account schema
 */
export const SAccount = new mongoose.Schema({
  name: String,
  code: String,
  email: String,
  phone: String,
  password: String,
  passwordExpires: Number,
  passwordUpdated: Number,
  confirmationExpires: Number,
  status: { type: Number, required: true, default: ACCOUNT_STATUS.AS_UNKNOWN },
  resetToken: {
    token: String,
    attempts: Number,
    status: { type: Number, default: 0 },
    expires: Number
  },
  social: {
    facebook: SFacebook,
    google: SGoogle,
    twitter: STwitter
  },
}, { timestamps: true });

/**
 * Password hash middleware.
 *
 * Generate new password hash if the password field was updated
 */
SAccount.pre('save', function save(next) {
  const user: DAccount = <DAccount>this;

  if (!this.isModified('password')) {
    return next();
  }

  /* Update the user crypt password */
  bcrypt.hash(user.password, 10, (err: mongoose.Error, hash) => {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});
SAccount.pre('findOneAndUpdate', function save(next) {
  if (!this.getUpdate().$set['password']) {
    next();
  }

  /* Update the user crypt password */
  bcrypt.hash(this.getUpdate().$set['password'], 10, (err: mongoose.Error, hash) => {
    if (err) {
      return next(err);
    }
    this.getUpdate().$set['password'] = hash;
    next();
  });
});

/**
 * Check if the password is correct
 *
 * @param {string} password  Password to validate
 * @param cb  Callback function
 */
SAccount.methods.validPassword = function(password: string, cb: (err: any, isMatch: boolean) => {}): void {
  if (!password || !('password' in this)) {
    cb(null, false);
  }
  bcrypt.compare(password, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

/**
 * User account model
 */
export const MAccount: mongoose.Model<DAccount> = mongoose.model<DAccount>('accounts.user', SAccount);
