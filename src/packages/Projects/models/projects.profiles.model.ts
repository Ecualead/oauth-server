import { prop, Index } from "@typegoose/typegoose";
import { PROFILE_FIELD_TYPES } from "@/Projects/models/projects.enum";

Index({ name: 1 }, { unique: true });
Index({ type: 1 });
export class ProjectProfileField {
  @prop({ required: true, unique: true })
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
  @prop({ type: String })
  names!: string[];
}

export class ProjectProfile {
  @prop({ type: ProjectProfileField })
  fields?: ProjectProfileField[];

  @prop({ type: ProjectProfileFieldIndex })
  indexes: ProjectProfileFieldIndex[];

  @prop({ type: ProjectProfileFieldIndex })
  unique: ProjectProfileFieldIndex[];
}
