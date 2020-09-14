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
import { SERVER_STATUS, HTTP_STATUS, SERVER_ERRORS } from "@ikoabo/core";
import { DataScoped } from "@/controllers/data.scoped.controller";
import { DomainModel, DomainDocument } from "@/Domains/models/domains.model";
import { ModuleDocument } from "@/Modules/models/modules.model";
import { ProjectCtrl } from "@/Projects/controllers/projects.controller";

class Domains extends DataScoped<DomainDocument> {
  private static _instance: Domains;

  private constructor() {
    super("Domains", DomainModel, "domain");
  }

  public static get shared(): Domains {
    if (!Domains._instance) {
      Domains._instance = new Domains();
    }
    return Domains._instance;
  }

  /**
   * Add new module to the domain
   */
  public addModule(id: string, module: ModuleDocument): Promise<DomainDocument> {
    return new Promise<DomainDocument>((resolve, reject) => {
      this._logger.debug("Adding new module to domain", {
        domain: id,
        module: module
      });
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = {
        $addToSet: {
          modules: module.id,
          scope: module.scope
        }
      };
      DomainModel.findOneAndUpdate(query, update, { new: true })
        .then((value: DomainDocument) => {
          if (!value) {
            reject({
              boError: SERVER_ERRORS.OBJECT_NOT_FOUND,
              boStatus: HTTP_STATUS.HTTP_4XX_NOT_FOUND
            });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }

  /**
   * Delete a module from the domain
   */
  public deleteModule(id: string, module: ModuleDocument): Promise<DomainDocument> {
    return new Promise<DomainDocument>((resolve, reject) => {
      this._logger.debug("Removing module from domain", {
        domain: id,
        module: module
      });
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = {
        $pull: { modules: module.id },
        $pullAll: { scope: module.scope }
      };
      DomainModel.findOneAndUpdate(query, update, { new: true })
        .then((value: DomainDocument) => {
          if (!value) {
            reject({ boError: SERVER_ERRORS.OBJECT_NOT_FOUND });
            return;
          }

          /* Remove the registered module */
          ProjectCtrl.clearModule(module)
            .then(() => {
              resolve(value);
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }
}

export const DomainCtrl = Domains.shared;
