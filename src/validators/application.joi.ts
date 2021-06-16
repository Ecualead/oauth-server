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
import { Joi } from "@ikoabo/server";
import { APPLICATION_TYPE } from "@/constants/application.enum";

export const ApplicationCreateValidation = Joi.object().keys({
  name: Joi.string().required(),
  canonical: Joi.string().pattern(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9.]+[a-zA-Z0-9]$")).required(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().allow("").optional(),
  type: Joi.number()
    .integer()
    .min(APPLICATION_TYPE.UNKNOWN)
    .max(APPLICATION_TYPE.MAX)
    .required(),
  scope: Joi.array().items(Joi.string()).optional(),
  grants: Joi.array()
    .items(
      Joi.string().valid("authorization_code", "client_credentials", "refresh_token", "password")
    )
    .required()
});

export const ApplicationUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().allow("").optional(),
  type: Joi.number()
    .integer()
    .min(APPLICATION_TYPE.UNKNOWN)
    .max(APPLICATION_TYPE.MAX)
    .required()
});

export const ApplicationGrantValidation = Joi.object().keys({
  grant: Joi.string()
    .valid("authorization_code", "client_credentials", "refresh_token", "password")
    .required()
});
