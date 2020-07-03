import { Router, Request, Response, NextFunction } from "express";
import { ResponseHandler, Validators } from "@ikoabo/core_srv";
import { Mail } from "@ikoabo/comm_srv";
import { Accounts } from "../../controllers/accounts.controller";
import { OAuth2 } from "@/packages/OAuth2/controllers/oauth2.controller";
import {
  RegisterValidation,
  AccountValidation,
  EmailValidation,
  RecoverValidation,
} from "../../models/accounts.joi";
import { Account, AccountDocument } from "../../models/accounts.model";
import { AccountProjectProfileDocument } from "../../models/accounts.projects.model";

const router = Router();
const AccountCtrl = Accounts.shared;
const OAuth2Ctrl = OAuth2.shared;
const MailCtrl = Mail.shared;

router.post(
  "/register",
  Validators.joi(RegisterValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    // TODO XXX Add password policy
    /* Initialize the account data */
    let data: Account = {
      name: req.body["name"],
      email: req.body["email"],
      password: req.body["password"],
      phone: req.body["phone"],
    };

    /* Register the new user account */
    AccountCtrl.register(data, res.locals["token"].client)
      .then((value: AccountDocument) => {
        /* Register the user account into the given project */
        AccountCtrl.registerProject(
          value,
          req.body["profile"],
          res.locals["token"].client
        )
          .then((profile: AccountProjectProfileDocument) => {
            /* Send mail notification about the account creation */
            MailCtrl.send(
              res.locals["token"].client.project.id,
              "account-register",
              "Cuenta de usuario registrada",
              "es",
              value.email,
              [],
              [],
              {
                name: value.name,
                code: value.code,
                phone: value.phone,
                date: value.createdAt,
                link: `https://www.mapa-c19.com/confirm?email=${value.email}&token=${value.recoverToken.token}`,
              }
            ).finally(() => {
              res.locals["response"] = {
                uid: profile.account,
                scope: profile.scope,
                profile: profile.profile,
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
  Validators.joi(AccountValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    /* Confirm the user account */
    AccountCtrl.confirmAccount(req.body["email"], req.body["token"])
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
  "/recover/request",
  Validators.joi(EmailValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    /* Request a recover email */
    AccountCtrl.requestRecover(req.body["email"], res.locals["token"].client)
      .then((value: AccountDocument) => {
        /* Send mail notification about the account creation */
        MailCtrl.send(
          res.locals["token"].client.project.id,
          "account-recover",
          "Recuperación de cuenta de usuario",
          "es",
          value.email,
          [],
          [],
          {
            name: value.name,
            code: value.code,
            email: value.email,
            phone: value.phone,
            token: value.recoverToken.token,
          }
        ).finally(() => {
          res.locals["response"] = { email: req.body["email"] };
          next();
        });
        next();
      })
      .catch(next);
  },
  OAuth2Ctrl.handleError,
  ResponseHandler.success,
  ResponseHandler.error
);

router.post(
  "/recover/validate",
  Validators.joi(AccountValidation),
  OAuth2Ctrl.authenticate(),
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
  Validators.joi(RecoverValidation),
  OAuth2Ctrl.authenticate(),
  (req: Request, res: Response, next: NextFunction) => {
    /* Recover the user account */
    AccountCtrl.doRecover(
      req.body["email"],
      req.body["token"],
      req.body["password"]
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

export default router;
