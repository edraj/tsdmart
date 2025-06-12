import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { IFileRequest } from '../models/file.model';
import { EnumContentType, typeScope } from '../models/query.model';
import { IAttributes, IPayload, IRecord, IResponse } from '../models/record.model';

const MapType = (file: File): EnumContentType | null => {
  const type = file.type;

  if (type.startsWith('image/')) return EnumContentType.image;
  if (type === 'application/pdf') return EnumContentType.pdf;
  return null;
};

export const upload_with_payload = async (
  client: AxiosInstance,
  file_request: IFileRequest,
  file: File,
  scope: typeScope
): Promise<IResponse<null>> => {

  const payload: IPayload = {
    body: {},
    content_type: MapType(file),
    schema_shortname: file_request.schema_shortname || null,
  };

  const request_record_body: IRecord<IAttributes> = {
    resource_type: file_request.resource_type,
    shortname: file_request.shortname,
    subpath: file_request.subpath,
    attributes: { is_active: true, payload }
  };

  const request_record = new Blob([JSON.stringify(request_record_body)], {
    type: 'application/json',
  });

  const form_data = new FormData();
  form_data.append('space_name', file_request.space_name);
  form_data.append('request_record', request_record);
  form_data.append('payload_file', file);


  const { data } = await client.post<IResponse<null>>(
    Config.API.payload.file.replace(':scope', scope),
    form_data,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return data;
};


export const upload_multiple = async (
  client: AxiosInstance,
  file_request: IFileRequest,
  files: FileList,
  scope: typeScope
): Promise<void> => {

  const promises = Array.from(files).map(f => upload_with_payload(client, file_request, f, scope));
  await Promise.all(promises);
};

export const get_file_url = (file_request: IFileRequest, scope: typeScope) => {

  const _schema = file_request.schema_shortname ? `${file_request.schema_shortname}.` : '';
  return Config.API.payload.url
    .replace(':scope', scope)
    .replace(':resource', file_request.resource_type)
    .replace(':space', file_request.space_name)
    .replace(':subpath', file_request.subpath)
    .replace(':shortname', file_request.shortname)
    .replace(':schema', _schema)
    .replace(':ext', file_request.ext || '');
}

export const get_file = async (client: AxiosInstance, file_request: IFileRequest, scope: typeScope) => {

  const { data } = await client.get<any>(get_file_url(file_request, scope));
  return data;
}
