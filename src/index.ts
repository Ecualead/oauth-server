/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T07:10:00-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: index.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-25T06:26:28-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Settings } from './controllers/Settings';
import { ClusterServer } from '@ikoabo/core_srv';
import { Authenticator } from '@ikoabo/auth_srv';
import { Mail } from '@ikoabo/comm_srv';
import { AccountsProject } from './controllers/AccountsProject';
import DomainRouter from './routers/v1/domains';
import ProjectRouter from './routers/v1/projects';
import ApplicationRouter from './routers/v1/applications';
import AccountRouter from './routers/v1/accounts';
import OAuth2Router from './routers/v1/oauth2';

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

/* Initialize cluster server */
const clusterServer = ClusterServer.setup(Settings, { running: requestCredentials, postMongo: initializeProjects });

/* Run cluster with base routes */
clusterServer.run({
  '/v1/domain': DomainRouter,
  '/v1/project': ProjectRouter,
  '/v1/application': ApplicationRouter,
  '/v1/oauth': [AccountRouter, OAuth2Router],
});
