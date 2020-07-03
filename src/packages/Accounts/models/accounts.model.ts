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

@index({ token: 1 })
export class AccountRecoverToken {
  @prop()
  token?: string;

  @prop()
  attempts?: number;

  @prop()
  status?: number;

  @prop()
  expires?: number;
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

  @prop({ required: true })
  code?: string;

  @prop({ required: true })
  email?: string;

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
  recoverToken?: AccountRecoverToken;

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(Account);
  }

  public validPassword?(password: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!password || !("password" in this)) {
        reject({ boErros: ERRORS.INVALID_CREDENTIALS });
      }
      bcrypt.compare(
        password,
        this.password,
        (err: mongoose.Error, isMatch: boolean) => {
          if (isMatch) {
            return resolve();
          }

          reject(err ? err : { boErros: ERRORS.INVALID_CREDENTIALS });
        }
      );
    });
  }
}

export type AccountDocument = DocumentType<Account>;
export const AccountModel: mongoose.Model<AccountDocument> = Account.shared;
