/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { prop, index } from "@typegoose/typegoose";
import { VALIDATION_TOKEN_STATUS } from "@ecualead/auth";

@index({ token: 1 })
@index({ status: 1 })
@index({ expire: 1 })
export class ValidationToken {
  @prop()
  token?: string;

  @prop({ required: true, default: 0 })
  attempts?: number;

  @prop({ required: true, default: VALIDATION_TOKEN_STATUS.DISABLED })
  status?: number;

  @prop({ required: true, default: 0 })
  expire?: number;
}
