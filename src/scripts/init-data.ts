/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import "module-alias/register";
import { Settings } from "@/config/Settings";
import { HttpServer, Token, Logger, LOG_LEVEL } from "@ikoabo/core_srv";
import async from "async";
import { DomainModel, DomainDocument } from "@/Domains/models/domains.model";
import {
  Module,
  ModuleModel,
  ModuleDocument,
} from "@/Modules/models/modules.model";
import {
  ProjectModel,
  ProjectDocument,
} from "@/Projects/models/projects.model";
import {
  ApplicationDocument,
  ApplicationModel,
} from "@/Applications/models/applications.model";
import { APPLICATION_TYPES } from "@/Applications/models/applications.enum";
import { AccountCtrl } from "@/Accounts/controllers/accounts.controller";
import { AccountDocument } from "@/Accounts/models/accounts.model";
import { ApplicationCtrl } from "@/Applications/controllers/applications.controller";
import { AccountProjectProfileDocument } from "@/Accounts/models/accounts.projects.model";
import { ProjectCtrl } from "@/Projects/controllers/projects.controller";
import { DomainCtrl } from "@/Domains/controllers/domains.controller";

Logger.setLogLevel(LOG_LEVEL.DEBUG);
const modules: Module[] = [
  {
    name: "IMS",
    description: "Identity Management System",
    url: "https://ims.ikoabo.com",
    restriction: [],
    scope: [
      "mod_ims_register_user",
      "mod_ims_confirm_account",
      "mod_ims_recover_account",
      "mod_ims_resend_confirm",
      "mod_ims_recover_validate",
      "mod_ims_recover_change",
      "mod_ims_module_ctrl",
    ],
  },
  {
    name: "BCS",
    description: "Blog Content Service",
    url: "https://bcs.ikoabo.com",
    restriction: [],
  },
  {
    name: "EVT",
    description: "Event Service",
    url: "https://evt.ikoabo.com",
    restriction: [],
  },
  {
    name: "FSS",
    description: "File Storage Service",
    url: "https://fss.ikoabo.com",
    restriction: [],
  },
  {
    name: "NTS",
    description: "Notifications Service",
    url: "https://nts.ikoabo.com",
    restriction: [],
  },
  {
    name: "RTE",
    description: "Real Time Event Service",
    url: "https://rte.ikoabo.com",
    restriction: [],
  },
  {
    name: "TCS",
    description: "Taxonomy/Category Service",
    url: "https://tcs.ikoabo.com",
    restriction: [],
  },
  {
    name: "ECS",
    description: "e-Commerce Service",
    url: "https://ecs.ikoabo.com",
    restriction: [],
  },
  {
    name: "PSP",
    description: "Product/Service Portafolio",
    url: "https://psp.ikoabo.com",
    restriction: [],
  },
  {
    name: "PVG",
    description: "Photo/Video Gallery Service",
    url: "https://pvg.ikoabo.com",
    restriction: [],
  },
  {
    name: "UVC",
    description: "User v-Card Service",
    url: "https://uvs.ikoabo.com",
    restriction: [],
  },
  {
    name: "ICS",
    description: "Instant Chat Service",
    url: "https://ics.ikoabo.com",
    restriction: [],
  },
  {
    name: "UVS",
    description: "User VITAE Service",
    url: "https://uvs.ikoabo.com",
    restriction: [],
  },
  {
    name: "VSS",
    description: "Video Streaming Service",
    url: "https://vss.ikoabo.com",
    restriction: [],
  },
  {
    name: "CBS",
    description: "Chat Bot Service",
    url: "https://cbs.ikoabo.com",
    restriction: [],
  },
  {
    name: "SNS",
    description: "Social Network Service",
    url: "https://sns.ikoabo.com",
    restriction: [],
  },
  {
    name: "ELS",
    description: "e-Learning Service",
    url: "https://els.ikoabo.com",
    restriction: [],
  },
  {
    name: "MMA",
    description: "Master Merchant Account Service",
    url: "https://mma.ikoabo.com",
    restriction: [],
  },
  {
    name: "BRS",
    description: "Book Read Service",
    url: "https://brs.ikoabo.com",
    restriction: [],
  },
];

