/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { SocialNetworkStrategy } from "@/SocialNetworks/controllers/strategies/base.strategy.controller";
import { SocialNetworkRequestDocument } from "@/SocialNetworks/models/social.networks.request.model";

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
  public setup(
    socialNetwork: SocialNetworkRequestDocument,
    cbUri: string,
    fn: any
  ): passport.Strategy {
    this._logger.debug("Initialize new passport strategy", socialNetwork);

    return new FacebookStrategy(
      {
        clientID: socialNetwork.social.clientId,
        clientSecret: socialNetwork.social.clientSecret,
        callbackURL: cbUri,
        profileFields: socialNetwork.social.profile,
        enableProof: true,
        passReqToCallback: true
      },
      fn
    );
  }

  /**
   * Get social profile first name
   *
   * @param profile
   */
  public name(profile: any): string {
    const names: string[] = profile.displayName ? profile.displayName.split(" ") : [];
    return names.length > 0 ? names[0] : "Unknown";
  }

  /**
   * Get social profile last name
   *
   * @param profile
   */
  public lastname(profile: any): string {
    const names: string[] = profile.displayName ? profile.displayName.split(" ") : [];
    let response = "Unknown";
    if (names.length > 1) {
      names.splice(0, 1);
      response = names.join(" ");
    }
    return response;
  }

  /**
   * Get social profile email
   *
   * @param profile
   */
  public email(_profile: any): string {
    return null;
  }

  /**
   * Get social profile phone
   * @param profile
   */
  public phone(_profile: any): string {
    return null;
  }
}

export const SocialNetworkFacebookCtrl = SocialNetworkFacebook.shared;
