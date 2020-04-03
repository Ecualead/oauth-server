/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T08:37:11-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: domain.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-02T23:59:24-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */
const Joi = require('@hapi/joi')
Joi.objectId = require('joi-objectid')(Joi);

export const DomainCreate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().optional().empty(),
  scopes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional().empty(),
});

export const DomainUpdate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().optional().empty(),
});

export const DomainId = Joi.object().keys({
  id: Joi.objectId(),
});

export const DomainStatus = Joi.object().keys({
  id: Joi.objectId(),
  action: Joi.string(),
});

export const DomainScopes = Joi.object().keys({
  id: Joi.objectId(),
  scope: Joi.string().required(),
});
