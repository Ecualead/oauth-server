/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T08:37:11-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: domain.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T01:24:42-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import Joi from '@hapi/joi';

export const DomainCreate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  scopes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().allow('')).optional(),
});

export const DomainUpdate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
});
