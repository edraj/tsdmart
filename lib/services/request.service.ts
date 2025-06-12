import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { IRecordWithAttachment } from '../models/record.model';
import { IRequest, ISubmitRequest } from '../models/request.model';

export const dmartRequest = async (
  client: AxiosInstance,
  action: IRequest
): Promise<IRecordWithAttachment> => {
  const res = await client.post<IRecordWithAttachment>(
    Config.API.resource.request.replace(':scope', 'managed'),
    action);

  return res?.data;
};

export const dmartSubmit = async (
  client: AxiosInstance,
  submit_action: ISubmitRequest

) => {

  // replace :path with one of these:
  // resourcetype/wf
  // resourcetype
  // neither
  // so weird

  const { resource_type, workflow_shortname } = submit_action;

  let path = '';
  if (resource_type) {
    path += `${resource_type}/`;
  }
  if (workflow_shortname) {
    path += `${workflow_shortname}/`;
  }

  const url = Config.API.resource.submit
    .replace(':space', submit_action.space_name)
    .replace(':path', path)
    .replace(':schema', submit_action.schema_shortname)
    .replace(':subpath', submit_action.subpath);

  const { data } = await client.post(
    url,
    submit_action.record,
  );
  return data;
};

// special request for space, havent used yet
export const space = async (client: AxiosInstance, action: IRequest): Promise<IRecordWithAttachment> => {
  const { data } = await client.post<IRecordWithAttachment>(
    `managed/space`,
    action
  );
  return data;
};
