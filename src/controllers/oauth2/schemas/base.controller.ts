/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Logger } from "@ikoabo/core";
import passport from "passport";
import { ProjectExternalAuthDocument } from "@/models/project/external-auth.model";

export abstract class ExternalAuthSchema {
  private _name: string;
  protected _logger: Logger;

  constructor(name: string) {
    this._name = name;
    this._logger = new Logger(`ExternalAuth:${name}`);
  }

  public abstract setup(
    externalAuth: ProjectExternalAuthDocument,
    cbUri: string,
    fn: any
  ): passport.Strategy;
  public abstract id(profile: any): string;
  public abstract name(profile: any): string;
  public abstract lastname(profile: any): string;
  public abstract email(profile: any): string;
  public abstract phone(profile: any): string;
}
