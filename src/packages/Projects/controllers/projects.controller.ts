import { Arrays, BASE_STATUS, ERRORS } from "@ikoabo/core_srv";
import {
  Project,
  ProjectDocument,
  ProjectModel,
} from "@/Projects/models/projects.model";
import { Domains } from "@/packages/Domains/controllers/domains.controller";
import { DomainDocument } from "@/Domains/models/domains.model";
import { DataScoped } from "@/controllers/data.scoped.controller";

export class Projects extends DataScoped<Project, ProjectDocument> {
  private static _instance: Projects;

  /**
   * Private constructor
   */
  private constructor() {
    super("Projects", ProjectModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Projects {
    if (!Projects._instance) {
      Projects._instance = new Projects();
    }
    return Projects._instance;
  }

  public create(data: Project): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      /* Find for the parent domain */
      Domains.shared
        .fetch(data.domain.toString())
        .then((value: DomainDocument) => {
          /* Intersect scope with domain scope */
          data.scope = Arrays.intersect(data.scope, value.scope);

          /* Create the new project */
          super.create(data).then(resolve).catch(reject);
        })
        .catch(reject);
    });
  }

  public clearModule(module: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._logger.debug("Cleaning module for projects", {
        module: module,
      });
      const update: any = { $pull: { modules: module } };
      ProjectModel.updateMany({}, update)
        .then(() => {
          resolve();
        })
        .catch(reject);
    });
  }

  /**
   * Add new module to the domain
   */
  public addModule(id: string, module: string): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Adding module to project", {
        project: id,
        module: module,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $addToSet: { modules: module } };
      ProjectModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ProjectDocument) => {
          if (!value) {
            reject({ boError: ERRORS.OBJECT_NOT_FOUND });
            return;
          }

          /* Ensure domain contains this module */
          Domains.shared
            .addModule(value.domain.toString(), module)
            .then(() => {
              resolve(value);
            })
            .catch((err: any) => {
              /* On any error remove the module from the project */
              this.deleteModule(id, module).finally(() => {
                reject(err);
              });
            });
        })
        .catch(reject);
    });
  }

  /**
   * Delete a module from the domain
   */
  public deleteModule(id: string, module: string): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Removing module from domain", {
        domain: id,
        module: module,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $pull: { modules: module } };
      ProjectModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ProjectDocument) => {
          if (!value) {
            reject({ boError: ERRORS.OBJECT_NOT_FOUND });
            return;
          }
          resolve(value);
        })
        .catch(reject);
    });
  }
}
