/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import {
  ProjectExternalAuthDocument,
  ProjectExternalAuthModel
} from "@/models/project/external-auth.model";
import { CRUD } from "@ecualead/server";

class ProjectExternalAuth extends CRUD<ProjectExternalAuthDocument> {
  private static _instance: ProjectExternalAuth;

  /**
   * Private constructor
   */
  private constructor() {
    super("ProjectExternalAuth", ProjectExternalAuthModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): ProjectExternalAuth {
    if (!ProjectExternalAuth._instance) {
      ProjectExternalAuth._instance = new ProjectExternalAuth();
    }
    return ProjectExternalAuth._instance;
  }
}

export const ProjectExternalAuthCtrl = ProjectExternalAuth.shared;
