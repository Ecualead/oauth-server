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
import { EVENT_TYPE } from "@/constants/account.enum";
import { NOTIFICATION_TYPE } from "@/constants/project.enum";
import { AccountDocument } from "@/models/account/account.model";
import { AccountEmailDocument } from "@/models/account/email.model";
import { AccountPhoneDocument } from "@/models/account/phone.model";
import { ProjectDocument } from "@/models/project/project.model";
import { Objects, Logger } from "@ikoabo/core";
import { MailNotificationCtrl } from "./transport/mail.controller";

class Notification {
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
   *
   * @param type
   * @param profile
   * @param payload
   */
  public doNotification(
    type: EVENT_TYPE,
    profile: AccountDocument,
    credential: AccountEmailDocument | AccountPhoneDocument,
    project: ProjectDocument,
    payload?: any
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      /* Retrieve notifications handlers from settings */
      const notifications: any = Objects.get(project, "events", {});
      let eventType: any;

      switch (type) {
        case EVENT_TYPE.REGISTER:
          if (notifications.register) {
            eventType = notifications.register.type;
          }
          break;
        case EVENT_TYPE.LOGIN:
          if (notifications.login) {
            eventType = notifications.login.type;
          }
          break;
        case EVENT_TYPE.CONFIRM:
          if (notifications.confirm) {
            eventType = notifications.confirm.type;
          }
          break;
        case EVENT_TYPE.CHPWD:
          if (notifications.chPwd) {
            eventType = notifications.chPwd.type;
          }
          break;
        case EVENT_TYPE.RECOVER:
          if (notifications.recover) {
            eventType = notifications.recover.type;
          }
          break;
      }

      /* Check for email notification */
      if (eventType && (eventType & NOTIFICATION_TYPE.EMAIL) === NOTIFICATION_TYPE.EMAIL) {
        /* Call the notifications */
        this._callNotifications(
          NOTIFICATION_TYPE.EMAIL,
          type,
          profile,
          credential,
          payload
        ).finally(() => {
          resolve(true);
        });
      }
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
    credential: AccountEmailDocument | AccountPhoneDocument,
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
