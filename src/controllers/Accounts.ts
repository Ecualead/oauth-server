/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-03T02:08:07-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: Accounts.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-05-03T18:10:34-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Logger, Token, Objects, Arrays, HTTP_STATUS } from '@ikoabo/core_srv'
import { ERRORS } from '@ikoabo/auth_srv';
import { MAccount, DAccount, IAccount } from '../models/schemas/accounts/account';
import { AccountsProject } from './AccountsProject';
import { DAccountProject } from '../models/schemas/accounts/project';
import { DProject } from '../models/schemas/projects/project';
import { DApplication } from '../models/schemas/applications/application';
import { ACCOUNT_STATUS, RECOVER_TOKEN_STATUS } from '../models/types/account';
import { EMAIL_CONFIRMATION } from '../models/types/state';
import { APPLICATION_RECOVER_TYPE } from '../models/types/application';
import { SCP_ACCOUNT_DEFAULT, SCP_NON_INHERITABLE, SCP_PREVENT } from '../models/types/scope';
import { Code } from './Code';

const AccountProjectCtrl = AccountsProject.shared;
const CodeCtrl = Code.shared;

export class Accounts {
  private static _instance: Accounts;
  private readonly _logger: Logger;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    this._logger = new Logger('Accounts');
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Accounts {
    if (!Accounts._instance) {
      Accounts._instance = new Accounts();
    }
    return Accounts._instance;
  }

  public register(data: IAccount, application: DApplication): Promise<DAccount> {
    return new Promise<DAccount>((resolve, reject) => {
      /* Find if there is an user registered with the email */
      MAccount.findOne({ email: data.email })
        .then((user: DAccount) => {
          /* Check if user is already registered */
          if (user) {
            reject({ boError: ERRORS.EMAIL_IN_USE });
            return;
          }

          /* Request user code creation */
          CodeCtrl.code.then((code: string) => {
            /* Set the user code */
            data.code = code;

            /* Get initial user status by email confirmation policy */
            const confirmationPolicy = Objects.get(application.project, 'settings.emailConfirmation.type', EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED);
            let status = ACCOUNT_STATUS.AS_REGISTERED;
            switch (confirmationPolicy) {
              case EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED_BY_TIME:
                status = ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH;
                break;
              case EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED:
                status = ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH;
                break;
            }

            /* Set the new user status */
            data.status = status;

            /* Set the confirmation expiration */
            if (status === ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
              data.confirmationExpires = Date.now() + Objects.get(application.project, 'settings.emailConfirmation.time', 0) * 3600000;
            }

            /* Set the confirmation token information if its necessary */
            const recoverType = Objects.get(application, 'settings.recover', APPLICATION_RECOVER_TYPE.APP_RT_LINK);
            if (status !== ACCOUNT_STATUS.AS_REGISTERED && recoverType !== APPLICATION_RECOVER_TYPE.APP_RT_DISABLED) {
              data.resetToken = {
                token: recoverType !== APPLICATION_RECOVER_TYPE.APP_RT_LINK ? Token.shortToken : Token.longToken,
                attempts: 0,
                status: RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
                expires: Date.now() + 86400000 // 24 hours
              };
            }

            this._logger.debug('Registering new user account', data);

            /* Register the new user */
            MAccount.create(data).then(resolve).catch(reject);
          }).catch(reject);
        }).catch(reject);
    });
  }

  public registerProject(account: DAccount, profile: any, application: DApplication): Promise<DAccountProject> {
    return new Promise<DAccountProject>((resolve, reject) => {
      /* Check if the user is currently registered into the project */
      const projectModel = AccountProjectCtrl.getModel(application.project);
      projectModel.findOne({ account: account.id })
        .then((value: DAccountProject) => {
          if (value) {
            reject({ boError: ERRORS.USER_DUPLICATED });
            return;
          }

          /* Ensure profile is valid object */
          if (!profile) {
            profile = {};
          }

          /* Set custom information */
          profile['account'] = account.id;
          profile['status'] = ACCOUNT_STATUS.AS_REGISTERED;

          /* Set the new user scope using default values and application scope */
          profile['scope'] = Arrays.force(SCP_ACCOUNT_DEFAULT, [], SCP_NON_INHERITABLE);
          profile['scope'] = profile['scope'].filter((scope: string) => SCP_PREVENT.indexOf(scope) < 0);

          /* Register the user into the current project */
          projectModel.create(profile)
            .then((value: DAccountProject) => {
              resolve(value);
            }).catch(reject);
        }).catch(reject);
    });
  }

