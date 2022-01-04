/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ProjectKeyDocument, ProjectKeyModel } from "@/models/project/key.model";
import { CRUD } from "@ecualead/server";

class ProjectKey extends CRUD<ProjectKeyDocument> {
  private static _instance: ProjectKey;

  /**
   * Private constructor
   */
  private constructor() {
    super("ProjectKey", ProjectKeyModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): ProjectKey {
    if (!ProjectKey._instance) {
      ProjectKey._instance = new ProjectKey();
    }
    return ProjectKey._instance;
  }
}

export const ProjectKeyCtrl = ProjectKey.shared;
