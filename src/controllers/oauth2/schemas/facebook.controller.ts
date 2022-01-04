/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { ExternalAuthSchema } from "@/controllers/oauth2/schemas/base.controller";
import { ProjectExternalAuthDocument } from "@/models/project/external-auth.model";

/**
 * Facebook social network startegy handler
 */
class ExternalAuthFacebook extends ExternalAuthSchema {
  private static _instance: ExternalAuthFacebook;

  /**
   * Private constructor to allow singleton class instance
   */
  private constructor() {
    super("Facebook");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): ExternalAuthFacebook {
    if (!ExternalAuthFacebook._instance) {
      ExternalAuthFacebook._instance = new ExternalAuthFacebook();
    }
    return ExternalAuthFacebook._instance;
  }

  /**
   * Setup the passport strategy
   *
   * @param socialNetwork
   * @param cbUri
   * @param fn
   */
  public setup(
    socialNetwork: ProjectExternalAuthDocument,
    cbUri: string,
    fn: any
  ): passport.Strategy {
    this._logger.debug("Initialize new passport strategy", socialNetwork);

    return new FacebookStrategy(
      {
        clientID: socialNetwork.clientId,
        clientSecret: socialNetwork.clientSecret,
        callbackURL: cbUri,
        profileFields: socialNetwork.profile,
        enableProof: true,
        passReqToCallback: true
      },
      fn
    );
  }

  /**
   * Get social profile id
   *
   * @param profile
   */
  public id(profile: any): string {
    /* TODO XXX Handle External auth ID */
    return "HandleID";
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

export const FacebookCtrl = ExternalAuthFacebook.shared;
