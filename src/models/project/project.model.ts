/**
 * Copyright (C) 2020-2021 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ikoabo/server";
import { prop, mongoose, index, DocumentType, getModelForClass, Ref } from "@typegoose/typegoose";
import { Domain } from "@/models/domain/domain.model";
import {
  TOKEN_TYPE,
  NOTIFICATION_TYPE,
  LIFETIME_TYPE,
  EMAIL_CONFIRMATION
} from "@/constants/project.enum";

class ProjectLink {
  @prop()
  app?: string;

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

class PasswordPolicy {
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

class TokenLifetime {
  @prop({ required: true, default: LIFETIME_TYPE.MONTH })
  accessToken!: number;

  @prop({ required: true, default: LIFETIME_TYPE.YEAR })
  refreshToken!: number;
}

class EmailConfirmation {
  @prop({ enum: EMAIL_CONFIRMATION, required: true, default: EMAIL_CONFIRMATION.NOT_REQUIRED })
  type: EMAIL_CONFIRMATION;

  @prop({ required: true, default: LIFETIME_TYPE.MONTH })
  time: number;
}

class AccountEvent {
  @prop({ enum: NOTIFICATION_TYPE, required: true, default: NOTIFICATION_TYPE.NONE })
  type!: NOTIFICATION_TYPE;
}

class AccountEventRecover extends AccountEvent {
  @prop({ enum: TOKEN_TYPE, required: true, default: TOKEN_TYPE.DISABLED })
  recover?: TOKEN_TYPE;

  @prop()
  recoverUrl?: string;
}

class AccountEventConfirm extends AccountEvent {
  @prop({ enum: TOKEN_TYPE, required: true, default: TOKEN_TYPE.DISABLED })
  confirm?: TOKEN_TYPE;

  @prop()
  confirmUrl?: string;
}

class AccountEvents {
  @prop()
  register?: AccountEvent;

  @prop()
  confirm?: AccountEventConfirm;

  @prop()
  login?: AccountEvent;

  @prop()
  chPwd?: AccountEvent;

  @prop()
  recover?: AccountEventRecover;
}

class ProjectSetting {
  @prop({ required: true })
  tokenLifetime!: TokenLifetime;

  @prop()
  emailConfirmation?: EmailConfirmation;

  @prop()
  passwordPolicy?: PasswordPolicy;

  @prop()
  events?: AccountEvents;
}

@index({ domain: 1 })
@index({ canonical: 1 }, { unique: true })
@index({ name: 1 })
export class Project extends BaseModel {
  @prop({ required: true, ref: Domain })
  domain?: Ref<Domain>;

  @prop({ required: true, unique: true })
  canonical?: string;

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
              canonical: ret.canonical,
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
