import { Arrays, Token, CRUD } from "@ikoabo/core_srv";
import { ERRORS } from "@ikoabo/auth_srv";
import {
  Application,
  ApplicationDocument,
  ApplicationModel,
} from "../models/applications.model";
import { DataScoped } from "@/controllers/data.scoped.controller";
import { Projects } from "@/packages/Projects/controllers/projects.controller";
import { ProjectDocument } from "@/packages/Projects/models/projects.model";

export class Applications extends DataScoped<Application, ApplicationDocument> {
  private static _instance: Applications;

  /**
   * Private constructor
   */
  private constructor() {
    super("Applications", ApplicationModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Applications {
    if (!Applications._instance) {
      Applications._instance = new Applications();
    }
    return Applications._instance;
  }

  /**
   * Create new application
   *
   * @param project  Project owning the application
   * @param data   Data of the new application
   */
  public create(data: Application): Promise<ApplicationDocument> {
    return new Promise<ApplicationDocument>((resolve, reject) => {
      /* Find the parent project */
      Projects.shared
        .fetch(<string>data.project)
        .then((project: ProjectDocument) => {
          /* Set the project owning */
          data.project = project.id;

          /* Intersect scope with project scope */
          data.scope = Arrays.intersect(data.scope, project.scope);

          /* Generate application secret */
          data.secret = Token.longToken;

          super.create(data).then(resolve).catch(reject);
        })
        .catch(reject);
    });
  }
}