import { AxiosInstance } from "axios";
import { ActionRequest, ActionResponse } from "../../dmart.model";
import { Config } from '../config';

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
export const submit_old = async (
  client: AxiosInstance,
  spaceName: string,
  schemaShortname: string,
  subpath: string,
  record: any
) => {
  const { data } = await client.post(
    `public/submit/${spaceName}/${schemaShortname}/${subpath}`,
    record,
    { headers: Config.client.headers }
  );
  return data;
};


export const submit = async (
  spaceName: string,
  schemaShortname: string,
  subpath: string,
  record: any,
  resourceType?: string,
  workflowShortname?: string,
) => {
  try {
    var url = `public/submit/${spaceName}`;
    if (resourceType) {
      url += `/${resourceType}`;
    }
    if (workflowShortname) {
      url += `/${workflowShortname}`;
    }
    url += `/${schemaShortname}/${subpath}`;
    const { data } = await axios.post(
      url,
      record,
      { headers }
    );
    return data;
  } catch (error: any) {
    throw error;
  }
};