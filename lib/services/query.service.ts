import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { EnumQueryType, EnumSort, IQueryRequest } from '../models/query.model';
import { IRecordWithAttachment, IResponseList } from '../models/record.model';

export const query = async (
  client: AxiosInstance,
  query: IQueryRequest,
  scope: string = 'managed'
): Promise<IResponseList<IRecordWithAttachment> | null> => {

  const _query = { ...query, subpath: query.subpath.replace(/\/+/g, '/') };
  if (query.type !== EnumQueryType.spaces) {
    _query.sort_type = query.sort_type || EnumSort.ascending;
    _query.sort_by = query.sort_by || 'created_at';
  }

  const { data } = await client.post<IResponseList<IRecordWithAttachment>>(
    Config.API.resource.query.replace(':scope', scope),
    _query,
    {
      timeout: Config.client.queryTimeout,
    }
  );
  return data;
};



export const exportCSV = async (
  client: AxiosInstance,
  query: IQueryRequest,
): Promise<IResponseList<IRecordWithAttachment> | null> => {

  const _query = { ...query, subpath: query.subpath.replace(/\/+/g, '/') };
  if (query.type !== EnumQueryType.spaces) {
    _query.sort_type = query.sort_type || EnumSort.ascending;
    _query.sort_by = query.sort_by || 'created_at';
  }

  const { data } = await client.post<IResponseList<IRecordWithAttachment>>(
    Config.API.resource.csv,
    _query
  );
  return data;
};
