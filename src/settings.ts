/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EMAIL_CONFIRMATION, EXTERNAL_AUTH_TYPE, TOKEN_TYPE } from "./constants/oauth2.enum";

export interface IExternalAuth {
  name: string;
  type: EXTERNAL_AUTH_TYPE;
  clientId: string;
  clientSecret: string;
  scope?: string;
  profile?: string[];
  redirect?: string[];
}

export interface IPasswordPolicy {
  ttl?: number;
  minLen: number;
  upperCase?: boolean;
  lowerCase?: boolean;
  specialChars?: boolean;
  numbers?: boolean;
}

export interface ITokenPolicy {
  accessTokenTtl: number;
  refreshTokenTtl: number;
}

export interface ISignKeys {
  privateKey?: string;
  publicKey?: string;
  issuer: string;
  audience: string;
}

export interface IEmailPolicy {
  type: EMAIL_CONFIRMATION;
  ttl: number;
}

export interface IEmailNotifications {
  registerEvent?: boolean;
  confirmEvent?: boolean;
  loginEvent?: boolean;
  chPwdEvent?: boolean;
  recoverEvent?: boolean;
  token: TOKEN_TYPE;
}

export interface IOauth2Settings {
  name: string;
  version: string;

  passwordPolicy: IPasswordPolicy;
  tokenPolicy: ITokenPolicy;
  emailPolicy: IEmailPolicy;
  handleReferral?: boolean;
  emailNotifications: IEmailNotifications;

  externalAuth?: IExternalAuth[];
  signKeys: ISignKeys;
}
