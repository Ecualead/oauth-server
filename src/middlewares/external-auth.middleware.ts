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
