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
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";

@index({ type: 1 })
@index({ clientId: 1 })
@index({ clientSecret: 1 })
@index({ clientId: 1, clientSecret: 1 })
export class SocialNetworkSetting {
  @prop({
    enum: SOCIAL_NETWORK_TYPES,
    required: true,
    default: SOCIAL_NETWORK_TYPES.SN_UNKNOWN,
  })
  type!: SOCIAL_NETWORK_TYPES;

  @prop({ required: true })
  clientId!: string;

  @prop({ required: true })
  clientSecret!: string;

  @prop()
  scope?: string;

  @prop({ type: String })
  profile?: string[];
}

@index({ type: 1 })
@index({ socialId: 1 })
@index({ accessToken: 1 })
@index({ refreshToken: 1 })
@index({ socialId: 1, accessToken: 1 })
export class SocialNetworkCredential {
  @prop({ required: true, enum: SOCIAL_NETWORK_TYPES, default: SOCIAL_NETWORK_TYPES.SN_UNKNOWN })
  type!: SOCIAL_NETWORK_TYPES;

  @prop({ required: true })
  socialId!: string;

  @prop({ required: true })
  accessToken!: string;

  @prop()
  refreshToken?: string;
}

@index({ type: 1 })
export class SocialNetworkProfile {
  @prop({ required: true, enum: SOCIAL_NETWORK_TYPES })
  type!: SOCIAL_NETWORK_TYPES;

  @prop()
  profile?: any;
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
