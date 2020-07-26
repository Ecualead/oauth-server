/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { DataScoped } from "@/controllers/data.scoped.controller";
import {
  Module,
  ModuleModel,
  ModuleDocument,
} from "@/Modules/models/modules.model";
import { BASE_STATUS, HTTP_STATUS, ERRORS } from "@ikoabo/core_srv";

/**
 * Module controller
 */
class Modules extends DataScoped<Module, ModuleDocument> {
  private static _instance: Modules;

  private constructor() {
    super("Modules", ModuleModel, "module");
  }

  /**
   * Retrieve singleton class instance
   */
  public static get shared(): Modules {
    if (!Modules._instance) {
      Modules._instance = new Modules();
    }
    return Modules._instance;
  }

  /**
   * Add new access restriction to the module
   */
  public addRestriction(
    id: string,
    restriction: string
  ): Promise<ModuleDocument> {
    return new Promise<ModuleDocument>((resolve, reject) => {
      this._logger.debug("Adding restriction", {
        module: id,
        restriction: restriction,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $addToSet: { restriction: restriction } };
      ModuleModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ModuleDocument) => {
          if (!value) {
            reject({
              boError: ERRORS.OBJECT_NOT_FOUND,
              boStatus: HTTP_STATUS.HTTP_NOT_FOUND,
            });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }

  /**
   * Delete an access restriction from the module
   */
  public deleteRestriction(
    id: string,
    restriction: string
  ): Promise<ModuleDocument> {
    return new Promise<ModuleDocument>((resolve, reject) => {
      this._logger.debug("Removing restriction", {
        module: id,
        restriction: restriction,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $pull: { restriction: restriction } };
      ModuleModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ModuleDocument) => {
          if (!value) {
            reject({
              boError: ERRORS.OBJECT_NOT_FOUND,
              boStatus: HTTP_STATUS.HTTP_NOT_FOUND,
            });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }
}

export const ModuleCtrl = Modules.shared;
