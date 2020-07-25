/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Arrays, Token, CRUD, BASE_STATUS } from "@ikoabo/core_srv";
import { ERRORS } from "@ikoabo/core_srv";
import {
  Application,
  ApplicationDocument,
  ApplicationModel,
} from "../models/applications.model";
import { DataScoped } from "@/controllers/data.scoped.controller";
import { ProjectCtrl } from "@/packages/Projects/controllers/projects.controller";
import { ProjectDocument } from "@/packages/Projects/models/projects.model";

export class Applications extends DataScoped<Application, ApplicationDocument> {
  private static _instance: Applications;

  /**
   * Private constructor
   */
  private constructor() {
    super("Applications", ApplicationModel, 'application');
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

  public create(data: Application): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      /* Find the parent project */
      ProjectCtrl.fetch(data.project.toString())
        .then((project: ProjectDocument) => {
          /* Set the project owning */
          data.project = project.id;

          /* Intersect scope with project scope */
          data.scope = Arrays.intersect(data.scope, project.scope);

          /* Generate application secret */
          data.secret = Token.longToken;

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
        grant: grant,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $addToSet: { grants: grant } };
      ApplicationModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ApplicationDocument) => {
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
   * Delete a grant type from the application
   */
  public deleteGrant(id: string, grant: string): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      this._logger.debug("Removing grant type", {
        project: id,
        grant: grant,
      });
      const query: any = { _id: id, status: BASE_STATUS.BS_ENABLED };
      const update: any = { $pull: { grants: grant } };
      ApplicationModel.findOneAndUpdate(query, update, { new: true })
        .then((value: ApplicationDocument) => {
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

export const ApplicationCtrl = Applications.shared;
