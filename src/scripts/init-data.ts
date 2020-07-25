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
import { HttpServer, Token } from "@ikoabo/core_srv";
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
import { ApplicationDocument } from "@/Applications/models/applications.model";
import { APPLICATION_TYPES } from "@/packages/Applications/models/applications.enum";
import { AccountCtrl } from "@/packages/Accounts/controllers/accounts.controller";
import { AccountDocument } from "@/packages/Accounts/models/accounts.model";
import { ApplicationCtrl } from "@/packages/Applications/controllers/applications.controller";
import { AccountProjectProfileDocument } from "@/packages/Accounts/models/accounts.projects.model";
import { ProjectCtrl } from "@/packages/Projects/controllers/projects.controller";
import { DomainCtrl } from "@/packages/Domains/controllers/domains.controller";

const modules: Module[] = [
  {
    name: "IMS",
    description: "Identity Management System",
    url: "https://ims.ikoabo.com",
  },
  {
    name: "BCS",
    description: "Blog Content Service",
    url: "https://bcs.ikoabo.com",
  },
  {
    name: "EVT",
    description: "Event Service",
    url: "https://evt.ikoabo.com",
  },
  {
    name: "FSS",
    description: "File Storage Service",
    url: "https://fss.ikoabo.com",
  },
  {
    name: "NTS",
    description: "Notifications Service",
    url: "https://nts.ikoabo.com",
  },
  {
    name: "RTE",
    description: "Real Time Event Service",
    url: "https://rte.ikoabo.com",
  },
  {
    name: "TCS",
    description: "Taxonomy/Category Service",
    url: "https://tcs.ikoabo.com",
  },
  {
    name: "ECS",
    description: "e-Commerce Service",
    url: "https://ecs.ikoabo.com",
  },
  {
    name: "PSP",
    description: "Product/Service Portafolio",
    url: "https://psp.ikoabo.com",
  },
  {
    name: "PVG",
    description: "Photo/Video Gallery Service",
    url: "https://pvg.ikoabo.com",
  },
  {
    name: "UVC",
    description: "User v-Card Service",
    url: "https://uvs.ikoabo.com",
  },
  {
    name: "ICS",
    description: "Instant Chat Service",
    url: "https://ics.ikoabo.com",
  },
  {
    name: "UVS",
    description: "User VITAE Service",
    url: "https://uvs.ikoabo.com",
  },
  {
    name: "VSS",
    description: "Video Streaming Service",
    url: "https://vss.ikoabo.com",
  },
  {
    name: "CBS",
    description: "Chat Bot Service",
    url: "https://cbs.ikoabo.com",
  },
  {
    name: "SNS",
    description: "Social Network Service",
    url: "https://sns.ikoabo.com",
  },
  {
    name: "ELS",
    description: "e-Learning Service",
    url: "https://els.ikoabo.com",
  },
  {
    name: "MMA",
    description: "Master Merchant Account Service",
    url: "https://mma.ikoabo.com",
  },
  {
    name: "BRS",
    description: "Book Read Service",
    url: "https://brs.ikoabo.com",
  },
];

HttpServer.setup(Settings);
HttpServer.shared.initMongo().then(() => {
  console.log("*** DATA IMPORT STARTED ***");
  console.log();

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
        console.error(err);
        process.exit(-1);
        return;
      }

      console.log("=== MODULES CREATED: ");
      console.log(modulesData);

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
          console.log("=== DOMAIN CREATED: ");
          console.log(domain);

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
              console.log("=== PROJECT CREATED: ");
              console.log(project);

              /* Create the initial application */
              ApplicationCtrl.create({
                type: APPLICATION_TYPES.APP_WEB_CLIENT_SIDE,
                project: project.id,
                canonical: "com.ikoabo.dev",
                name: "IKOA Business Opportunity",
                secret: Token.longToken,
                scope: [
                  "mod_ims_register_user",
                  "mod_ims_confirm_account",
                  "mod_ims_recover_account",
                  "mod_ims_resend_confirm",
                  "mod_ims_recover_validate",
                  "mod_ims_recover_change",
                ],
              })
                .then((application: ApplicationDocument) => {
                  /* Fetch application with project populated */
                  ApplicationCtrl.fetch(application.id, {}, {}, ["project"])
                    .then((application: ApplicationDocument) => {
                      console.log("=== APPLICATION CREATED: ");
                      console.log(application);

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
                          console.log("=== USER REGISTERED: ");
                          console.log(user);

                          /* Register the user into the application */
                          AccountCtrl.registerProject(user, application, null)
                            .then((profile: AccountProjectProfileDocument) => {
                              console.log("=== USER PROFILE REGISTERED: ");
                              console.log(profile);

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
                                          DomainModel.findOneAndUpdate(
                                            { _id: domain._id },
                                            { $set: { owner: user._id } }
                                          )
                                            .then(() => {
                                              console.log();
                                              console.log(
                                                "*** DONE INITIAL DATA IMPORT ***"
                                              );
                                              process.exit(0);
                                            })
                                            .catch((err) => {
                                              console.error(err);
                                              process.exit(-1);
                                            });
                                        })
                                        .catch((err) => {
                                          console.error(err);
                                          process.exit(-1);
                                        });
                                    })
                                    .catch((err) => {
                                      console.error(err);
                                      process.exit(-1);
                                    });
                                })
                                .catch((err) => {
                                  console.error(err);
                                  process.exit(-1);
                                });
                            })
                            .catch((err) => {
                              console.error(err);
                              process.exit(-1);
                            });
                        })
                        .catch((err) => {
                          console.error(err);
                          process.exit(-1);
                        });
                    })
                    .catch((err) => {
                      console.error(err);
                      process.exit(-1);
                    });
                })
                .catch((err) => {
                  console.error(err);
                  process.exit(-1);
                });
            })
            .catch((err) => {
              console.error(err);
              process.exit(-1);
            });

          /* Create the initial user */
        })
        .catch((err) => {
          console.error(err);
          process.exit(-1);
        });
    }
  );
});
