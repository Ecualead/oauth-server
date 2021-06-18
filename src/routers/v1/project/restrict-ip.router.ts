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
  RestrictIpValidation,
  ProjectRelatedParamsValidation,
  ProjectRelatedStatusValidation
} from "@/validators/project.joi";
import { Objects, SERVER_STATUS, Streams } from "@ikoabo/core";
import { ProjectRestrictIpCtrl } from "@/controllers/project/restrict-ip.controller";
import { ProjectRestrictIpDocument } from "@/models/project/restrict-ip.model";

const router = Router();

/**
 * @api {post} /v1/project/:id/setting/restriction Register project restriction
 * @apiVersion 2.0.0
 * @apiName CreateRestrictionProjectSetting
 * @apiGroup Project Restrictions
 */
router.post(
  "/:id/setting/restriction",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RestrictIpValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectRestrictIpCtrl.create({
      project: req.params["id"],
      ip: Objects.get(req, "body.ip"),
      description: Objects.get(req, "body.description"),
      status: SERVER_STATUS.ENABLED,
      owner: Objects.get(res.locals, "token.user._id")
    })
      .then((value: ProjectRestrictIpDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/restriction/:obj Update project restriction
 * @apiVersion 2.0.0
 * @apiName UpdateRestrictionProjectSetting
 * @apiGroup Project Restrictions
 */
router.put(
  "/:id/setting/restriction/:obj",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  Validator.joi(RestrictIpValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectRestrictIpCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectRestrictIpCtrl.update(
      { _id: req.params["obj"], project: req.params["id"] },
      {
        ip: Objects.get(req, "body.ip"),
        description: Objects.get(req, "body.description")
      }
    )
      .then((value: ProjectRestrictIpDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/project/:id/setting/restriction Get all project restrictions
 * @apiVersion 2.0.0
 * @apiName FetchAllRestrictionProjectSetting
 * @apiGroup Project Restrictions
 */
router.get(
  "/:id/setting/restriction",
  Validator.joi(ValidateObjectId, "query.d"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, _next: NextFunction) => {
    ProjectRestrictIpCtrl.fetchAll({ project: req.params.id })
      .pipe(Streams.stringify())
      .pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/project/:id/setting/restriction/:obj Get project restriction information
 * @apiVersion 2.0.0
 * @apiName FetchRestrictionProjectSetting
 * @apiGroup Project Restrictions
 */
router.get(
  "/:id/setting/restriction/:obj",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectRestrictIpCtrl.isValidOwner("params.obj", "token.user._id"),
  (_req: Request, res: Response, next: NextFunction) => {
    res.locals["response"] = {
      id: Objects.get(res, "locals.obj.id"),
      ip: Objects.get(res, "locals.obj.ip"),
      description: Objects.get(res, "locals.obj.description"),
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
 * @api {delete} /v1/project/:id/setting/restriction/:obj Delete project restriction
 * @apiVersion 2.0.0
 * @apiName DeleteRestrictionProjectSetting
 * @apiGroup Project Restrictions
 */
router.delete(
  "/:id/setting/restriction/:obj",
  Validator.joi(ProjectRelatedParamsValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectRestrictIpCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectRestrictIpCtrl.delete({ _id: req.params["obj"], project: req.params["id"] })
      .then((value: ProjectRestrictIpDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/project/:id/setting/restriction/:obj/:action Change a project restriction state
 * @apiVersion 2.0.0
 * @apiName StatusRestrictionProjectSetting
 * @apiGroup Project Restrictions
 */
router.put(
  "/:id/setting/restriction/:obj/:action",
  Validator.joi(ProjectRelatedStatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectRestrictIpCtrl.isValidOwner("params.obj", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const handler =
      req.params.action === "enable"
        ? ProjectRestrictIpCtrl.enable(req.params.id)
        : ProjectRestrictIpCtrl.disable(req.params.id);
    handler
      .then((value: ProjectRestrictIpDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
