/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { DataScoped } from "@/controllers/data.scoped.controller";
import {
  Module,
  ModuleModel,
  ModuleDocument,
} from "@/Modules/models/modules.model";

/**
 * Module controller
 */
class Modules extends DataScoped<Module, ModuleDocument> {
  private static _instance: Modules;

  private constructor() {
    super("Modules", ModuleModel, "module");
  }

  /**
   * Retrieve singleton class instance
   */
  public static get shared(): Modules {
    if (!Modules._instance) {
      Modules._instance = new Modules();
    }
    return Modules._instance;
  }
}

export const ModuleCtrl = Modules.shared;
