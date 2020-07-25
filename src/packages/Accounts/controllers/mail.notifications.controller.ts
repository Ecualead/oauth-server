/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity Auth Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { BaseNotifications } from "@/Accounts/controllers/base.notifications.controller";
import { AccountProjectProfileDocument } from "@/Accounts/models/accounts.projects.model";
import { Mail } from "@ikoabo/comm_srv";
import { Objects } from "@ikoabo/core_srv";
import { Account } from "@/Accounts/models/accounts.model";

const MailCtrl = Mail.shared;
interface IMailNotification {
  project: string;
  type: string;
  subject: string;
  lang: string;
  account: Account;
  token?: string;
}

export class MailNotifications extends BaseNotifications {
  private static _instance: MailNotifications;

  private constructor() {
    super("MailNotifications");
  }

  /**
   * Get singleton class instance
   */
  public static get shared(): MailNotifications {
    if (!MailNotifications._instance) {
      MailNotifications._instance = new MailNotifications();
    }
    return MailNotifications._instance;
  }

  private _getAccountData(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Account {
    /* Fetch the account notification data */
    let account: Account = {
      name: Objects.get(profile, "account.name", ""),
      lastname: Objects.get(profile, "account.lastname", ""),
      code: Objects.get(profile, "account.code", ""),
      email: Objects.get(
        payload,
        "email",
        Objects.get(profile, "account.email", "")
      ),
      phone: Objects.get(profile, "account.phone", ""),
      createdAt: Objects.get(profile, "account.createdAt", ""),
    };
    return account;
  }

  private _getToken(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): string {
    /* Fetch the user account token to be sent */
    const token: string = Objects.get(
      payload,
      "token",
      Objects.get(profile, "account.recover.token", "")
    );
    return token;
  }

  private sendMail(data: IMailNotification): Promise<void> {
    return new Promise<void>((resolve) => {
      /* Send mail notification about the account creation */
      MailCtrl.send(
        data.project,
        data.type,
        data.subject,
        data.lang,
        data.account.email,
        [],
        [],
        {
          name: data.account.name,
          code: data.account.code,
          phone: data.account.phone,
          date: data.account.createdAt,
          token: data.token,
          email: data.account.email,
        }
      ).finally(() => {
        this._logger.debug("Sending mail notification", data);
        resolve();
      });
    });
  }

  public doSignup(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-signup",
      subject: "Cuenta de usuario registrada",
      lang: "es",
      account: this._getAccountData(profile, payload),
      token: this._getToken(profile, payload),
    });
  }

  public doConfirm(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-confirm",
      subject: "Cuenta de usuario confirmada",
      lang: "es",
      account: this._getAccountData(profile, payload),
    });
  }

  public doSignin(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-signin",
      subject: "Nuevo inicio de sesión",
      lang: "es",
      account: this._getAccountData(profile, payload),
    });
  }

  public doChPwd(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-chpwd",
      subject: "Nuevo cambio de contraseña",
      lang: "es",
      account: this._getAccountData(profile, payload),
    });
  }

  public doRecover(
    profile: AccountProjectProfileDocument,
    payload?: any
  ): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-recover",
      subject: "Recuperar cuenta de usuario",
      lang: "es",
      account: this._getAccountData(profile, payload),
      token: this._getToken(profile, payload),
    });
  }
}
