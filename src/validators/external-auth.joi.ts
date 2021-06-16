/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
 import { Joi } from "@ikoabo/server";

export const ExternalAuthValidation = Joi.object().keys({
  external: Joi.objectId().required()
});

export const ExternalAuthStateValidation = Joi.object().keys({
  state: Joi.objectId().required(),
  code: Joi.string().allow("").optional()
});

export const ExternalAuthParamsValidation = Joi.object().keys({
  token: Joi.string().required(),
  redirect: Joi.string().required()
});
