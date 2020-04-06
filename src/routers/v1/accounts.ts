/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-03T02:12:46-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: accounts.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-05T23:38:51-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '@ikoabo/core_srv';
import { Accounts } from '../../controllers/Accounts';
import { OAuth2 } from '../../controllers/OAuth2';
import { IAccount, DAccount } from '../../models/schemas/accounts/account';
import { DAccountProject } from 'src/models/schemas/accounts/project';

const router = Router();
const AccountCtrl = Accounts.shared;
const OAuth2Ctrl = OAuth2.shared;


router.post('/register',
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Add password policy
    /* Initialize the account data */
    let data: IAccount = {
      name: req.body['name'],
      email: req.body['email'],
      password: req.body['password'],
      phone: req.body['phone'],
    }

    /* Register the new user account */
    AccountCtrl.register(data, res.locals['token'].client)
      .then((value: DAccount) => {
        /* Register the user account into the given project */
        AccountCtrl.registerProject(value, req.body['profile'], res.locals['token'].client)
          .then((profile: DAccountProject) => {
            res.locals['response'] = {
              uid: profile.account,
              scope: profile.scope,
              profile: profile.profile,
            };
            next();
          }).catch(next);
      }).catch(next);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
