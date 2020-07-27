/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Logger, ERRORS, HTTP_STATUS } from "@ikoabo/core_srv";
import { ERRORS as AUTH_ERRORS } from "@ikoabo/auth_srv";
import { Request } from "express";
import { ApplicationDocument } from "@/Applications/models/applications.model";
import { APPLICATION_TYPES } from "@/Applications/models/applications.enum";
import { ApplicationCtrl } from "@/Applications/controllers/applications.controller";
import { ModuleCtrl } from "@/Modules/controllers/modules.controller";
import { ModuleDocument } from "@/Modules/models/modules.model";
import URL from "url";

class ApplicationAccessPolicy {
  private static _instance: ApplicationAccessPolicy;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("ApplicationAccessPolicy");
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): ApplicationAccessPolicy {
    if (!ApplicationAccessPolicy._instance) {
      ApplicationAccessPolicy._instance = new ApplicationAccessPolicy();
    }
    return ApplicationAccessPolicy._instance;
  }

  private _validate(
    req: Request,
    type: number,
    restriction: string[],
    resolve: any,
    reject: any
  ) {
    switch (type) {
      /* Validate request origin */
      case APPLICATION_TYPES.APP_WEB_CLIENT_SIDE:
        const url = URL.parse(req.headers["origin"]);
        if (restriction.indexOf(url.hostname) < 0) {
          this._logger.error("Application access restricted", {
            origin: req.headers["origin"],
            hostname: url.hostname,
            restriction: restriction,
          });
          return reject({
            boError: AUTH_ERRORS.APPLICATION_RESTRICTED,
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
          });
        }
        resolve(true);
        break;

      /* Validate request ip address */
      case APPLICATION_TYPES.APP_MODULE:
      case APPLICATION_TYPES.APP_SERVICE:
      case APPLICATION_TYPES.APP_WEB_SERVER_SIDE:
        const ipAddress = req.ips.length > 0 ? req.ips[0] : req.ip;
        if (restriction.indexOf(ipAddress) < 0) {
          this._logger.error("Application access restricted", {
            ipAddress: ipAddress,
            expressIp: req.ip,
            expressIps: req.ips,
            restriction: restriction,
          });
          return reject({
            boError: AUTH_ERRORS.APPLICATION_RESTRICTED,
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
          });
        }
        resolve(true);
        break;

      /* Not validated application types */
      case APPLICATION_TYPES.APP_ANDROID:
      case APPLICATION_TYPES.APP_IOS:
        resolve(true);
        break;

      /* Reject on any other item */
      default:
        this._logger.error("Invalid application access", {
          type: type,
        });
        reject({
          boError: ERRORS.INVALID_OPERATION,
          boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
        });
    }
  }

  /**
   * Check if the given application can access to the resource using
   * the given credentials. Access restrictions are preconfigured into
   * the application creation. Web application (client side) restrictions
   * are handled by request origin, module, services and Web application
   * (server side) are handled by request ip address. Mobile applications
   * are not validated yet.
   *
   * @param req
   * @param application
   */
  public canAccess(req: Request, application: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      /* Fetch the application information */
      ApplicationCtrl.fetch(application)
        .then((application: ApplicationDocument) => {
          this._validate(
            req,
            application.type,
            application.restriction,
            resolve,
            reject
          );
        })
        .catch((err: any) => {
          /* If the application is not found, try to fetch a module */
          if (err.boError === ERRORS.OBJECT_NOT_FOUND) {
            return ModuleCtrl.fetch(application)
              .then((module: ModuleDocument) => {
                this._validate(
                  req,
                  module.type,
                  module.restriction,
                  resolve,
                  reject
                );
              })
              .catch(reject);
          }
          reject(err);
        });
    });
  }
}

export const ApplicationAccessPolicyCtrl = ApplicationAccessPolicy.shared;
