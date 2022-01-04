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
  Validator,
  ResponseHandler,
  ValidateObjectId,
  Objects,
  SERVER_ERRORS,
  SERVER_STATUS,
  Streams
} from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import { DomainCtrl } from "@/controllers/domain/domain.controller";
import { ScopeValidation, StatusValidation } from "@/validators/base.joi";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ProjectCtrl } from "@/controllers/project/project.controller";
import { ProjectCreateValidation, ProjectUpdateValidation } from "@/validators/project.joi";
import { ProjectDocument } from "@/models/project/project.model";
import {
  EMAIL_CONFIRMATION,
  LIFETIME_TYPE,
  NOTIFICATION_TYPE,
  TOKEN_TYPE
} from "@/constants/project.enum";

const router = Router();

/**
 * @api {post} /v1/project Create new project
 * @apiVersion 2.0.0
 * @apiName CreateProject
 * @apiGroup Projects
 */
router.post(
  "/",
  Validator.joi(ProjectCreateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.isValidOwner("body.domain", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Register the new project with default settings */
    ProjectCtrl.create({
      domain: req.body["domain"],
      canonical: req.body["canonical"],
      code: req.body["code"],
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      links: req.body["links"],
      scope: req.body["scope"],
      owner: Objects.get(res.locals, "token.user._id"),
      status: SERVER_STATUS.ENABLED,
      settings: {
        tokenLifetime: {
          accessToken: LIFETIME_TYPE.MONTH,
          refreshToken: LIFETIME_TYPE.YEAR
        },
        emailConfirmation: {
          type: EMAIL_CONFIRMATION.NOT_REQUIRED,
          time: LIFETIME_TYPE.MONTH
        },
        passwordPolicy: {
          lifetime: LIFETIME_TYPE.INFINITE,
          len: 5,
          upperCase: true,
          lowerCase: true,
          specialChars: false,
          numbers: true
        },
        events: {
          register: {
            type: NOTIFICATION_TYPE.NONE
          },
          confirm: {
            token: TOKEN_TYPE.DISABLED,
            url: null
          },
          login: {
            type: NOTIFICATION_TYPE.NONE
          },
          chPwd: {
            type: NOTIFICATION_TYPE.NONE
          },
          recover: {
            token: TOKEN_TYPE.DISABLED,
            url: null
          }
        },
        hasOauth2: false
      }
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

/**
 * @api {put} /v1/project/:id Update a project information
 * @apiVersion 2.0.0
 * @apiName UpdateProject
 * @apiGroup Projects
 */
router.put(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ProjectUpdateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Update the project data */
    ProjectCtrl.update(req.params.id, {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      links: req.body["links"]
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

/**
 * @api {get} /v1/project Get all projects of the current user for the given domain
 * @apiVersion 2.0.0
 * @apiName FetchAllProject
 * @apiGroup Projects
 */
router.get(
  "/",
  Validator.joi(ValidateObjectId, "query.d"),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.isValidOwner("query.d", "token.user._id"),
  (req: Request, res: Response, _next: NextFunction) => {
    ProjectCtrl.fetchAll({ domain: req.params.id })
      .pipe(Streams.stringify())
      .pipe(res.type("json"));
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/project/:id Get a project information
 * @apiVersion 2.0.0
 * @apiName FetchProject
 * @apiGroup Projects
 */
router.get(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (_req: Request, res: Response, next: NextFunction) => {
    res.locals["response"] = {
      id: Objects.get(res, "locals.obj.id"),
      canonical: Objects.get(res, "locals.obj.canonical"),
      code: Objects.get(res, "locals.obj.code"),
      name: Objects.get(res, "locals.obj.name"),
      image: Objects.get(res, "locals.obj.image"),
      description: Objects.get(res, "locals.obj.description"),
      links: Objects.get(res, "locals.obj.links"),
      scope: Objects.get(res, "locals.obj.scope"),
      settings: Objects.get(res, "locals.obj.settings"),
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
 * @api {delete} /v1/project/:id Delete a project
 * @apiVersion 2.0.0
 * @apiName DeleteProject
 * @apiGroup Projects
 */
router.delete(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
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

/**
 * @api {put} /v1/project/:id/:action Change a project state
 * @apiVersion 2.0.0
 * @apiName StatusProject
 * @apiGroup Projects
 */
router.put(
  "/:id/:action",
  Validator.joi(StatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
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

/**
 * @api {post} /v1/project/:id/scope Add scope to project
 * @apiVersion 2.0.0
 * @apiName AddScopeProject
 * @apiGroup Projects
 */
router.post(
  "/:id/scope",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.addToSet(req.params.id, "scope", req.body["scope"])
      .then((value: ProjectDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {delete} /v1/project/:id/scope Delete scope from project
 * @apiVersion 2.0.0
 * @apiName DeleteScopeProject
 * @apiGroup Projects
 */
router.delete(
  "/:id/scope",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ProjectCtrl.pull(req.params.id, "scope", req.body["scope"])
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
