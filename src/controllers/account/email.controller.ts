/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import {
  AUTH_ERRORS,
  EMAIL_TOKEN_TYPE,
  LIFETIME_TYPE,
  VALIDATION_TOKEN_STATUS
} from "@ecualead/auth";
import { Tokens, CRUD, HTTP_STATUS } from "@ecualead/server";
import { EmailDocument, EmailModel } from "../../models/account/email.model";
import { Request, Response, NextFunction } from "express";
import { VALIDATION_STATUS } from "../../constants/oauth2.enum";
import { Settings } from "../settings.controller";

export class Emails extends CRUD<EmailDocument> {
  private static _instance: Emails;

  /**
   * Private constructor
   */
  private constructor() {
    super("Account:Email", EmailModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Emails {
    if (!Emails._instance) {
      Emails._instance = new Emails();
    }
    return Emails._instance;
  }

  /**
   * Find user information by email address
   */
  public fetchByEmail(email: string): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
      /* Look for the user by email */
      this.fetch({ email: email }, {}, ["account"]).then(resolve).catch(reject);
    });
  }

  /**
   * Check if the user email address is registered
   */
  public check(email: string, failIfExists = false) {
    return (req: Request, res: Response, next: NextFunction) => {
      this.fetchByEmail(email)
        .then((email: EmailDocument) => {
          /* Check if user is already registered */
          if (failIfExists) {
            return next({
              boError: AUTH_ERRORS.EMAIL_IN_USE,
              boStatus: HTTP_STATUS.HTTP_4XX_CONFLICT
            });
          }
          res.locals["email"] = email;
          next();
        })
        .catch((err: any) => {
          /* Check if user is already registered */
          if (failIfExists) {
            return next();
          }
          next(err);
        });
    };
  }

  /**
   * Register user account email
   */
  public register(email: string, account?: string): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
      /* Set the confirmation token information if its necessary */
      const tokenType = Settings.shared.value?.emailNotifications?.token;

      const validationToken: any = {
        token: null,
        attempts: 0,
        status: VALIDATION_TOKEN_STATUS.DISABLED,
        expire: 0
      };

      if (tokenType !== EMAIL_TOKEN_TYPE.DISABLED) {
        validationToken.token = tokenType !== EMAIL_TOKEN_TYPE.LINK ? Tokens.short : Tokens.long;
        validationToken.attempts = 0;
        validationToken.status = VALIDATION_TOKEN_STATUS.TO_CONFIRM;
        validationToken.expire = Date.now() + LIFETIME_TYPE.DAY;
      }

      /* Create the email related to the user account */
      this.create({
        email: email,
        validation: validationToken,
        status: VALIDATION_STATUS.REGISTERED,
        account: account
      })
        .then((obj: EmailDocument) => {
          resolve(obj);
        })
        .catch(reject);
    });
  }
}

export const EmailCtrl = Emails.shared;
