/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import "module-alias/register";
import { ClusterServer } from "@ikoabo/server";
import { Logger } from "@ikoabo/core";
import AsyncLock from "async-lock";
/* Base components routes */
import AccountRouter from "@/routers/v1/account.router";
import ApplicationRouter from "@/routers/v1/application.router";
import DomainRouter from "@/routers/v1/domain.router";
import OAuth2ValidateRouter from "@/routers/v1/oauth2-validate.router";
import OAuth2Router from "@/routers/v1/oauth2.router";
import ExternalAuthRouter from "@/routers/v1/external-auth.router";
import ProjectRouter from "@/routers/v1/project/project.router";
import ProjectExternalAuthRouter from "@/routers/v1/project/external-auth.router";
import ProjectRestrictIpRouter from "@/routers/v1/project/restrict-ip.router";
import ProjectKeyRouter from "@/routers/v1/project/key.router";
import ProjectSettingsRouter from "@/routers/v1/project/setting.router";
import { AccountCodeCtrl } from "@/controllers/account/code.controller";
import { AuthenticationCtrl } from "@ikoabo/auth";
import { MailCtrl } from "@ikoabo/mailer";

/* Initialize cluster server */
const clusterServer = ClusterServer.setup({ running: requestCredentials }, { worker: runWorker });
/* Initialize componentes before import routes */
const lock = new AsyncLock();
const logger = new Logger("Service");

/**
 * Authenticate against auth service
 */
function requestCredentials(): Promise<void> {
  return new Promise<void>((resolve) => {
    AuthenticationCtrl.setup(process.env.AUTH_SERVER, process.env.AUTH_PROJECT);
    AuthenticationCtrl.authService(process.env.AUTH_ID, process.env.AUTH_SECRET)
      .catch((err) => {
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
          lock.acquire(
            "request-code",
            (done) => {
              /* Generate the new vCode */
              AccountCodeCtrl.code
                .then((value: string) => {
                  done(null, value);
                })
                .catch(done);
            },
            (err, value: string) => {
              /* Send response to slave service */
              worker.send({ action: "get/code", err: err, code: value });
              resolve();
            }
          );
          break;
      }
    });
  });
}

/* Run cluster with base routes */
clusterServer.run({
  "/v1/admin/domain": DomainRouter,
  "/v1/admin/project": [
    ProjectRouter,
    ProjectExternalAuthRouter,
    ProjectRestrictIpRouter,
    ProjectKeyRouter,
    ProjectSettingsRouter
  ],
  "/v1/admin/application": ApplicationRouter,
  "/v1/oauth": OAuth2ValidateRouter,
  "/v1/oauth/:project": [AccountRouter, OAuth2Router],
  "/v1/oauth/:project/external": ExternalAuthRouter
});
