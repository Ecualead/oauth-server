/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { CRUD, HTTP_STATUS, Objects } from "@ecualead/server";
import { ExternalAuthDocument, ExternalAuthModel } from "../../models/account/external.auth.model";
import { ACCOUNT_STATUS, TOKEN_STATUS, VALIDATION_STATUS } from "../../constants/account.enum";
import { IOauth2Settings } from "../../settings";
import { EXTERNAL_AUTH_TYPE } from "../../constants/project.enum";
import { IconCtrl } from "./icon.controller";
import { Accounts } from "./account.controller";
import { AccountDocument } from "../../models/account/account.model";
import async from "async";
import { Emails } from "./email.controller";
import { externalAuthToStr } from "../../utils/external.auth.util";
import { AUTH_ERRORS } from "@ecualead/auth";
import { External } from "../oauth2/external.controller";

export class ExternalsAuth extends CRUD<ExternalAuthDocument> {
  private static _instance: ExternalsAuth;
  private _settings: IOauth2Settings;

  /**
   * Private constructor
   */
  private constructor() {
    super("Account:ExternalAuth", ExternalAuthModel);
  }

  /**
   * Settup the user account controller
   */
  public static setup(settings: IOauth2Settings) {
    if (!ExternalsAuth._instance) {
      ExternalsAuth._instance = new ExternalsAuth();
      ExternalsAuth._instance._settings = settings;
    } else {
      throw new Error("ExternalsAuth already configured");
    }
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): ExternalsAuth {
    if (!ExternalsAuth._instance) {
      throw new Error("ExternalsAuth isn't configured");
    }
    return ExternalsAuth._instance;
  }

  public register(
    authType: EXTERNAL_AUTH_TYPE,
    accountData: any,
    externalProfile: any,
    externalId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<ExternalAuthDocument> {
    return new Promise<ExternalAuthDocument>((resolve, reject) => {
      /* Set the new user status */
      accountData["status"] = ACCOUNT_STATUS.REGISTERED;

      /* Initialize avatar metadata */
      const fullname = `${accountData.name} ${accountData.lastname1} ${accountData.lastname2}`;
      accountData["initials"] = IconCtrl.getInitials(fullname);
      accountData["color1"] = IconCtrl.getColor(fullname);

      /* Register the new user */
      Accounts.shared
        .create(accountData)
        .then((account: AccountDocument) => {
          this.create({
            account: account._id,
            type: authType,
            externalId: externalId,
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: externalProfile
          })
            .then((externalAuth: ExternalAuthDocument) => {
              externalAuth.account = account;
              resolve(externalAuth);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  private _registerEmails(emails: any[], account: string): Promise<void> {
    return new Promise<void>((resolve) => {
      async.forEachLimit(
        emails,
        1,
        (email: any, cb: any) => {
          Emails.shared
            .fetchByEmail(email.value)
            .then(() => {
              cb();
            })
            .catch((err: any) => {
              /* Email is not registered, so it's linked to the user account */
              Emails.shared
                .create({
                  email: email.value,
                  validation: {
                    token: "",
                    attempts: -1,
                    status: TOKEN_STATUS.DISABLED,
                    expire: -1
                  },
                  status: email.verified
                    ? VALIDATION_STATUS.CONFIRMED
                    : VALIDATION_STATUS.REGISTERED,
                  account: account
                })
                //.catch(reject)
                .finally(() => {
                  cb();
                });
            });
        },
        (err: any) => {
          resolve();
        }
      );
    });
  }

  /**
   * Find external user account by ID
   *
   * @param id
   * @param type
   * @param project
   * @returns
   */
  public fetchById(id: string, type: number): Promise<ExternalAuthDocument> {
    return new Promise<ExternalAuthDocument>((resolve, reject) => {
      this.fetch({ externalId: id, type: type }, { populate: ["account"] })
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Create new user account with the external auth information
   */
  public createAccount(
    authType: EXTERNAL_AUTH_TYPE,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<ExternalAuthDocument> {
    return new Promise<ExternalAuthDocument>((resolve, reject) => {
      this._logger.debug("Register external user account", {
        type: externalAuthToStr(authType),
        profile: profile
      });

      /* Get the current external auth schema */
      const authSchema = External.getByType(authType);

      /* Register the new user account */
      const lastnames = authSchema.lastname(profile).split(" ");
      this.register(
        authType,
        {
          name: authSchema.name(profile),
          lastname1: lastnames.length > 0 ? lastnames[0] : "",
          lastname2: lastnames.length > 1 ? lastnames[1] : "",
          referral: referral
        },
        profile,
        authSchema.id(profile),
        accessToken,
        refreshToken
      )
        .then((value: ExternalAuthDocument) => {
          /* Register related account emails */
          this._registerEmails(
            profile.emails,
            Objects.get(value, "account.id", value.account)
          ).finally(() => {
            resolve(value);
          });
        })
        .catch(reject);
    });
  }

  /**
   * Attach a external account to an existent user account
   * Target user account is extracted from request token
   */
  public attachAccount(
    authType: EXTERNAL_AUTH_TYPE,
    account: AccountDocument,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<ExternalAuthDocument> {
    return new Promise<ExternalAuthDocument>((resolve, reject) => {
      this._logger.debug("Attach external account", {
        account: account.id,
        type: externalAuthToStr(authType),
        profile: profile
      });

      /* Get the current external auth schema */
      const authSchema = External.getByType(authType);

      /* Register the external user account */
      this.update(
        {
          account: account._id,
          type: authType,
          externalId: authSchema.id(profile)
        },
        {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        },
        null,
        { upsert: true }
      )
        .then((externalAuth: ExternalAuthDocument) => {
          externalAuth.account = account;

          /* Register related account emails */
          this._registerEmails(profile.emails, account.id).finally(() => {
            resolve(externalAuth);
          });
        })
        .catch(reject);
    });
  }

  /**
   * Update the external account credentials for user authentication
   */
  public updateAccount(
    authType: EXTERNAL_AUTH_TYPE,
    account: ExternalAuthDocument,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<ExternalAuthDocument> {
    return new Promise<ExternalAuthDocument>((resolve, reject) => {
      this._logger.debug("Store external auth credentials", {
        account: account.id,
        type: externalAuthToStr(authType),
        referral: referral
      });

      /* External auth mismatch */
      if (account.type !== authType) {
        return reject({
          boError: AUTH_ERRORS.USER_SOCIAL_MISMATCH,
          boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
        });
      }

      this.update(
        account._id,
        { accessToken: accessToken, refreshToken: refreshToken, profile: profile },
        null,
        { populate: ["account"] }
      )
        .then(resolve)
        .catch(reject);
    });
  }
}
