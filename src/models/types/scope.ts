/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: scope.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:01:03-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export const DEFAULT_SCOPES: string[] = [

];

/**
 * Default scopes handled by all domains
 */
export const SCP_DOMAIN_DEFAULT: string[] = [
  'dmn_admin',
  'prj_admin',
  'prj_create',
  'prj_remove',
  'prj_update',
  'app_create',
  'app_remove',
  'app_update',
  'usr_register',
];

/**
 * Default scopes handled by all projects
 */
export const SCP_PRJ_DEFAULT: string[] = [
  'prj_admin',
  'app_create',
  'app_remove',
  'app_update',
  'usr_register',
];

/**
 * Not allowed scopes to be assigned to domains/projects/applications
 * This are predefined scopes assigned internally
 */
export const SCP_PREVENT: string[] = [
  'application',
  'user',
  'default'
];

/**
 * Default non inheritable scopes that user can't inherit from application scopes
 */
export const SCP_NON_INHERITABLE: string[] = [
  'prj_admin',
  'app_create',
  'app_remove',
  'app_update',
  'usr_register',
];
