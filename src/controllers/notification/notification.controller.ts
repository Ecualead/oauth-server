/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EVENT_TYPE, NOTIFICATION_TYPE } from "../../constants/oauth2.enum";
import { AccountDocument } from "../../models/account/account.model";
import { EmailDocument } from "../../models/account/email.model";
import { PhoneDocument } from "../../models/account/phone.model";
import { Logger } from "@ecualead/server";
import { MailNotificationCtrl } from "./transport/mail.controller";
import { Settings } from "../settings.controller";

export class Notification {
  private static _instance: Notification;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("Notifications");
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Notification {
    if (!Notification._instance) {
      Notification._instance = new Notification();
    }
    return Notification._instance;
  }

  /**
   * Do an event notification
   */
  public doNotification(
    type: EVENT_TYPE,
    profile: AccountDocument,
    credential: EmailDocument | PhoneDocument,
    payload?: any
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      /* Retrieve notifications handlers from settings */

      let eventType: any;

      switch (type) {
        case EVENT_TYPE.REGISTER:
          if (Settings.shared.value?.emailNotifications.registerEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.LOGIN:
          if (Settings.shared.value?.emailNotifications.loginEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.CONFIRM:
          if (Settings.shared.value?.emailNotifications.confirmEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.CHPWD:
          if (Settings.shared.value?.emailNotifications.chPwdEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.RECOVER:
          if (Settings.shared.value?.emailNotifications.recoverEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
      }

      /* Check for email notification */
      if (eventType && (eventType & NOTIFICATION_TYPE.EMAIL) === NOTIFICATION_TYPE.EMAIL) {
        /* Call the notifications */
        return this._callNotifications(NOTIFICATION_TYPE.EMAIL, type, profile, credential, payload)
          .catch((err) => {
            this._logger.error("Error sending email notification", { error: err });
          })
          .finally(() => {
            resolve(true);
          });
      }

      resolve(true);
    });
  }

  /**
   * Call the notification handler by notification type
   */
  private _callNotifications(
    type: NOTIFICATION_TYPE,
    event: EVENT_TYPE,
    profile: AccountDocument,
    credential: EmailDocument | PhoneDocument,
    payload?: any
  ): Promise<void> {
    /* Trigger notification checking notification type */
    switch (type) {
      case NOTIFICATION_TYPE.EMAIL /* Email notification */:
        return MailNotificationCtrl.doNotification(event, profile, credential, payload);
      default:
        this._logger.error("Not allowed notification type", {
          type: type,
          event: event
        });
        return new Promise<void>((resolve) => {
          resolve();
        });
    }
  }
}

export const NotificationCtrl = Notification.shared;
