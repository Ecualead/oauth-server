/**
 * @Author: Reinier Millo Sánchez <millo>
 * @Date:   2020-03-30T02:26:05-05:00
 * @Email:  reinier.millo88@gmail.com
 * @Project: IKOABO Auth Microservice API
 * @Filename: profile.ts
 * @Last modified by:   millo
 * @Last modified time: 2020-04-01T07:12:33-05:00
 * @Copyright: Copyright 2020 IKOA Business Opportunity
 */

export enum PROFILE_FIELD_TYPES {
  PF_UNKNOWN = 0,
  PF_STRING = 1,
  PF_NUMBER = 2,
  PF_BOOLEAN = 3,
  PF_OBJECT = 4,
  PF_ARRAY_STRING = 5,
  PF_ARRAY_NUMBER = 6,
  PF_ARRAY_BOOLEAN = 7,
  PF_ARRAY_OBJECT = 8,
}
