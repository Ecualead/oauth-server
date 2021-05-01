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
import { DataScoped } from "@/controllers/data.scoped.controller";
import { DomainModel, DomainDocument } from "@/models/domain/domain.model";

class Domains extends DataScoped<DomainDocument> {
  private static _instance: Domains;

  private constructor() {
    super("Domains", DomainModel, "domain");
  }

  public static get shared(): Domains {
    if (!Domains._instance) {
      Domains._instance = new Domains();
    }
    return Domains._instance;
  }
}

export const DomainCtrl = Domains.shared;
