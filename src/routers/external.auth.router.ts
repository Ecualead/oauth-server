/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EXTERNAL_AUTH_TYPE } from "@ecualead/auth";
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
import { ExternalAuthFacebook } from "../controllers/oauth2/schemas/facebook.controller";
import { ExternalAuthCtrl } from "../controllers/account/external.auth.controller";
import { Settings } from "../controllers/settings.controller";
import { IExternalAuth } from "../settings";
import mongoose from "mongoose";

export function register(router: Router, prefix: string) {
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
      const external = req.params["external"];
      const token: string = Objects.get(req, "query.token", "").toString();
      const redirect: string = Objects.get(req, "query.redirect", "").toString();
      const type: number = parseInt(Objects.get(req, "query.type", "0"));
      const parent: string = Objects.get(req, "query.parent");

      /* Check if user id is valid user account */
      const appId = Objects.get(res, "locals.token.client.id").toString();
      let userId = Objects.get(res, "locals.token.user.id").toString();
      if (userId === appId) {
        userId = null;
      }

      /* Look for the external settigns */
      const settings: IExternalAuth[] = Settings.shared.value.externalAuth?.filter(
        (item: IExternalAuth) => item.name === external
      );
      if (settings?.length !== 1) {
        return next(AUTH_ERRORS.INVALID_SOCIAL_REQUEST);
      }
      res.locals["settings"] = settings[0];

      /* Temporally store request data to allow callback */
      ExternalRequestModel.create({
        token: token,
        type: type,
        parent: parent,
        application: appId,
        account: userId,
        redirect: redirect,
        external: external
      })
        .then((request: ExternalRequestDocument) => {
          request.application = Objects.get(res, "locals.token.client");
          request.account = Objects.get(res, "locals.token.user");

          /* Pass the object to the next middleware */
          res.locals["request"] = request;
          next();
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Calling social network authentication with callback reference */
      const options: any = {};
      if (res.locals["settings"].scope) {
        options["scope"] = res.locals["settings"].scope;
      }
      ExternalCtrl.doAuthenticate(res.locals["request"].id, res.locals["settings"], options)(
        req,
        res,
        next
      );
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

  router.get(
    `${prefix}/:external/done`,
    Validator.joi(ExternalAuthValidation, "params"),
    Validator.joi(ExternalAuthStateValidation, "query"),
    (req: Request, res: Response, next: NextFunction) => {
      const external = req.params["external"];
      const state: string = Objects.get(req, "query.state", "").toString();

      /* Look for the external settigns */
      const settings: IExternalAuth[] = Settings.shared.value.externalAuth?.filter(
        (item: IExternalAuth) => item.name === external
      );
      if (settings?.length !== 1) {
        return next(AUTH_ERRORS.INVALID_SOCIAL_REQUEST);
      }
      res.locals["settings"] = settings[0];

      /* Find the authentication state */
      ExternalRequestModel.findById(new mongoose.Types.ObjectId(state))
        .populate({ path: "application" })
        .then((authRequest: ExternalRequestDocument) => {
          if (!authRequest) {
            return next({
              boError: AUTH_ERRORS.INVALID_CREDENTIALS,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
            });
          }

          /* Check external auth type match */
          if (authRequest.external !== external) {
            return next({
              boError: AUTH_ERRORS.INVALID_APPLICATION,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
            });
          }

          /* Store external auth request for next middleware */
          res.locals["request"] = authRequest;

          /* Calling social network authentication with callback reference */
          const cbFailure = `${Settings.shared.value.oauth2BaseUrl}/external/${external}/fail`;
          ExternalCtrl.doAuthenticate(authRequest.id, res.locals["settings"], {
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

  router.post(
    `${prefix}/facebook/remove`,
    (req: Request, res: Response, next: NextFunction) => {
      const decoded = ExternalAuthFacebook.decodeSignedRequest(req.body["signed_request"], "asda");

      /* If the decoded signed request is invalid */
      if (!decoded) {
        return next(AUTH_ERRORS.INVALID_AUTHORIZATION_CODE);
      }

      /* Remove user credentials from account */
      ExternalAuthCtrl.delete({ externalId: decoded["user_id"] })
        .then(() => {
          res.locals["response"] = { url: "<url>", confirmation_code: "<code>" };
          next();
        })
        .catch(next);
    },
    ResponseHandler.error,
    ResponseHandler.success
  );
}
