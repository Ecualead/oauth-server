import { Router, Request, Response, NextFunction } from "express";
import JSONStream from "jsonstream";
import {
  ResponseHandler,
  Token,
  Validators,
  ValidateObjectId,
  BASE_STATUS,
} from "@ikoabo/core_srv";
import {
  Module,
  ModuleDocument,
} from "@/Modules/models/modules.model";
import { Modules } from "@/Modules/controllers/modules.controller";
import {
  ModuleCreateValidation,
  ModuleUpdateValidation,
} from "@/Modules/models/modules.joi";
import { ScopeValidation, StatusValidation } from "@/models/base.joi";

const router = Router();
const ModuleCtrl = Modules.shared;

router.post(
  "/",
  Validators.joi(ModuleCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    const module: Module = {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      owner: "5e7d8203cef9b37116a6aeef",
      scope: req.body["scope"],
      url: req.body["url"],
      terms: req.body["terms"],
      secret: Token.longToken,
      status: BASE_STATUS.BS_ENABLED,
    };

    /* Create the new module */
    ModuleCtrl.create(module)
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
  (req: Request, res: Response, next: NextFunction) => {
    const module: Module = {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
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
  "/owns",
  (_req: Request, res: Response, _next: NextFunction) => {
    ModuleCtrl.fetchAll().pipe(JSONStream.stringify()).pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get(
  "/",
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
  "/:id/scope/:scope",
  Validators.joi(ScopeValidation, "params"),
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
  Validators.joi(ScopeValidation, "params"),
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
