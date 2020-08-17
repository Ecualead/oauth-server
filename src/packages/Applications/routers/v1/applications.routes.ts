/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Objects } from "@ikoabo/core";
import { Validator, ValidateObjectId, ResponseHandler } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { ApplicationCtrl } from "@/Applications/controllers/applications.controller";
import {
  ApplicationCreateValidation,
  ApplicationUpdateValidation,
  ApplicationGrantValidation
} from "@/Applications/models/applications.joi";
import { ApplicationDocument } from "@/Applications/models/applications.model";
import { StatusValidation, ScopeValidation, RestrictionValidation } from "@/models/base.joi";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";

const router = Router();

router.post(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationCreateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.create({
      name: req.body["name"],
      canonical: req.body["canonical"],
      project: <any>req.params["id"],
      description: req.body["description"],
      image: req.body["image"],
      type: req.body["type"],
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

router.put(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationUpdateValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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

router.get(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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

router.delete(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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

router.put(
  "/:id/:action",
  Validator.joi(StatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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

router.post(
  "/:id/scope",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.addScope(req.params.id, req.body["scope"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete(
  "/:id/scope",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ScopeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.deleteScope(req.params.id, req.body["scope"])
      .then((value: ApplicationDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post(
  "/:id/grant",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationGrantValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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

router.delete(
  "/:id/grant",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(ApplicationGrantValidation),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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

router.put(
  "/:id/restriction",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RestrictionValidation, "body"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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

router.delete(
  "/:id/restriction",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(RestrictionValidation, "body"),
  OAuth2Ctrl.authenticate(["user"]),
  ApplicationCtrl.validate("params.id", "token.user._id"),
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
