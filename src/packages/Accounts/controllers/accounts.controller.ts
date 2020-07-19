import { Logger, Token, Objects, Arrays, HTTP_STATUS, CRUD } from "@ikoabo/core_srv";
import { ERRORS } from "@ikoabo/auth_srv";
import { AccountCodeCtrl } from "@/Accounts/controllers/accounts.code.controller";
import { ApplicationDocument } from "@/Applications/models/applications.model";
import {
  AccountDocument,
  Account,
  AccountModel,
} from "@/Accounts/models/accounts.model";
import {
  PROJECT_EMAIL_CONFIRMATION,
  PROJECT_RECOVER_TYPE,
  PROJECT_LIFETIME_TYPES,
} from "@/Projects/models/projects.enum";
import {
  ACCOUNT_STATUS,
  RECOVER_TOKEN_STATUS,
  SCP_ACCOUNT_DEFAULT,
  SCP_PREVENT,
  SCP_NON_INHERITABLE,
} from "@/Accounts/models/accounts.enum";
import { AccountProjectProfileDocument, AccountProjectProfileModel } from "@/Accounts/models/accounts.projects.model";
import { ProjectDocument } from "@/Projects/models/projects.model";
import {
  AccountTreeModel,
  AccountTreeDocument,
} from "../models/accounts.tree.model";

