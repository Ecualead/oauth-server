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
import { ISettings } from "@ikoabo/server";

export const Settings: ISettings = {
  /* Service information */
  SERVICE: {
    NAME: "IMS",
    LOG: process.env.LOG || "debug",
    PORT: parseInt(process.env.PORT || "3000"),
    INTERFACE: process.env.INTERFACE || "127.0.0.1",
    ENV: process.env.ENV || "dev",
    INSTANCES: parseInt(process.env.INSTANCES || "1")
  },

  /* Service version */
  VERSION: {
    MAIN: 1,
    MINOR: 0,
    REVISION: 0
  },

  /* Database connection */
  MONGODB: {
    URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mod_srv_ims"
  },

  /* Authentication server */
  AUTH: {
    SERVER: process.env.AUTH_SERVER || "https://ims.ikoabo.com",
    ID: process.env.AUTH_ID,
    SECRET: process.env.AUTH_SECRET
  },

  /* Notifications server */
  NOTIFICATIONS: {
    SERVER: process.env.NOTIFICATIONS_SERVER || "https://nts.ikoabo.com"
  },

  /* Real time events server */
  REALTIME_EVENTS: {
    SERVER: process.env.NOTIFICATIONS_SERVER || "https://rte.ikoabo.com"
  }
};
