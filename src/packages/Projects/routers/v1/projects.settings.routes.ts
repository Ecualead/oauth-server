/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ResponseHandler, Validator, ValidateObjectId } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";
import { ProjectCtrl } from "@/Projects/controllers/projects.controller";
import {
  TokenLifetimeValidation,
  RecoverTypeValidation,
  RestrictIpValidation,
  EmailConfirmationValidation,
  PasswordPolicyValidation,
  NotificationsSettingsValidation,
  TypeSettingParamsValidation
} from "@/Projects/models/projects.joi";
import { ProjectDocument } from "@/Projects/models/projects.model";
import { SocialNetworkSettingValidation } from "@/SocialNetworks/models/social.networks.joi";

const router = Router();

router.post(
  "/:id/setting/social",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(SocialNetworkSettingValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.addSocialNetwork(req.params["id"], req.body)
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put(
  "/:id/setting/social/:type",
  Validator.joi(TypeSettingParamsValidation, "params"),
  Validator.joi(SocialNetworkSettingValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.updateSocialNetwork(req.params["id"], parseInt(req.params["type"]), req.body)
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id/setting/social/:type",
  Validator.joi(TypeSettingParamsValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteSocialNetwork(req.params["id"], parseInt(req.params["type"]))
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post(
  "/:id/setting/lifetime",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(TokenLifetimeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.tokenLifetime.accessToken": req.body["accessToken"],
      "settings.tokenLifetime.refreshToken": req.body["refreshToken"]
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

router.post(
  "/:id/setting/recover",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RecoverTypeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.recover": req.body["recover"]
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

router.post(
  "/:id/setting/restrictip",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RestrictIpValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.addIp(req.params["id"], req.body["ipAddress"])
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id/setting/restrictip",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RestrictIpValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteIp(req.params["id"], req.body["ipAddress"])
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post(
  "/:id/setting/confirmation",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(EmailConfirmationValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.emailConfirmation.type": req.body["type"],
      "settings.emailConfirmation.time": req.body["time"]
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

router.post(
  "/:id/setting/password",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(PasswordPolicyValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.passwordPolicy.len": req.body["len"],
      "settings.passwordPolicy.upperCase": req.body["upperCase"],
      "settings.passwordPolicy.lowerCase": req.body["lowerCase"],
      "settings.passwordPolicy.specialChars": req.body["specialChars"],
      "settings.passwordPolicy.numbers": req.body["numbers"]
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

router.post(
  "/:id/setting/notification",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(NotificationsSettingsValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.addNotification(req.params["id"], req.body)
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put(
  "/:id/setting/notification/:type",
  Validator.joi(TypeSettingParamsValidation, "params"),
  Validator.joi(NotificationsSettingsValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.updateNotification(req.params["id"], parseInt(req.params["type"]), req.body)
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id/setting/notification/:type",
  Validator.joi(TypeSettingParamsValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteNotification(req.params["id"], parseInt(req.params["type"]))
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
