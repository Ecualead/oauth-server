/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import "module-alias/register";
import { Logger } from "@ikoabo/core";
import { ClusterServer } from "@ikoabo/server";
import AsyncLock from "async-lock";

/* Initialize cluster server */
const clusterServer = ClusterServer.setup(
  { running: requestCredentials },
  { worker: runWorker }
);
/* Initialize componentes before import routes */
const lock = new AsyncLock();
const logger = new Logger("Microservice");

/* Base components routes */
import AccountRouter from "@/Accounts/routers/v1/accounts.routes";
import ApplicationRouter from "@/Applications/routers/v1/applications.routes";
import DomainRouter from "@/Domains/routers/v1/domains.routes";
import ModulesRouter from "@/Modules/routers/v1/modules.routes";
import OAuth2Router from "@/OAuth2/routers/v1/oauth2.routes";
import ProjectRouter from "@/Projects/routers/v1/projects.routes";
import ProjectSettingsRouter from "@/Projects/routers/v1/projects.settings.routes";
import SocialNetworkRouter from "@/SocialNetworks/routers/v1/social.networks.router";
import { AccountCodeCtrl } from "@/Accounts/controllers/accounts.code.controller";
import { AuthenticationCtrl } from "@ikoabo/auth";
import { MailCtrl } from "@ikoabo/notifications";

/**
 * Authenticate agains auth service
 */
function requestCredentials(): Promise<void> {
  return new Promise<void>((resolve) => {
    AuthenticationCtrl.setup(process.env.AUTH_SERVER);
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
  "/v1/modules": ModulesRouter,
  "/v1/domains": DomainRouter,
  "/v1/projects": [ProjectRouter, ProjectSettingsRouter],
  "/v1/applications": ApplicationRouter,
  "/v1/oauth/social": SocialNetworkRouter,
  "/v1/oauth": [AccountRouter, OAuth2Router]
});
