/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */

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

export enum EMAIL_STATUS {
  DISABLED_BY_ADMIN = -3,
  TEMPORALLY_BLOCKED = -2,
  CANCELLED = -1,
  UNKNOWN = 0,
  DISABLED = 1,
  ENABLED = 2,
  REGISTERED = 3,
  CONFIRMED = 4,
  NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH = 5,
  NEEDS_CONFIRM_EMAIL_CAN_AUTH = 6
}

export const PROTECTED_PROJECT_FIELDS: string[] = [
  "_id",
  "__v",
  "updatedAt",
  "createdAt",
  "account",
  "scope",
  "social",
  "status"
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
  "usr_register"
];

/**
 * Default scope handled by all projects
 */
export const SCP_PRJ_DEFAULT: string[] = [
  "prj_admin",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register"
];

/**
 * Default scope handled by all applications
 */
export const SCP_APP_DEFAULT: string[] = [
  "prj_admin",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register"
];

/**
 * Default scope handled by all account
 */
export const SCP_ACCOUNT_DEFAULT: string[] = [
  "prj_admin",
  "app_create",
  "app_remove",
  "app_update",
  "usr_register"
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
  "usr_register"
];
