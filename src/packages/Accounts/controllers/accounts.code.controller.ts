import fs from "fs";
import path from "path";
import { Logger } from "@ikoabo/core_srv";
import AsyncLock from "async-lock";
import RoaringBitmap32 from "roaring/RoaringBitmap32";
import { ERRORS } from "@ikoabo/auth_srv";

const USER_CODE_FILE = path.join(__dirname, "..", "..", "codes", "map.");
const USER_CODE_SIZE = 8;

const lock = new AsyncLock();

export class AccountCode {
  private static _instance: AccountCode;
  private _logger: Logger;

  /**
   * Allow singleton class instance
   */
  private constructor() {
    this._logger = new Logger("UserCode");
  }

  /**
   * Return singleton instance for the class
   */
  static get shared(): AccountCode {
    if (!AccountCode._instance) {
      AccountCode._instance = new AccountCode();
    }
    return AccountCode._instance;
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

      const topLeft = AccountCode._genValue();
      leftValue = topLeft;
      do {
        /* Get the code left map component */
        filename = `${USER_CODE_FILE}${leftValue}.map`;
        bitmap = AccountCode._readMap(filename);

        /* Look for the right value */
        rightValue = AccountCode._fetchEmpty(bitmap);

        /* If the right component is full search for the next left component */
        if (rightValue < 0) {
          leftValue = AccountCode._inc(leftValue);

          /* Data is full. This never must happend (2251875390625) */
          if (topLeft === leftValue) {
            this._logger.error("User code data is full");
            reject({ boError: ERRORS.INVALID_CODE_FULL });
            return;
          }
        }
      } while (rightValue < 0);

      try {
        /* Save the code map */
        bitmap.runOptimize();
        bitmap.shrinkToFit();
        AccountCode._saveMap(filename, bitmap);
        const code = `${AccountCode._toString(
          leftValue
        )}${AccountCode._toString(rightValue)}`;
        this._logger.debug("Generated new user code", { code: code });
        resolve(code);
      } catch (err) {
        this._logger.error("Error generating code", err);
        reject({ boError: ERRORS.INVALID_CODE_ERROR });
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
  private static _toString(
    value: number,
    chars: number = USER_CODE_SIZE / 2
  ): string {
    let strValue: string = "";
    let tmpValue: number;

    for (let itr = 0; itr < chars; ++itr) {
      tmpValue = value % 100;
      value = Math.floor(value / 100);

      /* Check if the code is a digit or character */
      let baseCode = tmpValue < 10 ? 48 : 55;
      strValue = `${String.fromCharCode(baseCode + tmpValue)}${strValue}`;
    }
    return strValue.toLowerCase();
  }

  /**
   * Look for empty value into bitmap
   */
  private static _fetchEmpty(bitmap: any): number {
    const topValue = AccountCode._genValue();
    let value = topValue;
    while (bitmap.has(value)) {
      value = AccountCode._inc(value);

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
  private static _inc(
    value: number,
    lenght: number = USER_CODE_SIZE / 2
  ): number {
    let tmpValue: number;
    let resultNumber: number = 0;
    let multiplier = 1;

    let inc: number = 1;
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
      map = RoaringBitmap32.deserialize(data);
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
