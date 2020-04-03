/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T19:01:50-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: project.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-03T01:20:44-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import Joi from '@hapi/joi';

export const ProjectCreate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  links: Joi.object().optional().keys({
    app: Joi.string().allow('').optional(),
    web: Joi.string().allow('').optional(),
    facebook: Joi.string().allow('').optional(),
    twitter: Joi.string().allow('').optional(),
    instagram: Joi.string().allow('').optional(),
    privacy: Joi.string().allow('').optional(),
    terms: Joi.string().allow('').optional(),
  }),
  scopes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string().allow('')).optional(),
});

export const ProjectUpdate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  links: Joi.object().optional().keys({
    app: Joi.string().allow('').optional(),
    web: Joi.string().allow('').optional(),
    facebook: Joi.string().allow('').optional(),
    twitter: Joi.string().allow('').optional(),
    instagram: Joi.string().allow('').optional(),
    privacy: Joi.string().allow('').optional(),
    terms: Joi.string().allow('').optional(),
  }),
});
