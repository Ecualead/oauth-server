/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:54:16-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: oauth2.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-29T15:20:48-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthorizationCode, Token, Request as ORequest, Response as OResponse, OAuthError } from 'oauth2-server';
import { ResponseHandler } from '@ikoabo/core_srv';
import { OAuth2 } from '../../controllers/OAuth2';

const router = Router();
const OAuth2Server = OAuth2.shared;

const options = {
  authenticateHandler: {
    handle: (/*req: Request*/) => {
      // Whatever you need to do to authorize / retrieve your user from post data here
      return {};//{id: 1233}; // return client
    }
  }
};

router.post('/authorize',
  (req: Request, res: Response, next: NextFunction) => {
    let request = new ORequest(req);
    let response = new OResponse(res);
    OAuth2Server.server.authorize(request, response, options).then((code: AuthorizationCode) => {
      /* TODO XXX Check if the client IP address is valid */
      /*if (!Validators.validClientIp(req, next, code.client)) {
          return;
      }*/

      res.locals['response'] = {
        authorizationCode: code.authorizationCode,
        redirectUri: code.redirectUri,
        scope: code.scope,
        expiresAt: code.expiresAt ? code.expiresAt.getTime() : null,
      };

      next();
    }).catch(next);
  },
  OAuth2Server.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/token',
  (req: Request, res: Response, next: NextFunction) => {
    let request = new ORequest(req);
    let response = new OResponse(res);
    OAuth2Server.server.token(request, response).then((token: Token) => {
      /* TODO XXX Check if the client IP address is valid */
      /*if (!Validators.validClientIp(req, next, token.client)) {
          return;
      }*/
      res.locals['token'] = token;
      res.locals['response'] = {
        name: token.user.name,
        email: token.user.email,
        phone: token.user.phone,
        tokenType: 'Bearer',
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt ? token.accessTokenExpiresAt.getTime() : null,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt ? token.refreshTokenExpiresAt.getTime() : null,
        createdAt: token.createdAt.getTime(),
        scope: token.scope
      };

      /* TODO XXX If the token is granted to an user then ensure user profile into application */
      /* if (token.user && token.user.userId && token.user.userId !== token.client.clientId) {
          UserCtrl.ensureApplicationProfile(<AccountDocument>token.user, token.client.app)
              .then(() => {
                  next();
              }).catch(next);
          return;
      }*/
      next();
    }).catch(next);
  },
  /* TODO XXX Add tracking */
  /*(req: Request, res: Response, next: NextFunction) => {
      /* Register the tracking information */
  /*AccountTracking.shared.registerInformation(
      req['token'].user.userId,
      req['fingerprint'],
      req.headers['user-agent'],
      req['ipAddr'],
      'auth/token'
  ).then((tracking: AccountTrackingDocument) => {
      /* Only send notification for users */
  /*  const token = req['token'];
    if (token.client.id !== token.user.id) {
        /* Prepare notification data */
  /*  let data: INotificationData = Location.parseFromRequest(req, tracking.address[tracking.address.length - 1].location);
    data.appPayload = req['body'].appPayload;

    /* Check if the user has autenticated from new device */
  /*  if (tracking.address.filter(value => value.action === 'auth/token').length === 1) {
        /* Send a notification to the user */
  /*    Notifications.sendNotification('changeDevice', token.client.app, <AccountDocument>token.user, data, token.user.auth.email);
  }

  /* Send an authentication notification to the user */
  /*    Notifications.sendNotification('authentication', token.client.app, <AccountDocument>token.user, data, token.user.auth.email);
  }
  next();
}).catch(next);
},*/
  OAuth2Server.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

router.post('/authenticate',
  (req: Request, res: Response, next: NextFunction) => {
    let request = new ORequest(req);
    let response = new OResponse(res);
    OAuth2Server.server.authenticate(request, response).then((token: Token) => {
      /* TODO XXX  Check if the client IP address is valid */
      /*if (!Validators.validClientIp(req, next, token.client)) {
          return;
      }*/

      res.locals['response'] = {
        uid: token.user.id,
        name: token.user.name,
        email: token.user.email,
        phone: token.user.phone,
        application: token.client.id,
        project: token.client.project.id,
        domain: token.client.project.domain,
        scope: token.scope,
      };
      next();
    }).catch(next);
  },
  OAuth2Server.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);


router.post('/logout',
  OAuth2Server.authenticate(),
  (_req: Request, res: Response, next: NextFunction) => {
    /* Revoke the access token */
    OAuth2Server.model.revokeToken(res.locals['token'])
      .then(() => {
        res.locals['response'] = {};
        next();
      }).catch(next);
  },
  OAuth2Server.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

export default router;
