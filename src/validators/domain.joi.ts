/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Joi } from "@ikoabo/server";

export const DomainCreate = Joi.object().keys({
  name: Joi.string().required(),
  canonical: Joi.string()
    .pattern(new RegExp(/^([a-zA-Z0-9]\.)+[a-zA-Z0-9]$/))
    .required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional()
});

export const DomainUpdate = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional()
});
