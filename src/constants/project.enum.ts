/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */

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
