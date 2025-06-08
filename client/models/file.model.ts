import { EnumResourceType } from './query.model';

export interface IFileRequest {
  space_name: string,
  subpath: string,
  shortname: string,
  resource_type: EnumResourceType,
  schema_shortname?: string,
  ext?: string
}
