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
import {
  ProjectExternalAuthDocument,
  ProjectExternalAuthModel
} from "@/models/project/external-auth.model";
import { DataScoped } from "@/controllers/data.scoped.controller";

class ProjectExternalAuth extends DataScoped<ProjectExternalAuthDocument> {
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
