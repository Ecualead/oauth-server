/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: notification_settings.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-25T10:40:48-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

import * as mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '@/models/types/notification';
/**
 * Notification settings interface
 */
export interface INotificationSettings {
  id: string;
  type: number;
  signup: boolean;
  confirm: boolean;
  signin: boolean;
  chDrv: boolean;
  chPwd: boolean;
  recover: boolean;
  urls?: {
    confirm?: string;
    recover?: string;
  };
}

/**
 * Notification settings document
 */
export type DNotificationSettings = mongoose.Document & INotificationSettings;

/**
 * Notification settings schema
 */
export const SNotificationSettings = new mongoose.Schema({
  type: { type: Number, required: true, default: NOTIFICATION_TYPES.NT_UNKNOWN },
  signup: { type: Boolean, required: true, default: false },
  confirm: { type: Boolean, required: true, default: false },
  signin: { type: Boolean, required: true, default: false },
  chDrv: { type: Boolean, required: true, default: false },
  chPwd: { type: Boolean, required: true, default: false },
  recover: { type: Boolean, required: true, default: false },
  urls: {
    confirm: String,
    recover: String,
  },
}, { timestamps: true });
