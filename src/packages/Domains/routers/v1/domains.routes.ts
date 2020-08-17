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
import { Objects, SERVER_STATUS } from "@ikoabo/core";
import { Validator, ResponseHandler, ValidateObjectId } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import JSONStream from "jsonstream";
import { DomainCtrl } from "@/Domains/controllers/domains.controller";
import { DomainCreateValidation, DomainUpdateValidation } from "@/Domains/models/domains.joi";
import { DomainDocument } from "@/Domains/models/domains.model";
import { ScopeValidation, StatusValidation } from "@/models/base.joi";
import { ModuleCtrl } from "@/Modules/controllers/modules.controller";
import { SubModuleValidation } from "@/Modules/models/modules.joi";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";

const router = Router();

router.post(
  "/",
  Validator.joi(DomainCreateValidation),
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
      status: SERVER_STATUS.ENABLED,
      modifiedBy: Objects.get(res.locals, "token.user._id")
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
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(DomainUpdateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Update the domain information */
    DomainCtrl.update(req.params.id, {
      name: req.body["name"],
      image: req.body["image"],
      description: req.body["description"]
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
  Validator.joi(ValidateObjectId, "params"),
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
      updatedAt: res.locals["domain"].updatedAt
    };
    next();
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
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
  Validator.joi(StatusValidation, "params"),
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
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
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
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
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
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(SubModuleValidation),
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
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(SubModuleValidation),
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
