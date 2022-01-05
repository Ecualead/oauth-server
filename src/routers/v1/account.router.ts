/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AUTH_ERRORS } from "@ecualead/auth";
import {
  Validator,
  ResponseHandler,
  ValidateObjectId,
  Objects,
  HTTP_STATUS
} from "@ecualead/server";
import { Router, Request, Response, NextFunction } from "express";
import { Request as ORequest, Response as OResponse, Token } from "oauth2-server";
import { Accounts } from "../../controllers/account/account.controller";
import { EVENT_TYPE } from "../../constants/account.enum";
import {
  RegisterValidation,
  AccountValidation,
  EmailValidation,
  RecoverValidation,
  PassowrdChangeValidation
} from "../../validators/account.joi";
import { AccountDocument } from "../../models/account/account.model";
import { ApplicationCtrl } from "../../controllers/application/application.controller";
import { ApplicationDocument } from "../../models/application/application.model";
import { OAuth2Ctrl } from "../../controllers/oauth2/oauth2.controller";
import { OAuth2ModelCtrl } from "../../controllers/oauth2/oauth2.model.controller";
import { EmailDocument } from "../../models/account/email.model";
import { Notification } from "../../controllers/notification/notification.controller";
import { IconCtrl } from "../../controllers/account/icon.controller";
import { Emails } from "../../controllers/account/email.controller";
import { Phones } from "../../controllers/account/phone.controller";

const router = Router({ mergeParams: true });

/**
 * @api {post} /v1/oauth/:project/register Register new user account
 * @apiVersion 2.0.0
 * @apiName RegisterUser
 * @apiGroup User Accounts
 */
