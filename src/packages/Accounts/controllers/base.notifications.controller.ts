/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { AccountProjectProfileDocument } from "@/Accounts/models/accounts.projects.model";
import { NOTIFICATIONS_EVENTS_TYPES } from "@/Accounts/models/accounts.enum";
import { Logger } from "@ikoabo/core_srv";

abstract class BaseNotificationsClass {
  protected _logger: Logger;

  abstract doSignup(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void>;
  abstract doConfirm(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void>;
  abstract doSignin(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void>;
  abstract doChPwd(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void>;
  abstract doRecover(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void>;

  public constructor(logger: string) {
    this._logger = new Logger(logger);
  }

  public doNotification(
    type: NOTIFICATIONS_EVENTS_TYPES,
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void> {
    /* Validate notification by event type */
    switch (type) {
      case NOTIFICATIONS_EVENTS_TYPES.NET_SIGNUP /* Account signup notification */:
        return this.doSignup(profile, payload);
      case NOTIFICATIONS_EVENTS_TYPES.NET_CONFIRM /* Account confirmation notification */:
        return this.doConfirm(profile, payload);
      case NOTIFICATIONS_EVENTS_TYPES.NET_SIGNIN /* Account signin notification */:
        return this.doSignin(profile, payload);
      case NOTIFICATIONS_EVENTS_TYPES.NET_CHPWD /* Account change password notification */:
        return this.doChPwd(profile, payload);
      case NOTIFICATIONS_EVENTS_TYPES.NET_RECOVER /* Account recover notification */:
        return this.doRecover(profile, payload);
      default:
        /* Invalid notification type */
        this._logger.error("Sending invalid notification", {
          type: type,
          profile: profile,
          payload: payload,
        });
        return new Promise<void>((resolve) => {
          resolve();
        });
    }
  }
}
export const BaseNotifications = BaseNotificationsClass;
