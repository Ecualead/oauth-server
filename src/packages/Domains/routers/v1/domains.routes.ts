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
  Validators,
  BASE_STATUS,
  ValidateObjectId,
  Objects,
} from "@ikoabo/core_srv";
import { DomainCtrl } from "@/Domains/controllers/domains.controller";
import { DomainDocument } from "@/Domains/models/domains.model";
import {
  DomainCreateValidation,
  DomainUpdateValidation,
} from "@/Domains/models/domains.joi";
import { SubModuleValidation } from "@/Modules/models/modules.joi";
import { ModuleCtrl } from "@/Modules/controllers/modules.controller";
import { ScopeValidation, StatusValidation } from "@/models/base.joi";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";

const router = Router();

router.post(
  "/",
  Validators.joi(DomainCreateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Create the new domain */
    DomainCtrl.create({
      name: req.body["name"],
      canonical: req.body["canonical"],
      image: req.body["image"],
      description: req.body["description"],
      scope: req.body["scope"],
      owner: Objects.get(res.locals, "token.user._id"),
      status: BASE_STATUS.BS_ENABLED,
      modifiedBy: Objects.get(res.locals, "token.user._id"),
    })
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
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
  Validators.joi(DomainUpdateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Update the domain information */
    DomainCtrl.update(req.params.id, {
      name: req.body["name"],
      image: req.body["image"],
      description: req.body["description"],
    })
      .then((value: DomainDocument) => {
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
    /* Fetch all domains of the current user */
    DomainCtrl.fetchAll({ owner: Objects.get(res.locals, "token.user._id") })
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
  DomainCtrl.validate("params.id", "token.user._id"),
  (_req: Request, res: Response, next: NextFunction) => {
    /* Return the domain information */
    res.locals["response"] = {
      id: res.locals["domain"].id,
      name: res.locals["domain"].name,
      image: res.locals["domain"].image,
      description: res.locals["domain"].description,
      scope: res.locals["domain"].scope,
      modules: res.locals["domain"].modules,
      status: res.locals["domain"].status,
      createdAt: res.locals["domain"].createdAt,
      updatedAt: res.locals["domain"].updatedAt,
    };
    next();
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Delete a domain */
    DomainCtrl.delete(req.params.id)
      .then((value: DomainDocument) => {
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
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const handler =
      req.params.action === "enable"
        ? DomainCtrl.enable(req.params.id)
        : DomainCtrl.disable(req.params.id);
    handler
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post(
  "/:id/scope",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.addScope(req.params.id, req.body["scope"])
      .then((value: DomainDocument) => {
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
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.deleteScope(req.params.id, req.body["scope"])
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post(
  "/:id/module",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(SubModuleValidation),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  ModuleCtrl.validate("body.module"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.addModule(req.params.id, res.locals["module"])
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id/module",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(SubModuleValidation),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  ModuleCtrl.validate("params.module"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.deleteModule(req.params.id, res.locals["module"])
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
