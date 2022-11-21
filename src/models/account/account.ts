/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AUTH_ERRORS } from "@ecualead/auth";
import { BaseModel, HTTP_STATUS } from "@ecualead/server";
import { prop, pre, index, getModelForClass, DocumentType } from "@typegoose/typegoose";
import { hash, compare } from "bcrypt";
import mongoose from "mongoose";

@index({ token: 1 })
@index({ status: 1 })
@index({ expire: 1 })
export class AccountReferral {
  @prop({ required: true })
  code!: string;

  @prop()
  parent?: string;

  @prop({ type: String, default: [] })
  tree?: string[];
}

@pre<Account>("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  /* Update the user crypt password */
  hash(this.password, 10, (err: any, hash) => {
    if (err) {
      return next(err);
    }
    this.password = hash;
    this.passwordUpdated = Date.now();
    next();
  });
})
@pre<Account>("findOneAndUpdate", function (next) {
  if (!(this.getUpdate() as any)["$set"]["password"]) {
    next();
  }

  /* Update the user crypt password */
  hash((this.getUpdate() as any)["$set"]["password"], 10, (err: any, hash) => {
    if (err) {
      return next(err);
    }
    (this.getUpdate() as any)["$set"]["password"] = hash;
    (this.getUpdate() as any)["$set"]["passwordUpdated"] = Date.now();
    next();
  });
})
@index({ type: 1 })
export class Account extends BaseModel {
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

  @prop()
  password?: string;

  @prop()
  passwordUpdated?: number;

  @prop()
  confirmationExpires?: number;

  @prop({ default: 0 })
  type?: number;

  @prop({ type: String })
  scope?: string[];

  @prop()
  referral?: AccountReferral;

  @prop({ required: true, default: 0 })
  external?: number;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Account, {
      schemaOptions: {
        collection: "oauth2.accounts",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              uid: ret.id,
              name: ret.name,
              lastname1: ret.lastname1,
              lastname2: ret.lastname2,
              referral: ret.referral,
              status: ret.status,
              external: ret.external,
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
      compare(password, this.password, (err: any, isMatch: boolean) => {
        if (isMatch) {
          return resolve();
        }

        reject(
          err
            ? err
            : {
              boError: AUTH_ERRORS.INVALID_CREDENTIALS,
              boStatus: HTTP_STATUS.HTTP_4XX_UNAUTHORIZED
            }
        );
      });
    });
  }
}

export type AccountDocument = DocumentType<Account>;
export const AccountModel: mongoose.Model<AccountDocument> = Account.shared;
