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
import { ProjectKeyDocument, ProjectKeyModel } from "@/models/project/key.model";
import { DataScoped } from "@/controllers/data.scoped.controller";

class ProjectKey extends DataScoped<ProjectKeyDocument> {
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
