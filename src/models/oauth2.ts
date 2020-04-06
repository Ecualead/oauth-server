/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:53:18-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: oauth2.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-06T00:08:22-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import {
  AuthorizationCode, AuthorizationCodeModel, Client, ClientCredentialsModel, Falsey, PasswordModel,
  RefreshToken, RefreshTokenModel, Token, User
} from 'oauth2-server';
import { Logger, Objects, Arrays, Token as TokenUtility, HTTP_STATUS } from '@ikoabo/core_srv';
import { DEFAULT_SCOPES } from './types/scope';
import { ERRORS } from './types/errors';
import { UserAccount } from '../policy/UserAccount';
import { MCode, DCode } from './schemas/oauth/code';
import { MToken, DToken } from './schemas/oauth/token';
import { MAccount, DAccount } from './schemas/accounts/account';
import { MApplication, DApplication } from './schemas/applications/application';
import { DProject } from './schemas/projects/project';
import { Accounts } from '../controllers/Accounts';

const AccountCtrl = Accounts.shared;

export class OAuth2 implements PasswordModel, ClientCredentialsModel, AuthorizationCodeModel, RefreshTokenModel {
  private _logger: Logger;
  constructor() {
    this._logger = new Logger('OAuth2');
    this._logger.debug('Initializing OAuth2 data model');
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
        AccountCtrl.getProfile(user.id, application.project)
          .then((value) => {
            resolve(Arrays.intersect(application.scope, scope, value.scope || []));
          }).catch(reject);
        return;
      } else {
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
      MCode.findOne({ code: code })
        .populate('client')
        .populate('user')
        .exec()
        .then((value: DCode) => {
          if (!value || !value.application) {
            reject({
              code: HTTP_STATUS.HTTP_FORBIDDEN,
              error: ERRORS.INVALID_AUTHORIZATION_CODE,
            });
            return;
          }
          resolve(value.toAuthCode());
        }).catch(reject);
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
      MCode.findOneAndRemove({
        code: code.authorizationCode,
        application: code.client.id,
        expiresAt: code.expiresAt
      }).then((value: DCode) => {
        resolve(value !== null);
      }).catch(reject);
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
  generateAuthorizationCode?(application: Client, _user: User, _scope: string | string[]): Promise<string> {
    return new Promise<string>((resolve) => {
      /* TODO XXX Check if user/application can generate authorization code */
      /* Generate the authorization code */
      let code: string = TokenUtility.longToken;
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
  saveAuthorizationCode(code: AuthorizationCode, application: Client, user: User): Promise<AuthorizationCode> {
    return new Promise<AuthorizationCode>((resolve, reject) => {
      this._logger.debug(`Storing authorization code ${code.authorizationCode}`);

      /* Get all valid scope from the match */
      OAuth2.matchScope(application, user, Arrays.force(code.scope))
        .then((validScope: string[]) => {
          /* Save the authorization code into database */
          MCode.create({
            code: code.authorizationCode,
            expiresAt: code.expiresAt,
            redirectUri: code.redirectUri,
            scope: validScope,
            application: application.id,
            user: ('id' in user && user.id !== application.id) ? user.id : null
          })
            .then((value: DCode) => {
              value.application = application;
              resolve(value.toAuthCode());
            }).catch(reject);
        }).catch(reject);
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
    return new Promise<User | Falsey>(resolve => {
      this._logger.debug(`Getting associated user to client ${application.id}`);
      const userObj = {
        id: application.id,
        clientId: application.clientId,
        grants: application.grants,
        accessTokenLifetime: application.accessTokenLifetime,
        refreshTokenLifetime: application.refreshTokenLifetime,
        scope: application.scope,
        description: application.description
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
  generateAccessToken(application: Client, user: User, scope: string | string[]): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // TODO XXX Check for scope scope
      /* Check if the user is registered into the application */
      if (application.id !== user.id) {
        /* Check user signin policy */
        UserAccount.canSignin(<DAccount>user, application.app, true)
          .then(() => {
            /* Generate access token */
            this._logger.debug(`Generating access token for client ${application.id} and user ${user.id}`);
            let accessToken = TokenUtility.longToken;
            resolve(accessToken);
          }).catch(reject);
        return;
      }

      /* Generate access token */
      this._logger.debug(`Generating access token for client ${application.id} and user ${user.id}`);
      let accessToken = TokenUtility.longToken;
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
      MAccount.findOne({ 'email': username })
        .then((user: DAccount) => {
          if (!user) {
            reject({
              code: HTTP_STATUS.HTTP_NOT_FOUND,
              error: ERRORS.ACCOUNT_NOT_REGISTERED,
            });
            return;
          }

          /* Validate the user password */
          user.validPassword(password, (err: any, match: boolean) => {
            if (err) {
              reject(err);
              return;
            }

            if (!match) {
              reject({
                code: HTTP_STATUS.HTTP_UNAUTHORIZED,
                error: ERRORS.INVALID_CREDENTIALS,
              });
              return;
            }
            resolve(user);
          });
        }).catch(reject);
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
  validateScope(user: User, application: Client, scope: string | string[]): Promise<string | string[] | Falsey> {
    return new Promise<string | string[] | Falsey>((resolve, reject) => {
      /* Get all valid scope from the match */
      OAuth2.matchScope(application, user, Arrays.force(scope))
        .then((validScope: string[]) => {
          /* Ensure virtual scope are present */
          validScope.push(application.id === user.id ? 'application' : 'user');
          validScope.push('default');
          const strScope = validScope.join(' ');
          resolve(strScope);
        }).catch(reject);
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
      let clientQuery: any = { _id: clientId };
      if (clientSecret) {
        clientQuery.secret = clientSecret;
      }

      /* Search for the client into database */
      MApplication.findOne(clientQuery)
        .populate('project')
        .then((value: DApplication) => {
          resolve(value.toClient());
        }).catch(reject);
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
      if (application.accessTokenLifetime === -1 && user.id !== application.id) {
        reject({
          code: HTTP_STATUS.HTTP_FORBIDDEN,
          error: ERRORS.NOT_ALLOWED_SIGNIN,
        });
        return;
      }

      /* Get all valid scope from the match */
      OAuth2.matchScope(application, user, Arrays.force(token.scope))
        .then((validScope: string[]) => {
          /* Save the authorization code into database */
          MToken.create({
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            scope: validScope,
            application: application.id,
            keep: application.accessTokenLifetime === -1,
            user: ('id' in user && user.id !== application.id) ? user.id : null
          }).then((accessToken: DToken) => {
            accessToken.application = application;
            accessToken.user = user;

            /* Check if client token never expires */
            if (application.accessTokenLifetime === -1) {
              accessToken.accessTokenExpiresAt = new Date(Date.now() + 100000000);
            }
            resolve(accessToken.toToken());
          }).catch(reject);
        }).catch(reject);
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
      MToken.findOne({
        accessToken: accessToken
      })
        .populate({ path: 'application', populate: { path: 'project' } })
        .populate('user')
        .then((token: DToken) => {
          if (!token) {
            reject({
              code: HTTP_STATUS.HTTP_UNAUTHORIZED,
              error: ERRORS.INVALID_TOKEN,
            });
            return;
          }

          /* Check if client token don't expire and there is no user involved */
          const accesTokenLifetime: number = Objects.get(token.application, 'settings.lifetime.accessToken', 0);
          if (accesTokenLifetime === -1 && token.user && (<DAccount>token.user).id !== (<DApplication>token.application).id) {
            reject({
              code: HTTP_STATUS.HTTP_FORBIDDEN,
              error: ERRORS.NOT_ALLOWED_SIGNIN,
            });
            return;
          }

          /* Check if client token never expires */
          if (accesTokenLifetime === -1) {
            token.accessTokenExpiresAt = new Date(Date.now() + 100000000);
          }

          /* Check if the token is expired */
          if (token.accessTokenExpiresAt.getTime() < Date.now()) {
            reject({
              code: HTTP_STATUS.HTTP_UNAUTHORIZED,
              error: ERRORS.TOKEN_EXPIRED
            });
            return;
          }

          /* Check if the user is registered into the application */
          if (token.user) {
            /* Check user signin policy */
            UserAccount.canSignin(<DAccount>token.user, <DProject>(<DApplication>token.application).project, true)
              .then(() => {
                resolve(token.toToken());
              }).catch(reject);
            return;
          }

          resolve(token.toToken());
        }).catch(reject);
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

      let validScope = scope.every(tmpScope => token.scope.indexOf(tmpScope) >= 0);

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
  generateRefreshToken(client: Client, user: User, scope: string | string[]): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO XXX Check scope
      /* Generate refresh token */
      this._logger.debug(`Generating refresh token for client ${client.id} and user ${user.id}`);
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
        MToken.findOneAndRemove({
          accessToken: token.accessToken,
          application: token.client.id,
          user: token.user.id
        }).then((token) => {
          resolve(token !== null);
          return;
        }).catch(reject);
      } else {
        token = token as RefreshToken;
        this._logger.debug(`Revoking refresh token ${token.refreshToken}`);
        MToken.findOneAndUpdate({
          refreshToken: token.refreshToken,
          application: token.client.id,
          user: token.user.id
        }, {
            refreshToken: null,
            refreshTokenExpiresAt: null
          }).then((token) => {
            resolve(token !== null);
            return;
          }).catch(reject);
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
      MToken.findOne({
        refreshToken: refreshToken
      })
        .populate('client')
        .populate('user')
        .then((token: DToken) => {
          if (!token) {
            reject({
              code: HTTP_STATUS.HTTP_FORBIDDEN,
              error: ERRORS.INVALID_TOKEN,
            });
            return;
          }

          /* Check if the token is expired */
          if (token.accessTokenExpiresAt.getTime() < Date.now()) {
            reject({
              code: HTTP_STATUS.HTTP_UNAUTHORIZED,
              error: ERRORS.TOKEN_EXPIRED,
            });
            return;
          }

          resolve(token.toRefreshToken());
        }).catch(reject);
    });
  }
}
