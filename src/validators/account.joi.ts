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

export const RegisterValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  name: Joi.string().allow("").optional(),
  lastname1: Joi.string().allow("").optional(),
  lastname2: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  referral: Joi.string().allow("").optional(),
  type: Joi.number().optional().default(0),
  custom1: Joi.string().allow("").optional(),
  custom2: Joi.string().allow("").optional()
});

export const AccountValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  token: Joi.string().required()
});

export const EmailValidation = Joi.object().keys({
  email: Joi.string().email().required()
});

export const RecoverValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
  password: Joi.string().required()
});

export const PassowrdChangeValidation = Joi.object().keys({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required()
});
