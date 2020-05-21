/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: restrict_ip.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T07:11:12-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { APPLICATION_IP_RESTRICTION } from '@/models/types/application';

/**
 * Application restrict ip interface
 */
export interface IApplicationRestrictIp {
  id: string;
  ip: string;
  type: number;
}

/**
 * Application restric ip document
 */
export type DApplicationRestrictIp = mongoose.Document & IApplicationRestrictIp;

/**
 * Application restric ip schema
 */
export const SApplicationRestrictIp = new mongoose.Schema({
  ip: { type: String, required: true },
  type: { type: Number, required: true, default: APPLICATION_IP_RESTRICTION.APP_IR_ALLOWED },
}, { timestamps: true });
