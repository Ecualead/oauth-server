import { prop, index } from "@typegoose/typegoose";
import { SOCIAL_NETWORK_TYPES } from "@/Projects/models/projects.enum";

class ProjectSocialProfileMapping {
  @prop({ requried: true })
  key!: string;

  @prop({ requried: true })
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

  @prop()
  profile?: string[];

  @prop()
  profileMap?: ProjectSocialProfileMapping[];

  @prop()
  description?: string;
}
