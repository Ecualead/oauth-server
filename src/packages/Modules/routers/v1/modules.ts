import { Router, Request, Response, NextFunction } from "express";
import JSONStream from "jsonstream";
import {
  ResponseHandler,
  Token,
  Validators,
  Arrays,
  ValidateObjectId,
} from "@ikoabo/core_srv";
import {
  Module,
  ModuleDocument,
  MODULES_STATUS,
} from "@/packages/Modules/models/modules.model";
import { Modules } from "@/Modules/controllers/Modules";
import { ModuleValidation } from "@/packages/Modules/models/modules.joi";
import { ScopeUpdate } from "@/models/JoiBase";

const router = Router();
const ModuleCtrl = Modules.shared;

router.post(
  "/",
  Validators.joi(ModuleValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const module: Module = {
      name: req.body["name"],
      description: req.body["description"],
      owner: "5e7d8203cef9b37116a6aeef",
      scope: Arrays.force(req.body["scope"]),
      url: req.body["url"],
      terms: req.body["terms"],
      secret: Token.longToken,
      status: MODULES_STATUS.MS_ENABLED,
    };
    ModuleCtrl.create(module)
      .then((value: ModuleDocument) => {
        res.locals["response"] = {
          id: value.id,
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
  Validators.joi(ModuleValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const module: Module = {
      name: req.body["name"],
      description: req.body["description"],
      scope: Arrays.force(req.body["scope"]),
      url: req.body["url"],
      terms: req.body["terms"],
    };
    ModuleCtrl.update(req.params.id, module)
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
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  (req: Request, res: Response, next: NextFunction) => {
    ModuleCtrl.fetch(req.params.id)
      .then((value: ModuleDocument) => {
        res.locals["response"] = {
          id: value.id,
          name: value.name,
          description: value.description,
          scope: value.scope,
          url: value.url,
          terms: value.terms,
          status: value.status,
        };
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
    ModuleCtrl.fetchAll().pipe(JSONStream.stringify()).pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
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
  "/:id/scope/:scope",
  Validators.joi(ScopeUpdate, "params"),
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
  "/:id/scope/:scope",
  Validators.joi(ScopeUpdate, "params"),
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

export default router;
