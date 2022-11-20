/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Tokens, SERVER_STATUS, CRUD } from "@ecualead/server";
import { ApplicationDocument, ApplicationModel } from "../../models/application/application";

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
      /* Generate application secret */
      data.secret = Tokens.long;

      super
        .create(data)
        .then((application: ApplicationDocument) => resolve(application))
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
