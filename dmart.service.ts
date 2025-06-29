import {AxiosInstance} from "axios";
import {
    ActionRequest,
    ActionResponse,
    ApiQueryResponse,
    ApiResponse,
    ContentType,
    headers,
    LoginResponse,
    ProfileResponse,
    QueryRequest,
    QueryType,
    ResourceType,
    ResponseEntry,
    SortyType,
    Status,
} from "./dmart.model";


export class Dmart {
    static axiosDmartInstance: AxiosInstance;

    static setAxiosInstance(axiosInstance: AxiosInstance) {
        Dmart.axiosDmartInstance = axiosInstance;
    }

    public static getAxiosInstance(): AxiosInstance {
        if (!Dmart.axiosDmartInstance) {
            throw new Error("Axios instance is not set. Please set it using setAxiosInstance method.");
        }
        return Dmart.axiosDmartInstance;
    }

    public static getHeaders() {
        return headers;
    }

    public static setHeaders(newHeaders: any) {
        Object.assign(headers, newHeaders);
    }

    public static getBaseURL() {
        return Dmart.axiosDmartInstance.defaults.baseURL;
    }

    public static set setBaseURL(url: string) {
        Dmart.axiosDmartInstance.defaults.baseURL = url;
    }

    public static getToken() {
        return headers["Authorization"] ? headers["Authorization"].replace("Bearer ", "") : null;
    }

    public static setToken(token: string) {
        headers["Authorization"] = `Bearer ${token}`;
    }

  public static async login(shortname: string, password: string) {
    const response = await Dmart.axiosDmartInstance.post<LoginResponse>(
      `user/login`,
      { shortname, password },
      { headers }
    );
    const data: LoginResponse = response.data;
    if (data.status == Status.success && data.records.length > 0) {
      headers["Authorization"] =
        "Bearer " + data.records[0]?.attributes.access_token;
    }
    return data;
  }

