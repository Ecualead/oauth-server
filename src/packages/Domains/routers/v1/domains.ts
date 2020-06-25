import { Router, Request, Response, NextFunction } from "express";
import { ResponseHandler, Validators, Arrays, BASE_STATUS } from "@ikoabo/core_srv";
import { CheckId, Checkscope } from "@/models/joi/base";
import { Domains } from "@/Domains/controllers/Domains";
import { Domain, DomainDocument } from "@/Domains/models/domains.model";
import { DomainValidation } from "@/Domains/models/domains.joi";
import { SubModuleValidation } from "@/Modules/models/modules.joi";
import { Modules } from "@/packages/Modules/controllers/Modules";

const router = Router();
const DomainCtrl = Domains.shared;

router.post(
  "/",
  Validators.joi(DomainValidation),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Get rigth user
    let domain: Domain = {
      name: req.body["name"],
      description: req.body["description"],
      scope: Arrays.force(req.body["scope"]),
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
  Validators.joi(CheckId, "params"),
  Validators.joi(DomainValidation),
  (req: Request, res: Response, next: NextFunction) => {
    let domain: Domain = {
      name: req.body["name"],
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
  "/:id",
  Validators.joi(CheckId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    DomainCtrl.fetch(req.params.id)
      .then((value: DomainDocument) => {
        res.locals["response"] = {
          id: value.id,
          name: value.name,
          description: value.description,
          scope: value.scope,
          modules: value.modules,
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

router.delete(
  "/:id",
  Validators.joi(CheckId, "params"),
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

router.post(
  "/:id/scope/:scope",
  Validators.joi(Checkscope, "params"),
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
  Validators.joi(Checkscope, "params"),
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
