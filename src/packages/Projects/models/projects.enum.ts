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

export enum NOTIFICATION_TYPES {
  NT_UNKNOWN = 0,
  NT_EMAIL = 1,
  NT_PUSH = 2,
  NT_WHATSAPP = 3,
  NT_TELEGRAM = 4,
  NT_MESSENGER = 5
}

/* Lifetime predefined values in miliseconds */
export enum PROJECT_LIFETIME_TYPES {
  LT_INHERIT = 0,
  LT_INFINITE = -1,
  LT_1HOUR = 3600000,
  LT_24HOURS = 86400000,
  LT_ONE_WEEK = 604800000,
  LT_ONE_MONTH = 2629743000,
  LT_ONE_YEAR = 31556926000
}

export enum PROJECT_EMAIL_CONFIRMATION {
  EC_CONFIRMATION_REQUIRED = 0,
  EC_CONFIRMATION_NOT_REQUIRED = 1,
  EC_CONFIRMATION_REQUIRED_BY_TIME = 2
}

export enum PROJECT_RECOVER_TYPE {
  RT_DISABLED = 0,
  RT_LINK = 1,
  RT_CODE = 2,
  RT_BOTH = 3
}
