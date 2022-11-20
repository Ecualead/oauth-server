/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { IOauth2Settings } from "../settings";

export class Settings {
  private static _instance: Settings;
  private _settings: IOauth2Settings;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {}

  /**
   * Setup the user account controller
   */
  public static setup(settings: IOauth2Settings) {
    if (!Settings._instance) {
      Settings._instance = new Settings();
      Settings._instance._settings = settings;
    } else {
      throw new Error("Settings already configured");
    }
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Settings {
    if (!Settings._instance) {
      throw new Error("Settings isn't configured");
    }
    return Settings._instance;
  }

  public get value(): IOauth2Settings {
    return this._settings;
  }
}
