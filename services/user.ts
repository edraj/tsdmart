import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { ApiResponse } from '../dmart.model';

export const create_user = async (client: AxiosInstance) => {
  const { data } = await client.post<ApiResponse>(
    `user/logout`,
    {},
    { headers: Config.headers }
  );
  return data;
};