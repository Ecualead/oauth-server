/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ClusterServer, Logger } from "@ecualead/server";
import AsyncLock from "async-lock";
/* Base components routes */
import { OAuth2Router } from "../routers";
import { ReferralCodeCtrl } from "../controllers/account/referral.code.controller";
import { AuthenticationCtrl, JWTCtrl, EMAIL_TOKEN_TYPE } from "@ecualead/auth";
import { MailCtrl } from "@ecualead/msg";
import { IOauth2Settings } from "../settings";
import { EMAIL_CONFIRMATION } from "../constants/oauth2.enum";
import { Settings } from "../controllers/settings.controller";

/* Initialize cluster server */
const clusterServer = ClusterServer.setup({ running: requestCredentials }, { worker: runWorker });
/* Initialize componentes before import routes */
const lock = new AsyncLock();
const logger = new Logger("Service");

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
    token: EMAIL_TOKEN_TYPE.LINK
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

/**
 * Authenticate against auth service
 */
function requestCredentials(): Promise<void> {
  return new Promise<void>((resolve) => {
    /* Load the JWT sign keys */
    JWTCtrl.loadKeys();

    AuthenticationCtrl.setup(process.env.AUTH_SERVER);
    AuthenticationCtrl.authService(process.env.AUTH_ID, process.env.AUTH_SECRET)
      .catch((err: any) => {
        logger.error("Invalid authentication configuration", err);
      })
      .finally(() => {
        /* Initialize mail component */
        MailCtrl.setup(process.env.NOTIFICATIONS_SERVER, AuthenticationCtrl.token);
        resolve();
      });
  });
}

/**
 * Handle message code from cluster process
 */
function runWorker(worker: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Receive messages from this worker and handle them in the master process.
    worker.on("message", (msg: any) => {
      switch (msg.action) {
        case "get/code":
          lock
            .acquire("request-code", (done) => {
              /* Generate the new vCode */
              ReferralCodeCtrl.code
                .then((value: string) => {
                  done(null, value);
                })
                .catch(done);
            })
            .catch((err) => {
              /* Send response to slave service */
              worker.send({ action: "get/code", err: err, code: null });
              resolve();
            });
          break;
      }
    });
  });
}

/* Run cluster with base routes */
clusterServer.run({
  "/v1/oauth": OAuth2Router
});
