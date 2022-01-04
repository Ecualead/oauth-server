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
  ProjectRestrictIpDocument,
  ProjectRestrictIpModel
} from "@/models/project/restrict-ip.model";
import { CRUD } from "@ikoabo/server";

class ProjectRestrictIp extends CRUD<ProjectRestrictIpDocument> {
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
