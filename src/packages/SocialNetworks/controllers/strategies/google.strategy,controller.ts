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
import { OAuth2Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth";
import { SocialNetworkStrategy } from "@/SocialNetworks/controllers/strategies/base.strategy.controller";
import { SocialNetworkRequestDocument } from "@/SocialNetworks/models/social.networks.request.model";

/**
 * Google social network startegy handler
 */
class SocialNetworkGoogle extends SocialNetworkStrategy {
  private static _instance: SocialNetworkGoogle;

  /**
   * Private constructor to allow singleton class instance
   */
  private constructor() {
    super("Google");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): SocialNetworkGoogle {
    if (!SocialNetworkGoogle._instance) {
      SocialNetworkGoogle._instance = new SocialNetworkGoogle();
    }
    return SocialNetworkGoogle._instance;
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

    return new GoogleStrategy(
      <any>{
        clientID: socialNetwork.social.clientId,
        clientSecret: socialNetwork.social.clientSecret,
        callbackURL: cbUri,
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
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
  public name(_profile: any): string {
    return "Unknown";
  }

  /**
   * Get social profile last name
   *
   * @param profile
   */
  public lastname(_profile: any): string {
    return "Unknown";
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

export const SocialNetworkGoogleCtrl = SocialNetworkGoogle.shared;
