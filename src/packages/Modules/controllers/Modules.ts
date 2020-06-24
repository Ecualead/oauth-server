import { DataScoped } from '@/controllers/DataScoped';
import { Module, ModuleModel, ModuleDocument } from '@/packages/Modules/models/modules.model';

export class Modules extends DataScoped<Module, ModuleDocument> {
  private static _instance: Modules;

  private constructor() {
    super('Modules', ModuleModel);

  }

  public static get shared(): Modules {
    if (!Modules._instance) {
      Modules._instance = new Modules();
    }
    return Modules._instance;
  }
}
