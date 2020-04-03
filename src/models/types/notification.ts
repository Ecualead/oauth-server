/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: notification.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T07:12:21-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export enum NOTIFICATION_TYPES {
  NT_UNKNOWN = 0,
  NT_EMAIL = 1,
  NT_PUSH = 2,
  NT_WHATSAPP = 3,
  NT_TELEGRAM = 4,
  NT_MESSENGER = 5,
}
