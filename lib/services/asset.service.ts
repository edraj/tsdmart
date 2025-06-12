import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { IAssetRequest } from '../models/asset.model';

// TODO: what is this?

export const data_asset = async (
  client: AxiosInstance,
  asset_requet: IAssetRequest

): Promise<string> =>  {

  const { data } = await client.post(
    Config.API.asset.request,
    {
      ...asset_requet,
      query_string: asset_requet.query_string || 'SELECT * FROM file',
    }
  );
  return data;
};
