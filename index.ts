import axios from "axios";

let baseURL = "http://localhost:8282";

axios.defaults.withCredentials = true;

export enum Status {
    success = "success",
    failed = "failed",
}

type Error = {
    type: string;
    code: number;
    message: string;
    info: any;
};

export type ApiResponseRecord = {
    resource_type: string;
    shortname: string;
    branch_name?: string;
    subpath: string;
    attributes: Record<string, any>;
};

export type ApiResponse = {
    status: Status;
    error?: Error;
    records: Array<ApiResponseRecord>;
};

type Translation = {
    ar: string;
    en: string;
    kd: string;
};

enum UserType {
    web = "web",
    mobile = "mobile",
    bot = "bot",
}

type LoginResponseRecord = ApiResponseRecord & {
    attributes: {
        access_token: string;
        type: UserType;
        displayname: Translation;
    };
};

// type LoginResponse = ApiResponse  & { records : Array<LoginResponseRecord> };

type Permission = {
    allowed_actions: Array<ActionType>;
    conditions: Array<string>;
    restricted_fields: Array<any>;
    allowed_fields_values: Map<string, any>;
};

enum Language {
    arabic = "arabic",
    english = "engligh",
    kurdish = "kurdish",
    french = "french",
    turkish = "turkish",
}

type ProfileResponseRecord = ApiResponseRecord & {
    attributes: {
        email: string;
        displayname: Translation;
        type: string;
        language: Language;
        is_email_verified: boolean;
        is_msisdn_verified: boolean;
        force_password_change: boolean;
        permissions: Record<string, Permission>;
    };
};

export enum ActionType {
    query = "query",
    view = "view",
    update = "update",
    create = "create",
    delete = "delete",
    attach = "attach",
    move = "move",
    progress_ticket = "progress_ticket",
}

export type ProfileResponse = ApiResponse & {
    records: Array<ProfileResponseRecord>;
};

let headers: { [key: string]: string } = {
    "Content-type": "application/json",
    //"Authorization": ""
};

export type AggregationReducer = {
    name: string;
    alias: string;
    args: Array<string>;
};

export type AggregationType = {
    load: Array<string>;
    group_by: Array<string>;
    reducers: Array<AggregationReducer> | Array<string>;
};

export enum QueryType {
    aggregation = "aggregation",
    search = "search",
    subpath = "subpath",
    events = "events",
    history = "history",
    tags = "tags",
    spaces = "spaces",
    counters = "counters",
    reports = "reports",
}

export enum SortyType {
    ascending = "ascending",
    descending = "descending",
}

// enum NotificationPriority {
//   high = "high",
//   medium = "medium",
//   low = "low"
// };

export type QueryRequest = {
    type: QueryType;
    space_name: string;
    subpath: string;
    filter_types?: Array<ResourceType>;
    filter_schema_names?: Array<string>;
    filter_shortnames?: Array<string>;
    search: string;
    from_date?: string;
    to_date?: string;
    sort_by?: string;
    sort_type?: SortyType;
    retrieve_json_payload?: boolean;
    retrieve_attachments?: boolean;
    validate_schema?: boolean;
    jq_filter?: string;
    exact_subpath?: boolean;
    limit?: number;
    offset?: number;
    aggregation_data?: AggregationType;
};

export enum RequestType {
    create = "create",
    update = "update",
    replace = "replace",
    delete = "delete",
    move = "move",
}

export enum ResourceAttachmentType {
    json = "json",
    comment = "comment",
    media = "media",
    relationship = "relationship",
    alteration = "alteration",
    csv = "csv",
    parquet = "parquet",
    jsonl = "jsonl",
    sqlite = "sqlite",
}

