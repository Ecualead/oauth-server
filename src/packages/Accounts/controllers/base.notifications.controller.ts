import { AccountProjectProfileDocument } from "@/Accounts/models/accounts.projects.model";
import { NOTIFICATIONS_EVENTS_TYPES } from "@/Accounts/models/accounts.enum";
import { Logger } from "@ikoabo/core_srv";

abstract class BaseNotificationsClass {
  protected _logger: Logger;

  abstract doSignup(profile: AccountProjectProfileDocument): Promise<void>;
  abstract doConfirm(profile: AccountProjectProfileDocument): Promise<void>;
  abstract doSignin(profile: AccountProjectProfileDocument): Promise<void>;
  abstract doChPwd(profile: AccountProjectProfileDocument): Promise<void>;
  abstract doRecover(profile: AccountProjectProfileDocument): Promise<void>;

  public constructor(logger: string) {
    this._logger = new Logger(logger);
  }

  public doNotification(
    type: NOTIFICATIONS_EVENTS_TYPES,
    profile: AccountProjectProfileDocument
  ): Promise<void> {
    /* Validate notification by event type */
    switch (type) {
      case NOTIFICATIONS_EVENTS_TYPES.NET_SIGNUP:
        return this.doSignup(profile);
      case NOTIFICATIONS_EVENTS_TYPES.NET_CONFIRM:
        return this.doConfirm(profile);
      case NOTIFICATIONS_EVENTS_TYPES.NET_SIGNIN:
        return this.doSignin(profile);
      case NOTIFICATIONS_EVENTS_TYPES.NET_CHPWD:
        return this.doChPwd(profile);
      case NOTIFICATIONS_EVENTS_TYPES.NET_RECOVER:
        return this.doRecover(profile);
      default:
        return new Promise<void>((resolve) => {
          resolve();
        });
    }
  }
}
export const BaseNotifications = BaseNotificationsClass;
