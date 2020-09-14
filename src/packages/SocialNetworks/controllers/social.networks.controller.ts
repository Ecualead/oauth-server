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
import { Logger, HTTP_STATUS, Objects } from "@ikoabo/core";
import { Request, Response, NextFunction } from "express";
import { Token } from "oauth2-server";
import passport from "passport";
import { AccountCtrl } from "@/Accounts/controllers/accounts.controller";
import { AccountModel, AccountDocument } from "@/Accounts/models/accounts.model";
import {
  AccountProjectProfileDocument,
  AccountProjectProfileModel
} from "@/Accounts/models/accounts.projects.model";
import { OAuth2ModelCtrl } from "@/OAuth2/controllers/oauth2.model.controller";
import { OAUTH2_TOKEN_TYPE } from "@/OAuth2/models/oauth2.enum";
import { SocialNetworkStrategy } from "@/SocialNetworks/controllers/strategies/base.strategy.controller";
import { SocialNetworkStrategyFactory } from "@/SocialNetworks/controllers/strategies/strategy.factory.controller";
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";
import {
  socialNetworkToStr,
  SocialNetworkCredential
} from "@/SocialNetworks/models/social.networks.model";
import {
  SocialNetworkRequestDocument,
  SocialNetworkRequestModel
} from "@/SocialNetworks/models/social.networks.request.model";