export enum ResourceType {
    user = "user",
    group = "group",
    folder = "folder",
    schema = "schema",
    content = "content",
    acl = "acl",
    comment = "comment",
    media = "media",
    locator = "locator",
    relationship = "relationship",
    alteration = "alteration",
    history = "history",
    space = "space",
    branch = "branch",
    permission = "permission",
    role = "role",
    ticket = "ticket",
    json = "json",
    post = "post",
    plugin_wrapper = "plugin_wrapper",
    notification = "notification",
    jsonl = "jsonl",
    csv = "csv",
    sqlite = "sqlite",
    parquet = "parquet",
}

export enum ContentType {
    text = "text",
    html = "html",
    markdown = "markdown",
    json = "json",
    image = "image",
    python = "python",
    pdf = "pdf",
    audio = "audio",
    video = "video",
    jsonl = "jsonl",
    csv = "csv",
    sqlite = "sqlite",
    parquet = "parquet",
}
export enum ContentTypeMedia {
    text = "text",
    html = "html",
    markdown = "markdown",
    image = "image",
    python = "python",
    pdf = "pdf",
    audio = "audio",
    video = "video",
}

type Payload = {
    content_type: ContentType;
    schema_shortname?: string;
    checksum: string;
    body: string | Record<string, any> | any;
    last_validated: string;
    validation_status: "valid" | "invalid";
};

type MetaExtended = {
    email: string;
    msisdn: string;
    is_email_verified: boolean;
    is_msisdn_verified: boolean;
    force_password_change: boolean;
    password: string;
    workflow_shortname: string;
    state: string;
    is_open: boolean;
};

export type ResponseEntry = MetaExtended & {
    uuid: string;
    shortname: string;
    subpath: string;
    is_active: boolean;
    displayname: Translation;
    description: Translation;
    tags: Set<string>;
    created_at: string;
    updated_at: string;
    owner_shortname: string;
    payload?: Payload;
    relationships?: any;
    attachments?: Object;
    workflow_shortname?: string;
    state?: string;
};

export type ResponseRecord = {
    resource_type: ResourceType;
    uuid: string;
    shortname: string;
    subpath: string;
    attributes: {
        is_active: boolean;
        displayname: Translation;
        description: Translation;
        tags: Set<string>;
        created_at: string;
        updated_at: string;
        owner_shortname: string;
        payload?: Payload;
    };
};

export type ActionResponse = ApiResponse & {
    records: Array<
        ResponseRecord & {
        attachments: {
            media: Array<ResponseRecord>;
            json: Array<ResponseRecord>;
        };
    }
    >;
};

type ActionRequestRecord = {
    resource_type: ResourceType;
    uuid?: string;
    shortname: string;
    subpath: string;
    attributes: Record<string, any>;
    attachments?: Record<ResourceType, Array<any>>;
};

export type ActionRequest = {
    space_name: string;
    request_type: RequestType;
    records: Array<ActionRequestRecord>;
};


type ApiQueryResponse = ApiResponse & {
    attributes: { total: number; returned: number };
};

export class Dmart {
    public async login(shortname: string, password: string) {
        const { data } = await axios.post<
            ApiResponse & { records: Array<LoginResponseRecord> }
        >(baseURL + "/user/login", { shortname, password }, { headers });
        //console.log(JSON.stringify(data, null, 2));
        // FIXME settins Authorization is only needed when the code is running on the server
        /*headers.Authorization = "";
        if (data.status == Status.success && data.records.length > 0) {
          headers.Authorization = "Bearer " + data.records[0].attributes.access_token;
        }*/
        return data;
    }

    public async logout() {
        const { data } = await axios.post<ApiResponse>(
            baseURL + "/user/logout",
            {},
            { headers }
        );
        return data;
    }

    public async create_user(request: any) {
        try {
            const { data } = await axios.post<ActionResponse>(
                baseURL + "/user/create",
                request,
                { headers }
            );
            return data;
        } catch (error: any) {
            return error.response.data;
        }
    }

