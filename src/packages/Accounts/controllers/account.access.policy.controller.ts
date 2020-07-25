/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Objects, HTTP_STATUS } from "@ikoabo/core_srv";
import { ERRORS } from "@ikoabo/auth_srv";
import { AccountDocument } from "@/Accounts/models/accounts.model";
import { ProjectDocument } from "@//Projects/models/projects.model";
import { ACCOUNT_STATUS } from "@/Accounts/models/accounts.enum";
import { PROJECT_EMAIL_CONFIRMATION } from "@/Projects/models/projects.enum";
import {
  AccountProjectProfileModel,
  AccountProjectProfileDocument,
} from "@/Accounts/models/accounts.projects.model";

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
    checkLocal?: boolean
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      /* Fetch confirmation policy */
      const confirmationPolicy = Objects.get(
        project,
        "settings.emailConfirmation.type",
        PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED
      );
      /* Fetch user confirmation expiration */
      const confirmationExpires = Objects.get(user, "confirmationExpires", 0);

      /* Check the curren user state */
      switch (user.status) {
        case ACCOUNT_STATUS.AS_REGISTERED:
          if (
            confirmationPolicy ===
              PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED ||
            (confirmationPolicy ===
              PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED_BY_TIME &&
              confirmationExpires < Date.now())
          ) {
            return reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.EMAIL_NOT_CONFIRMED,
            });
          }
          break;
        case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
          return reject({
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
            boError: ERRORS.ACCOUNT_BLOCKED,
          });

        case ACCOUNT_STATUS.AS_CANCELLED:
          return reject({
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
            boError: ERRORS.ACCOUNT_CANCELLED,
          });
        case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
          return reject({
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
            boError: ERRORS.ACCOUNT_DISABLED,
          });

        case ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH:
          return reject({
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
            boError: ERRORS.EMAIL_NOT_CONFIRMED,
          });
        case ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH:
          if (confirmationExpires < Date.now()) {
            return reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.EMAIL_NOT_CONFIRMED,
            });
          }
      }

      if (!checkLocal) {
        return resolve(null);
      }

      /* [LOCAL POLICY] Prevent non app user to signin */
      AccountProjectProfileModel.findOne({
        account: user.id,
        project: project.id,
      })
        .then((value: AccountProjectProfileDocument) => {
          /* User not registered */
          if (!value) {
            return reject({
              boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
          }

          /*Check current profile status */
          switch (value.status) {
            case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
              return reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_BLOCKED,
              });
            case ACCOUNT_STATUS.AS_CANCELLED:
              return reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_CANCELLED,
              });
            case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
              return reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_DISABLED,
              });
          }
          resolve(true);
        })
        .catch(() => {
          reject({
            boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED,
            boError: ERRORS.ACCOUNT_NOT_REGISTERED,
          });
        });
    });
  }
}
