/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T06:44:33-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: OAuth2.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-02T23:58:55-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Request, Response, NextFunction } from 'express';
import OAuth2Server from 'oauth2-server';
import { Token, Request as ORequest, Response as OResponse } from 'oauth2-server';
import { HTTP_STATUS } from '@ikoabo/core_srv';
import { ERRORS } from '../models/types/errors';
import { OAuth2 as OAuth2Model } from '../models/oauth2';

export class OAuth2 {
  private static _instance: OAuth2;
  private _model: OAuth2Model;
  private _server: any;


  private constructor() {
    this._model = new OAuth2Model();
    this._server = new OAuth2Server({ model: this._model });
  }

  public static get shared(): OAuth2 {
    if (!OAuth2._instance) {
      OAuth2._instance = new OAuth2();
    }
    return OAuth2._instance;
  }

  public get model(): OAuth2Model {
    return this._model;
  }

  public get server(): any {
    return this._server;
  }

  public authenticate(scope?: string | string[]) {
    return function(req: Request, res: Response, next: NextFunction) {
      let request = new ORequest(req);
      let response = new OResponse(res);
      this._server.authenticate(request, response).then((token: Token) => {
        /* Check if necessary validate any scope */
        if (scope) {
          let tokenScopes = token.scope;
          if (typeof tokenScopes === 'string') {
            tokenScopes = tokenScopes.split(' ');
          }

                    /* TODO XXX Check if the client IP address is valid */
                    /*if (!Validators.validClientIp(req, next, token.client)) {
                        return;
                    } else*/ if (typeof scope === 'string') {
            /* Scope is an string, assume one scope */
            if (tokenScopes.indexOf(scope) < 0) {
              next({ code: HTTP_STATUS.HTTP_FORBIDDEN, error: ERRORS.INVALID_SCOPE });
              return;
            }
          } else if (Array.isArray(scope)) {
            /* Scope is an array with multiple scopes */
            if (scope.filter(value => tokenScopes.indexOf(value) >= 0).length !== scope.length) {
              next({ code: HTTP_STATUS.HTTP_FORBIDDEN, error: ERRORS.INVALID_SCOPE });
              return;
            }
          } else {
            next({ code: HTTP_STATUS.HTTP_FORBIDDEN, error: ERRORS.INVALID_SCOPE });
            return;
          }
        }

        res.locals['token'] = token;
        next();
      }).catch(next);
    };
  }
}
