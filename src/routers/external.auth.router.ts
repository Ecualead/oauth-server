/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EXTERNAL_AUTH_TYPE } from "../constants/oauth2.enum";
import { AccessPolicyCtrl } from "../controllers/application/access.policy.controller";
import { ExternalCtrl } from "../controllers/oauth2/external.controller";
import { OAuth2Ctrl } from "../controllers/oauth2/oauth2.controller";
import {
  ExternalRequestDocument,
  ExternalRequestModel
} from "../models/oauth2/external.request.model";
import {
  ExternalAuthParamsValidation,
  ExternalAuthStateValidation,
  ExternalAuthValidation
} from "../validators/external.auth.joi";
import { AUTH_ERRORS } from "@ecualead/auth";
import { Validator, ResponseHandler, HTTP_STATUS, Objects } from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import { Token } from "oauth2-server";

export function register(router: Router, prefix: string) {
  /**
   * @api {get} /v1/oauth/external/:external Request external authentication
   * @apiVersion 2.0.0
   * @apiName ExternalAuthRequest
   * @apiGroup External Authentication
   *
   */
  router.get(
    `${prefix}/:external`,
    Validator.joi(ExternalAuthValidation, "params"),
    Validator.joi(ExternalAuthParamsValidation, "query"),
    (req: Request, res: Response, next: NextFunction) => {
      /* Force authentication with token */
      const token: string = Objects.get(req, "query.token", "").toString();
      req.headers.authorization = `Bearer ${token}`;
      OAuth2Ctrl.authenticate()(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      const authType: EXTERNAL_AUTH_TYPE = Objects.get(
        res,
        "locals.external.type",
        EXTERNAL_AUTH_TYPE.UNKNOWN
      );
      const token: string = Objects.get(req, "query.token", "").toString();
      const redirect: string = Objects.get(req, "query.redirect", "").toString();
      const type: number = parseInt(Objects.get(req, "query.type", "0"));

      /* Check if user id is valid user account */
      const appId = Objects.get(res, "locals.token.client.id").toString();
      let userId = Objects.get(res, "locals.token.user.id").toString();
      if (userId === appId) {
        userId = null;
      }

      /* Temporally store request data to allow callback */
      ExternalRequestModel.create({
        token: token,
        type: type,
        application: appId,
        account: userId,
        redirect: redirect,
        externalAuth: Objects.get(res, "locals.external._id")
      })
        .then((request: ExternalRequestDocument) => {
          request.application = Objects.get(res, "locals.token.client");
          request.account = Objects.get(res, "locals.token.user");
          request.settings = Objects.get(res, "locals.external");

          /* Pass the object to the next middleware */
          res.locals["request"] = request;
          next();
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Calling social network authentication with callback reference */
      ExternalCtrl.doAuthenticate(Objects.get(res, "locals.request"), {
        state: Objects.get(res, "locals.request.id"),
        scope: Objects.get(res, "locals.request.externalAuth.scope")
      })(req, res, next);
    },
    ResponseHandler.errorParse,
    (err: any, _req: Request, res: Response, next: NextFunction) => {
      /* Get the social network request */
      const request: ExternalRequestDocument = Objects.get(res, "locals.request");
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
    `${prefix}/:external/success`,
    Validator.joi(ExternalAuthValidation, "params"),
    Validator.joi(ExternalAuthStateValidation, "query"),
    (req: Request, res: Response, next: NextFunction) => {
      const authType: EXTERNAL_AUTH_TYPE = Objects.get(
        res,
        "locals.external.type",
        EXTERNAL_AUTH_TYPE.UNKNOWN
      );
      const state: string = Objects.get(req, "query.state", "").toString();
      const external: string = Objects.get(req, "params.external", "").toString();

      /* Find the authentication state */
      ExternalRequestModel.findById(state)
        .populate("externalAuth")
        .populate({ path: "application" })
        .then((authRequest: ExternalRequestDocument) => {
          if (!authRequest) {
            return next({
              boError: AUTH_ERRORS.INVALID_CREDENTIALS,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
            });
          }

          /* Check external auth type match */
          if (Objects.get(authRequest, "externalAuth.type") !== authType) {
            return next({
              boError: AUTH_ERRORS.INVALID_APPLICATION,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
            });
          }

          /* Store external auth request for next middleware */
          res.locals["request"] = authRequest;

          /* Calling social network authentication with callback reference */
          const cbFailure = `${process.env.AUTH_SERVER}/v1/oauth/external/${external}/fail`;
          ExternalCtrl.doAuthenticate(authRequest, {
            state: authRequest.id,
            failureRedirect: cbFailure
          })(req, res, next);
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Get the social network request */
      const request: ExternalRequestDocument = Objects.get(res, "locals.request");
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
      ExternalCtrl.authenticateSocialAccount(request, req.user)
        .then((token: Token) => {
          /* Validate application restrictions */
          AccessPolicyCtrl.canAccess(req, token.client.id)
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
      const request: ExternalRequestDocument = Objects.get(res, "locals.request");
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
    `${prefix}/:external/fail`,
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
      ExternalRequestModel.findById(state)
        .populate({ path: "application" })
        .populate("account")
        .then((request: ExternalRequestDocument) => {
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
}
