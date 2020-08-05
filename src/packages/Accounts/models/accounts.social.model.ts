/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { prop, index } from "@typegoose/typegoose";
import { SOCIAL_NETWORK_TYPES } from "@/Projects/models/projects.enum";

@index({ type: 1 })
@index({ socialId: 1 })
@index({ accessToken: 1 })
@index({ refreshToken: 1 })
@index({ socialId: 1, accessToken: 1 })
export class AccountSocialCredential {
  @prop({ required: true, default: SOCIAL_NETWORK_TYPES.SN_UNKNOWN })
  type!: number;

  @prop({ required: true })
  socialId!: string;

  @prop({ required: true })
  accessToken!: string;

  @prop()
  refreshToken?: string;
}

export function socialNetworkToInt(social: string): SOCIAL_NETWORK_TYPES {
  social = social.toLowerCase();
  switch (social) {
    case "facebook":
      return SOCIAL_NETWORK_TYPES.SN_FACEBOOK;
    case "google":
      return SOCIAL_NETWORK_TYPES.SN_GOOGLE;
    case "instagram":
      return SOCIAL_NETWORK_TYPES.SN_INSTAGRAM;
    case "linkedin":
      return SOCIAL_NETWORK_TYPES.SN_LINKEDIN;
    case "twitter":
      return SOCIAL_NETWORK_TYPES.SN_TWITTER;
    case "yahoo":
      return SOCIAL_NETWORK_TYPES.SN_YAHOO;
  }
  return SOCIAL_NETWORK_TYPES.SN_UNKNOWN;
}

export function socialNetworkToStr(social: SOCIAL_NETWORK_TYPES): string {
  switch (social) {
    case SOCIAL_NETWORK_TYPES.SN_FACEBOOK:
      return "facebook";
    case SOCIAL_NETWORK_TYPES.SN_GOOGLE:
      return "google";
    case SOCIAL_NETWORK_TYPES.SN_INSTAGRAM:
      return "instagram";
    case SOCIAL_NETWORK_TYPES.SN_LINKEDIN:
      return "linkedin";
    case SOCIAL_NETWORK_TYPES.SN_TWITTER:
      return "twitter";
    case SOCIAL_NETWORK_TYPES.SN_YAHOO:
      return "yahoo";
  }
  return null;
}

/* 

export const SFacebook = new mongoose.Schema(
  {
    id: String,
    displayName: String,
    provider: String,
    username: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String,
    },
    emails: [
      {
        value: String,
      },
    ],
    photos: [
      {
        value: String,
      },
    ],
    gender: String,
    ageRange: {
      min: Number,
      max: Number,
    },
    profileUrl: String,
    birthday: String,
    _raw: String,
    _json: Object,
  },
  { timestamps: true, id: false }
);

export const SGoogle = new mongoose.Schema(
  {
    id: String,
    displayName: String,
    provider: String,
    username: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String,
    },
    emails: [
      {
        value: String,
      },
    ],
    photos: [
      {
        value: String,
      },
    ],
    gender: String,
    _raw: String,
    _json: Object,
  },
  { timestamps: true, id: false }
);


export const STwitter = new mongoose.Schema(
  {
    id: String,
    displayName: String,
    provider: String,
    username: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String,
    },
    emails: [
      {
        value: String,
      },
    ],
    photos: [
      {
        value: String,
      },
    ],
    gender: String,
    _raw: String,
    _json: Object,
    _accessLevel: String,
  },
  { timestamps: true, id: false }
); */
