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
import jwt from "jsonwebtoken";
import { generateKeyPairSync } from "crypto";
import { Logger } from "@ecualead/server";
import { Settings } from "./settings.controller";

export interface IUserData {
  uid: string;
  name?: string;
  lname1?: string;
  lname2?: string;
  email?: string;
  type?: number;
  app: string;
}

export interface IUserDataDecoded extends IUserData {
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
}

export class JWT {
  private static _instance: JWT;
  private _logger: Logger;
  private _privateKey: string;
  private _publicKey: string;

  /**
   * Private constructor to allow singleton instance
   */
  private constructor() {
    this._logger = new Logger("JWT");
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): JWT {
    if (!JWT._instance) {
      JWT._instance = new JWT();
    }
    return JWT._instance;
  }

  /**
   * Load required keys
   */
  public loadKeys() {
    /* Check to load public key */
    if (Settings.shared.value?.signKeys?.publicKey) {
      this._publicKey = fs.readFileSync(Settings.shared.value.signKeys.publicKey, "utf8");
      this._logger.info("Public key loaded", { key: Settings.shared.value.signKeys.publicKey });
    }

    /* Check to load private key */
    if (Settings.shared.value?.signKeys?.privateKey) {
      this._privateKey = fs.readFileSync(Settings.shared.value.signKeys.privateKey, "utf8");
      this._logger.info("Private key loaded", { key: Settings.shared.value.signKeys.privateKey });
    }
  }

  /**
   * Generate initials public/private keys
   */
  public generateKeys() {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "pkcs1",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: ""
      }
    });

    fs.writeFileSync("private.pem", privateKey);
    fs.writeFileSync("public.pem", publicKey);
    this._logger.info("Private/Public keys generated", {
      private: "private.pem",
      public: "public.pem"
    });
  }

  /**
   * Generate JWT token signed with private key
   */
  public encode(subject: string, ttl: number, payload: IUserData): string {
    if (!this._privateKey) {
      throw new Error("Private key not found");
    }

    /* Generate the JWT token with the private key */
    return jwt.sign(
      payload,
      { key: this._privateKey, passphrase: "" },
      {
        issuer: Settings.shared.value.signKeys.issuer,
        subject: subject,
        audience: Settings.shared.value.signKeys.audience,
        expiresIn: ttl,
        algorithm: "RS256"
      }
    );
  }

  /**
   * Decode JWT token using public key
   */
  public decode(token: string): IUserDataDecoded {
    if (!this._publicKey) {
      throw new Error("Public key not found");
    }

    return jwt.verify(token, this._publicKey, {
      algorithms: ["RS256"]
    }) as IUserDataDecoded;
  }
}

export const JWTCtrl = JWT.shared;
