/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the Authentication Service.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import { DomainModel, DomainDocument } from "@/models/domain/domain.model";
import { CRUD } from "@ecualead/server";

class Domains extends CRUD<DomainDocument> {
  private static _instance: Domains;

  private constructor() {
    super("Domains", DomainModel);
  }

  public static get shared(): Domains {
    if (!Domains._instance) {
      Domains._instance = new Domains();
    }
    return Domains._instance;
  }
}

export const DomainCtrl = Domains.shared;
