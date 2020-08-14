/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Joi } from "@ikoabo/core_srv";
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";

export const SocialNetworkSettingValidation = Joi.object().keys({
  type: Joi.number().default(SOCIAL_NETWORK_TYPES.SN_UNKNOWN).required(),
  clientId: Joi.string().required(),
  clientSecret: Joi.string().required(),
  scope: Joi.string().allow("").optional(),
  profile: Joi.array().items(Joi.string()).optional(),
});

export const SocialNetworkValidation = Joi.object().keys({
  social: Joi.string().valid("facebook", "google", "twitter").required(),
});

export const SocialNetworkStateValidation = Joi.object().keys({
  state: Joi.objectId().required(),
});

export const SocialNetworkParamsValidation = Joi.object().keys({
  token: Joi.string().required(),
  redirect: Joi.string().required(),
});
