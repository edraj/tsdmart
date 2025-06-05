import { AxiosInstance } from "axios";
import {
  ApiResponse,
  headers,
  LoginResponse,
  ProfileResponse,
  Status,
} from "../../dmart.model";
import { Config } from '../config';

export const login = async (
  shortname: string,
  password: string,
  client: AxiosInstance
) => {
  // use which client? defaultAxios if what?
  const response = await client.post<LoginResponse>(
    `user/login`,
    { shortname, password },
    { headers: Config.headers }
  );
  const data: LoginResponse = response.data;
  if (data.status == Status.success && data.records.length > 0) {
    headers["Authorization"] =
      "Bearer " + data.records[0]?.attributes.access_token;
  }
  return data;
};

export const get_profile = async (client: AxiosInstance) => {
  const { data } = await client.get<ProfileResponse>(`user/profile`, {
    headers: Config.headers,
  });
  
  return data;
};

export const logout = async (client: AxiosInstance) => {
  const { data } = await client.post<ApiResponse>(
    `user/logout`,
    {},
    { headers: Config.headers }
  );
  return data;
};
