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
import { AUTH_ERRORS } from "@ikoabo/auth";
import { BaseModel } from "@ikoabo/server";
import { prop, pre, index, getModelForClass, DocumentType, Ref } from "@typegoose/typegoose";
import { hash, compare } from "bcrypt";
import mongoose from "mongoose";
import { Project } from "@/models/project/project.model";

@pre<Account>("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  /* Update the user crypt password */
  hash(this.password, 10, (err: mongoose.Error, hash) => {
    if (err) {
      return next(err);
    }
    this.password = hash;
    next();
  });
})
@pre<Account>("findOneAndUpdate", function (next) {
  if (!this.getUpdate().$set["password"]) {
    next();
  }

  /* Update the user crypt password */
  hash(this.getUpdate().$set["password"], 10, (err: mongoose.Error, hash) => {
    if (err) {
      return next(err);
    }
    this.getUpdate().$set["password"] = hash;
    next();
  });
})
@index({ project: 1 })
@index({ code: 1 })
@index({ project: 1, code: 1 }, { unique: true })
export class Account extends BaseModel {
  @prop({ required: true, ref: Project })
  project!: Ref<Project>;

  @prop()
  name?: string;

  @prop()
  lastname1?: string;

  @prop()
  lastname2?: string;

  @prop()
  initials?: string;

  @prop()
  color1?: string;

  @prop()
  color2?: string;

  @prop({ required: true })
  code!: string;

  @prop()
  password?: string;

  @prop()
  passwordExpires?: number;

  @prop()
  passwordUpdated?: number;

  @prop()
  confirmationExpires?: number;

  @prop()
  referral?: string;

  @prop({ ref: Account })
  parent?: Ref<Account>;

  @prop({ default: 0 })
  type?: number;

  @prop()
  custom1?: string;

  @prop()
  custom2?: string;

  @prop({ type: String })
  scope?: string[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Account, {
      schemaOptions: {
        collection: "accounts",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              user: ret.id,
              name: ret.name,
              lastname1: ret.lastname1,
              lastname2: ret.lastname2,
              code: ret.code,
              referral: ret.referral,
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

  public validPassword?(password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!password || !("password" in this)) {
        reject({ boError: AUTH_ERRORS.INVALID_CREDENTIALS });
      }
      compare(password, this.password, (err: mongoose.Error, isMatch: boolean) => {
        if (isMatch) {
          return resolve();
        }

        reject(err ? err : { boError: AUTH_ERRORS.INVALID_CREDENTIALS });
      });
    });
  }
}

export type AccountDocument = DocumentType<Account>;
export const AccountModel: mongoose.Model<AccountDocument> = Account.shared;
