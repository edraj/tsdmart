import axios, { AxiosInstance, CreateAxiosDefaults } from "axios";
import {
  ActionRequest,
  ClientError,
  ContentType,
  QueryRequest,
  ResourceType,
  ResponseEntry,
} from "../dmart.model";
import { Config } from "./config";
import { IEntryQuery, typeScope } from "./models/ishee.model";
import { get_profile, login, logout } from "./services/auth";
import { getEntry, query, retrieve_entry } from "./services/query";
import { request, submit } from "./services/request";
import { upload_with_payload } from "./services/upload";

export class DmartClient {
  client: AxiosInstance;

  constructor(config: CreateAxiosDefaults) {
    this.client = axios.create({ ...Config.client, ...config });

    this.client.interceptors.response.use(null, function (error) {
      // need error.code (enum), error.status (same), error.message (axios)
      // error.response.data (dmart), error.response.config. method, url,
      const err: ClientError = {
        code: error.code,
        status: error.status,
        message: error.message,
        request: {
          url: error.response?.config?.url,
          method: error.response?.config?.method,
        },
        response: error.response?.data,
      };
      return Promise.reject(err);
    });
  }

  async login(shortname: string, password: string) {
    return login(shortname, password, this.client);
  }

  async get_profile() {
    return get_profile(this.client);
  }

  async logout() {
    return logout(this.client);
  }

  async query(q: QueryRequest, scope: string = "managed") {
    return query(this.client, q, scope);
  }

  async getEntry(query: IEntryQuery, scope: typeScope = "managed"): Promise<ResponseEntry | null> {
    return getEntry(this.client, query, scope); 
  }
  async retrieve_entry(
    resource_type: ResourceType,
    space_name: string,
    subpath: string,
    shortname: string,
    retrieve_json_payload: boolean = false,
    retrieve_attachments: boolean = false,
    validate_schema: boolean = true,
    scope: typeScope = "managed"
  ) {
    return retrieve_entry(
      this.client,
      resource_type,
      space_name,
      subpath,
      shortname,
      retrieve_json_payload,
      retrieve_attachments,
      validate_schema,
      scope
    );
  }

  async upload_with_payload(
    space_name: string,
    subpath: string,
    shortname: string,
    resource_type: ResourceType,
    payload_file: File,
    content_type?: ContentType,
    schema_shortname?: string,
    scope: string = "managed"
  ) {
    return upload_with_payload(
      this.client,
      space_name,
      subpath,
      shortname,
      resource_type,
      payload_file,
      content_type,
      schema_shortname,
      scope
    );
  }

  async request(action: ActionRequest) {
    return request(this.client, action);
  }

  async submit(
    spaceName: string,
    schemaShortname: string,
    subpath: string,
    record: any
  ) {
    return submit(this.client, spaceName, schemaShortname, subpath, record);
  }
}
