/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Joi } from "@ecualead/server";

export const StatusValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  action: Joi.string().valid("enable", "disable").required()
});

export const ScopeValidation = Joi.object().keys({
  scope: Joi.string().required()
});

export const RestrictionValidation = Joi.object().keys({
  restriction: Joi.string().required()
});
