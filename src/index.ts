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
} from "./controllers/account/access.policy.controller";
export { Accounts, AccountCtrl } from "./controllers/account/account.controller";
export { Emails, EmailCtrl } from "./controllers/account/email.controller";
export { ExternalsAuth, ExternalAuthCtrl } from "./controllers/account/external.auth.controller";
export { Icon, IconCtrl } from "./controllers/account/icon.controller";
export { Phones, PhoneCtrl } from "./controllers/account/phone.controller";
export { ReferralCodeCtrl } from "./controllers/account/referral.code.controller";
export { AccessPolicyCtrl } from "./controllers/application/access.policy.controller";
export { Applications, ApplicationCtrl } from "./controllers/application/application.controller";
export { MailNotificationCtrl } from "./controllers/notification/transport/mail.controller";
export { BaseNotification } from "./controllers/notification/base.controller";
export { Notification, NotificationCtrl } from "./controllers/notification/notification.controller";
export { ExternalAuthSchema } from "./controllers/oauth2/schemas/base.controller";
export { FacebookCtrl } from "./controllers/oauth2/schemas/facebook.controller";
export { GoogleCtrl } from "./controllers/oauth2/schemas/google.controller";
export { TwitterCtrl } from "./controllers/oauth2/schemas/twitter.controller";
export { External, ExternalCtrl } from "./controllers/oauth2/external.controller";
export { OAuth2Ctrl } from "./controllers/oauth2/oauth2.controller";
export { OAuth2ModelCtrl } from "./controllers/oauth2/oauth2.model.controller";
export { Settings } from "./controllers/settings.controller";

/* Export module setings */
export {
  IOauth2Settings,
  IEmailNotifications,
  IEmailPolicy,
  IExternalAuth,
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
} from "./models/account/account.model";
export { Email, EmailDocument, EmailModel } from "./models/account/email.model";
export {
  ExternalAuth,
  ExternalAuthDocument,
  ExternalAuthModel
} from "./models/account/external.auth.model";
export { Phone, PhoneDocument, PhoneModel } from "./models/account/phone.model";
export { ValidationToken } from "./models/account/validation.token.model";
export {
  Application,
  ApplicationDocument,
  ApplicationModel
} from "./models/application/application.model";
export { Code, CodeDocument, CodeModel } from "./models/oauth2/code.model";
export {
  ExternalRequest,
  ExternalRequestDocument,
  ExternalRequestModel,
  ExternalAuthSettings
} from "./models/oauth2/external.request.model";
export { Token, TokenDocument, TokenModel } from "./models/oauth2/token.model";

/* Export routers */
export { OAuth2Router } from "./routers";

/* Export utils */
export { externalAuthToInt, externalAuthToStr } from "./utils/external.auth.util";

/* Export validators */
export {
  AccountValidation,
  EmailValidation,
  PassowrdChangeValidation,
  RecoverValidation,
  RegisterValidation
} from "./validators/account.joi";
export { RestrictionValidation, ScopeValidation, StatusValidation } from "./validators/base.joi";
export {
  ExternalAuthValidation,
  ExternalAuthStateValidation,
  ExternalAuthParamsValidation
} from "./validators/external.auth.joi";
