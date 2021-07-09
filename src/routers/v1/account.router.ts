/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AUTH_ERRORS } from "@ikoabo/auth";
import { Objects, HTTP_STATUS } from "@ikoabo/core";
import { Validator, ResponseHandler, ValidateObjectId } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { Request as ORequest, Response as OResponse, Token } from "oauth2-server";
import { AccountCtrl } from "@/controllers/account/account.controller";
import { EVENT_TYPE } from "@/constants/account.enum";
import {
  RegisterValidation,
  AccountValidation,
  EmailValidation,
  RecoverValidation,
  PassowrdChangeValidation
} from "@/validators/account.joi";
import { AccountDocument } from "@/models/account/account.model";
import { ApplicationCtrl } from "@/controllers/application/application.controller";
import { ApplicationDocument } from "@/models/application/application.model";
import { OAuth2Ctrl } from "@/controllers/oauth2/oauth2.controller";
import { OAuth2ModelCtrl } from "@/controllers/oauth2/oauth2-model.controller";
import { AccountEmailDocument } from "@/models/account/email.model";
import { NotificationCtrl } from "@/controllers/notification/notification.controller";
import { checkUrlProject } from "@/middlewares/project.middleware";

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
  checkUrlProject,
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_register_user"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Validate if user email is registered */
    AccountCtrl.checkEmail(
      Objects.get(req, "body.email"),
      Objects.get(res, "locals.token.client.project._id"),
      true
    )(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    const phone = Objects.get(req, "body.phone");

    /* Bypass if phone is not set */
    if (!phone) {
      return next();
    }

    /* Validate if user phone number is registered */
    AccountCtrl.checkPhone(phone, Objects.get(res, "locals.token.client.project._id"), true)(
      req,
      res,
      next
    );
  },
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Add password policy
    // TODO XXX Register initial email and phone to prevent data conflict

    /* Initialize the account data */
    const data: any = {
      project: Objects.get(res, "locals.token.client.project._id"),
      name: Objects.get(req, "body.name"),
      lastname1: Objects.get(req, "body.lastname1"),
      lastname2: Objects.get(req, "body.lastname2"),
      password: Objects.get(req, "body.password"),
      type: Objects.get(req, "body.type", 0),
      custom1: Objects.get(req, "body.custom1"),
      custom2: Objects.get(req, "body.custom2"),
      referral: Objects.get(req, "body.referral")
    };

    /* Register the new user account */
    AccountCtrl.registerAccount(data, Objects.get(res, "locals.token.client.project"))
      .then((account: AccountDocument) => {
        res.locals["account"] = account;
        res.locals["response"] = { id: account.id };
        next();
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Register the user email address */
    AccountCtrl.registerEmail(
      Objects.get(req, "body.email"),
      Objects.get(res, "locals.token.client.project"),
      "Register email",
      Objects.get(res, "locals.account._id")
    )
      .then((email: AccountEmailDocument) => {
        /* Send the register notification */
        NotificationCtrl.doNotification(
          EVENT_TYPE.REGISTER,
          Objects.get(res, "locals.account"),
          email,
          Objects.get(res, "locals.token.client.project"),
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

    AccountCtrl.registerPhone(phone, "Register phone", Objects.get(res, "locals.account._id"))
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
  checkUrlProject,
  OAuth2Ctrl.authenticate(["application", "mod_ims_confirm_account"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Confirm the user account */
    AccountCtrl.confirmEmail(
      req.body["email"],
      req.body["token"],
      Objects.get(res.locals, "token.client.project")
    )
      .then((userEmail: AccountEmailDocument) => {
        /* Send the register notification */
        NotificationCtrl.doNotification(
          EVENT_TYPE.CONFIRM,
          userEmail.account as AccountDocument,
          userEmail,
          Objects.get(res, "locals.token.client.project"),
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
 * @api {post} /v1/oauth/:project/resend Confirm user account email
 * @apiVersion 2.0.0
 * @apiName ConfirmUser
 * @apiGroup User Accounts
 */
router.post(
  "/resend",
  checkUrlProject,
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
            req.body["username"] = `${application.project} ${email}`;
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
          AccountCtrl.requestConfirmation(email[1], Objects.get(application, "project"))
            .then((userEmail: AccountEmailDocument) => {
              /* Send the register notification */
              NotificationCtrl.doNotification(
                EVENT_TYPE.REGISTER,
                userEmail.account as AccountDocument,
                userEmail,
                Objects.get(res, "locals.token.client.project"),
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
  checkUrlProject,
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_account"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.requestRecover(req.body["email"], Objects.get(res.locals, "token.client.project"))
      .then((userEmail: AccountEmailDocument) => {
        /* Send the account confirmation notification */
        NotificationCtrl.doNotification(
          EVENT_TYPE.RECOVER,
          userEmail.account as AccountDocument,
          userEmail,
          Objects.get(res, "locals.token.client.project"),
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
 * @api {post} /v1/oauth/:project/recover/validate Validate recover token
 * @apiVersion 2.0.0
 * @apiName RecoverValidateUser
 * @apiGroup User Accounts
 */
router.post(
  "/recover/validate",
  Validator.joi(AccountValidation),
  checkUrlProject,
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_validate"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Validate the recover token */
    AccountCtrl.checkRecover(
      req.body["email"],
      req.body["token"],
      Objects.get(res.locals, "token.client.project")
    )
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
  checkUrlProject,
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_change"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Recover the user account */
    AccountCtrl.doRecover(
      req.body["email"],
      req.body["token"],
      req.body["password"],
      Objects.get(res.locals, "token.client.project")
    )
      .then((userEmail: AccountEmailDocument) => {
        /* Send the account confirmation notification */
        NotificationCtrl.doNotification(
          EVENT_TYPE.CHPWD,
          userEmail.account as AccountDocument,
          userEmail,
          Objects.get(res, "locals.token.client.project"),
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
 * @api {post} /v1/oauth/:project/logout Logout the current user
 * @apiVersion 2.0.0
 * @apiName LogoutUser
 * @apiGroup User Accounts
 */
router.post(
  "/logout",
  OAuth2Ctrl.authenticate(),
  checkUrlProject,
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
  checkUrlProject,
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.fetch(Objects.get(res.locals, "token.user._id"))
      .then((value: AccountDocument) => {
        res.locals["response"] = {
          id: value.id,
          name: value.name,
          lastname1: value.lastname1,
          lastname2: value.lastname2,
          code: value.code,
          initials: value.initials,
          color1: value.color1,
          color2: value.color2,
          referral: value.referral,
          type: value.type,
          custom1: value.custom1,
          custom2: value.custom2
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
 * @api {get} /v1/oauth/:project/profile/:id Get user profile info
 * @apiVersion 2.0.0
 * @apiName ProfileUser
 * @apiGroup User Accounts
 */
router.get(
  "/profile/:id",
  Validator.joi(ValidateObjectId, "params"),
  checkUrlProject,
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_avatar_info"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.fetch(req.params.id)
      .then((value: AccountDocument) => {
        res.locals["response"] = {
          user: value.id,
          name: value.name,
          lastname1: value.lastname1,
          lastname2: value.lastname2,
          initials: value.initials,
          color1: value.color1,
          color2: value.color2,
          code: value.code
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
router.put(
  "/password",
  Validator.joi(PassowrdChangeValidation),
  checkUrlProject,
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
          .then((userEmail: AccountEmailDocument) => {
            /* Send the account change password notification */
            NotificationCtrl.doNotification(
              EVENT_TYPE.CHPWD,
              userEmail.account as AccountDocument,
              userEmail,
              Objects.get(res, "locals.token.client.project"),
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
export default router;
