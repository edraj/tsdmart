import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { IRecordLogin, IRecordProfile } from '../models/auth.model';
import { IResponse } from '../models/record.model';

export const login_by = async (client: AxiosInstance, credentials: any, password: string): Promise<IResponse<IRecordLogin>> => {
  const { data } = await client.post<IResponse<IRecordLogin>>(
    Config.API.auth.login,
    { ...credentials, password }
  );
  return data;
};


export const get_profile = async (client: AxiosInstance): Promise<IResponse<IRecordProfile>> => {
  const { data } = await client.get<IResponse<IRecordProfile>>(Config.API.auth.profile);

  return data;
};

export const logout = async (client: AxiosInstance) => {
  const { data } = await client.post<IResponse<any>>(
    Config.API.auth.logout,
    {}
  );
  return data;
};


