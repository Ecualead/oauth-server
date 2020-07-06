import { Router, Request, Response, NextFunction } from "express";
import JSONStream from "jsonstream";
import {
  ResponseHandler,
  Validators,
  BASE_STATUS,
  ValidateObjectId,
} from "@ikoabo/core_srv";
import { Domains } from "@/Domains/controllers/domains.controller";
import { Domain, DomainDocument } from "@/Domains/models/domains.model";
import {
  DomainCreateValidation,
  DomainUpdateValidation,
} from "@/Domains/models/domains.joi";
import { SubModuleValidation } from "@/Modules/models/modules.joi";
import { Modules } from "@/Modules/controllers/modules.controller";
import { ScopeValidation, StatusValidation } from "@/models/base.joi";

const router = Router();
const DomainCtrl = Domains.shared;

router.post(
  "/",
  Validators.joi(DomainCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Get rigth user
    let domain: Domain = {
      name: req.body["name"],
      image: req.body["image"],
      description: req.body["description"],
      scope: req.body["scope"],
      owner: "5e7d8203cef9b37116a6aeef",
      status: BASE_STATUS.BS_ENABLED,
      modifiedBy: "5e7d8203cef9b37116a6aeef",
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
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(DomainUpdateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    let domain: Domain = {
      name: req.body["name"],
      image: req.body["image"],
      description: req.body["description"],
      modifiedBy: "5e7d8203cef9b37116a6aeef",
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
  (_req: Request, res: Response, _next: NextFunction) => {
    DomainCtrl.fetchAll().pipe(JSONStream.stringify()).pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get(
  "/:id",
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
  Validators.joi(SubModuleValidation, "params"),
  Modules.validateModule("params.module"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.addModule(req.params.id, req.params.module)
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
  Validators.joi(SubModuleValidation, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.deleteModule(req.params.id, req.params.module)
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
