import { prop } from "@typegoose/typegoose";

export class ProjectLink {
  @prop()
  app?: string;

  @prop()
  web?: string;

  @prop()
  facebook?: string;

  @prop()
  twitter?: string;

  @prop()
  youtube?: string;

  @prop()
  instagram?: string;

  @prop()
  privacy?: string;

  @prop()
  terms?: string;
}
