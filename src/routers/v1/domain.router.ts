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
import { Objects, SERVER_STATUS, Streams } from "@ikoabo/core";
import { Validator, ResponseHandler, ValidateObjectId } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { DomainCtrl } from "@/controllers/domain/domain.controller";
import { DomainDocument } from "@/models/domain/domain.model";
import { StatusValidation } from "@/validators/base.joi";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { DomainCreate, DomainUpdate } from "@/validators/domain.joi";

const router = Router();

/**
 * @api {post} /v1/domain Create new domain
 * @apiVersion 2.0.0
 * @apiName CreateDomain
 * @apiGroup Domains
 */
router.post(
  "/",
  Validator.joi(DomainCreate),
  OAuth2Ctrl.authenticate(["user"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Create the new domain */
    DomainCtrl.create({
      name: req.body["name"],
      canonical: req.body["canonical"],
      image: req.body["image"],
      description: req.body["description"],
      owner: Objects.get(res.locals, "token.user._id"),
      status: SERVER_STATUS.ENABLED,
      modifiedBy: Objects.get(res.locals, "token.user._id")
    })
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  }
);

/**
 * @api {put} /v1/domain/:id Update domain information
 * @apiVersion 2.0.0
 * @apiName UpdateDomain
 * @apiGroup Domains
 */
router.put(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  Validator.joi(DomainUpdate),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Update the domain information */
    DomainCtrl.update(req.params.id, {
      name: req.body["name"],
      image: req.body["image"],
      description: req.body["description"],
      modifiedBy: Objects.get(res.locals, "token.user._id")
    })
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  }
);

/**
 * @api {get} /v1/domain Get curren user domains
 * @apiVersion 2.0.0
 * @apiName FetchAllDomain
 * @apiGroup Domains
 */
router.get(
  "/",
  OAuth2Ctrl.authenticate(["user"]),
  (_req: Request, res: Response, _next: NextFunction) => {
    /* Fetch all domains of the current user */
    DomainCtrl.fetchAll({ owner: Objects.get(res.locals, "token.user._id") })
      .pipe(Streams.stringify())
      .pipe(res.type("json"));
  }
);

/**
 * @api {get} /v1/domain/:id Get a domain information
 * @apiVersion 2.0.0
 * @apiName FetchDomain
 * @apiGroup Domains
 */
router.get(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (_req: Request, res: Response, next: NextFunction) => {
    /* Return the domain information */
    res.locals["response"] = res.locals["obj"].toJSON();
    next();
  }
);

/**
 * @api {delete} /v1/domain/:id Delete a domain
 * @apiVersion 2.0.0
 * @apiName DeleteDomain
 * @apiGroup Domains
 */
router.delete(
  "/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Delete a domain */
    DomainCtrl.delete(req.params.id)
      .then((value: DomainDocument) => {
        res.locals["response"] = { id: value.id };
        next();
      })
      .catch(next);
  }
);

/**
 * @api {put} /v1/domain/:id/:action Change the domain state
 * @apiVersion 2.0.0
 * @apiName StatusDomain
 * @apiGroup Domains
 */
router.put(
  "/:id/:action",
  Validator.joi(StatusValidation, "params"),
  OAuth2Ctrl.authenticate(["user"]),
  DomainCtrl.validate("params.id", "token.user._id"),
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

export default router;
