/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { URL } from "url";
import { AUTH_ERRORS } from "@ecualead/auth";
import { Logger, HTTP_STATUS } from "@ecualead/server";
import { Request } from "express";
import { APPLICATION_TYPE } from "../../constants/oauth2.enum";
import { ApplicationCtrl } from "./application";
import { ApplicationDocument } from "../../models/application/application";

class AccessPolicy {
  private static _instance: AccessPolicy;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("Application:AccessPolicy");
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): AccessPolicy {
    if (!AccessPolicy._instance) {
      AccessPolicy._instance = new AccessPolicy();
    }
    return AccessPolicy._instance;
  }

  private _validate(req: Request, type: number, restriction: string[], resolve: any, reject: any) {
    switch (type) {
      /* Validate request origin */
      case APPLICATION_TYPE.WEB_CLIENT_SIDE:
        const url = new URL(req.headers["origin"] || `https://${req.hostname}`);
        if (restriction.length > 0 && restriction.indexOf(url.hostname) < 0) {
          this._logger.error("Hostname restricted", {
            origin: req.headers["origin"],
            hostname: url.hostname,
            restriction: restriction
          });
          return reject({
            boError: AUTH_ERRORS.APPLICATION_RESTRICTED,
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
          });
        }
        resolve(true);
        break;

      /* Validate request ip address */
      case APPLICATION_TYPE.MODULE:
      case APPLICATION_TYPE.SERVICE:
      case APPLICATION_TYPE.WEB_SERVER_SIDE:
        const ipAddress = req.ips.length > 0 ? req.ips[0] : req.ip;
        if (restriction.length > 0 && restriction.indexOf(ipAddress) < 0) {
          this._logger.error("IP address restricted", {
            ipAddress: ipAddress,
            expressIp: req.ip,
            expressIps: req.ips,
            restriction: restriction
          });
          return reject({
            boError: AUTH_ERRORS.APPLICATION_RESTRICTED,
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
          });
        }
        resolve(true);
        break;

      /* Not validated application types */
      case APPLICATION_TYPE.ANDROID:
      case APPLICATION_TYPE.IOS:
        resolve(true);
        break;

      /* Reject on any other item */
      default:
        this._logger.error("Invalid application access", {
          type: type
        });
        reject({
          boError: AUTH_ERRORS.INVALID_APPLICATION,
          boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
        });
    }
    /* TODO XXX Add porject access policy validation */
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
          this._validate(req, application.type, application.restrictions, resolve, reject);
        })
        .catch(reject);
    });
  }
}

export const AccessPolicyCtrl = AccessPolicy.shared;
