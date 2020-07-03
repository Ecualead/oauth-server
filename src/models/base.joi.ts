import { Joi } from "@ikoabo/core_srv";

export const StatusValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  action: Joi.string().valid("enable", "disable").required(),
});

export const ScopeValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  scope: Joi.string().required(),
});
