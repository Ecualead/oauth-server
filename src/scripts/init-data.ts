/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import "module-alias/register";
import { Logger, LOG_LEVEL, Tokens } from "@ikoabo/core";
import { HttpServer } from "@ikoabo/server";
import { DomainCtrl } from "@/controllers/domain/domain.controller";
import { DomainDocument } from "@/models/domain/domain.model";
import { ProjectCtrl } from "@/controllers/project/project.controller";
import { ProjectDocument } from "@/models/project/project.model";
import { APPLICATION_TYPE } from "@/constants/application.enum";
import { ApplicationCtrl } from "@/controllers/application/application.controller";
import { ApplicationDocument } from "@/models/application/application.model";
import { AccountCtrl } from "@/controllers/account/account.controller";
import { AccountDocument } from "@/models/account/account.model";
import { AccountEmailDocument } from "@/models/account/email.model";
import { AccountPhoneDocument } from "@/models/account/phone.model";

Logger.setLogLevel(LOG_LEVEL.DEBUG);
const modules: any[] = [
  {
    name: "IMS",
    description: "Identity Management System",
    url: "https://ims.ikoabo.com",
    restriction: [],
    scope: []
  }
];

const _logger: Logger = new Logger("InitData");
HttpServer.shared.initMongo().then(() => {
  _logger.debug("*** DATA IMPORT STARTED ***");

  /* Create the initial domain */
  DomainCtrl.create({
    name: "IKOABO",
    canonical: "com.ikoabo",
    description: "IKOA Business Opportunity Domain"
  })
    .then((domain: DomainDocument) => {
      _logger.debug("Domain created", { domain: domain });

      /* Create the initial project */
      ProjectCtrl.create({
        domain: domain.id,
        canonical: "com.ikoabo",
        name: "Plataforma IKOABO",
        description: "Infraestructura de servicios IKOA Business Opportunity",
        scope: [
          "mod_ims_register_user",
          "mod_ims_confirm_account",
          "mod_ims_recover_account",
          "mod_ims_resend_confirm",
          "mod_ims_recover_validate",
          "mod_ims_recover_change",
          "mod_ims_module_ctrl"
        ]
      })
        .then((project: ProjectDocument) => {
          _logger.debug("Project created", { project: project });

          /* Create the initial application */
          ApplicationCtrl.create({
            type: APPLICATION_TYPE.MODULE,
            project: project.id,
            canonical: "com.ikoabo.auth",
            name: "IKOA Business Opportunity Auth Service",
            secret: Tokens.long,
            grants: ["client_credentials"],
            scope: [
              "mod_ims_register_user",
              "mod_ims_confirm_account",
              "mod_ims_recover_account",
              "mod_ims_resend_confirm",
              "mod_ims_recover_validate",
              "mod_ims_recover_change"
            ],
            restriction: []
          })
            .then((application: ApplicationDocument) => {
              _logger.debug("Application created", {
                application: application
              });

              /* Register the initial user */
              AccountCtrl.registerAccount(
                {
                  name: "Reinier",
                  lastname1: "Millo",
                  lastname2: "Sánchez",
                  password: "cxpIkoa*03052019"
                },
                project
              )
                .then((user: AccountDocument) => {
                  _logger.debug("User registered", { user: user });

                  /* Register the user into the application */
                  AccountCtrl.registerEmail(
                    "reinier.millo88@gmail.com",
                    project,
                    "Default email address",
                    user.id
                  )
                    .then((email: AccountEmailDocument) => {
                      _logger.debug("User email address registered", {
                        email: email
                      });

                      AccountCtrl.registerPhone("+593998328746", "Default phone number", user.id)
                        .then((phone: AccountPhoneDocument) => {
                          _logger.debug("User phone number registered", {
                            phone: phone
                          });

                          /* Update domain owner */
                          DomainCtrl.update({ _id: domain._id }, { owner: user._id })
                            .then(() => {
                              /* Update project owner */
                              ProjectCtrl.update({ _id: project._id }, { owner: user._id })
                                .then(() => {
                                  /* Update application owner */
                                  ApplicationCtrl.update(
                                    { _id: application._id },
                                    { owner: user._id }
                                  )
                                    .then(() => {
                                      _logger.debug("*** DONE INITIAL DATA IMPORT ***");
                                      process.exit(0);
                                    })
                                    .catch((err) => {
                                      _logger.error("Error registering application owner", err);
                                      process.exit(-1);
                                    });
                                })
                                .catch((err) => {
                                  _logger.error("Error registering project owner", err);
                                  process.exit(-1);
                                });
                            })
                            .catch((err) => {
                              _logger.error("Error registering domain owner", err);
                              process.exit(-1);
                            });
                        })
                        .catch((err) => {
                          _logger.error("Error registering user phone number", err);
                          process.exit(-1);
                        });
                    })
                    .catch((err) => {
                      _logger.error("Error registering user email address", err);
                      process.exit(-1);
                    });
                })
                .catch((err) => {
                  _logger.error("Error registering user", err);
                  process.exit(-1);
                });
            })
            .catch((err) => {
              _logger.error("Error creating application", err);
              process.exit(-1);
            });
        })
        .catch((err) => {
          _logger.error("Error creating project", err);
          process.exit(-1);
        });
    })
    .catch((err) => {
      _logger.error("Error creating domain", err);
      process.exit(-1);
    });
});
