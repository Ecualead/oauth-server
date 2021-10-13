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
import { AUTH_ERRORS } from "@ikoabo/auth";
import { Objects, HTTP_STATUS } from "@ikoabo/core";
import { ACCOUNT_STATUS, EMAIL_STATUS } from "@/constants/account.enum";
import { ProjectDocument } from "@/models/project/project.model";
import { AccountDocument } from "@/models/account/account.model";
import { EMAIL_CONFIRMATION } from "@/constants/project.enum";
import { AccountEmailDocument } from "@/models/account/email.model";

export class AccountAccessPolicy {
  /**
   * Check if an user can signin in the given project
   *
   * @param user
   * @param project
   * @param checkLocal
   */
  public static canSignin(
    user: AccountDocument,
    project: ProjectDocument,
    email: AccountEmailDocument,
    social?: boolean
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      /* Fetch confirmation policy */
      const confirmationPolicy = Objects.get(
        project,
        "settings.emailConfirmation.type",
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
          case EMAIL_STATUS.REGISTERED:
            if (
              confirmationPolicy === EMAIL_CONFIRMATION.REQUIRED ||
              (confirmationPolicy === EMAIL_CONFIRMATION.REQUIRED_BY_TIME &&
                confirmationExpires < Date.now())
            ) {
              return reject({
                boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                boError: AUTH_ERRORS.EMAIL_NOT_CONFIRMED,
                boData: { id: Objects.get(user, "id", user) }
              });
            }
            break;
          case EMAIL_STATUS.TEMPORALLY_BLOCKED:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_BLOCKED
            });

          case EMAIL_STATUS.CANCELLED:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_CANCELLED
            });
          case EMAIL_STATUS.DISABLED_BY_ADMIN:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_DISABLED
            });

          case EMAIL_STATUS.NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH:
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.EMAIL_NOT_CONFIRMED,
              boData: { id: Objects.get(user, "id", user) }
            });
          case EMAIL_STATUS.NEEDS_CONFIRM_EMAIL_CAN_AUTH:
            if (confirmationExpires < Date.now()) {
              return reject({
                boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                boError: AUTH_ERRORS.EMAIL_NOT_CONFIRMED,
                boData: { id: Objects.get(user, "id", user) }
              });
            }
        }
      }

      return resolve(true);
    });
  }
}
