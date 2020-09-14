/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AUTH_ERRORS } from "@ikoabo/auth";
import { Objects, Tokens, Arrays, HTTP_STATUS } from "@ikoabo/core";
import { CRUD } from "@ikoabo/server";
import { AccountAccessPolicy } from "@/Accounts/controllers/account.access.policy.controller";
import { AccountIconCtrl } from "@/Accounts/controllers/account.icon.controller";
import { AccountCodeCtrl } from "@/Accounts/controllers/accounts.code.controller";
import {
  ACCOUNT_STATUS,
  RECOVER_TOKEN_STATUS,
  SCP_ACCOUNT_DEFAULT,
  SCP_PREVENT,
  SCP_NON_INHERITABLE,
  EMAIL_STATUS
} from "@/Accounts/models/accounts.enum";
import { AccountDocument, AccountModel } from "@/Accounts/models/accounts.model";
import {
  AccountProjectProfileDocument,
  AccountProjectProfileModel
} from "@/Accounts/models/accounts.projects.model";
import { AccountTreeModel, AccountTreeDocument } from "@/Accounts/models/accounts.tree.model";
import { ApplicationDocument } from "@/Applications/models/applications.model";
import {
  PROJECT_EMAIL_CONFIRMATION,
  PROJECT_RECOVER_TYPE,
  PROJECT_LIFETIME_TYPES
} from "@/Projects/models/projects.enum";
import { ProjectDocument } from "@/Projects/models/projects.model";
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";
import { SocialNetworkCredential } from "@/SocialNetworks/models/social.networks.model";

const MAX_ATTEMPTS = 5;

class Accounts extends CRUD<AccountDocument> {
  private static _instance: Accounts;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    super("Accounts", AccountModel, "account");
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

