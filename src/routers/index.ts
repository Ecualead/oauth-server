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
import { register as registerAccount } from "./account.router";
import { register as registerExternalAuth } from "./external.auth.router";
import { register as registerOAuth2 } from "./oauth2.router";

const router = Router({ mergeParams: true });

registerAccount(router, "");
registerOAuth2(router, "");
registerExternalAuth(router, "/external");

export const OAuth2Router = router;
