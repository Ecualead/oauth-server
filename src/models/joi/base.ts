/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-03T00:50:14-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: base.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:51:10-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

const Joi = require('@hapi/joi')
Joi.objectId = require('joi-objectid')(Joi);

export const CheckId = Joi.object().keys({
  id: Joi.objectId(),
});

export const CheckStatus = Joi.object().keys({
  id: Joi.objectId().required(),
  action: Joi.string().valid('enable', 'disable').required(),
});

export const CheckScopes = Joi.object().keys({
  id: Joi.objectId().required(),
  scope: Joi.string().required(),
});
