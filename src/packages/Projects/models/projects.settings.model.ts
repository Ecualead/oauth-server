import { arrayProp, prop } from "@typegoose/typegoose";
import { ProjectSocialNetworkSettings } from "@/Projects/models/projects.socialnetworks.model";
import {
  PROJECT_RECOVER_TYPE,
  PROJECT_LIFETIME_TYPES,
  PROJECT_EMAIL_CONFIRMATION,
} from "./projects.enum";
import { ProjectNotification } from "./projects.notifications.model";
import { ProjectProfile } from "./projects.profiles.model";

class ProjectPasswordPolicy {
  @prop({ required: true, default: 5 })
  len?: number;

  @prop({ required: true, default: true })
  upperCase?: boolean;

  @prop({ required: true, default: true })
  lowerCase?: boolean;

  @prop({ required: true, default: false })
  specialChars?: boolean;

  @prop({ required: true, default: true })
  numbers?: boolean;
}

class ProjectTokenLifetime {
  @prop({ required: true, default: PROJECT_LIFETIME_TYPES.LT_ONE_MONTH })
  accessToken?: number;

  @prop({ required: true, default: PROJECT_LIFETIME_TYPES.LT_ONE_YEAR })
  refreshToken?: number;
}

class ProjectEmailConfirmation {
  @prop({
    required: true,
    default: PROJECT_EMAIL_CONFIRMATION.EC_CONFIRMATION_NOT_REQUIRED,
  })
  type: number;

  @prop({ required: true, default: PROJECT_LIFETIME_TYPES.LT_ONE_MONTH })
  time: number;
}

export class ProjectSetting {
  @arrayProp({ type: ProjectSocialNetworkSettings })
  socialNetworks?: ProjectSocialNetworkSettings[];

  @prop()
  tokenLifetime?: ProjectTokenLifetime;

  @prop({ required: true, dafault: PROJECT_RECOVER_TYPE.RT_DISABLED })
  recover?: number;

  @arrayProp({ type: String })
  restrictIps?: string[];

  @prop()
  emailConfirmation?: ProjectEmailConfirmation;

  @prop()
  passwordPolicy?: ProjectPasswordPolicy;

  @arrayProp({ type: ProjectNotification })
  notifications: ProjectNotification[];

  @prop()
  profile?: ProjectProfile;
}
