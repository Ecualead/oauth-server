import { Joi } from "@ikoabo/core_srv";

export const ModuleCreateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  scope: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string().allow(""))
    .optional(),
  url: Joi.string().allow("").optional(),
  terms: Joi.string().allow("").optional(),
});

export const ModuleUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  image: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  url: Joi.string().allow("").optional(),
  terms: Joi.string().allow("").optional(),
});

export const SubModuleValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  module: Joi.objectId().required(),
});
