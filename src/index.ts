import "module-alias/register";
import { Settings } from "@/config/Settings";
import { ClusterServer } from "@ikoabo/core_srv";
import { Authenticator } from "@ikoabo/auth_srv";
import { Mail } from "@ikoabo/comm_srv";
import AsyncLock from "async-lock";
import { AccountCode } from "./packages/Accounts/controllers/accounts.code.controller";
import { AccountsProjects } from "./packages/Accounts/controllers/accounts.projects.controller";

/* Base components routes */
import ModulesRouter from "@/Modules/routers/v1/modules.routes";
import DomainRouter from "@/Domains/routers/v1/domains.routes";
import ProjectRouter from "@/Projects/routers/v1/projects.routes";
import ProjectSettingsRouter from "@/Projects/routers/v1/projects.settings.routes";
import ApplicationRouter from "@/Applications/routers/v1/applications.routes";
import AccountRouter from "@/Accounts/routers/v1/accounts.routes";
import OAuth2Router from "@/OAuth2/routers/v1/oauth2.routes";

const lock = new AsyncLock();
const CodeCtrl: AccountCode = AccountCode.shared;

/**
 * Initialize projects custom profiles
 */
function initializeProjects(): Promise<void> {
  return new Promise<void>((resolve) => {
    AccountsProjects.shared
      .initialize()
      .then(() => { })
      .catch((err: any) => {
        console.error(err);
      })
      .finally(() => {
        resolve();
      });
  });
}

/**
 * Authenticate agains auth service
 */
function requestCredentials(): Promise<void> {
  return new Promise<void>((resolve) => {
    Authenticator.shared.setup(Settings.AUTH.SERVER);
    Authenticator.shared
      .authService(Settings.AUTH.ID, Settings.AUTH.SECRET)
      .then(() => { })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        /* Initialize mail component */
        Mail.shared.setup(
          Settings.NOTIFICATIONS.SERVER,
          Authenticator.shared.token
        );
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
              CodeCtrl.code
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

/* Initialize cluster server */
const clusterServer = ClusterServer.setup(
  Settings,
  { running: requestCredentials, postMongo: initializeProjects },
  { worker: runWorker }
);

/* Run cluster with base routes */
clusterServer.run({
  "/v1/module": ModulesRouter,
  "/v1/domain": DomainRouter,
  "/v1/project": [ProjectRouter, ProjectSettingsRouter],
  "/v1/application": ApplicationRouter,
  "/v1/oauth": [AccountRouter, OAuth2Router],
});
