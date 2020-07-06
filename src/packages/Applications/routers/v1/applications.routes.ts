import { Router, Request, Response, NextFunction } from "express";
import { ResponseHandler, Validators, ValidateObjectId } from "@ikoabo/core_srv";
import { Applications } from "@/Applications/controllers/applications.controller";
import { ApplicationCreateValidation, ApplicationUpdateValidation, ApplicationGrantValidation } from "@/Applications/models/applications.joi";
import {
  Application,
  ApplicationDocument,
} from "@/Applications/models/applications.model";
import { StatusValidation, ScopeValidation } from "@/models/base.joi";

const router = Router();
const ApplicationCtrl = Applications.shared;

router.post(
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ApplicationCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    let application: Application = {
      name: req.body["name"],
      project: <any>req.params['id'],
      description: req.body["description"],
      image: req.body["image"],
      type: req.body["type"],
      owner: "5e7d8203cef9b37116a6aeef",
      scope: req.body["scope"],
      grants: req.body["grants"],
    };
    ApplicationCtrl.create(application)
      .then((value: ApplicationDocument) => {
        res.locals["response"] = {
          id: value.id,
          clientId: value.id,
          clientSecret: value.secret,
          base64: value.getBase64Secret(),
        };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put('/:id',
  Validators.joi(ValidateObjectId, 'params'),
  Validators.joi(ApplicationUpdateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    let application: Application = {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      type: req.body["type"],
      modifiedBy: "5e7d8203cef9b37116a6aeef",
    };
    ApplicationCtrl.update(req.params.id, application)
      .then((value: ApplicationDocument) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get('/:id',
  Validators.joi(ValidateObjectId, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.fetch(req.params.id)
      .then((value: ApplicationDocument) => {
        res.locals['response'] = {
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
          updatedAt: value.updatedAt,
        };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete('/:id',
  Validators.joi(ValidateObjectId, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.delete(req.params.id)
      .then((value: ApplicationDocument) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put('/:id/:action',
  Validators.joi(StatusValidation, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    const handler = (req.params.action === 'enable') ? ApplicationCtrl.enable(req.params.id) : ApplicationCtrl.disable(req.params.id);
    handler.then((value: ApplicationDocument) => {
      res.locals['response'] = { id: value.id };
      next();
    }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/:id/scope/:scope',
  Validators.joi(ScopeValidation, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.addScope(req.params.id, req.params.scope)
      .then((value: ApplicationDocument) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete('/:id/scope/:scope',
  Validators.joi(ScopeValidation, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.deleteScope(req.params.id, req.params.scope)
      .then((value: ApplicationDocument) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/:id/grant/:grant',
  Validators.joi(ApplicationGrantValidation, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.addGrant(req.params.id, req.params.grant)
      .then((value: ApplicationDocument) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete('/:id/grant/:grant',
  Validators.joi(ApplicationGrantValidation, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.deleteGrant(req.params.id, req.params.grant)
      .then((value: ApplicationDocument) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