router.post(
  "/register",
  Validator.joi(RegisterValidation),
  OAuth2Ctrl.authenticate(["non_user"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Validate if user email is registered */
    Emails.shared.check(Objects.get(req, "body.email"), true)(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    const phone = Objects.get(req, "body.phone");

    /* Bypass if phone is not set */
    if (!phone) {
      return next();
    }

    /* Validate if user phone number is registered */
    Phones.shared.check(phone, true)(req, res, next);
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
    Accounts.shared
      .register(data, Objects.get(req, "body.referral"))
      .then((account: AccountDocument) => {
        res.locals["account"] = account;
        res.locals["response"] = { id: account.id };
        next();
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Register the user email address */
    Emails.shared
      .register(Objects.get(req, "body.email"), Objects.get(res, "locals.account._id"))
      .then((email: EmailDocument) => {
        /* Send the register notification */
        Notification.shared
          .doNotification(EVENT_TYPE.REGISTER, Objects.get(res, "locals.account"), email, {
            token: Objects.get(email, "token.token"),
            email: Objects.get(email, "email")
          })
          .finally(() => {
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

    Phones.shared
      .register(phone, Objects.get(res, "locals.account._id"))
      .then(() => {
        next();
      })
      .catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {post} /v1/oauth/:project/confirm Confirm user account email
 * @apiVersion 2.0.0
 * @apiName ConfirmUser
 * @apiGroup User Accounts
 */
router.post(
  "/confirm",
  Validator.joi(AccountValidation),
  OAuth2Ctrl.authenticate(["application"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Confirm the user account */
    Accounts.shared
      .confirmEmail(req.body["email"], req.body["token"])
      .then((userEmail: EmailDocument) => {
        /* Send the register notification */
        Notification.shared
          .doNotification(EVENT_TYPE.CONFIRM, userEmail.account as AccountDocument, userEmail, {
            email: Objects.get(userEmail, "email")
          })
          .finally(() => {
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
 * @api {post} /v1/oauth/:project/resend Confirm user account email
 * @apiVersion 2.0.0
 * @apiName ConfirmUser
 * @apiGroup User Accounts
 */
router.post(
  "/resend",

  (req: Request, res: Response, next: NextFunction) => {
    /* Extract project from requesting application */
    const basic = req.headers.authorization.split(" ");
    if (basic.length === 2 && basic[0].toUpperCase() === "BASIC") {
      const buff = Buffer.from(basic[1], "base64");
      const plain: string[] = buff.toString("ascii").split(":");
      if (plain.length === 2) {
        return ApplicationCtrl.fetch({ _id: plain[0] })
          .then((application: ApplicationDocument) => {
            const email = req.body["username"];
            req.body["username"] = `${email}`;
          })
          .finally(() => {
            next();
          });
      }
    }
  },
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
      ApplicationCtrl.fetch(login, null, ["project"])
        .then((application: ApplicationDocument) => {
          /* Check application valid scope */
          if (application.scope.indexOf("mod_ims_resend_confirm") < 0) {
            return next({
              boError: AUTH_ERRORS.INVALID_SCOPE,
              boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
            });
          }

          const email: string[] = req.body["username"].split(" ");
          if (email.length !== 2) {
            return next({
              boError: AUTH_ERRORS.INVALID_CREDENTIALS,
              boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
            });
          }

          /* Call to resend confirmation */
          Accounts.shared
            .requestConfirmation(email[1])
            .then((userEmail: EmailDocument) => {
              /* Send the register notification */
              Notification.shared
                .doNotification(
                  EVENT_TYPE.REGISTER,
                  userEmail.account as AccountDocument,
                  userEmail,
                  {
                    token: Objects.get(userEmail, "token.token"),
                    email: Objects.get(userEmail, "email")
                  }
                )
                .finally(() => {
                  res.locals["response"] = { email: req.body["username"] };
                  next();
                });
            })
            .catch(next);
        })
        .catch(next);
      return;
    }
    next(err);
  },
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {post} /v1/oauth/:project/recover/request Request recover email
 * @apiVersion 2.0.0
 * @apiName RecoverUser
 * @apiGroup User Accounts
 */
router.post(
  "/recover/request",
  Validator.joi(EmailValidation),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_account"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    Accounts.shared
      .requestRecover(req.body["email"])
      .then((userEmail: EmailDocument) => {
        /* Send the account confirmation notification */
        Notification.shared
          .doNotification(EVENT_TYPE.RECOVER, userEmail.account as AccountDocument, userEmail, {
            token: Objects.get(userEmail, "token.token"),
            email: Objects.get(userEmail, "email")
          })
          .finally(() => {
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
 * @api {post} /v1/oauth/:project/recover/validate Validate recover token
 * @apiVersion 2.0.0
 * @apiName RecoverValidateUser
 * @apiGroup User Accounts
 */
router.post(
  "/recover/validate",
  Validator.joi(AccountValidation),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_validate"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Validate the recover token */
    Accounts.shared
      .checkRecover(req.body["email"], req.body["token"])
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
 * @api {post} /v1/oauth/:project/recover/store Set new password from recover process
 * @apiVersion 2.0.0
 * @apiName RecoverStoreUser
 * @apiGroup User Accounts
 */
router.post(
  "/recover/store",
  Validator.joi(RecoverValidation),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_change"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Recover the user account */
    Accounts.shared
      .doRecover(req.body["email"], req.body["token"], req.body["password"])
      .then((userEmail: EmailDocument) => {
        /* Send the account confirmation notification */
        Notification.shared
          .doNotification(EVENT_TYPE.CHPWD, userEmail.account as AccountDocument, userEmail, {
            email: Objects.get(userEmail, "email")
          })
          .finally(() => {
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
 * @api {post} /v1/oauth/:project/logout Logout the current user
 * @apiVersion 2.0.0
 * @apiName LogoutUser
 * @apiGroup User Accounts
 */
router.post(
  "/logout",
  OAuth2Ctrl.authenticate(),
  (_req: Request, res: Response, next: NextFunction) => {
    /* Revoke the access token */
    OAuth2ModelCtrl.revokeToken(res.locals["token"])
      .then(() => {
        res.locals["response"] = {};
        next();
      })
      .catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/oauth/:project/profile Get current user profile
 * @apiVersion 2.0.0
 * @apiName ProfileUser
 * @apiGroup User Accounts
 */
router.get(
  "/profile",
  OAuth2Ctrl.authenticate("user"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    Accounts.shared
      .fetch(Objects.get(res.locals, "token.user._id"))
      .then((value: AccountDocument) => {
        res.locals["response"] = {
          id: value.id,
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
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {put} /v1/oauth/:project/profile Update current user profile
 * @apiVersion 2.0.0
 * @apiName ProfileUserUpdate
 * @apiGroup User Accounts
 */
router.put(
  "/profile",
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
    Accounts.shared
      .update(
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
          id: value.id,
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
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

/**
 * @api {get} /v1/oauth/:project/password Change current user password
 * @apiVersion 2.0.0
 * @apiName ProfileUser
 * @apiGroup User Accounts
 */
router.post(
  "/password",
  Validator.joi(PassowrdChangeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    Accounts.shared
      .fetch(Objects.get(res.locals, "token.user._id"))
      .then((value: AccountDocument) => {
        Accounts.shared
          .changePassword(
            value,
            req.body["oldPassword"],
            req.body["newPassword"],
            Objects.get(res.locals, "token.username")
          )
          .then((userEmail: EmailDocument) => {
            /* Send the account change password notification */
            Notification.shared
              .doNotification(EVENT_TYPE.CHPWD, userEmail.account as AccountDocument, userEmail, {
                email: Objects.get(userEmail, "email")
              })
              .finally(() => {
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
export default router;
