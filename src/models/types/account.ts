/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: account.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T05:16:08-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export enum ACCOUNT_STATUS {
  AS_UNKNOWN = 0,
  AS_REGISTERED = 1,
  AS_CONFIRMED = 2,
  AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH = 3,
  AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH = 4,
  AS_CANCELLED = -2,
  AS_TEMPORALLY_BLOCKED = -3,
  AS_DISABLED_BY_ADMIN = -4,
}
