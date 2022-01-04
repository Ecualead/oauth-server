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
  ValidateObjectId,
  ResponseHandler,
  Objects,
  SERVER_STATUS
} from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import { ApplicationCtrl } from "@/controllers/application/application.controller";
import {
  ApplicationCreateValidation,
  ApplicationUpdateValidation,
  ApplicationGrantValidation
} from "@/validators/application.joi";
import { ApplicationDocument } from "@/models/application/application.model";
import { StatusValidation, ScopeValidation, RestrictionValidation } from "@/validators/base.joi";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { ProjectCtrl } from "@/controllers/project/project.controller";

const router = Router();

/**
 * @api {post} /v1/application/:id Create new application
 * @apiVersion 2.0.0
 * @apiName CreateApplication
 * @apiGroup Applications
 */
router.post(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationCreateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ProjectCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* TODO XXX Handle validation for module creation */
    ApplicationCtrl.create({
      name: req.body["name"],
      canonical: req.body["canonical"],
      project: req.params["id"],
      description: req.body["description"],
      image: req.body["image"],
      type: req.body["type"],
      status: SERVER_STATUS.ENABLED,
      owner: Objects.get(res.locals, "token.user._id"),
      scope: req.body["scope"],
      grants: req.body["grants"]
    })
      .then((value: ApplicationDocument) => {
        res.locals["response"] = {
          id: value.id,
          clientId: value.id,
          clientSecret: value.secret,
          base64: value.getBase64Secret()
        };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/application/:id Update application information
 * @apiVersion 2.0.0
 * @apiName UpdateApplication
 * @apiGroup Applications
 */
router.put(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationUpdateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.update(req.params.id, {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      type: req.body["type"]
    })
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/application/:id Get application information
 * @apiVersion 2.0.0
 * @apiName FetchApplication
 * @apiGroup Applications
 */
router.get(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.fetch(req.params.id)
      .then((value: ApplicationDocument) => {
        res.locals["response"] = {
          id: value.id,
          name: value.name,
          description: value.description,
          image: value.image,
          type: value.type,
          scope: value.scope,
          grants: value.grants,
          domain: value.domain,
          status: value.status,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt
        };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {delete} /v1/application/:id Delete application
 * @apiVersion 2.0.0
 * @apiName DeleteApplication
 * @apiGroup Applications
 */
router.delete(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.delete(req.params.id)
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/application/:id/:action Set application state
 * @apiVersion 2.0.0
 * @apiName StatusApplication
 * @apiGroup Applications
 */
router.put(
  "/:id/:action",
  Validator.joi(StatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    const handler =
      req.params.action === "enable"
        ? ApplicationCtrl.enable(req.params.id)
        : ApplicationCtrl.disable(req.params.id);
    handler
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {post} /v1/application/:id/scope Add application scope
 * @apiVersion 2.0.0
 * @apiName AddScopeApplication
 * @apiGroup Applications
 */
router.post(
  "/:id/scope",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.addToSet(req.params.id, "scope", req.body["scope"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {delete} /v1/application/:id/scope Delete application scope
 * @apiVersion 2.0.0
 * @apiName DeleteScopeApplication
 * @apiGroup Applications
 */
router.delete(
  "/:id/scope",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.pull(req.params.id, "scope", req.body["scope"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {post} /v1/application/:id/grant Add application grant
 * @apiVersion 2.0.0
 * @apiName AddGrantApplication
 * @apiGroup Applications
 */
router.post(
  "/:id/grant",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationGrantValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.addGrant(req.params.id, req.body["grant"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {delete} /v1/application/:id/grant Delete application grant
 * @apiVersion 2.0.0
 * @apiName DeleteGrantApplication
 * @apiGroup Applications
 */
router.delete(
  "/:id/grant",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationGrantValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.deleteGrant(req.params.id, req.body["grant"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {post} /v1/application/:id/restriction Add application IP address restriction
 * @apiVersion 2.0.0
 * @apiName AddRestrictionApplication
 * @apiGroup Applications
 */
router.post(
  "/:id/restriction",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RestrictionValidation, "body"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.addRestriction(req.params.id, req.body["restriction"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {delete} /v1/application/:id/restriction Delete application IP address restriction
 * @apiVersion 2.0.0
 * @apiName DeleteRestrictionApplication
 * @apiGroup Applications
 */
router.delete(
  "/:id/restriction",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RestrictionValidation, "body"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.isValidOwner("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.deleteRestriction(req.params.id, req.body["restriction"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
