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
import { SERVER_STATUS, SERVER_ERRORS } from "@ikoabo/core";
import { CRUD } from "@ikoabo/server";
import mongoose from "mongoose";

export abstract class DataScoped<T, D extends mongoose.Document> extends CRUD<T, D> {
  constructor(logger: string, model: mongoose.Model<D>, modelname: string) {
    super(logger, model, modelname);
  }

  /**
   * Add new scope to the object
   */
  public addScope(id: string, scope: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      this._logger.debug("Adding new scope", { id: id, scope: scope });
      const query: any = { _id: id, status: { $gt: SERVER_STATUS.UNKNOWN } };
      const update: any = { $addToSet: { scope: scope } };
      this._model
        .findOneAndUpdate(query, update, { new: true })
        .then((value: D) => {
          if (!value) {
            reject({ boError: SERVER_ERRORS.OBJECT_NOT_FOUND });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }

  /**
   * Delete a scope from the object
   */
  public deleteScope(id: string, scope: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      this._logger.debug("Adding new scope", { id: id, scope: scope });
      const query: any = { _id: id, status: { $gt: SERVER_STATUS.UNKNOWN } };
      const update: any = { $pull: { scope: scope } };
      this._model
        .findOneAndUpdate(query, update, { new: true })
        .then((value: D) => {
          if (!value) {
            reject({ boError: SERVER_ERRORS.OBJECT_NOT_FOUND });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }

  public enable(id: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      this._logger.debug("Enabling component", { id: id });
      const query: any = { _id: id, status: SERVER_STATUS.DISABLED };
      const update: any = { $set: { status: SERVER_STATUS.ENABLED } };
      this._model
        .findOneAndUpdate(query, update, { new: true })
        .then((value: D) => {
          if (!value) {
            reject({ boError: SERVER_ERRORS.OBJECT_NOT_FOUND });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }

  public disable(id: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      this._logger.debug("Disabling component", { id: id });
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $set: { status: SERVER_STATUS.DISABLED } };
      this._model
        .findOneAndUpdate(query, update, { new: true })
        .then((value: D) => {
          if (!value) {
            reject({ boError: SERVER_ERRORS.OBJECT_NOT_FOUND });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }
}
