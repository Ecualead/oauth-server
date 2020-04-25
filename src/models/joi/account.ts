/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-06T02:18:50-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: account.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-06T02:26:02-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import Joi from '@hapi/joi';

export const RegisterValidation = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  name: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  profile: Joi.object().optional(),
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
