/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:42:50-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: applications.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T01:38:10-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ResponseHandler, Validators, Arrays } from '@ikoabo/core_srv';
import { Applications } from '../../controllers/Applications';
import { ApplicationCreate, ApplicationUpdate } from '../../models/joi/application';
import { CheckId, CheckStatus, CheckScopes } from '../../models/joi/base';
import { IApplication, DApplication } from '../../models/schemas/applications/application';

const router = Router();
const ApplicationCtrl = Applications.shared;

router.post('/:id',
  Validators.joi(CheckId, 'params'),
  Validators.joi(ApplicationCreate),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Get rigth user
    let project: IApplication = {
      name: req.body['name'],
      description: req.body['description'],
      type: req.body['type'],
      owner: '5e7d8203cef9b37116a6aeef',
      scopes: Arrays.force(req.body['scopes']),
    };
    ApplicationCtrl.create(req.params.id, project)
      .then((value: DApplication) => {
        res.locals['response'] = {
          id: value.id,
          name: value.name,
          description: value.description,
          type: value.type,
          secret: value.secret,
          base64: value.getBase64Secret(),
          scopes: value.scopes,
          status: value.status,
          createdAt: value.createdAt,
        };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

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
          scopes: value.scopes,
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

router.post('/:id/scopes/:scope',
  Validators.joi(CheckScopes, 'params'),
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

router.delete('/:id/scopes/:scope',
  Validators.joi(CheckScopes, 'params'),
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

export default router;
