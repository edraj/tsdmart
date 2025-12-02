import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { IEntryQuery, IEntryResponse } from '../models/entry.model';
import { EnumResourceType, typeScope } from '../models/query.model';
import { GetParamsAsString } from './common';

const MapResourceUrl = (url: string, query: IEntryQuery, scope: typeScope): string => {

  // /:scope/entry/:resource/:space/:subpath?:options
  return url
    .replace(':scope', scope)
    .replace(':resource', query.resource_type || EnumResourceType.content)
    .replace(':space', query.space_name)
    .replace(':subpath', query.subpath)
    .replace(':shortname', query.shortname);
};


// this is a wrapper for query with GET
export const retrieve_entry = async (
  client: AxiosInstance,
  query: IEntryQuery,
  scope: typeScope): Promise<IEntryResponse | null> => {

  const params = GetParamsAsString({
    retrieve_json_payload: query.retrieve_json_payload || false,
    retrieve_attachments: query.retrieve_attachments || false,
    validate_schema: query.validate_schema || true,
  });

  const _url = MapResourceUrl(Config.API.entry.details, query, scope).replace(':options', params).replace(/\/+/g, '/');

  // /managed/entry/:resource/:space/:subpath/:shortname
  const { data } = await client.get<IEntryResponse>(_url);
  return data;
};



export const check_existing = async (client: AxiosInstance, prop: string, value: string) => {
  const { data } = await client.get<IEntryResponse>(
    Config.API.entry.existing.replace(':options', `${prop}=${value}`)
  );
  return data;
};
