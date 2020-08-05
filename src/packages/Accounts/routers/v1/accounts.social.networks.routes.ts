/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Router, Request, Response, NextFunction } from "express";
import { Validators, Objects, HTTP_STATUS, ResponseHandler } from "@ikoabo/core_srv";
import { OAuth2Ctrl } from "@/OAuth2/controllers/oauth2.controller";
import { ERRORS as AUTH_ERRORS } from "@ikoabo/auth_srv";
import { ProjectSocialNetworkSettings } from "@/Projects/models/projects.socialnetworks.model";
import {
  SocialNetworkParamsValidation,
  SocialNetworkValidation,
} from "@/Accounts/models/accounts.social.joi";
import {
  AccountSocialRequestModel,
  AccountSocialRequestDocument,
} from "@/Accounts/models/accounts.social.request.model";
import { socialNetworkToInt } from "@/Accounts/models/accounts.social.model";
import { SOCIAL_NETWORK_TYPES } from "@/Projects/models/projects.enum";
import { SocialNetworksStrategyCtrl } from "@/Accounts/controllers/social.networks.strategy.controller";

const router = Router();

/**
 * @api {get} /v1/auth/social/:social Request social network authentication
 * @apiVersion 1.0.0
 * @apiName AuthSocialSignin
 * @apiGroup Social Network Authentication
 *
 */
router.get(
  "/:social",
  Validators.joi(SocialNetworkValidation, "params"),
  Validators.joi(SocialNetworkParamsValidation, "query"),
  (req: Request, res: Response, next: NextFunction) => {
    /* Force authentication with token */
    const token: string = Objects.get(req, "query.token", "").toString();
    req.headers.authorization = `Bearer ${token}`;
    console.log(req.headers);
    OAuth2Ctrl.authenticate()(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    const social: string = req.params.social;
    const socialType: number = socialNetworkToInt(social);
    const token: string = Objects.get(req, "query.token", "").toString();
    const redirect: string = Objects.get(req, "query.redirect", "").toString();

    /* Check if the target project has enabled the given social network authentication */
    const socialNetworks: ProjectSocialNetworkSettings[] = Objects.get(
      res,
      "locals.token.client.project.settings.socialNetworks",
      []
    ).filter(
      (value: ProjectSocialNetworkSettings) => value.type === socialType
    );

    console.log(socialNetworks);

    /* Check if the social network settings is valid */
    if (
      socialType === SOCIAL_NETWORK_TYPES.SN_UNKNOWN ||
      socialNetworks.length <= 0
    ) {
      return next({
        boError: AUTH_ERRORS.INVALID_AUTH_SERVER,
        boStatus: HTTP_STATUS.HTTP_NOT_ACCEPTABLE,
      });
    }

    /* Store social network settings to the next middleware */
    res.locals["socialNetwork"] = socialNetworks[0];

    /* Temporally store request data to allow callback */
    AccountSocialRequestModel.create({
      token: token,
      application: Objects.get(res, "locals.token.client.id"),
      user: Objects.get(res, "locals.token.user.id"),
      redirect: redirect,
      social: social,
    })
      .then((request: AccountSocialRequestDocument) => {
        /* Pass the object to the next middleware */
        res.locals["request"] = request;
        console.log(res.locals);
        next();
      })
      .catch(next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    /* Configure the social network strategy */
    SocialNetworksStrategyCtrl.setupSocialStrategy(
      res.locals["socialNetwork"],
      res.locals["request"]
    );

    /* Calling social network authentication with callback reference */
    SocialNetworksStrategyCtrl.doAuthenticate(
      Objects.get(res, "locals.request"),
      {
        state: Objects.get(res, "locals.request.id"),
        scope: Objects.get(res, "locals.socialNetwork.scope"),
      }
    )(req, <any>res, next);
  },
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    next(err);
  },
  ResponseHandler.error
);

export default router;
