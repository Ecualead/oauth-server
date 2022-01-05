/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { EVENT_TYPE } from "../../constants/account.enum";
import { NOTIFICATION_TYPE } from "../../constants/project.enum";
import { AccountDocument } from "../../models/account/account.model";
import { EmailDocument } from "../../models/account/email.model";
import { PhoneDocument } from "../../models/account/phone.model";
import { Logger } from "@ecualead/server";
import { MailNotificationCtrl } from "./transport/mail.controller";
import { IOauth2Settings } from "../../settings";

export class Notification {
  private static _instance: Notification;
  private _logger: Logger;
  private _settings: IOauth2Settings;

  private constructor() {
    this._logger = new Logger("Notifications");
  }

  /**
   * Setup the user account controller
   */
  public static setup(settings: IOauth2Settings) {
    if (!Notification._instance) {
      Notification._instance = new Notification();
      Notification._instance._settings = settings;
    } else {
      throw new Error("Notifications already configured");
    }
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Notification {
    if (!Notification._instance) {
      throw new Error("Notifications isn't configured");
    }
    return Notification._instance;
  }

  /**
   * Do an event notification
   *
   * @param type
   * @param profile
   * @param payload
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
          if (this._settings.emailNotifications.registerEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.LOGIN:
          if (this._settings.emailNotifications.loginEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.CONFIRM:
          if (this._settings.emailNotifications.confirmEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.CHPWD:
          if (this._settings.emailNotifications.chPwdEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
        case EVENT_TYPE.RECOVER:
          if (this._settings.emailNotifications.recoverEvent) {
            eventType = NOTIFICATION_TYPE.EMAIL;
          }
          break;
      }

      /* Check for email notification */
      if (eventType && (eventType & NOTIFICATION_TYPE.EMAIL) === NOTIFICATION_TYPE.EMAIL) {
        /* Call the notifications */
        return this._callNotifications(
          NOTIFICATION_TYPE.EMAIL,
          type,
          profile,
          credential,
          payload
        ).finally(() => {
          resolve(true);
        });
      }

      resolve(true);
    });
  }

  /**
   * Call the notification handler by notification type
   *
   * @param type
   * @param event
   * @param profile
   * @param payload
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
