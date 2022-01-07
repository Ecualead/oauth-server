/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */

export enum APPLICATION_TYPE {
  UNKNOWN = 0,
  MODULE,
  SERVICE,
  ANDROID,
  IOS,
  WEB_SERVER_SIDE,
  WEB_CLIENT_SIDE,
  MAX
}

export enum NOTIFICATION_TYPE {
  NONE = 0,
  EMAIL = 1,
  PUSH = 2,
  WHATSAPP = 4,
  TELEGRAM = 8,
  MESSENGER = 16
}

/* Lifetime predefined values in milliseconds */
export enum LIFETIME_TYPE {
  INHERIT = 0,
  INFINITE = -1,
  HOUR = 3600000,
  DAY = 86400000,
  WEEK = 604800000,
  MONTH = 2629743000,
  YEAR = 31556926000
}

export enum EMAIL_CONFIRMATION {
  REQUIRED = 0,
  NOT_REQUIRED = 1,
  REQUIRED_BY_TIME = 2
}

export enum TOKEN_TYPE {
  DISABLED = 0,
  LINK = 1,
  CODE = 2,
  BOTH = 3
}

/**
 * Predefined external authentication type
 */
export enum EXTERNAL_AUTH_TYPE {
  UNKNOWN = 0,
  FACEBOOK = 1,
  GOOGLE = 2,
  TWITTER = 3,
  INSTAGRAM = 4,
  YAHOO = 5,
  LINKEDIN = 6,
  TELEGRAM = 7,
  OAUTH2 = 8
}

export enum ACCOUNT_STATUS {
  DISABLED_BY_ADMIN = -4,
  TEMPORALLY_BLOCKED = -3,
  CANCELLED = -2,
  DELETED = -1,
  UNKNOWN = 0,
  DISABLED = 1,
  ENABLED = 2,
  REGISTERED = 3
}

export enum TOKEN_STATUS {
  DISABLED = 0,
  TO_CONFIRM = 1,
  TO_RECOVER = 2,
  PARTIAL_CONFIRMED = 3,
  TO_LOGIN = 4
}

export enum EVENT_TYPE {
  UNKNOWN = 0,
  REGISTER = 1,
  CONFIRM = 2,
  LOGIN = 3,
  CHPWD = 4,
  RECOVER = 5
}

export enum VALIDATION_STATUS {
  DISABLED_BY_ADMIN = -3,
  TEMPORALLY_BLOCKED = -2,
  CANCELLED = -1,
  UNKNOWN = 0,
  DISABLED = 1,
  ENABLED = 2,
  REGISTERED = 3,
  CONFIRMED = 4,
  NEEDS_CONFIRM_CAN_NOT_AUTH = 5,
  NEEDS_CONFIRM_CAN_AUTH = 6
}

/**
 * Not allowed scope to be assigned to applications
 * This are predefined scope assigned internally
 */
export const SCOPE_PREVENT: string[] = ["application", "user", "default"];
