/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { prop } from "@typegoose/typegoose";
import { ProjectSocialNetworkSettings } from "@/Projects/models/projects.socialnetworks.model";
import {
  PROJECT_RECOVER_TYPE,
  PROJECT_LIFETIME_TYPES,
  PROJECT_EMAIL_CONFIRMATION,
} from "@/Projects/models/projects.enum";
import { ProjectNotification } from "@/Projects/models/projects.notifications.model";

class ProjectPasswordPolicy {
  @prop({ required: true, default: 5 })
  len!: number;

  @prop({ required: true, default: true })
  upperCase!: boolean;

  @prop({ required: true, default: true })
  lowerCase!: boolean;

  @prop({ required: true, default: false })
  specialChars!: boolean;

  @prop({ required: true, default: true })
  numbers!: boolean;
}

class ProjectTokenLifetime {
  @prop({
    required: true,
    default: PROJECT_LIFETIME_TYPES.LT_ONE_MONTH,
  })
  accessToken!: number;

  @prop({
    required: true,
    default: PROJECT_LIFETIME_TYPES.LT_ONE_YEAR,
  })
  refreshToken!: number;
}

class ProjectEmailConfirmation {
  @prop({
    enum: PROJECT_EMAIL_CONFIRMATION,
    required: true,
    default: PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED,
  })
  type: PROJECT_EMAIL_CONFIRMATION;

  @prop({
    required: true,
    default: PROJECT_LIFETIME_TYPES.LT_ONE_MONTH,
  })
  time: number;
}

export class ProjectSetting {
  @prop({ type: ProjectSocialNetworkSettings })
  socialNetworks?: ProjectSocialNetworkSettings[];

  @prop()
  tokenLifetime!: ProjectTokenLifetime;

  @prop({
    enum: PROJECT_RECOVER_TYPE,
    required: true,
    default: PROJECT_RECOVER_TYPE.RT_DISABLED,
  })
  recover?: PROJECT_RECOVER_TYPE;

  @prop({ type: String })
  restrictIps?: string[];

  @prop()
  emailConfirmation?: ProjectEmailConfirmation;

  @prop()
  passwordPolicy?: ProjectPasswordPolicy;

  @prop({ type: ProjectNotification })
  notifications: ProjectNotification[];
}
