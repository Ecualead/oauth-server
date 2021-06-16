/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ResponseHandler, Validator, ValidateObjectId } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ProjectCtrl } from "@/controllers/project/project.controller";
import {
  ExternalAuthValidation,
  ProjectRelatedParamsValidation,
  ProjectRelatedStatusValidation
} from "@/validators/project.joi";
import { ProjectExternalAuthCtrl } from "@/controllers/project/external-auth.controller";
import { Objects, SERVER_STATUS, Streams } from "@ikoabo/core";
import { EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";
import { ProjectExternalAuthDocument } from "@/models/project/external-auth.model";

const router = Router();

/**
 * @api {post} /v1/project/:id/setting/external Register external project authentication schema
 * @apiVersion 2.0.0
 * @apiName CreateExternalProjectSetting
 * @apiGroup Project External Auth
 */
router.post(
  "/:id/setting/external",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ExternalAuthValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectExternalAuthCtrl.create({
      project: req.params["id"],
      name: Objects.get(req, "body.name"),
      description: Objects.get(req, "body.description"),
      type: Objects.get(req, "body.type", EXTERNAL_AUTH_TYPE.UNKNOWN),
      clientId: Objects.get(req, "body.clientId"),
      clientSecret: Objects.get(req, "body.clientSecret"),
      scope: Objects.get(req, "body.scope"),
      profile: Objects.get(req, "body.profile"),
      status: SERVER_STATUS.ENABLED,
      owner: Objects.get(res.locals, "token.user._id")
    })
      .then((value: ProjectExternalAuthDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/external/:obj Update external project authentication schema
 * @apiVersion 2.0.0
 * @apiName UpdateExternalProjectSetting
 * @apiGroup Project External Auth
 */
router.put(
  "/:id/setting/external/:obj",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  Validator.joi(ExternalAuthValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectExternalAuthCtrl.validate("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectExternalAuthCtrl.update(
      { _id: req.params["obj"], project: req.params["id"] },
      {
        name: Objects.get(req, "body.name"),
        description: Objects.get(req, "body.description"),
        type: Objects.get(req, "body.type", EXTERNAL_AUTH_TYPE.UNKNOWN),
        clientId: Objects.get(req, "body.clientId"),
        clientSecret: Objects.get(req, "body.clientSecret"),
        scope: Objects.get(req, "body.scope"),
        profile: Objects.get(req, "body.profile")
      }
    )
      .then((value: ProjectExternalAuthDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/project/:id/setting/external Get all external authentication schema information
 * @apiVersion 2.0.0
 * @apiName FetchAllExternalProjectSetting
 * @apiGroup Project External Auth
 */
router.get(
  "/:id/setting/external",
  Validator.joi(ValidateObjectId, "query.d"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, _next: NextFunction) => {
    ProjectExternalAuthCtrl.fetchAll({ project: req.params.id })
      .pipe(Streams.stringify())
      .pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/project/:id/setting/external/:obj Get external authentication schema information
 * @apiVersion 2.0.0
 * @apiName FetchExternalProjectSetting
 * @apiGroup Project External Auth
 */
router.get(
  "/:id/setting/external/:obj",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectExternalAuthCtrl.validate("params.obj", "token.user._id"),
  (_req: Request, res: Response, next: NextFunction) => {
    res.locals["response"] = {
      id: Objects.get(res, "locals.obj.id"),
      project: Objects.get(res, "locals.obj.project"),
      name: Objects.get(res, "locals.obj.name"),
      description: Objects.get(res, "locals.obj.description"),
      type: Objects.get(res, "locals.obj.type"),
      clientId: Objects.get(res, "locals.obj.clientId"),
      clientSecret: Objects.get(res, "locals.obj.clientSecret"),
      scope: Objects.get(res, "locals.obj.scope"),
      profile: Objects.get(res, "locals.obj.profile"),
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
 * @api {delete} /v1/project/:id/setting/external/:obj Delete external project authentication schema
 * @apiVersion 2.0.0
 * @apiName DeleteExternalProjectSetting
 * @apiGroup Project External Auth
 */
router.delete(
  "/:id/setting/external/:obj",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectExternalAuthCtrl.validate("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectExternalAuthCtrl.delete({ _id: req.params["obj"], project: req.params["id"] })
      .then((value: ProjectExternalAuthDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/external/:obj/:action Change a external authentication state
 * @apiVersion 2.0.0
 * @apiName StatusExternalProjectSetting
 * @apiGroup Project External Auth
 */
router.put(
  "/:id/setting/external/:obj/:action",
  Validator.joi(ProjectRelatedStatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectExternalAuthCtrl.validate("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const handler =
      req.params.action === "enable"
        ? ProjectExternalAuthCtrl.enable(req.params.id)
        : ProjectExternalAuthCtrl.disable(req.params.id);
    handler
      .then((value: ProjectExternalAuthDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
