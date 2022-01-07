/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import {
  ExternalRequestDocument,
  ExternalRequestModel
} from "../../models/oauth2/external.request.model";
import { EmailDocument } from "../../models/account/email.model";
import { ExternalAuthDocument } from "../../models/account/external.auth.model";
import { EXTERNAL_AUTH_TYPE } from "../../constants/oauth2.enum";
import { AccountDocument } from "../../models/account/account.model";
import { IExternalAuth } from "../../settings";
import { AUTH_ERRORS, OAUTH2_TOKEN_TYPE } from "@ecualead/auth";
import { Logger, HTTP_STATUS, Objects } from "@ecualead/server";
import { Request, Response, NextFunction } from "express";
import { Token } from "oauth2-server";
import passport from "passport";
import { EmailCtrl } from "../account/email.controller";
import { ExternalAuthCtrl } from "../account/external.auth.controller";
import { OAuth2ModelCtrl } from "./oauth2.model.controller";
import { ExternalAuthSchema } from "./schemas/base.controller";
import { FacebookCtrl } from "./schemas/facebook.controller";
import { GoogleCtrl } from "./schemas/google.controller";
import { TwitterCtrl } from "./schemas/twitter.controller";

export class External {
  private static _instance: External;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("OAuth:External");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): External {
    if (!External._instance) {
      External._instance = new External();
    }
    return External._instance;
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

  public doAuthenticate(request: ExternalRequestDocument, options = {}) {
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
  public authenticateSocialAccount(request: ExternalRequestDocument, user: any): Promise<Token> {
    return new Promise<Token>((resolve, reject) => {
      this._logger.debug("Authenticating user account", {
        account: Objects.get(request, "account.id")
      });

      /* Look for the user account profile */
      const client: any = Objects.get(request, "application");

      /* Prepare user account */
      const account: any = {
        id: user.account.id,
        isSocial: true
      };

      /* Generate the access token */
      OAuth2ModelCtrl.generateAccessToken(client, account, []).then((accessToken: string) => {
        /* Generate the refresh token */
        OAuth2ModelCtrl.generateRefreshToken(client, account, [])
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
            OAuth2ModelCtrl.saveToken(token, client, account)
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
    ExternalRequestModel.findOneAndRemove({ _id: request }).then(
      (value: ExternalRequestDocument) => {
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
  private _setupSocialStrategy(request: ExternalRequestDocument) {
    /* Handler strategy response function */
    const fnSocialStrategy = (
      req: Request,
      token: string,
      refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void
    ) => {
      this._doSocialNetwork(
        (request.settings as IExternalAuth).type,
        request.referral,
        req,
        token,
        refreshToken,
        profile,
        done
      );
    };

    /* Prepare the callback URI */
    const callbackURI = `${process.env.AUTH_SERVER}/v1/oauth/external/${
      (request.settings as IExternalAuth).type
    }/success`;

    /* Initialize the passport strategy for the given network type */
    const strategy: passport.Strategy = External.getByType(
      (request.settings as IExternalAuth).type
    ).setup(request.settings as IExternalAuth, callbackURI, fnSocialStrategy);

    /* Register the passport strategy */
    passport.use(request.id, strategy);
  }

  /**
   * Function to handle external account actions after authentication
   * It allows to create, attach or update user account information
   */
  private _doSocialNetwork(
    authType: EXTERNAL_AUTH_TYPE,
    referral: string,
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    /* Find the request state */
    const state = Objects.get(req, "query.state", "").toString();
    ExternalRequestModel.findById(state)
      .populate("account")
      .populate("externalAuth")
      .then((request: ExternalRequestDocument) => {
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
        const authSchema = External.getByType(authType);

        /* Look for an user with the same social network id */
        ExternalAuthCtrl.fetchById(authSchema.id(profile), authType)
          .then((account: ExternalAuthDocument) => {
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
            ExternalAuthCtrl.updateAccount(
              authType,
              account,
              referral,
              accessToken,
              refreshToken,
              profile
            )
              .then((account: ExternalAuthDocument) => {
                done(null, account);
              })
              .catch(done);
          })
          .catch((err: any) => {
            /* Check if the user is attaching the social network account to an existent account */
            if (request.account !== null) {
              return ExternalAuthCtrl.attachAccount(
                authType,
                request.account as AccountDocument,
                accessToken,
                refreshToken,
                profile
              )
                .then((account: ExternalAuthDocument) => {
                  done(null, account);
                })
                .catch(done);
            }

            /* Check if the user account can be attached by email address */
            if (profile.emails && profile.emails.length > 0) {
              return EmailCtrl.fetchByEmail(Objects.get(profile, "emails.0.value"))
                .then((email: EmailDocument) => {
                  ExternalAuthCtrl.attachAccount(
                    authType,
                    email.account as AccountDocument,
                    accessToken,
                    refreshToken,
                    profile
                  )
                    .then((account: ExternalAuthDocument) => {
                      done(null, account);
                    })
                    .catch(done);
                })
                .catch(() => {
                  /* Register new social account */
                  ExternalAuthCtrl.createAccount(
                    authType,
                    referral,
                    accessToken,
                    refreshToken,
                    profile
                  )
                    .then((account: ExternalAuthDocument) => {
                      done(null, account);
                    })
                    .catch(done);
                });
            }

            /* Register new social account */
            ExternalAuthCtrl.createAccount(authType, referral, accessToken, refreshToken, profile)
              .then((account: ExternalAuthDocument) => {
                done(null, account);
              })
              .catch(done);
          });
      })
      .catch(done);
  }
}

export const ExternalCtrl = External.shared;
