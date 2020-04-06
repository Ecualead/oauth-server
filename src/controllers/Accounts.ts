/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-03T02:08:07-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: Accounts.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-06T00:04:45-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Logger, Token, Objects, Arrays } from '@ikoabo/core_srv'
import { MAccount, DAccount, IAccount } from '../models/schemas/accounts/account';
import { AccountsProject } from './AccountsProject';
import { DAccountProject } from '../models/schemas/accounts/project';
import { DProject } from '../models/schemas/projects/project';
import { DApplication } from '../models/schemas/applications/application';
import { ACCOUNT_STATUS, RECOVER_TOKEN_STATUS } from '../models/types/account';
import { EMAIL_CONFIRMATION } from '../models/types/state';
import { APPLICATION_RECOVER_TYPE } from '../models/types/application';
import { SCP_ACCOUNT_DEFAULT, SCP_NON_INHERITABLE, SCP_PREVENT } from '../models/types/scope';
import { ERRORS } from '../models/types/errors';

const AccountProjectCtrl = AccountsProject.shared;

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
            reject({ error: ERRORS.EMAIL_IN_USE });
            return;
          }

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
          const recoverType = application.settings.recover;
          if (status !== ACCOUNT_STATUS.AS_REGISTERED && recoverType !== APPLICATION_RECOVER_TYPE.APP_RT_DISABLED) {
            data.resetToken = {
              token: recoverType !== APPLICATION_RECOVER_TYPE.APP_RT_LINK ? Token.shortToken : Token.longToken,
              attempts: 0,
              status: RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
              expires: Date.now() + 86400000 // 24 hours
            };
          }

          /* Register the new user */
          MAccount.create(data).then(resolve).catch(reject);
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
            reject({ error: ERRORS.USER_DUPLICATED });
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
          profile['scope'] = Arrays.force(SCP_ACCOUNT_DEFAULT, application.scope, SCP_NON_INHERITABLE);
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
            reject({ error: ERRORS.PROFILE_NOT_FOUND });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }
}
