/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { ExternalAuthSchema } from "./base.controller";
import { IExternalAuth } from "../../../settings";

/**
 * Twitter social network startegy handler
 */
class ExternalAuthTwitter extends ExternalAuthSchema {
  private static _instance: ExternalAuthTwitter;

  /**
   * Private constructor to allow singleton class instance
   */
  private constructor() {
    super("Twitter");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): ExternalAuthTwitter {
    if (!ExternalAuthTwitter._instance) {
      ExternalAuthTwitter._instance = new ExternalAuthTwitter();
    }
    return ExternalAuthTwitter._instance;
  }

  /**
   * Setup the passport strategy
   */
  public setup(socialNetwork: IExternalAuth, cbUri: string, fn: any): passport.Strategy {
    this._logger.debug("Initialize new passport strategy", socialNetwork);

    return new TwitterStrategy(
      {
        consumerKey: socialNetwork.clientId,
        consumerSecret: socialNetwork.clientSecret,
        callbackURL: cbUri,
        passReqToCallback: true
      },
      fn
    );
  }

  /**
   * Get social profile id
   */
  public id(profile: any): string {
    /* TODO XXX Handle External auth ID */
    return "HandleID";
  }

  /**
   * Get social profile first name
   */
  public name(_profile: any): string {
    return "Unknown";
  }

  /**
   * Get social profile last name
   */
  public lastname(_profile: any): string {
    return "Unknown";
  }

  /**
   * Get social profile email
   */
  public email(_profile: any): string {
    return null;
  }

  /**
   * Get social profile phone
   */
  public phone(_profile: any): string {
    return null;
  }
}

export const TwitterCtrl = ExternalAuthTwitter.shared;
