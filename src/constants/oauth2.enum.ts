/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */

export enum OAUTH2_TOKEN_TYPE {
  UNKNOWN = 0,
  APPLICATION,
  USER,
  EXTERNAL_AUTH
}

export const DEFAULT_SCOPES: string[] = [
  "root",
  "default",
  "non_user",
  "application",
  "service",
  "project",
  "user",
  "application_owner",
  "project_owner",
  "external_auth"
];
