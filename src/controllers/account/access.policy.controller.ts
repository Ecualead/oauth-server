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
import { Objects, HTTP_STATUS } from "@ecualead/server";
import { ACCOUNT_STATUS, VALIDATION_STATUS, EMAIL_CONFIRMATION } from "../../constants/oauth2.enum";
import { AccountDocument } from "../../models/account/account.model";
import { EmailDocument } from "../../models/account/email.model";
import { IOauth2Settings } from "../../settings";
import { Settings } from "../settings.controller";

export class AccessPolicy {
  private static _instance: AccessPolicy;

  /**
   * Private constructor
   */
  private constructor() {}

  /**
   * Get the singleton class instance
   */
  public static get shared(): AccessPolicy {
    if (!AccessPolicy._instance) {
      AccessPolicy._instance = new AccessPolicy();
    }
    return AccessPolicy._instance;
  }

  /**
   * Check if an user can signin
   */
  public canSignin(
    user: AccountDocument,
    email: EmailDocument,
    social?: boolean
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      /* Fetch confirmation policy */
      const confirmationPolicy = Objects.get(
        Settings.shared.value,
        "emailPolicy.type",
        EMAIL_CONFIRMATION.NOT_REQUIRED
      );

      /* Fetch user confirmation expiration */
      const confirmationExpires = Objects.get(user, "confirmationExpires", 0);

      /* Check the current user state */
      switch (user.status) {
        case ACCOUNT_STATUS.TEMPORALLY_BLOCKED:
          return reject({
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
            boError: AUTH_ERRORS.ACCOUNT_BLOCKED
          });

        case ACCOUNT_STATUS.CANCELLED:
          return reject({
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
            boError: AUTH_ERRORS.ACCOUNT_CANCELLED
          });
        case ACCOUNT_STATUS.DISABLED_BY_ADMIN:
          return reject({
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
            boError: AUTH_ERRORS.ACCOUNT_DISABLED
          });
      }

      /* Check email address if its not a social account */
      if (!social) {
        /* Ensure the used email to authenticate is valid */
        if (!email) {
          return reject({
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
            boError: AUTH_ERRORS.NOT_ALLOWED_SIGNIN
          });
        }

        /* Check the current user email state */
        switch (email.status) {
          case VALIDATION_STATUS.REGISTERED:
            if (
              confirmationPolicy === EMAIL_CONFIRMATION.REQUIRED ||
              (confirmationPolicy === EMAIL_CONFIRMATION.REQUIRED_BY_TIME &&
                confirmationExpires < Date.now())
            ) {
              return reject({
                boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                boError: AUTH_ERRORS.EMAIL_NOT_CONFIRMED,
                boData: { id: Objects.get(user, "_id", user) }
              });
            }
            break;
          case VALIDATION_STATUS.TEMPORALLY_BLOCKED:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_BLOCKED
            });

          case VALIDATION_STATUS.CANCELLED:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_CANCELLED
            });
          case VALIDATION_STATUS.DISABLED_BY_ADMIN:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_DISABLED
            });

          case VALIDATION_STATUS.NEEDS_CONFIRM_CAN_NOT_AUTH:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.EMAIL_NOT_CONFIRMED,
              boData: { id: Objects.get(user, "_id", user) }
            });
          case VALIDATION_STATUS.NEEDS_CONFIRM_CAN_AUTH:
            if (confirmationExpires < Date.now()) {
              return reject({
                boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                boError: AUTH_ERRORS.EMAIL_NOT_CONFIRMED,
                boData: { id: Objects.get(user, "_id", user) }
              });
            }
        }
      }

      return resolve(true);
    });
  }
}

export const AccessPolicyCtrl = AccessPolicy.shared;
