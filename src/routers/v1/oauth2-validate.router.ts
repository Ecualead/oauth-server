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
import { Objects } from "@ikoabo/core";
import { ResponseHandler } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { Token, Request as ORequest, Response as OResponse } from "oauth2-server";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ApplicationAccessPolicyCtrl } from "@/controllers/application/access-policy.controller";

const router = Router();

router.post(
  "/authenticate",
  (req: Request, res: Response, next: NextFunction) => {
    const request = new ORequest(req);
    const response = new OResponse(res);
    OAuth2Ctrl.server
      .authenticate(request, response)
      .then((token: Token) => {
        const project = Objects.get(token, "client.project.id", null);
        /* Validate application restrictions */
        ApplicationAccessPolicyCtrl.canAccess(req, Objects.get(token, "client.id", null))
          .then(() => {
            /* Set basic application information into the response */
            res.locals["response"] = {
              application: Objects.get(token, "client.id", null),
              project: project,
              domain: Objects.get(token, "client.project.domain", null),
              scope: token.scope
            };

            /* Add user information if the token belongs to an user */
            const user = Objects.get(token, "user.id", null);
            if (user && user !== res.locals["response"]["application"]) {
              res.locals["response"]["user"] = user;
              res.locals["response"]["username"] = Objects.get(token, "username", null);
            }
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