    public async update_user(request: any) {
        try {
            const { data } = await axios.post<ActionResponse>(
                baseURL + "/user/profile",
                request,
                { headers }
            );
            return data;
        } catch (error: any) {
            return error.response.data;
        }
    }

    public async check_existing(prop: string, value: string) {
        try {
            const { data } = await axios.get<ResponseEntry>(
                baseURL +
                `/user/check-existing?${prop}=${value}`,
                { headers }
            );
            return data;
        } catch (error: any) {
            return null;
        }
    }

    public async get_profile() {
        try {
            const { data } = await axios.get<ProfileResponse>(
                baseURL + "/user/profile",
                {
                    headers,
                }
            );
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
            return null;
        }
    }

    public async query(query: QueryRequest): Promise<ApiQueryResponse|null> {
        try {
            if (query.type != QueryType.spaces) {
                query.sort_type = query.sort_type || SortyType.ascending;
                query.sort_by = query.sort_by || "created_at";
            }
            query.subpath = query.subpath.replace(/\/+/g, "/");
            const { data } = await axios.post<ApiQueryResponse>(
                baseURL + "/managed/query",
                query,
                { headers , timeout: 3000 }
            );
            return data;
        } catch (e) {
            return null;
        }
    }

    public async csv(query: any): Promise<ApiQueryResponse> {
        try {
            query.sort_type = query.sort_type || SortyType.ascending;
            query.sort_by = "created_at";
            query.subpath = query.subpath.replace(/\/+/g, "/");
            const { data } = await axios.post<ApiQueryResponse>(
                baseURL + "/managed/csv",
                query,
                { headers }
            );
            return data;
        } catch (error: any) {
            return error.response.data;
        }
    }

    public async space(action: ActionRequest): Promise<ActionResponse> {
        try {
            const { data } = await axios.post<ActionResponse>(
                baseURL + "/managed/space",
                action,
                { headers }
            );
            return data;
        } catch (error: any) {
            return error.response.data;
        }
    }

    public async request(action: ActionRequest): Promise<ActionResponse> {
        try {
            const { data } = await axios.post<ActionResponse>(
                baseURL + "/managed/request",
                action,
                { headers }
            );
            return data;
        } catch (error: any) {
            return error.response.data;
        }
    }

    public async retrieve_entry(
        resource_type: ResourceType,
        space_name: string,
        subpath: string,
        shortname: string,
        retrieve_json_payload: boolean = false,
        retrieve_attachments: boolean = false,
        validate_schema: boolean = true
    ): Promise<ResponseEntry|null> {
        try {
            if (!subpath || subpath == "/") subpath = "__root__";
            const { data } = await axios.get<ResponseEntry>(
                baseURL +
                `/managed/entry/${resource_type}/${space_name}/${subpath}/${shortname}?retrieve_json_payload=${retrieve_json_payload}&retrieve_attachments=${retrieve_attachments}&validate_schema=${validate_schema}`.replace(
                    /\/+/g,
                    "/"
                ),
                { headers }
            );
            return data;
        } catch (error: any) {
            throw new Error(error.response.data.error.message)
        }
    }

    public async upload_with_payload(
        space_name: string,
        subpath: string,
        shortname: string,
        resource_type: ResourceType,
        payload_file: File,
        content_type?: ContentType,
        schema_shortname?: string
    ): Promise<ApiResponse> {
        const request_record_body:any = {
            resource_type,
            subpath,
            shortname,
            attributes: { is_active: true, payload: {body:{}} },
        };
        if (content_type){
            request_record_body.attributes.payload.content_type = content_type;
        }
        if (schema_shortname){
            request_record_body.attributes.payload.schema_shortname = schema_shortname;
        }

        const request_record = new Blob(
            [
                JSON.stringify(request_record_body),
            ],
            { type: "application/json" }
        );

        const form_data = new FormData();
        form_data.append("space_name", space_name);
        form_data.append("request_record", request_record);
        form_data.append("payload_file", payload_file);

        const headers = { "Content-Type": "multipart/form-data" };

        const { data } = await axios.post<ApiResponse>(
            baseURL + "/managed/resource_with_payload",
            form_data,
            { headers }
        );

        return data;
    }


