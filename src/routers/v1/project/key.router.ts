/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import {
  ResponseHandler,
  Validator,
  ValidateObjectId,
  Objects,
  SERVER_STATUS,
  Streams,
  Tokens
} from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ProjectCtrl } from "@/controllers/project/project.controller";
import {
  KeyValidation,
  ProjectRelatedParamsValidation,
  ProjectRelatedStatusValidation
} from "@/validators/project.joi";
import { ProjectKeyCtrl } from "@/controllers/project/key.controller";
import { ProjectKeyDocument } from "@/models/project/key.model";
import { ScopeValidation } from "@/validators/base.joi";

const router = Router();

/**
 * @api {post} /v1/project/:id/setting/key Register project access key
 * @apiVersion 2.0.0
 * @apiName CreateKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.post(
  "/:id/setting/key",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(KeyValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectKeyCtrl.create({
      project: req.params["id"],
      name: Objects.get(req, "body.name"),
      description: Objects.get(req, "body.description"),
      key: Tokens.long,
      scope: [],
      status: SERVER_STATUS.ENABLED,
      owner: Objects.get(res.locals, "token.user._id")
    })
      .then((value: ProjectKeyDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/key/:obj Update project access key
 * @apiVersion 2.0.0
 * @apiName UpdateKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.put(
  "/:id/setting/key/:obj",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  Validator.joi(KeyValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectKeyCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectKeyCtrl.update(
      { _id: req.params["obj"], project: req.params["id"] },
      {
        name: Objects.get(req, "body.name"),
        description: Objects.get(req, "body.description")
      }
    )
      .then((value: ProjectKeyDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/project/:id/setting/key Get all project access keys
 * @apiVersion 2.0.0
 * @apiName FetchAllKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.get(
  "/:id/setting/key",
  Validator.joi(ValidateObjectId, "query.d"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, _next: NextFunction) => {
    ProjectKeyCtrl.fetchAll({ project: req.params.id })
      .pipe(Streams.stringify())
      .pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/project/:id/setting/key/:obj Get project access key information
 * @apiVersion 2.0.0
 * @apiName FetchKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.get(
  "/:id/setting/key/:obj",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectKeyCtrl.isValidOwner("params.obj", "token.user._id"),
  (_req: Request, res: Response, next: NextFunction) => {
    res.locals["response"] = {
      id: Objects.get(res, "locals.obj.id"),
      name: Objects.get(res, "locals.obj.name"),
      description: Objects.get(res, "locals.obj.description"),
      key: Objects.get(res, "locals.obj.key"),
      scope: Objects.get(res, "locals.obj.scope"),
      status: Objects.get(res, "locals.obj.status"),
      createdAt: Objects.get(res, "locals.obj.createdAt"),
      updatedAt: Objects.get(res, "locals.obj.updatedAt")
    };

    next();
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {delete} /v1/project/:id/setting/key/:obj Delete project access key
 * @apiVersion 2.0.0
 * @apiName DeleteKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.delete(
  "/:id/setting/key/:obj",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectKeyCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectKeyCtrl.delete({ _id: req.params["obj"], project: req.params["id"] })
      .then((value: ProjectKeyDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/key/:obj/:action Change a project access key state
 * @apiVersion 2.0.0
 * @apiName StatusKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.put(
  "/:id/setting/key/:obj/:action",
  Validator.joi(ProjectRelatedStatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectKeyCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const handler =
      req.params.action === "enable"
        ? ProjectKeyCtrl.enable(req.params.id)
        : ProjectKeyCtrl.disable(req.params.id);
    handler
      .then((value: ProjectKeyDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {post} /v1/project/:id/setting/key/:obj/scope Add scope to project access key
 * @apiVersion 2.0.0
 * @apiName AddScopeKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.post(
  "/v1/project/:id/setting/key/:obj/scope",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectKeyCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectKeyCtrl.addToSet(req.params.id, "scope", req.body["scope"])
      .then((value: ProjectKeyDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {delete} /v1/project/:id/setting/key/:obj/scope Delete scope from project access key
 * @apiVersion 2.0.0
 * @apiName DeleteScopeKeyProjectSetting
 * @apiGroup Project Access Keys
 */
router.delete(
  "/v1/project/:id/setting/key/:obj/scope",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectKeyCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectKeyCtrl.pull(req.params.id, "scope", req.body["scope"])
      .then((value: ProjectKeyDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
