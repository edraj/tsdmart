import { EnumContentType, EnumResourceType, EnumStatus } from './query.model';
import { ITranslation } from './translation.model';

export interface IRecord<T> {
  resource_type: EnumResourceType;
  shortname: string;
  branch_name?: string;
  subpath: string;
  attributes?: T;
  uuid?: string;
};

export interface IAttributes {
    is_active?: boolean;
    displayname?: ITranslation;
    description?: ITranslation;
    tags?: string[];
    created_at?: string;
    updated_at?: string;
    owner_shortname?: string;
    payload?: IPayload;
};


export interface IAttatchments {
  media: IRecord<IAttributes>[];
  json: IRecord<IAttributes>[];
}


export interface IRecordWithAttachment extends IRecord<IAttributes> {
  attachments?: IAttatchments;
}

export interface IPayload {
  content_type?: EnumContentType | null;
  body: any;
  schema_shortname?: string | null;
  checksum?: string;
  last_validated?: string;
  validation_status?: 'valid' | 'invalid';
};


export interface IResponse<T> {
  status: EnumStatus;
  error?: {code?: any, type?: any};
  records: IRecord<T>[];
};

export interface IResponseList<T> extends IResponse<T> {
  attributes: { total: number; returned: number; folders_report?: any };
}


