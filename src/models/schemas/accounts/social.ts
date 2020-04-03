/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: social.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:00:00-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { Profile as FacebookProfileFields } from 'passport-facebook';
import { Profile as GoogleProfileFields } from 'passport-google-oauth';
import { Profile as TwitterProfileFields } from 'passport-twitter';

/**
 * Account social network credential interface
 */
export interface ISocialCredential {
  id?: string;
  socialNetwork: string;
  socialId: string;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Account social network credential document
 */
export type DSocialCredential = mongoose.Document & ISocialCredential;

/**
 * Account social network credential schema
 */
export const SSocialCredential = new mongoose.Schema({
  socialNetwork: { type: String, required: true },
  socialId: String,
  accessToken: String,
  refreshToken: String
}, { timestamps: true });
SSocialCredential.index({ socialNetwork: 1 });
SSocialCredential.index({ socialId: 1 });

/**
 * Facebook document
 */
export type DFacebook = mongoose.Document & FacebookProfileFields;

/**
 * Google document
 */
export type DGoogle = mongoose.Document & GoogleProfileFields;

/**
 * Twitter document
 */
export type DTwitter = mongoose.Document & TwitterProfileFields;

/**
 * Facebook profile schema
 */
export const SFacebook = new mongoose.Schema({
  id: String,
  displayName: String,
  provider: String,
  username: String,
  name: {
    familyName: String,
    givenName: String,
    middleName: String
  },
  emails: [{
    value: String
  }],
  photos: [{
    value: String
  }],
  gender: String,
  ageRange: {
    min: Number,
    max: Number
  },
  profileUrl: String,
  birthday: String,
  _raw: String,
  _json: Object
}, { timestamps: true, id: false });

/**
 * Google profile schema
 */
export const SGoogle = new mongoose.Schema({
  id: String,
  displayName: String,
  provider: String,
  username: String,
  name: {
    familyName: String,
    givenName: String,
    middleName: String
  },
  emails: [{
    value: String,
  }],
  photos: [{
    value: String
  }],
  gender: String,
  _raw: String,
  _json: Object
}, { timestamps: true, id: false });

/**
 * Twitter profile schema
 */
export const STwitter = new mongoose.Schema({
  id: String,
  displayName: String,
  provider: String,
  username: String,
  name: {
    familyName: String,
    givenName: String,
    middleName: String
  },
  emails: [{
    value: String,
  }],
  photos: [{
    value: String
  }],
  gender: String,
  _raw: String,
  _json: Object,
  _accessLevel: String
}, { timestamps: true, id: false });
