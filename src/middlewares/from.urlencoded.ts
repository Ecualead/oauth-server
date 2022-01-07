/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { HTTP_STATUS, SERVER_ERRORS } from "@ecualead/server";
import { Request, Response, NextFunction } from "express";

export function middleware(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers["content-type"];
  if (contentType !== "application/x-www-form-urlencoded") {
    return next({
      boError: SERVER_ERRORS.INVALID_OPERATION,
      boStatus: HTTP_STATUS.HTTP_4XX_NOT_ACCEPTABLE
    });
  }
  next();
}
