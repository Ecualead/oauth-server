import { Request, Response, NextFunction } from "express";
import OAuth2Server from "oauth2-server";
import {
  Token,
  Request as ORequest,
  Response as OResponse,
  OAuthError,
} from "oauth2-server";
import { HTTP_STATUS } from "@ikoabo/core_srv";
import { ERRORS } from "@ikoabo/auth_srv";
import { OAuth2Model } from "@/OAuth2/controllers/oauth2.model.controller";

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
    return (req: Request, res: Response, next: NextFunction) => {
      let request = new ORequest(req);
      let response = new OResponse(res);
      this._server
        .authenticate(request, response)
        .then((token: Token) => {
          /* Check if necessary validate any scope */
          if (scope) {
            let tokenscope = token.scope;
            if (typeof tokenscope === "string") {
              tokenscope = tokenscope.split(" ");
            }

            /* TODO XXX Check if the client IP address is valid */
            /*if (!Validators.validClientIp(req, next, token.client)) {
              return;
          } else*/
            if (typeof scope === "string") {
              /* Scope is an string, assume one scope */
              if (tokenscope.indexOf(scope) < 0) {
                next({
                  boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                  boError: ERRORS.INVALID_SCOPE,
                });
                return;
              }
            } else if (Array.isArray(scope)) {
              /* Scope is an array with multiple scope */
              if (
                scope.filter((value) => tokenscope.indexOf(value) >= 0)
                  .length !== scope.length
              ) {
                next({
                  boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                  boError: ERRORS.INVALID_SCOPE,
                });
                return;
              }
            } else {
              next({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.INVALID_SCOPE,
              });
              return;
            }
          }
          res.locals["token"] = token;
          next();
        })
        .catch(next);
    };
  }

  public handleError(err: any, re: Request, res: Response, next: NextFunction) {
    if (err instanceof OAuthError) {
      next(err.message);
      return;
    }
    next(err);
  }
}