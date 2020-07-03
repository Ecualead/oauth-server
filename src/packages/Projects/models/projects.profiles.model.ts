import { prop, Index } from "@typegoose/typegoose";
import { PROFILE_FIELD_TYPES } from "./projects.enum";

Index({ name: 1 });
Index({ type: 1 });
export class ProjectProfileField {
  @prop({ required: true })
  name: string;

  @prop()
  description?: string;

  @prop({
    enum: PROFILE_FIELD_TYPES,
    required: true,
    default: PROFILE_FIELD_TYPES.PF_UNKNOWN,
  })
  type: PROFILE_FIELD_TYPES;

  @prop()
  defaultValue?: string;

  @prop({ default: false })
  required?: boolean;
}

export class ProjectProfileFieldIndex {
  @prop()
  names!: string[];
}

export class ProjectProfile {
  @prop()
  fields?: ProjectProfileField[];

  @prop()
  indexes: ProjectProfileFieldIndex[];

  @prop()
  unique: ProjectProfileFieldIndex[];
}
