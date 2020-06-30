import {
  prop,
  mongoose,
  arrayProp,
  Index,
  DocumentType,
  getModelForClass,
  pre,
} from "@typegoose/typegoose";
import { BaseModel, Arrays } from "@ikoabo/core_srv";
import { ProjectLink } from "./projects.links.model";
import { ProjectSetting } from "./projects.settings.model";

Index({ domain: 1 });
Index({ cannonical: 1 }, { unique: true });
Index({ name: 1 });
export class Project extends BaseModel {
  @prop({ type: mongoose.Types.ObjectId, required: true, ref: "domains" })
  domain?: string;

  @prop({ required: true, unique: true })
  cannonical?: string;

  @prop({ required: true })
  name!: string;

  @prop()
  description?: string;

  @prop()
  links?: ProjectLink;

  @arrayProp({ type: String })
  scope?: string[];

  @prop()
  settings?: ProjectSetting;

  @arrayProp({ items: mongoose.Types.ObjectId, ref: "modules" })
  modules?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Project);
  }
}

pre<Project>("save", function () {
  this["scope"] = Arrays.force(this["scope"]);
});

pre<Project>("findOneAndUpdate", function () {
  this["scope"] = Arrays.force(this["scope"]);
});

export type ProjectDocument = DocumentType<Project>;
export const ProjectModel: mongoose.Model<ProjectDocument> = Project.shared;
