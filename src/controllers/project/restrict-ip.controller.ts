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
  ProjectRestrictIpDocument,
  ProjectRestrictIpModel
} from "@/models/project/restrict-ip.model";
import { DataScoped } from "@/controllers/data.scoped.controller";

class ProjectRestrictIp extends DataScoped<ProjectRestrictIpDocument> {
  private static _instance: ProjectRestrictIp;

  /**
   * Private constructor
   */
  private constructor() {
    super("ProjectRestrictIp", ProjectRestrictIpModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): ProjectRestrictIp {
    if (!ProjectRestrictIp._instance) {
      ProjectRestrictIp._instance = new ProjectRestrictIp();
    }
    return ProjectRestrictIp._instance;
  }
}

export const ProjectRestrictIpCtrl = ProjectRestrictIp.shared;
