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

const router = Router();

router.post(
  "/",
  Validators.joi(ProjectCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const project: Project = {
      domain: req.body["domain"],
      cannonical: req.body["cannonical"],
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      links: req.body["links"],
      scope: req.body["scope"],
      owner: "5e7d8203cef9b37116a6aeef",
    };
    ProjectCtrl.create(project)
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
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ProjectUpdateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const project: Project = {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      links: req.body["links"],
      modifiedBy: "5e7d8203cef9b37116a6aeef",
    };
    ProjectCtrl.update(req.params.id, project)
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
  Validators.joi(ValidateObjectId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.fetch(req.params.id)
      .then((value: ProjectDocument) => {
        res.locals["response"] = {
          id: value.id,
          cannonical: value.cannonical,
          name: value.name,
          image: value.image,
          description: value.description,
          links: {
            app: Objects.get(value, "links.app"),
            web: Objects.get(value, "links.web"),
            facebook: Objects.get(value, "links.facebook"),
            twitter: Objects.get(value, "links.twitter"),
            instagram: Objects.get(value, "links.instagram"),
            youtube: Objects.get(value, "links.youtube"),
            privacy: Objects.get(value, "links.privacy"),
            terms: Objects.get(value, "links.terms"),
          },
          scope: value.scope,
          modules: value.modules,
          settings: value.settings,
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
  Validators.joi(SubModuleValidation, "params"),
  ModuleCtrl.validateModule("params.module"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.addModule(req.params.id, req.params.module)
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
  Validators.joi(SubModuleValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.deleteModule(req.params.id, req.params.module)
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
