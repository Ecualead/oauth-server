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
import { ResponseHandler, Validator, ValidateObjectId } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ProjectCtrl } from "@/controllers/project/project.controller";
import {
  TokenLifetimeValidation,
  EmailConfirmationValidation,
  PasswordPolicyValidation,
} from "@/validators/project.joi";
import { ProjectDocument } from "@/models/project/project.model";
import { Objects } from "@ikoabo/core";
import { EMAIL_CONFIRMATION, LIFETIME_TYPE } from "@/constants/project.enum";

const router = Router();

/**
 * @api {put} /v1/project/:id/setting/lifetime Set project tokens lifetime
 * @apiVersion 2.0.0
 * @apiName SettingLifetimeProject
 * @apiGroup Project Settings
 */
router.put(
  "/:id/setting/lifetime",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(TokenLifetimeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.tokenLifetime.accessToken": Objects.get(
        req,
        "body.accessToken",
        LIFETIME_TYPE.MONTH
      ),
      "settings.tokenLifetime.refreshToken": Objects.get(
        req,
        "body.refreshToken",
        LIFETIME_TYPE.YEAR
      )
    };
    ProjectCtrl.update(req.params["id"], update)
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/confirmation Set project email confirmation
 * @apiVersion 2.0.0
 * @apiName SettingConfirmationProject
 * @apiGroup Project Settings
 */
router.put(
  "/:id/setting/confirmation",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(EmailConfirmationValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.emailConfirmation.type": Objects.get(
        req,
        "body.type",
        EMAIL_CONFIRMATION.NOT_REQUIRED
      ),
      "settings.emailConfirmation.time": Objects.get(req, "body.time", LIFETIME_TYPE.MONTH)
    };
    ProjectCtrl.update(req.params["id"], update)
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/password Set project password policy
 * @apiVersion 2.0.0
 * @apiName SettingConfirmationProject
 * @apiGroup Project Settings
 */
router.put(
  "/:id/setting/password",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(PasswordPolicyValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.passwordPolicy.lifetime": Objects.get(req, "body.lifetime", LIFETIME_TYPE.INFINITE),
      "settings.passwordPolicy.len": Objects.get(req, "body.len", 5),
      "settings.passwordPolicy.upperCase": Objects.get(req, "body.upperCase", true),
      "settings.passwordPolicy.lowerCase": Objects.get(req, "body.lowerCase", true),
      "settings.passwordPolicy.specialChars": Objects.get(req, "body.specialChars", false),
      "settings.passwordPolicy.numbers": Objects.get(req, "body.numbers", true)
    };
    ProjectCtrl.update(req.params["id"], update)
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/* TODO XXX Add notification settings */

export default router;