class SocialNetwork {
  private static _instance: SocialNetwork;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("SocialNetwork");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): SocialNetwork {
    if (!SocialNetwork._instance) {
      SocialNetwork._instance = new SocialNetwork();
    }
    return SocialNetwork._instance;
  }

  public doAuthenticate(socialNetwork: SocialNetworkRequestDocument, options = {}) {
    return (req: Request, res: Response, next: NextFunction) => {
      /* Initialize the social network strategy */
      this._setupSocialStrategy(socialNetwork);

      /* Authenticate against social network */
      passport.authenticate(socialNetwork.id, options, (err, user, _info) => {
        /* Check if there were some errors */
        if (err) {
          this._logger.error("Error authenticating social network", {
            error: err
          });

          /* Remove the passport strategy */
          this._clearStrategy(socialNetwork.id);

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
          this._clearStrategy(socialNetwork.id);

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
  public authenticateSocialAccount(request: SocialNetworkRequestDocument): Promise<Token> {
    return new Promise<Token>((resolve, reject) => {
      this._logger.debug("Authenticating user account", request);

      /* Look for the user account profile */
      AccountCtrl.getProfile(
        Objects.get(request, "user.id", request.user).toString(),
        Objects.get(request, "application.project.id", "").toString()
      ).then((_profile: AccountProjectProfileDocument) => {
        const client: any = Objects.get(request, "application");
        const user: any = Objects.get(request, "user");
        user["isSocial"] = true;

        /* Generate the access token */
        OAuth2ModelCtrl.generateAccessToken(client, user, [])
          .then((accessToken: string) => {
            /* Generate the refresh token */
            OAuth2ModelCtrl.generateRefreshToken(client, user, [])
              .then((refreshToken: string) => {
                /* Prepare the authentication token */
                const token: Token = {
                  accessToken: accessToken,
                  accessTokenExpiresAt: new Date(
                    Date.now() +
                      (client.accessTokenLifetime ? client.accessTokenLifetime : 3600) * 1000
                  ),
                  refreshToken: refreshToken,
                  refreshTokenExpiresAt: new Date(
                    Date.now() +
                      (client.accessTokenLifetime ? client.refreshTokenLifetime : 604800) * 1000
                  ),
                  scope: [],
                  client: client,
                  user: user,
                  type: OAUTH2_TOKEN_TYPE.TT_USER_SOCIAL
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
          })
          .catch(reject);
      });
    });
  }

  /**
   * Clear a passport strategy
   *
   * @param stateId
   */
  private _clearStrategy(request: string) {
    this._logger.debug("Clear social network strategy", {
      request: request
    });

    /* Remove the social network request */
    SocialNetworkRequestModel.findOneAndRemove({ _id: request }).then(
      (value: SocialNetworkRequestDocument) => {
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
   * Setup a social network strategy to authenticate the user account
   *
   * @param socialNetwork  Social network request information
   */
  private _setupSocialStrategy(socialNetwork: SocialNetworkRequestDocument) {
    this._logger.debug("Running passport social network strategy", socialNetwork);

    /* Handler strategy response function */
    const fnSocialStrategy = (
      req: Request,
      token: string,
      refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void
    ) => {
      this._doSocialNetwork(
        socialNetwork.social.type,
        Objects.get(socialNetwork, "application.project"),
        socialNetwork.referral,
        req,
        token,
        refreshToken,
        profile,
        done
      );
    };

    /* Prepare the callback URI */
    const callbackURI = `${process.env.AUTH_SERVER}/v1/oauth/social/${socialNetworkToStr(
      socialNetwork.social.type
    )}/callback`;

    /* Initialize the passport strategy for the given network type */
    const strategy: passport.Strategy = SocialNetworkStrategyFactory.getByType(
      socialNetwork.social.type
    ).setup(socialNetwork, callbackURI, fnSocialStrategy);

    /* Register the passport strategy */
    passport.use(socialNetwork.id, strategy);
  }

  /**
   * Function to handler social network actions after authentication
   * It allows to create, attach or update user account from social networks
   *
   * @param socialType
   * @param project
   * @param referral
   * @param req
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param done
   */
  private _doSocialNetwork(
    socialType: SOCIAL_NETWORK_TYPES,
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
    SocialNetworkRequestModel.findById(state)
      .populate("user")
      .then((request: SocialNetworkRequestDocument) => {
        if (!request) {
          return done({
            boError: AUTH_ERRORS.INVALID_SOCIAL_REQUEST,
            boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
          });
        }

        /* Look for an user with the same social network id */
        const userQuery = { "social.type": socialType, "social.profile.id": profile.id };
        AccountModel.findOne(userQuery)
          .then((account: AccountDocument) => {
            /* Check if the user is not registered */
            if (!account) {
              /* Check if the user is attaching the social network account to an existent account */
              if (request.user !== null) {
                return this._attachAccount(
                  request.user as AccountDocument,
                  socialType,
                  project,
                  referral,
                  accessToken,
                  refreshToken,
                  profile,
                  done
                );
              }

              /* Register new social account */
              return this._createAccount(
                socialType,
                project,
                referral,
                accessToken,
                refreshToken,
                profile,
                done
              );
            }

            /* Check requets user match with found user */
            const tmpUser: any = request.user;
            if (request.user !== null && tmpUser.id !== account.id) {
              this._logger.error("User account mismatch", {
                account: account,
                request: request
              });

              return done({
                boError: AUTH_ERRORS.USER_ACCOUNT_MISMATCH,
                boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
              });
            }

            /* User authentication  */
            this._updateAccount(
              account,
              project,
              socialType,
              referral,
              accessToken,
              refreshToken,
              profile
            )
              .then((profile: AccountProjectProfileDocument) => {
                done(null, profile);
              })
              .catch(done);
          })
          .catch(done);
      })
      .catch(done);
  }

  /**
   * Store the social network credentials for user authentication
   *
   * @param account
   * @param project
   * @param socialType
   * @param referral
   * @param accessToken
   * @param refreshToken
   * @param profile
   */
  private _updateAccount(
    account: AccountDocument,
    project: string,
    socialType: SOCIAL_NETWORK_TYPES,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this._logger.debug("Store social network credentials", {
        account: account,
        social: socialNetworkToStr(socialType),
        referral: referral,
        profile: profile
      });

      /* Check for user id match */
      const tmp = account.social.filter((value) => value.type === socialType);
      if (tmp.length > 0 && Objects.get(tmp[0], "profile.id") !== profile.id) {
        this._logger.error("Social network don't match", {
          socialId: profile.id,
          type: socialType,
          account: account
        });

        /* User mismatch */
        return reject({
          boError: AUTH_ERRORS.USER_SOCIAL_MISMATCH,
          boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
        });
      }

      /* Update or set social network profile */
      const update: any =
        tmp.length > 0
          ? {
              $set: {
                "social.$[element].type": socialType,
                "social.$[element].profile": profile
              }
            }
          : {
              $push: {
                social: {
                  type: socialType,
                  profile: profile
                }
              }
            };

      /* Query update options */
      const options: any =
        tmp.length > 0
          ? {
              new: true,
              upsert: true,
              arrayFilters: [{ "element.type": socialType }]
            }
          : {
              new: true,
              upsert: true
            };

      /* Look for the account and update */
      AccountModel.findOneAndUpdate({ _id: account.id }, update, options)
        .then((user: AccountDocument) => {
          /* Ensure that account exists */
          if (!user) {
            this._logger.error("User account not found when updating social profile", {
              social: socialType,
              account: account,
              profile: profile
            });
            return reject({
              boError: AUTH_ERRORS.ACCOUNT_PROFILE_NOT_FOUND,
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
            });
          }

          /* Check if the user has registered the application */
          AccountProjectProfileModel.findOne({
            account: user.id,
            project: project
          })
            .then((accountProfile: AccountProjectProfileDocument) => {
              /* Prepare social network crdentials to be stored */
              const credentials: SocialNetworkCredential = {
                type: socialType,
                socialId: profile.id,
                accessToken: accessToken,
                refreshToken: refreshToken
              };

              /* Check if the user account profile is not registered */
              if (!accountProfile) {
                /* Register the user profile using social network credentials */
                return AccountCtrl.createSocialProfile(account, project, credentials, referral)
                  .then((value: AccountProjectProfileDocument) => {
                    this._logger.debug("Registered new user profile", value);
                    resolve(value);
                  })
                  .catch(reject);
              }

              /* Check for user id match */
              const tmp = accountProfile.social.filter((value) => value.type === socialType);
              if (tmp.length > 0 && tmp[0].socialId !== credentials.socialId) {
                this._logger.error("Social network don't match", {
                  socialId: credentials.socialId,
                  type: socialType,
                  socialNetworks: accountProfile.social
                });

                /* User mismatch */
                return reject({
                  boError: AUTH_ERRORS.USER_SOCIAL_MISMATCH,
                  boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
                });
              }

              /* Update the user account information */
              const update: any =
                tmp.length > 0
                  ? {
                      $set: {
                        "social.$[element].type": socialType,
                        "social.$[element].socialId": credentials.socialId,
                        "social.$[element].accessToken": credentials.accessToken,
                        "social.$[element].refreshToken": credentials.refreshToken
                      }
                    }
                  : {
                      $push: {
                        social: {
                          type: socialType,
                          socialId: credentials.socialId,
                          accessToken: credentials.accessToken,
                          refreshToken: credentials.refreshToken
                        }
                      }
                    };

              /* Query update options */
              const options: any =
                tmp.length > 0
                  ? {
                      new: true,
                      upsert: true,
                      arrayFilters: [{ "element.type": socialType }]
                    }
                  : {
                      new: true,
                      upsert: true
                    };

              /* Find and update the account profile */
              AccountProjectProfileModel.findOneAndUpdate(
                { account: account.id, project: project },
                update,
                options
              )
                .populate("account")
                .populate("project")
                .then((value: AccountProjectProfileDocument) => {
                  this._logger.debug("User profile updated", value);
                  resolve(value);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Attach a social account to an existent user account
   * Target user account is extracted from request token
   *
   * @param socialType
   * @param project
   * @param referral
   * @param req
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param done
   */
  private _attachAccount(
    account: AccountDocument,
    socialType: SOCIAL_NETWORK_TYPES,
    project: string,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    this._logger.debug("Attaching social network account", {
      account: account,
      type: socialType,
      profile: profile
    });

    /* Check for user id match */
    const tmp = account.social.filter((value) => value.type === socialType);
    if (tmp.length > 0) {
      this._logger.error("There is a social network registered", {
        type: socialType,
        socialNetworks: account.social
      });

      /* User mismatch */
      return done({
        boError: AUTH_ERRORS.CANT_REGISTER_ANOTHER_SOCIAL,
        boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
      });
    }

    /* Store the social network credentials */
    this._updateAccount(account, project, socialType, referral, accessToken, refreshToken, profile)
      .then((profile: AccountProjectProfileDocument) => {
        done(null, profile);
      })
      .catch(done);
  }

  /**
   * Create new user account with the social network information
   *
   * @param socialType
   * @param project
   * @param referral
   * @param accessToken
   * @param refreshToken
   * @param profile
   * @param done
   */
  private _createAccount(
    socialType: SOCIAL_NETWORK_TYPES,
    project: string,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    this._logger.debug("Registering new user account", {
      type: socialType,
      profile: profile
    });

    /* Get the curren social network strategy */
    const strategy: SocialNetworkStrategy = SocialNetworkStrategyFactory.getByType(socialType);

    /* Register the new user account */
    AccountCtrl.registerSocial(
      {
        name: strategy.name(profile),
        lastname: strategy.lastname(profile),
        email: strategy.email(profile),
        phone: strategy.phone(profile)
      },
      socialType,
      profile
    )
      .then((account: AccountDocument) => {
        /* Store the social network credentials */
        this._updateAccount(
          account,
          project,
          socialType,
          referral,
          accessToken,
          refreshToken,
          profile
        )
          .then((profile: AccountProjectProfileDocument) => {
            done(null, profile);
          })
          .catch(done);
      })
      .catch(done);
  }
}

export const SocialNetworkCtrl = SocialNetwork.shared;
