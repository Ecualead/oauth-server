/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:42:02-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: Applications.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-12T23:20:43-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Arrays, Token } from '@ikoabo/core_srv';
import { ERRORS } from '@ikoabo/auth_srv';
import { MApplication, DApplication, IApplication } from '@/models/schemas/applications/application';
import { MProject, DProject } from '@/models/schemas/projects/project';
import { APPLICATION_STATUS } from '@/models/types/state';

export class Applications {
  private static _instance: Applications;

  /**
   * Private constructor
   */
  private constructor() {
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

  /**
   * Update a application status
   *
   * @param application  ObjectId of the application to update
   * @param status  The new application status
   */
  private _updateStatus(application: string, status: APPLICATION_STATUS): Promise<DApplication> {
    return new Promise<DApplication>((resolve, reject) => {
      MApplication.findOneAndUpdate({ _id: application }, { $set: { status: status } }, { new: true })
        .then((value: DApplication) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_APPLICATION });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Create new application
   *
   * @param project  Project owning the application
   * @param data   Data of the new application
   */
  public create(project: string, data: IApplication): Promise<DApplication> {
    return new Promise<DApplication>((resolve, reject) => {
      /* Find for the parent project */
      MProject.findById(project)
        .then((value: DProject) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_PROJECT });
            return;
          }

          /* Set the project owning */
          data.project = value.id;

          /* Intersect scope with project scope */
          data.scope = Arrays.intersect(data.scope, <string[]>value.scope);

          /* Generate application secret */
          data.secret = Token.longToken;

          /* Create the new application */
          MApplication.create(data).then(resolve).catch(reject);
        }).catch(reject);
    });
  }

  /**
   * Update the application information
   *
   * @param application  ObjectId of the application to update
   * @param data   Data to be updated
   */
  public update(application: string, data: IApplication): Promise<DApplication> {
    return new Promise<DApplication>((resolve, reject) => {
      MApplication.findOneAndUpdate({ _id: application }, { $set: data }, { new: true })
        .then((value: DApplication) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_APPLICATION });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Retrieve the application information
   *
   * @param application  ObjectId of the application
   */
  public get(application: string): Promise<DApplication> {
    return new Promise<DApplication>((resolve, reject) => {
      MApplication.findOne({ _id: application })
        .then((value: DApplication) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_APPLICATION });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Delete an application
   *
   * @param application  ObjectId of the application
   */
  public delete(application: string): Promise<DApplication> {
    return this._updateStatus(application, APPLICATION_STATUS.AS_DELETED);
  }

  /**
   * Enable an application
   *
   * @param application  ObjectId of the application
   */
  public enable(application: string): Promise<DApplication> {
    return this._updateStatus(application, APPLICATION_STATUS.AS_ENABLED);
  }

  /**
   * Disable an application
   *
   * @param application  ObjectId of the application
   */
  public disable(application: string): Promise<DApplication> {
    return this._updateStatus(application, APPLICATION_STATUS.AS_DISABLED);
  }

  /**
   * Add new scope to the application
   *
   * @param application  ObjectId of the application
   * @param scope  The new scope to be added
   */
  public addScope(application: string, scope: string): Promise<DApplication> {
    return new Promise<DApplication>((resolve, reject) => {
      MApplication.findOneAndUpdate({ _id: application }, { $addToSet: { scope: scope } }, { new: true })
        .then((value: DApplication) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_APPLICATION });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Delete a scope from the application
   *
   * @param application  ObjectId of the application
   * @param scope  Scope to be deleted
   */
  public deleteScope(application: string, scope: string): Promise<DApplication> {
    return new Promise<DApplication>((resolve, reject) => {
      MApplication.findOneAndUpdate({ _id: application }, { $pull: { scope: scope } }, { new: true })
        .then((value: DApplication) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_APPLICATION });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }
}