class Accounts extends CRUD<Account, AccountDocument>{
  private static _instance: Accounts;


  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    super('Accounts', AccountModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Accounts {
    if (!Accounts._instance) {
      Accounts._instance = new Accounts();
    }
    return Accounts._instance;
  }

  public register(
    data: Account,
    application: ApplicationDocument
  ): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Find if there is an user registered with the email */
      AccountModel.findOne({ email: data.email })
        .then((user: AccountDocument) => {
          /* Check if user is already registered */
          if (user) {
            reject({ boError: ERRORS.EMAIL_IN_USE });
            return;
          }

          /* Request user code creation */
          AccountCodeCtrl.code
            .then((code: string) => {
              /* Set the user code */
              data.code = code;

              /* Get initial user status by email confirmation policy */
              const confirmationPolicy = Objects.get(
                application.project,
                "settings.emailConfirmation.type",
                PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED
              );
              let status = ACCOUNT_STATUS.AS_REGISTERED;
              switch (confirmationPolicy) {
                case PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED_BY_TIME:
                  status = ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH;
                  break;
                case PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_REQUIRED:
                  status = ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH;
                  break;
              }

              /* Set the new user status */
              data.status = status;

              /* Set the confirmation expiration */
              if (status === ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH) {
                data.confirmationExpires =
                  Date.now() +
                  Objects.get(
                    application.project,
                    "settings.emailConfirmation.time",
                    0
                  );
              }

              /* Set the confirmation token information if its necessary */
              const recoverType = Objects.get(
                application.project,
                "settings.recover",
                PROJECT_RECOVER_TYPE.RT_LINK
              );
              if (
                status !== ACCOUNT_STATUS.AS_REGISTERED &&
                recoverType !== PROJECT_RECOVER_TYPE.RT_DISABLED
              ) {
                data.recoverToken = {
                  token:
                    recoverType !== PROJECT_RECOVER_TYPE.RT_LINK
                      ? Token.shortToken
                      : Token.longToken,
                  attempts: 0,
                  status: RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
                  expires:
                    Date.now() + PROJECT_LIFETIME_TYPES.LT_24HOURS * 1000,
                };
              }

              this._logger.debug("Registering new user account", data);

              /* Register the new user */
              AccountModel.create(data).then(resolve).catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public registerProject(
    account: AccountDocument,
    application: ApplicationDocument,
    referral: string
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      const project = (<ProjectDocument>application.project)["_id"].toString();

      /* Check if the user is currently registered into the project */
      AccountProjectProfileModel.findOne({ account: account.id, project: project })
        .then((value: AccountProjectProfileDocument) => {
          if (value) {
            reject({ boError: ERRORS.USER_DUPLICATED });
            return;
          }

          /* Initialize the profile */
          let profile = {
            account: account._id,
            project: project,
            status: ACCOUNT_STATUS.AS_REGISTERED,
            referral: referral,
            scope: Arrays.force(
              SCP_ACCOUNT_DEFAULT,
              [],
              SCP_NON_INHERITABLE
            ),
          };

          /* Set the new user scope using default values and application scope */
          profile["scope"] = profile["scope"].filter(
            (scope: string) => SCP_PREVENT.indexOf(scope) < 0
          );

          /* Register the user into the current project */
          AccountProjectProfileModel
            .findOneAndUpdate(
              { project: project, account: account._id },
              { $set: profile },
              { upsert: true, new: true }
            )
            .populate("project")
            .populate("account")
            .then((value: AccountProjectProfileDocument) => {
              /* Look for the referral parent user */
              AccountTreeModel.findOne({ project: project, code: referral })
                .then((parent: AccountTreeDocument) => {
                  /* Initialize user referral tree */
                  const tree: any[] = parent ? parent.tree : [];
                  tree.push(account._id);

                  /* Register the user referral tree */
                  AccountTreeModel.create({
                    project: project,
                    account: account._id,
                    code: account.code,
                    tree: tree,
                  }).finally(() => {
                    resolve(value);
                  });
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public changePassword(
    account: AccountDocument,
    oldPassword: string,
    newPassword: string
  ): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Validate the old password */
      account
        .validPassword(oldPassword)
        .then(() => {
          /* Set the new password */
          AccountModel.findOneAndUpdate(
            { _id: account.id },
            {
              $set: {
                password: newPassword,
              },
            },
            { new: true }
          )
            .then((value: AccountDocument) => {
              if (!value) {
                reject({ boError: ERRORS.ACCOUNT_NOT_REGISTERED });
                return;
              }
              this._logger.debug("User password updated", {
                email: value.email,
              });
              resolve(value);
            })
            .catch(reject);
        })
        .catch((err: any) => {
          this._logger.error("Invalid password validation", err);
          reject({ boError: ERRORS.INVALID_CREDENTIALS });
        });
    });
  }

  public confirmAccount(
    email: string,
    token: string,
    project: string
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      const update: any = { $inc: { "recoverToken.attempts": 1 } };
      AccountModel.findOneAndUpdate({ email: email }, update, { new: true })
        .then((value: AccountDocument) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Validate the user status */
          switch (value.status) {
            case ACCOUNT_STATUS.AS_CANCELLED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_CANCELLED,
              });
              return;
            case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_DISABLED,
              });
              return;
            case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_BLOCKED,
              });
              return;
            case ACCOUNT_STATUS.AS_CONFIRMED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_ALREADY_CONFIRMED,
              });
              return;
          }

          /* Validate max attempts */
          if (value.recoverToken.attempts > 3) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.MAX_ATTEMPTS,
            });
            return;
          }

