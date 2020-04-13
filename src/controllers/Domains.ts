/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:41:46-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: Domain.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-12T23:20:59-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

 import { ERRORS } from '@ikoabo/auth_srv';
import { MDomain, DDomain, IDomain } from '../models/schemas/domain';
import { DOMAIN_STATUS } from '../models/types/state';

/**
 * Class to handle Auth domains
 */
export class Domains {
  private static _instance: Domains;

  /**
   * Private constructor
   */
  private constructor() {
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Domains {
    if (!Domains._instance) {
      Domains._instance = new Domains();
    }
    return Domains._instance;
  }

  /**
   * Update a domain status
   *
   * @param domain  ObjectId of the domain to update
   * @param status  The new domain status
   */
  private _updateStatus(domain: string, status: DOMAIN_STATUS): Promise<DDomain> {
    return new Promise<DDomain>((resolve, reject) => {
      MDomain.findOneAndUpdate({ _id: domain }, { $set: { status: status } }, { new: true })
        .then((value: DDomain) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_DOMAIN });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Create new domain
   *
   * @param data   Data of the new domain
   */
  public create(data: IDomain): Promise<DDomain> {
    return new Promise<DDomain>((resolve, reject) => {
      MDomain.create(data).then(resolve).catch(reject);
    });
  }

  /**
   * Update the domain information
   *
   * @param domain  ObjectId of the domain to update
   * @param data   Data to be updated
   */
  public update(domain: string, data: IDomain): Promise<DDomain> {
    return new Promise<DDomain>((resolve, reject) => {
      MDomain.findOneAndUpdate({ _id: domain }, { $set: data }, { new: true })
        .then((value: DDomain) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_DOMAIN });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Retrieve the domain information
   *
   * @param domain  ObjectId of the domain
   */
  public get(domain: string): Promise<DDomain> {
    return new Promise<DDomain>((resolve, reject) => {
      MDomain.findOne({ _id: domain })
        .then((value: DDomain) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_DOMAIN });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Delete a domain
   *
   * @param domain  ObjectId of the domain
   */
  public delete(domain: string): Promise<DDomain> {
    return this._updateStatus(domain, DOMAIN_STATUS.DS_DELETED);
  }

  /**
   * Enable a domain
   *
   * @param domain  ObjectId of the domain
   */
  public enable(domain: string): Promise<DDomain> {
    return this._updateStatus(domain, DOMAIN_STATUS.DS_ENABLED);
  }

  /**
   * Disable a domain
   *
   * @param domain  ObjectId of the domain
   */
  public disable(domain: string): Promise<DDomain> {
    return this._updateStatus(domain, DOMAIN_STATUS.DS_DISABLED);
  }

  /**
   * Add new scope to the domain
   *
   * @param domain  ObjectId of the domain
   * @param scope  The new scope to be added
   */
  public addScope(domain: string, scope: string): Promise<DDomain> {
    return new Promise<DDomain>((resolve, reject) => {
      MDomain.findOneAndUpdate({ _id: domain }, { $addToSet: { scope: scope } }, { new: true })
        .then((value: DDomain) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_DOMAIN });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }

  /**
   * Delete a scope from the domain
   *
   * @param domain  ObjectId of the domain
   * @param scope  Scope to be deleted
   */
  public deleteScope(domain: string, scope: string): Promise<DDomain> {
    return new Promise<DDomain>((resolve, reject) => {
      MDomain.findOneAndUpdate({ _id: domain }, { $pull: { scope: scope } }, { new: true })
        .then((value: DDomain) => {
          if (!value) {
            reject({ boError: ERRORS.INVALID_DOMAIN });
            return;
          }
          resolve(value);
        }).catch(reject);
    });
  }
}
