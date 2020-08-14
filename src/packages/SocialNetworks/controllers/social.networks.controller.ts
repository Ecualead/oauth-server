/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { Logger, Objects, ERRORS, HTTP_STATUS } from "@ikoabo/core_srv";
import { ERRORS as AUTH_ERRORS } from "@ikoabo/auth_srv";
import {
  AccountModel,
  AccountDocument,
} from "@/Accounts/models/accounts.model";
import { AccountCtrl } from "@/Accounts/controllers/accounts.controller";
import {
  AccountProjectProfileDocument,
  AccountProjectProfileModel,
} from "@/Accounts/models/accounts.projects.model";
import { Settings } from "@/config/Settings";
import { Token } from "oauth2-server";
import { OAuth2ModelCtrl } from "@/OAuth2/controllers/oauth2.model.controller";
import { SocialNetworkRequestDocument, SocialNetworkRequestModel } from "@/SocialNetworks/models/social.networks.request.model";
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";
import { socialNetworkToStr, SocialNetworkCredential, SocialNetworkProfile } from "@/SocialNetworks/models/social.networks.model";
import { SocialNetworkStrategy } from "@/SocialNetworks/controllers/strategies/base.strategy.controller";

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

	/**
	 * Register a new instance of social network passport strategy for the given application
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

    const callbackURI = `${Settings.AUTH.SERVER}/v1/oauth/social/${socialNetworkToStr(socialNetwork.social.type)}/callback`;

    /* Initialize the passport strategy for the given network type */
    let strategy: passport.Strategy = SocialNetworkStrategy.getByType(socialNetwork.social.type).setup(socialNetwork, callbackURI, fnSocialStrategy);

    /* Use the passport strategy */
    passport.use(socialNetwork.id, strategy);
  }

	/**
	 * Clear a passport strategy
	 *
	 * @param stateId
	 */
  public clearStrategy(request: string) {
    SocialNetworkRequestModel.findOneAndRemove({ _id: request }).then(
      (value: SocialNetworkRequestDocument) => {
        if (value) {
          passport.unuse(request);
        }
      }
    );
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
  private _storeCredentials(
    account: AccountDocument,
    project: string,
    socialType: SOCIAL_NETWORK_TYPES,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      /* Update or set social network profile */
      const update: any = {
        $set: {
          "social.$[element].type": socialType,
          "social.$[element].profile": profile,
        },
      };
      AccountModel.findOneAndUpdate(
        { _id: account.id },
        update,
        {
          new: true,
          upsert: true,
          arrayFilters: [{ "element.type": socialType }],
        }
      )
        .then((account: AccountDocument) => {
          /* Check if the user has registered the application */
          AccountProjectProfileModel.findOne({
            account: account.id,
            project: project,
          })
            .then((accountProfile: AccountProjectProfileDocument) => {
              /* Prepare social network crdentials to be stored */
              const credentials: SocialNetworkCredential = {
                type: socialType,
                socialId: profile.id,
                accessToken: accessToken,
                refreshToken: refreshToken,
              };

              /* Check if the user account profile is not registered */
              if (!accountProfile) {
                /* Register the user profile using social network credentials */
                return AccountCtrl.createSocialProfile(
                  account,
                  project,
                  credentials,
                  referral
                )
                  .then((value: AccountProjectProfileDocument) => {
                    resolve(value);
                  })
                  .catch(reject);
              }

              /* Check for user id match */
              let tmp = accountProfile.social.filter(value => value.type = socialType);
              if (tmp.length > 0 && tmp[0].socialId !== credentials.socialId) {
                /* User mismatch */
                return reject({ boError: AUTH_ERRORS.INVALID_CREDENTIALS, boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED });
              }

              /* Update the user account information */
              const update: any = {
                $set: {
                  "social.$[element].type": socialType,
                  "social.$[element].socialId": credentials.socialId,
                  "social.$[element].accessToken": credentials.accessToken,
                  "social.$[element].refreshToken": credentials.refreshToken,
                },
              };
              AccountProjectProfileModel.findOneAndUpdate(
                { account: account.id, project: project },
                update,
                {
                  new: true,
                  upsert: true,
                  arrayFilters: [{ "element.type": socialType }],
                }
              )
                .populate("account")
                .populate("project")
                .then((value: AccountProjectProfileDocument) => {
                  resolve(value);
                }).catch(reject);
            }).catch(reject);
        }).catch(reject);
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
  private _attachSocial(
    socialType: SOCIAL_NETWORK_TYPES,
    project: string,
    referral: string,
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    const user = Objects.get(req, "token.user.id");

    /* Attach the social profile into user account */
    const socialAccount: SocialNetworkProfile = {
      type: socialType,
      profile: profile,
    };
    const update: any = {
      $push: { social: socialAccount },
    };
    AccountModel.findOne({ _id: user })
      .then((account: AccountDocument) => {
        if (!account) {
          done({
            boError: ERRORS.OBJECT_NOT_FOUND,
            boStatus: HTTP_STATUS.HTTP_NOT_FOUND,
          });
          return;
        }

        /* Check for user id match */
        let tmp = account.social.filter(value => value.type = socialType);
        if (tmp.length > 0) {
          /* User mismatch */
          return done({ boError: AUTH_ERRORS.INVALID_AUTHORIZATION_CODE, boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED });
        }

        /* Store the social network credentials */
        this._logger.debug("Attaching social network account");
        this._storeCredentials(
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

	/**
	 * Create new user account with the social network information
	 */
  private _createSocial(
    socialType: SOCIAL_NETWORK_TYPES,
    project: string,
    referral: string,
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void
  ) {
    /* Register the new user account */
    AccountCtrl.registerSocial(
      {
        name: profile.name.familyName,
        lastname: profile.name.givenName + " " + profile.name.middleName,
      },
      socialType,
      profile
    )
      .then((account: AccountDocument) => {
        /* Store the social network credentials */
        this._storeCredentials(
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

	/**
	 * Handle the information from each social network account
	 * This function will update the user social network profile information if the user exist, or
	 * create a new one if its necessary.
	 *
	 * @param {AppDocument} app  Target application
	 * @param {string} name  Social network name
	 * @param {Request} req  Express request object
	 * @param {string} accessToken  Social network access token
	 * @param {string} refreshToken  Social network refresh token
	 * @param {Profile | Profile | Profile} profile  Social network profile information
	 * @param {(error: any, user?: any) => void} done  Passport callback function
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
    /* Look for an user with the same social network id */
    let userQuery = { "soial.type": socialType, "social.profile.id": profile.id };
    AccountModel.findOne(userQuery)
      .then((account: AccountDocument) => {
        /* Check if the user is not refistered */
        if (!account) {
          /* Check if the user is attaching the social network account to an existent account */
          if (Objects.get(req, "token.user.id")) {
            return this._attachSocial(
              socialType,
              project,
              referral,
              req,
              accessToken,
              refreshToken,
              profile,
              done
            );
          }

          /* Register new social account */
          return this._createSocial(
            socialType,
            project,
            referral,
            req,
            accessToken,
            refreshToken,
            profile,
            done
          );
        }

        /* User authentication  */
        this._storeCredentials(
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

  public doAuthenticate(
    socialNetwork: SocialNetworkRequestDocument,
    options = {}
  ) {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      /* Initialize the social network strategy */
      self._setupSocialStrategy(socialNetwork);

      passport.authenticate(socialNetwork.id, options, (err, user, info) => {
        /* Check if there were some errors */
        if (err) {
          self._logger.error("Error authenticating social network", {
            error: err,
          });

          /* Remove the passport strategy */
          self.clearStrategy(socialNetwork.id);
          /* Check for oauth errors */
          if (err["oauthError"] || !err.code || !Number.isInteger(err.code)) {
            return next({
              boError: AUTH_ERRORS.UNKNOWN_AUTH_SERVER_ERROR,
              boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE,
            });
          }

          return next({
            boError: AUTH_ERRORS.NOT_ALLOWED_SIGNIN,
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
          });
        }

        /* When no user is given there is an unknown error */
        if (!user) {
          /* Remove the passport strategy */
          self.clearStrategy(socialNetwork.id);
          return next({
            boError: AUTH_ERRORS.INVALID_CREDENTIALS,
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
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

      AccountCtrl.getProfile(Objects.get(request, 'user.id', request.user).toString(), Objects.get(request, 'application.project.id', '').toString())
        .then((profile: AccountProjectProfileDocument) => {
          const client: any = Objects.get(request, 'application');
          const user: any = Objects.get(request, 'user');
          /* Generate the access token */
          OAuth2ModelCtrl.generateAccessToken(client, user, [])
            .then((accessToken: string) => {
              /* Generate the refresh token */
              OAuth2ModelCtrl.generateRefreshToken(client, user, [])
                .then((refreshToken: string) => {
                  /* Prepare the authentication token */
                  let token: Token = {
                    accessToken: accessToken,
                    accessTokenExpiresAt: new Date(Date.now() + ((client.accessTokenLifetime) ? client.accessTokenLifetime : 3600) * 1000),
                    refreshToken: refreshToken,
                    refreshTokenExpiresAt: new Date(Date.now() + ((client.accessTokenLifetime) ? client.refreshTokenLifetime : 604800) * 1000),
                    scope: [],
                    client: client,
                    user: user
                  };
                  /* Save the generated token */
                  OAuth2ModelCtrl.saveToken(token, client, user)
                    .then((token: Token) => {
                      resolve(token);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        })
    });
  }
}

export const SocialNetworkCtrl = SocialNetwork.shared; 
