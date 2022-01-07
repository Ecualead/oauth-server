/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { JWTCtrl } from "../controllers/jwt.controller";
import { Settings } from "../controllers/settings.controller";
import { EMAIL_CONFIRMATION, TOKEN_TYPE } from "../constants/oauth2.enum";
import { IOauth2Settings } from "../settings";

const baseSettings: IOauth2Settings = {
  name: "LegalTI",
  version: "3.0",
  passwordPolicy: {
    ttl: 9999999,
    minLen: 4,
    upperCase: true,
    lowerCase: true,
    specialChars: false,
    numbers: false
  },
  tokenPolicy: {
    accessTokenTtl: 86400,
    refreshTokenTtl: 864000
  },
  emailPolicy: {
    type: EMAIL_CONFIRMATION.NOT_REQUIRED,
    ttl: 86400
  },
  handleReferral: false,
  emailNotifications: {
    registerEvent: true,
    confirmEvent: true,
    loginEvent: true,
    chPwdEvent: true,
    recoverEvent: true,
    token: TOKEN_TYPE.LINK
  },
  externalAuth: [],
  signKeys: {
    privateKey: "legalti_private.pem",
    publicKey: "legalti_public.pem",
    issuer: "LegalTI",
    audience: "https://www.legalti.mx"
  }
};

Settings.setup(baseSettings);
JWTCtrl.generateKeys();
process.exit(0);
