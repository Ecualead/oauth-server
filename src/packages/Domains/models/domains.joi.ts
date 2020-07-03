import { Joi } from "@ikoabo/core_srv";

export const DomainCreateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  scope: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string().allow(""))
    .optional(),
});

export const DomainUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
});
