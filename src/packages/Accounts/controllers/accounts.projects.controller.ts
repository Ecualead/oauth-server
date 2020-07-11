import mongoose from "mongoose";
import async from "async";
import { Logger, Objects, BASE_STATUS } from "@ikoabo/core_srv";
import {
  ProjectDocument,
  ProjectModel,
} from "@/Projects/models/projects.model";
import { PROTECTED_PROJECT_FIELDS } from "@/Accounts/models/accounts.enum";
import {
  ProjectProfileField,
  ProjectProfileFieldIndex,
} from "@/Projects/models/projects.profiles.model";
import { PROFILE_FIELD_TYPES } from "@/Projects/models/projects.enum";
import { AccountProjectProfileModel } from "@/Accounts/models/accounts.projects.model";

interface ICustomProject {
  [key: string]: mongoose.Model<any>;
}

class AccountsProjects {
  private static _instance: AccountsProjects;
  private _logger: Logger;
  private _models: ICustomProject;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    this._logger = new Logger("AccountsProject");
    this._logger.debug("Instantiating AccountProjects singleton class");
    this._models = {};
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): AccountsProjects {
    if (!AccountsProjects._instance) {
      AccountsProjects._instance = new AccountsProjects();
    }
    return AccountsProjects._instance;
  }

  private _addModel(project: ProjectDocument, model: mongoose.Model<any>) {
    this._logger.debug("Registering custom profile schema", {
      id: project.id,
      name: project.name,
    });
    this._models[project.id] = model;
  }

  public getModel(project: string): Promise<mongoose.Model<any>> {
    return new Promise<mongoose.Model<any>>((resolve, reject) => {
      /* Check if the model is precached */
      if (this._models[project]) {
        return resolve(this._models[project]);
      }

      /* Initialize the project data model */
      ProjectModel.findOne({ _id: project, status: BASE_STATUS.BS_ENABLED })
        .then((projectObj: ProjectDocument) => {
          this._loadProfileFields(projectObj);
          return resolve(this._models[project]);
        })
        .catch(reject);
    });
  }

  private _deleteModel(project: ProjectDocument) {
    this._logger.debug("Removing custom profile schema model", {
      id: project.id,
      name: project.name,
    });
    if (project.id in this._models) {
      /* Look for custom profile paths */
      let keys = Object.keys(this._models[project.id].schema["paths"]);
      keys = keys.filter((key) => {
        return PROTECTED_PROJECT_FIELDS.indexOf(key) < 0;
      });

      /* Remove custom fields path */
      this._models[project.id].schema.remove(keys);
    }
  }

  private static _fieldType(
    field: ProjectProfileField
  ): typeof mongoose.SchemaType | [typeof mongoose.SchemaType] {
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

  private static _defaultValue(
    field: ProjectProfileField
  ): number | boolean | string {
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

  public revoke(project: ProjectDocument) {
    this._deleteModel(project);
  }

  public reload(project: ProjectDocument) {
    this.revoke(project);
    this._loadProfileFields(project);
  }

  private _loadProfileFields(project: ProjectDocument) {
    /* Retrieve the application previous data model */
    let pModel: mongoose.Model<any> = this._models[project.id];

    /* Initialize the custom schema */
    let schema = pModel
      ? pModel.schema
      : new mongoose.Schema(
          {},
          {
            timestamps: true,
            discriminatorKey: "projectId",
          }
        );

    /* Check for project custom profile */
    const profile = Objects.get(project, "settings.profile", null);
    if (profile) {
      /* Add each custom field */
      if ("fields" in profile) {
        let profileSchema: any = {};
        profile.fields.forEach((field: ProjectProfileField) => {
          profileSchema[field.name] = {
            type: AccountsProjects._fieldType(field),
            defaultValue: AccountsProjects._defaultValue(field),
            required: field.required,
          };
        });
        /* If the profile exist then remove it */
        if ("profile" in schema["paths"]) {
          schema.remove("profile");
        }
        /* Add the new profile definition */
        schema.add({ profile: profileSchema });
      }

      /* Add custom indexes */
      if ("indexes" in profile) {
        profile.indexes.forEach((index: ProjectProfileFieldIndex) => {
          let indexObj = index.names.reduceRight((obj: any, name) => {
            obj[`profile.${name}`] = 1;
            return obj;
          }, {});
          schema.index(indexObj, {});
        });
      }

      /* Add custom unique indexes */
      if ("unique" in profile) {
        profile.unique.forEach((index: ProjectProfileFieldIndex) => {
          let indexObj = index.names.reduceRight((obj: any, name) => {
            obj[`profile.${name}`] = 1;
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
    pModel = AccountProjectProfileModel.discriminator(project.id, schema);
    this._addModel(project, pModel);
  }
}

export const AccountProjectCtrl = AccountsProjects.shared;
