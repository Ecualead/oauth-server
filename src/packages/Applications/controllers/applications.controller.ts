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
import { Arrays, Tokens, SERVER_STATUS, SERVER_ERRORS, HTTP_STATUS } from "@ikoabo/core";
import { ApplicationDocument, ApplicationModel } from "@/Applications/models/applications.model";
import { DataScoped } from "@/controllers/data.scoped.controller";
import { ProjectCtrl } from "@/Projects/controllers/projects.controller";
import { ProjectDocument } from "@/Projects/models/projects.model";

export class Applications extends DataScoped<ApplicationDocument> {
  private static _instance: Applications;

  /**
   * Private constructor
   */
  private constructor() {
    super("Applications", ApplicationModel, "application");
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Applications {
    if (!Applications._instance) {
      Applications._instance = new Applications();
    }
    return Applications._instance;
  }

  public create(data: any): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      /* Find the parent project */
      ProjectCtrl.fetch(data.project.toString())
        .then((project: ProjectDocument) => {
          /* Set the project owning */
          data.project = project.id;

          /* Intersect scope with project scope */
          data.scope = Arrays.intersect(data.scope, project.scope);

          /* Generate application secret */
          data.secret = Tokens.long;

          super.create(data).then(resolve).catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Add new grant type to the applicaiton
   */
  public addGrant(id: string, grant: string): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      this._logger.debug("Adding grant type", {
        application: id,
        grant: grant
      });
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $addToSet: { grants: grant } };
      ApplicationModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ApplicationDocument) => {
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
   * Delete a grant type from the application
   */
  public deleteGrant(id: string, grant: string): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      this._logger.debug("Removing grant type", {
        project: id,
        grant: grant
      });
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $pull: { grants: grant } };
      ApplicationModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ApplicationDocument) => {
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
   * Add new access restriction to the application
   */
  public addRestriction(id: string, restriction: string): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      this._logger.debug("Adding restriction", {
        application: id,
        restriction: restriction
      });
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $addToSet: { restriction: restriction } };
      ApplicationModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ApplicationDocument) => {
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
   * Delete an access restriction from the application
   */
  public deleteRestriction(id: string, restriction: string): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      this._logger.debug("Removing restriction", {
        application: id,
        restriction: restriction
      });
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $pull: { restriction: restriction } };
      ApplicationModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ApplicationDocument) => {
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
}

export const ApplicationCtrl = Applications.shared;
