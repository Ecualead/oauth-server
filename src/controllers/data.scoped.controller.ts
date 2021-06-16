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
import { HTTP_STATUS, Objects, SERVER_STATUS } from "@ikoabo/core";
import { CRUD } from "@ikoabo/server";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

/**
 * Base scoped data
 * Handle data scope related
 */
export abstract class DataScoped<D extends mongoose.Document> extends CRUD<D> {
  constructor(logger: string, model: mongoose.Model<D>, name?: string) {
    super(logger, model, name ? { modelName: name } : null);
  }

  /**
   * Add new scope to the object
   *
   * @param id
   * @param scope
   * @returns
   */
  public addScope(id: string, scope: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      const query: any = { _id: id, status: { $gt: SERVER_STATUS.UNKNOWN } };
      const update: any = { $addToSet: { scope: scope } };
      this.update(query, {}, update)
        .then((value: D) => {
          this._logger.debug("Add scope", { id: id, scope: scope });
          resolve(value);
        })
        .catch(reject);
    });
  }

  /**
   * Delete a scope from the object
   *
   * @param id
   * @param scope
   * @returns
   */
  public deleteScope(id: string, scope: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      const query: any = { _id: id, status: { $gt: SERVER_STATUS.UNKNOWN } };
      const update: any = { $pull: { scope: scope } };
      this.update(query, {}, update)
        .then((value: D) => {
          this._logger.debug("Delete scope", { id: id, scope: scope });
          resolve(value);
        })
        .catch(reject);
    });
  }

  /**
   * Set the document object as enabled
   * TODO XXX Migrate this handler to CRUD definition
   *
   * @param id
   * @returns
   */
  public enable(id: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      const query: any = { _id: id, status: SERVER_STATUS.DISABLED };
      const update: any = { status: SERVER_STATUS.ENABLED };
      this.update(query, update)
        .then((value: D) => {
          this._logger.debug("Enable component", { id: id });
          resolve(value);
        })
        .catch(reject);
    });
  }

  /**
   * Set the document object as disabled
   * TODO XXX Migrate this handler to CRUD definition
   *
   * @param id
   * @returns
   */
  public disable(id: string): Promise<D> {
    return new Promise<D>((resolve, reject) => {
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { status: SERVER_STATUS.DISABLED };
      this.update(query, update)
        .then((value: D) => {
          this._logger.debug("Disable component", { id: id });
          resolve(value);
        })
        .catch(reject);
    });
  }

  /**
   * Middleware to validate target document owner
   * TODO XXX Migrate this handler to CRUD definition
   *
   * @param idRef
   * @param userRef
   * @returns
   */
  public validate(idRef: string, userRef: string) {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      const id = Objects.get(req, idRef, null);
      const user = Objects.get(req, userRef, null);
      self
        .fetch({ _id: id, owner: user })
        .then((value: D) => {
          res.locals["obj"] = value;
          next();
        })
        .catch(() => {
          next({
            boError: AUTH_ERRORS.INVALID_DOMAIN,
            boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
          });
        });
    };
  }
}
