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

export const RegisterValidation = Joi.object().keys({
  grt: Joi.string().required(),
  idToken: Joi.string().required(),
  referral: Joi.string().allow("").optional(),
  type: Joi.number().optional().default(0),
  custom1: Joi.string().allow("").optional(),
  custom2: Joi.string().allow("").optional()
});

export const LoginValidation = Joi.object().keys({
  grt: Joi.string().required(),
  idToken: Joi.string().required(),
});
