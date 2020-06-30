import { prop, arrayProp, Index } from "@typegoose/typegoose";
import { PROFILE_FIELD_TYPES } from "./projects.enum";

Index({ name: 1 });
Index({ type: 1 });
class ProjectProfileField {
  @prop({ required: true })
  name: string;

  @prop()
  description?: string;

  @prop({ required: true, default: PROFILE_FIELD_TYPES.PF_UNKNOWN })
  type: number;

  @prop()
  defaultValue?: string;

  @prop({ default: false })
  required?: boolean;
}

class ProjectProfileFieldIndex {
  @arrayProp({ type: String })
  names!: string[];
}

export class ProjectProfile {
  @arrayProp({ type: ProjectProfileField })
  fields?: ProjectProfileField[];

  @arrayProp({ type: ProjectProfileFieldIndex })
  indexes: ProjectProfileFieldIndex[];

  @arrayProp({ type: ProjectProfileFieldIndex })
  unique: ProjectProfileFieldIndex[];
}
