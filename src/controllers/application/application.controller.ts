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
import { Arrays, Tokens, SERVER_STATUS } from "@ikoabo/core";
import { ApplicationDocument, ApplicationModel } from "@/models/application/application.model";
import { ProjectCtrl } from "@/controllers/project/project.controller";
import { ProjectDocument } from "@/models/project/project.model";
import { CRUD } from "@ikoabo/server";

export class Applications extends CRUD<ApplicationDocument> {
  private static _instance: Applications;

  /**
   * Private constructor
   */
  private constructor() {
    super("Applications", ApplicationModel);
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

          super
            .create(data)
            .then((application: ApplicationDocument) => resolve(application))
            .catch(reject);
        })
        .catch(reject);
    });
  }

  /**
   * Add new grant type to the applicaiton
   */
  public addGrant(id: string, grant: string): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $addToSet: { grants: grant } };
      this.update(query, {}, update)
        .then((value: ApplicationDocument) => {
          this._logger.debug("Add grant", { id: id, grant: grant });
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
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $pull: { grants: grant } };
      this.update(query, {}, update)
        .then((value: ApplicationDocument) => {
          this._logger.debug("Remove grant", { id: id, grant: grant });
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
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $addToSet: { restrictions: restriction } };
      this.update(query, {}, update)
        .then((value: ApplicationDocument) => {
          this._logger.debug("Add restriction", { id: id, restriction: restriction });
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
      const query: any = { _id: id, status: SERVER_STATUS.ENABLED };
      const update: any = { $pull: { restrictions: restriction } };
      this.update(query, {}, update)
        .then((value: ApplicationDocument) => {
          this._logger.debug("Remove restriction", { id: id, restriction: restriction });
          resolve(value);
        })
        .catch(reject);
    });
  }
}

export const ApplicationCtrl = Applications.shared;
