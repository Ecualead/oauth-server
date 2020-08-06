/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Arrays, BASE_STATUS, ERRORS } from "@ikoabo/core_srv";
import {
  Project,
  ProjectDocument,
  ProjectModel,
} from "@/Projects/models/projects.model";
import { DomainCtrl } from "@/Domains/controllers/domains.controller";
import { DomainDocument } from "@/Domains/models/domains.model";
import { DataScoped } from "@/controllers/data.scoped.controller";
import { ProjectSocialNetworkSettings } from "@/Projects/models/projects.socialnetworks.model";
import { ProjectNotification } from "@/Projects/models/projects.notifications.model";
import { ModuleDocument } from "@/Modules/models/modules.model";

class Projects extends DataScoped<Project, ProjectDocument> {
  private static _instance: Projects;

  /**
   * Private constructor
   */
  private constructor() {
    super("Projects", ProjectModel, 'project');
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
      DomainCtrl.fetch(data.domain.toString())
        .then((value: DomainDocument) => {
          /* Intersect scope with domain scope */
          data.scope = Arrays.intersect(data.scope, value.scope);

          /* Create the new project */
          super.create(data).then(resolve).catch(reject);
        })
        .catch(reject);
    });
  }

  public clearModule(module: ModuleDocument): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._logger.debug("Cleaning module", {
        module: module,
      });
      const update: any = {
        $pull: { modules: module.id },
        $pullAll: { scope: module.scope },
      };
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
  public addModule(
    id: string,
    module: ModuleDocument
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Adding module", {
        project: id,
        module: module,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = {
        $addToSet: { modules: module.id, scope: module.scope },
      };
      ProjectModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ProjectDocument) => {
          if (!value) {
            reject({ boError: ERRORS.OBJECT_NOT_FOUND });
            return;
          }

          /* Ensure domain contains this module */
          DomainCtrl.addModule(value.domain.toString(), module)
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
  public deleteModule(
    id: string,
    module: ModuleDocument
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Removing module", {
        project: id,
        module: module,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = {
        $pull: { modules: module },
        $pullAll: { scope: module.scope },
      };
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

  public addIp(id: string, ip: string): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Adding ip restriction", {
        project: id,
        ip: ip,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $addToSet: { "settings.restrictIps": ip } };
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

  public deleteIp(id: string, ip: string): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Removing ip restriction", {
        project: id,
        ip: ip,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $pull: { "settings.restrictIps": ip } };
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

  public addSocialNetwork(
    id: string,
    socialNetwork: ProjectSocialNetworkSettings
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Adding social network", {
        project: id,
        socialNetwork: socialNetwork,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = {
        $push: { "settings.socialNetworks": socialNetwork },
      };
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

  public updateSocialNetwork(
    id: string,
    socialType: number,
    socialNetwork: ProjectSocialNetworkSettings
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Updating social network", {
        project: id,
        socialNetwork: socialType,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = {
        $set: {
          "settings.socialNetworks.$[elem].clientId": socialNetwork.clientId,
          "settings.socialNetworks.$[elem].clientSecret":
            socialNetwork.clientSecret,
          "settings.socialNetworks.$[elem].scope": socialNetwork.scope,
          "settings.socialNetworks.$[elem].profile": socialNetwork.profile,
          "settings.socialNetworks.$[elem].profileMap":
            socialNetwork.profileMap,
          "settings.socialNetworks.$[elem].description":
            socialNetwork.description,
        },
      };
      ProjectModel.findOneAndUpdate(query, update, {
        new: true,
        arrayFilters: [{ "elem.type": socialType }],
      })
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

  public deleteSocialNetwork(
    id: string,
    socialType: number
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Removing social network", {
        project: id,
        socialNetwork: socialType,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = {
        $pull: { "settings.socialNetworks": { type: socialType } },
      };
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

  public addNotification(
    id: string,
    notification: ProjectNotification
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Adding notification", {
        project: id,
        notification: notification,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $push: { "settings.notifications": notification } };
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

  public updateNotification(
    id: string,
    notificationType: number,
    notification: ProjectNotification
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Updating notification", {
        project: id,
        notification: notificationType,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = {
        $set: {
          "settings.notifications.$[elem].signup": notification.signup,
          "settings.notifications.$[elem].confirm": notification.confirm,
          "settings.notifications.$[elem].signin": notification.signin,
          "settings.notifications.$[elem].chPwd": notification.chPwd,
          "settings.notifications.$[elem].recover": notification.recover,
          "settings.notifications.$[elem].urls": notification.urls,
        },
      };
      ProjectModel.findOneAndUpdate(query, update, {
        new: true,
        arrayFilters: [{ "elem.type": notificationType }],
      })
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

  public deleteNotification(
    id: string,
    notificationType: number
  ): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      this._logger.debug("Removing notification", {
        project: id,
        notification: notificationType,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = {
        $pull: { "settings.notifications": { type: notificationType } },
      };
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

export const ProjectCtrl = Projects.shared;
