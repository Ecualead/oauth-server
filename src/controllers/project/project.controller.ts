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
import { DataScoped } from "@/controllers/data.scoped.controller";
import { ProjectDocument, ProjectModel } from "@/models/project/project.model";

class Project extends DataScoped<ProjectDocument> {
  private static _instance: Project;

  /**
   * Private constructor
   */
  private constructor() {
    super("Projects", ProjectModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Project {
    if (!Project._instance) {
      Project._instance = new Project();
    }
    return Project._instance;
  }
}

export const ProjectCtrl = Project.shared;
