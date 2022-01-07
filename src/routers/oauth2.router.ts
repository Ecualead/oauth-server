/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ResponseHandler, Objects } from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import {
  AuthorizationCode,
  Token,
  Request as ORequest,
  Response as OResponse
} from "oauth2-server";
import { OAuth2Ctrl } from "../controllers/oauth2/oauth2.controller";
import { AccessPolicyCtrl } from "../controllers/application/access.policy.controller";
import { OAuth2ModelCtrl } from "../controllers/oauth2/oauth2.model.controller";
import { JWTCtrl } from "../controllers/jwt.controller";
import { middleware as FormUrlEncoded } from "../middlewares/from.urlencoded";

export function register(router: Router, prefix: string) {
  const options = {
    authenticateHandler: {
      handle: (/*req: Request*/) => {
        // Whatever you need to do to authorize / retrieve your user from post data here
        return {}; //{id: 1233}; // return client
      }
    }
  };

  router.post(
    `${prefix}/authorize`,
    (req: Request, res: Response, next: NextFunction) => {
      const request = new ORequest(req);
      const response = new OResponse(res);
      OAuth2Ctrl.server
        .authorize(request, response, options)
        .then((code: AuthorizationCode) => {
          /* Validate application restrictions */
          AccessPolicyCtrl.canAccess(req, code.client.toString())
            .then(() => {
              res.locals["response"] = {
                authorizationCode: code.authorizationCode,
                redirectUri: code.redirectUri,
                scope: code.scope,
                expiresAt: code.expiresAt ? code.expiresAt.getTime() : null
              };

              next();
            })
            .catch(next);
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  router.post(
    `${prefix}/token`,
    FormUrlEncoded,
    (req: Request, res: Response, next: NextFunction) => {
      const request = new ORequest(req);
      const response = new OResponse(res);
      OAuth2Ctrl.server
        .token(request, response)
        .then((token: Token) => {
          /* Validate application restrictions */
          AccessPolicyCtrl.canAccess(req, token.client.toString())
            .then(() => {
              /* Return the access token */
              res.locals["token"] = token;
              res.locals["response"] = {
                tokenType: "Bearer",
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                accessTokenExpiresAt: token.accessTokenExpiresAt
                  ? token.accessTokenExpiresAt.getTime()
                  : null,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt
                  ? token.refreshTokenExpiresAt.getTime()
                  : null,
                createdAt: token.createdAt.getTime(),
                scope: token.scope
              };
              next();
            })
            .catch(next);
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {delete} /v1/oauth/token Logout the current user
   * @apiVersion 2.0.0
   * @apiName LogoutUser
   * @apiGroup User Accounts
   */
  router.delete(
    `${prefix}/token`,
    OAuth2Ctrl.authenticate(),
    (_req: Request, res: Response, next: NextFunction) => {
      /* Revoke the access token */
      OAuth2ModelCtrl.revokeToken(res.locals["token"])
        .then(() => {
          res.locals["response"] = {};
          next();
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  router.get(
    `${prefix}/authenticate`,
    (req: Request, res: Response, next: NextFunction) => {
      const request = new ORequest(req);
      const response = new OResponse(res);
      OAuth2Ctrl.server
        .authenticate(request, response)
        .then((token: Token) => {
          /* Validate application restrictions */
          AccessPolicyCtrl.canAccess(req, Objects.get(token, "client.id", null))
            .then(() => {
              const tokenValue: any = JWTCtrl.decode(token.accessToken);
              tokenValue["scope"] = token.scope;

              /* Set basic application information into the response */
              res.locals["response"] = tokenValue;
              next();
            })
            .catch(next);
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );
}
