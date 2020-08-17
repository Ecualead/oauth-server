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
import { prop } from "@typegoose/typegoose";

export class ProjectLink {
  @prop()
  app?: string;

  @prop()
  web?: string;

  @prop()
  facebook?: string;

  @prop()
  twitter?: string;

  @prop()
  youtube?: string;

  @prop()
  instagram?: string;

  @prop()
  privacy?: string;

  @prop()
  terms?: string;
}
