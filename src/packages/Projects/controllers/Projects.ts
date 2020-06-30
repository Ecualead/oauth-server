import { Arrays } from "@ikoabo/core_srv";
import {
  Project,
  ProjectDocument,
  ProjectModel,
} from "@/Projects/models/projects.model";
import { Domains } from "@/Domains/controllers/Domains";
import { DomainDocument } from "@/Domains/models/domains.model";
import { DataScoped } from "@/controllers/DataScoped";

export class Projects extends DataScoped<Project, ProjectDocument> {
  private static _instance: Projects;

  /**
   * Private constructor
   */
  private constructor() {
    super("Projects", ProjectModel);
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Projects {
    if (!Projects._instance) {
      Projects._instance = new Projects();
    }
    return Projects._instance;
  }

  /**
   * Create new project
   *
   * @param domain  Doamin owning the project
   * @param data   Data of the new project
   */
  public create(data: Project): Promise<ProjectDocument> {
    return new Promise<ProjectDocument>((resolve, reject) => {
      /* Find for the parent domain */
      Domains.shared
        .fetch(data.domain)
        .then((value: DomainDocument) => {
          /* Intersect scope with domain scope */
          data.scope = Arrays.intersect(data.scope, <string[]>value.scope);

          /* Create the new project */
          ProjectModel.create(data).then(resolve).catch(reject);
        })
        .catch(reject);
    });
  }
}
