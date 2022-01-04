/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ResponseHandler } from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import {
  AuthorizationCode,
  Token,
  Request as ORequest,
  Response as OResponse
} from "oauth2-server";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ApplicationAccessPolicyCtrl } from "@/controllers/application/access-policy.controller";
import { ApplicationCtrl } from "@/controllers/application/application.controller";
import { ApplicationDocument } from "@/models/application/application.model";
import { checkUrlProject } from "@/middlewares/project.middleware";

const router = Router({ mergeParams: true });

const options = {
  authenticateHandler: {
    handle: (/*req: Request*/) => {
      // Whatever you need to do to authorize / retrieve your user from post data here
      return {}; //{id: 1233}; // return client
    }
  }
};

router.post(
  "/authorize",
  checkUrlProject,
  (req: Request, res: Response, next: NextFunction) => {
    const request = new ORequest(req);
    const response = new OResponse(res);
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
  "/login",
  checkUrlProject,
  (req: Request, res: Response, next: NextFunction) => {
    /* Extract project from requesting application */
    const basic = req.headers.authorization.split(" ");
    if (basic.length === 2 && basic[0].toUpperCase() === "BASIC") {
      const buff = Buffer.from(basic[1], "base64");
      const plain: string[] = buff.toString("ascii").split(":");
      if (plain.length === 2) {
        return ApplicationCtrl.fetch({ _id: plain[0] })
          .then((application: ApplicationDocument) => {
            const email = req.body["username"];
            req.body["username"] = `${application.project} ${email}`;
          })
          .finally(() => {
            next();
          });
      }
    }
  },
  (req: Request, res: Response, next: NextFunction) => {
    const request = new ORequest(req);
    const response = new OResponse(res);
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
              scope: token.scope
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

export default router;
