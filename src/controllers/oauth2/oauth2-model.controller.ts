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
import { Logger, Arrays, HTTP_STATUS, Tokens, Objects } from "@ikoabo/core";
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
  User
} from "oauth2-server";
import { AccountAccessPolicy } from "@/controllers/account/access-policy.controller";
import { AccountCtrl } from "@/controllers/account/account.controller";
import { AccountDocument, AccountModel } from "@/models/account/account.model";
import { ApplicationCtrl } from "@/controllers/application/application.controller";
import { APPLICATION_TYPE } from "@/constants/application.enum";
import { ApplicationDocument } from "@/models/application/application.model";
import { OAuth2CodeDocument, OAuth2CodeModel } from "@/models/oauth2/oauth2-code.model";
import { OAuth2TokenModel, OAuth2TokenDocument } from "@/models/oauth2/oauth2-token.model";
import { OAUTH2_TOKEN_TYPE, DEFAULT_SCOPES } from "@/constants/oauth2.enum";
import { LIFETIME_TYPE } from "@/constants/project.enum";
import { AccountEmailDocument, AccountEmailModel } from "@/models/account/email.model";

function prepareScope(scope?: string | string[]): string[] {
  /* Check for valid value */
  if (!scope) {
    return [];
  }

  /* Check if value is an array */
  if (Array.isArray(scope)) {
    return scope;
  }

  /* Split the string by space */
  return scope.split(" ");
}

