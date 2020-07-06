import { Joi } from "@ikoabo/core_srv";
import { PROJECT_LIFETIME_TYPES, PROJECT_RECOVER_TYPE, PROJECT_EMAIL_CONFIRMATION, SOCIAL_NETWORK_TYPES, NOTIFICATION_TYPES, PROFILE_FIELD_TYPES } from "./projects.enum";

const ProjectLinks = Joi.object()
  .optional()
  .keys({
    app: Joi.string().allow("").optional(),
    web: Joi.string().allow("").optional(),
    facebook: Joi.string().allow("").optional(),
    twitter: Joi.string().allow("").optional(),
    youtube: Joi.string().allow("").optional(),
    instagram: Joi.string().allow("").optional(),
    privacy: Joi.string().allow("").optional(),
    terms: Joi.string().allow("").optional(),
  });

export const ProjectCreateValidation = Joi.object().keys({
  domain: Joi.objectId().required(),
  cannonical: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9.]+[a-zA-Z0-9]$"))
    .required(),
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().allow("").optional(),
  links: ProjectLinks,
  scope: Joi.array().items(Joi.string()).optional(),
});

export const ProjectUpdateValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  image: Joi.string().allow("").optional(),
  links: ProjectLinks,
});

export const TypeSettingParamsValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  type: Joi.number().required(),
});

export const ProfileFieldParamsValidation = Joi.object().keys({
  id: Joi.objectId().required(),
  name: Joi.string().required(),
});

export const SocialNetworkSettingValidation = Joi.object().keys({
  type: Joi.number().default(SOCIAL_NETWORK_TYPES.SN_UNKNOWN).required(),
  clientId: Joi.string().required(),
  clientSecret: Joi.string().required(),
  scope: Joi.string().allow("").optional(),
  profile: Joi.array().items(Joi.string()).optional(),
  profileMap: Joi.array().items(Joi.object().keys({
    key: Joi.string().required(),
    fields: Joi.array().items(Joi.string()).required()
  })).optional(),
  description: Joi.string().required(),
});

export const TokenLifetimeValidation = Joi.object().keys({
  accessToken: Joi.number().default(PROJECT_LIFETIME_TYPES.LT_ONE_MONTH).required(),
  refreshToken: Joi.number().default(PROJECT_LIFETIME_TYPES.LT_ONE_YEAR).required(),
});

export const RecoverTypeValidation = Joi.object().keys({
  recover: Joi.number().default(PROJECT_RECOVER_TYPE.RT_DISABLED).required(),
});

export const RestrictIpValidation = Joi.object().keys({
  ipAddress: Joi.string().required(),
});

export const EmailConfirmationValidation = Joi.object().keys({
  type: Joi.number().default(PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED).required(),
  time: Joi.number().default(PROJECT_LIFETIME_TYPES.LT_ONE_MONTH).required(),
});

export const PasswordPolicyValidation = Joi.object().keys({
  len: Joi.number().default(5).required(),
  upperCase: Joi.boolean().default(true).required(),
  lowerCase: Joi.boolean().default(true).required(),
  specialChars: Joi.boolean().default(false).required(),
  numbers: Joi.boolean().default(true).required(),
});

export const NotificationsSettingsValidation = Joi.object().keys({
  type: Joi.number().default(NOTIFICATION_TYPES.NT_UNKNOWN).required(),
  signup: Joi.boolean().default(false).required(),
  confirm: Joi.boolean().default(false).required(),
  signin: Joi.boolean().default(false).required(),
  chPwd: Joi.boolean().default(false).required(),
  recover: Joi.boolean().default(false).required(),
  urls: Joi.object().keys({
    confirm: Joi.string().allow("").optional(),
    recover: Joi.string().allow("").optional()
  }).optional()
});

export const ProfileFieldSettingsValidation = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  type: Joi.number().default(PROFILE_FIELD_TYPES.PF_UNKNOWN).required(),
  defaultValue: Joi.string().allow("").optional(),
  required: Joi.boolean().default(false)
});

export const ProfileFieldIndexSettingsValidation = Joi.object().keys({
  names: Joi.array().items(Joi.string()).required()
});

