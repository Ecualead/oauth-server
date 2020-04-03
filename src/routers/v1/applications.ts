/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:42:50-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: applications.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-03-30T02:52:33-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '@ikoabo/core_srv';
import { Applications } from '../../controllers/Applications';

const router = Router();
const appController = Applications.shared;

router.post('/',
  (req: Request, res: Response, next: NextFunction) => {
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/scopes',
  (req: Request, res: Response, next: NextFunction) => {
  },
  ResponseHandler.success,
  ResponseHandler.error
);

router.delete('/scopes',
  (req: Request, res: Response, next: NextFunction) => {
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
