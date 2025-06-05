import { AxiosInstance } from 'axios';
import { ApiResponse } from '../../dmart.model';
import { Config } from '../config';

export const create_user = async (client: AxiosInstance) => {
  const { data } = await client.post<ApiResponse>(
    `user/logout`,
    {},
    { headers: Config.headers }
  );
  return data;
};