          /* Validate expiration time */
          if (value.recoverToken.expires < Date.now()) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.TOKEN_EXPIRED,
            });
            return;
          }

          /* Update the confirm account status */
          AccountModel.findOneAndUpdate(
            {
              _id: value.id,
              "recoverToken.token": token,
              "recoverToken.status": RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
            },
            {
              $set: {
                status: ACCOUNT_STATUS.AS_CONFIRMED,
                "recoverToken.expires": 0,
                "recoverToken.status": RECOVER_TOKEN_STATUS.RTS_DISABLED,
              },
            },
            { new: true }
          )
            .then((value: AccountDocument) => {
              if (!value) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                  boError: ERRORS.INVALID_TOKEN,
                });
                return;
              }

              /* Fetch the user account profile */
              AccountProjectProfileModel.findOne({ project: project, account: value.id })
                .populate("account")
                .populate("project")
                .then((profile: AccountProjectProfileDocument) => {
                  if (!value) {
                    reject({
                      boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                      boError: ERRORS.INVALID_TOKEN,
                    });
                    return;
                  }

                  this._logger.debug("User account confirmed", {
                    email: email,
                  });
                  resolve(profile);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public requestRecover(
    email: string,
    application: ApplicationDocument,
    project: string
  ): Promise<AccountDocument> {
    return new Promise<AccountDocument>((resolve, reject) => {
      /* Check if the recover is enabled */
      const recoverType = Objects.get(
        application,
        "settings.recover",
        PROJECT_RECOVER_TYPE.RT_LINK
      );
      if (recoverType === PROJECT_RECOVER_TYPE.RT_DISABLED) {
        reject({ boError: ERRORS.RECOVER_NOT_ALLOWED });
        return;
      }

      /* Look for the user by email */
      AccountModel.findOne({
        email: email,
        status: { $gt: ACCOUNT_STATUS.AS_ENABLED },
      })
        .then((value: AccountDocument) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Prepare the reset token */
          const reset = {
            "recoverToken.token":
              recoverType === PROJECT_RECOVER_TYPE.RT_CODE
                ? Token.shortToken
                : Token.longToken,
            "recoverToken.status": RECOVER_TOKEN_STATUS.RTS_TO_RECOVER,
            "recoverToken.attempts": 1,
            "recoverToken.expires":
              Date.now() + PROJECT_LIFETIME_TYPES.LT_24HOURS * 1000,
          };

          const update: any = {
            $set: reset,
          };
          /* Register the reset token */
          AccountModel.findOneAndUpdate({ _id: value.id }, update, {
            new: true,
          })
            .then((value: AccountDocument) => {
              AccountProjectProfileModel.findOne({ project: project, account: value.id })
                .populate("account")
                .populate("project")
                .then((profile: AccountProjectProfileDocument) => {
                  /* Show the verification token */
                  this._logger.debug("Recovery account requested", {
                    id: value.id,
                    email: value.email,
                    token: value.recoverToken.token,
                  });
                  resolve(profile);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public checkRecover(email: string, token: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      AccountModel.findOneAndUpdate(
        {
          email: email,
          "recoverToken.token": token,
          "recoverToken.status": RECOVER_TOKEN_STATUS.RTS_TO_RECOVER,
          "recoverToken.expires": { $gt: Date.now() + 3600000 },
          "recoverToken.attempts": { $lt: 3 },
        },
        { $set: { "recoverToken.status": RECOVER_TOKEN_STATUS.RTS_CONFIRMED } },
        { new: true }
      )
        .then((value: AccountDocument) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.INVALID_CREDENTIALS,
            });
            return;
          }
          this._logger.debug("Recover token confirmed", {
            email: email,
            token: token,
          });
          resolve();
        })
        .catch(reject);
    });
  }

  public doRecover(
    email: string,
    token: string,
    password: string,
    project: string
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      const update: any = { $inc: { "recoverToken.attempts": 1 } };
      AccountModel.findOneAndUpdate({ email: email }, update, { new: true })
        .then((value: AccountDocument) => {
          if (!value) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Validate the user status */
          switch (value.status) {
            case ACCOUNT_STATUS.AS_CANCELLED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_CANCELLED,
              });
              return;
            case ACCOUNT_STATUS.AS_DISABLED_BY_ADMIN:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_DISABLED,
              });
              return;
            case ACCOUNT_STATUS.AS_TEMPORALLY_BLOCKED:
              reject({
                boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                boError: ERRORS.ACCOUNT_BLOCKED,
              });
              return;
          }

          /* Validate max attempts */
          if (value.recoverToken.attempts > 3) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.MAX_ATTEMPTS,
            });
            return;
          }

          /* Validate expiration time */
          if (value.recoverToken.expires < Date.now()) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.TOKEN_EXPIRED,
            });
            return;
          }

          AccountModel.findOneAndUpdate(
            {
              _id: value.id,
              "recoverToken.token": token,
              "recoverToken.status": RECOVER_TOKEN_STATUS.RTS_CONFIRMED,
            },
            {
              $set: {
                "recoverToken.expires": 0,
                "recoverToken.status": RECOVER_TOKEN_STATUS.RTS_DISABLED,
                password: password,
              },
            },
            { new: true }
          )
            .then((value: AccountDocument) => {
              if (!value) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                  boError: ERRORS.INVALID_TOKEN,
                });
                return;
              }

              /* Check if the user is not confirmed */
              if (value.status !== ACCOUNT_STATUS.AS_CONFIRMED) {
                /* Mark the user as email confirmed */
                AccountModel.findOneAndUpdate(
                  { _id: value.id },
                  { $set: { status: ACCOUNT_STATUS.AS_CONFIRMED } },
                  { new: false }
                )
                  .then((value: AccountDocument) => {
                    /* Look for the user project profile */
                    AccountProjectProfileModel.findOne({ project: project, account: value.id })
                      .populate("account")
                      .populate("project")
                      .then((profile: AccountProjectProfileDocument) => {
                        this._logger.debug("User account confirmed", {
                          id: value.id,
                          email: value.email,
                        });
                        resolve(profile);
                      })
                      .catch(reject);
                  })
                  .catch(reject);
                return;
              }

              /* Look for the user project profile */
              AccountProjectProfileModel.findOne({ project: project, account: value.id })
                .populate("account")
                .populate("project")
                .then((profile: AccountProjectProfileDocument) => {
                  this._logger.debug("User account recovered", {
                    id: value.id,
                    email: value.email,
                  });
                  resolve(profile);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public requestConfirmation(
    email: string,
    application: ApplicationDocument
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      /* Check if the recover is enabled */
      const recoverType = Objects.get(
        application,
        "project.settings.recover",
        PROJECT_RECOVER_TYPE.RT_DISABLED
      );
      if (recoverType === PROJECT_RECOVER_TYPE.RT_DISABLED) {
        reject({ boError: ERRORS.RECOVER_NOT_ALLOWED });
        return;
      }

      const project = Objects.get(application, "project._id");

      /* Look for the user by email, user was previously authenticated */
      AccountModel.findOne({
        email: email,
      })
        .then((value: AccountDocument) => {
          if (!value) {
            /* User always exists, this error should never occurr */
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Check if the user has confirmed the account previously */
          if (
            value.status !== ACCOUNT_STATUS.AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH
          ) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.ACCOUNT_ALREADY_CONFIRMED,
            });
            return;
          }

          /* Prepare the recover token for the account confirmation */
          const recoverToken = {
            token:
              recoverType !== PROJECT_RECOVER_TYPE.RT_LINK
                ? Token.shortToken
                : Token.longToken,
            attempts: 0,
            status: RECOVER_TOKEN_STATUS.RTS_TO_CONFIRM,
            expires: Date.now() + PROJECT_LIFETIME_TYPES.LT_24HOURS * 1000,
          };

          /* Register the reset token */
          AccountModel.findOneAndUpdate(
            { _id: value.id },
            {
              $set: { recoverToken: recoverToken },
            },
            { new: true }
          )
            .then((value: AccountDocument) => {
              AccountProjectProfileModel.findOne({ project: project, account: value._id })
                .populate("account")
                .populate("project")
                .then((profile: AccountProjectProfileDocument) => {
                  if (!profile) {
                    reject({ boError: ERRORS.PROFILE_NOT_FOUND });
                    return;
                  }
                  /* Show the verification token */
                  this._logger.debug("Account confirmation requested", {
                    id: value.id,
                    email: value.email,
                    token: value.recoverToken.token,
                  });
                  resolve(profile);
                })
                .catch(reject);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  public getProfile(
    account: string,
    project: string | ProjectDocument
  ): Promise<AccountProjectProfileDocument> {
    return new Promise<AccountProjectProfileDocument>((resolve, reject) => {
      /* Check if the user is currently registered into the application */
      const id = typeof project === "string" ? project : project.id;
      AccountProjectProfileModel.findOne({ project: id, account: account })
        .then((value: AccountProjectProfileDocument) => {
          if (!value) {
            reject({ boError: ERRORS.PROFILE_NOT_FOUND });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }
}

export const AccountCtrl = Accounts.shared;
