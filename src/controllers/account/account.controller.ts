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
import { Objects, Tokens, Arrays, HTTP_STATUS } from "@ikoabo/core";
import { CRUD } from "@ikoabo/server";
import { AccountAccessPolicy } from "@/controllers/account/access-policy.controller";
import { AccountIconCtrl } from "@/controllers/account/icon.controller";
import { AccountCodeCtrl } from "@/controllers/account/code.controller";
import {
  ACCOUNT_STATUS,
  TOKEN_STATUS,
  SCP_ACCOUNT_DEFAULT,
  SCP_PREVENT,
  SCP_NON_INHERITABLE,
  EMAIL_STATUS
} from "@/constants/account.enum";
import { AccountDocument, AccountModel } from "@/models/account/account.model";
import {
  EMAIL_CONFIRMATION,
  TOKEN_TYPE,
  LIFETIME_TYPE,
  EXTERNAL_AUTH_TYPE
} from "@/constants/project.enum";
import { ProjectDocument } from "@/models/project/project.model";
import { AccountEmailDocument, AccountEmailModel } from "@/models/account/email.model";
import { Request, Response, NextFunction } from "express";
import { AccountPhoneDocument, AccountPhoneModel } from "@/models/account/phone.model";
import {
  AccountExternalAuthDocument,
  AccountExternalAuthModel
} from "@/models/account/external-auth.model";

const MAX_ATTEMPTS = 5;

class Accounts extends CRUD<AccountDocument> {
  private static _instance: Accounts;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    super("Accounts", AccountModel);
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

  /**
   * Find user information by email address
   *
   * @param email
   * @param project
   * @returns
   */
  public fetchByEmail(email: string, project: ProjectDocument): Promise<AccountEmailDocument> {
    return new Promise<AccountEmailDocument>((resolve, reject) => {
      /* Look for the user by email */
      AccountEmailModel.findOne({ email: email })
        .populate({
          path: "account",
          match: {
            project: project._id
          }
        })
        .then((userEmail: AccountEmailDocument) => {
          /* Check if user is already registered */
          if (!userEmail) {
            return reject({
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_FOUND
            });
          }
          resolve(userEmail);
        })
        .catch(reject);
    });
  }

  /**
   * Check if the user email address is registered
   *
   * @param email
   * @param project
   * @param failIfExists
   * @returns
   */
  public checkEmail(email: string, project: string, failIfExists = false) {
    return (req: Request, res: Response, next: NextFunction) => {
      AccountEmailModel.findOne({ email: email })
        .populate({
          path: "account",
          match: {
            project: project
          }
        })
        .then((userEmail: AccountEmailDocument) => {
          /* Check if user is already registered */
          if (userEmail && failIfExists) {
            return next({
              boError: AUTH_ERRORS.EMAIL_IN_USE,
              boStatus: HTTP_STATUS.HTTP_4XX_CONFLICT
            });
            return;
          }
          res.locals["email"] = userEmail;
          next();
        })
        .catch(next);
    };
  }

  /**
   * Check if the user phone is registered
   *
   * @param phone
   * @param project
   * @param failIfExists
   * @returns
   */
  public checkPhone(phone: string, project: string, failIfExists = false) {
    return (req: Request, res: Response, next: NextFunction) => {
      AccountPhoneModel.findOne({ phone: phone })
        .populate({
          path: "account",
          match: {
            project: project
          }
        })
        .then((userPhone: AccountPhoneDocument) => {
          /* Check if user is already registered */
          if (userPhone && failIfExists) {
            return next({
              boError: AUTH_ERRORS.EMAIL_IN_USE,
              boStatus: HTTP_STATUS.HTTP_4XX_CONFLICT
            });
            return;
          }
          res.locals["phone"] = userPhone;
          next();
        })
        .catch(next);
    };
  }

  /**
   * Fetch user account referral
   *
   * @param project
   * @param referral
   * @returns
   */
  public fetchReferral(project: string, referral?: string): Promise<AccountDocument | null> {
    return new Promise<AccountDocument | null>((resolve) => {
      if (!referral) {
        return resolve(null);
      }

      /* Look for the referral parent user */
      this.fetch({ project: project, code: referral })
        .then((parent: AccountDocument) => {
          resolve(parent);
        })
        .catch(() => {
          resolve(null);
        });
    });
  }

