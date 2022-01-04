/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";
import { AccountDocument } from "@/models/account/account.model";
import {
  AccountExternalAuthDocument,
  AccountExternalAuthModel
} from "@/models/account/external-auth.model";
import { externalAuthToStr } from "@/utils/external-auth.util";
import { AUTH_ERRORS } from "@ikoabo/auth";
import { HTTP_STATUS, Objects } from "@ikoabo/core";
import { CRUD } from "@ikoabo/server";
import { mongoose } from "@typegoose/typegoose";
import { ExternalAuth } from "../oauth2/external-auth.controller";
import { AccountCtrl } from "./account.controller";
import async from "async";
import { AccountEmailModel } from "@/models/account/email.model";
import { EMAIL_STATUS, TOKEN_STATUS } from "@/constants/account.enum";

class AccountExternal extends CRUD<AccountExternalAuthDocument> {
  private static _instance: AccountExternal;

  private constructor() {
    super("AccountExternal", AccountExternalAuthModel);
  }

  /**
   * Create singleton class instance
   */
  public static get shared(): AccountExternal {
    if (!AccountExternal._instance) {
      AccountExternal._instance = new AccountExternal();
    }
    return AccountExternal._instance;
  }

  private _registerEmails(emails: any[], account: string, project: string): Promise<void> {
    return new Promise<void>((resolve) => {
      async.forEachLimit(
        emails,
        1,
        (email: any, cb: any) => {
          AccountCtrl.fetchByEmail(email.value, project)
            .then(() => {
              cb();
            })
            .catch((err: any) => {
              if (
                Objects.get(err, "boError.value", -1) !== AUTH_ERRORS.ACCOUNT_NOT_REGISTERED.value
              ) {
                return cb();
              }

              /* Email is not registered, so it's linked to the user account */
              AccountEmailModel.create({
                email: email.value,
                token: {
                  token: "",
                  attempts: -1,
                  status: TOKEN_STATUS.DISABLED,
                  expire: -1
                },
                description: "From social account",
                status: email.verified ? EMAIL_STATUS.CONFIRMED : EMAIL_STATUS.REGISTERED,
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
  public fetchById(
    id: string,
    type: number,
    project: string
  ): Promise<AccountExternalAuthDocument> {
    return new Promise<AccountExternalAuthDocument>((resolve, reject) => {
      /* Look for the user by externalId */
      AccountExternalAuthModel.aggregate([
        {
          $lookup: {
            from: "accounts",
            localField: "account",
            foreignField: "_id",
            as: "account"
          }
        },
        {
          $match: {
            externalId: id,
            type: type,
            "account.project": mongoose.Types.ObjectId(project)
          }
        }
      ])
        .then((accounts: any[]) => {
          /* Check if user is already registered */
          if (!accounts || accounts.length === 0) {
            return reject({
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_FOUND
            });
          }
          accounts[0].account = accounts[0].account[0];
          resolve(accounts[0]);
        })
        .catch(reject);
    });
  }

  /**
   * Create new user account with the external auth information
   *
   * @param authType
   * @param project
   * @param referral
   * @param accessToken
   * @param refreshToken
   * @param profile
   */
  public createAccount(
    authType: EXTERNAL_AUTH_TYPE,
    project: string,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<AccountExternalAuthDocument> {
    return new Promise<AccountExternalAuthDocument>((resolve, reject) => {
      this._logger.debug("Register external user account", {
        type: externalAuthToStr(authType),
        profile: profile
      });

      /* Get the current external auth schema */
      const authSchema = ExternalAuth.getByType(authType);

      /* Register the new user account */
      const lastnames = authSchema.lastname(profile).split(" ");
      AccountCtrl.registerExternalAuth(
        authType,
        {
          project: project,
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
        .then((value: AccountExternalAuthDocument) => {
          /* Register related account emails */
          this._registerEmails(
            profile.emails,
            Objects.get(value, "account.id", value.account),
            project
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
   *
   * @param authType
   * @param account
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param done
   */
  public attachAccount(
    authType: EXTERNAL_AUTH_TYPE,
    account: AccountDocument,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<AccountExternalAuthDocument> {
    return new Promise<AccountExternalAuthDocument>((resolve, reject) => {
      this._logger.debug("Attach external account", {
        account: account.id,
        type: externalAuthToStr(authType),
        profile: profile
      });

      /* Get the current external auth schema */
      const authSchema = ExternalAuth.getByType(authType);

      /* Register the external user account */
      AccountExternalAuthModel.findOneAndUpdate(
        {
          account: account._id,
          type: authType,
          externalId: authSchema.id(profile)
        },
        {
          $set: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
          }
        },
        { new: true, upsert: true }
      )
        .then((externalAuth: AccountExternalAuthDocument) => {
          externalAuth.account = account;

          /* Register related account emails */
          this._registerEmails(profile.emails, account.id, account.project.toString()).finally(
            () => {
              resolve(externalAuth);
            }
          );
        })
        .catch(reject);
    });
  }

  /**
   * Update the external account credentials for user authentication
   * @param authType
   * @param account
   * @param referral
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @returns
   */
  public updateAccount(
    authType: EXTERNAL_AUTH_TYPE,
    account: AccountExternalAuthDocument,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<AccountExternalAuthDocument> {
    return new Promise<AccountExternalAuthDocument>((resolve, reject) => {
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

      AccountExternalCtrl.update(
        { _id: account._id },
        { accessToken: accessToken, refreshToken: refreshToken, profile: profile },
        null,
        { populate: ["account"] }
      )
        .then((account: AccountExternalAuthDocument) => {
          resolve(account);
        })
        .catch(reject);
    });
  }
}

export const AccountExternalCtrl = AccountExternal.shared;
