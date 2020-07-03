import mongoose from "mongoose";
import { Arrays, Token, BaseModel } from "@ikoabo/core_srv";
import {
  getModelForClass,
  prop,
  pre,
  DocumentType,
  index,
  modelOptions,
} from "@typegoose/typegoose";
import { APPLICATION_TYPES } from "@/Applications/models/applications.enum";
import { Project, ProjectDocument } from "@/Projects/models/projects.model";
import { Client } from "oauth2-server";

export class ApplicationRestrictionIp {
  @prop({ required: true })
  ip: string;

  @prop({ required: true })
  type: number;
}

export class ApplicationSettingsLifetime {
  @prop()
  accessToken?: number;

  @prop()
  refreshToken?: number;
}

export class ApplicationSettings {
  @prop()
  accessTokenLifetime?: number;

  @prop()
  refreshTokenLifetime?: number;

  @prop()
  recover?: number;

  @prop()
  restrictIps?: ApplicationRestrictionIp[];
}

@modelOptions({
  schemaOptions: { collection: "applications", timestamps: true },
  options: { automaticName: false },
})
@pre<Application>("save", function (next) {
  const obj: any = this;
  if (obj.isNew) {
    obj.secret = Token.longToken;
  }
  obj.scope = Arrays.force(obj.scope);
  next();
})
@pre<Application>("findOneAndUpdate", function (next) {
  const obj: any = this;
  obj.scope = Arrays.force(obj.scope);
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

  @prop({ required: true, default: APPLICATION_TYPES.APP_UNKNOWN })
  type?: number;

  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Project })
  project?: string | ProjectDocument;

  @prop({ required: true })
  secret?: string;

  @prop({ required: true, default: "default" })
  domain?: string;

  @prop()
  grants?: string[];

  @prop()
  settings?: ApplicationSettings;

  @prop()
  scope?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Application);
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
