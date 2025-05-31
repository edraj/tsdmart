import { AxiosInstance } from "axios";
import { Config } from '../config';
import { ActionRequest, ActionResponse } from "../dmart.model";

export const request = async (
  client: AxiosInstance,
  action: ActionRequest
): Promise<ActionResponse> => {
  const res = await client.post<ActionResponse>(`managed/request`, action, {
    headers: Config.headers,
  });
  return res?.data;
};

// this is useless
export const submit = async (
  client: AxiosInstance,
  spaceName: string,
  schemaShortname: string,
  subpath: string,
  record: any
) => {
  const { data } = await client.post(
    `public/submit/${spaceName}/${schemaShortname}/${subpath}`,
    record,
    { headers: Config.headers }
  );
  return data;
};
