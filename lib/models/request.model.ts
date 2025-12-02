import { EnumRequestType, EnumResourceType } from './query.model';
import { IRecordWithAttachment } from './record.model';

export interface IRequest {
  space_name: string;
  request_type: EnumRequestType;
  records: IRecordWithAttachment[];
};


// this is a flattened out request for submit function
export interface ISubmitRequest {
  space_name: string,
  schema_shortname: string,
  subpath: string,
  resource_type?: EnumResourceType,
  workflow_shortname?: string,
  record: any;
}