HttpServer.setup(Settings);
const _logger: Logger = new Logger("InitData");
HttpServer.shared.initMongo().then(() => {
  _logger.debug("*** DATA IMPORT STARTED ***");

  /* Registrate all initial modules */
  let modulesData: any[] = [];
  async.forEach(
    modules,
    (value: Module, cb: any) => {
      value.secret = Token.longToken;
      /* Register the module */
      ModuleModel.create(value)
        .then((value: ModuleDocument) => {
          modulesData.push({
            id: value.id,
            name: value.name,
            secret: value.secret,
          });
          cb();
        })
        .catch(cb);
    },
    (err: any) => {
      if (err) {
        _logger.error("Error registering modules", err);
        process.exit(-1);
        return;
      }

      _logger.debug("Modules created", { modules: modulesData });

      /* Create the initial domain */
      DomainCtrl.create({
        name: "IKOABO",
        canonical: "com.ikoabo",
        description: "IKOA Business Opportunity Domain",
        scope: [
          "mod_ims_register_user",
          "mod_ims_confirm_account",
          "mod_ims_recover_account",
          "mod_ims_resend_confirm",
          "mod_ims_recover_validate",
          "mod_ims_recover_change",
          "mod_ims_module_ctrl",
        ],
      })
        .then((domain: DomainDocument) => {
          _logger.debug("Domain created", { domain: domain });

          /* Create the initial project */
          ProjectCtrl.create({
            domain: domain.id,
            canonical: "com.ikoabo",
            name: "Plataforma IKOABO",
            description: "IKOA Business Opportunity",
            scope: [
              "mod_ims_register_user",
              "mod_ims_confirm_account",
              "mod_ims_recover_account",
              "mod_ims_resend_confirm",
              "mod_ims_recover_validate",
              "mod_ims_recover_change",
              "mod_ims_module_ctrl",
            ],
          })
            .then((project: ProjectDocument) => {
              _logger.debug("Project created", { project: project });

              /* Create the initial application */
              ApplicationCtrl.create({
                type: APPLICATION_TYPES.APP_WEB_CLIENT_SIDE,
                project: project.id,
                canonical: "com.ikoabo.dev",
                name: "IKOA Business Opportunity",
                secret: Token.longToken,
                grants: ["client_credentials", "password"],
                scope: [
                  "mod_ims_register_user",
                  "mod_ims_confirm_account",
                  "mod_ims_recover_account",
                  "mod_ims_resend_confirm",
                  "mod_ims_recover_validate",
                  "mod_ims_recover_change",
                ],
                restriction: [],
              })
                .then((application: ApplicationDocument) => {
                  /* Fetch application with project populated */
                  ApplicationCtrl.fetch(application.id, {}, {}, ["project"])
                    .then((application: ApplicationDocument) => {
                      _logger.debug("Application created", {
                        application: application,
                      });

                      /* Register the initial user */
                      AccountCtrl.register(
                        {
                          name: "Reinier",
                          lastname: "Millo Sánchez",
                          email: "reinier.millo88@gmail.com",
                          password: "cxpIkoa*03052019",
                          phone: "+593998328746",
                        },
                        application
                      )
                        .then((user: AccountDocument) => {
                          _logger.debug("User registered", { user: user });

                          /* Register the user into the application */
                          AccountCtrl.registerProject(user, project.id, null)
                            .then((profile: AccountProjectProfileDocument) => {
                              _logger.debug("User profile registered", {
                                profile: profile,
                              });

                              /* Update modules owner */
                              ModuleModel.updateMany(
                                {},
                                { $set: { owner: user._id } }
                              )
                                .then(() => {
                                  /* Update domain owner */
                                  DomainModel.findOneAndUpdate(
                                    { _id: domain._id },
                                    { $set: { owner: user._id } }
                                  )
                                    .then(() => {
                                      /* Update project owner */
                                      ProjectModel.findOneAndUpdate(
                                        { _id: project._id },
                                        { $set: { owner: user._id } }
                                      )
                                        .then(() => {
                                          /* Update application owner */
                                          ApplicationModel.findOneAndUpdate(
                                            { _id: domain._id },
                                            { $set: { owner: user._id } }
                                          )
                                            .then(() => {
                                              _logger.debug(
                                                "*** DONE INITIAL DATA IMPORT ***"
                                              );
                                              process.exit(0);
                                            })
                                            .catch((err) => {
                                              _logger.error(
                                                "Error registering application owner",
                                                err
                                              );
                                              process.exit(-1);
                                            });
                                        })
                                        .catch((err) => {
                                          _logger.error(
                                            "Error registering project owner",
                                            err
                                          );
                                          process.exit(-1);
                                        });
                                    })
                                    .catch((err) => {
                                      _logger.error(
                                        "Error registering domain owner",
                                        err
                                      );
                                      process.exit(-1);
                                    });
                                })
                                .catch((err) => {
                                  _logger.error(
                                    "Error registering modules owner",
                                    err
                                  );
                                  process.exit(-1);
                                });
                            })
                            .catch((err) => {
                              _logger.error(
                                "Error registering user profile",
                                err
                              );
                              process.exit(-1);
                            });
                        })
                        .catch((err) => {
                          _logger.error("Error registering user", err);
                          process.exit(-1);
                        });
                    })
                    .catch((err) => {
                      _logger.error("Error fetching application", err);
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
    }
  );
});