  public static async loginBy(credentials: any, password: string) {
    try {
      const response = await Dmart.axiosDmartInstance.post<LoginResponse>(
        `user/login`,
        { ...credentials, password },
        { headers }
      );
      const data: LoginResponse = response.data;
      if (data.status == Status.success && data.records.length > 0) {
        headers["Authorization"] =
          "Bearer " + data.records[0]?.attributes.access_token;
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async logout() {
    try {
      const { data } = await Dmart.axiosDmartInstance.post<ApiResponse>(
        `user/logout`,
        {},
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async create_user(request: any) {
    try {
      const { data } = await Dmart.axiosDmartInstance.post<ActionResponse>(
        `user/create`,
        request,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async update_user(request: any) {
    try {
      const { data } = await Dmart.axiosDmartInstance.post<ActionResponse>(
        `user/profile`,
        request,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async check_existing(prop: string, value: string) {
    try {
      const { data } = await Dmart.axiosDmartInstance.get<ResponseEntry>(
        `user/check-existing?${prop}=${value}`,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async get_profile() {
    try {
      const { data } = await Dmart.axiosDmartInstance.get<ProfileResponse>(`user/profile`, {
        headers,
      });
      if (typeof localStorage !== "undefined" && data.status === "success") {
        localStorage.setItem(
          "permissions",
          JSON.stringify((data?.records ?? [{}])[0]?.attributes.permissions)
        );
        localStorage.setItem(
          "roles",
          JSON.stringify((data?.records ?? [{}])[0]?.attributes?.["roles"])
        );
      }
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async query(
    query: QueryRequest,
    scope: string = "managed"
  ): Promise<ApiQueryResponse | null> {
    try {
      if (query.type != QueryType.spaces) {
        query.sort_type = query.sort_type || SortyType.ascending;
        query.sort_by = query.sort_by || "created_at";
      }
      query.subpath = query.subpath.replace(/\/+/g, "/");
      const { data } = await Dmart.axiosDmartInstance.post<ApiQueryResponse>(
        `${scope}/query`,
        query,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async csv(query: any): Promise<ApiQueryResponse> {
    try {
      query.sort_type = query.sort_type || SortyType.ascending;
      query.sort_by = "created_at";
      query.subpath = query.subpath.replace(/\/+/g, "/");
      const { data } = await Dmart.axiosDmartInstance.post<ApiQueryResponse>(
        `managed/csv`,
        query,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async resources_from_csv(
      space_name: string,
      subpath: string,
      resourceType: ResourceType,
      schema: string,
      payload: File,
  ){
    try {
      let csvUrl = `/managed/resources_from_csv/${resourceType}/${space_name}/${subpath}`;

      if(schema){
        csvUrl += `/${schema}`;
      }

      let formdata = new FormData();
      formdata.append("resources_file", payload);

      const headers = {"Content-Type": "multipart/form-data"};

      const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
          csvUrl,
          formdata,
          {headers}
      );

      return data;
    }  catch (error) {
      return error;
    }
  }


  public static async space(action: ActionRequest): Promise<ActionResponse> {
    try {
      const { data } = await Dmart.axiosDmartInstance.post<ActionResponse>(
        `managed/space`,
        action,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async request(action: ActionRequest): Promise<ActionResponse> {
    const res = await Dmart.axiosDmartInstance.post<ActionResponse>(`managed/request`, action, {
      headers,
    });
    return res?.data;
  }

  public static async retrieve_entry(
    resource_type: ResourceType,
    space_name: string,
    subpath: string,
    shortname: string,
    retrieve_json_payload: boolean = false,
    retrieve_attachments: boolean = false,
    validate_schema: boolean = true,
    scope: string = "managed"
  ): Promise<ResponseEntry | null> {
    try {
      if (!subpath || subpath == "/") subpath = "__root__";
      const url = `${scope}/entry/${resource_type}/${space_name}/${subpath}/${shortname}?retrieve_json_payload=${retrieve_json_payload}&retrieve_attachments=${retrieve_attachments}&validate_schema=${validate_schema}`;
      const { data } = await Dmart.axiosDmartInstance.get<ResponseEntry>(
        `${url.replace(/\/+/g, "/")}`,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }



  public static async upload_with_payload(
    space_name: string,
    subpath: string,
    shortname: string,
    resource_type: ResourceType,
    payload_file: File,
    content_type?: ContentType,
    schema_shortname?: string,
    scope: string = "managed"
  ): Promise<ApiResponse> {
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
      request_record_body.attributes.payload.schema_shortname =
        schema_shortname;
    }

    const request_record = new Blob([JSON.stringify(request_record_body)], {
      type: "application/json",
    });

    const form_data = new FormData();
    form_data.append("space_name", space_name);
    form_data.append("request_record", request_record);
    form_data.append("payload_file", payload_file);

    const headers = { "Content-Type": "multipart/form-data" };

    try {
      const { data } = await Dmart.axiosDmartInstance.post<ApiResponse>(
        `${scope}/resource_with_payload`,
        form_data,
        { headers }
      );

      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async fetchDataAsset(
    resourceType: string,
    dataAssetType: string,
    spaceName: string,
    subpath: string,
    shortname: string,
    query_string?: string,
    filter_data_assets?: string[]
  ) {
    try {
      const { data } = await Dmart.axiosDmartInstance.post(
        'managed/data-asset',
        {
          space_name: spaceName,
          resource_type: resourceType,
          data_asset_type: dataAssetType,
          subpath,
          shortname,
          query_string: query_string ?? "SELECT * FROM file",
          filter_data_assets,
        },
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async get_spaces(): Promise<ApiResponse | null> {
    return await this.query({
      type: QueryType.spaces,
      space_name: "management",
      subpath: "/",
      search: "",
      limit: 100,
    });
  }

  public static async get_children(
    space_name: string,
    subpath: string,
    limit: number = 20,
    offset: number = 0,
    restrict_types: Array<ResourceType> = []
  ): Promise<ApiResponse | null> {
    return await this.query({
      type: QueryType.search,
      space_name: space_name,
      subpath: subpath,
      filter_types: restrict_types,
      exact_subpath: true,
      search: "",
      limit: limit,
      offset: offset,
    });
  }

  public static get_attachment_url(
    resource_type: ResourceType,
    space_name: string,
    subpath: string,
    parent_shortname: string,
    shortname: string,
    ext: string | null = null,
    scope: string = "managed"
  ) {
    return `${Dmart.axiosDmartInstance.defaults.baseURL}/${scope}/payload/${resource_type}/${space_name}/${subpath.replace(
      /\/+$/,
      ""
    )}/${parent_shortname}/${shortname}${ext === null ? "" : `.${ext}`}`;
  }

  public static async get_space_health(space_name: string) {
    try {
      const { data } = await Dmart.axiosDmartInstance.get<
        ApiQueryResponse & { attributes: { folders_report: Object } }
      >(`managed/health/${space_name}`, { headers });
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  // TODO: update to enums
  public static async get_payload(
    resource_type: string,
    space_name: string,
    subpath: string,
    shortname: string,
    schemaShortname: string|null = null,
    ext: string = "json",
    scope: string = "managed"
  ) {
    try {
      let url = `${scope}/payload/${resource_type}/${space_name}/${subpath}/${shortname}`;

      if(schemaShortname){
        url += `.${schemaShortname}`
      }
      url += `.${ext}`
      const { data } = await Dmart.axiosDmartInstance.get<any>(
          url,
          { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async progress_ticket(
    space_name: string,
    subpath: string,
    shortname: string,
    action: string,
    resolution?: string,
    comment?: string
  ) {
    try {
      const payload: any = {};
      if (resolution) {
        payload.resolution = resolution;
      }
      if (comment) {
        payload.comment = comment;
      }
      const { data } = await Dmart.axiosDmartInstance.put<
        ApiQueryResponse & { attributes: { folders_report: Object } }
      >(
        `managed/progress-ticket/${space_name}/${subpath}/${shortname}/${action}`,
        payload,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async submit(
    spaceName: string,
    schemaShortname: string,
    subpath: string,
    record: any,
    resourceType?: string,
    workflowShortname?: string,
  ) {
    try {
      var url = `public/submit/${spaceName}`;
        if (resourceType) {
            url += `/${resourceType}`;
        }
        if (workflowShortname) {
            url += `/${workflowShortname}`;
        }
        url += `/${schemaShortname}/${subpath}`;
      const { data } = await Dmart.axiosDmartInstance.post(
          url,
        record,
        { headers }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async get_manifest() {
    try {
      const { data } = await Dmart.axiosDmartInstance.get<any>(`info/manifest`, {
        headers,
      });
      return data;
    } catch (error: any) {
      throw error;
    }
  }

  public static async get_settings() {
    try {
      const { data } = await Dmart.axiosDmartInstance.get<any>(`info/settings`, {
        headers,
      });
      return data;
    } catch (error: any) {
      throw error;
    }
  }
}
