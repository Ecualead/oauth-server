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
  token: string;
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

  public doSignup(profile: AccountProjectProfileDocument): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-register",
      subject: "Cuenta de usuario registrada",
      lang: "es",
      account: Objects.get(profile, "account", {}),
      token: Objects.get(profile, "account.recoverToken.token", null),
    });
  }

  public doConfirm(profile: AccountProjectProfileDocument): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-confirm",
      subject: "Cuenta de usuario confirmada",
      lang: "es",
      account: Objects.get(profile, "account", {}),
      token: Objects.get(profile, "account.recoverToken.token", null),
    });
  }

  public doSignin(profile: AccountProjectProfileDocument): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-signin",
      subject: "Nuevo inicio de sesión",
      lang: "es",
      account: Objects.get(profile, "account", {}),
      token: Objects.get(profile, "account.recoverToken.token", null),
    });
  }

  public doChPwd(profile: AccountProjectProfileDocument): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-chpwd",
      subject: "Nuevo cambio de contraseña",
      lang: "es",
      account: Objects.get(profile, "account", {}),
      token: Objects.get(profile, "account.recoverToken.token", null),
    });
  }

  public doRecover(profile: AccountProjectProfileDocument): Promise<void> {
    return this.sendMail({
      project: Objects.get(profile, "project.id", profile.project),
      type: "account-recover",
      subject: "Recuperar cuenta de usuario",
      lang: "es",
      account: Objects.get(profile, "account", {}),
      token: Objects.get(profile, "account.recoverToken.token", null),
    });
  }
}
