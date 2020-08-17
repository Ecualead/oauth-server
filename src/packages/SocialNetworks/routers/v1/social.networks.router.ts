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
import { HTTP_STATUS, Objects } from "@ikoabo/core";
import { Validator, ResponseHandler } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { Token } from "oauth2-server";
import { ApplicationAccessPolicyCtrl } from "@/Applications/controllers/application.access.policy.controller";
import { Settings } from "@/configs/settings.config";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";
import { SocialNetworkCtrl } from "@/SocialNetworks/controllers/social.networks.controller";
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";
import {
  SocialNetworkValidation,
  SocialNetworkParamsValidation,
  SocialNetworkStateValidation
} from "@/SocialNetworks/models/social.networks.joi";
import {
  socialNetworkToInt,
  SocialNetworkSetting
} from "@/SocialNetworks/models/social.networks.model";
import {
  SocialNetworkRequestModel,
  SocialNetworkRequestDocument
} from "@/SocialNetworks/models/social.networks.request.model";

const router = Router();

/**
 * @api {get} /v1/auth/social/:social Request social network authentication
 * @apiVersion 1.0.0
 * @apiName AuthSocialSignin
 * @apiGroup Social Network Authentication
 *
 */
router.get(
  "/:social",
  Validator.joi(SocialNetworkValidation, "params"),
  Validator.joi(SocialNetworkParamsValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Force authentication with token */
    const token: string = Objects.get(req, "query.token", "").toString();
    req.headers.authorization = `Bearer ${token}`;
    OAuth2Ctrl.authenticate()(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    const social: string = req.params.social;
    const socialType: number = socialNetworkToInt(social);
    const token: string = Objects.get(req, "query.token", "").toString();
    const redirect: string = Objects.get(req, "query.redirect", "").toString();

    /* Check if the target project has enabled the given social network authentication */
    const socialNetworks: SocialNetworkSetting[] = Objects.get(
      res,
      "locals.token.client.project.settings.socialNetworks",
      []
    ).filter((value: SocialNetworkSetting) => value.type === socialType);

    /* Check if the social network settings is valid */
    if (socialType === SOCIAL_NETWORK_TYPES.SN_UNKNOWN || socialNetworks.length <= 0) {
      return next({
        boError: AUTH_ERRORS.INVALID_AUTH_SERVER,
        boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
      });
    }

    /* Temporally store request data to allow callback */
    SocialNetworkRequestModel.create({
      token: token,
      application: Objects.get(res, "locals.token.client.id"),
      user: Objects.get(res, "locals.token.user.id"),
      redirect: redirect,
      social: socialNetworks[0]
    })
      .then((request: SocialNetworkRequestDocument) => {
        /* Pass the object to the next middleware */
        res.locals["socialNetwork"] = request;
        next();
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Calling social network authentication with callback reference */
    SocialNetworkCtrl.doAuthenticate(Objects.get(res, "locals.socialNetwork"), {
      state: Objects.get(res, "locals.socialNetwork.id"),
      scope: Objects.get(res, "locals.socialNetwork.social.scope")
    })(req, res, next);
  },
  ResponseHandler.errorParse,
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: SocialNetworkRequestDocument = Objects.get(res, "locals.socialNetwork");
    if (!request) {
      return next({
        boError: AUTH_ERRORS.INVALID_CREDENTIALS,
        boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
      });
    }

    res.redirect(
      `${request.redirect}?status=${err.boStatus || HTTP_STATUS.HTTP_4XX_BAD_REQUEST}&error=${
        err.boError
      }`
    );
  }
);

/**
 * @api {get} /v1/auth/social/:social/callback Social network callback
 * @apiVersion 2.0.0
 * @apiName AuthSocialCallback
 * @apiGroup Social Network Authentication
 *
 */
router.get(
  "/:social/callback",
  Validator.joi(SocialNetworkValidation, "params"),
  Validator.joi(SocialNetworkStateValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    const state: string = Objects.get(req, "query.state", "").toString();
    const social: string = req.params["social"];
    const socialType: SOCIAL_NETWORK_TYPES = socialNetworkToInt(social);

    /* Find the authentication state */
    SocialNetworkRequestModel.findById(state)
      .populate({ path: "application", populate: { path: "project" } })
      .populate("user")
      .then((request: SocialNetworkRequestDocument) => {
        if (!request) {
          return next({
            boError: AUTH_ERRORS.INVALID_CREDENTIALS,
            boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
          });
        }

        /* Check that social network match */
        if (request.social.type !== socialType) {
          return next({
            boError: AUTH_ERRORS.INVALID_APPLICATION,
            boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
          });
        }

        /* Store reuqest status for next middleware */
        res.locals["socialNetwork"] = request;

        /* Calling social network authentication with callback reference */
        const cbFailure = `${Settings.AUTH.SERVER}/v1/oauth/social/${social}/callback/failure`;
        SocialNetworkCtrl.doAuthenticate(request, {
          state: request.id,
          failureRedirect: cbFailure
        })(req, res, next);
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: SocialNetworkRequestDocument = Objects.get(res, "locals.socialNetwork");
    if (!request) {
      return next({
        boError: AUTH_ERRORS.INVALID_CREDENTIALS,
        boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
      });
    }

    /* Check if the social request was account attach */
    if (request.user !== null) {
      return res.redirect(`${request.redirect}?status=${HTTP_STATUS.HTTP_2XX_OK}`);
    }

    /* Authenticate the user account with the OAuth2 server */
    SocialNetworkCtrl.authenticateSocialAccount(request)
      .then((token: Token) => {
        /* Validate application restrictions */
        ApplicationAccessPolicyCtrl.canAccess(req, token.client.id)
          .then(() => {
            /* Return the access token */
            return res.redirect(
              `${request.redirect}?status=${HTTP_STATUS.HTTP_2XX_CREATED}&at=${token.accessToken}&rt=${token.refreshToken}`
            );
          })
          .catch(next);
      })
      .catch(next);
  },
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: SocialNetworkRequestDocument = Objects.get(res, "locals.socialNetwork");
    if (!request) {
      return next({
        boError: AUTH_ERRORS.INVALID_CREDENTIALS,
        boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
      });
    }

    res.redirect(
      `${request.redirect}?status=${err.boStatus || HTTP_STATUS.HTTP_4XX_BAD_REQUEST}&error=${
        err.boError
      }`
    );
  },
  ResponseHandler.error
);

/**
 * @api {get} /v1auth/social/:social/callback/failure Social network failure callback
 * @apiVersion 2.0.0
 * @apiName AuthSocialCallbackState
 * @apiGroup Social Network Authentication
 *
 */
router.get(
  "/:social/callback/failure",
  Validator.joi(SocialNetworkValidation, "params"),
  Validator.joi(SocialNetworkStateValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    const state: string = Objects.get(req, "query.state", "").toString();
    const social: string = req.params["social"];
    const socialType: SOCIAL_NETWORK_TYPES = socialNetworkToInt(social);

    /* Find the authentication state */
    SocialNetworkRequestModel.findById(state)
      .populate({ path: "application", populate: { path: "project" } })
      .populate("user")
      .then((request: SocialNetworkRequestDocument) => {
        if (!request) {
          return next({
            boError: AUTH_ERRORS.INVALID_CREDENTIALS,
            boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
          });
        }

        /* Check that social network match */
        if (request.social.type !== socialType) {
          return next({
            boError: AUTH_ERRORS.INVALID_APPLICATION,
            boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
          });
        }

        /* Store reuqest status for next middleware */
        res.locals["request"] = request;

        next({
          boError: AUTH_ERRORS.AUTHENTICATION_REQUIRED,
          boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
        });
      })
      .catch(next);
  },
  (err: any, req: Request, res: Response, next: NextFunction) => {
    next(err);
  },
  ResponseHandler.error,
  ResponseHandler.success
);

export default router;
