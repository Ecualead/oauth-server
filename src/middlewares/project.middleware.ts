/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { ProjectCtrl } from "@/controllers/project/project.controller";
import { ProjectDocument } from "@/models/project/project.model";
import { Objects } from "@ecualead/server";
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
