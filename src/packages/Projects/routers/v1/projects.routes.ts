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
  ValidateObjectId,
  Objects,
} from "@ikoabo/core_srv";
import { ProjectCtrl } from "@/Projects/controllers/projects.controller";
import {
  ProjectCreateValidation,
  ProjectUpdateValidation,
} from "@/Projects/models/projects.joi";
import { ProjectDocument, Project } from "@/Projects/models/projects.model";
import { ScopeValidation, StatusValidation } from "@/models/base.joi";
import { SubModuleValidation } from "@/Modules/models/modules.joi";
import { ModuleCtrl } from "@/Modules/controllers/modules.controller";
import { DomainCtrl } from "@/Domains/controllers/domains.controller";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";

const router = Router();

router.post(
  "/",
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("body.domain", "token.user._id"),
  Validators.joi(ProjectCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    /* Register the new project */
    ProjectCtrl.create({
      domain: req.body["domain"],
      canonical: req.body["canonical"],
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      links: req.body["links"],
      scope: req.body["scope"],
      owner: Objects.get(res.locals, "token.user._id"),
    })
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
  "/:id",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ProjectUpdateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    /* Update the project data */
    ProjectCtrl.update(req.params.id, {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      links: req.body["links"],
    })
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get(
  "/domain/:id",
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.fetchAll({ domain: req.params.id })
      .pipe(JSONStream.stringify())
      .pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get(
  "/:id",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  (_req: Request, res: Response, next: NextFunction) => {
    res.locals["response"] = {
      id: res.locals["project"].id,
      canonical: res.locals["project"].canonical,
      name: res.locals["project"].name,
      image: res.locals["project"].image,
      description: res.locals["project"].description,
      links: {
        app: Objects.get(res.locals["project"], "links.app"),
        web: Objects.get(res.locals["project"], "links.web"),
        facebook: Objects.get(res.locals["project"], "links.facebook"),
        twitter: Objects.get(res.locals["project"], "links.twitter"),
        instagram: Objects.get(res.locals["project"], "links.instagram"),
        youtube: Objects.get(res.locals["project"], "links.youtube"),
        privacy: Objects.get(res.locals["project"], "links.privacy"),
        terms: Objects.get(res.locals["project"], "links.terms"),
      },
      scope: res.locals["project"].scope,
      modules: res.locals["project"].modules,
      settings: res.locals["project"].settings,
      status: res.locals["project"].status,
      createdAt: res.locals["project"].createdAt,
      updatedAt: res.locals["project"].updatedAt,
    };
    next();
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ValidateObjectId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.delete(req.params.id)
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
  "/:id/:action",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(StatusValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    const handler =
      req.params.action === "enable"
        ? ProjectCtrl.enable(req.params.id)
        : ProjectCtrl.disable(req.params.id);
    handler
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
  "/:id/scope/:scope",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ScopeValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.addScope(req.params.id, req.params.scope)
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
  "/:id/scope/:scope",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(ScopeValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteScope(req.params.id, req.params.scope)
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
  "/:id/module/:module",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(SubModuleValidation, "params"),
  ModuleCtrl.validate("params.module"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.addModule(req.params.id, res.locals["module"])
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
  "/:id/module/:module",
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  Validators.joi(SubModuleValidation, "params"),
  ModuleCtrl.validate("params.module"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteModule(req.params.id, res.locals["module"])
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
