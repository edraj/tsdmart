import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { IResponseList } from '../models/record.model';

export const get_space_health = async (client: AxiosInstance, space_name: string): Promise<IResponseList<any>> => {
  const { data } = await client.get<IResponseList<any>>(
    Config.API.info.health.replace(':space', space_name)
  );

  return data;
};

export const get_manifest = async (client: AxiosInstance) => {
  const { data } = await client.get<any>(Config.API.info.manifest);
  return data;

}

export const get_settings = async (client: AxiosInstance) => {
  const { data } = await client.get<any>(Config.API.info.settings);
  return data;
}
