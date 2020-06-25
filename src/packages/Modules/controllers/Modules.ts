import { DataScoped } from "@/controllers/DataScoped";
import {
  Module,
  ModuleModel,
  ModuleDocument,
} from "@/packages/Modules/models/modules.model";
import { Request, Response, NextFunction } from "express";
import { BASE_STATUS, ERRORS, Objects } from "@ikoabo/core_srv";

export class Modules extends DataScoped<Module, ModuleDocument> {
  private static _instance: Modules;

  private constructor() {
    super("Modules", ModuleModel);
  }

  public static get shared(): Modules {
    if (!Modules._instance) {
      Modules._instance = new Modules();
    }
    return Modules._instance;
  }

  public static validateModule(modulePath: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      Modules.shared
        .fetch(Objects.get(req, modulePath,''))
        .then((value: ModuleDocument) => {
          if (!value || value.status !== BASE_STATUS.BS_ENABLED) {
            return next({ boError: ERRORS.OBJECT_NOT_FOUND });
          }

          res.locals["module"] = value;
          next();
        })
        .catch(next);
    };
  }
}
