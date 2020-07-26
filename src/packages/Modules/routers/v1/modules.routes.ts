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
import JSONStream from "jsonstream";
import {
  ResponseHandler,
  Token,
  Validators,
  ValidateObjectId,
  BASE_STATUS,
  Objects,
} from "@ikoabo/core_srv";
import { Module, ModuleDocument } from "@/Modules/models/modules.model";
import { ModuleCtrl } from "@/Modules/controllers/modules.controller";
import {
  ModuleCreateValidation,
  ModuleUpdateValidation,
} from "@/Modules/models/modules.joi";
import {
  ScopeValidation,
  StatusValidation,
  RestrictionValidation,
} from "@/models/base.joi";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";

const router = Router();

router.post(
  "/",
  Validators.joi(ModuleCreateValidation),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Create the new module */
    ModuleCtrl.create({
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      owner: Objects.get(res.locals, "token.user._id"),
      scope: req.body["scope"],
      url: req.body["url"],
      terms: req.body["terms"],
      secret: Token.longToken,
      restriction: req.body["restriction"],
      status: BASE_STATUS.BS_ENABLED,
    })
      .then((value: ModuleDocument) => {
        res.locals["response"] = {
          id: value.id,
          secret: value.secret,
        };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put(
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ModuleUpdateValidation),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  ModuleCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.update(req.params.id, {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      url: req.body["url"],
      terms: req.body["terms"],
    })
      .then((value: ModuleDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get(
  "/",
  OAuth2Ctrl.authenticate(["user"]),
  (_req: Request, res: Response, _next: NextFunction) => {
    ModuleCtrl.fetchAll({ status: BASE_STATUS.BS_ENABLED })
      .pipe(JSONStream.stringify())
      .pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get(
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.fetch(req.params.id)
      .then((value: ModuleDocument) => {
        res.locals["response"] = {
          id: value.id,
          name: value.name,
          image: value.image,
          description: value.description,
          scope: value.scope,
          url: value.url,
          terms: value.terms,
          status: value.status,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt,
        };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.delete(req.params.id)
      .then((value: ModuleDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put(
  "/:id/:action",
  Validators.joi(StatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  ModuleCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const handler =
      req.params.action === "enable"
        ? ModuleCtrl.enable(req.params.id)
        : ModuleCtrl.disable(req.params.id);
    handler
      .then((value: ModuleDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put(
  "/:id/scope",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  ModuleCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.addScope(req.params.id, req.params.scope)
      .then((value: ModuleDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id/scope",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  ModuleCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.deleteScope(req.params.id, req.params.scope)
      .then((value: ModuleDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put(
  "/:id/restriction",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(RestrictionValidation),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  ModuleCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.addRestriction(req.params.id, req.body["restriction"])
      .then((value: ModuleDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id/restriction",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(RestrictionValidation),
  OAuth2Ctrl.authenticate(["user", "mod_ims_module_ctrl"]),
  ModuleCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.deleteRestriction(req.params.id, req.body["restriction"])
      .then((value: ModuleDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
