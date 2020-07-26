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
  ResponseHandler,
  Validators,
  ValidateObjectId,
} from "@ikoabo/core_srv";
import { ProjectCtrl } from "@/Projects/controllers/projects.controller";
import {
  TokenLifetimeValidation,
  RecoverTypeValidation,
  RestrictIpValidation,
  EmailConfirmationValidation,
  PasswordPolicyValidation,
  SocialNetworkSettingValidation,
  NotificationsSettingsValidation,
  TypeSettingParamsValidation,
} from "@/Projects/models/projects.joi";
import { ProjectDocument } from "@/Projects/models/projects.model";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";

const router = Router();

router.post(
  "/:id/setting/social",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(SocialNetworkSettingValidation),
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(TypeSettingParamsValidation, "params"),
  Validators.joi(SocialNetworkSettingValidation),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.updateSocialNetwork(
      req.params["id"],
      parseInt(req.params["type"]),
      req.body
    )
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(TypeSettingParamsValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteSocialNetwork(
      req.params["id"],
      parseInt(req.params["type"])
    )
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(TokenLifetimeValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.tokenLifetime.accessToken": req.body["accessToken"],
      "settings.tokenLifetime.refreshToken": req.body["refreshToken"],
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(RecoverTypeValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.recover": req.body["recover"],
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(RestrictIpValidation),
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(RestrictIpValidation),
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(EmailConfirmationValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.emailConfirmation.type": req.body["type"],
      "settings.emailConfirmation.time": req.body["time"],
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(PasswordPolicyValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const update: any = {
      "settings.passwordPolicy.len": req.body["len"],
      "settings.passwordPolicy.upperCase": req.body["upperCase"],
      "settings.passwordPolicy.lowerCase": req.body["lowerCase"],
      "settings.passwordPolicy.specialChars": req.body["specialChars"],
      "settings.passwordPolicy.numbers": req.body["numbers"],
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(NotificationsSettingsValidation),
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(TypeSettingParamsValidation, "params"),
  Validators.joi(NotificationsSettingsValidation),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.updateNotification(
      req.params["id"],
      parseInt(req.params["type"]),
      req.body
    )
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
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(TypeSettingParamsValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteNotification(
      req.params["id"],
      parseInt(req.params["type"])
    )
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
