/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BASE_STATUS } from "@ikoabo/core_srv";

export enum ACCOUNT_STATUS {
  AS_DISABLED_BY_ADMIN = -4,
  AS_TEMPORALLY_BLOCKED = -3,
  AS_CANCELLED = -2,
  AS_DELETED = -1,
  AS_UNKNOWN = 0,
  AS_DISABLED = 1,
  AS_ENABLED = 2,
  AS_REGISTERED = 3,
}

export enum RECOVER_TOKEN_STATUS {
  RTS_DISABLED = 0,
  RTS_TO_CONFIRM = 1,
  RTS_TO_RECOVER = 2,
  RTS_CONFIRMED = 3,
}

export enum NOTIFICATIONS_EVENTS_TYPES {
  NET_UNKNOWN = 0,
  NET_SIGNUP = 1,
  NET_CONFIRM = 2,
  NET_SIGNIN = 3,
  NET_CHPWD = 4,
  NET_RECOVER = 5,
}

export enum EMAIL_STATUS {
  ES_DISABLED_BY_ADMIN = -3,
  ES_TEMPORALLY_BLOCKED = -2,
  ES_CANCELLED = -1,
  ES_UNKNOWN = 0,
  ES_DISABLED = 1,
  ES_ENABLED = 2,
  ES_REGISTERED = 3,
  ES_CONFIRMED = 4,
  ES_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH = 5,
  ES_NEEDS_CONFIRM_EMAIL_CAN_AUTH = 6,
}

export const PROTECTED_PROJECT_FIELDS: string[] = [
  "_id",
  "__v",
  "updatedAt",
  "createdAt",
  "account",
  "scope",
  "social",
  "status",
];

export const DEFAULT_SCOPES: string[] = [];

/**
 * Default scope handled by all domains
 */
export const SCP_DOMAIN_DEFAULT: string[] = [
  "dmn_admin",
  "prj_admin",
  "prj_create",
  "prj_remove",
  "prj_update",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register",
];

/**
 * Default scope handled by all projects
 */
export const SCP_PRJ_DEFAULT: string[] = [
  "prj_admin",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register",
];

/**
 * Default scope handled by all applications
 */
export const SCP_APP_DEFAULT: string[] = [
  "prj_admin",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register",
];

/**
 * Default scope handled by all account
 */
export const SCP_ACCOUNT_DEFAULT: string[] = [
  "prj_admin",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register",
];

/**
 * Not allowed scope to be assigned to domains/projects/applications
 * This are predefined scope assigned internally
 */
export const SCP_PREVENT: string[] = ["application", "user", "default"];

/**
 * Default non inheritable scope that user can't inherit from application scope
 */
export const SCP_NON_INHERITABLE: string[] = [
  "prj_admin",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register",
];
