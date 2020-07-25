/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { prop, index } from "@typegoose/typegoose";
import { SOCIAL_NETWORK_TYPES } from "@/Projects/models/projects.enum";

class ProjectSocialProfileMapping {
  @prop({ requried: true })
  key!: string;

  @prop({ type: String, requried: true })
  fields!: string[];
}

@index({ type: 1 }, { unique: true })
@index({ clientId: 1 }, { unique: true })
@index({ clientSecret: 1 })
export class ProjectSocialNetworkSettings {
  @prop({
    enum: SOCIAL_NETWORK_TYPES,
    required: true,
    unique: true,
    default: SOCIAL_NETWORK_TYPES.SN_UNKNOWN,
  })
  type!: SOCIAL_NETWORK_TYPES;

  @prop({ required: true, unique: true })
  clientId!: string;

  @prop({ required: true })
  clientSecret!: string;

  @prop()
  scope?: string;

  @prop({ type: String })
  profile?: string[];

  @prop({ type: ProjectSocialProfileMapping })
  profileMap?: ProjectSocialProfileMapping[];

  @prop()
  description?: string;
}
