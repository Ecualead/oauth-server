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

export enum APPLICATION_TYPES {
  APP_UNKNOWN = 0,
  APP_MODULE,
  APP_SERVICE,
  APP_ANDROID,
  APP_IOS,
  APP_WEB_SERVER_SIDE,
  APP_WEB_CLIENT_SIDE,
  APP_MAX
}

export enum APPLICATION_IP_RESTRICTION {
  APP_IR_ALLOWED = 0,
  APP_IR_BLOCKED = 1
}
