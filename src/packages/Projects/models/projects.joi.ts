import {Joi} from '@ikoabo/core_srv';

export const ProjectCreateValidation = Joi.object().keys({
  domain: Joi.objectId().required(),
  cannonical: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  links: Joi.object().optional().keys({
    app: Joi.string().allow('').optional(),
    web: Joi.string().allow('').optional(),
    facebook: Joi.string().allow('').optional(),
    twitter: Joi.string().allow('').optional(),
    youtube: Joi.string().allow('').optional(),
    instagram: Joi.string().allow('').optional(),
    privacy: Joi.string().allow('').optional(),
    terms: Joi.string().allow('').optional(),
  }),
  scope: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().allow('')).optional(),
});

export const ProjectUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  links: Joi.object().optional().keys({
    app: Joi.string().allow('').optional(),
    web: Joi.string().allow('').optional(),
    facebook: Joi.string().allow('').optional(),
    twitter: Joi.string().allow('').optional(),
    youtube: Joi.string().allow('').optional(),
    instagram: Joi.string().allow('').optional(),
    privacy: Joi.string().allow('').optional(),
    terms: Joi.string().allow('').optional(),
  }),
});
