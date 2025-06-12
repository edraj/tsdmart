import { ITranslation } from './translation.model';

export type TUserType = 'web' | 'mobile' | 'bot';


export enum EnumAction {
  query = 'query',
  view = 'view',
  update = 'update',
  create = 'create',
  delete = 'delete',
  attach = 'attach',
  move = 'move',
  progress_ticket = 'progress_ticket',
}


export enum EnumLanguage {
  arabic = 'arabic',
  english = 'engligh',
  kurdish = 'kurdish',
  french = 'french',
  turkish = 'turkish',
}


export interface IPermission {
  allowed_actions: Array<EnumAction>;
  conditions: Array<string>;
  restricted_fields: Array<any>;
  allowed_fields_values: Map<string, any>;
};


export interface IRecordLogin {
  access_token: string;
  type: TUserType;
  displayname: ITranslation;
};



export interface IRecordProfile {
  email: string;
  displayname: ITranslation;
  type: string;
  language: EnumLanguage;
  is_email_verified: boolean;
  is_msisdn_verified: boolean;
  force_password_change: boolean;
  permissions: Record<string, IPermission>;
  // where is the msisnd?
  msisdn?: string;
};
