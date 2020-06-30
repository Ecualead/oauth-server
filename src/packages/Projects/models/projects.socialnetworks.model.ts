import { prop, arrayProp, Index } from "@typegoose/typegoose";
import { SOCIAL_NETWORK_TYPES } from "@/Projects/models/projects.enum";

class ProjectSocialProfileMapping {
  @prop()
  key?: string;

  @arrayProp({ type: String })
  fields?: string[];
}

@Index({ clientId: 1 })
@Index({ clientSecret: 1 })
export class ProjectSocialNetworkSettings {
  @prop({ required: true, default: SOCIAL_NETWORK_TYPES.SN_UNKNOWN })
  name!: number;

  @prop({ required: true, unique: true })
  clientId!: string;

  @prop({ required: true })
  clientSecret!: string;

  @prop()
  scope?: string;

  @arrayProp({ type: String, required: true })
  profile?: string[];

  @arrayProp({ type: ProjectSocialProfileMapping })
  profileMap?: ProjectSocialProfileMapping[];

  @prop()
  description?: string;
}
