/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Router } from "express";
import { register as registerGoogle } from './google';

export function register(router: Router, prefix: string) {
  registerGoogle(router, `${prefix}/external/google`);
}
