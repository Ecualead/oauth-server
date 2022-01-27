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
import { Strategy as FacebookStrategy } from "passport-facebook";
import { ExternalAuthSchema } from "./base.controller";
import { IExternalAuth } from "../../../settings";
import { createHmac } from "crypto";
import { Logger } from "@ecualead/server";

const logger = new Logger("FacebookOAuth2");

/**
 * Facebook social network startegy handler
 */
export class ExternalAuthFacebook extends ExternalAuthSchema {
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
   */
  public setup(socialNetwork: IExternalAuth, cbUri: string, fn: any): passport.Strategy {
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
   */
  public id(profile: any): string {
    return profile["id"];
  }

  /**
   * Get social profile first name
   */
  public name(profile: any): string {
    if (profile["first_name"]) {
      return profile["first_name"];
    }

    const names: string[] = profile.displayName ? profile.displayName.split(" ") : [];
    return names.length > 0 ? names[0] : "Unknown";
  }

  /**
   * Get social profile last name
   */
  public lastname(profile: any): string {
    if (profile["last_name"]) {
      return profile["last_name"];
    }

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
   */
  public email(profile: any): string {
    return profile["email"];
  }

  /**
   * Get social profile phone
   */
  public phone(profile: any): string {
    return profile["phone"];
  }

  private static base64Decode(str: string): string {
    const tmp = str.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(tmp, "base64").toString("utf8");
  }

  public static decodeSignedRequest(signedRequest: string, secret: string): any {
    const request = signedRequest.split(".", 2);
    if (request.length !== 2) {
      logger.error("Invalid signed request", signedRequest);
      return null;
    }

    const sig = ExternalAuthFacebook.base64Decode(request[0]);
    const data = JSON.parse(ExternalAuthFacebook.base64Decode(request[1]));

    const expectedSig = createHmac("sha256", secret).update(request[1]).digest("base64");
    if (sig !== expectedSig) {
      logger.error("Signature mismatch", {
        request: signedRequest,
        sig: sig,
        data: data,
        expectedSig: expectedSig
      });
      return null;
    }

    return data;
  }
}

export const FacebookCtrl = ExternalAuthFacebook.shared;
