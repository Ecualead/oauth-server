/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:42:41-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: projects.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T01:12:52-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ResponseHandler, Validators, Arrays } from '@ikoabo/core_srv';
import { Projects } from '../../controllers/Projects';
import { ProjectCreate, ProjectUpdate } from '../../models/joi/project';
import { CheckId, CheckStatus, Checkscope } from '../../models/joi/base';
import { IProject, DProject } from '../../models/schemas/projects/project';

const router = Router();
const ProjectCtrl = Projects.shared;

router.post('/:id',
  Validators.joi(CheckId, 'params'),
  Validators.joi(ProjectCreate),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Get rigth user
    let project: IProject = {
      name: req.body['name'],
      description: req.body['description'],
      links: req.body['links'],
      owner: '5e7d8203cef9b37116a6aeef',
      scope: Arrays.force(req.body['scope']),
    };
    ProjectCtrl.create(req.params.id, project)
      .then((value: DProject) => {
        res.locals['response'] = {
          id: value.id,
          name: value.name,
          description: value.description,
          links: value.links,
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
  Validators.joi(ProjectUpdate),
  (req: Request, res: Response, next: NextFunction) => {
    let project: IProject = {
      name: req.body['name'],
      description: req.body['description'],
      links: req.body['links'],
    }
    ProjectCtrl.update(req.params.id, project)
      .then((value: DProject) => {
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
    ProjectCtrl.get(req.params.id)
      .then((value: DProject) => {
        res.locals['response'] = {
          id: value.id,
          name: value.name,
          description: value.description,
          links: value.links,
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
    ProjectCtrl.delete(req.params.id)
      .then((value: DProject) => {
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
    const handler = (req.params.action === 'enable') ? ProjectCtrl.enable(req.params.id) : ProjectCtrl.disable(req.params.id);
    handler.then((value: DProject) => {
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
    ProjectCtrl.addScope(req.params.id, req.params.scope)
      .then((value: DProject) => {
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
    ProjectCtrl.deleteScope(req.params.id, req.params.scope)
      .then((value: DProject) => {
        res.locals['response'] = { id: value.id };
        next();
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
