/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AUTH_ERRORS } from "@ecualead/auth";
import { CRUD, HTTP_STATUS } from "@ecualead/server";
import { PhoneDocument, PhoneModel } from "../../models/account/phone.model";
import { Request, Response, NextFunction } from "express";
import { TOKEN_STATUS, VALIDATION_STATUS } from "../../constants/account.enum";
import { IOauth2Settings } from "../../settings";

export class Phones extends CRUD<PhoneDocument> {
  private static _instance: Phones;
  private _settings: IOauth2Settings;

  /**
   * Private constructor
   */
  private constructor() {
    super("Account:Phone", PhoneModel);
  }

  /**
   * Settup the user account controller
   */
  public static setup(settings: IOauth2Settings) {
    if (!Phones._instance) {
      Phones._instance = new Phones();
      Phones._instance._settings = settings;
    } else {
      throw new Error("Phones already configured");
    }
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Phones {
    if (!Phones._instance) {
      throw new Error("Phones isn't configured");
    }
    return Phones._instance;
  }

  /**
   * Find user information by phone number
   */
  public fetchByPhone(phone: string): Promise<PhoneDocument> {
    return new Promise<PhoneDocument>((resolve, reject) => {
      this.fetch({ phone: phone }, { populate: ["account"] })
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Check if the user phone is registered
   */
  public check(phone: string, failIfExists = false) {
    return (req: Request, res: Response, next: NextFunction) => {
      this.fetchByPhone(phone)
        .then((userPhone: PhoneDocument) => {
          /* Check if user is already registered */
          if (failIfExists) {
            return next({
              boError: AUTH_ERRORS.EMAIL_IN_USE,
              boStatus: HTTP_STATUS.HTTP_4XX_CONFLICT
            });
          }
          res.locals["phone"] = userPhone;
          next();
        })
        .catch(next);
    };
  }

  /**
   * Register user account phone
   */
  public register(phone: string, account?: string): Promise<PhoneDocument> {
    return new Promise<PhoneDocument>((resolve, reject) => {
      this.create({
        phone: phone,
        validation: {
          token: null,
          attempts: 0,
          status: TOKEN_STATUS.DISABLED,
          expire: 0
        },
        status: VALIDATION_STATUS.REGISTERED,
        account: account
      })
        .then((phone: PhoneDocument) => {
          resolve(phone);
        })
        .catch(reject);
    });
  }
}
