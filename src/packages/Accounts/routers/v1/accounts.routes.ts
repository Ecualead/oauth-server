/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AUTH_ERRORS } from "@ikoabo/auth";
import { Objects, HTTP_STATUS } from "@ikoabo/core";
import { Validator, ResponseHandler, ValidateObjectId } from "@ikoabo/server";
import { Router, Request, Response, NextFunction } from "express";
import { Request as ORequest, Response as OResponse, Token } from "oauth2-server";
import { AccountCtrl } from "@/Accounts/controllers/accounts.controller";
import { Notifications } from "@/Accounts/controllers/notifications.controller";
import { NOTIFICATIONS_EVENTS_TYPES } from "@/Accounts/models/accounts.enum";
import {
  RegisterValidation,
  AccountValidation,
  EmailValidation,
  RecoverValidation,
  PassowrdChangeValidation
} from "@/Accounts/models/accounts.joi";
import { AccountDocument } from "@/Accounts/models/accounts.model";
import { AccountProjectProfileDocument } from "@/Accounts/models/accounts.projects.model";
import { ApplicationCtrl } from "@/Applications/controllers/applications.controller";
import { ApplicationDocument } from "@/Applications/models/applications.model";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";
import { OAuth2ModelCtrl } from "@/OAuth2/controllers/oauth2.model.controller";

const router = Router();

router.post(
  "/signup",
  Validator.joi(RegisterValidation),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_register_user"]),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Add password policy
    /* Initialize the account data */
    const data: any = {
      name: req.body["name"],
      lastname: req.body["lastname"],
      email: req.body["email"],
      password: req.body["password"],
      phone: req.body["phone"],
      type: req.body["type"],
      custom1: req.body["custom1"],
      custom2: req.body["custom2"]
    };

    /* Register the new user account */
    AccountCtrl.register(data, res.locals["token"].client)
      .then((account: AccountDocument) => {
        /* Register the user account into the given project */
        AccountCtrl.createUserProfile(
          account,
          Objects.get(res, "locals.token.client.project._id"),
          req.body["referral"]
        )
          .then((profile: AccountProjectProfileDocument) => {
            /* Send the register notification */
            Notifications.shared
              .doNotification(NOTIFICATIONS_EVENTS_TYPES.NET_SIGNUP, profile, {
                token: Objects.get(account, "emails.0.confirm.token"),
                email: req.body["email"]
              })
              .finally(() => {
                res.locals["response"] = {
                  user: Objects.get(profile, "account._id", profile.account)
                };
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

router.post(
  "/confirm",
  Validator.joi(AccountValidation),
  OAuth2Ctrl.authenticate(["application", "mod_ims_confirm_account"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Confirm the user account */
    AccountCtrl.confirmAccount(
      req.body["email"],
      req.body["token"],
      Objects.get(res.locals, "token.client.project")
    )
      .then((profile: AccountProjectProfileDocument) => {
        /* Send the account confirmation notification */
        Notifications.shared
          .doNotification(NOTIFICATIONS_EVENTS_TYPES.NET_CONFIRM, profile, {
            email: req.body["email"]
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

router.post(
  "/resend",
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

          /* Call to resend confirmation */
          AccountCtrl.requestConfirmation(req.body["username"], Objects.get(application, "project"))
            .then((profile: AccountProjectProfileDocument) => {
              /* Send the register notification */
              Notifications.shared
                .doNotification(NOTIFICATIONS_EVENTS_TYPES.NET_SIGNUP, profile, {
                  email: req.body["username"]
                })
                .finally(() => {
                  res.locals["response"] = {
                    user: Objects.get(profile, "account._id", profile.account)
                  };
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

router.post(
  "/recover/request",
  Validator.joi(EmailValidation),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_account"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.requestRecover(req.body["email"], Objects.get(res.locals, "token.client.project"))
      .then((profile: AccountProjectProfileDocument) => {
        /* Send the account confirmation notification */
        Notifications.shared
          .doNotification(NOTIFICATIONS_EVENTS_TYPES.NET_RECOVER, profile, {
            email: req.body["email"]
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

router.post(
  "/recover/validate",
  Validator.joi(AccountValidation),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_validate"]),
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

router.post(
  "/recover/store",
  Validator.joi(RecoverValidation),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_recover_change"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Recover the user account */
    AccountCtrl.doRecover(
      req.body["email"],
      req.body["token"],
      req.body["password"],
      Objects.get(res.locals, "token.client.project")
    )
      .then((profile: AccountProjectProfileDocument) => {
        /* Send the account confirmation notification */
        Notifications.shared
          .doNotification(NOTIFICATIONS_EVENTS_TYPES.NET_CHPWD, profile)
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

router.get(
  "/profile",
  OAuth2Ctrl.authenticate("user"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.fetch(Objects.get(res.locals, "token.user._id"))
      .then((value: AccountDocument) => {
        res.locals["response"] = {
          user: value.id,
          name: value.name,
          lastname: value.lastname,
          email: value.email,
          phone: value.phone,
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

router.get(
  "/avatar-info/:id",
  Validator.joi(ValidateObjectId, "params"),
  OAuth2Ctrl.authenticate(["non_user", "mod_ims_avatar_info"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.fetch(req.params.id)
      .then((value: AccountDocument) => {
        res.locals["response"] = {
          user: value.id,
          name: value.name,
          lastname: value.lastname,
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

router.put(
  "/password",
  Validator.joi(PassowrdChangeValidation),
  OAuth2Ctrl.authenticate(["user"]),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.fetch(Objects.get(res.locals, "token.user._id"))
      .then((value: AccountDocument) => {
        AccountCtrl.changePassword(value, req.body["oldPassword"], req.body["newPassword"])
          .then((account: AccountDocument) => {
            AccountCtrl.getProfile(account.id, Objects.get(res.locals, "token.client.project._id"))
              .then((profile: AccountProjectProfileDocument) => {
                /* Send the account confirmation notification */
                Notifications.shared
                  .doNotification(NOTIFICATIONS_EVENTS_TYPES.NET_CHPWD, profile, {
                    email: Objects.get(res.locals, "token.username")
                  })
                  .finally(() => {
                    res.locals["response"] = {
                      user: account.id
                    };
                    next();
                  });
              })
              .catch(next);
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
