/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AUTH_ERRORS, OAUTH2_TOKEN_TYPE } from "@ecualead/auth";
import {
  Validator,
  ResponseHandler,
  ValidateObjectId,
  Objects,
  HTTP_STATUS,
  FormURLEncoded
} from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import { Request as ORequest, Response as OResponse, Token } from "oauth2-server";
import { AccountCtrl } from "../controllers/account/account.controller";
import { EMAIL_CONFIRMATION, EVENT_TYPE } from "../constants/oauth2.enum";
import {
  RegisterValidation,
  AccountValidation,
  EmailValidation,
  RecoverValidation,
  PassowrdChangeValidation
} from "../validators/account.joi";
import { AccountDocument } from "../models/account/account.model";
import { ApplicationCtrl } from "../controllers/application/application.controller";
import { ApplicationDocument } from "../models/application/application.model";
import { OAuth2Ctrl } from "../controllers/oauth2/oauth2.controller";
import { EmailDocument } from "../models/account/email.model";
import { NotificationCtrl } from "../controllers/notification/notification.controller";
import { IconCtrl } from "../controllers/account/icon.controller";
import { EmailCtrl } from "../controllers/account/email.controller";
import { PhoneCtrl } from "../controllers/account/phone.controller";
import { Settings } from "../controllers/settings.controller";
import { OAuth2ModelCtrl } from "../controllers/oauth2/oauth2.model.controller";

