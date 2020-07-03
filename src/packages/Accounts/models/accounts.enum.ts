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
  AS_CONFIRMED = 4,
  AS_NEEDS_CONFIRM_EMAIL_CAN_NOT_AUTH = 5,
  AS_NEEDS_CONFIRM_EMAIL_CAN_AUTH = 6,
}

export enum ACCOUNT_SOCIAL_NETWORKS {
  SN_UNKNOWN = 0,
  SN_FACEBOOK = 1,
  SN_INSTAGRAM = 2,
  SN_GOOGLE = 3,
  SN_TWITTER = 4,
  SN_LINKEDIN = 5,
}

export enum RECOVER_TOKEN_STATUS {
  RTS_DISABLED = 0,
  RTS_TO_CONFIRM = 1,
  RTS_TO_RECOVER = 2,
  RTS_CONFIRMED = 3,
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