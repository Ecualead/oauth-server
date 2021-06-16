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
import { EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";
import { ApplicationAccessPolicyCtrl } from "@/controllers/application/access-policy.controller";
import { ExternalAuthCtrl } from "@/controllers/oauth2/external-auth.controller";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import {
  ExternalAuthRequestDocument,
  ExternalAuthRequestModel
} from "@/models/oauth2/external-auth-request.model";
import {
  ProjectExternalAuthDocument,
  ProjectExternalAuthModel
} from "@/models/project/external-auth.model";
import {
  ExternalAuthParamsValidation,
  ExternalAuthStateValidation,
  ExternalAuthValidation
} from "@/validators/external-auth.joi";
import { AUTH_ERRORS } from "@ikoabo/auth";
import { HTTP_STATUS, Objects } from "@ikoabo/core";
import { Validator, ResponseHandler } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { Token } from "oauth2-server";

const router = Router();

function checkExternal(req: Request, res: Response, next: NextFunction) {
  const external: string = req.params.external;
  ProjectExternalAuthModel.findById(external)
    .then((external: ProjectExternalAuthDocument) => {
      if (!external) {
        return next({
          boError: AUTH_ERRORS.INVALID_SOCIAL_REQUEST,
          boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
        });
      }

      res.locals["external"] = external;
      next();
    })
    .catch(next);
}

/**
 * @api {get} /v1/oauth/external/:external Request external authentication
 * @apiVersion 2.0.0
 * @apiName ExternalAuthRequest
 * @apiGroup External Authentication
 *
 */
router.get(
  "/:external",
  Validator.joi(ExternalAuthValidation, "params"),
  Validator.joi(ExternalAuthParamsValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Force authentication with token */
    const token: string = Objects.get(req, "query.token", "").toString();
    req.headers.authorization = `Bearer ${token}`;
    OAuth2Ctrl.authenticate()(req, res, next);
  },
  checkExternal,
  (req: Request, res: Response, next: NextFunction) => {
    const authType: EXTERNAL_AUTH_TYPE = Objects.get(
      res,
      "locals.external.type",
      EXTERNAL_AUTH_TYPE.UNKNOWN
    );
    const token: string = Objects.get(req, "query.token", "").toString();
    const redirect: string = Objects.get(req, "query.redirect", "").toString();

    /* Temporally store request data to allow callback */
    ExternalAuthRequestModel.create({
      token: token,
      application: Objects.get(res, "locals.token.client.id"),
      account: Objects.get(res, "locals.token.user.id"),
      redirect: redirect,
      externalAuth: Objects.get(res, "locals.external._id")
    })
      .then((request: ExternalAuthRequestDocument) => {
        request.application = Objects.get(res, "locals.token.client");
        request.account = Objects.get(res, "locals.token.user");
        request.externalAuth = Objects.get(res, "locals.external");

        /* Pass the object to the next middleware */
        res.locals["request"] = request;
        next();
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Calling social network authentication with callback reference */
    ExternalAuthCtrl.doAuthenticate(Objects.get(res, "locals.request"), {
      state: Objects.get(res, "locals.request.id"),
      scope: Objects.get(res, "locals.request.externalAuth.scope")
    })(req, res, next);
  },
  ResponseHandler.errorParse,
  (err: any, _req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: ExternalAuthRequestDocument = Objects.get(res, "locals.request");
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
 * @api {get} /v1/oauth/external/:external/callback External authentication success callback
 * @apiVersion 2.0.0
 * @apiName ExternalAuthSuccessCallbackState
 * @apiGroup External Authentication
 *
 */
router.get(
  "/:external/callback",
  Validator.joi(ExternalAuthValidation, "params"),
  Validator.joi(ExternalAuthStateValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    const authType: EXTERNAL_AUTH_TYPE = Objects.get(
      res,
      "locals.external.type",
      EXTERNAL_AUTH_TYPE.UNKNOWN
    );
    const state: string = Objects.get(req, "query.state", "").toString();

    /* Find the authentication state */
    ExternalAuthRequestModel.findById(state)
      .populate({ path: "application", populate: { path: "project" } })
      .populate("account")
      .then((request: ExternalAuthRequestDocument) => {
        if (!request) {
          return next({
            boError: AUTH_ERRORS.INVALID_CREDENTIALS,
            boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
          });
        }

        /* Check external auth type match */
        if (Objects.get(request, "externalAuth.type") !== authType) {
          return next({
            boError: AUTH_ERRORS.INVALID_APPLICATION,
            boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
          });
        }

        /* Store external auth request for next middleware */
        res.locals["request"] = request;

        /* Calling social network authentication with callback reference */
        const cbFailure = `${process.env.AUTH_SERVER}/v1/oauth/external/${external}/callback/failure`;
        ExternalAuthCtrl.doAuthenticate(request, {
          state: request.id,
          failureRedirect: cbFailure
        })(req, res, next);
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Get the social network request */
    const request: ExternalAuthRequestDocument = Objects.get(res, "locals.request");
    if (!request) {
      return next({
        boError: AUTH_ERRORS.INVALID_CREDENTIALS,
        boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
      });
    }

    /* Check if the social request was account attach */
    if (request.account !== null) {
      return res.redirect(`${request.redirect}?status=${HTTP_STATUS.HTTP_2XX_OK}`);
    }

    /* Authenticate the user account with the OAuth2 server */
    ExternalAuthCtrl.authenticateSocialAccount(request)
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
    const request: ExternalAuthRequestDocument = Objects.get(res, "locals.request");
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
 * @api {get} /v1/oauth/external/:external/callback/failure External authentication failure callback
 * @apiVersion 2.0.0
 * @apiName ExternalAuthFailureCallbackState
 * @apiGroup External Authentication
 *
 */
router.get(
  "/:external/callback/failure",
  Validator.joi(ExternalAuthValidation, "params"),
  Validator.joi(ExternalAuthStateValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    const authType: EXTERNAL_AUTH_TYPE = Objects.get(
      res,
      "locals.external.type",
      EXTERNAL_AUTH_TYPE.UNKNOWN
    );
    const state: string = Objects.get(req, "query.state", "").toString();

    /* Find the authentication state */
    ExternalAuthRequestModel.findById(state)
      .populate({ path: "application", populate: { path: "project" } })
      .populate("account")
      .then((request: ExternalAuthRequestDocument) => {
        if (!request) {
          return next({
            boError: AUTH_ERRORS.INVALID_CREDENTIALS,
            boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
          });
        }

        /* Check that social network match */
        if (Objects.get(request, "externalAuth.type") !== authType) {
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