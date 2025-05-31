import { AxiosInstance } from "axios";
import { ApiResponse, ContentType, ResourceType } from "../dmart.model";

export const upload_with_payload = async (
  client: AxiosInstance,
  space_name: string,
  subpath: string,
  shortname: string,
  resource_type: ResourceType,
  payload_file: File,
  content_type?: ContentType,
  schema_shortname?: string,
  scope: string = "managed"
): Promise<ApiResponse> => {
  const request_record_body: any = {
    resource_type,
    subpath,
    shortname,
    attributes: { is_active: true, payload: { body: {} } },
  };
  if (content_type) {
    request_record_body.attributes.payload.content_type = content_type;
  }
  if (schema_shortname) {
    request_record_body.attributes.payload.schema_shortname = schema_shortname;
  }

  const request_record = new Blob([JSON.stringify(request_record_body)], {
    type: "application/json",
  });

  const form_data = new FormData();
  form_data.append("space_name", space_name);
  form_data.append("request_record", request_record);
  form_data.append("payload_file", payload_file);

  const headers = { "Content-Type": "multipart/form-data" };

  const { data } = await client.post<ApiResponse>(
    `${scope}/resource_with_payload`,
    form_data,
    { headers }
  );

  return data;
};
