/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import passport from "passport";
import { SocialNetworkRequestDocument } from "@/SocialNetworks/models/social.networks.request.model";
import { SocialNetworkStrategy } from "@/SocialNetworks/controllers/strategies/base.strategy.controller";
import {
  Profile as TwitterProfile,
  Strategy as TwitterStrategy,
} from "passport-twitter";

/**
 * Twitter social network startegy handler
 */
class SocialNetworkTwitter extends SocialNetworkStrategy {
  private static _instance: SocialNetworkTwitter;

  /**
   * Private constructor to allow singleton class instance
   */
  private constructor() {
    super("Twitter");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): SocialNetworkTwitter {
    if (!SocialNetworkTwitter._instance) {
      SocialNetworkTwitter._instance = new SocialNetworkTwitter();
    }
    return SocialNetworkTwitter._instance;
  }

  /**
   * Setup the passport strategy
   * 
   * @param socialNetwork 
   * @param cbUri 
   * @param fn 
   */
  public setup(socialNetwork: SocialNetworkRequestDocument, cbUri: string, fn: any): passport.Strategy {
    return new TwitterStrategy(
      {
        consumerKey: socialNetwork.social.clientId,
        consumerSecret: socialNetwork.social.clientSecret,
        callbackURL: cbUri,
        passReqToCallback: true,
      },
      fn
    );
  }
}

export const SocialNetworkTwitterCtrl = SocialNetworkTwitter.shared;
