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
import { prop, index } from "@typegoose/typegoose";
import { NOTIFICATION_TYPES } from "@/Projects/models/projects.enum";

export class ProjectNotificationsUrl {
  @prop()
  confirm?: string;

  @prop()
  recover?: string;
}

@index({ type: 1 })
export class ProjectNotification {
  @prop({ enum: NOTIFICATION_TYPES, required: true, default: NOTIFICATION_TYPES.NT_UNKNOWN })
  type!: NOTIFICATION_TYPES;

  @prop({ required: true, default: false })
  signup?: boolean;

  @prop({ required: true, default: false })
  confirm?: boolean;

  @prop({ required: true, default: false })
  signin?: boolean;

  @prop({ required: true, default: false })
  chPwd?: boolean;

  @prop({ required: true, default: false })
  recover?: boolean;

  @prop()
  urls?: ProjectNotificationsUrl;
}
