/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: state.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-02T17:35:41-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export enum DOMAIN_STATUS {
  DS_DELETED = -1,
  DS_DISABLED = 0,
  DS_ENABLED = 1,
}

export enum PROJECT_STATUS {
  PS_DELETED = -1,
  PS_DISABLED = 0,
  PS_ENABLED = 1,
}

export enum LIFETIME_TYPES {
  LT_INHERIT = 0,
  LT_INFINITE = -1,
  LT_ONE_WEEK = 604800,
  LT_ONE_MONTH = 2592000,
  LT_ONE_YEAR = 31536000,
}

export enum EMAIL_CONFIRMATION {
  EC_CONFIRMATION_REQUIRED = 0,
  EC_CONFIRMATION_NOT_REQUIRED = 1,
  EC_CONFIRMATION_REQUIRED_BY_TIME = 2,
}
