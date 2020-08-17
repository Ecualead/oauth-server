/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Joi } from "@ikoabo/server";

export const ModuleCreateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  scope: Joi.array().items(Joi.string()).optional(),
  restriction: Joi.array().items(Joi.string()).optional(),
  url: Joi.string().allow("").optional(),
  terms: Joi.string().allow("").optional()
});

export const ModuleUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  url: Joi.string().allow("").optional(),
  terms: Joi.string().allow("").optional()
});

export const SubModuleValidation = Joi.object().keys({
  module: Joi.objectId().required()
});
