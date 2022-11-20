/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */

/* Export constants */
export {
  EVENT_TYPE,
  VALIDATION_STATUS,
  SCOPE_PREVENT,
  APPLICATION_TYPE,
  NOTIFICATION_TYPE,
  EMAIL_CONFIRMATION
} from "./constants/oauth2.enum";

/* Export controllers */
export {
  AccessPolicy as AccountAccessPolicy,
  AccessPolicyCtrl as AccountAccessPolicyCtrl
} from "./controllers/account/access.policy";
export { Accounts, AccountCtrl } from "./controllers/account/account";
export { Emails, EmailCtrl } from "./controllers/account/email";
export { Icon, IconCtrl } from "./controllers/account/icon";
export { Phones, PhoneCtrl } from "./controllers/account/phone";
export { ReferralCodeCtrl } from "./controllers/account/referral.code";
export { AccessPolicyCtrl } from "./controllers/application/access.policy";
export { Applications, ApplicationCtrl } from "./controllers/application/application";
export { MailNotificationCtrl } from "./controllers/notification/transport/mail";
export { BaseNotification } from "./controllers/notification/base";
export { Notification, NotificationCtrl } from "./controllers/notification/notification";
export { OAuth2Ctrl } from "./controllers/oauth2/oauth2";
export { OAuth2ModelCtrl } from "./controllers/oauth2/oauth2.model";
export { Settings } from "./controllers/settings";

/* Export module setings */
export {
  IOauth2Settings,
  IEmailNotifications,
  IEmailPolicy,
  IPasswordPolicy,
  ISignKeys,
  ITokenPolicy,
  IRouterHooks
} from "./settings";

/* Export data models */
export {
  Account,
  AccountDocument,
  AccountModel,
  AccountReferral
} from "./models/account/account";
export { Email, EmailDocument, EmailModel } from "./models/account/email";
export { Phone, PhoneDocument, PhoneModel } from "./models/account/phone";
export { ValidationToken } from "./models/account/validation.token";
export {
  Application,
  ApplicationDocument,
  ApplicationModel
} from "./models/application/application";
export { Code, CodeDocument, CodeModel } from "./models/oauth2/code";
export { Token, TokenDocument, TokenModel } from "./models/oauth2/token";

/* Export routers */
export { OAuth2Router } from "./routers";

/* Export validators */
export {
  AccountValidation,
  EmailValidation,
  PassowrdChangeValidation,
  RecoverValidation,
  RegisterValidation
} from "./validators/account";
export { RestrictionValidation, ScopeValidation, StatusValidation } from "./validators/base.joi";
