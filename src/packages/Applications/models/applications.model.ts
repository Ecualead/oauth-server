import mongoose from "mongoose";
import { Token, BaseModel } from "@ikoabo/core_srv";
import {
  getModelForClass,
  prop,
  pre,
  DocumentType,
  index,
  Ref,
} from "@typegoose/typegoose";
import { APPLICATION_TYPES } from "@/Applications/models/applications.enum";
import { Project } from "@/Projects/models/projects.model";
import { Client } from "oauth2-server";

@pre<Application>("save", function (next) {
  const obj: any = this;
  if (obj.isNew) {
    obj.secret = Token.longToken;
  }
  next();
})
@index({ project: 1 })
@index({ type: 1 })
export class Application extends BaseModel {
  @prop({ required: true })
  name!: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({ enum: APPLICATION_TYPES, required: true, default: APPLICATION_TYPES.APP_UNKNOWN })
  type?: APPLICATION_TYPES;

  @prop({ required: true, ref: Project })
  project?: Ref<Project>;

  @prop({ required: true })
  secret?: string;

  @prop({ required: true, default: "default" })
  domain?: string;

  @prop({ type: String })
  grants?: string[];

  @prop({ type: String })
  scope?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Application, {
      schemaOptions: {
        collection: "applications",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              project: ret.project,
              name: ret.name,
              image: ret.image,
              description: ret.description,
              type: ret.type,
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

  public getBase64Secret?(): string {
    return Buffer.from([(<any>this).id, this.secret].join(":")).toString(
      "base64"
    );
  }

  public toClient?(): Client {
    const obj: any = this;
    let client = {
      id: obj.id,
      redirectUris: obj.redirectUri,
      grants: obj.grants,
      accessTokenLifetime: obj.settings.lifetime.accessToken,
      refreshTokenLifetime: obj.settings.lifetime.refreshToken,
      scope: this.scope,
      project: this.project,
    };
    return client;
  }
}

export type ApplicationDocument = DocumentType<Application>;
export const ApplicationModel: mongoose.Model<ApplicationDocument> =
  Application.shared;
