/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Logger } from "@ikoabo/core";
import { EVENT_TYPE } from "@/constants/account.enum";
import { AccountEmailDocument } from "@/models/account/email.model";
import { AccountPhoneDocument } from "@/models/account/phone.model";
import { AccountDocument } from "@/models/account/account.model";

export abstract class BaseNotification {
  protected _logger: Logger;

  abstract doRegister(
    profile: AccountDocument,
    credential: AccountEmailDocument | AccountPhoneDocument,
    payload?: any
  ): Promise<void>;
  abstract doConfirm(
    profile: AccountDocument,
    credential: AccountEmailDocument | AccountPhoneDocument,
    payload?: any
  ): Promise<void>;
  abstract doLogin(
    profile: AccountDocument,
    credential: AccountEmailDocument | AccountPhoneDocument,
    payload?: any
  ): Promise<void>;
  abstract doChPwd(
    profile: AccountDocument,
    credential: AccountEmailDocument | AccountPhoneDocument,
    payload?: any
  ): Promise<void>;
  abstract doRecover(
    profile: AccountDocument,
    credential: AccountEmailDocument | AccountPhoneDocument,
    payload?: any
  ): Promise<void>;

  public constructor(logger: string) {
    this._logger = new Logger(logger);
  }

  public doNotification(
    type: EVENT_TYPE,
    profile: AccountDocument,
    credential: AccountEmailDocument | AccountPhoneDocument,
    payload?: any
  ): Promise<void> {
    /* Validate notification by event type */
    switch (type) {
      case EVENT_TYPE.REGISTER /* Account signup notification */:
        return this.doRegister(profile, credential, payload);
      case EVENT_TYPE.CONFIRM /* Account confirmation notification */:
        return this.doConfirm(profile, credential, payload);
      case EVENT_TYPE.LOGIN /* Account signin notification */:
        return this.doLogin(profile, credential, payload);
      case EVENT_TYPE.CHPWD /* Account change password notification */:
        return this.doChPwd(profile, credential, payload);
      case EVENT_TYPE.RECOVER /* Account recover notification */:
        return this.doRecover(profile, credential, payload);
      default:
        /* Invalid notification type */
        this._logger.error("Sending invalid notification", {
          type: type
        });
        return new Promise<void>((resolve) => {
          resolve();
        });
    }
  }
}
