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

export abstract class SocialNetworkStrategy {
  private _name: string;
  protected _logger: Logger;

  constructor(name: string) {
    this._name = name;
    this._logger = new Logger(`SocialNetworkStrategy:${name}`);
  }

  public abstract setup(socialNetwork: SocialNetworkRequestDocument, cbUri: string, fn: any): passport.Strategy;
  public abstract name(profile: any): string;
  public abstract lastname(profile: any): string;
  public abstract email(profile: any): string;
  public abstract phone(profile: any): string;
}
