/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Joi } from "@ikoabo/server";
import { LIFETIME_TYPE, EMAIL_CONFIRMATION, EXTERNAL_AUTH_TYPE } from "@/constants/project.enum";

/*******
 * GENERAL PROJECT VALIDATORS
 *******/

const ProjectLinks = Joi.object()
  .optional()
  .keys({
    android: Joi.string().allow("").optional(),
    ios: Joi.string().allow("").optional(),
    web: Joi.string().allow("").optional(),
    facebook: Joi.string().allow("").optional(),
    twitter: Joi.string().allow("").optional(),
    youtube: Joi.string().allow("").optional(),
    instagram: Joi.string().allow("").optional(),
    privacy: Joi.string().allow("").optional(),
    terms: Joi.string().allow("").optional()
  });

export const ProjectCreateValidation = Joi.object().keys({
  domain: Joi.objectId().required(),
  canonical: Joi.string().pattern(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9.]+[a-zA-Z0-9]$")).required(),
  code: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]+$")).required(),
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().allow("").optional(),
  links: ProjectLinks,
  scope: Joi.array().items(Joi.string()).optional()
});

export const ProjectUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().allow("").optional(),
  links: ProjectLinks
});

/*******
 * PROJECT SETTINGS VALIDATORS
 *******/

export const TokenLifetimeValidation = Joi.object().keys({
  accessToken: Joi.number().integer().default(LIFETIME_TYPE.MONTH).required(),
  refreshToken: Joi.number().integer().default(LIFETIME_TYPE.YEAR).required()
});

export const EmailConfirmationValidation = Joi.object().keys({
  type: Joi.number().integer().default(EMAIL_CONFIRMATION.NOT_REQUIRED).required(),
  time: Joi.number().integer().default(LIFETIME_TYPE.MONTH).required()
});

export const PasswordPolicyValidation = Joi.object().keys({
  lifetime: Joi.number().integer().default(LIFETIME_TYPE.INFINITE).required(),
  len: Joi.number().integer().default(5).required(),
  upperCase: Joi.boolean().default(true).required(),
  lowerCase: Joi.boolean().default(true).required(),
  specialChars: Joi.boolean().default(false).required(),
  numbers: Joi.boolean().default(true).required()
});

/*******
 * PROJECT RELATED SETTINGS VALIDATORS
 *******/

export const ProjectRelatedParamsValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  obj: Joi.number().required()
});

export const ProjectRelatedStatusValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  obj: Joi.number().required(),
  action: Joi.string().valid("enable", "disable").required()
});

export const ExternalAuthValidation = Joi.object().keys({
  type: Joi.number().default(EXTERNAL_AUTH_TYPE.UNKNOWN).required(),
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  clientId: Joi.string().required(),
  clientSecret: Joi.string().required(),
  scope: Joi.string().allow("").optional(),
  profile: Joi.array().items(Joi.string()).optional()
});

export const RestrictIpValidation = Joi.object().keys({
  ip: Joi.string().required(),
  description: Joi.string().allow("").optional()
});

export const KeyValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow("").optional()
});
