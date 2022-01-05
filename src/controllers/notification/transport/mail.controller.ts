/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Objects } from "@ecualead/server";
import { MailCtrl } from "@ikoabo/mailer";
import { BaseNotification } from "../../../controllers/notification/base.controller";
import { AccountDocument } from "../../../models/account/account.model";
import { EmailDocument } from "../../../models/account/email.model";

interface IMailNotification {
  type: string;
  subject: string;
  account: any;
  token?: string;
}

class MailNotification extends BaseNotification {
  private static _instance: MailNotification;

  private constructor() {
    super("MailNotifications");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): MailNotification {
    if (!MailNotification._instance) {
      MailNotification._instance = new MailNotification();
    }
    return MailNotification._instance;
  }

  private _getAccountData(profile: AccountDocument, credential: EmailDocument, payload?: any): any {
    /* Fetch the account notification data */
    return {
      name: Objects.get(profile, "name", ""),
      lastname1: Objects.get(profile, "lastname1", ""),
      lastname2: Objects.get(profile, "lastname2", ""),
      code: Objects.get(profile, "code", ""),
      email: Objects.get(payload, "email", Objects.get(credential, "email", "")),
      createdAt: Objects.get(profile, "createdAt", "")
    };
  }

  private _getToken(credential: EmailDocument, payload?: any): string {
    /* Fetch the user account token to be sent */
    let token: string = Objects.get(payload, "token");
    const email: string = Objects.get(payload, "email");
    if (!token) {
      token = Objects.get(credential, "token.token");
    }
    return token;
  }

  private sendMail(data: IMailNotification): Promise<void> {
    return new Promise<void>((resolve) => {
      /* Send mail notification about the account creation */
      MailCtrl.send(
        "",
        data.subject,
        null,
        data.type,
        {
          name: data.account.name,
          code: data.account.code,
          phone: data.account.phone,
          date: data.account.createdAt,
          token: data.token,
          email: data.account.email
        },
        [data.account.email],
        [],
        []
      ).finally(() => {
        this._logger.debug("Sending mail notification", data);
        resolve();
      });
    });
  }

  public doRegister(
    profile: AccountDocument,
    credential: EmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      type: "account-register",
      subject: "Cuenta de usuario registrada",
      account: this._getAccountData(profile, credential, payload),
      token: this._getToken(credential, payload)
    });
  }

  public doConfirm(
    profile: AccountDocument,
    credential: EmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      type: "account-confirm",
      subject: "Cuenta de usuario confirmada",
      account: this._getAccountData(profile, credential, payload)
    });
  }

  public doLogin(
    profile: AccountDocument,
    credential: EmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      type: "account-login",
      subject: "Nuevo inicio de sesión",
      account: this._getAccountData(profile, credential, payload)
    });
  }

  public doChPwd(
    profile: AccountDocument,
    credential: EmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      type: "account-chpwd",
      subject: "Nuevo cambio de contraseña",
      account: this._getAccountData(profile, credential, payload)
    });
  }

  public doRecover(
    profile: AccountDocument,
    credential: EmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      type: "account-recover",
      subject: "Recuperar cuenta de usuario",
      account: this._getAccountData(profile, credential, payload),
      token: this._getToken(credential, payload)
    });
  }
}

export const MailNotificationCtrl = MailNotification.shared;
