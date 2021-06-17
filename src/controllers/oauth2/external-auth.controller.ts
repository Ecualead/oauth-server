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
import { OAUTH2_TOKEN_TYPE } from "@/constants/oauth2.enum";
import { EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";
import { AccountDocument } from "@/models/account/account.model";
import {
  AccountExternalAuthDocument,
  AccountExternalAuthModel
} from "@/models/account/external-auth.model";
import {
  ExternalAuthRequestDocument,
  ExternalAuthRequestModel
} from "@/models/oauth2/external-auth-request.model";
import { ProjectExternalAuthDocument } from "@/models/project/external-auth.model";
import { externalAuthToStr } from "@/utils/external-auth.util";
import { AUTH_ERRORS } from "@ikoabo/auth";
import { Logger, HTTP_STATUS, Objects } from "@ikoabo/core";
import { Request, Response, NextFunction } from "express";
import { Token } from "oauth2-server";
import passport from "passport";
import { AccountCtrl } from "../account/account.controller";
import { OAuth2ModelCtrl } from "./oauth2-model.controller";
import { ExternalAuthSchema } from "./schemas/base.controller";
import { FacebookCtrl } from "./schemas/facebook.controller";
import { GoogleCtrl } from "./schemas/google.controller";
import { TwitterCtrl } from "./schemas/twitter.controller";

class ExternalAuth {
  private static _instance: ExternalAuth;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("ExternalAuth");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): ExternalAuth {
    if (!ExternalAuth._instance) {
      ExternalAuth._instance = new ExternalAuth();
    }
    return ExternalAuth._instance;
  }

  public static getByType(type: EXTERNAL_AUTH_TYPE): ExternalAuthSchema {
    switch (type) {
      case EXTERNAL_AUTH_TYPE.FACEBOOK:
        return FacebookCtrl;
      case EXTERNAL_AUTH_TYPE.GOOGLE:
        return GoogleCtrl;
      case EXTERNAL_AUTH_TYPE.TWITTER:
        return TwitterCtrl;
    }

    throw "Invalid external auth schema";
  }

  public doAuthenticate(request: ExternalAuthRequestDocument, options = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      /* Initialize the social network strategy */
      this._setupSocialStrategy(request);

      /* Authenticate against social network */
      passport.authenticate(request.id, options, (err, user, _info) => {
        /* Check if there were some errors */
        if (err) {
          this._logger.error("Error authenticating social network", {
            error: err
          });

          /* Remove the passport strategy */
          this._clearStrategy(request.id);

          /* Check for oauth errors */
          if (err["oauthError"] || !err.code || !Number.isInteger(err.code)) {
            return next({
              boError: AUTH_ERRORS.UNKNOWN_AUTH_SERVER_ERROR,
              boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
            });
          }

          return next({
            boError: AUTH_ERRORS.INVALID_CREDENTIALS,
            boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
          });
        }

        /* When no user is given there is an unknown error */
        if (!user) {
          /* Remove the passport strategy */
          this._clearStrategy(request.id);

          return next({
            boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED,
            boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
          });
        }

        /* Store user information and call next middleware */
        req["user"] = user;
        next();
      })(req, res, next);
    };
  }

  /**
   * Perform manual social account authentication
   *
   * @param {ClientDocument} client
   * @param {AccountDocument} user
   * @returns {Promise<OAuth2Server.Token>}
   */
  public authenticateSocialAccount(request: ExternalAuthRequestDocument): Promise<Token> {
    return new Promise<Token>((resolve, reject) => {
      this._logger.debug("Authenticating user account", {
        account: Objects.get(request, "account.id")
      });

      /* Look for the user account profile */
      const client: any = Objects.get(request, "application");
      const user: any = Objects.get(request, "account");
      user["isSocial"] = true;

      /* Generate the access token */
      OAuth2ModelCtrl.generateAccessToken(client, user, []).then((accessToken: string) => {
        /* Generate the refresh token */
        OAuth2ModelCtrl.generateRefreshToken(client, user, [])
          .then((refreshToken: string) => {
            /* Prepare the authentication token */
            const token: Token = {
              accessToken: accessToken,
              accessTokenExpiresAt: new Date(
                Date.now() + (client.accessTokenLifetime ? client.accessTokenLifetime : 3600) * 1000
              ),
              refreshToken: refreshToken,
              refreshTokenExpiresAt: new Date(
                Date.now() +
                  (client.accessTokenLifetime ? client.refreshTokenLifetime : 604800) * 1000
              ),
              scope: [],
              client: client,
              user: user,
              type: OAUTH2_TOKEN_TYPE.EXTERNAL_AUTH
            };
            /* Save the generated token */
            OAuth2ModelCtrl.saveToken(token, client, user)
              .then((token: Token) => {
                resolve(token);

                /* Remove the passport strategy */
                this._clearStrategy(request.id);
              })
              .catch(reject);
          })
          .catch(reject);
      });
    });
  }

  /**
   * Clear a passport strategy
   *
   * @param request
   */
  private _clearStrategy(request: string) {
    this._logger.debug("Clear social network strategy", {
      request: request
    });

    /* Remove the social network request */
    ExternalAuthRequestModel.findOneAndRemove({ _id: request }).then(
      (value: ExternalAuthRequestDocument) => {
        if (value) {
          try {
            passport.unuse(request);
          } catch (err) {
            this._logger.error("Unknown error removing startegy", {
              request: value,
              error: err
            });
          }
        }
      }
    );
  }

  /**
   * Setup a external auth schema to authenticate the user account
   *
   * @param request External auth request information
   */
  private _setupSocialStrategy(request: ExternalAuthRequestDocument) {
    /* Handler strategy response function */
    const fnSocialStrategy = (
      req: Request,
      token: string,
      refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void
    ) => {
      this._doSocialNetwork(
        (request.externalAuth as ProjectExternalAuthDocument).type,
        Objects.get(request, "application.project"),
        request.referral,
        req,
        token,
        refreshToken,
        profile,
        done
      );
    };

    /* Prepare the callback URI */
    const callbackURI = `${process.env.AUTH_SERVER}/v1/oauth/external/${(request.externalAuth as ProjectExternalAuthDocument).id}/success?state=1`;

    /* Initialize the passport strategy for the given network type */
    const strategy: passport.Strategy = ExternalAuth.getByType(
      (request.externalAuth as ProjectExternalAuthDocument).type
    ).setup(request.externalAuth as ProjectExternalAuthDocument, callbackURI, fnSocialStrategy);

    /* Register the passport strategy */
    passport.use(request.id, strategy);
  }

  /**
   * Function to handle external account actions after authentication
   * It allows to create, attach or update user account information
   *
   * @param authType
   * @param project
   * @param referral
   * @param req
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param done
   */
  private _doSocialNetwork(
    authType: EXTERNAL_AUTH_TYPE,
    project: string,
    referral: string,
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    /* Find the request state */
    const state = Objects.get(req, "query.state", "").toString();
    ExternalAuthRequestModel.findById(state)
      .populate("account")
      .populate("externalAuth")
      .then((request: ExternalAuthRequestDocument) => {
        if (
          !request ||
          Objects.get(request, "externalAuth.type", EXTERNAL_AUTH_TYPE.UNKNOWN) !== authType
        ) {
          return done({
            boError: AUTH_ERRORS.INVALID_SOCIAL_REQUEST,
            boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
          });
        }

        /* Get the current external auth schema */
        const authSchema = ExternalAuth.getByType(authType);

        /* Look for an user with the same social network id */
        const userQuery = { type: authType, externalId: authSchema.id(profile) };
        AccountExternalAuthModel.findOne(userQuery)
          .populate({
            path: "account",
            match: {
              project: project
            }
          })
          .then((account: AccountExternalAuthDocument) => {
            /* Check if the user is not registered */
            if (!account) {
              /* Check if the user is attaching the social network account to an existent account */
              if (request.account !== null) {
                return this._attachAccount(
                  authType,
                  request.account as AccountDocument,
                  accessToken,
                  refreshToken,
                  profile,
                  done
                );
              }

              /* Register new social account */
              return this._createAccount(
                authType,
                project,
                referral,
                accessToken,
                refreshToken,
                profile,
                done
              );
            }

            /* Check requets user match with found user */
            const tmpUser: AccountDocument = request.account as AccountDocument;
            if (tmpUser !== null && tmpUser.id !== Objects.get(account, "acount.id")) {
              this._logger.error("User external account mismatch", {
                registeredAccount: tmpUser.id,
                externalAccount: Objects.get(account, "acount.id")
              });

              return done({
                boError: AUTH_ERRORS.USER_ACCOUNT_MISMATCH,
                boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
              });
            }

            /* User authentication  */
            this._updateAccount(authType, account, referral, accessToken, refreshToken, profile)
              .then((account: AccountExternalAuthDocument) => {
                done(null, account);
              })
              .catch(done);
          })
          .catch(done);
      })
      .catch(done);
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
   * @param done
   */
  private _createAccount(
    authType: EXTERNAL_AUTH_TYPE,
    project: string,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    this._logger.debug("Register external user account", {
      type: externalAuthToStr(authType)
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
      .then((account: AccountExternalAuthDocument) => {
        /* TODO XXX Add support for email and phone auto registers */
        done(null, account);
      })
      .catch(done);
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
  private _attachAccount(
    authType: EXTERNAL_AUTH_TYPE,
    account: AccountDocument,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    this._logger.debug("Attach external account", {
      account: account.id,
      type: externalAuthToStr(authType)
    });

    /* Get the current external auth schema */
    const authSchema = ExternalAuth.getByType(authType);

    /* Register the external user account */
    AccountExternalAuthModel.create({
      account: account._id,
      type: authType,
      externalId: authSchema.id(profile),
      accessToken: accessToken,
      refreshToken: refreshToken,
      profile: profile
    })
      .then((externalAuth: AccountExternalAuthDocument) => {
        /* TODO XXX Add support for email and phone auto registers */
        externalAuth.account = account;
        done(null, externalAuth);
      })
      .catch(done);
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
  private _updateAccount(
    authType: EXTERNAL_AUTH_TYPE,
    account: AccountExternalAuthDocument,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
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

      AccountExternalAuthModel.findOneAndUpdate(
        { _id: account.id },
        {
          $set: {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
          }
        },
        { new: true }
      )
        .populate({ path: "account" })
        .then((account: AccountExternalAuthDocument) => {
          if (!account) {
            return reject({
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_FOUND
            });
          }

          resolve(account);
        })
        .catch(reject);
    });
  }
}

export const ExternalAuthCtrl = ExternalAuth.shared;
