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
import { Logger } from "@ikoabo/core";
import { Random } from "random";
import randomColor from "randomcolor";
const gender = require("gender-detection");
const nameInitials = require("name-initials");

const MALE_COLORS: any[] = ["red", "brown", "green", "blue"];
const FEMALE_COLORS: any[] = ["orange", "yellow", "purple", "pink"];
const RandomCtrl = new Random();

class AccountIcon {
  private static _instance: AccountIcon;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("AccountIcon");
  }

  public static get shared(): AccountIcon {
    if (!AccountIcon._instance) {
      AccountIcon._instance = new AccountIcon();
    }
    return AccountIcon._instance;
  }

  public getInitials(name: string): string {
    return nameInitials(name);
  }

  public getColor(name: string): string {
    const strGender = gender.detect(name);
    const colorBase: string = randomColor({
      luminosity: "dark",
      seed: name,
      hue:
        strGender === "male"
          ? MALE_COLORS[RandomCtrl.int(0, MALE_COLORS.length - 1)]
          : FEMALE_COLORS[RandomCtrl.int(0, FEMALE_COLORS.length - 1)]
    });
    return colorBase;
  }
}

export const AccountIconCtrl = AccountIcon.shared;
