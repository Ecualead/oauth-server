import { Router, Request, Response, NextFunction } from "express";
import { ResponseHandler, Validators, Arrays, ValidateObjectId } from "@ikoabo/core_srv";
import { Applications } from "../../controllers/applications.controller";
import { ApplicationCreateValidation } from "../../models/applications.joi";
import {
  Application,
  ApplicationDocument,
} from "../../models/applications.model";

const router = Router();
const ApplicationCtrl = Applications.shared;

router.post(
  "/:id",
  Validators.joi(ValidateObjectId, "params"),
  Validators.joi(ApplicationCreateValidation),
  (req: Request, res: Response, next: NextFunction) => {
    let application: Application = {
      name: req.body["name"],
      description: req.body["description"],
      image: req.body["image"],
      type: req.body["type"],
      owner: "5e7d8203cef9b37116a6aeef",
      scope: Arrays.force(req.body["scope"]),
    };
    ApplicationCtrl.create(application)
      .then((value: ApplicationDocument) => {
        res.locals["response"] = {
          clientId: value.id,
          clientSecret: value.secret,
        };
        next();
      })
      .catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);
/* 
router.put('/:id',
  Validators.joi(CheckId, 'params'),
  Validators.joi(ApplicationUpdate),
  (req: Request, res: Response, next: NextFunction) => {
    let project: IApplication = {
      name: req.body['name'],
      description: req.body['description'],
      type: req.body['type'],
    }
    ApplicationCtrl.update(req.params.id, project)
      .then((value: DApplication) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.get('/:id',
  Validators.joi(CheckId, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.get(req.params.id)
      .then((value: DApplication) => {
        res.locals['response'] = {
          id: value.id,
          name: value.name,
          description: value.description,
          type: value.type,
          scope: value.scope,
          status: value.status,
          createdAt: value.createdAt,
        };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete('/:id',
  Validators.joi(CheckId, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.delete(req.params.id)
      .then((value: DApplication) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.put('/:id/:action',
  Validators.joi(CheckStatus, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    const handler = (req.params.action === 'enable') ? ApplicationCtrl.enable(req.params.id) : ApplicationCtrl.disable(req.params.id);
    handler.then((value: DApplication) => {
      res.locals['response'] = { id: value.id };
      next();
    }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/:id/scope/:scope',
  Validators.joi(Checkscope, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.addScope(req.params.id, req.params.scope)
      .then((value: DApplication) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete('/:id/scope/:scope',
  Validators.joi(Checkscope, 'params'),
  (req: Request, res: Response, next: NextFunction) => {
    ApplicationCtrl.deleteScope(req.params.id, req.params.scope)
      .then((value: DApplication) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);
 */
export default router;
