/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EMAIL_CONFIRMATION } from "./constants/oauth2.enum";
import { EMAIL_TOKEN_TYPE } from "@ecualead/auth";
import { Request, Response, NextFunction } from "express";

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
  token: EMAIL_TOKEN_TYPE;
}

export interface IRouterHooks {
  postRegister?: (req: Request, res: Response, next: NextFunction) => void;
  postConfirm?: (req: Request, res: Response, next: NextFunction) => void;
  postToken?: (req: Request, res: Response, next: NextFunction) => void;
  postProfile?: (req: Request, res: Response, next: NextFunction) => void;
  postProfileUpdate?: (req: Request, res: Response, next: NextFunction) => void;
}

export interface IOauth2Settings {
  name: string;
  version: string;

  passwordPolicy: IPasswordPolicy;
  tokenPolicy: ITokenPolicy;
  emailPolicy: IEmailPolicy;
  handleReferral?: boolean;
  emailNotifications: IEmailNotifications;

  oauth2BaseUrl: string;
  signKeys: ISignKeys;
  routerHooks: IRouterHooks;
}
