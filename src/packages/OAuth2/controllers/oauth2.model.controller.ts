/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import {
  AuthorizationCode,
  AuthorizationCodeModel,
  Client,
  ClientCredentialsModel,
  Falsey,
  PasswordModel,
  RefreshToken,
  RefreshTokenModel,
  Token,
  User,
} from "oauth2-server";
import {
  Logger,
  Arrays,
  Token as TokenUtility,
  HTTP_STATUS,
} from "@ikoabo/core_srv";
import { ERRORS } from "@ikoabo/auth_srv";
import { AccountCtrl } from "@/Accounts/controllers/accounts.controller";
import {
  OAuth2CodeDocument,
  OAuth2CodeModel,
} from "../models/oauth2.code.model";
import {
  AccountDocument,
  AccountModel,
} from "@/Accounts/models/accounts.model";
import { AccountAccessPolicy } from "@/Accounts/controllers/account.access.policy.controller";
import {
  ApplicationModel,
  ApplicationDocument,
} from "@/Applications/models/applications.model";
import {
  OAuth2TokenModel,
  OAuth2TokenDocument,
} from "@/OAuth2/models/oauth2.token.model";
import { ProjectDocument } from "@/Projects/models/projects.model";
import { ModuleModel, ModuleDocument } from "@/Modules/models/modules.model";
import { PROJECT_LIFETIME_TYPES } from "@/Projects/models/projects.enum";
import { OAUTH2_TOKEN_TYPE } from "@/OAuth2/models/oauth2.enum";
import { ModuleCtrl } from "@/packages/Modules/controllers/modules.controller";
import { ApplicationCtrl } from "@/packages/Applications/controllers/applications.controller";
import { APPLICATION_TYPES } from "@/packages/Applications/models/applications.enum";

