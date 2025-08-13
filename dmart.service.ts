import {AxiosInstance} from "axios";
import {
    ActionRequest,
    ActionRequestRecord,
    ActionResponse,
    ApiQueryResponse,
    ApiResponse,
    ConfirmOTPRequest,
    FetchDataAssetRequest,
    GetAttachmentURLRequest,
    GetChildrenRequest,
    GetPayloadRequest,
    headers,
    LoginResponse,
    PasswordResetRequest,
    ProfileResponse, ProgressTicketRequest,
    QueryRequest,
    QueryType,
    ResourcesFromCSVRequest,
    ResponseEntry,
    RetrieveEntryRequest,
    SendOTPRequest,
    SortyType,
    Status, SubmitRequest,
    UploadWithPayloadRequest,
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
            {shortname, password},
            {headers}
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
                {...credentials, password},
                {headers}
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
            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `user/logout`,
                {},
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async createUser(request: ActionRequestRecord) {
        try {
            const {data} = await Dmart.axiosDmartInstance.post<ActionResponse>(
                `user/create`,
                request,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async updateUser(request: ActionRequestRecord) {
        try {
            const {data} = await Dmart.axiosDmartInstance.post<ActionResponse>(
                `user/profile`,
                request,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async checkExisting(prop: string, value: string) {
        try {
            const {data} = await Dmart.axiosDmartInstance.get<ResponseEntry>(
                `user/check-existing?${prop}=${value}`,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async getProfile() {
        try {
            const {data} = await Dmart.axiosDmartInstance.get<ProfileResponse>(`user/profile`, {
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
            const {data} = await Dmart.axiosDmartInstance.post<ApiQueryResponse>(
                `${scope}/query`,
                query,
                {headers}
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
            const {data} = await Dmart.axiosDmartInstance.post<ApiQueryResponse>(
                `managed/csv`,
                query,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async resourcesFromCsv(
        request: ResourcesFromCSVRequest
    ) {
        try {
            let csvUrl = `/managed/resources_from_csv/${request.resourceType}/${request.space_name}/${request.subpath}`;

            if (request.schema) {
                csvUrl += `/${request.schema}`;
            }

            let formdata = new FormData();
            formdata.append("resources_file", request.payload);

            const headers = {"Content-Type": "multipart/form-data"};

            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                csvUrl,
                formdata,
                {headers}
            );

            return data;
        } catch (error) {
            return error;
        }
    }


    public static async space(action: ActionRequest): Promise<ActionResponse> {
        try {
            const {data} = await Dmart.axiosDmartInstance.post<ActionResponse>(
                `managed/space`,
                action,
                {headers}
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

    public static async retrieveEntry(
        request: RetrieveEntryRequest,
        scope: string = "managed"
    ): Promise<ResponseEntry | null> {
        try {
            if (request.validate_schema === null) {
                request.validate_schema = true;
            }
            if (!request.subpath || request.subpath == "/") request.subpath = "__root__";
            const url = `${scope}/entry/${request.resource_type}/${request.space_name}/${request.subpath}/${request.shortname}?retrieve_json_payload=${request.retrieve_json_payload}&retrieve_attachments=${request.retrieve_attachments}&validate_schema=${request.validate_schema}`;
            const {data} = await Dmart.axiosDmartInstance.get<ResponseEntry>(
                `${url.replace(/\/+/g, "/")}`,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }


    public static async uploadWithPayload(
        request: UploadWithPayloadRequest,
        scope: string = "managed"
    ) {
        const request_record_body: any = {
            resource_type: request.resource_type,
            subpath: request.subpath,
            shortname: request.shortname,
            attributes: request.attributes,
        };

        if (request.attributes !== null && Object.keys(request.attributes!).length === 0) {
            request_record_body.attributes = {is_active: true, payload: {body: {}}};
        } else {
            if (!Object.keys(request.attributes!).includes('is_active')) {
                request_record_body.attributes.is_active = true;
            }
        }

        const request_record = new Blob([JSON.stringify(request_record_body)], {
            type: "application/json",
        });

        const form_data = new FormData();
        form_data.append("space_name", request.space_name);
        form_data.append("request_record", request_record);
        form_data.append("payload_file", request.payload_file);

        const headers = {"Content-Type": "multipart/form-data"};

        try {
            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `${scope}/resource_with_payload`,
                form_data,
                {headers}
            );

            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async fetchDataAsset(
        request: FetchDataAssetRequest,
    ) {
        try {
            const {data} = await Dmart.axiosDmartInstance.post(
                'managed/data-asset',
                {
                    space_name: request.spaceName,
                    resource_type: request.resourceType,
                    data_asset_type: request.dataAssetType,
                    subpath: request.subpath,
                    shortname: request.shortname,
                    query_string: request.query_string ?? "SELECT * FROM file",
                    filter_data_assets: request.filter_data_assets,
                },
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async getSpaces(): Promise<ApiResponse | null> {
        return await this.query({
            type: QueryType.spaces,
            space_name: "management",
            subpath: "/",
            search: "",
            limit: 100,
        });
    }

    public static async getChildren(
        request: GetChildrenRequest
    ): Promise<ApiResponse | null> {
        if(request.limit === null){
            request.limit = 20
        }
        if(request.offset === null){
            request.offset = 0
        }
        if(request.restrict_types === null){
            request.restrict_types = []
        }
        return await this.query({
            type: QueryType.search,
            space_name: request.space_name,
            subpath: request.subpath,
            filter_types: request.restrict_types,
            exact_subpath: true,
            search: request.search,
            limit: request.limit,
            offset: request.offset,
        });
    }

    public static getAttachmentUrl(
        request: GetAttachmentURLRequest,
        scope: string = "managed"
    ) {
        return `${Dmart.axiosDmartInstance.defaults.baseURL}/${scope}/payload/${request.resource_type}/${request.space_name}/${request.subpath.replace(
            /\/+$/,
            ""
        )}/${request.parent_shortname}/${request.shortname}${request.ext === null ? "" : `.${request.ext}`}`;
    }

    public static async getSpaceHealth(space_name: string) {
        try {
            const {data} = await Dmart.axiosDmartInstance.get<
                ApiQueryResponse & { attributes: { folders_report: Object } }
            >(`managed/health/${space_name}`, {headers});
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async getPayload(
        request: GetPayloadRequest,
        scope: string = "managed"
    ) {
        try {
            let url = `${scope}/payload/${request.resource_type}/${request.space_name}/${request.subpath}/${request.shortname}`;

            if (request.schemaShortname) {
                url += `.${request.schemaShortname}`
            }
            url += `.${request.ext}`
            const {data} = await Dmart.axiosDmartInstance.get<any>(
                url,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async progressTicket(
        request: ProgressTicketRequest
    ) {
        try {
            const payload: any = {};
            if (request.resolution) {
                payload.resolution = request.resolution;
            }
            if (request.comment) {
                payload.comment = request.comment;
            }
            const {data} = await Dmart.axiosDmartInstance.put<
                ApiQueryResponse & { attributes: { folders_report: Object } }
            >(
                `managed/progress-ticket/${request.space_name}/${request.subpath}/${request.shortname}/${request.action}`,
                payload,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async submit(
        request: SubmitRequest
    ) {
        try {
            var url = `public/submit/${request.spaceName}`;
            if (request.resourceType) {
                url += `/${request.resourceType}`;
            }
            if (request.workflowShortname) {
                url += `/${request.workflowShortname}`;
            }
            url += `/${request.schemaShortname}/${request.subpath}`;
            const {data} = await Dmart.axiosDmartInstance.post(
                url,
                request.record,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async get_manifest() {
        try {
            const {data} = await Dmart.axiosDmartInstance.get<any>(`info/manifest`, {
                headers,
            });
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async get_settings() {
        try {
            const {data} = await Dmart.axiosDmartInstance.get<any>(`info/settings`, {
                headers,
            });
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async otpRequest(
        request: SendOTPRequest,
        acceptLanguage: string | null = null
    ) {
        try {
            const requestHeaders = {...headers};
            if (acceptLanguage) {
                requestHeaders['Accept-Language'] = acceptLanguage;
            }

            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `user/otp-request`,
                request,
                {headers: requestHeaders}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async otpRequestLogin(
        request: SendOTPRequest,
        acceptLanguage: string | null = null
    ) {
        try {
            const requestHeaders = {...headers};
            if (acceptLanguage) {
                requestHeaders['Accept-Language'] = acceptLanguage;
            }

            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `user/otp-request-login`,
                request,
                {headers: requestHeaders}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async passwordResetRequest(request: PasswordResetRequest) {
        try {
            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `user/password-reset-request`,
                request,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async confirmOtp(request: ConfirmOTPRequest) {
        try {
            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `user/otp-confirm`,
                request,
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async userReset(shortname: string) {
        try {
            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `user/reset`,
                {shortname},
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    public static async validatePassword(password: string) {
        try {
            const {data} = await Dmart.axiosDmartInstance.post<ApiResponse>(
                `user/validate_password`,
                {password},
                {headers}
            );
            return data;
        } catch (error: any) {
            throw error;
        }
    }
}
