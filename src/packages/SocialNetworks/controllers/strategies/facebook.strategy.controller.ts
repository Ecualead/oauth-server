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
  Profile as FacebookProfile,
  Strategy as FacebookStrategy,
} from "passport-facebook";
import FacebookTokenStrategy from "passport-facebook-token";


/**
 * Facebook social network startegy handler
 */
class SocialNetworkFacebook extends SocialNetworkStrategy {
  private static _instance: SocialNetworkFacebook;

  /**
   * Private constructor to allow singleton class instance
   */
  private constructor() {
    super("Facebook");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): SocialNetworkFacebook {
    if (!SocialNetworkFacebook._instance) {
      SocialNetworkFacebook._instance = new SocialNetworkFacebook();
    }
    return SocialNetworkFacebook._instance;
  }

  /**
   * Setup the passport strategy
   * 
   * @param socialNetwork 
   * @param cbUri 
   * @param fn 
   */
  public setup(socialNetwork: SocialNetworkRequestDocument, cbUri: string, fn: any): passport.Strategy {
    return new FacebookStrategy(
      {
        clientID: socialNetwork.social.clientId,
        clientSecret: socialNetwork.social.clientSecret,
        callbackURL: cbUri,
        profileFields: socialNetwork.social.profile,
        enableProof: true,
        passReqToCallback: true,
      },
      fn
    );
  }
}

export const SocialNetworkFacebookCtrl = SocialNetworkFacebook.shared;
