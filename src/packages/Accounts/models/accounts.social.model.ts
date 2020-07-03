import { prop, index } from "@typegoose/typegoose";
import { ACCOUNT_SOCIAL_NETWORKS } from "@/Accounts/models/accounts.enum";

@index({ type: 1 })
@index({ socialId: 1 })
@index({ accessToken: 1 })
@index({ refreshToken: 1 })
@index({ socialId: 1, accessToken: 1 })
export class AccountSocialCredential {
  @prop({ required: true, default: ACCOUNT_SOCIAL_NETWORKS.SN_UNKNOWN })
  type!: number;

  @prop({ required: true })
  socialId!: string;

  @prop({ required: true })
  accessToken!: string;

  @prop()
  refreshToken?: string;
}

/* 

export const SFacebook = new mongoose.Schema(
  {
    id: String,
    displayName: String,
    provider: String,
    username: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String,
    },
    emails: [
      {
        value: String,
      },
    ],
    photos: [
      {
        value: String,
      },
    ],
    gender: String,
    ageRange: {
      min: Number,
      max: Number,
    },
    profileUrl: String,
    birthday: String,
    _raw: String,
    _json: Object,
  },
  { timestamps: true, id: false }
);

export const SGoogle = new mongoose.Schema(
  {
    id: String,
    displayName: String,
    provider: String,
    username: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String,
    },
    emails: [
      {
        value: String,
      },
    ],
    photos: [
      {
        value: String,
      },
    ],
    gender: String,
    _raw: String,
    _json: Object,
  },
  { timestamps: true, id: false }
);


export const STwitter = new mongoose.Schema(
  {
    id: String,
    displayName: String,
    provider: String,
    username: String,
    name: {
      familyName: String,
      givenName: String,
      middleName: String,
    },
    emails: [
      {
        value: String,
      },
    ],
    photos: [
      {
        value: String,
      },
    ],
    gender: String,
    _raw: String,
    _json: Object,
    _accessLevel: String,
  },
  { timestamps: true, id: false }
); */
