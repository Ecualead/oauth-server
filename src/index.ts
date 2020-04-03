/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T07:10:00-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: index.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T19:13:03-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Settings } from './controllers/Settings';
import { ClusterServer } from '@ikoabo/core_srv';
import DomainRouter from './routers/v1/domains';
import ProjectRouter from './routers/v1/projects';
import ApplicationRouter from './routers/v1/applications';
import OAuth2Router from './routers/v1/oauth2';

/* Initialize cluster server */
const clusterServer = ClusterServer.setup(Settings);
/* Run cluster with base routes */
clusterServer.run({
  '/v1/domain': DomainRouter,
  '/v1/project': ProjectRouter,
  '/v1/application': ApplicationRouter,
  '/v1/oauth': OAuth2Router,
});
