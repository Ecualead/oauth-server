import { Joi } from '@ikoabo/core_srv';
import { APPLICATION_TYPES } from './applications.enum';

export const ApplicationCreateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  image: Joi.string().allow('').optional(),
  type: Joi.number().integer().min(APPLICATION_TYPES.APP_UNKNOWN).max(APPLICATION_TYPES.APP_MAX).required(),
  scope: Joi.array().items(Joi.string()).optional(),
  grants: Joi.array().items(Joi.string().valid('authorization_code', 'client_credentials', 'refresh_token', 'password')).required(),
});

export const ApplicationUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  image: Joi.string().allow('').optional(),
  type: Joi.number().integer().min(APPLICATION_TYPES.APP_UNKNOWN).max(APPLICATION_TYPES.APP_MAX).required(),
});

export const ApplicationGrantValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  grant: Joi.string().valid('authorization_code', 'client_credentials', 'refresh_token', 'password').required(),
});
