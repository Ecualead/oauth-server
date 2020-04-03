/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-01T19:01:50-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: project.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-02T23:59:30-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

const Joi = require('@hapi/joi')
Joi.objectId = require('joi-objectid')(Joi);

export const ProjectCreate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().optional().empty(),
  links: Joi.object().optional().keys({
    app: Joi.string().optional().empty(),
    web: Joi.string().optional().empty(),
    facebook: Joi.string().optional().empty(),
    twitter: Joi.string().optional().empty(),
    instagram: Joi.string().optional().empty(),
    privacy: Joi.string().optional().empty(),
    terms: Joi.string().optional().empty(),
  }),
  scopes: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional().empty(),
});

export const ProjectUpdate = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().optional().empty(),
  links: Joi.object().optional().keys({
    app: Joi.string().optional().empty(),
    web: Joi.string().optional().empty(),
    facebook: Joi.string().optional().empty(),
    twitter: Joi.string().optional().empty(),
    instagram: Joi.string().optional().empty(),
    privacy: Joi.string().optional().empty(),
    terms: Joi.string().optional().empty(),
  }),
});

export const ProjectId = Joi.object().keys({
  id: Joi.objectId(),
});

export const ProjectStatus = Joi.object().keys({
  id: Joi.objectId(),
  action: Joi.string(),
});

export const ProjectScopes = Joi.object().keys({
  id: Joi.objectId(),
  scope: Joi.string().required(),
});
