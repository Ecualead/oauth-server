/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Objects } from "@ikoabo/core";
import { ResponseHandler, ValidateObjectId, Validator } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { Token, Request as ORequest, Response as OResponse } from "oauth2-server";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ApplicationAccessPolicyCtrl } from "@/controllers/application/access-policy.controller";
import { AccountCtrl } from "@/controllers/account/account.controller";
import { AccountDocument } from "@/models/account/account.model";

const router = Router();

/**
 * @api {get} /v1/oauth/profile/:id Get user profile info
 * @apiVersion 2.0.0
 * @apiName ProfileUser
 * @apiGroup User Accounts
 */
router.get(
  "/profile/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_avatar_info"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.fetch(req.params.id)
      .then((value: AccountDocument) => {
        res.locals["response"] = {
          user: value.id,
          name: value.name,
          lastname1: value.lastname1,
          lastname2: value.lastname2,
          initials: value.initials,
          color1: value.color1,
          color2: value.color2,
          code: value.code
        };
        next();
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
