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
import {
  Profile as TwitterProfile,
  Strategy as TwitterStrategy,
} from "passport-twitter";
import {
  Profile as FacebookProfile,
  Strategy as FacebookStrategy,
} from "passport-facebook";
import FacebookTokenStrategy from "passport-facebook-token";
import {
  OAuth2Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth";
import { Request, NextFunction } from "express";
import { Logger, Objects, ERRORS, HTTP_STATUS } from "@ikoabo/core_srv";
import { ERRORS as AUTH_ERRORS } from "@ikoabo/auth_srv";
import {
  AccountSocialRequestDocument,
  AccountSocialRequestModel,
} from "@/Accounts/models/accounts.social.request.model";
import { ProjectSocialNetworkSettings } from "@/Projects/models/projects.socialnetworks.model";
import { AccountSocialCredential, socialNetworkToStr } from "@/Accounts/models/accounts.social.model";
import { SOCIAL_NETWORK_TYPES } from "@/Projects/models/projects.enum";
import {
  AccountModel,
  AccountDocument,
  AccountSocial,
} from "@/Accounts/models/accounts.model";
import { AccountCtrl } from "@/Accounts/controllers/accounts.controller";
import {
  AccountProjectProfileDocument,
  AccountProjectProfileModel,
} from "@/Accounts/models/accounts.projects.model";
import { Response } from "oauth2-server";
import { Settings } from "@/config/Settings";

class SocialNetworksStrategy {
  private static _instance: SocialNetworksStrategy;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("SocialNetworkStrategy");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): SocialNetworksStrategy {
    if (!SocialNetworksStrategy._instance) {
      SocialNetworksStrategy._instance = new SocialNetworksStrategy();
    }
    return SocialNetworksStrategy._instance;
  }

  /**
   * Register a new instance of social network passport strategy for the given application
   *
   * @param {AppDocument} application  Target application
   * @param {AppSocial} credentials  Social network credentials
   * @param {StateDocument} stateDoc  Social network state validator
   */
  public setupSocialStrategy(
    socialNetwork: ProjectSocialNetworkSettings,
    accountSocialRequest: AccountSocialRequestDocument
  ) {
    this._logger.debug("Running passport social network strategy", {
      socialNetwork: socialNetwork,
      socialRequest: accountSocialRequest,
    });

    /* Handler strategy response function */
    const fnSocialStrategy = (
      req: Request,
      token: string,
      refreshToken: string,
      profile: FacebookProfile | TwitterProfile | GoogleProfile,
      done: (error: any, user?: any) => void
    ) => {
      this._doSocialNetwork(
        socialNetwork.type,
        Objects.get(accountSocialRequest, "application.project"),
        accountSocialRequest.referral,
        req,
        token,
        refreshToken,
        profile,
        done
      );
    };

    const callbackURI = `${Settings.AUTH.SERVER}/v1/oauth/social/${socialNetworkToStr(socialNetwork.type)}/callback`;

    /* Initialize the passport strategy for the given network type */
    let strategy: passport.Strategy;
    switch (socialNetwork.type) {
      case SOCIAL_NETWORK_TYPES.SN_FACEBOOK:
        strategy = new FacebookStrategy(
          {
            clientID: socialNetwork.clientId,
            clientSecret: socialNetwork.clientSecret,
            callbackURL: callbackURI,
            profileFields: socialNetwork.profile,
            enableProof: true,
            passReqToCallback: true,
          },
          fnSocialStrategy
        );
        break;

      case SOCIAL_NETWORK_TYPES.SN_GOOGLE:
        strategy = new GoogleStrategy(
          <any>{
            clientID: socialNetwork.clientId,
            clientSecret: socialNetwork.clientSecret,
            callbackURL: callbackURI,
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
            passReqToCallback: true,
          },
          fnSocialStrategy
        );
        break;

      case SOCIAL_NETWORK_TYPES.SN_TWITTER:
        strategy = new TwitterStrategy(
          {
            consumerKey: socialNetwork.clientId,
            consumerSecret: socialNetwork.clientSecret,
            callbackURL: callbackURI,
            passReqToCallback: true,
          },
          fnSocialStrategy
        );
        break;

      default:
        return;
    }

    /* Use the passport strategy */
    passport.use(accountSocialRequest.id, strategy);
  }

  /**
   * Clear a passport strategy
   *
   * @param stateId
   */
  private _clearStrategy(request: string) {
    AccountSocialRequestModel.findOneAndRemove({ _id: request }).then(
      (value: AccountSocialRequestDocument) => {
        if (value) {
          passport.unuse(request);
        }
      }
    );
  }

  /**
   * Store the social network credentials
   */
  private _storeCredentials(
    account: AccountDocument,
    project: string,
    socialType: SOCIAL_NETWORK_TYPES,
    referral: string,
    accessToken: string,
    refreshToken: string,
    profile: FacebookProfile | TwitterProfile | GoogleProfile
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      // TODO XXX Update social network profile

      /* Check if the user has registered the application */
      AccountProjectProfileModel.findOne({
        account: account.id,
        project: project,
      })
        .then((accountProfile: AccountProjectProfileDocument) => {
          /* Prepare social network crdentials to be stored */
          const credentials: AccountSocialCredential = {
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
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Attach a social account to an existent user account
   * Target user account is extracted from request token
   */
  private _attachSocial(
    socialType: SOCIAL_NETWORK_TYPES,
    project: string,
    referral: string,
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: FacebookProfile | TwitterProfile | GoogleProfile,
    done: (error: any, user?: any) => void
  ) {
    const user = Objects.get(req, "token.user.id");

    /* Attach the social profile into user account */
    const socialAccount: AccountSocial = {
      type: socialType,
      profile: profile,
    };
    const update: any = {
      $push: { social: socialAccount },
    };
    AccountModel.findOneAndUpdate({ _id: user }, update, { new: true })
      .then((account: AccountDocument) => {
        if (!account) {
          done({
            boError: ERRORS.OBJECT_NOT_FOUND,
            boStatus: HTTP_STATUS.HTTP_NOT_FOUND,
          });
          return;
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
    profile: FacebookProfile | TwitterProfile | GoogleProfile,
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
    profile: FacebookProfile | TwitterProfile | GoogleProfile,
    done: (error: any, user?: any) => void
  ) {
    /* Look for an user with the same social network id */
    let userQuery = { "social.profile.id": profile.id };
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
          this._createSocial(
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

  public doAuthenticate(
    request: AccountSocialRequestDocument,
    options = {}
  ) {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate(request.id, options, function (err, user, info) {
        /* Check if there were some errors */
        if (err) {
          this._logger.error("Error authenticating social network", {
            error: err,
          });

          /* Remove the passport strategy */
          self._clearStrategy(request.id);
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
          self._clearStrategy(request.id);
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
}

export const SocialNetworksStrategyCtrl = SocialNetworksStrategy.shared;
