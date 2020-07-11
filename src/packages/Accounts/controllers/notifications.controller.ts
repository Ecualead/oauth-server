import { AccountProjectProfileDocument } from "../models/accounts.projects.model";
import { Objects, Logger } from "@ikoabo/core_srv";
import async from "async";
import { ProjectNotification } from "@/packages/Projects/models/projects.notifications.model";
import { NOTIFICATION_TYPES } from "@/packages/Projects/models/projects.enum";
import { MailNotifications } from "./mail.notifications.controller";
import { NOTIFICATIONS_EVENTS_TYPES } from "../models/accounts.enum";

export class Notifications {
  private static _instance: Notifications;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("Notifications");
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Notifications {
    if (!Notifications._instance) {
      Notifications._instance = new Notifications();
    }
    return Notifications._instance;
  }

  /**
   * Do an event notification
   *
   * @param type
   * @param profile
   */
  public doNotification(
    type: NOTIFICATIONS_EVENTS_TYPES,
    profile: AccountProjectProfileDocument
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      /* Retrieve notifications handlers from settings */
      const notifications: ProjectNotification[] = Objects.get(
        profile,
        "project.settings.notifications",
        []
      );

      /* Iterate each notification setting */
      async.forEachLimit(
        notifications,
        1,
        (item: ProjectNotification, cb) => {
          /* Check if the event type is enabled */
          switch (item.type) {
            case NOTIFICATION_TYPES.NT_EMAIL:
              switch (type) {
                case NOTIFICATIONS_EVENTS_TYPES.NET_SIGNUP:
                  if (!item.signup) {
                    return cb();
                  }
                  break;
                case NOTIFICATIONS_EVENTS_TYPES.NET_SIGNIN:
                  if (!item.signin) {
                    return cb();
                  }
                  break;
                case NOTIFICATIONS_EVENTS_TYPES.NET_CONFIRM:
                  if (!item.confirm) {
                    return cb();
                  }
                  break;
                case NOTIFICATIONS_EVENTS_TYPES.NET_CHPWD:
                  if (!item.chPwd) {
                    return cb();
                  }
                  break;
                case NOTIFICATIONS_EVENTS_TYPES.NET_RECOVER:
                  if (!item.recover) {
                    return cb();
                  }
                  break;
              }

              /* Call the notifications */
              this._callNotifications(item.type, type, profile).finally(() => {
                cb();
              });
              break;
            default:
              this._logger.error("Invalid notification settings", item);
              cb();
          }
        },
        (err) => {
          if (err) {
            this._logger.error('Error sending notifications', err);
          }
          resolve();
        }
      );
    });
  }

  /**
   * Call the notification handler by notification type
   *
   * @param type
   * @param event
   * @param profile
   */
  private _callNotifications(
    type: NOTIFICATION_TYPES,
    event: NOTIFICATIONS_EVENTS_TYPES,
    profile: AccountProjectProfileDocument
  ): Promise<void> {
    switch (type) {
      case NOTIFICATION_TYPES.NT_EMAIL:
        return MailNotifications.shared.doNotification(event, profile);
      default:
        this._logger.error("Not allowed notification type", {
          type: type,
          event: event,
          profile: profile,
        });
        return new Promise<void>((resolve) => {
          resolve();
        });
    }
  }
}