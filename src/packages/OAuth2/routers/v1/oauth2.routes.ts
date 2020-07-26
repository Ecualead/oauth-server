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
import {
  AuthorizationCode,
  Token,
  Request as ORequest,
  Response as OResponse,
} from "oauth2-server";
import { ResponseHandler, Objects, ERRORS } from "@ikoabo/core_srv";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";
import { ApplicationAccessPolicyCtrl } from "@/packages/Applications/controllers/application.access.policy.controller";
import { OAUTH2_TOKEN_TYPE } from "../../models/oauth2.enum";

const router = Router();

const options = {
  authenticateHandler: {
    handle: (/*req: Request*/) => {
      // Whatever you need to do to authorize / retrieve your user from post data here
      return {}; //{id: 1233}; // return client
    },
  },
};

router.post(
  "/authorize",
  (req: Request, res: Response, next: NextFunction) => {
    let request = new ORequest(req);
    let response = new OResponse(res);
    OAuth2Ctrl.server
      .authorize(request, response, options)
      .then((code: AuthorizationCode) => {
        /* Validate application restrictions */
        ApplicationAccessPolicyCtrl.canAccess(req, code.client.toString())
          .then(() => {
            res.locals["response"] = {
              authorizationCode: code.authorizationCode,
              redirectUri: code.redirectUri,
              scope: code.scope,
              expiresAt: code.expiresAt ? code.expiresAt.getTime() : null,
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
  "/signin",
  (req: Request, res: Response, next: NextFunction) => {
    let request = new ORequest(req);
    let response = new OResponse(res);
    OAuth2Ctrl.server
      .token(request, response)
      .then((token: Token) => {
        /* Validate application restrictions */
        ApplicationAccessPolicyCtrl.canAccess(req, token.client.toString())
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
              scope: token.scope,
            };

            /* TODO XXX If the token is granted to an user then ensure user profile into application */
            /* if (token.user && token.user.userId && token.user.userId !== token.client.clientId) {
            UserCtrl.ensureApplicationProfile(<AccountDocument>token.user, token.client.app)
                .then(() => {
                    next();
                }).catch(next);
            return;
        }*/
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
  "/authenticate",
  (req: Request, res: Response, next: NextFunction) => {
    let request = new ORequest(req);
    let response = new OResponse(res);
    OAuth2Ctrl.server
      .authenticate(request, response)
      .then((token: Token) => {
        const project = Objects.get(token, "client.project.id", null);
        /* Check for module authentication verification */
        if (token.type === OAUTH2_TOKEN_TYPE.TT_MODULE) {
          /* Validate module restriction */
          ApplicationAccessPolicyCtrl.canAccess(
            req,
            Objects.get(token, "client", null)
          )
            .then(() => {
              res.locals["response"] = {
                module: Objects.get(token, "client", null),
                scope: token.scope,
              };
              next();
            })
            .catch(next);
        } else {
          /* Validate application restrictions */
          ApplicationAccessPolicyCtrl.canAccess(
            req,
            Objects.get(token, "client.id", null)
          )
            .then(() => {
              /* Set basic application information into the response */
              res.locals["response"] = {
                application: Objects.get(token, "client.id", null),
                project: project,
                domain: Objects.get(token, "client.project.domain", null),
                scope: token.scope,
              };

              /* Add user information if the token belongs to an user */
              const user = Objects.get(token, "user.id", null);
              if (user && user !== res.locals["response"]["application"]) {
                res.locals["response"]["user"] = user;
              }

              next();
            })
            .catch(next);
        }
      })
      .catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
