/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:41:53-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: Projects.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-12T23:21:35-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import { Arrays } from '@ikoabo/core_srv';
import { ERRORS } from '@ikoabo/auth_srv';
import { MProject, DProject, IProject } from '../models/schemas/projects/project';
import { MDomain, DDomain } from '../models/schemas/domain';
import { PROJECT_STATUS } from '../models/types/state';

export class Projects {
  private static _instance: Projects;

  /**
   * Private constructor
   */
  private constructor() {
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

  /**
   * Update a project status
   *
   * @param project  ObjectId of the project to update
   * @param status  The new project status
   */
  private _updateStatus(project: string, status: PROJECT_STATUS): Promise<DProject> {
    return new Promise<DProject>((resolve, reject) => {
      MProject.findOneAndUpdate({ _id: project }, { $set: { status: status } }, { new: true })
        .then((value: DProject) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_PROJECT });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Create new project
   *
   * @param domain  Doamin owning the project
   * @param data   Data of the new project
   */
  public create(domain: string, data: IProject): Promise<DProject> {
    return new Promise<DProject>((resolve, reject) => {
      /* Find for the parent domain */
      MDomain.findById(domain)
        .then((value: DDomain) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_DOMAIN });
            return;
          }

          /* Set the domain owning */
          data.domain = value.id;

          /* Intersect scope with domain scope */
          data.scope = Arrays.intersect(data.scope, <string[]>value.scope);

          /* Create the new project */
          MProject.create(data).then(resolve).catch(reject);
        }).catch(reject);
    });
  }

  /**
   * Update the project information
   *
   * @param project  ObjectId of the project to update
   * @param data   Data to be updated
   */
  public update(project: string, data: IProject): Promise<DProject> {
    return new Promise<DProject>((resolve, reject) => {
      MProject.findOneAndUpdate({ _id: project }, { $set: data }, { new: true })
        .then((value: DProject) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_PROJECT });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Retrieve the project information
   *
   * @param project  ObjectId of the project
   */
  public get(project: string): Promise<DProject> {
    return new Promise<DProject>((resolve, reject) => {
      MProject.findOne({ _id: project })
        .then((value: DProject) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_PROJECT });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Delete a project
   *
   * @param project  ObjectId of the project
   */
  public delete(project: string): Promise<DProject> {
    return this._updateStatus(project, PROJECT_STATUS.PS_DELETED);
  }

  /**
   * Enable a project
   *
   * @param project  ObjectId of the project
   */
  public enable(project: string): Promise<DProject> {
    return this._updateStatus(project, PROJECT_STATUS.PS_ENABLED);
  }

  /**
   * Disable a project
   *
   * @param project  ObjectId of the project
   */
  public disable(project: string): Promise<DProject> {
    return this._updateStatus(project, PROJECT_STATUS.PS_DISABLED);
  }

  /**
   * Add new scope to the project
   *
   * @param project  ObjectId of the project
   * @param scope  The new scope to be added
   */
  public addScope(project: string, scope: string): Promise<DProject> {
    return new Promise<DProject>((resolve, reject) => {
      MProject.findOneAndUpdate({ _id: project }, { $addToSet: { scope: scope } }, { new: true })
        .then((value: DProject) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_PROJECT });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Delete a scope from the project
   *
   * @param project  ObjectId of the project
   * @param scope  Scope to be deleted
   */
  public deleteScope(project: string, scope: string): Promise<DProject> {
    return new Promise<DProject>((resolve, reject) => {
      MProject.findOneAndUpdate({ _id: project }, { $pull: { scope: scope } }, { new: true })
        .then((value: DProject) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_PROJECT });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }
}
