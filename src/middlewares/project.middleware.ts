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
import { ProjectCtrl } from "@/controllers/project/project.controller";
import { ProjectDocument } from "@/models/project/project.model";
import { Objects } from "@ikoabo/core";
import { NextFunction, Request, Response } from "express";

/**
 * Fetch project object from id parameter
 *
 * @param req
 * @param res
 * @param next
 */
export function checkUrlProject(req: Request, res: Response, next: NextFunction) {
  const project = Objects.get(req, "params.project");
  ProjectCtrl.fetch({ _id: project })
    .then((project: ProjectDocument) => {
      res.locals["project"] = project;
      next();
    })
    .catch(next);
}