export function register(router: Router, prefix: string) {
  /**
   * @api {post} /v1/oauth/register Register new user account
   * @apiVersion 2.0.0
   * @apiName RegisterUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/register`,
    FormURLEncoded,
    Validator.joi(RegisterValidation),
    OAuth2Ctrl.authenticate(["application", "register"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Validate if user email is registered */
      EmailCtrl.check(Objects.get(req, "body.email"), true)(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      const phone = Objects.get(req, "body.phone");
      /* Bypass if phone is not set */
      if (!phone) {
        return next();
      }
      /* Validate if user phone number is registered */
      PhoneCtrl.check(phone, true)(req, res, next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      // TODO XXX Add password policy
      // TODO XXX Register initial email and phone to prevent data conflict

      /* Initialize the account data */
      const data: any = {
        name: Objects.get(req, "body.name"),
        lastname1: Objects.get(req, "body.lastname1"),
        lastname2: Objects.get(req, "body.lastname2"),
        password: Objects.get(req, "body.password"),
        type: Objects.get(req, "body.type", 0),
        custom1: Objects.get(req, "body.custom1"),
        custom2: Objects.get(req, "body.custom2")
      };

      /* Register the new user account */
      AccountCtrl.register(data, Objects.get(req, "body.referral"))
        .then((account: AccountDocument) => {
          res.locals["account"] = account;
          res.locals["response"] = { id: account.id };
          next();
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Register the user email address */
      EmailCtrl.register(Objects.get(req, "body.email"), Objects.get(res, "locals.account._id"))
        .then((email: EmailDocument) => {
          /* Send the register notification */
          NotificationCtrl.doNotification(
            EVENT_TYPE.REGISTER,
            Objects.get(res, "locals.account"),
            email,
            {
              token: Objects.get(email, "token.token"),
              email: Objects.get(email, "email")
            }
          ).finally(() => {
            next();
          });
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Register the user phone number */
      const phone = Objects.get(req, "body.phone");
      if (!phone) {
        return next();
      }

      PhoneCtrl.register(phone, Objects.get(res, "locals.account._id"))
        .then(() => {
          next();
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Continue is confirmation is required */
      if (Settings.shared.value.emailPolicy.type === EMAIL_CONFIRMATION.REQUIRED) {
        return next();
      }

      /* Look for the application client */
      const client: any = res.locals["token"].client;
      
      /* Prepare user account */
      const account: any = res.locals["account"]
      account["username"] = Objects.get(req, "body.email");

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
   * @api {post} /v1/oauth/confirm Confirm user account email
   * @apiVersion 2.0.0
   * @apiName ConfirmUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/confirm`,
    FormURLEncoded,
    Validator.joi(AccountValidation),
    OAuth2Ctrl.authenticate(["application", "confirm"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Confirm the user account */
      AccountCtrl.confirmEmail(req.body["email"], req.body["token"])
        .then((userEmail: EmailDocument) => {
          /* Send the register notification */
          NotificationCtrl.doNotification(
            EVENT_TYPE.CONFIRM,
            userEmail.account as AccountDocument,
            userEmail,
            {
              email: Objects.get(userEmail, "email")
            }
          ).finally(() => {
            res.locals["response"] = { email: req.body["email"] };
            next();
          });
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Check for router hook */
      if (Settings.shared.value?.routerHooks?.postConfirm) {
        return Settings.shared.value.routerHooks.postConfirm(req, res, next);
      }

      next();
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {post} /v1/oauth/resend Confirm user account email
   * @apiVersion 2.0.0
   * @apiName ConfirmUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/resend`,
    FormURLEncoded,
    (req: Request, res: Response, next: NextFunction) => {
      const request = new ORequest(req);
      const response = new OResponse(res);
      OAuth2Ctrl.server
        .token(request, response)
        .then((_token: Token) => {
          next();
        })
        .catch(next);
    },
    (_req: Request, res: Response, next: NextFunction) => {
      /* If there is no error then user account is confirmated and don't need resend the email */
      next({
        boError: AUTH_ERRORS.ACCOUNT_ALREADY_CONFIRMED,
        boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
      });
    },
    OAuth2Ctrl.handleError,
    (err: any, req: Request, res: Response, next: NextFunction) => {
      /* Check for email not confirmed error */
      if (err.boError === AUTH_ERRORS.EMAIL_NOT_CONFIRMED) {
        /* Extract credentials from authorization header */
        const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
        const [login, _password] = Buffer.from(b64auth, "base64").toString().split(":");

        if (!login) {
          return next(err);
        }

        /* Fetch the requesting application */
        return ApplicationCtrl.fetch(login)
          .then((application: ApplicationDocument) => {
            /* Check application valid scope */
            if (application.scope.indexOf("register") < 0) {
              return next({
                boError: AUTH_ERRORS.INVALID_SCOPE,
                boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
              });
            }

            /* Call to resend confirmation */
            AccountCtrl.requestConfirmation(req.body["username"])
              .then((userEmail: EmailDocument) => {
                /* Send the register notification */
                NotificationCtrl.doNotification(
                  EVENT_TYPE.REGISTER,
                  userEmail.account as AccountDocument,
                  userEmail,
                  {
                    token: Objects.get(userEmail, "token.token"),
                    email: Objects.get(userEmail, "email")
                  }
                ).finally(() => {
                  res.locals["response"] = { email: req.body["username"] };
                  next();
                });
              })
              .catch(next);
          })
          .catch(next);
      }
      next(err);
    },
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {post} /v1/oauth/recover/request Request recover email
   * @apiVersion 2.0.0
   * @apiName RecoverUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/recover/request`,
    FormURLEncoded,
    Validator.joi(EmailValidation),
    OAuth2Ctrl.authenticate(["application", "recover"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Request a recover email */
      AccountCtrl.requestRecover(req.body["email"])
        .then((userEmail: EmailDocument) => {
          /* Send the account confirmation notification */
          NotificationCtrl.doNotification(
            EVENT_TYPE.RECOVER,
            userEmail.account as AccountDocument,
            userEmail,
            {
              token: Objects.get(userEmail, "token.token"),
              email: Objects.get(userEmail, "email")
            }
          ).finally(() => {
            res.locals["response"] = { email: req.body["email"] };
            next();
          });
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {post} /v1/oauth/recover/validate Validate recover token
   * @apiVersion 2.0.0
   * @apiName RecoverValidateUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/recover/validate`,
    FormURLEncoded,
    Validator.joi(AccountValidation),
    OAuth2Ctrl.authenticate(["application", "recover"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Validate the recover token */
      AccountCtrl.checkRecover(req.body["email"], req.body["token"])
        .then(() => {
          res.locals["response"] = { email: req.body["email"] };
          next();
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {post} /v1/oauth/recover/store Set new password from recover process
   * @apiVersion 2.0.0
   * @apiName RecoverStoreUser
   * @apiGroup User Accounts
   */
  router.post(
    `${prefix}/recover/store`,
    FormURLEncoded,
    Validator.joi(RecoverValidation),
    OAuth2Ctrl.authenticate(["application", "recover"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Recover the user account */
      AccountCtrl.doRecover(req.body["email"], req.body["token"], req.body["password"])
        .then((userEmail: EmailDocument) => {
          /* Send the account confirmation notification */
          NotificationCtrl.doNotification(
            EVENT_TYPE.CHPWD,
            userEmail.account as AccountDocument,
            userEmail,
            {
              email: Objects.get(userEmail, "email")
            }
          ).finally(() => {
            res.locals["response"] = { email: req.body["email"] };
            next();
          });
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {get} /v1/oauth/profile Get current user profile
   * @apiVersion 2.0.0
   * @apiName ProfileUser
   * @apiGroup User Accounts
   */
  router.get(
    `${prefix}/profile`,
    OAuth2Ctrl.authenticate("user"),
    (req: Request, res: Response, next: NextFunction) => {
      /* Request a recover email */
      AccountCtrl.fetch(Objects.get(res.locals, "token.user._id"))
        .then((value: AccountDocument) => {
          res.locals["response"] = {
            uid: value.id,
            name: value.name,
            lastname1: value.lastname1,
            lastname2: value.lastname2,
            initials: value.initials,
            color1: value.color1,
            color2: value.color2,
            referral: value.referral,
            type: value.type,
            email: Objects.get(res.locals, "token.username", "")
          };
          next();
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Check for router hook */
      if (Settings.shared.value?.routerHooks?.postProfile) {
        return Settings.shared.value.routerHooks.postProfile(req, res, next);
      }

      next();
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {put} /v1/oauth/profile Update current user profile
   * @apiVersion 2.0.0
   * @apiName ProfileUserUpdate
   * @apiGroup User Accounts
   */
  router.put(
    `${prefix}/profile`,
    OAuth2Ctrl.authenticate("user"),
    (req: Request, res: Response, next: NextFunction) => {
      /* Prepare the user information */
      const name = Objects.get(req, "body.name", "").trim();
      const lastname1 = Objects.get(req, "body.lastname1", "").trim();
      const lastname2 = Objects.get(req, "body.lastname2", "").trim();
      const fullname = `${name} ${lastname1} ${lastname1}`;
      const initials = IconCtrl.getInitials(fullname);
      const color1 = IconCtrl.getColor(fullname);

      /* Update user information */
      AccountCtrl.update(
        { _id: Objects.get(res.locals, "token.user._id") },
        {
          name: name,
          lastname1: lastname1,
          lastname2: lastname2,
          initials: initials,
          color1: color1
        }
      )
        .then((value: AccountDocument) => {
          res.locals["response"] = {
            uid: value.id,
            name: value.name,
            lastname1: value.lastname1,
            lastname2: value.lastname2,
            initials: value.initials,
            color1: value.color1,
            color2: value.color2,
            referral: value.referral,
            type: value.type,
            email: Objects.get(res.locals, "token.username", "")
          };
          next();
        })
        .catch(next);
    },
    (req: Request, res: Response, next: NextFunction) => {
      /* Check for router hook */
      if (Settings.shared.value?.routerHooks?.postProfileUpdate) {
        return Settings.shared.value.routerHooks.postProfileUpdate(req, res, next);
      }

      next();
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {get} /v1/oauth/password Change current user password
   * @apiVersion 2.0.0
   * @apiName ProfileUser
   * @apiGroup User Accounts
   */
  router.put(
    `${prefix}/password`,
    FormURLEncoded,
    Validator.joi(PassowrdChangeValidation),
    OAuth2Ctrl.authenticate(["user"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Request a recover email */
      AccountCtrl.fetch(Objects.get(res.locals, "token.user._id"))
        .then((value: AccountDocument) => {
          AccountCtrl.changePassword(
            value,
            req.body["oldPassword"],
            req.body["newPassword"],
            Objects.get(res.locals, "token.username")
          )
            .then((userEmail: EmailDocument) => {
              /* Send the account change password notification */
              NotificationCtrl.doNotification(
                EVENT_TYPE.CHPWD,
                userEmail.account as AccountDocument,
                userEmail,
                {
                  email: Objects.get(userEmail, "email")
                }
              ).finally(() => {
                res.locals["response"] = { email: req.body["email"] };
                next();
              });
            })
            .catch(next);
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );

  /**
   * @api {get} /v1/oauth/profile/:id Get user profile info
   * @apiVersion 2.0.0
   * @apiName ProfileUser
   * @apiGroup User Accounts
   */
  router.get(
    `${prefix}/profile/:id`,
    Validator.joi(ValidateObjectId, "params"),
    OAuth2Ctrl.authenticate(["application", "profile"]),
    (req: Request, res: Response, next: NextFunction) => {
      /* Request a recover email */
      AccountCtrl.fetch(req.params.id)
        .then((value: AccountDocument) => {
          res.locals["response"] = {
            uid: value.id,
            name: value.name,
            lastname1: value.lastname1,
            lastname2: value.lastname2,
            initials: value.initials,
            color1: value.color1,
            color2: value.color2
          };
          next();
        })
        .catch(next);
    },
    OAuth2Ctrl.handleError,
    ResponseHandler.success,
    ResponseHandler.error
  );
}
