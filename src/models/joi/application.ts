/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-03T00:25:38-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: application.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T00:51:42-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import Joi from '@hapi/joi';
import { APPLICATION_TYPES } from '@/models/types/application';

export const ApplicationCreate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  type: Joi.number().integer().min(APPLICATION_TYPES.APP_UNKNOWN).max(APPLICATION_TYPES.APP_MAX).required(),
  scope: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().allow('')).optional(),
});

export const ApplicationUpdate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  type: Joi.number().integer().min(APPLICATION_TYPES.APP_UNKNOWN).max(APPLICATION_TYPES.APP_MAX).required(),
});
