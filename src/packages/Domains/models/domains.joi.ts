import { Joi } from "@ikoabo/core_srv";

export const DomainCreateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  scope: Joi.array().items(Joi.string()).optional(),
});

export const DomainUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
});
