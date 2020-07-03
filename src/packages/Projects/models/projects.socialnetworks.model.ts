import { prop, index } from "@typegoose/typegoose";
import { SOCIAL_NETWORK_TYPES } from "@/Projects/models/projects.enum";

class ProjectSocialProfileMapping {
  @prop()
  key?: string;

  @prop()
  fields?: string[];
}

@index({ clientId: 1 })
@index({ clientSecret: 1 })
export class ProjectSocialNetworkSettings {
  @prop({ required: true, default: SOCIAL_NETWORK_TYPES.SN_UNKNOWN })
  name!: number;

  @prop({ required: true, unique: true })
  clientId!: string;

  @prop({ required: true })
  clientSecret!: string;

  @prop()
  scope?: string;

  @prop()
  profile?: string[];

  @prop()
  profileMap?: ProjectSocialProfileMapping[];

  @prop()
  description?: string;
}
