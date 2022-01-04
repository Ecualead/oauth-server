/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { prop, mongoose, index, DocumentType, getModelForClass, Ref } from "@typegoose/typegoose";
import { Domain } from "@/models/domain/domain.model";
import {
  TOKEN_TYPE,
  NOTIFICATION_TYPE,
  LIFETIME_TYPE,
  EMAIL_CONFIRMATION
} from "@/constants/project.enum";

/**
 * Project related external links
 */
class ProjectLink {
  @prop()
  android?: string;

  @prop()
  ios?: string;

  @prop()
  web?: string;

  @prop()
  facebook?: string;

  @prop()
  twitter?: string;

  @prop()
  youtube?: string;

  @prop()
  instagram?: string;

  @prop()
  privacy?: string;

  @prop()
  terms?: string;
}

/**
 * User password security policy
 */
class PasswordPolicy {
  @prop({ required: true, default: LIFETIME_TYPE.INFINITE })
  lifetime?: number;

  @prop({ required: true, default: 5 })
  len!: number;

  @prop({ required: true, default: true })
  upperCase!: boolean;

  @prop({ required: true, default: true })
  lowerCase!: boolean;

  @prop({ required: true, default: false })
  specialChars!: boolean;

  @prop({ required: true, default: true })
  numbers!: boolean;
}

/**
 * Handle the access/refresh token lifetime
 */
class TokenLifetime {
  @prop({ required: true, default: LIFETIME_TYPE.MONTH })
  accessToken!: number;

  @prop({ required: true, default: LIFETIME_TYPE.YEAR })
  refreshToken!: number;
}

/**
 * Handle the email confirmation policy
 */
class EmailConfirmation {
  @prop({ enum: EMAIL_CONFIRMATION, required: true, default: EMAIL_CONFIRMATION.NOT_REQUIRED })
  type: EMAIL_CONFIRMATION;

  @prop({ required: true, default: LIFETIME_TYPE.MONTH })
  time: number;
}

/**
 * Account event notifications
 */
class AccountEvent {
  @prop({ required: true, default: NOTIFICATION_TYPE.NONE })
  type!: number;
}

/**
 * Account event notifications with related token
 */
class AccountEventToken extends AccountEvent {
  @prop({ enum: TOKEN_TYPE, required: true, default: TOKEN_TYPE.DISABLED })
  token?: TOKEN_TYPE;

  @prop()
  url?: string;
}

/**
 * Account events
 */
class AccountEvents {
  @prop({ _id: false })
  register?: AccountEvent;

  @prop({ _id: false })
  confirm?: AccountEventToken;

  @prop({ _id: false })
  login?: AccountEvent;

  @prop({ _id: false })
  chPwd?: AccountEvent;

  @prop({ _id: false })
  recover?: AccountEventToken;
}

/**
 * Project settings
 */
class ProjectSetting {
  @prop({ required: true })
  tokenLifetime!: TokenLifetime;

  @prop()
  emailConfirmation?: EmailConfirmation;

  @prop()
  passwordPolicy?: PasswordPolicy;

  @prop()
  events?: AccountEvents;

  @prop({ required: true, default: false })
  hasOauth2?: boolean;
}

/**
 * Project data model
 */
@index({ domain: 1 })
@index({ code: 1 }, { unique: true })
@index({ name: 1 })
export class Project extends BaseModel {
  @prop({ required: true, ref: Domain })
  domain?: Ref<Domain>;

  @prop({ required: true, unique: true })
  code?: string;

  @prop({ required: true })
  name!: string;

  @prop()
  image?: string;

  @prop()
  description?: string;

  @prop({ _id: false })
  links?: ProjectLink;

  @prop({ type: String, default: [] })
  scope?: string[];

  @prop({ _id: false })
  settings?: ProjectSetting;

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
              code: ret.code,
              name: ret.name,
              image: ret.image,
              description: ret.description,
              links: ret.links,
              status: ret.status,
              createdAt: ret.createdAt,
              updatedAt: ret.updatedAt
            };
          }
        }
      },
      options: { automaticName: false }
    });
  }
}

export type ProjectDocument = DocumentType<Project>;
export const ProjectModel: mongoose.Model<ProjectDocument> = Project.shared;