  public register(data: any, application: ApplicationDocument): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Find if there is an user registered with the email */
      AccountModel.findOne({ "emails.email": data.email })
        .then((user: AccountDocument) => {
          /* Check if user is already registered */
          if (user) {
            reject({ boError: AUTH_ERRORS.EMAIL_IN_USE });
            return;
          }

          /* Request user code creation */
          AccountCodeCtrl.code
            .then((code: string) => {
              /* Set the user code */
              data.code = code;

              /* Get initial user status by email confirmation policy */
              const confirmationPolicy = Objects.get(
                application.project,
                "settings.emailConfirmation.type",
                PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED
              );
              const status = ACCOUNT_STATUS.AS_REGISTERED;
              let emailStatus = EMAIL_STATUS.ES_REGISTERED;
              switch (confirmationPolicy) {
                case PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED_BY_TIME:
                  emailStatus = EMAIL_STATUS.ES_NEEDS_CONFIRM_EMAIL_CAN_AUTH;
                  break;
                case PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED:
                  emailStatus = EMAIL_STATUS.ES_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH;
                  break;
              }

              /* Set the new user status */
              data.status = status;

              /* Set the confirmation expiration */
              if (emailStatus === EMAIL_STATUS.ES_NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
                data.confirmationExpires =
                  Date.now() +
                  Objects.get(application.project, "settings.emailConfirmation.time", 0);
              }

              /* Set the confirmation token information if its necessary */
              const recoverType = Objects.get(
                application.project,
                "settings.recover",
                PROJECT_RECOVER_TYPE.RT_LINK
              );

              let token = null;
              let tokenAttempts = 0;
              let tokenStatus = RECOVER_TOKEN_STATUS.RTS_DISABLED;
              let tokenExpires = 0;

              if (
                emailStatus !== EMAIL_STATUS.ES_REGISTERED &&
                recoverType !== PROJECT_RECOVER_TYPE.RT_DISABLED
              ) {
                token = recoverType !== PROJECT_RECOVER_TYPE.RT_LINK ? Tokens.short : Tokens.long;
                tokenAttempts = 0;
                tokenStatus = RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM;
                tokenExpires = Date.now() + PROJECT_LIFETIME_TYPES.LT_24HOURS;
              }

              /* Set the registration email information */
              data.emails = [
                {
                  email: data.email,
                  status: emailStatus,
                  confirm: {
                    token: token,
                    status: tokenStatus,
                    expires: tokenExpires,
                    attempts: tokenAttempts
                  }
                }
              ];

              /* Initialize avatar metadata */
              const fullname = `${data.name} ${data.lastname}`;
              data.initials = AccountIconCtrl.getInitials(fullname);
              data.color1 = AccountIconCtrl.getColor(fullname);

              this._logger.debug("Registering new user account", data);

              /* Register the new user */
              AccountModel.create(data).then(resolve).catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public registerSocial(
    data: any,
    socialType: SOCIAL_NETWORK_TYPES,
    profile: any
  ): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Request user code creation */
      AccountCodeCtrl.code
        .then((code: string) => {
          /* Set the user code */
          data.code = code;

          /* Set the new user status */
          data.status = ACCOUNT_STATUS.AS_REGISTERED;

          /* Set the registration email information */
          data.emails = [];

          /* If mail is set then add to account */
          if (data.email) {
            data.emails.push({
              email: data.email,
              status: EMAIL_STATUS.ES_REGISTERED,
              confirm: {
                status: RECOVER_TOKEN_STATUS.RTS_DISABLED
              }
            });
          }

          /* Set social network profile information */
          data.social = [
            {
              type: socialType,
              profile: profile
            }
          ];
          /* Initialize avatar metadata */
          const fullname = `${data.name} ${data.lastname}`;
          data.initials = AccountIconCtrl.getInitials(fullname);
          data.color1 = AccountIconCtrl.getColor(fullname);

          this._logger.debug("Registering new user account from social network", data);

          /* Register the new user */
          AccountModel.create(data).then(resolve).catch(reject);
        })
        .catch(reject);
    });
  }

  public createUserProfile(
    account: AccountDocument,
    project: string,
    referral: string
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      /* Check if the user is currently registered into the project */
      AccountProjectProfileModel.findOne({
        account: account.id,
        project: project
      })
        .then((value: AccountProjectProfileDocument) => {
          if (value) {
            reject({ boError: AUTH_ERRORS.USER_DUPLICATED });
            return;
          }

          /* Initialize the profile */
          const profile = {
            account: account._id,
            project: project as any,
            status: ACCOUNT_STATUS.AS_REGISTERED,
            referral: referral,
            scope: Arrays.initialize(SCP_ACCOUNT_DEFAULT, [], SCP_NON_INHERITABLE)
          };

          /* Set the new user scope using default values and application scope */
          profile["scope"] = profile["scope"].filter(
            (scope: string) => SCP_PREVENT.indexOf(scope) < 0
          );

          /* Register the user into the current project */
          AccountProjectProfileModel.findOneAndUpdate(
            { project: project, account: account._id },
            { $set: profile },
            { upsert: true, new: true }
          )
            .populate("project")
            .populate("account")
            .then((value: AccountProjectProfileDocument) => {
              /* Look for the referral parent user */
              AccountTreeModel.findOne({ project: project, code: referral })
                .then((parent: AccountTreeDocument) => {
                  /* Initialize user referral tree */
                  const tree: any[] = parent ? parent.tree : [];
                  tree.push(account._id);

                  /* Register the user referral tree */
                  AccountTreeModel.create({
                    project: project,
                    account: account._id,
                    code: account.code,
                    tree: tree
                  }).finally(() => {
                    resolve(value);
                  });
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public createSocialProfile(
    account: AccountDocument,
    project: string,
    credentials: SocialNetworkCredential,
    referral?: string
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      /* Check if the user is currently registered into the project */
      AccountProjectProfileModel.findOne({
        account: account.id,
        project: project
      })
        .then((value: AccountProjectProfileDocument) => {
          if (value) {
            reject({ boError: AUTH_ERRORS.USER_DUPLICATED });
            return;
          }

          /* Initialize the profile */
          const profile = {
            account: account._id,
            project: project as any,
            status: ACCOUNT_STATUS.AS_REGISTERED,
            referral: referral,
            scope: Arrays.initialize(SCP_ACCOUNT_DEFAULT, [], SCP_NON_INHERITABLE),
            social: [credentials]
          };

          /* Set the new user scope using default values and application scope */
          profile["scope"] = profile["scope"].filter(
            (scope: string) => SCP_PREVENT.indexOf(scope) < 0
          );

          /* Register the user into the current project */
          AccountProjectProfileModel.findOneAndUpdate(
            { project: project, account: account._id },
            { $set: profile },
            { upsert: true, new: true }
          )
            .populate("project")
            .populate("account")
            .then((value: AccountProjectProfileDocument) => {
              /* Look for the referral parent user */
              AccountTreeModel.findOne({ project: project, code: referral })
                .then((parent: AccountTreeDocument) => {
                  /* Initialize user referral tree */
                  const tree: any[] = parent ? parent.tree : [];
                  tree.push(account._id);

                  /* Register the user referral tree */
                  AccountTreeModel.create({
                    project: project,
                    account: account._id,
                    code: account.code,
                    tree: tree
                  }).finally(() => {
                    resolve(value);
                  });
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public changePassword(
    account: AccountDocument,
    oldPassword: string,
    newPassword: string
  ): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Validate the old password */
      account
        .validPassword(oldPassword)
        .then(() => {
          /* Set the new password */
          AccountModel.findOneAndUpdate(
            { _id: account.id },
            {
              $set: {
                password: newPassword
              }
            },
            { new: true }
          )
            .then((value: AccountDocument) => {
              if (!value) {
                reject({
                  boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED,
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
                });
                return;
              }
              this._logger.debug("User password updated", {
                email: value.email
              });
              resolve(value);
            })
            .catch(reject);
        })
        .catch((err: any) => {
          this._logger.error("Invalid password validation", err);
          reject({ boError: AUTH_ERRORS.INVALID_CREDENTIALS });
        });
    });
  }

  private _doConfirmation(
    email: string,
    token: string,
    account: AccountDocument,
    project: ProjectDocument,
    resolve: any,
    reject: any
  ) {
    /* Validate recover/confirm max attempts */
    if (account.recover.attempts > MAX_ATTEMPTS) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.MAX_ATTEMPTS
      });
    }

    /* Get the user email settings */
    const accountEmail = account.locateEmail(email);
    if (!accountEmail) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.INVALID_TOKEN
      });
    }

    /* Validate expiration time */
    if (accountEmail.confirm.expires < Date.now()) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.TOKEN_EXPIRED
      });
    }

    /* Validate the confirm token */
    if (accountEmail.confirm.token !== token) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.INVALID_TOKEN
      });
    }

    /* Update the confirm account status */
    AccountModel.findOneAndUpdate(
      {
        _id: account._id,
        "emails.email": email,
        "emails.confirm.token": token,
        "emails.confirm.status": RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM
      },
      {
        $set: {
          "emails.$[element].status": EMAIL_STATUS.ES_CONFIRMED,
          "emails.$[element].confirm.token": null,
          "emails.$[element].confirm.status": RECOVER_TOKEN_STATUS.RTS_DISABLED,
          "emails.$[element].confirm.expires": 0,
          "emails.$[element].confirm.attempts": 0
        }
      },
      {
        new: true,
        arrayFilters: [{ "element.email": email, "element.confirm.token": token }]
      }
    )
      .then((account: AccountDocument) => {
        if (!account) {
          reject({
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
            boError: AUTH_ERRORS.INVALID_TOKEN
          });
          return;
        }

        /* Fetch the user account profile */
        AccountProjectProfileModel.findOne({
          project: project._id,
          account: account._id
        })
          .populate("account")
          .populate("project")
          .then((profile: AccountProjectProfileDocument) => {
            if (!profile) {
              reject({
                boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                boError: AUTH_ERRORS.INVALID_TOKEN
              });
              return;
            }

            this._logger.debug("User account confirmed", {
              email: email
            });
            resolve(profile);
          })
          .catch(reject);
      })
      .catch(reject);
  }

