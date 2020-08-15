/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Router, Request, Response, NextFunction } from "express";
import { Validators, Objects, HTTP_STATUS, ResponseHandler } from "@ikoabo/core_srv";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";
import { ERRORS as AUTH_ERRORS } from "@ikoabo/auth_srv";
import { Settings } from "@/config/Settings";
import { Token } from "oauth2-server";
import { ApplicationAccessPolicyCtrl } from "@/Applications/controllers/application.access.policy.controller";
import { SocialNetworkValidation, SocialNetworkParamsValidation, SocialNetworkStateValidation } from "@/SocialNetworks/models/social.networks.joi";
import { socialNetworkToInt, SocialNetworkSetting } from "@/SocialNetworks/models/social.networks.model";
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";
import { SocialNetworkRequestModel, SocialNetworkRequestDocument } from "@/SocialNetworks/models/social.networks.request.model";
import { SocialNetworkCtrl } from "@/SocialNetworks/controllers/social.networks.controller";

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
  Validators.joi(SocialNetworkValidation, "params"),
  Validators.joi(SocialNetworkParamsValidation, "query"),
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
    ).filter(
      (value: SocialNetworkSetting) => value.type === socialType
    );

    /* Check if the social network settings is valid */
    if (
      socialType === SOCIAL_NETWORK_TYPES.SN_UNKNOWN ||
      socialNetworks.length <= 0
    ) {
      return next({
        boError: AUTH_ERRORS.INVALID_AUTH_SERVER,
        boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE,
      });
    }

    /* Temporally store request data to allow callback */
    SocialNetworkRequestModel.create({
      token: token,
      application: Objects.get(res, "locals.token.client.id"),
      user: Objects.get(res, "locals.token.user.id"),
      redirect: redirect,
      social: socialNetworks[0],
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
    SocialNetworkCtrl.doAuthenticate(
      Objects.get(res, "locals.socialNetwork"),
      {
        state: Objects.get(res, "locals.socialNetwork.id"),
        scope: Objects.get(res, "locals.socialNetwork.social.scope"),
      }
    )(req, res, next);
  },
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: SocialNetworkRequestDocument = Objects.get(res, 'locals.socialNetwork');
    if (!request) {
      return next({ boError: AUTH_ERRORS.INVALID_CREDENTIALS, boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE });
    }

    res.redirect(`${request.redirect}?status=${err.boStatus || HTTP_STATUS.HTTP_BAD_REQUEST}&error=${err.boError}`);
  },
  ResponseHandler.error
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
  Validators.joi(SocialNetworkValidation, "params"),
  Validators.joi(SocialNetworkStateValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    const state: string = Objects.get(req, 'query.state', '').toString();
    const social: string = req.params["social"];
    const socialType: SOCIAL_NETWORK_TYPES = socialNetworkToInt(social);

    /* Find the authentication state */
    SocialNetworkRequestModel.findById(state)
      .populate({ path: 'application', populate: { path: "project" } })
      .populate('user')
      .then((request: SocialNetworkRequestDocument) => {
        if (!request) {
          return next({ boError: AUTH_ERRORS.INVALID_CREDENTIALS, boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE });
        }

        /* Check that social network match */
        if (request.social.type !== socialType) {
          return next({ boError: AUTH_ERRORS.INVALID_APPLICATION, boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE });
        }

        /* Store reuqest status for next middleware */
        res.locals["socialNetwork"] = request;

        /* Calling social network authentication with callback reference */
        const cbFailure = `${Settings.AUTH.SERVER}/v1/oauth/social/${social}/callback/failure`;
        SocialNetworkCtrl.doAuthenticate(request, {
          state: request.id,
          failureRedirect: cbFailure,
        })(req, res, next);
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: SocialNetworkRequestDocument = Objects.get(res, 'locals.socialNetwork');
    if (!request) {
      return next({ boError: AUTH_ERRORS.INVALID_CREDENTIALS, boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE });
    }

    /* Check if the social request was account attach */
    if (request.user !== null) {
      return res.redirect(`${request.redirect}?status=${HTTP_STATUS.HTTP_OK}`);
    }

    /* Authenticate the user account with the OAuth2 server */
    SocialNetworkCtrl.authenticateSocialAccount(request)
      .then((token: Token) => {
        /* Validate application restrictions */
        ApplicationAccessPolicyCtrl.canAccess(req, token.client.id)
          .then(() => {
            /* Return the access token */
            return res.redirect(`${request.redirect}?status=${HTTP_STATUS.HTTP_CREATED}&at=${token.accessToken}&rt=${token.refreshToken}`);
          })
          .catch(next);
      }).catch(next);
  },
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: SocialNetworkRequestDocument = Objects.get(res, 'locals.socialNetwork');
    if (!request) {
      return next({ boError: AUTH_ERRORS.INVALID_CREDENTIALS, boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE });
    }

    res.redirect(`${request.redirect}?status=${err.boStatus || HTTP_STATUS.HTTP_BAD_REQUEST}&error=${err.boError}`);
  },
  ResponseHandler.error,
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
  Validators.joi(SocialNetworkValidation, "params"),
  Validators.joi(SocialNetworkStateValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    const state: string = Objects.get(req, 'query.state', '').toString();
    const social: string = req.params["social"];
    const socialType: SOCIAL_NETWORK_TYPES = socialNetworkToInt(social);

    /* Find the authentication state */
    SocialNetworkRequestModel.findById(state)
      .populate({ path: 'application', populate: { path: "project" } })
      .populate('user')
      .then((request: SocialNetworkRequestDocument) => {
        if (!request) {
          return next({ boError: AUTH_ERRORS.INVALID_CREDENTIALS, boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE });
        }

        /* Check that social network match */
        if (request.social.type !== socialType) {
          return next({ boError: AUTH_ERRORS.INVALID_APPLICATION, boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE });
        }

        /* Store reuqest status for next middleware */
        res.locals["request"] = request;

        next({ boError: AUTH_ERRORS.AUTHENTICATION_REQUIRED, boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED });
      })
      .catch(next);
  },
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    console.log(req.query)
    next(err);
  },
  ResponseHandler.error,
  ResponseHandler.success
);

export default router;
