/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T05:03:13-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: UserAccount.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T05:37:48-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Objects, HTTP_STATUS } from '@ikoabo/core_srv';
import { DAccount } from '../models/schemas/accounts/account';
import { MAccountProject, DAccountProject } from '../models/schemas/accounts/project';
import { DProject } from '../models/schemas/projects/project';
import { ACCOUNT_STATUS } from '../models/types/account';
import { EMAIL_CONFIRMATION } from '../models/types/state';
import { ERRORS } from '../models/types/errors';

export class UserAccount {
  public static canSignin(user: DAccount, project: DProject, checkLocal?: boolean): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const confirmationPolicy = Objects.get(project, 'settings.emailConfirmation.type', EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED);
      const confirmationExpires = Objects.get(user, 'confirmationExpires', 0);
      switch (user.status) {
        case ACCOUNT_STATUS.AS_REGISTERED:
          if ((confirmationPolicy === EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED) ||
            (confirmationPolicy === EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED_BY_TIME && confirmationExpires < Date.now())
          ) {
            return reject({
              code: HTTP_STATUS.HTTP_FORBIDDEN,
              error: ERRORS.EMAIL_NOT_CONFIRMED,
            });
          }
          break;
        case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
          return reject({
            code: HTTP_STATUS.HTTP_FORBIDDEN,
            error: ERRORS.ACCOUNT_BLOCKED,
          });

        case ACCOUNT_STATUS.AS_CANCELLED:
          return reject({
            code: HTTP_STATUS.HTTP_FORBIDDEN,
            error: ERRORS.ACCOUNT_CANCELLED,
          });

        case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
          return reject({
            code: HTTP_STATUS.HTTP_FORBIDDEN,
            error: ERRORS.ACCOUNT_DISABLED,
          });

        case ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH:
          return reject({
            code: HTTP_STATUS.HTTP_FORBIDDEN,
            error: ERRORS.EMAIL_NOT_CONFIRMED,
          });

        case ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH:
          if (confirmationExpires < Date.now()) {
            return reject({
              code: HTTP_STATUS.HTTP_FORBIDDEN,
              error: ERRORS.EMAIL_NOT_CONFIRMED,
            });
          }
      }

      if (!checkLocal) {
        return resolve(null);
      }

      /* [LOCAL POLICY] Prevent non app user to signin */
      MAccountProject.findOne({})
        .then((value: DAccountProject) => {
          if (!value) {
            return reject({
              code: HTTP_STATUS.HTTP_UNAUTHORIZED,
              error: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
          }

          switch (value.status) {
            case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
              return reject({
                code: HTTP_STATUS.HTTP_FORBIDDEN,
                error: ERRORS.ACCOUNT_BLOCKED,
              });

            case ACCOUNT_STATUS.AS_CANCELLED:
              return reject({
                code: HTTP_STATUS.HTTP_FORBIDDEN,
                error: ERRORS.ACCOUNT_CANCELLED,
              });

            case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
              return reject({
                code: HTTP_STATUS.HTTP_FORBIDDEN,
                error: ERRORS.ACCOUNT_DISABLED,
              });
          }
          resolve(true);
        }).catch(() => {
          reject({
            code: HTTP_STATUS.HTTP_UNAUTHORIZED,
            error: ERRORS.ACCOUNT_NOT_REGISTERED,
          });
        });
    });
  }
}
