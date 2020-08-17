/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseModel } from "@ikoabo/server";
import { prop, index, Ref, getModelForClass, DocumentType } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Account } from "@/Accounts/models/accounts.model";
import { Project } from "@/Projects/models/projects.model";

@index({ account: 1, project: 1 }, { unique: true })
@index({ account: 1 })
@index({ project: 1 })
@index({ code: 1 })
export class AccountTree extends BaseModel {
  @prop({ required: true })
  code!: string;

  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Account })
  account!: Ref<Account>;

  @prop({ type: mongoose.Types.ObjectId, required: true, ref: Project })
  project!: Ref<Project>;

  @prop({ type: mongoose.Types.ObjectId, ref: Project })
  tree: Ref<Project>[];

  /**
   * Get the mongoose data model
   */
  static get shared() {
    return getModelForClass(AccountTree, {
      schemaOptions: {
        collection: "accounts.tree",
        timestamps: true,
        toJSON: {
          virtuals: true,
          versionKey: false,
          transform: (_doc: any, ret: any) => {
            return {
              id: ret.id,
              account: ret.account,
              project: ret.project,
              tree: ret.tree,
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

export type AccountTreeDocument = DocumentType<AccountTree>;
export const AccountTreeModel: mongoose.Model<AccountTreeDocument> = AccountTree.shared;
