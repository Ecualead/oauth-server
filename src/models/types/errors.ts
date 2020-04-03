/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-31T16:58:55-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: errors.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:10:39-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export interface IError {
  code?: number;
  error: number;
}

export enum ERRORS {
  INVALID_AUTHORIZATION_CODE = 701,
  INVALID_TOKEN,
  INVALID_REFRESH_TOKEN,
  INVALID_SCOPE,
  INVALID_DOMAIN,
  INVALID_PROJECT,
  INVALID_APPLICATION,
  TOKEN_EXPIRED,
  NOT_ALLOWED_SIGNIN,
  ACCOUNT_DISABLED,
  ACCOUNT_CANCELLED,
  ACCOUNT_BLOCKED,
  ACCOUNT_NOT_REGISTERED,
  EMAIL_NOT_CONFIRMED,
  INVALID_CREDENTIALS,
}
