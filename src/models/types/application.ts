/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: application.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T07:12:01-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export enum APPLICATION_TYPES {
  APP_UNKNOWN = 0,
  APP_SERVICE = 1,
  APP_ANDROID = 2,
  APP_IOS = 3,
  APP_WEB_SERVER_SIDE = 4,
  APP_WEB_CLIENT_SIDE = 5,
}

export enum APPLICATION_RECOVER_TYPE {
  APP_RT_DISABLED = 0,
  APP_RT_LINK = 1,
  APP_RT_CODE = 2,
}

export enum APPLICATION_IP_RESTRICTION {
  APP_IR_ALLOWED = 0,
  APP_IR_BLOCKED = 1,
}
