import { AxiosInstance } from "axios";
import {
  ApiQueryResponse,
  QueryRequest,
  QueryType,
  ResourceType,
  ResponseEntry,
  SortyType,
} from "../../dmart.model";
import { Config } from '../config';
import { GetParamsAsString, IEntryQuery, typeScope } from "../models/ishee.model";

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
      headers: Config.client.headers,
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
  scope: typeScope = "managed"
): Promise<ResponseEntry | null> => {

  if (!subpath || subpath == "/") subpath = "__root__";

  const url = `${scope}/
        entry/
        ${resource_type}/
        ${space_name}/
        ${subpath}/
        ${shortname}?
        retrieve_json_payload=${retrieve_json_payload}&
        retrieve_attachments=${retrieve_attachments}&
        validate_schema=${validate_schema}`;
  const { data } = await client.get<ResponseEntry>(
    `${url.replace(/\/+/g, "/")}`,
    // { headers: Config.headers }
  );
  return data;
};



export const getEntry = async (client: AxiosInstance, query: IEntryQuery, scope: typeScope): Promise<ResponseEntry | null> => {
  const params = GetParamsAsString({
    retrieve_json_payload: query.retrieve_json_payload || false,
    retrieve_attachments: query.retrieve_attachments || false,
    validate_schema: query.validate_schema || true,
  });

  const _url = MapResourceUrl(Config.API.resource.details, query, scope).replace(':options', params).replace(/\/+/g, "/");

  // /managed/entry/:resource/:space/:subpath/:shortname
  const { data } = await client.get<ResponseEntry>(_url);
  return data;
};

export const MapResourceUrl = (url: string, query: IEntryQuery, scope: typeScope): string => {

  // /:scope/entry/:resource/:space/:subpath?:options
  return url
    .replace(':scope', scope)
    .replace(':resource', query.resource_type || ResourceType.content)
    .replace(':space', query.space_name)
    .replace(':subpath', query.subpath)
    .replace(':shortname', query.shortname);
};