  public getProfile(account: string, project: string | DProject): Promise<DAccountProject> {
    return new Promise<DAccountProject>((resolve, reject) => {
      /* Check if the user is currently registered into the application */
      const id = typeof project === 'string' ? project : project.id;
      const projectModel = AccountProjectCtrl.getModel(id);
      projectModel.findOne({ account: account })
        .then((value: DAccountProject) => {
          if (!value) {
            reject({ boError: ERRORS.PROFILE_NOT_FOUND });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  public changePassword(account: DAccount, oldPassword: string, newPassword: string): Promise<DAccount> {
    return new Promise<DAccount>((resolve, reject) => {
      /* Validate the old password */
      account.validPassword(oldPassword, (err, isMatch) => {
        if (err) {
          reject(err);
          return;
        }

        if (!isMatch) {
          reject({ boError: ERRORS.INVALID_CREDENTIALS });
          return;
        }

        /* Set the new password */
        MAccount.findOneAndUpdate({ _id: account.id }, {
          $set: {
            password: newPassword
          }
        }, { new: true })
          .then((value: DAccount) => {
            if (!value) {
              reject({ boError: ERRORS.ACCOUNT_NOT_REGISTERED });
              return;
            }
            this._logger.debug('User password updated', { email: value.email });
            resolve(value);
          }).catch(reject);
      });
    });
  }

  public confirmAccount(email: string, token: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      MAccount.findOneAndUpdate({ email: email }, { $inc: { 'resetToken.attempts': 1 } }, { new: true })
        .then((value: DAccount) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Validate the user status */
          switch (value.status) {
            case ACCOUNT_STATUS.AS_CANCELLED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_CANCELLED,
              });
              return;
            case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_DISABLED,
              });
              return;
            case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_BLOCKED,
              });
              return;
            case ACCOUNT_STATUS.AS_CONFIRMED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_ALREADY_CONFIRMED,
              });
              return;
          }