    public async fetchDataAsset(
        resourceType: string,  // Replace with actual type if needed
        dataAssetType: string,  // Replace with actual type if needed
        spaceName: string,
        subpath: string,
        shortname: string,
        query_string?: string,
        filter_data_assets?: string[],
        branch_name?: string
    ) {
        try {
            const endpoint = "/managed/data-asset";
            const url = `${baseURL}${endpoint}`;
            const { data } = await axios.post(
                url,
                {
                    space_name: spaceName,
                    resource_type: resourceType,
                    data_asset_type: dataAssetType,
                    subpath,
                    shortname,
                    query_string: query_string ?? "SELECT * FROM file",
                    filter_data_assets,
                    branch_name,
                },
                { headers }
            );

            return data;
        } catch (error: any) {
            return error;
        }
    }

    public async get_spaces(): Promise<ApiResponse | null> {
        return await this.query({
            type: QueryType.spaces,
            space_name: "management",
            subpath: "/",
            search: "",
            limit: 100,
        });
    }

    public async get_children(
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

    public get_attachment_url(
        resource_type: ResourceType,
        space_name: string,
        subpath: string,
        parent_shortname: string,
        shortname: string,
        ext: string
    ) {
        return (
            baseURL +
            `/managed/payload/${resource_type}/${space_name}/${subpath.replace(
                /\/+$/,
                ""
            )}/${parent_shortname}/${shortname}.${ext}`.replaceAll("..", ".")
        );
    }

    public async get_space_health(space_name: string) {
        const { data } = await axios.get<
            ApiQueryResponse & { attributes: { folders_report: Object } }
        >(baseURL + `/managed/health/${space_name}`, { headers });
        return data;
    }

    public async get_attachment_content(
        resource_type: string,
        space_name: string,
        subpath: string,
        shortname: string,
    ) {
        const { data } = await axios.get<any>(
            baseURL +
            `/managed/payload/${resource_type}/${space_name}/${subpath}/${shortname}`,
            { headers }
        );
        return data;
    }
    public async get_payload(
        resource_type: string,
        space_name: string,
        subpath: string,
        shortname: string,
        ext: string = ".json"
    ) {
        const { data } = await axios.get<any>(
            baseURL +
            `/managed/payload/${resource_type}/${space_name}/${subpath}/${shortname}${ext}`,
            { headers }
        );
        return data;
    }
    public async get_payload_content(
        resource_type: string,
        space_name: string,
        subpath: string,
        shortname: string,
        ext: string = ".json"
    ) {
        const { data } = await axios.get<any>(
            baseURL +
            `/managed/payload/${resource_type}/${space_name}/${subpath}/${shortname}${ext}`,
            { headers }
        );
        return data;
    }

    public async progress_ticket(
        space_name: string,
        subpath: string,
        shortname: string,
        action: string,
        resolution?: string,
        comment?: string
    ) {
        try {
            const payload: any = {}
            if(resolution){
                payload.resolution = resolution;
            }
            if(comment){
                payload.comment = comment;
            }
            const { data } = await axios.put<
                ApiQueryResponse & { attributes: { folders_report: Object } }
            >(
                baseURL +
                `/managed/progress-ticket/${space_name}/${subpath}/${shortname}/${action}`,
                payload,
                { headers }
            );
            return data;
        } catch (error: any) {
            return error.response.data;
        }
    }

    public async get_manifest() {
        const { data } = await axios.get<any>(baseURL + `/info/manifest`, {
            headers,
        });
        return data;
    }

    public async get_settings() {
        const { data } = await axios.get<any>(baseURL + `/info/settings`, {
            headers,
        });
        return data;
    }
}
// 23 funcs