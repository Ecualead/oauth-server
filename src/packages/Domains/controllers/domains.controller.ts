import { DataScoped } from "@/controllers/data.scoped.controller";
import {
  Domain,
  DomainModel,
  DomainDocument,
} from "@/Domains/models/domains.model";
import { BASE_STATUS, ERRORS } from "@ikoabo/core_srv";
import { ProjectCtrl } from "@/Projects/controllers/projects.controller";

class Domains extends DataScoped<Domain, DomainDocument> {
  private static _instance: Domains;

  private constructor() {
    super("Domains", DomainModel);
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
  public addModule(id: string, module: string): Promise<DomainDocument> {
    return new Promise<DomainDocument>((resolve, reject) => {
      this._logger.debug("Adding new module to domain", {
        domain: id,
        module: module,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $addToSet: { modules: module } };
      DomainModel.findOneAndUpdate(query, update, { new: true })
        .then((value: DomainDocument) => {
          if (!value) {
            reject({ boError: ERRORS.OBJECT_NOT_FOUND });
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
  public deleteModule(id: string, module: string): Promise<DomainDocument> {
    return new Promise<DomainDocument>((resolve, reject) => {
      this._logger.debug("Removing module from domain", {
        domain: id,
        module: module,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $pull: { modules: module } };
      DomainModel.findOneAndUpdate(query, update, { new: true })
        .then((value: DomainDocument) => {
          if (!value) {
            reject({ boError: ERRORS.OBJECT_NOT_FOUND });
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
