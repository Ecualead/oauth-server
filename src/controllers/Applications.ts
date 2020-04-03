/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:42:02-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: Applications.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-03-30T02:46:12-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export class Applications {
  private static _instance: Applications;

  /**
   * Private constructor
   */
  private constructor() {
  }

  /**
   * Get the singleton class instance
   */
  public static get shared(): Applications {
    if (!Applications._instance) {
      Applications._instance = new Applications();
    }
    return Applications._instance;
  }
}
