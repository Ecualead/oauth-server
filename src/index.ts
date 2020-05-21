/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T07:10:00-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: index.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-05-03T18:00:56-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import "module-alias/register";
import { Settings } from '@/config/Settings';
import { ClusterServer } from '@ikoabo/core_srv';
import { Authenticator } from '@ikoabo/auth_srv';
import { Mail } from '@ikoabo/comm_srv';
import { AccountsProject } from '@/controllers/AccountsProject';
import DomainRouter from '@/routers/v1/domains';
import ProjectRouter from '@/routers/v1/projects';
import ApplicationRouter from '@/routers/v1/applications';
import AccountRouter from '@/routers/v1/accounts';
import OAuth2Router from '@/routers/v1/oauth2';
import AsyncLock from 'async-lock';
import { Code } from '@/controllers/Code';

const lock = new AsyncLock();
const CodeCtrl: Code = Code.shared;

/**
 * Initialize projects custom profiles
 */
function initializeProjects(): Promise<void> {
  return new Promise<void>((resolve) => {
    AccountsProject.shared.initialize()
      .then(() => {
      }).catch((err: any) => {
        console.error(err);
      }).finally(() => {
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
    Authenticator.shared.authService(Settings.AUTH.ID, Settings.AUTH.SECRET)
      .then(() => { })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        /* Initialize mail component */
        Mail.shared.setup(Settings.NOTIFICATIONS.SERVER, Authenticator.shared.token);
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
            done => {
              /* Generate the new vCode */
              CodeCtrl.code
                .then((value: string) => {
                  done(null, value);
                }).catch(done);
            }, (err, value: string) => {
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
const clusterServer = ClusterServer.setup(Settings, { running: requestCredentials, postMongo: initializeProjects }, { worker: runWorker });

/* Run cluster with base routes */
clusterServer.run({
  '/v1/domain': DomainRouter,
  '/v1/project': ProjectRouter,
  '/v1/application': ApplicationRouter,
  '/v1/oauth': [AccountRouter, OAuth2Router],
});
