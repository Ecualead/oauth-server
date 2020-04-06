/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:42:30-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: domains.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:54:51-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ResponseHandler, Validators, Arrays } from '@ikoabo/core_srv';
import { Domains } from '../../controllers/Domains';
import { DomainCreate, DomainUpdate } from '../../models/joi/domain';
import { CheckId, CheckStatus, Checkscope } from '../../models/joi/base';
import { IDomain, DDomain } from '../../models/schemas/domain';

const router = Router();
const DomainCtrl = Domains.shared;

router.post('/',
  Validators.joi(DomainCreate),
  (req: Request, res: Response, next: NextFunction) => {
    const domain: IDomain = {
      name: req.body['name'],
      description: req.body['description'],
      owner: '5e7d8203cef9b37116a6aeef',
      scope: Arrays.force(req.body['scope']),
    };
    DomainCtrl.create(domain)
      .then((value: DDomain) => {
        res.locals['response'] = {
          id: value.id,
          name: value.name,
          description: value.description,
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

router.put('/:id',
  Validators.joi(CheckId, 'params'),
  Validators.joi(DomainUpdate),
  (req: Request, res: Response, next: NextFunction) => {
    const domain: IDomain = {
      name: req.body['name'],
      description: req.body['description'],
    };
    DomainCtrl.update(req.params.id, domain)
      .then((value: DDomain) => {
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
    DomainCtrl.get(req.params.id)
      .then((value: DDomain) => {
        res.locals['response'] = {
          id: value.id,
          name: value.name,
          description: value.description,
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
    DomainCtrl.delete(req.params.id)
      .then((value: DDomain) => {
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
    const handler = (req.params.action === 'enable') ? DomainCtrl.enable(req.params.id) : DomainCtrl.disable(req.params.id);
    handler.then((value: DDomain) => {
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
    DomainCtrl.addScope(req.params.id, req.params.scope)
      .then((value: DDomain) => {
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
    DomainCtrl.deleteScope(req.params.id, req.params.scope)
      .then((value: DDomain) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