export class OAuth2Model
  implements
    PasswordModel,
    ClientCredentialsModel,
    AuthorizationCodeModel,
    RefreshTokenModel {
  private _logger: Logger;
  constructor() {
    this._logger = new Logger("OAuth2");
    this._logger.debug("Initializing OAuth2 data model");
  }

  /**
   * Match the valid scope from an user into a client and a list of scope
   *
   * @param {OAuth2Server.Client} client
   * @param {OAuth2Server.User} user
   * @param {string | string[]} scope
   * @returns {string[]}
   */
  private static matchScope(
    application: Client,
    user: User,
    scope: string[]
  ): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      if (user && user.id !== application.id) {
        /* Search for user project profile scope */
        AccountCtrl.getProfile(user.id, application.project)
          .then((value) => {
            if (!scope || scope.length === 0) {
              scope = value.scope;
            }
            resolve(
              Arrays.intersect(application.scope, scope, value.scope || [])
            );
          })
          .catch(reject);
        return;
      } else {
        if (!scope || scope.length === 0) {
          scope = application.scope;
        }
        resolve(Arrays.intersect(application.scope, scope));
        return;
      }
    });
  }

  /**
   * Search for an authorization code into the database
   *
   * @param {string} code  Authorization code
   * @returns {Promise<AuthorizationCode>}  Return the authorization code object
   */
  getAuthorizationCode(code: string): Promise<AuthorizationCode> {
    return new Promise<AuthorizationCode>((resolve, reject) => {
      this._logger.debug(`Looking for authorization code ${code}`);
      OAuth2CodeModel.findOne({ code: code })
        .populate("application")
        .populate("user")
        .exec()
        .then((value: OAuth2CodeDocument) => {
          if (!value || !value.application) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.INVALID_AUTHORIZATION_CODE,
            });
            return;
          }
          resolve(value.toAuthCode());
        })
        .catch(reject);
    });
  }

  /**
   * Revoke an authorization code removing it from database
   *
   * @param {AuthorizationCode} code  Authorization code to revoke
   * @returns {Promise<boolean>}
   */
  revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this._logger.debug(
        `Revoking authorization code ${code.authorizationCode}`
      );
      OAuth2CodeModel.findOneAndRemove({
        code: code.authorizationCode,
        application: code.client.id,
        expiresAt: code.expiresAt,
      })
        .then((value: OAuth2CodeDocument) => {
          resolve(value !== null);
        })
        .catch(reject);
    });
  }

  /**
   * Generate authorization code for an application or user
   *
   * @param {OAuth2Server.Client} client
   * @param {OAuth2Server.User} user
   * @param {string | string[]} scope
   * @returns {Promise<string>}
   */
  generateAuthorizationCode?(
    application: Client,
    _user: User,
    _scope: string | string[]
  ): Promise<string> {
    return new Promise<string>((resolve) => {
      /* TODO XXX Check if user/application can generate authorization code */
      /* Generate the authorization code */
      let code: string = TokenUtility.longToken;
      this._logger.debug(
        `Generated authorization code ${code} for client ${application.clientId}`
      );
      resolve(code);
    });
  }

  /**
   * Store the authorization code into database
   *
   * @param {AuthorizationCode} code  Generated authorization code
   * @param {Client} client  Client for which was code generated
   * @param {User} user  User for which was code generated
   * @returns {AuthorizationCode>}
   */
  saveAuthorizationCode(
    code: AuthorizationCode,
    application: Client,
    user: User
  ): Promise<AuthorizationCode> {
    return new Promise<AuthorizationCode>((resolve, reject) => {
      this._logger.debug(
        `Storing authorization code ${code.authorizationCode}`
      );

      /* Get all valid scope from the match */
      OAuth2Model.matchScope(application, user, Arrays.force(code.scope))
        .then((validScope: string[]) => {
          /* Save the authorization code into database */
          OAuth2CodeModel.create({
            code: code.authorizationCode,
            expiresAt: code.expiresAt,
            redirectUri: code.redirectUri,
            scope: validScope,
            application: <any>application.id,
            user: "id" in user && user.id !== application.id ? user.id : null,
          })
            .then((value: OAuth2CodeDocument) => {
              value.application = <any>application;
              resolve(value.toAuthCode());
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Retrieve the client associated user
   * Always return a Falsey value
   *
   * @param {OAuth2Server.Client} client
   * @returns {Promise<OAuth2Server.User | OAuth2Server.Falsey>}
   */
  getUserFromClient(application: Client): Promise<User | Falsey> {
    return new Promise<User | Falsey>((resolve) => {
      this._logger.debug("Getting associated user from client", {
        application: application.id,
      });
      const userObj = {
        id: application.id,
        clientId: application.clientId,
        scope: application.scope,
      };
      resolve(userObj);
    });
  }

  /**
   * Generate an access token for the given user and client
   *
   * @param {OAuth2Server.Client} client  Target client
   * @param {OAuth2Server.User} user  Target user
   * @param {string | string[]} scope  scope allowed to the token
   * @returns {Promise<string>}  Return the access token
   */
  generateAccessToken(
    application: Client,
    user: User,
    scope: string | string[]
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      /* Generate access token */
      this._logger.debug("Generating access token for application/module", {
        application: application.id,
        user: user.id,
      });
      const accessToken = TokenUtility.longToken;

      // TODO XXX Check for scope scope
      /* Check if the user is registered into the application */
      if (application.id !== user.id) {
        /* Check user signin policy */
        AccountAccessPolicy.canSignin(
          <AccountDocument>user,
          <ProjectDocument>(<ApplicationDocument>application).project,
          user["username"],
          true
        )
          .then(() => {
            /* Generate access token */
            resolve(accessToken);
          })
          .catch(reject);
        return;
      }

      resolve(accessToken);
    });
  }

  /**
   * Locate the basic user account information using username and password
   *
   * @param {string} username  Target username to find
   * @param {string} password  Target user password to validate
   * @returns {Promise<OAuth2Server.User>}  Return the basic user account information
   */
  getUser(username: string, password: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      /* Look for the target user */
      AccountModel.findOne({ "emails.email": username })
        .then((user: AccountDocument) => {
          if (!user) {
            reject({
              boStatus: HTTP_STATUS.HTTP_NOT_FOUND,
              boError: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Validate the user password */
          user
            .validPassword(password)
            .then(() => {
              /* Set the used username */
              (<any>user)["username"] = username;
              resolve(user);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Validate scope for a given user and client
   * scope are validated against the match between scope allowed to the user into the client application and
   * the scope of the client.
   *
   * @param {OAuth2Server.User} user
   * @param {OAuth2Server.Client} client
   * @param {string | string[]} scope
   * @returns {Promise<string | string[] | OAuth2Server.Falsey>}
   */
  validateScope(
    user: User,
    application: Client,
    scope: string | string[]
  ): Promise<string | string[] | Falsey> {
    return new Promise<string | string[] | Falsey>((resolve, reject) => {
      /* Get all valid scope from the match */
      OAuth2Model.matchScope(application, user, Arrays.force(scope))
        .then((validScope: string[]) => {
          /* Ensure virtual scope are present */
          validScope.push(application.id === user.id ? "application" : "user");
          validScope.push("default");
          const strScope = validScope.join(" ");
          resolve(strScope);
        })
        .catch(reject);
    });
  }

  /**
   * Try to get client from modules schema
   *
   * @param {string} clientId  Client MongoDB ObjectID
   * @param {string} clientSecret  Client secret
   * @returns {Promise<OAuth2Server.Client>}
   */
  getClientModule(clientId: string, clientSecret: string): Promise<Client> {
    return new Promise<Client>((resolve, reject) => {
      this._logger.debug(
        `Retrieve client module [clientId: ${clientId}, clientSecret: ${clientSecret}]`
      );

      /* Prepare the client query */
      const clientQuery: any = {
        _id: clientId,
        secret: clientSecret,
      };

      /* Search for the client into database */
      ModuleModel.findOne(clientQuery)
        .then((value: ModuleDocument) => {
          if (!value) {
            reject({
              boError: ERRORS.INVALID_APPLICATION,
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
            });
            return;
          }
          resolve(value.toClient());
        })
        .catch(reject);
    });
  }

  /**
   * Retrieve a client using a client id or a client id/client secret combination
   *
   * @param {string} clientId  Client MongoDB ObjectID
   * @param {string} clientSecret  Client secret
   * @returns {Promise<OAuth2Server.Client>}
   */
  getClient(clientId: string, clientSecret: string): Promise<Client> {
    return new Promise<Client>((resolve, reject) => {
      this._logger.debug(
        `Retrieve client [clientId: ${clientId}, clientSecret: ${clientSecret}]`
      );

      /* Prepare the client query */
      let clientQuery: any = { _id: clientId };
      if (clientSecret) {
        clientQuery.secret = clientSecret;
      }

      /* Search for the client into database */
      ApplicationModel.findOne(clientQuery)
        .populate("project")
        .then((application: ApplicationDocument) => {
          if (!application) {
            /* If application was not found try to look for module */
            this.getClientModule(clientId, clientSecret)
              .then((module: Client) => {
                resolve(module);
              })
              .catch(reject);
            return;
          }
          resolve(application.toClient());
        })
        .catch(() => {
          this.getClientModule(clientId, clientSecret)
            .then((module: Client) => {
              resolve(module);
            })
            .catch(reject);
        });
    });
  }

  /**
   * Store the token into database
   *
   * @param {OAuth2Server.Token} token  Token generated
   * @param {OAuth2Server.Client} client  Target client for which token was generated
   * @param {OAuth2Server.User} user  Target user for which token was generated
   * @returns {Promise<OAuth2Server.Token>}  Return the generated token
   */
  saveToken(token: Token, application: Client, user: User): Promise<Token> {
    return new Promise<Token>((resolve, reject) => {
      this._logger.debug(
        `Storing access token for client ${application.id} and user ${user.id}`
      );

      /* Check if client token don't expire and there is no user involved */
      if (
        application.accessTokenLifetime ===
          PROJECT_LIFETIME_TYPES.LT_INFINITE &&
        user.id !== application.id
      ) {
        reject({
          boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
          boError: ERRORS.NOT_ALLOWED_SIGNIN,
        });
        return;
      }

      /* Check the token generated type */
      let tokenType = OAUTH2_TOKEN_TYPE.TT_USER;
      switch (application.type) {
        case APPLICATION_TYPES.APP_MODULE /* Force module token */:
          tokenType = OAUTH2_TOKEN_TYPE.TT_MODULE;
          break;

        case APPLICATION_TYPES.APP_SERVICE /* Force application token */:
          tokenType = OAUTH2_TOKEN_TYPE.TT_APPLICATION;
          break;

        case APPLICATION_TYPES.APP_ANDROID: /* Check application or user token */
        case APPLICATION_TYPES.APP_IOS:
        case APPLICATION_TYPES.APP_WEB_CLIENT_SIDE:
        case APPLICATION_TYPES.APP_WEB_SERVER_SIDE:
          tokenType =
            "id" in user && user.id !== application.id
              ? OAUTH2_TOKEN_TYPE.TT_USER
              : OAUTH2_TOKEN_TYPE.TT_APPLICATION;
          break;

        default:
          /* Invalid application value */
          return reject({
            boError: ERRORS.INVALID_APPLICATION,
            boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
          });
      }

      /* Get all valid scope from the match */
      OAuth2Model.matchScope(application, user, Arrays.force(token.scope))
        .then((validScope: string[]) => {
          /* Save the authorization code into database */
          OAuth2TokenModel.create({
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            scope: validScope,
            application: <any>application.id,
            keep:
              application.accessTokenLifetime ===
              PROJECT_LIFETIME_TYPES.LT_INFINITE,
            type: tokenType,
            user: user.id !== application.id ? user.id : null,
          })
            .then((accessToken: OAuth2TokenDocument) => {
              accessToken.application = <any>application;
              accessToken.user = <any>user;

              /* Check if client token never expires */
              if (accessToken.keep) {
                accessToken.accessTokenExpiresAt = new Date(
                  Date.now() + PROJECT_LIFETIME_TYPES.LT_ONE_YEAR
                );
              }
              resolve(accessToken.toToken());
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Retrieve an access token information
   *
   * @param {string} accessToken  Target access token
   * @returns {Promise<OAuth2Server.Token>}  Return the access token object
   */
  getAccessToken(accessToken: string): Promise<Token> {
    return new Promise<Token>((resolve, reject) => {
      this._logger.debug(`Looking for token ${accessToken}`);
      OAuth2TokenModel.findOne({
        accessToken: accessToken,
      })
        .populate("user")
        .then((token: OAuth2TokenDocument) => {
          if (!token) {
            reject({
              boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED,
              boError: ERRORS.INVALID_TOKEN,
            });
            return;
          }

          /* Check if the token belongs to a module */
          if (token.type === OAUTH2_TOKEN_TYPE.TT_MODULE) {
            /* Get the target module */
            ModuleCtrl.fetch(token.application.toString())
              .then((module: ModuleDocument) => {
                token.application = module.id;
                token.accessTokenExpiresAt = new Date(
                  Date.now() + PROJECT_LIFETIME_TYPES.LT_ONE_YEAR
                );
                resolve(token.toToken());
              })
              .catch(reject);
          } else {
            /* Get the target application */
            ApplicationCtrl.fetch(token.application.toString(), {}, {}, [
              "project",
            ])
              .then((application: ApplicationDocument) => {
                token.application = application;

                /* Check if client token don't expire and there is no user involved */
                if (
                  token.keep &&
                  token.user &&
                  (<AccountDocument>token.user).id !==
                    (<ApplicationDocument>token.application).id
                ) {
                  reject({
                    boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
                    boError: ERRORS.NOT_ALLOWED_SIGNIN,
                  });
                  return;
                }

                /* Check if client token never expires */
                if (token.keep) {
                  token.accessTokenExpiresAt = new Date(
                    Date.now() + PROJECT_LIFETIME_TYPES.LT_ONE_YEAR
                  );
                }

                /* Check if the token is expired */
                if (token.accessTokenExpiresAt.getTime() < Date.now()) {
                  reject({
                    boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED,
                    boError: ERRORS.TOKEN_EXPIRED,
                  });
                  return;
                }

                /* Check if the user is registered into the application */
                if (token.user) {
                  /* Check user signin policy */
                  AccountAccessPolicy.canSignin(
                    <AccountDocument>token.user,
                    <ProjectDocument>(
                      (<ApplicationDocument>token.application).project
                    ),
                    token.username,
                    true
                  )
                    .then(() => {
                      resolve(token.toToken());
                    })
                    .catch(reject);
                  return;
                }
                resolve(token.toToken());
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  }

  /**
   * Validate the user token scope
   *
   * @param {OAuth2Server.Token} token  Target access token
   * @param {string | string[]} scope  scope to validate
   * @returns {Promise<boolean>}  Return if the token meets the scope request
   */
  verifyScope(token: Token, scope: string | string[]): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      /* Force scope to be an array */
      scope = Arrays.force(scope);
      token.scope = Arrays.force(token.scope);

      let validScope = scope.every(
        (tmpScope) => token.scope.indexOf(tmpScope) >= 0
      );

      resolve(validScope);
    });
  }

  /**
   * Generate a refresh token for the given user into the given client
   *
   * @param {OAuth2Server.Client} client  Target client
   * @param {OAuth2Server.User} user  Target user
   * @param {string | string[]} scope  Target requested scope
   * @returns {Promise<string>}  Return the refresh token
   */
  generateRefreshToken(
    client: Client,
    user: User,
    scope: string | string[]
  ): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO XXX Check scope
      /* Generate refresh token */
      this._logger.debug(
        `Generating refresh token for client ${client.id} and user ${user.id}`
      );
      let refreshToken = TokenUtility.longToken;
      resolve(refreshToken);
    });
  }

  /**
   * Revoke an access token or refresh token removing it
   *
   * @param {OAuth2Server.RefreshToken | OAuth2Server.Token} token  Target access token or refresh token
   * @returns {Promise<boolean>}  Return if the token was removed or not
   */
  revokeToken(token: RefreshToken | Token): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (token.accessToken) {
        token = token as Token;
        this._logger.debug(`Revoking access token ${token.accessToken}`);
        OAuth2TokenModel.findOneAndRemove({
          accessToken: token.accessToken,
          application: token.client.id,
          user: token.user.id,
        })
          .then((token) => {
            resolve(token !== null);
            return;
          })
          .catch(reject);
      } else {
        token = token as RefreshToken;
        this._logger.debug(`Revoking refresh token ${token.refreshToken}`);
        OAuth2TokenModel.findOneAndUpdate(
          {
            refreshToken: token.refreshToken,
            application: token.client.id,
            user: token.user.id,
          },
          {
            refreshToken: null,
            refreshTokenExpiresAt: null,
          }
        )
          .then((token) => {
            resolve(token !== null);
            return;
          })
          .catch(reject);
      }
    });
  }

  /**
   * Retrieve a refresh token information
   *
   * @param {string} refreshToken  Target refresh token
   * @returns {Promise<OAuth2Server.RefreshToken>}  Return the refresh token object
   */
  getRefreshToken(refreshToken: string): Promise<RefreshToken> {
    return new Promise<RefreshToken>((resolve, reject) => {
      this._logger.debug(`Looking for token ${refreshToken}`);
      OAuth2TokenModel.findOne({
        refreshToken: refreshToken,
      })
        .populate({ path: "application", populate: { path: "project" } })
        .populate("user")
        .then((token: OAuth2TokenDocument) => {
          if (!token) {
            reject({
              boStatus: HTTP_STATUS.HTTP_FORBIDDEN,
              boError: ERRORS.INVALID_TOKEN,
            });
            return;
          }

          /* Check if the token is expired */
          if (token.accessTokenExpiresAt.getTime() < Date.now()) {
            reject({
              boStatus: HTTP_STATUS.HTTP_UNAUTHORIZED,
              boError: ERRORS.TOKEN_EXPIRED,
            });
            return;
          }

          resolve(token.toRefreshToken());
        })
        .catch(reject);
    });
  }
}
