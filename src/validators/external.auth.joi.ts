/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Joi } from "@ecualead/server";

export const ExternalAuthValidation = Joi.object().keys({
  project: Joi.objectId().required(),
  external: Joi.objectId().required()
});

export const ExternalAuthStateValidation = Joi.object().keys({
  state: Joi.objectId().required(),
  code: Joi.string().allow("").optional(),
  scope: Joi.string().allow("").optional(),
  authuser: Joi.string().allow("").optional(),
  prompt: Joi.string().allow("").optional()
});

export const ExternalAuthParamsValidation = Joi.object().keys({
  token: Joi.string().required(),
  redirect: Joi.string().required(),
  type: Joi.number().integer().optional()
});
