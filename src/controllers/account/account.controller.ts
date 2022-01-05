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
import { Objects, Tokens, Arrays, HTTP_STATUS, CRUD } from "@ecualead/server";
import { AccountAccessPolicy } from "./access.policy.controller";
import { IconCtrl } from "./icon.controller";
import { ReferralCodeCtrl } from "./referral.code.controller";
import {
  ACCOUNT_STATUS,
  TOKEN_STATUS,
  SCP_ACCOUNT_DEFAULT,
  SCP_PREVENT,
  SCP_NON_INHERITABLE,
  VALIDATION_STATUS
} from "../../constants/account.enum";
import { AccountDocument, AccountModel } from "../../models/account/account.model";
import { EMAIL_CONFIRMATION, TOKEN_TYPE, LIFETIME_TYPE } from "../../constants/project.enum";
import { IOauth2Settings } from "../../settings";
import { Emails } from "./email.controller";
import { EmailDocument } from "../../models/account/email.model";

const MAX_ATTEMPTS = 5;

export class Accounts extends CRUD<AccountDocument> {
  private static _instance: Accounts;
  private _settings: IOauth2Settings;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    super("Accounts", AccountModel);
  }

  /**
   * Setup the user account controller
   */
  public static setup(settings: IOauth2Settings) {
    if (!Accounts._instance) {
      Accounts._instance = new Accounts();
      Accounts._instance._settings = settings;
    } else {
      throw new Error("Accounts already configured");
    }
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Accounts {
    if (!Accounts._instance) {
      throw new Error("Accounts isn't configured");
    }
    return Accounts._instance;
  }

  /**
   * Fetch user account referral
   */
  public fetchReferral(referral?: string): Promise<AccountDocument | null> {
    return new Promise<AccountDocument | null>((resolve) => {
      if (!referral || !this._settings.handleReferral) {
        return resolve(null);
      }

      /* Look for the referral parent user */
      this.fetch({ "referral.code": referral })
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
   */
  public register(profile: any, referral?: string): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Get initial user status by email confirmation policy */
      const confirmationPolicy = Objects.get(
        this._settings,
        "emailPolicy.type",
        EMAIL_CONFIRMATION.NOT_REQUIRED
      );
      const status = ACCOUNT_STATUS.REGISTERED;
      let emailStatus = VALIDATION_STATUS.REGISTERED;
      switch (confirmationPolicy) {
        case EMAIL_CONFIRMATION.REQUIRED_BY_TIME:
          emailStatus = VALIDATION_STATUS.NEEDS_CONFIRM_CAN_AUTH;
          break;
        case EMAIL_CONFIRMATION.REQUIRED:
          emailStatus = VALIDATION_STATUS.NEEDS_CONFIRM_CAN_NOT_AUTH;
          break;
      }

      /* Set the new user status */
      profile["status"] = status;

      /* Set the confirmation expiration */
      if (emailStatus === VALIDATION_STATUS.NEEDS_CONFIRM_CAN_AUTH) {
        profile["confirmationExpires"] =
          Date.now() + Objects.get(this._settings, "emailPolicy.ttl", 0);
      }

      /* Initialize avatar metadata */
      const fullname = `${profile.name} ${profile.lastname1} ${profile.lastname1}`;
      profile["initials"] = IconCtrl.getInitials(fullname);
      profile["color1"] = IconCtrl.getColor(fullname);

      /* Set the new user scope using default values and application scope */
      profile["scope"] = Arrays.initialize(SCP_ACCOUNT_DEFAULT, [], SCP_NON_INHERITABLE);
      profile["scope"] = profile["scope"].filter((scope: string) => SCP_PREVENT.indexOf(scope) < 0);

      /* Register the new user */
      this.create(profile)
        .then((account: AccountDocument) => {
          /* Check if use referral is active */
          if (!this._settings.handleReferral) {
            return resolve(account);
          }

          /* Request user code creation */
          ReferralCodeCtrl.code
            .then((code: string) => {
              /* Set the user referral code */
              const userReferral: any = {
                code: code,
                parent: null,
                tree: []
              };

              /* Fetch the referral user */
              this.fetchReferral(referral).then((parent: any) => {
                /* Clear referral if the parent user is not valid */
                if (parent) {
                  userReferral.parent = parent._id;
                }

                /* Create the user referral tree */
                userReferral.tree = parent ? parent.tree : [];
                userReferral.tree.push(account._id);

                /* Update the user profile with referral tree */
                this.update({ _id: account._id }, { referral: userReferral })
                  .then((account: AccountDocument) => {
                    resolve(account);
                  })
                  .catch(() => {
                    resolve(account);
                  });
              });
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Confirm user account email address
   */
  private _doConfirmation(email: EmailDocument, token: string, resolve: any, reject: any) {
    /* Validate recover/confirm max attempts */
    if (Objects.get(email, "validation.attempts", 0) > MAX_ATTEMPTS) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.MAX_ATTEMPTS
      });
    }

    /* Validate expiration time */
    if (Objects.get(email, "validation.expire", 0) < Date.now()) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.TOKEN_EXPIRED
      });
    }

    /* Validate the confirm token */
    if (Objects.get(email, "validation.token", null) !== token) {
      return reject({
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
        boError: AUTH_ERRORS.INVALID_TOKEN
      });
    }

    Emails.shared
      .update(
        email._id,
        {
          status: VALIDATION_STATUS.CONFIRMED,
          "validation.token": null,
          "validation.status": TOKEN_STATUS.DISABLED,
          "validation.expire": 0,
          "validation.attempts": 0
        },
        null,
        { populate: ["account"] }
      )
      .then((email: EmailDocument) => {
        resolve(email);
      })
      .catch(reject);
  }

  /**
   * Confirm user email address
   */
  public confirmEmail(email: string, token: string): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
      /* Look for the target email */
      Emails.shared
        .fetchByEmail(email)
        .then((email: EmailDocument) => {
          const update: any = { $inc: { "token.attempts": 1 } };

          Emails.shared
            .update(email._id, null, update, { populate: ["account"] })
            .then((email: EmailDocument) => {
              /* Check if the user can authenticate using the user policy */
              AccountAccessPolicy.shared
                .canSignin(email.account as AccountDocument, email, false)
                .then(() => {
                  /* Check for the current email status */
                  if (email.status === VALIDATION_STATUS.CONFIRMED) {
                    /* Email address don't need to be confirmed */
                    return reject({
                      boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                      boError: AUTH_ERRORS.ACCOUNT_ALREADY_CONFIRMED
                    });
                  }

                  this._doConfirmation(email, token, resolve, reject);
                })
                .catch((err: any) => {
                  /* Reject the same error on errors diferente to email not confirmed */
                  if (!err.boError || err.boError !== AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
                    return reject(err);
                  }

                  this._doConfirmation(email, token, resolve, reject);
                });
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Change an user password
   */
  public changePassword(
    account: AccountDocument,
    oldPassword: string,
    newPassword: string,
    email: string
  ): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
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
                id: value.id
              });

              Emails.shared.fetchByEmail(email).then(resolve).catch(reject);
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
   */
  public requestRecover(email: string): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
      /* Check if the recover is enabled in the target project */
      const recoverType = Objects.get(
        this._settings,
        "emailNotifications.token",
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
      Emails.shared
        .fetchByEmail(email)
        .then((email: EmailDocument) => {
          /* Check if the user has allowed to signin */
          AccountAccessPolicy.shared
            .canSignin(email.account as AccountDocument, email, false)
            .then(() => {
              /* Prepare the recover token */
              const token = recoverType === TOKEN_TYPE.CODE ? Tokens.short : Tokens.long;

              /* Register the reset token */
              Emails.shared
                .update(
                  email._id,
                  {
                    "validation.token": token,
                    "validation.status": TOKEN_STATUS.TO_RECOVER,
                    "validation.expire": Date.now() + LIFETIME_TYPE.DAY,
                    "validation.attempts": 1
                  },
                  null,
                  {
                    populate: ["account"]
                  }
                )
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Check if the recover token is valid
   */
  public checkRecover(email: string, token: string): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
      Emails.shared
        .fetchByEmail(email)
        .then((email: EmailDocument) => {
          /* Look for the user by email */
          Emails.shared
            .update(
              {
                _id: email._id,
                "validation.token": token,
                "validation.status": TOKEN_STATUS.TO_RECOVER,
                "validation.expire": { $gt: Date.now() },
                "validation.attempts": { $lt: MAX_ATTEMPTS }
              },
              {
                "validation.status": TOKEN_STATUS.PARTIAL_CONFIRMED
              },
              null,
              { populate: ["account"] }
            )
            .then(resolve)
            .catch(() => {
              reject({
                boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                boError: AUTH_ERRORS.INVALID_CREDENTIALS
              });
            });
        })
        .catch(reject);
    });
  }

  /**
   * Recover the user account setting new password
   */
  public doRecover(email: string, token: string, password: string): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
      Emails.shared
        .fetchByEmail(email)
        .then((email: EmailDocument) => {
          const update: any = { $inc: { "validation.attempts": 1 } };
          /* Look for the user by email */
          Emails.shared
            .update(email._id, null, update, { populate: ["account"] })
            .then((email: EmailDocument) => {
              /* Check for user account policy */
              AccountAccessPolicy.shared
                .canSignin(email.account as AccountDocument, email, false)
                .then(() => {
                  /* Validate max attempts */
                  if (Objects.get(email, "validation.attempts", 1) > MAX_ATTEMPTS) {
                    reject({
                      boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                      boError: AUTH_ERRORS.MAX_ATTEMPTS
                    });
                    return;
                  }

                  /* Validate expiration time */
                  if (Objects.get(email, "validation.expire", 0) < Date.now()) {
                    return reject({
                      boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                      boError: AUTH_ERRORS.TOKEN_EXPIRED
                    });
                  }

                  /* Validate the confirm token */
                  if (
                    Objects.get(email, "validation.token", null) !== token ||
                    Objects.get(email, "validation.status", -1) !== TOKEN_STATUS.PARTIAL_CONFIRMED
                  ) {
                    return reject({
                      boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                      boError: AUTH_ERRORS.INVALID_TOKEN
                    });
                  }

                  /* Update the recover token */
                  Emails.shared
                    .update(
                      email._id,
                      {
                        "validation.token": null,
                        "validation.status": TOKEN_STATUS.DISABLED,
                        "validation.expire": 0,
                        "validation.attempts": 0
                      },
                      null,
                      {
                        populate: ["account"]
                      }
                    )
                    .then((email: EmailDocument) => {
                      /* Update user account password */
                      this.update(
                        { _id: Objects.get(email, "account._id") },
                        { password: password }
                      )
                        .then(() => {
                          resolve(email);
                        })
                        .catch(reject);
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
   */
  private _doReConfirm(email: EmailDocument, resolve: any, reject: any) {
    const recoverType = Objects.get(
      this._settings,
      "emailNotifications.token",
      TOKEN_TYPE.DISABLED
    );

    /* Prepare the account reconfirm token token */
    const token = recoverType === TOKEN_TYPE.CODE ? Tokens.short : Tokens.long;
    const update: any = {
      "validation.token": token,
      "validation.status": TOKEN_STATUS.TO_CONFIRM,
      "validation.expire": Date.now() + LIFETIME_TYPE.DAY,
      "validation.attempts": 1
    };

    /* Register the reset token */
    Emails.shared
      .update(email._id, update, null, { populate: ["account"] })
      .then(resolve)
      .catch(reject);
  }

  /**
   * Request new confirmation email
   */
  public requestConfirmation(email: string): Promise<EmailDocument> {
    return new Promise<EmailDocument>((resolve, reject) => {
      /* Check if the recover is enabled */
      const recoverType = Objects.get(
        this._settings,
        "emailNotifications.token",
        TOKEN_TYPE.DISABLED
      );
      if (recoverType === TOKEN_TYPE.DISABLED) {
        reject({
          boError: AUTH_ERRORS.RECOVER_NOT_ALLOWED,
          boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
        });
        return;
      }

      /* Look for the user by email */
      Emails.shared
        .fetchByEmail(email)
        .then((email: EmailDocument) => {
          /* Check if the user can authenticate using the user policy */
          AccountAccessPolicy.shared
            .canSignin(email.account as AccountDocument, email, false)
            .then(() => {
              /* Check for the current email status */
              if (email.status !== VALIDATION_STATUS.NEEDS_CONFIRM_CAN_AUTH) {
                /* Email address don't need to be confirmed */
                return reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.ACCOUNT_ALREADY_CONFIRMED
                });
              }

              /* Call the reconfirm action */
              this._doReConfirm(email, resolve, reject);
            })
            .catch((err: any) => {
              /* Reject the same error on errors diferente to email not confirmed */
              if (!err.boError || err.boError !== AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
                return reject(err);
              }

              /* Call the reconfirm action */
              this._doReConfirm(email, resolve, reject);
            });
        })
        .catch(reject);
    });
  }
}
