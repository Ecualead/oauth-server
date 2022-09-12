/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { HttpServer, Logger } from "@ecualead/server";
import { ApplicationCtrl, ApplicationDocument, APPLICATION_TYPE } from "..";

const server = HttpServer.shared;
const logger = new Logger("CreateApp");

server
  .initMongo()
  .then(() => {
    ApplicationCtrl.create({
      name: "Sample App",
      canonical: "com.example",
      description: "Sample application",
      type: APPLICATION_TYPE.SERVICE,
      grants: ["client_secret", "refresh_token", "password", "authorization_code"],
      scope: [],
      restrictions: []
    })
      .then((app: ApplicationDocument) => {
        logger.info("Application created", app);
      })
      .catch((err: any) => {
        logger.error(err);
      })
      .finally(() => {
        process.exit(0);
      });
  })
  .catch((err) => {
    logger.error(err);
    process.exit(0);
  });
