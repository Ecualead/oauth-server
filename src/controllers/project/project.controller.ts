/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ProjectDocument, ProjectModel } from "@/models/project/project.model";
import { CRUD } from "@ecualead/server";

class Project extends CRUD<ProjectDocument> {
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
