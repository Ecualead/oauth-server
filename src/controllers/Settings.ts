/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T07:16:10-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: Settings.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T07:16:45-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { ISettings } from '@ikoabo/core_srv';

export const Settings: ISettings = {
  /* Service information */
  SERVICE: {
    NAME: "Auth",
    LOG: process.env.LOG || "debug",
    PORT: parseInt(process.env.PORT || '3000'),
    INTERFACE: process.env.INTERFACE || "127.0.0.1",
    ENV: process.env.ENV || 'dev',
    INSTANCES: parseInt(process.env.INSTANCES || '1'),
  },

  /* Service version */
  VERSION: {
    MAIN: 1,
    MINOR: 0,
    REVISION: 0,
  },

  /* Database connection */
  MONGODB: {
    URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ikoabo_auth',
  },
}
