import axios, { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { Config } from './config';
import { IAssetRequest } from './models/asset.model';
import { IEntryQuery, IEntryResponse } from './models/entry.model';
import { IClientError } from './models/error.model';
import { IFileRequest } from './models/file.model';
import { EnumStatus, IQueryRequest, typeScope } from './models/query.model';
import { IRecordWithAttachment, IResponseList } from './models/record.model';
import { IRequest, ISubmitRequest } from './models/request.model';
import { ITicketRequest } from './models/ticket.model';
import { data_asset } from './services/asset.service';
import { get_profile, login_by, logout } from './services/auth.service';
import { check_existing, retrieve_entry } from './services/entry.service';
import { get_file, get_file_url, upload_multiple, upload_with_payload } from './services/file.service';
import { get_manifest, get_settings, get_space_health } from './services/info.service';
import { exportCSV, query } from './services/query.service';
import { dmartRequest, dmartSubmit, space } from './services/request.service';
import { DmartClientStorage } from './services/storage.service';
import { progress_ticket } from './services/ticket.service';


export class DmartClient {
  client: AxiosInstance;

  get token() {
    return DmartClientStorage.getItem(Config.Storage.authKey) || null;
  }
  set token(value: string | null) {
    if (value) {
      DmartClientStorage.setItem(Config.Storage.authKey, value);
    } else {
      DmartClientStorage.removeItem(Config.Storage.authKey);
    }
  }

  constructor(config: CreateAxiosDefaults) {
    this.client = axios.create({ ...Config.client, ...config });

    this.client.interceptors.request.use(
      (config) => {
        // if url is login, do not include authorization no matter what
        if (!config.url?.includes(Config.API.auth.login)) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        } else {
          config.headers['Authorization'] = '';
        }
        config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    this.client.interceptors.response.use(null, function (error) {
      // need error.code (enum), error.status (same), error.message (axios)
      // error.response.data (dmart), error.response.config. method, url,
      const err: IClientError = {
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
    const res = await login_by(this.client, { shortname }, password);
    // save in storage
    if (res.status == EnumStatus.success && res.records?.length > 0) {
      this.token = res.records[0]?.attributes?.access_token || null;
    }
    return res;
  }

  async login_by(credentials: any, password: string) {
    const res = await login_by(this.client, credentials, password);
    if (res.status == EnumStatus.success && res.records?.length > 0) {
      this.token = res.records[0]?.attributes?.access_token || null;
    }
    return res;
  }

  async get_profile() {
    return get_profile(this.client);
  }

  async logout() {
    const res = await logout(this.client);
    this.token = null;
    return res;
  }


  async query(q: IQueryRequest, scope: typeScope = 'managed'): Promise<IResponseList<IRecordWithAttachment> | null> {
    return query(this.client, q, scope);
  }

  async retrieve_entry(query: IEntryQuery, scope: typeScope = 'managed'): Promise<IEntryResponse | null> {
    return retrieve_entry(this.client, query, scope);
  }

  // FIXME: test this, api docs do not have teh same signature
  async check_existing(prop: string, value: string) {
    return check_existing(this.client, prop, value);
  }

  async upload_with_payload(
    file_request: IFileRequest,
    file: File,
    scope: typeScope = 'managed'
  ) {
    return upload_with_payload(
      this.client,
      file_request,
      file,
      scope
    );
  }
  async upload_multiple(
    file_request: IFileRequest,
    files: FileList,
    scope: typeScope = 'managed'
  ) {
    return upload_multiple(
      this.client,
      file_request,
      files,
      scope
    );
  }

  // get_attachment_url
  get_file_url(file_request: IFileRequest, scope: typeScope = 'managed') {
    return get_file_url(file_request, scope);
  }

  async get_file(file_request: IFileRequest, scope: typeScope = 'managed') {
    return get_file(this.client, file_request, scope);
  }

  async request(action: IRequest) {
    return dmartRequest(this.client, action);
  }

  async submit(submit_action: ISubmitRequest) {
    return dmartSubmit(this.client, submit_action);
  }

  async get_space_health(space_name: string) {
    return get_space_health(this.client, space_name);
  }

  async get_manifest() {
    return get_manifest(this.client);
  }

  async get_settings() {
    return get_settings(this.client);
  }

  async progress_ticket(ticketReuest: ITicketRequest) {
    return progress_ticket(this.client, ticketReuest);
  }




  async exportCsv(query: IQueryRequest) {
    return exportCSV(this.client, query);
  }

  async space(action: IRequest) {
    return space(this.client, action);
  }


  // what does this do?
  async data_asset(asset_requet: IAssetRequest) {
    return data_asset(this.client, asset_requet);
  }
}
