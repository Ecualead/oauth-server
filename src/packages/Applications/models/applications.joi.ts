import Joi from '@hapi/joi';
import { APPLICATION_TYPES } from './applications.enum';

export const ApplicationCreateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  image: Joi.string().allow('').optional(),
  type: Joi.number().integer().min(APPLICATION_TYPES.APP_UNKNOWN).max(APPLICATION_TYPES.APP_MAX).required(),
  scope: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().allow('')).optional(),
});

export const ApplicationUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  image: Joi.string().allow('').optional(),
  type: Joi.number().integer().min(APPLICATION_TYPES.APP_UNKNOWN).max(APPLICATION_TYPES.APP_MAX).required(),
});
