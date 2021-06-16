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

import { EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";

export function externalAuthToInt(auth: string): EXTERNAL_AUTH_TYPE {
  auth = auth.toLowerCase();
  switch (auth) {
    case "facebook":
      return EXTERNAL_AUTH_TYPE.FACEBOOK;
    case "google":
      return EXTERNAL_AUTH_TYPE.GOOGLE;
    case "instagram":
      return EXTERNAL_AUTH_TYPE.INSTAGRAM;
    case "linkedin":
      return EXTERNAL_AUTH_TYPE.LINKEDIN;
    case "twitter":
      return EXTERNAL_AUTH_TYPE.TWITTER;
    case "yahoo":
      return EXTERNAL_AUTH_TYPE.YAHOO;
    case "telegram":
      return EXTERNAL_AUTH_TYPE.TELEGRAM;
    case "oauth2":
      return EXTERNAL_AUTH_TYPE.OAUTH2;
  }
  return EXTERNAL_AUTH_TYPE.UNKNOWN;
}

export function externalAuthToStr(auth: EXTERNAL_AUTH_TYPE): string {
  switch (auth) {
    case EXTERNAL_AUTH_TYPE.FACEBOOK:
      return "facebook";
    case EXTERNAL_AUTH_TYPE.GOOGLE:
      return "google";
    case EXTERNAL_AUTH_TYPE.INSTAGRAM:
      return "instagram";
    case EXTERNAL_AUTH_TYPE.LINKEDIN:
      return "linkedin";
    case EXTERNAL_AUTH_TYPE.TWITTER:
      return "twitter";
    case EXTERNAL_AUTH_TYPE.YAHOO:
      return "yahoo";
    case EXTERNAL_AUTH_TYPE.TELEGRAM:
      return "telegram";
    case EXTERNAL_AUTH_TYPE.OAUTH2:
      return "oauth2";
  }
  return null;
}