class OAuth2Model
  implements PasswordModel, ClientCredentialsModel, AuthorizationCodeModel, RefreshTokenModel
{
  private static _instance: OAuth2Model;
  private _logger: Logger;
  private constructor() {
    this._logger = new Logger("OAuth2");
    this._logger.debug("Initializing OAuth2 data model");
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): OAuth2Model {
    if (!OAuth2Model._instance) {
      OAuth2Model._instance = new OAuth2Model();
    }
    return OAuth2Model._instance;
  }

  /**
   * Match the valid scope from an user into a client and a list of scope
   *
   * @param {OAuth2Server.Client} client
   * @param {OAuth2Server.User} user
   * @param {string | string[]} scope
   * @returns {string[]}
   */
  private static matchScope(application: Client, user: User, scope: string[]): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      if (user && user.id !== application.id) {
        /* Search for user project profile scope */
        AccountCtrl.fetch({ _id: user.id })
          .then((value: AccountDocument) => {
            if (!scope || scope.length === 0) {
              scope = value.scope;
            }
            resolve(Arrays.intersect(application.scope, scope, value.scope || []));
          })
          .catch(reject);
        return;
      }
      if (!scope || scope.length === 0) {
        scope = application.scope;
      }
      resolve(Arrays.intersect(application.scope, scope));
      return;
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
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.INVALID_AUTHORIZATION_CODE
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
      this._logger.debug(`Revoking authorization code ${code.authorizationCode}`);
      OAuth2CodeModel.findOneAndRemove({
        code: code.authorizationCode,
        application: code.client.id,
        expiresAt: code.expiresAt
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
      const code: string = Tokens.long;
      this._logger.debug(`Generated authorization code ${code} for client ${application.clientId}`);
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
      this._logger.debug(`Storing authorization code ${code.authorizationCode}`);

      /* Get all valid scope from the match */
      const scopes: string[] = prepareScope(code.scope);
      OAuth2Model.matchScope(application, user, scopes)
        .then((validScope: string[]) => {
          /* Save the authorization code into database */
          OAuth2CodeModel.create({
            code: code.authorizationCode,
            expiresAt: code.expiresAt,
            redirectUri: code.redirectUri,
            scope: validScope,
            application: <any>application.id,
            user: "id" in user && user.id !== application.id ? user.id : null
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
        application: application.id
      });
      const userObj = {
        id: application.id,
        clientId: application.clientId,
        scope: application.scope
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
  generateAccessToken(application: Client, user: User, _scope: string | string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      /* Generate access token */
      this._logger.debug("Generating access token for application/module", {
        application: application.id,
        user: user.id
      });
      const accessToken = Tokens.long;

      // TODO XXX Check for scope scope
      /* Check if the user is registered into the application */
      if (application.id !== user.id) {
        return AccountCtrl.fetchByEmail(user["username"], Objects.get(application, "project.id"))
          .then((userEmail: AccountEmailDocument) => {
            /* Check user signin policy */
            AccountAccessPolicy.canSignin(
              userEmail.account as AccountDocument,
              Objects.get(application, "project"),
              userEmail,
              user["isSocial"]
            )
              .then(() => {
                /* Generate access token */
                resolve(accessToken);
              })
              .catch(reject);
          })
          .catch(reject);
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
      const authCredential = username.split(" ");
      /* Look for the target user */
      AccountCtrl.fetchByEmail(authCredential[1], authCredential[0])
        .then((user: AccountEmailDocument) => {
          if (!user || !user.account) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_FOUND,
              boError: AUTH_ERRORS.ACCOUNT_NOT_REGISTERED
            });
            return;
          }
          AccountCtrl.fetch({ _id: Objects.get(user, "account._id", user.account) })
            .then((account: AccountDocument) => {
              account
                .validPassword(password)
                .then(() => {
                  const tmpUser: any = account;
                  /* Set the used username */
                  tmpUser["username"] = authCredential[1];
                  resolve(tmpUser);
                })
                .catch(reject);
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
      const scopes: string[] = prepareScope(scope);
      OAuth2Model.matchScope(application, user, scopes)
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
   * Retrieve a client using a client id or a client id/client secret combination
   *
   * @param {string} clientId  Client MongoDB ObjectID
   * @param {string} clientSecret  Client secret
   * @returns {Promise<OAuth2Server.Client>}
   */
  getClient(clientId: string, clientSecret: string): Promise<Client> {
    return new Promise<Client>((resolve, reject) => {
      this._logger.debug(`Retrieve client [clientId: ${clientId}, clientSecret: ${clientSecret}]`);

      /* Prepare the client query */
      const clientQuery: any = { _id: clientId };
      if (clientSecret) {
        clientQuery.secret = clientSecret;
      }

      /* Search for the client into database */
      ApplicationCtrl.fetch(clientQuery, {}, ["project"])
        .then((application: ApplicationDocument) => {
          resolve(application.toClient());
        })
        .catch(reject);
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
      this._logger.debug(`Storing access token for client ${application.id} and user ${user.id}`);

      /* Check if client token don't expire and there is no user involved */
      if (
        application.accessTokenLifetime === LIFETIME_TYPE.INFINITE &&
        user.id !== application.id
      ) {
        reject({
          boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
          boError: AUTH_ERRORS.NOT_ALLOWED_SIGNIN
        });
        return;
      }

      /* Check the token generated type */
      let tokenType = OAUTH2_TOKEN_TYPE.USER;
      switch (application.type) {
        case APPLICATION_TYPE.MODULE: /* Force module token */
        case APPLICATION_TYPE.SERVICE /* Force application token */:
          tokenType = OAUTH2_TOKEN_TYPE.APPLICATION;
          break;

        case APPLICATION_TYPE.ANDROID: /* Check application or user token */
        case APPLICATION_TYPE.IOS:
        case APPLICATION_TYPE.WEB_CLIENT_SIDE:
        case APPLICATION_TYPE.WEB_SERVER_SIDE:
          tokenType =
            "id" in user && user.id !== application.id
              ? token.type && token.type > OAUTH2_TOKEN_TYPE.USER
                ? token.type
                : OAUTH2_TOKEN_TYPE.USER
              : OAUTH2_TOKEN_TYPE.APPLICATION;
          break;

        default:
          /* Invalid application value */
          return reject({
            boError: AUTH_ERRORS.INVALID_APPLICATION,
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
          });
      }

      /* Get all valid scope from the match */
      const scopes: string[] = prepareScope(token.scope).filter((value: string) => {
        return !DEFAULT_SCOPES.includes(value);
      });
      OAuth2Model.matchScope(application, user, scopes)
        .then((validScope: string[]) => {
          /* Save the authorization code into database */
          OAuth2TokenModel.create({
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            scope: validScope,
            application: <any>application.id,
            keep: application.accessTokenLifetime === LIFETIME_TYPE.INFINITE,
            type: tokenType,
            user: user.id !== application.id ? user.id : null,
            username: user.id !== application.id ? user["username"] : null
          })
            .then((accessToken: OAuth2TokenDocument) => {
              accessToken.application = <any>application;
              accessToken.user = <any>user;

              /* Check if client token never expires */
              if (accessToken.keep) {
                accessToken.accessTokenExpiresAt = new Date(Date.now() + LIFETIME_TYPE.YEAR);
              }
              accessToken.application = <any>application;
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
        accessToken: accessToken
      })
        .populate("user")
        .then((token: OAuth2TokenDocument) => {
          if (!token) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED,
              boError: AUTH_ERRORS.INVALID_TOKEN
            });
            return;
          }

          /* Get the target application */
          ApplicationCtrl.fetch(token.application.toString(), {}, ["project"])
            .then((application: ApplicationDocument) => {
              token.application = application;

              /* Check if client token don't expire and there is no user involved */
              if (
                token.keep &&
                token.user &&
                Objects.get(token, "user.id", "no-user-id") !== Objects.get(token, "application.id")
              ) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
                  boError: AUTH_ERRORS.NOT_ALLOWED_SIGNIN
                });
                return;
              }

              /* Check if client token never expires */
              if (token.keep) {
                token.accessTokenExpiresAt = new Date(Date.now() + LIFETIME_TYPE.YEAR);
              }

              /* Check if the token is expired */
              if (token.accessTokenExpiresAt.getTime() < Date.now()) {
                reject({
                  boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED,
                  boError: AUTH_ERRORS.TOKEN_EXPIRED
                });
                return;
              }

              /* Check if the user is registered into the application */
              if (token.user) {
                return AccountCtrl.fetchByEmail(
                  token.username,
                  Objects.get(token, "application.project.id")
                )
                  .then((userEmail: AccountEmailDocument) => {
                    /* Check user signin policy */
                    AccountAccessPolicy.canSignin(
                      userEmail.account as AccountDocument,
                      Objects.get(token, "application.project"),
                      userEmail,
                      token.type === OAUTH2_TOKEN_TYPE.EXTERNAL_AUTH
                    )
                      .then(() => {
                        resolve(token.toToken());
                      })
                      .catch(reject);
                  })
                  .catch(reject);
              }
              resolve(token.toToken());
            })
            .catch(reject);
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
      scope = prepareScope(scope);
      token.scope = prepareScope(token.scope);
      const validScope = scope.every((tmpScope) => token.scope.indexOf(tmpScope) >= 0);
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
  generateRefreshToken(client: Client, user: User, _scope: string | string[]): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO XXX Check scope
      /* Generate refresh token */
      this._logger.debug(`Generating refresh token for client ${client.id} and user ${user.id}`);
      const refreshToken = Tokens.long;
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
          user: token.user.id
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
            user: token.user.id
          },
          {
            refreshToken: null,
            refreshTokenExpiresAt: null
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
        refreshToken: refreshToken
      })
        .populate({ path: "application", populate: { path: "project" } })
        .populate("user")
        .then((token: OAuth2TokenDocument) => {
          if (!token) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN,
              boError: AUTH_ERRORS.INVALID_TOKEN
            });
            return;
          }

          /* Check if the token is expired */
          if (token.accessTokenExpiresAt.getTime() < Date.now()) {
            reject({
              boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED,
              boError: AUTH_ERRORS.TOKEN_EXPIRED
            });
            return;
          }

          resolve(token.toRefreshToken());
        })
        .catch(reject);
    });
  }
}

export const OAuth2ModelCtrl = OAuth2Model.shared;
