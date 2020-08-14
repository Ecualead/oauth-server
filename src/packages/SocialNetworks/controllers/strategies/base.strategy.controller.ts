/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Logger } from "@ikoabo/core_srv";
import passport from "passport";
import { SocialNetworkRequestDocument } from "@/SocialNetworks/models/social.networks.request.model";
import { SOCIAL_NETWORK_TYPES } from "@/SocialNetworks/models/social.networks.enum";
import { SocialNetworkFacebookCtrl } from "@/SocialNetworks/controllers/strategies/facebook.strategy.controller";
import { SocialNetworkGoogleCtrl } from "@/SocialNetworks/controllers/strategies/google.strategy,controller";
import { SocialNetworkTwitterCtrl } from "@/SocialNetworks/controllers/strategies/twitter.strategy.controller";

export abstract class SocialNetworkStrategy {
  private _name: string;
  private _logger: Logger;

  constructor(name: string) {
    this._name = name;
    this._logger = new Logger(`SocialNetworkStrategy:${name}`);
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

  public abstract setup(socialNetwork: SocialNetworkRequestDocument, cbUri: string, fn: any): passport.Strategy;
}
