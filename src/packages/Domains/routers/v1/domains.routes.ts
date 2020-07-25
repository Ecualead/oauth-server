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
import { Domain, DomainDocument } from "@/Domains/models/domains.model";
import {
  DomainCreateValidation,
  DomainUpdateValidation,
} from "@/Domains/models/domains.joi";
import { SubModuleValidation } from "@/Modules/models/modules.joi";
import { ModuleCtrl } from "@/Modules/controllers/modules.controller";
import { ScopeValidation, StatusValidation } from "@/models/base.joi";
import { OAuth2Ctrl } from "@/packages/OAuth2/controllers/oauth2.controller";

const router = Router();

router.post(
  "/",
  OAuth2Ctrl.authenticate(["user"]),
  Validators.joi(DomainCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Get rigth user
    let domain: Domain = {
      name: req.body["name"],
      image: req.body["image"],
      description: req.body["description"],
      scope: req.body["scope"],
      owner: Objects.get(res.locals, "token.user._id"),
      status: BASE_STATUS.BS_ENABLED,
      modifiedBy: Objects.get(res.locals, "token.user._id"),
    };
    DomainCtrl.create(domain)
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
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(DomainUpdateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    let domain: Domain = {
      name: req.body["name"],
      image: req.body["image"],
      description: req.body["description"],
    };
    DomainCtrl.update(req.params.id, domain)
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
    DomainCtrl.fetchAll().pipe(JSONStream.stringify()).pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get(
  "/:id",
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.fetch(req.params.id)
      .then((value: DomainDocument) => {
        res.locals["response"] = {
          id: value.id,
          name: value.name,
          image: value.image,
          description: value.description,
          scope: value.scope,
          modules: value.modules,
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
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
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
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(StatusValidation, "params"),
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
  "/:id/scope/:scope",
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ScopeValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.addScope(req.params.id, req.params.scope)
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
  "/:id/scope/:scope",
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ScopeValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.deleteScope(req.params.id, req.params.scope)
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
  "/:id/module/:module",
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(SubModuleValidation, "params"),
  ModuleCtrl.validate("params.module"),
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
  "/:id/module/:module",
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  ModuleCtrl.validate("params.module"),
  Validators.joi(SubModuleValidation, "params"),
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
