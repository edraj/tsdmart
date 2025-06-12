import { EnumResourceType } from './query.model';
import { IPayload } from './record.model';
import { ITranslation } from './translation.model';

export interface IEntryQuery {

  resource_type?: EnumResourceType;
  space_name: string;
  subpath: string;
  shortname: string;

  retrieve_json_payload?: boolean;
  retrieve_attachments?: boolean;
  validate_schema?: boolean;

};


// everything else. these two are just flattend out responses
// this is a flattened out response, with attribute and attachment and extra stuff
export interface IEntryResponse {
  uuid?: string;
  shortname?: string;
  subpath?: string;
  // from attrbute
  is_active?: boolean;
  displayname?: ITranslation;
  description?: ITranslation;
  tags?: Set<string>;
  created_at?: string;
  updated_at?: string;
  owner_shortname?: string;
  payload?: IPayload;

  //attachments
  attachments?: Object;

  // other things
  relationships?: any;
  workflow_shortname?: string;
  state?: string;

  // usr specific
  email?: string;
  msisdn?: string;
  is_email_verified?: boolean;
  is_msisdn_verified?: boolean;
  force_password_change?: boolean;
  password?: string;
  is_open?: boolean;
};
