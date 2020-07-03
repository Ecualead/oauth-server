import { Router, Request, Response, NextFunction } from "express";
import { ResponseHandler, Validators, Arrays, ValidateObjectId } from "@ikoabo/core_srv";
import { Projects } from "@/packages/Projects/controllers/projects.controller";
import {
  ProjectCreateValidation,
  ProjectUpdateValidation,
} from "@/Projects/models/projects.joi";
import { ProjectDocument, Project } from "../../models/projects.model";
import { ScopeValidation } from "@/models/base.joi";

const router = Router();
const ProjectCtrl = Projects.shared;

router.post(
  "/",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ProjectCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const project: Project = {
      domain: req.body["domain"],
      cannonical: req.body["cannonical"],
      name: req.body["name"],
      description: req.body["description"],
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
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.fetch(req.params.id)
      .then((value: ProjectDocument) => {
        res.locals["response"] = {
          id: value.id,
          cannonical: value.cannonical,
          name: value.name,
          description: value.description,
          links: value.links,
          scope: value.scope,
          modules: value.modules,
          settings: value.settings,
          status: value.status,
          createdAt: value.createdAt,
        };
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

export default router;
