/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  prop,
  pre,
  index,
  modelOptions,
  getModelForClass,
  DocumentType,
} from "@typegoose/typegoose";
import { BaseModel, Arrays } from "@ikoabo/core_srv";
import { ERRORS } from "@ikoabo/auth_srv";
import { EMAIL_STATUS, RECOVER_TOKEN_STATUS } from "./accounts.enum";

@index({ token: 1 })
@index({ status: 1 })
@index({ expires: 1 })
export class AccountToken {
  @prop()
  token?: string;

  @prop({ required: true, default: 0 })
  attempts?: number;

  @prop({ required: true, default: RECOVER_TOKEN_STATUS.RTS_DISABLED })
  status?: number;

  @prop({ required: true, default: 0 })
  expires?: number;
}

@index({ email: 1 }, { unique: true })
export class AccountEmail {
  @prop({ required: true, unique: true })
  email!: string;

  @prop({ required: true, default: EMAIL_STATUS.ES_REGISTERED })
  status?: number;

  @prop({ required: true })
  confirm!: AccountToken;
}

@modelOptions({
  schemaOptions: { collection: "accounts", timestamps: true },
  options: { automaticName: false },
})
@pre<Account>("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  /* Update the user crypt password */
  bcrypt.hash(this.password, 10, (err: mongoose.Error, hash) => {
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
  bcrypt.hash(
    this.getUpdate().$set["password"],
    10,
    (err: mongoose.Error, hash) => {
      if (err) {
        return next(err);
      }
      this.getUpdate().$set["password"] = hash;
      next();
    }
  );
})
@index({ email: 1 }, { unique: true })
@index({ code: 1 })
export class Account extends BaseModel {
  @prop()
  name?: string;

  @prop()
  lastname?: string;

  @prop()
  initials?: string;

  @prop()
  color1?: string;

  @prop()
  color2?: string;

  @prop({ required: true })
  code?: string;

  @prop({ required: true, unique: true })
  email?: string;

  @prop({ type: AccountEmail })
  emails?: AccountEmail[];

  @prop()
  phone?: string;

  @prop({ required: true })
  password?: string;

  @prop()
  passwordExpires?: number;

  @prop()
  passwordUpdated?: number;

  @prop()
  confirmationExpires?: number;

  @prop()
  recover?: AccountToken;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Account, {
      schemaOptions: {
        collection: "accounts.users",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              user: ret.id,
              name: ret.name,
              lastname: ret.lastname,
              code: ret.code,
              email: ret.email,
              phone: ret.phone,
              referral: ret.referral,
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

  public validPassword?(password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!password || !("password" in this)) {
        reject({ boError: ERRORS.INVALID_CREDENTIALS });
      }
      bcrypt.compare(
        password,
        this.password,
        (err: mongoose.Error, isMatch: boolean) => {
          if (isMatch) {
            return resolve();
          }

          reject(err ? err : { boError: ERRORS.INVALID_CREDENTIALS });
        }
      );
    });
  }

  public locateEmail?(email: string): AccountEmail | null {
    let itr = 0;
    while (itr < this.emails.length && this.emails[itr].email !== email) {
      itr++;
    }
    return itr < this.emails.length ? this.emails[itr] : null;
  }
}

export type AccountDocument = DocumentType<Account>;
export const AccountModel: mongoose.Model<AccountDocument> = Account.shared;
