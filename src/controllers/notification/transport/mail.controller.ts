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
import { Objects } from "@ikoabo/core";
import { MailCtrl } from "@ikoabo/mailer";
import { BaseNotification } from "@/controllers/notification/base.controller";
import { AccountDocument } from "@/models/account/account.model";
import { AccountEmailDocument } from "@/models/account/email.model";

interface IMailNotification {
  project: string;
  type: string;
  subject: string;
  lang: string;
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

  private _getAccountData(
    profile: AccountDocument,
    credential: AccountEmailDocument,
    payload?: any
  ): any {
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

  private _getToken(credential: AccountEmailDocument, payload?: any): string {
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
        data.project,
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
        data.account.email,
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
    credential: AccountEmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-register",
      subject: "Cuenta de usuario registrada",
      lang: "es",
      account: this._getAccountData(profile, credential, payload),
      token: this._getToken(credential, payload)
    });
  }

  public doConfirm(
    profile: AccountDocument,
    credential: AccountEmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-confirm",
      subject: "Cuenta de usuario confirmada",
      lang: "es",
      account: this._getAccountData(profile, credential, payload)
    });
  }

  public doLogin(
    profile: AccountDocument,
    credential: AccountEmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-login",
      subject: "Nuevo inicio de sesión",
      lang: "es",
      account: this._getAccountData(profile, credential, payload)
    });
  }

  public doChPwd(
    profile: AccountDocument,
    credential: AccountEmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-chpwd",
      subject: "Nuevo cambio de contraseña",
      lang: "es",
      account: this._getAccountData(profile, credential, payload)
    });
  }

  public doRecover(
    profile: AccountDocument,
    credential: AccountEmailDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-recover",
      subject: "Recuperar cuenta de usuario",
      lang: "es",
      account: this._getAccountData(profile, credential, payload),
      token: this._getToken(credential, payload)
    });
  }
}

export const MailNotificationCtrl = MailNotification.shared;