  /**
   * Register new user account
   *
   * @param profile
   * @param project
   * @returns
   */
  public registerAccount(profile: any, project: ProjectDocument): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Request user code creation */
      AccountCodeCtrl.code
        .then((code: string) => {
          /* Set the user code */
          profile["code"] = code;

          /* Get initial user status by email confirmation policy */
          const confirmationPolicy = Objects.get(
            project,
            "settings.emailConfirmation.type",
            EMAIL_CONFIRMATION.NOT_REQUIRED
          );
          const status = ACCOUNT_STATUS.REGISTERED;
          let emailStatus = EMAIL_STATUS.REGISTERED;
          switch (confirmationPolicy) {
            case EMAIL_CONFIRMATION.REQUIRED_BY_TIME:
              emailStatus = EMAIL_STATUS.NEEDS_CONFIRM_EMAIL_CAN_AUTH;
              break;
            case EMAIL_CONFIRMATION.REQUIRED:
              emailStatus = EMAIL_STATUS.NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH;
              break;
          }

          /* Set the new user status */
          profile["status"] = status;

          /* Set the confirmation expiration */
          if (emailStatus === EMAIL_STATUS.NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
            profile["confirmationExpires"] =
              Date.now() + Objects.get(project, "settings.emailConfirmation.time", 0);
          }

          /* Initialize avatar metadata */
          const fullname = `${profile.name} ${profile.lastname1} ${profile.lastname1}`;
          profile["initials"] = AccountIconCtrl.getInitials(fullname);
          profile["color1"] = AccountIconCtrl.getColor(fullname);

          /* Set the new user scope using default values and application scope */
          profile["scope"] = Arrays.initialize(SCP_ACCOUNT_DEFAULT, [], SCP_NON_INHERITABLE);
          profile["scope"] = profile["scope"].filter(
            (scope: string) => SCP_PREVENT.indexOf(scope) < 0
          );

          /* Fetch the referral user */
          this.fetchReferral(project.id, profile.referral).then(
            (parent: AccountDocument | null) => {
              /* Clear referral if the parent user is not valid */
              if (!parent) {
                profile.referral = null;
              } else {
                profile["parent"] = parent._id;
              }

              /* Register the new user */
              this.create(profile)
                .then((account: AccountDocument) => {
                  /* Create the user referral tree */
                  const tree: any[] = parent ? parent.tree : [];
                  tree.push(account._id);

                  /* Update the user profile with referral tree */
                  this.update({ _id: account._id }, { tree: tree })
                    .then((account: AccountDocument) => {
                      resolve(account);
                    })
                    .catch(() => {
                      resolve(account);
                    });
                })
                .catch(reject);
            }
          );
        })
        .catch(reject);
    });
  }

  /**
   * Register user account email
   *
   * @param email
   * @param project
   * @param description
   * @param account
   * @returns
   */
  public registerEmail(
    email: string,
    project: ProjectDocument,
    description?: string,
    account?: string
  ): Promise<AccountEmailDocument> {
    return new Promise<AccountEmailDocument>((resolve, reject) => {
      /* Set the confirmation token information if its necessary */
      const tokenType = Objects.get(project, "settings.events.confirm.token", TOKEN_TYPE.LINK);

      let token = null;
      let tokenAttempts = 0;
      let tokenStatus = TOKEN_STATUS.DISABLED;
      let tokenExpires = 0;

      if (tokenType !== TOKEN_TYPE.DISABLED) {
        token = tokenType !== TOKEN_TYPE.LINK ? Tokens.short : Tokens.long;
        tokenAttempts = 0;
        tokenStatus = TOKEN_STATUS.TO_CONFIRM;
        tokenExpires = Date.now() + LIFETIME_TYPE.DAY;
      }

      /* Create the email related to the user account */
      AccountEmailModel.create({
        email: email,
        description: description,
        token: {
          token: token,
          attempts: tokenAttempts,
          status: tokenStatus,
          expire: tokenExpires
        },
        status: EMAIL_STATUS.REGISTERED,
        account: account
      })
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Register user account phone
   *
   * @param phone
   * @param description
   * @param account
   * @returns
   */
  public registerPhone(
    phone: string,
    description?: string,
    account?: string
  ): Promise<AccountPhoneDocument> {
    return new Promise<AccountPhoneDocument>((resolve, reject) => {
      AccountPhoneModel.create({
        phone: phone,
        description: description,
        status: EMAIL_STATUS.REGISTERED,
        account: account
      })
        .then(resolve)
        .catch(reject);
    });
  }

  public registerExternalAuth(
    authType: EXTERNAL_AUTH_TYPE,
    accountData: any,
    externalProfile: any,
    externalId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<AccountExternalAuthDocument> {
    return new Promise<AccountExternalAuthDocument>((resolve, reject) => {
      /* Request user code creation */
      AccountCodeCtrl.code
        .then((code: string) => {
          /* Set the user code */
          accountData["code"] = code;

          /* Set the new user status */
          accountData["status"] = ACCOUNT_STATUS.REGISTERED;

          /* Initialize avatar metadata */
          const fullname = `${accountData.name} ${accountData.lastname1} ${accountData.lastname2}`;
          accountData["initials"] = AccountIconCtrl.getInitials(fullname);
          accountData["color1"] = AccountIconCtrl.getColor(fullname);

          /* Register the new user */
          AccountModel.create(accountData)
            .then((account: AccountDocument) => {
              AccountExternalAuthModel.create({
                account: account._id,
                type: authType,
                externalId: externalId,
                accessToken: accessToken,
                refreshToken: refreshToken,
                profile: externalProfile
              })
                .then((externalAuth: AccountExternalAuthDocument) => {
                  externalAuth.account = account;
                  resolve(externalAuth);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Confirm user account email address
   * @param email
   * @param token
   * @param resolve
   * @param reject
   * @returns
   */
  private _doConfirmation(email: AccountEmailDocument, token: string, resolve: any, reject: any) {
    /* Validate recover/confirm max attempts */
    if (Objects.get(email, "token.attempts", 0) > MAX_ATTEMPTS) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.MAX_ATTEMPTS
      });
    }

    /* Validate expiration time */
    if (Objects.get(email, "token.expires", 0) < Date.now()) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.TOKEN_EXPIRED
      });
    }

    /* Validate the confirm token */
    if (Objects.get(email, "token.token", null) !== token) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.INVALID_TOKEN
      });
    }

    AccountEmailModel.findOneAndUpdate(
      { _id: email._id },
      {
        $set: {
          status: EMAIL_STATUS.CONFIRMED,
          "token.token": null,
          "token.status": TOKEN_STATUS.DISABLED,
          "token.expires": 0,
          "token.attempts": 0
        }
      },
      { new: true }
    )
      .populate({ path: "account" })
      .then((email: AccountEmailDocument) => {
        resolve(email);
      })
      .catch(reject);
  }

  /**
   * Confirm user email address
   *
   * @param email
   * @param token
   * @param project
   * @returns
   */
  public confirmEmail(
    email: string,
    token: string,
    project: ProjectDocument
  ): Promise<AccountEmailDocument> {
    return new Promise<AccountEmailDocument>((resolve, reject) => {
      const update: any = { $inc: { "token.attempts": 1 } };

      AccountEmailModel.findOneAndUpdate({ email: email }, update, { new: true })
        .populate({
          path: "account",
          match: {
            project: project._id
          }
        })
        .then((userEmail: AccountEmailDocument) => {
          /* Check if user is already registered */
          if (!userEmail) {
            return reject({
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_FOUND
            });
            return;
          }

          /* Check if the user can authenticate using the user policy */
          AccountAccessPolicy.canSignin(
            userEmail.account as AccountDocument,
            project,
            userEmail,
            false
          )
            .then(() => {
              /* Check for the current email status */
              if (userEmail.status !== EMAIL_STATUS.NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
                /* Email address don't need to be confirmed */
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.ACCOUNT_ALREADY_CONFIRMED
                });
              }

              this._doConfirmation(userEmail, token, resolve, reject);
            })
            .catch((err: any) => {
              /* Reject the same error on errors diferente to email not confirmed */
              if (!err.boError || err.boError !== AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
                return reject(err);
              }

              this._doConfirmation(userEmail, token, resolve, reject);
            });
        })
        .catch(reject);
    });
  }

  /**
   * Change an user password
   *
   * @param account
   * @param oldPassword
   * @param newPassword
   * @returns
   */
  public changePassword(
    account: AccountDocument,
    oldPassword: string,
    newPassword: string,
    email: string
  ): Promise<AccountEmailDocument> {
    return new Promise<AccountEmailDocument>((resolve, reject) => {
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
            .populate({ path: "project" })
            .then((value: AccountDocument) => {
              if (!value) {
                reject({
                  boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED,
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
                });
                return;
              }
              this._logger.debug("User password updated", {
                id: value.id
              });

              this.fetchByEmail(email, value.project as ProjectDocument)
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
        })
        .catch((err: any) => {
          this._logger.error("Invalid password validation", err);
          reject({
            boError: AUTH_ERRORS.INVALID_CREDENTIALS,
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
          });
        });
    });
  }

  /**
   * Request a recover email
   *
   * @param email
   * @param project
   * @returns
   */
  public requestRecover(email: string, project: ProjectDocument): Promise<AccountEmailDocument> {
    return new Promise<AccountEmailDocument>((resolve, reject) => {
      /* Check if the recover is enabled in the target project */
      const recoverType = Objects.get(
        project,
        "settings.events.recover.token",
        TOKEN_TYPE.DISABLED
      );
      if (recoverType === TOKEN_TYPE.DISABLED) {
        reject({
          boError: AUTH_ERRORS.RECOVER_NOT_ALLOWED,
          boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
        });
        return;
      }

      /* Look for the user by email */
      this.fetchByEmail(email, project)
        .then((userEmail: AccountEmailDocument) => {
          /* Check if the user has allowed to signin */
          AccountAccessPolicy.canSignin(
            userEmail.account as AccountDocument,
            project,
            userEmail,
            false
          )
            .then(() => {
              /* Prepare the recover token */
              const token = recoverType === TOKEN_TYPE.CODE ? Tokens.short : Tokens.long;

              const update: any = {
                $set: {
                  "token.token": token,
                  "token.status": TOKEN_STATUS.TO_RECOVER,
                  "token.expires": Date.now() + LIFETIME_TYPE.DAY,
                  "token.attempts": 1
                }
              };

              /* Register the reset token */
              AccountEmailModel.findOneAndUpdate({ _id: userEmail._id }, update, {
                new: true
              })
                .populate({ path: "account" })
                .then((userEmail: AccountEmailDocument) => {
                  resolve(userEmail);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Check if the recover token is valid
   *
   * @param email
   * @param token
   * @param project
   * @returns
   */
  public checkRecover(email: string, token: string, project: ProjectDocument): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      /* Look for the user by email */
      AccountEmailModel.findOneAndUpdate(
        {
          email: email,
          "token.token": token,
          "token.status": TOKEN_STATUS.TO_RECOVER,
          "token.expires": { $gt: Date.now() },
          "token.attempts": { $lt: MAX_ATTEMPTS }
        },
        {
          $set: {
            "token.status": TOKEN_STATUS.PARTIAL_CONFIRMED
          }
        },
        { new: true }
      )
        .populate({
          path: "account",
          match: {
            project: project._id
          }
        })
        .then((userEmail: AccountEmailDocument) => {
          /* Check if user is already registered */
          if (!userEmail) {
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.INVALID_CREDENTIALS
            });
          }
          resolve();
        })
        .catch(reject);
    });
  }

  /**
   * Recover the user account setting new password
   *
   * @param email
   * @param token
   * @param password
   * @param project
   * @returns
   */
  public doRecover(
    email: string,
    token: string,
    password: string,
    project: ProjectDocument
  ): Promise<AccountEmailDocument> {
    return new Promise<AccountEmailDocument>((resolve, reject) => {
      const update: any = { $inc: { "recover.attempts": 1 } };
      /* Look for the user by email */
      AccountEmailModel.findOneAndUpdate(
        {
          email: email
        },
        update,
        { new: true }
      )
        .populate({
          path: "account",
          match: {
            project: project._id
          }
        })
        .then((userEmail: AccountEmailDocument) => {
          /* Check if user is already registered */
          if (!userEmail) {
            return reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.INVALID_CREDENTIALS
            });
          }

          /* Check for user account policy */
          AccountAccessPolicy.canSignin(
            userEmail.account as AccountDocument,
            project,
            userEmail,
            false
          )
            .then(() => {
              /* Validate max attempts */
              if (Objects.get(userEmail, "token.attempts", 1) > MAX_ATTEMPTS) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.MAX_ATTEMPTS
                });
                return;
              }

              /* Validate expiration time */
              if (Objects.get(userEmail, "token.expires", 0) < Date.now()) {
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.TOKEN_EXPIRED
                });
              }

              /* Validate the confirm token */
              if (
                Objects.get(userEmail, "token.token", null) !== token ||
                Objects.get(userEmail, "token.status", -1) !== TOKEN_STATUS.PARTIAL_CONFIRMED
              ) {
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.INVALID_TOKEN
                });
              }

              /* Update the recover token */
              AccountEmailModel.findOneAndUpdate(
                {
                  _id: userEmail.id
                },
                {
                  $set: {
                    "token.token": null,
                    "token.status": TOKEN_STATUS.DISABLED,
                    "token.expires": 0,
                    "token.attempts": 0
                  }
                },
                {
                  new: true
                }
              )
                .populate({ path: "account" })
                .then((userEmail: AccountEmailDocument) => {
                  if (!userEmail) {
                    return reject({
                      boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                      boError: AUTH_ERRORS.INVALID_TOKEN
                    });
                  }

                  /* Update user account password */
                  this.update(
                    { _id: Objects.get(userEmail, "account._id") },
                    { password: password }
                  )
                    .then(() => {
                      resolve(userEmail);
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

  /**
   * Send new confirmation email
   *
   * @param userEmail
   * @param project
   * @param resolve
   * @param reject
   */
  private _doReConfirm(
    userEmail: AccountEmailDocument,
    project: ProjectDocument,
    resolve: any,
    reject: any
  ) {
    const recoverType = Objects.get(project, "settings.events.recover.token", TOKEN_TYPE.DISABLED);

    /* Prepare the account reconfirm token token */
    const token = recoverType === TOKEN_TYPE.CODE ? Tokens.short : Tokens.long;
    const update: any = {
      $set: {
        "token.token": token,
        "token.status": TOKEN_STATUS.TO_CONFIRM,
        "token.expires": Date.now() + LIFETIME_TYPE.DAY,
        "token.attempts": 1
      }
    };

    /* Register the reset token */
    AccountEmailModel.findOneAndUpdate({ _id: userEmail._id }, update, {
      new: true
    })
      .populate({ path: "account" })
      .then((userEmail: AccountEmailDocument) => {
        resolve(userEmail);
      })
      .catch(reject);
  }

  /**
   * Request new confirmation email
   *
   * @param email
   * @param project
   * @returns
   */
  public requestConfirmation(
    email: string,
    project: ProjectDocument
  ): Promise<AccountEmailDocument> {
    return new Promise<AccountEmailDocument>((resolve, reject) => {
      /* Check if the recover is enabled */
      const recoverType = Objects.get(
        project,
        "settings.events.recover.token",
        TOKEN_TYPE.DISABLED
      );
      if (recoverType === TOKEN_TYPE.DISABLED) {
        reject({ boError: AUTH_ERRORS.RECOVER_NOT_ALLOWED });
        return;
      }

      /* Look for the user by email */
      this.fetchByEmail(email, project)
        .then((userEmail: AccountEmailDocument) => {
          /* Check if the user can authenticate using the user policy */
          AccountAccessPolicy.canSignin(
            userEmail.account as AccountDocument,
            project,
            userEmail,
            false
          )
            .then(() => {
              /* Check for the current email status */
              if (userEmail.status !== EMAIL_STATUS.NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
                /* Email address don't need to be confirmed */
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.ACCOUNT_ALREADY_CONFIRMED
                });
              }

              /* Call the reconfirm action */
              this._doReConfirm(userEmail, project, resolve, reject);
            })
            .catch((err: any) => {
              /* Reject the same error on errors diferente to email not confirmed */
              if (!err.boError || err.boError !== AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
                return reject(err);
              }

              /* Call the reconfirm action */
              this._doReConfirm(userEmail, project, resolve, reject);
            });
        })
        .catch(reject);
    });
  }
}

export const AccountCtrl = Accounts.shared;