          /* Validate max attempts */
          if (value.resetToken.attempts > 3) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.MAX_ATTEMPTS,
            });
            return;
          }

          /* Validate expiration time */
          if (value.resetToken.expires < Date.now()) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.TOKEN_EXPIRED,
            });
            return;
          }

          MAccount.findOneAndUpdate({
            _id: value.id,
            'resetToken.token': token,
            'resetToken.status': RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
          }, {
              $set: {
                status: ACCOUNT_STATUS.AS_CONFIRMED,
                'resetToken.expires': 0,
                'resetToken.status': RECOVER_TOKEN_STATUS.RTS_DISABLED,
              },

            }, { new: true })
            .then((value: DAccount) => {
              if (!value) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                  boError: ERRORS.INVALID_TOKEN,
                });
                return;
              }
              this._logger.debug('User account confirmed', { email: email });
              resolve();
            }).catch(reject);
        }).catch(reject);
    });
  }

  public requestRecover(email: string, application: DApplication): Promise<DAccount> {
    return new Promise<DAccount>((resolve, reject) => {
      /* Check if the recover is enabled */
      const recoverType = Objects.get(application, 'settings.recover', APPLICATION_RECOVER_TYPE.APP_RT_LINK);
      if (recoverType === APPLICATION_RECOVER_TYPE.APP_RT_DISABLED) {
        reject({ boError: ERRORS.RECOVER_NOT_ALLOWED });
        return;
      }

      /* Look for the user by email */
      MAccount.findOne({
        email: email,
        status: { $gt: ACCOUNT_STATUS.AS_UNKNOWN },
      })
        .then((value: DAccount) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Prepare the reset token */
          const reset = {
            'resetToken.token': recoverType === APPLICATION_RECOVER_TYPE.APP_RT_CODE ? Token.shortToken : Token.longToken,
            'resetToken.status': RECOVER_TOKEN_STATUS.RTS_TO_RECOVER,
            'resetToken.attempts': 0,
            'resetToken.expires': Date.now() + 86400000 // 24 hours
          };

          /* Register the reset token */
          MAccount.findOneAndUpdate({ _id: value.id }, {
            $set: reset, $inc: { 'auth.resetToken.attempts': 1 }
          }, { new: true })
            .then((value: DAccount) => {
              /* Show the verification token */
              this._logger.debug('Recovery account requested', { id: value.id, email: value.email, token: value.resetToken.token });
              resolve(value);
            }).catch(reject);
        }).catch(reject);
    });
  }

  public requestConfirmation(email: string, application: DApplication): Promise<DAccount> {
    return new Promise<DAccount>((resolve, reject) => {
      /* Check if the recover is enabled */
      const recoverType = Objects.get(application, 'settings.recover', APPLICATION_RECOVER_TYPE.APP_RT_LINK);
      if (recoverType === APPLICATION_RECOVER_TYPE.APP_RT_DISABLED) {
        reject({ boError: ERRORS.RECOVER_NOT_ALLOWED });
        return;
      }

      /* Look for the user by email */
      MAccount.findOne({
        email: email,
        status: { $gt: ACCOUNT_STATUS.AS_UNKNOWN },
      })
        .then((value: DAccount) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          if (value.status !== ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_ALREADY_CONFIRMED,
            });
            return;
          }

          /* Prepare the reset token */
          const reset = {
            'resetToken.token': recoverType === APPLICATION_RECOVER_TYPE.APP_RT_CODE ? Token.shortToken : Token.longToken,
            'resetToken.status': RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
            'resetToken.attempts': 0,
            'resetToken.expires': Date.now() + 86400000 // 24 hours
          };

          /* Register the reset token */
          MAccount.findOneAndUpdate({ _id: value.id }, {
            $set: reset,
          }, { new: true })
            .then((value: DAccount) => {
              /* Show the verification token */
              this._logger.debug('Account confirmation requested', { id: value.id, email: value.email, token: value.resetToken.token });
              resolve(value);
            }).catch(reject);
        }).catch(reject);
    });
  }


  public checkRecover(email: string, token: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      MAccount.findOneAndUpdate({
        email: email,
        'resetToken.token': token,
        'resetToken.status': RECOVER_TOKEN_STATUS.RTS_TO_RECOVER,
        'resetToken.expires': { $gt: (Date.now() + 3600000) },
        'resetToken.attempts': { $lt: 3 },
      }, { $set: { 'resetToken.status': RECOVER_TOKEN_STATUS.RTS_CONFIRMED } }, { new: true })
        .then((value: DAccount) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.INVALID_CREDENTIALS,
            });
            return;
          }
          this._logger.debug('Recover token confirmed', { email: email, token: token });
          resolve();
        }).catch(reject);
    });
  }

  public doRecover(email: string, token: string, password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      MAccount.findOneAndUpdate({ email: email }, { $inc: { 'resetToken.attempts': 1 } }, { new: true })
        .then((value: DAccount) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Validate the user status */
          switch (value.status) {
            case ACCOUNT_STATUS.AS_CANCELLED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_CANCELLED,
              });
              return;
            case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_DISABLED,
              });
              return;
            case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_BLOCKED,
              });
              return;
          }

          /* Validate max attempts */
          if (value.resetToken.attempts > 3) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.MAX_ATTEMPTS,
            });
            return;
          }

          /* Validate expiration time */
          if (value.resetToken.expires < Date.now()) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.TOKEN_EXPIRED,
            });
            return;
          }

          MAccount.findOneAndUpdate({
            _id: value.id,
            'resetToken.token': token,
            'resetToken.status': RECOVER_TOKEN_STATUS.RTS_CONFIRMED,
          }, {
              $set: {
                'resetToken.expires': 0,
                'resetToken.status': RECOVER_TOKEN_STATUS.RTS_DISABLED,
                'password': password
              }
            }, { new: true })
            .then((value: DAccount) => {
              if (!value) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                  boError: ERRORS.INVALID_TOKEN,
                });
                return;
              }

              /* Check if the user is not confirmed */
              if (value.status !== ACCOUNT_STATUS.AS_CONFIRMED) {
                /* Mark the user as email confirmed */
                MAccount.findOneAndUpdate({ _id: value.id }, { $set: { status: ACCOUNT_STATUS.AS_CONFIRMED } }, { new: false })
                  .then((value: DAccount) => {
                    this._logger.debug('User account confirmed', { id: value.id, email: value.email });
                    resolve();
                  }).catch(reject);
                return;
              }
              resolve();
            }).catch(reject);
        }).catch(reject);
    });
  }
}
