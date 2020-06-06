/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-03T02:12:46-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: accounts.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-05-20T04:32:42-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthorizationCode, Token, Request as ORequest, Response as OResponse, OAuthError } from 'oauth2-server';
import { ResponseHandler, Validators, ERRORS } from '@ikoabo/core_srv';
import { ERRORS as AUTH_ERRORS } from '@ikoabo/auth_srv';
import { Mail } from '@ikoabo/comm_srv';
import { Accounts } from '../../controllers/Accounts';
import { OAuth2 } from '../../controllers/OAuth2';
import { IAccount, DAccount } from '../../models/schemas/accounts/account';
import { DAccountProject } from '../../models/schemas/accounts/project';
import { RegisterValidation, AccountValidation, RecoverValidation, EmailValidation } from '../../models/joi/account';
import { Applications } from '../../controllers/Applications';
import { DApplication } from '../../models/schemas/applications/application';

const router = Router();
const AccountCtrl = Accounts.shared;
const OAuth2Ctrl = OAuth2.shared;
const ApplicationCtrl = Applications.shared;
const MailCtrl = Mail.shared;

router.post('/register',
  Validators.joi(RegisterValidation),
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
            /* Send mail notification about the account creation */
            MailCtrl.send(res.locals['token'].client.project.id, 'account-register', 'Cuenta de usuario registrada', 'es', value.email, [], [], {
              name: value.name,
              code: value.code,
              phone: value.phone,
              date: value.createdAt,
              link: `https://www.mapa-c19.com/confirm?email=${value.email}&token=${value.resetToken.token}`,
            }).finally(() => {
              res.locals['response'] = {
                uid: profile.account,
                scope: profile.scope,
                profile: profile.profile,
              };
              next();
            });
          }).catch(next);
      }).catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/resend',
  (req: Request, res: Response, next: NextFunction) => {
    let request = new ORequest(req);
    let response = new OResponse(res);
    OAuth2Ctrl.server.token(request, response).then((token: Token) => {
      next();
    }).catch(next);
  },
  (_req: Request, res: Response, next: NextFunction) => {
    /* If there is no error then user account is confirmated and don't need resend the email */
    next({ boError: ERRORS.INVALID_OPERATION });
  },
  OAuth2Ctrl.handleError,
  (err: any, req: Request, _res: Response, next: NextFunction) => {
    /* Check for email not confirmed error */
    if (err.boError === AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
      /* Extract credentials from authorization header */
      const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
      const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

      if (!login) {
        return next(err);
      }

      /* Fetch the requesting application */
      ApplicationCtrl.get(login).then((value: DApplication) => {

        /* Call to resend confirmation */
        AccountCtrl.requestConfirmation(req.body['username'], value).then((user: DAccount) => {
          /* Send mail confirmation */
          MailCtrl.send(value.project.toString(), 'account-register', 'Cuenta de usuario registrada', 'es', user.email, [], [], {
            name: user.name,
            code: user.code,
            phone: user.phone,
            date: user.createdAt,
            link: `https://www.mapa-c19.com/confirm?email=${user.email}&token=${user.resetToken.token}`,
          }).finally(() => {
            next();
          });
        }).catch(next);
      }).catch(next);
      return;
    }
    next(err);
  },
  ResponseHandler.success,
  ResponseHandler.error
);


router.post('/confirm',
  Validators.joi(AccountValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    /* Confirm the user account */
    AccountCtrl.confirmAccount(req.body['email'], req.body['token'])
      .then(() => {
        res.locals['response'] = { email: req.body['email'] };
        next();
      }).catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/recover/request',
  Validators.joi(EmailValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.requestRecover(req.body['email'], res.locals['token'].client)
      .then((value: DAccount) => {
        /* Send mail notification about the account creation */
        MailCtrl.send(res.locals['token'].client.project.id, 'account-recover', 'Recuperación de cuenta de usuario', 'es', value.email, [], [], {
          name: value.name,
          code: value.code,
          email: value.email,
          phone: value.phone,
          token: value.resetToken.token
        }).finally(() => {
          res.locals['response'] = { email: req.body['email'] };
          next();
        });
        next();
      }).catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/recover/validate',
  Validators.joi(AccountValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    /* Validate the recover token */
    AccountCtrl.checkRecover(req.body['email'], req.body['token'])
      .then(() => {
        res.locals['response'] = { email: req.body['email'] };
        next();
      }).catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/recover/store',
  Validators.joi(RecoverValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    /* Recover the user account */
    AccountCtrl.doRecover(req.body['email'], req.body['token'], req.body['password'])
      .then(() => {
        res.locals['response'] = { email: req.body['email'] };
        next();
      }).catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
