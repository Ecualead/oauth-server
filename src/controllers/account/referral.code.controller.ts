/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import fs from "fs";
import path from "path";
import { AUTH_ERRORS } from "@ecualead/auth";
import { HTTP_STATUS, Logger } from "@ecualead/server";
import AsyncLock from "async-lock";
import RoaringBitmap32 from "roaring/RoaringBitmap32";

const USER_CODE_FILE = path.join(__dirname, "..", "..", "..", "codes", "map.");
const USER_CODE_SIZE = 8;

const lock = new AsyncLock();

class ReferralCode {
  private static _instance: ReferralCode;
  private _logger: Logger;

  /**
   * Allow singleton class instance
   */
  private constructor() {
    this._logger = new Logger("Account:ReferralCode");
  }

  /**
   * Return singleton instance for the class
   */
  static get shared(): ReferralCode {
    if (!ReferralCode._instance) {
      ReferralCode._instance = new ReferralCode();
    }
    return ReferralCode._instance;
  }

  /**
   * Generate new user code
   */
  get code(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let filename: string;
      let bitmap: any;
      let leftValue: number;
      let rightValue: number;

      const topLeft = ReferralCode._genValue();
      leftValue = topLeft;
      do {
        /* Get the code left map component */
        filename = `${USER_CODE_FILE}${leftValue}.map`;
        bitmap = ReferralCode._readMap(filename);

        /* Look for the right value */
        rightValue = ReferralCode._fetchEmpty(bitmap);

        /* If the right component is full search for the next left component */
        if (rightValue < 0) {
          leftValue = ReferralCode._inc(leftValue);

          /* Data is full. This never must happend (2251875390625) */
          if (topLeft === leftValue) {
            this._logger.error("User code data is full");
            reject({
              boError: AUTH_ERRORS.INVALID_CODE_FULL,
              boStatus: HTTP_STATUS.HTTP_4XX_BAD_REQUEST
            });
            return;
          }
        }
      } while (rightValue < 0);

      try {
        /* Save the code map */
        bitmap.runOptimize();
        bitmap.shrinkToFit();
        ReferralCode._saveMap(filename, bitmap);
        const code = `${ReferralCode._toString(leftValue)}${ReferralCode._toString(rightValue)}`;
        this._logger.debug("Generated new user code", { code: code });
        resolve(code);
      } catch (err) {
        this._logger.error("Error generating code", err);
        reject({
          boError: AUTH_ERRORS.INVALID_CODE_ERROR,
          boStatus: HTTP_STATUS.HTTP_4XX_BAD_REQUEST
        });
        return;
      }
    });
  }

  /**
   * Request code value to the master process
   */
  static get request(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      lock.acquire(
        "request-code",
        (done) => {
          /* Request vCode to master process */
          process.send({ action: "get/code" });

          /* Listener to handle code */
          const fetch = (msg: any) => {
            if (msg.action === "get/code") {
              if (msg.err) {
                done(msg.err);
              } else {
                done(null, msg.code);
              }
              process.removeListener("message", fetch);
              return;
            }
          };

          /* Wait until receive the code response from master */
          process.on("message", fetch);
        },
        (err, value: string) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(value);
        }
      );
    });
  }

  /**
   * Transform a number value to String to be used as code
   */
  private static _toString(value: number, chars: number = USER_CODE_SIZE / 2): string {
    let strValue = "";
    let tmpValue: number;

    for (let itr = 0; itr < chars; ++itr) {
      tmpValue = value % 100;
      value = Math.floor(value / 100);

      /* Check if the code is a digit or character */
      const baseCode = tmpValue < 10 ? 48 : 55;
      strValue = `${String.fromCharCode(baseCode + tmpValue)}${strValue}`;
    }
    return strValue.toLowerCase();
  }

  /**
   * Look for empty value into bitmap
   */
  private static _fetchEmpty(bitmap: any): number {
    const topValue = ReferralCode._genValue();
    let value = topValue;
    while (bitmap.has(value)) {
      value = ReferralCode._inc(value);

      if (value === topValue) {
        return -1;
      }
    }

    bitmap.add(value);
    return value;
  }

  /**
   * Increment code value taking into account value restrictions
   */
  private static _inc(value: number, lenght: number = USER_CODE_SIZE / 2): number {
    let tmpValue: number;
    let resultNumber = 0;
    let multiplier = 1;

    let inc = 1;
    for (let itr = 0; itr < lenght; ++itr) {
      tmpValue = value % 100;
      value = Math.floor(value / 100);

      tmpValue += inc;
      if (tmpValue > 35) {
        tmpValue = 0;
      } else {
        inc = 0;
      }

      resultNumber += tmpValue * multiplier;
      multiplier *= 100;
    }
    return resultNumber;
  }

  /**
   * Read the bitmap data from file if it exists
   */
  private static _readMap(name: string) {
    let map: any;
    if (fs.existsSync(name)) {
      const data = fs.readFileSync(name);
      map = RoaringBitmap32.deserialize(data, false);
    } else {
      map = new RoaringBitmap32();
    }
    return map;
  }

  /**
   * Write the bitmap data to a file
   */
  private static _saveMap(name: string, data: any) {
    fs.writeFileSync(name, data.serialize());
  }

  /**
   * Generate random half vCode part
   */
  private static _genValue(length: number = USER_CODE_SIZE / 2) {
    let strValue = "";
    for (let itr = 0; itr < length; ++itr) {
      strValue += ("0" + (Math.floor(Math.random() * 100) % 36)).slice(-2);
    }
    return parseInt(strValue);
  }
}

export const ReferralCodeCtrl = ReferralCode.shared;
