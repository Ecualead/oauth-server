/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { OAuth2Client, LoginTicket, TokenPayload } from 'google-auth-library';
import { OAUTH2_TOKEN_TYPE } from "@ecualead/auth";
import {
  Validator,
  ResponseHandler,
  Objects,
  FormURLEncoded,
  Tokens
} from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import { Token } from "oauth2-server";
import { ReCaptcha } from "@ecualead/auth";
import { Settings } from "../../controllers/settings";
import { AccountCtrl } from "../../controllers/account/account";
import { OAuth2Ctrl } from '../../controllers/oauth2/oauth2';
import { EmailCtrl } from '../../controllers/account/email';
import { RegisterValidation, LoginValidation } from '../../validators/external';
import { EXTERNAL_ACCOUNT_TYPE } from '../../constants/account';
import { AccountDocument } from '../../models/account/account';
import { EmailDocument } from '../../models/account/email';
import { OAuth2ModelCtrl } from '../../controllers/oauth2/oauth2.model';
import { VALIDATION_STATUS } from 'src/constants/oauth2.enum';

const CLIENT_ID = Settings.shared.value.googleClientId;
const GoogleClient = new OAuth2Client(CLIENT_ID);

/**
 * Validate the Google ID Token
 *
 * @param idToken 
 * @returns 
 */
async function verifyGoogleIdToken(idToken: string): Promise<TokenPayload> {
  const ticket: LoginTicket = await GoogleClient.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  });
  return ticket.getPayload();
}

/**
 * Generate user account access token
 * 
 * @param res 
 * @param next 
 * @param email 
 * @param account 
 */
async function loginWithGoogle(res: Response, next: NextFunction, email: EmailDocument, account: any) {
  /* Ensure that email gets confirmed */
  if (email.status !== VALIDATION_STATUS.CONFIRMED) {
    email.status = VALIDATION_STATUS.CONFIRMED;
    await email.save()
  }

  /* Look for the application client */
  const client: any = res.locals["token"].client;

  /* Mark account as Google connected */
  if (account.external && EXTERNAL_ACCOUNT_TYPE.GOOGLE !== EXTERNAL_ACCOUNT_TYPE.GOOGLE) {
    account.external = account.external | EXTERNAL_ACCOUNT_TYPE.GOOGLE;
    await account.save();
  }

  /* Get the username */
  account["username"] = email.email;

  /* Generate the access token */
  OAuth2ModelCtrl.generateAccessToken(client, account, [])
    .then((accessToken: string) => {
      /* Generate the refresh token */
      OAuth2ModelCtrl.generateRefreshToken(client, account, [])
        .then((refreshToken: string) => {
          /* Prepare the authentication token */
          const token: Token = {
            accessToken: accessToken,
            accessTokenExpiresAt: new Date(
              Date.now() +
              (client.accessTokenLifetime ? client.accessTokenLifetime : 3600) * 1000
            ),
            refreshToken: refreshToken,
            refreshTokenExpiresAt: new Date(
              Date.now() +
              (client.accessTokenLifetime ? client.refreshTokenLifetime : 604800) * 1000
            ),
            scope: [],
            client: client,
            user: account,
            type: OAUTH2_TOKEN_TYPE.EXTERNAL_AUTH
          };
          /* Save the generated token */
          OAuth2ModelCtrl.saveToken(token, client, account)
            .then((token: Token) => {
              res.locals["token"] = token;
              res.locals["response"] = {
                id: account.id,
                tokenType: "Bearer",
                accessToken: token.accessToken,
                refreshToken: token.refreshToken,
                accessTokenExpiresAt: token.accessTokenExpiresAt
                  ? token.accessTokenExpiresAt.getTime()
                  : null,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt
                  ? token.refreshTokenExpiresAt.getTime()
                  : null,
                createdAt: token.createdAt.getTime(),
                scope: token.scope
              };
              next();
            })
            .catch(() => {
              /* On error proceed without authentication */
              next();
            });
        })
        .catch(() => {
          /* On error proceed without authentication */
          next();
        });
    })
    .catch(() => {
      /* On error proceed without authentication */
      next();
    });
}

/**
 * Register the external authentication routes
 * 
 * @param router 
 * @param prefix 
 */
export function register(router: Router, prefix: string) {
  /**
   * @api {post} /v1/oauth/external/google/register Register user account with Google
   * @apiVersion 2.0.0
   * @apiName RegisterGoogleUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/register`,
    FormURLEncoded,
    Validator.joi(RegisterValidation),
    ReCaptcha.v3("register"),
    OAuth2Ctrl.authenticate(["application", "register"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Validate the Google ID Token */
      verifyGoogleIdToken(req.body?.idToken).then((payload: TokenPayload) => {
        /* Find the user account with the given email address */
        EmailCtrl.fetchByEmail(payload.email).then((email: EmailDocument) => {
          /* The user exists then login with the user account */
          loginWithGoogle(res, next, email, email.account);
        }).catch(() => {
          /* Initialize the account data */
          const data: any = {
            name: Objects.get(req, "body.name"),
            lastname1: Objects.get(req, "body.lastname1"),
            lastname2: Objects.get(req, "body.lastname2"),
            password: Tokens.long,
            type: Objects.get(req, "body.type", 0),
            custom1: Objects.get(req, "body.custom1"),
            custom2: Objects.get(req, "body.custom2"),
            external: EXTERNAL_ACCOUNT_TYPE.GOOGLE
          };

          /* Register the new user account */
          AccountCtrl.register(data, Objects.get(req, "body.referral"))
            .then((account: AccountDocument) => {
              res.locals["account"] = account;
              /* Register the user email address */
              EmailCtrl.register(payload.email, account.id, true)
                .then((email: EmailDocument) => {
                  loginWithGoogle(res, next, email, account);
                })
                .catch(next);
            })
            .catch(next);
        });
      }).catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Check for router hook */
      if (Settings.shared.value?.routerHooks?.postRegister) {
        return Settings.shared.value.routerHooks.postRegister(req, res, next);
      }
      next();
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {post} /v1/oauth/external/google/login Authenticate user account with Google
   * @apiVersion 2.0.0
   * @apiName LoginGoogleUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/login`,
    FormURLEncoded,
    Validator.joi(LoginValidation),
    ReCaptcha.v3("login"),
    OAuth2Ctrl.authenticate(["application", "register"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Validate the Google ID Token */
      verifyGoogleIdToken(req.body?.idToken).then((payload: TokenPayload) => {
        /* Find the user account with the given email address */
        EmailCtrl.fetchByEmail(payload.email).then((email: EmailDocument) => {
          loginWithGoogle(res, next, email, email.account);
        }).catch(next);
      }).catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );
}
