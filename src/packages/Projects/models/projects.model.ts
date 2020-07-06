import {
  prop,
  mongoose,
  index,
  DocumentType,
  getModelForClass,
  Ref,
} from "@typegoose/typegoose";
import { BaseModel, Objects } from "@ikoabo/core_srv";
import { ProjectLink } from "./projects.links.model";
import { ProjectSetting } from "./projects.settings.model";
import { Domain } from "@/packages/Domains/models/domains.model";
import { Module } from "@/packages/Modules/models/modules.model";

@index({ domain: 1 })
@index({ cannonical: 1 }, { unique: true })
@index({ name: 1 })
export class Project extends BaseModel {
  @prop({ required: true, ref: Domain })
  domain?: Ref<Domain>;

  @prop({ required: true, unique: true })
  cannonical?: string;

  @prop({ required: true })
  name!: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop()
  links?: ProjectLink;

  @prop({ type: String })
  scope?: string[];

  @prop()
  settings?: ProjectSetting;

  @prop({ type: mongoose.Types.ObjectId, ref: Module })
  modules?: Ref<Module>[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Project, {
      schemaOptions: {
        collection: "projects",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              domain: ret.domain,
              name: ret.name,
              image: ret.image,
              description: ret.description,
              cannonical: ret.cannonical,
              links: {
                app: Objects.get(ret, "links.app"),
                web: Objects.get(ret, "links.web"),
                facebook: Objects.get(ret, "links.facebook"),
                twitter: Objects.get(ret, "links.twitter"),
                instagram: Objects.get(ret, "links.instagram"),
                youtube: Objects.get(ret, "links.youtube"),
                privacy: Objects.get(ret, "links.privacy"),
                terms: Objects.get(ret, "links.terms"),
              },
              status: ret.status,
              createdAt: ret.createdAt,
              updatedAt: ret.updatedAt,
            };
          },
        },
      },
      options: { automaticName: false },
    });
  }
}

export type ProjectDocument = DocumentType<Project>;
export const ProjectModel: mongoose.Model<ProjectDocument> = Project.shared;