  public confirmAccount(
    email: string,
    token: string,
    project: ProjectDocument
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      const update: any = { $inc: { "recover.attempts": 1 } };
      AccountModel.findOneAndUpdate({ "emails.email": email }, update, {
        new: true
      })
        .then((account: AccountDocument) => {
          if (!account) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED
            });
            return;
          }

          /* Check if the user can authenticate using the user policy */
          AccountAccessPolicy.canSignin(account, project, email, false, true)
            .then(() => {
              /* Get the current user email */
              const accountEmail = account.locateEmail(email);

              /* Check for the current email status */
              if (accountEmail.status !== EMAIL_STATUS.ES_NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
                /* Email address don't need to be confirmed */
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.ACCOUNT_ALREADY_CONFIRMED
                });
              }

              this._doConfirmation(email, token, account, project, resolve, reject);
            })
            .catch((err: any) => {
              /* Reject the same error on errors diferente to email not confirmed */
              if (!err.boError || err.boError !== AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
                return reject(err);
              }

              this._doConfirmation(email, token, account, project, resolve, reject);
            });
        })
        .catch(reject);
    });
  }

  public requestRecover(email: string, project: ProjectDocument): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Check if the recover is enabled in the target project */
      const recoverType = Objects.get(
        project,
        "settings.recover",
        PROJECT_RECOVER_TYPE.RT_DISABLED
      );
      if (recoverType === PROJECT_RECOVER_TYPE.RT_DISABLED) {
        reject({ boError: AUTH_ERRORS.RECOVER_NOT_ALLOWED });
        return;
      }

      /* Look for the user by email */
      AccountModel.findOne({
        "emails.email": email
      })
        .then((account: AccountDocument) => {
          if (!account) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED
            });
            return;
          }

          /* Check if the user has allowed to signin */
          AccountAccessPolicy.canSignin(account, project, email, false, true)
            .then(() => {
              /* Prepare the recover token */
              const token =
                recoverType === PROJECT_RECOVER_TYPE.RT_CODE ? Tokens.short : Tokens.long;
              const update: any = {
                $set: {
                  "emails.$[element].confirm.token": token,
                  "emails.$[element].confirm.status": RECOVER_TOKEN_STATUS.RTS_TO_RECOVER,
                  "emails.$[element].confirm.expires":
                    Date.now() + PROJECT_LIFETIME_TYPES.LT_24HOURS,
                  "emails.$[element].confirm.attempts": 1
                }
              };

              /* Register the reset token */
              AccountModel.findOneAndUpdate({ _id: account._id }, update, {
                new: true,
                arrayFilters: [{ "element.email": email }]
              })
                .then((account: AccountDocument) => {
                  /* Look for the user project related profile */
                  AccountProjectProfileModel.findOne({
                    project: project,
                    account: account.id
                  })
                    .populate("account")
                    .populate("project")
                    .then((profile: AccountProjectProfileDocument) => {
                      this._logger.debug("Recovery account requested", {
                        id: account.id,
                        email: account.email,
                        token: token
                      });
                      resolve(profile);
                    })
                    .catch(reject);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public checkRecover(email: string, token: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      AccountModel.findOneAndUpdate(
        {
          "emails.email": email,
          "emails.confirm.token": token,
          "emails.confirm.status": RECOVER_TOKEN_STATUS.RTS_TO_RECOVER,
          "emails.confirm.expires": { $gt: Date.now() },
          "emails.confirm.attempts": { $lt: MAX_ATTEMPTS }
        },
        {
          $set: {
            "emails.$[element].confirm.status": RECOVER_TOKEN_STATUS.RTS_CONFIRMED
          }
        },
        {
          new: true,
          arrayFilters: [{ "element.email": email }]
        }
      )
        .then((account: AccountDocument) => {
          if (!account) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.INVALID_CREDENTIALS
            });
            return;
          }
          this._logger.debug("Recover token confirmed", {
            email: email,
            token: token
          });
          resolve();
        })
        .catch(reject);
    });
  }

  public doRecover(
    email: string,
    token: string,
    password: string,
    project: ProjectDocument
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      const update: any = { $inc: { "recover.attempts": 1 } };
      AccountModel.findOneAndUpdate({ "emails.email": email }, update, {
        new: true
      })
        .then((account: AccountDocument) => {
          if (!account) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED
            });
            return;
          }

          /* Check for user account policy */
          AccountAccessPolicy.canSignin(account, project, email, false, true)
            .then(() => {
              /* Validate max attempts */
              if (account.recover.attempts > MAX_ATTEMPTS) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.MAX_ATTEMPTS
                });
                return;
              }

              /* Get the user email settings */
              const accountEmail = account.locateEmail(email);
              if (!accountEmail) {
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.INVALID_TOKEN
                });
              }

              /* Validate expiration time */
              if (accountEmail.confirm.expires < Date.now()) {
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.TOKEN_EXPIRED
                });
              }

              /* Validate the confirm token */
              if (
                accountEmail.confirm.token !== token ||
                accountEmail.confirm.status !== RECOVER_TOKEN_STATUS.RTS_CONFIRMED
              ) {
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.INVALID_TOKEN
                });
              }

              /* Update the user account and set the new password */
              AccountModel.findOneAndUpdate(
                {
                  _id: account.id
                },
                {
                  $set: {
                    "emails.$[element].confirm.token": null,
                    "emails.$[element].confirm.status": RECOVER_TOKEN_STATUS.RTS_DISABLED,
                    "emails.$[element].confirm.expires": 0,
                    "emails.$[element].confirm.attempts": 0,
                    password: password
                  }
                },
                {
                  new: true,
                  arrayFilters: [{ "element.email": email, "element.confirm.token": token }]
                }
              )
                .then((account: AccountDocument) => {
                  if (!account) {
                    return reject({
                      boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                      boError: AUTH_ERRORS.INVALID_TOKEN
                    });
                  }

                  /* Look for the user project profile */
                  AccountProjectProfileModel.findOne({
                    project: project._id,
                    account: account._id
                  })
                    .populate("account")
                    .populate("project")
                    .then((profile: AccountProjectProfileDocument) => {
                      this._logger.debug("User account recovered", {
                        id: account.id,
                        email: account.email
                      });
                      resolve(profile);
                    })
                    .catch(reject);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  private _doReConfirm(
    email: string,
    account: AccountDocument,
    project: ProjectDocument,
    resolve: any,
    reject: any
  ) {
    const recoverType = Objects.get(project, "settings.recover", PROJECT_RECOVER_TYPE.RT_DISABLED);

    /* Prepare the account reconfirm token token */
    const token = recoverType === PROJECT_RECOVER_TYPE.RT_CODE ? Tokens.short : Tokens.long;
    const update: any = {
      $set: {
        "emails.$[element].confirm.token": token,
        "emails.$[element].confirm.status": RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
        "emails.$[element].confirm.expires": Date.now() + PROJECT_LIFETIME_TYPES.LT_24HOURS,
        "emails.$[element].confirm.attempts": 1
      }
    };

    /* Register the reset token */
    AccountModel.findOneAndUpdate({ _id: account._id }, update, {
      new: true,
      arrayFilters: [{ "element.email": email }]
    })
      .then((account: AccountDocument) => {
        /* Look for the user project related profile */
        AccountProjectProfileModel.findOne({
          project: project,
          account: account.id
        })
          .populate("account")
          .populate("project")
          .then((profile: AccountProjectProfileDocument) => {
            this._logger.debug("ReConfirm account email address requested", {
              id: account.id,
              email: account.email,
              token: token
            });
            resolve(profile);
          })
          .catch(reject);
      })
      .catch(reject);
  }

  public requestConfirmation(
    email: string,
    project: ProjectDocument
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      /* Check if the recover is enabled */
      const recoverType = Objects.get(
        project,
        "settings.recover",
        PROJECT_RECOVER_TYPE.RT_DISABLED
      );
      if (recoverType === PROJECT_RECOVER_TYPE.RT_DISABLED) {
        reject({ boError: AUTH_ERRORS.RECOVER_NOT_ALLOWED });
        return;
      }

      /* Look for the user by email */
      AccountModel.findOne({
        "emails.email": email
      })
        .then((account: AccountDocument) => {
          if (!account) {
            /* User always exists, this error should never occurr */
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED
            });
          }

          /* Check if the user can authenticate using the user policy */
          AccountAccessPolicy.canSignin(account, project, email, false, true)
            .then(() => {
              /* Get the current user email */
              const accountEmail = account.locateEmail(email);

              /* Check for the current email status */
              if (accountEmail.status !== EMAIL_STATUS.ES_NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
                /* Email address don't need to be confirmed */
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.ACCOUNT_ALREADY_CONFIRMED
                });
              }

              /* Call the reconfirm action */
              this._doReConfirm(email, account, project, resolve, reject);
            })
            .catch((err: any) => {
              /* Reject the same error on errors diferente to email not confirmed */
              if (!err.boError || err.boError !== AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
                return reject(err);
              }

              /* Call the reconfirm action */
              this._doReConfirm(email, account, project, resolve, reject);
            });
        })
        .catch(reject);
    });
  }

  public getProfile(
    account: string,
    project: string | ProjectDocument
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      /* Ensure that user profile exists on the given project */
      const id = typeof project === "string" ? project : project.id;
      AccountProjectProfileModel.findOne({ project: id, account: account })
        .then((value: AccountProjectProfileDocument) => {
          if (!value) {
            AccountCtrl.fetch(account)
              .then((account: AccountDocument) => {
                this.createUserProfile(account, id, null)
                  .then((profile: AccountProjectProfileDocument) => {
                    resolve(profile);
                  })
                  .catch(reject);
              })
              .catch(reject);
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }
}

export const AccountCtrl = Accounts.shared;
