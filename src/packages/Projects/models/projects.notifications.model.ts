import { prop } from "@typegoose/typegoose";
import { NOTIFICATION_TYPES } from "./projects.enum";

export class ProjectNotificationsUrl {
  @prop()
  confirm?: string;

  @prop()
  recover?: string;
}

export class ProjectNotification {
  @prop({ required: true, default: NOTIFICATION_TYPES.NT_UNKNOWN })
  type?: number;

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
