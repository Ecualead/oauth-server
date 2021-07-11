/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import passport from "passport";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { ExternalAuthSchema } from "@/controllers/oauth2/schemas/base.controller";
import { ProjectExternalAuthDocument } from "@/models/project/external-auth.model";
import { Objects } from "@ikoabo/core";

/**
 * Google social network startegy handler
 */
class ExternalAuthGoogle extends ExternalAuthSchema {
  private static _instance: ExternalAuthGoogle;

  /**
   * Private constructor to allow singleton class instance
   */
  private constructor() {
    super("Google");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): ExternalAuthGoogle {
    if (!ExternalAuthGoogle._instance) {
      ExternalAuthGoogle._instance = new ExternalAuthGoogle();
    }
    return ExternalAuthGoogle._instance;
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

    return new GoogleStrategy(
      <any>{
        clientID: socialNetwork.clientId,
        clientSecret: socialNetwork.clientSecret,
        callbackURL: cbUri,
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
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
    return profile.id;
  }

  /**
   * Get social profile first name
   *
   * @param profile
   */
  public name(profile: any): string {
    return Objects.get(profile, "name.givenName", profile.displayName.split(" ")[0] || "");
  }

  /**
   * Get social profile last name
   *
   * @param profile
   */
  public lastname(profile: any): string {
    return Objects.get(profile, "name.familyName", profile.displayName.split(" ")[1] || "");
  }

  /**
   * Get social profile email
   *
   * @param profile
   */
  public email(profile: any): string {
    return Objects.get(profile, "emails.0.value");
  }

  /**
   * Get social profile phone
   * @param profile
   */
  public phone(_profile: any): string {
    return null;
  }
}

export const GoogleCtrl = ExternalAuthGoogle.shared;
