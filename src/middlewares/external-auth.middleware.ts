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
  ProjectExternalAuthDocument,
  ProjectExternalAuthModel
} from "@/models/project/external-auth.model";
import { AUTH_ERRORS } from "@ikoabo/auth";
import { HTTP_STATUS, Objects } from "@ikoabo/core";
import { NextFunction, Request, Response } from "express";

export function checkExternal(req: Request, res: Response, next: NextFunction) {
  const external: string = req.params.external;
  const project = Objects.get(res, "locals.project._id");
  ProjectExternalAuthModel.findById({ _id: external, project: project })
    .then((external: ProjectExternalAuthDocument) => {
      if (!external) {
        return next({
          boError: AUTH_ERRORS.INVALID_SOCIAL_REQUEST,
          boStatus: HTTP_STATUS.HTTP_4XX_FORBIDDEN
        });
      }

      res.locals["external"] = external;
      next();
    })
    .catch(next);
}
