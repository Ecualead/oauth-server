/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";
import { SocialNetworkFacebookCtrl } from "@/SocialNetworks/controllers/strategies/facebook.strategy.controller";
import { SocialNetworkGoogleCtrl } from "@/SocialNetworks/controllers/strategies/google.strategy,controller";
import { SocialNetworkTwitterCtrl } from "@/SocialNetworks/controllers/strategies/twitter.strategy.controller";
import { SocialNetworkStrategy } from "@/SocialNetworks/controllers/strategies/base.strategy.controller";

export class SocialNetworkStrategyFactory {

  private constructor() {
  }

  public static getByType(type: SOCIAL_NETWORK_TYPES): SocialNetworkStrategy {
    switch (type) {
      case SOCIAL_NETWORK_TYPES.SN_FACEBOOK:
        return SocialNetworkFacebookCtrl;
      case SOCIAL_NETWORK_TYPES.SN_GOOGLE:
        return SocialNetworkGoogleCtrl;
      case SOCIAL_NETWORK_TYPES.SN_TWITTER:
        return SocialNetworkTwitterCtrl;
    }

    throw ('Invalid social network');
  }
}
