/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { Logger } from "@ecualead/server";
import random from "random";
import randomColor from "randomcolor";
import gender from "gender-detection";
import nameInitials from "name-initials";

const MALE_COLORS: any[] = ["red", "brown", "green", "blue"];
const FEMALE_COLORS: any[] = ["orange", "yellow", "purple", "pink"];
const RandomCtrl = random;

export class Icon {
  private static _instance: Icon;
  private _logger: Logger;

  private constructor() {
    this._logger = new Logger("Account:Icon");
  }

  public static get shared(): Icon {
    if (!Icon._instance) {
      Icon._instance = new Icon();
    }
    return Icon._instance;
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

export const IconCtrl = Icon.shared;
