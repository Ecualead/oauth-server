/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express 
 * permission of the author.
 */
import { Joi } from "@ikoabo/core_srv";

export const RegisterValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  name: Joi.string().allow("").optional(),
  lastname: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  referral: Joi.string().allow("").optional(),
});

export const AccountValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
});

export const EmailValidation = Joi.object().keys({
  email: Joi.string().email().required(),
});

export const RecoverValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  token: Joi.string().required(),
  password: Joi.string().required(),
});
