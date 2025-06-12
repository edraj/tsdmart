import { EnumResourceType } from './query.model';



// this is a flattened out request for submit function
export interface IAssetRequest {
  space_name: string,
  subpath: string,
  resource_type?: EnumResourceType,
  shortname: string;

  filter_data_assets: string[];
  data_asset_type: EnumResourceType;
  query_string: string;
}
