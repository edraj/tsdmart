import { AxiosInstance } from "axios";
import { Config } from '../config';
import {
  ApiQueryResponse,
  QueryRequest,
  QueryType,
  ResourceType,
  ResponseEntry,
  SortyType,
} from "../dmart.model";

export const query = async (
  client: AxiosInstance,
  query: QueryRequest,
  scope: string = "managed"
): Promise<ApiQueryResponse | null> => {
  if (query.type !== QueryType.spaces) {
    query.sort_type = query.sort_type || SortyType.ascending;
    query.sort_by = query.sort_by || "created_at";
  }

  // bad!
  query.subpath = query.subpath.replace(/\/+/g, "/");
  const { data } = await client.post<ApiQueryResponse>(
    `${scope}/query`,
    query,
    {
      headers: Config.headers,
      timeout: 3000,
    }
  );
  return data;
};

export const retrieve_entry = async (
  client: AxiosInstance,
  resource_type: ResourceType,
  space_name: string,
  subpath: string,
  shortname: string,
  retrieve_json_payload: boolean = false,
  retrieve_attachments: boolean = false,
  validate_schema: boolean = true,
  scope: string = "managed"
): Promise<ResponseEntry | null> => {
  if (!subpath || subpath == "/") subpath = "__root__";
  const url = `${scope}/entry/${resource_type}/${space_name}/${subpath}/${shortname}?retrieve_json_payload=${retrieve_json_payload}&retrieve_attachments=${retrieve_attachments}&validate_schema=${validate_schema}`;
  const { data } = await client.get<ResponseEntry>(
    `${url.replace(/\/+/g, "/")}`,
    { headers: Config.headers }
  );
  return data;
};
