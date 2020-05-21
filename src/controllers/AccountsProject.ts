/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-04-04T02:34:22-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: AccountsProject.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-06T01:01:30-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import mongoose from 'mongoose';
import async from 'async';
import { Logger, Objects } from '@ikoabo/core_srv'
import { MProject, DProject } from '@/models/schemas/projects/project';
import { MAccountProject } from '@/models/schemas/accounts/project';
import { DProjectProfileField, DProjectProfileFieldIndex } from '@/models/schemas/projects/profile';
import { PROTECTED_PROJECT_FIELDS } from '@/models/types/account';
import { PROJECT_STATUS } from '@/models/types/state';
import { PROFILE_FIELD_TYPES } from '@/models/types/profile';

interface ICustomProject {
  [key: string]: mongoose.Model<any>;
}

export class AccountsProject {
  private static _instance: AccountsProject;
  private readonly _logger: Logger;
  private readonly _models: ICustomProject;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    this._logger = new Logger('AccountsProject');
    this._models = {};
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): AccountsProject {
    if (!AccountsProject._instance) {
      AccountsProject._instance = new AccountsProject();
    }
    return AccountsProject._instance;
  }

  private _addModel(project: DProject, model: mongoose.Model<any>) {
    this._logger.debug('Registering custom profile schema', { id: project.id, name: project.name });
    this._models[project.id] = model;
  }

  public getModel(project: string | DProject): mongoose.Model<any> | null {
    const idx = typeof project === 'string' ? project : project.id;
    return this._models[idx];
  }

  private _deleteModel(project: DProject) {
    this._logger.debug('Removing custom profile schema model', { id: project.id, name: project.name });
    if (project.id in this._models) {
      /* Look for custom profile paths */
      let keys = Object.keys(this._models[project.id].schema['paths']);
      keys = keys.filter(key => {
        return PROTECTED_PROJECT_FIELDS.indexOf(key) < 0;
      });

      /* Remove custom fields path */
      this._models[project.id].schema.remove(keys);
    }
  }

  private static _fieldType(field: DProjectProfileField): typeof mongoose.SchemaType | [typeof mongoose.SchemaType] {
    switch (field.type) {
      case PROFILE_FIELD_TYPES.PF_NUMBER:
        return mongoose.Schema.Types.Number;
      case PROFILE_FIELD_TYPES.PF_BOOLEAN:
        return mongoose.Schema.Types.Boolean;
      case PROFILE_FIELD_TYPES.PF_OBJECT:
        return mongoose.Schema.Types.Mixed;
      case PROFILE_FIELD_TYPES.PF_ARRAY_STRING:
        return [mongoose.Schema.Types.String];
      case PROFILE_FIELD_TYPES.PF_ARRAY_NUMBER:
        return [mongoose.Schema.Types.Number];
      case PROFILE_FIELD_TYPES.PF_ARRAY_BOOLEAN:
        return [mongoose.Schema.Types.Boolean];
      case PROFILE_FIELD_TYPES.PF_ARRAY_OBJECT:
        return [mongoose.Schema.Types.Mixed];
    }
    return mongoose.Schema.Types.String;
  }


  private static _defaultValue(field: DProjectProfileField): number | boolean | string {
    if (!field.defaultValue) {
      return null;
    }
    let value;
    switch (field.type) {
      case PROFILE_FIELD_TYPES.PF_NUMBER:
        value = Number(field.defaultValue);
        if (!value || Number.isNaN(value)) {
          value = 0;
        }
        return value;
      case PROFILE_FIELD_TYPES.PF_BOOLEAN:
        value = Boolean(field.defaultValue);
        if (!value) {
          value = false;
        }
        return value;
    }
    return field.defaultValue;
  }

  public initialize(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      MProject.find({ status: PROJECT_STATUS.PS_ENABLED })
        .then((projects: DProject[]) => {
          async.forEachLimit(projects, 1, (project: DProject, cb) => {
            this._loadProfileFields(project);
            cb();
          }, (err: any) => {
            if (err) {
              reject(err);
            }
            resolve(true);
          });
        }).catch(reject);
    });

  }

  public revoke(project: DProject) {
    this._deleteModel(project);
  }

  public reload(project: DProject) {
    this.revoke(project);
    this._loadProfileFields(project);
  }

  private _loadProfileFields(project: DProject) {
    /* Retrieve the application previous data model */
    let pModel: mongoose.Model<any> = this._models[project.id];

    /* Initialize the custom schema */
    let schema = pModel ? pModel.schema : new mongoose.Schema({}, {
      timestamps: true, discriminatorKey: 'project'
    });

    /* Check for project custom profile */
    const profile = Objects.get(project, 'settings.profile', null);
    if (profile) {
      /* Add each custom field */
      if ('fields' in profile) {
        let profileSchema: any = {};
        profile.fields.forEach((field: DProjectProfileField) => {
          profileSchema[field.name] = {
            type: AccountsProject._fieldType(field),
            defaultValue: AccountsProject._defaultValue(field),
            required: field.required
          };
        });
        /* If the profile exist then remove it */
        if ('profile' in schema['paths']) {
          schema.remove('profile');
        }
        /* Add the new profile definition */
        schema.add({ 'profile': profileSchema });
      }

      /* Add custom indexes */
      if ('indexes' in profile) {
        profile.indexes.forEach((index: DProjectProfileFieldIndex) => {
          let indexObj = index.fields.reduceRight((obj: any, field) => {
            obj[`profile.${field.name}`] = field.order;
            return obj;
          }, {});
          schema.index(indexObj, {});
        });
      }

      /* Add custom unique indexes */
      if ('unique' in profile) {
        profile.unique.forEach((index: DProjectProfileFieldIndex) => {
          let indexObj = index.fields.reduceRight((obj: any, field) => {
            obj[`profile.${field.name}`] = field.order;
            return obj;
          }, {});
          schema.index(indexObj, { unique: true });
        });
      }
    }

    /* If the application has a previous model then has the profile schema updated */
    if (pModel) {
      return;
    }

    /* Register the custom schema */
    pModel = MAccountProject.discriminator(project.id, schema);
    this._addModel(project, pModel);
  }
}
