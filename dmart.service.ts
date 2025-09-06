import {AxiosInstance} from "axios";
import {
    ActionRequest,
    ActionRequestRecord,
    ActionResponse,
    ApiQueryResponse,
    ApiResponse,
    ConfirmOTPRequest, DmartScope,
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

    /**
     * Sets the Axios instance to be used for all HTTP requests
     * @param axiosInstance - The Axios instance to use for API calls
     */
    static setAxiosInstance(axiosInstance: AxiosInstance) {
        Dmart.axiosDmartInstance = axiosInstance;
    }

    /**
     * Gets the current Axios instance
     * @returns The configured Axios instance
     * @throws Error if no Axios instance has been set
     */
    public static getAxiosInstance(): AxiosInstance {
        if (!Dmart.axiosDmartInstance) {
            throw new Error("Axios instance is not set. Please set it using setAxiosInstance method.");
        }
        return Dmart.axiosDmartInstance;
    }

    /**
     * Gets the current headers object used for API requests
     * @returns The headers object containing request headers
     */
    public static getHeaders() {
        return headers;
    }

    /**
     * Updates the headers object with new headers
     * @param newHeaders - Object containing headers to merge with existing headers
     */
    public static setHeaders(newHeaders: any) {
        Object.assign(headers, newHeaders);
    }

    /**
     * Gets the base URL from the Axios instance
     * @returns The base URL string
     */
    public static getBaseURL() {
        return Dmart.axiosDmartInstance.defaults.baseURL;
    }

    /**
     * Sets the base URL for the Axios instance
     * @param url - The base URL to set
     */
    public static set setBaseURL(url: string) {
        Dmart.axiosDmartInstance.defaults.baseURL = url;
    }

    /**
     * Gets the current authentication token
     * @returns The token string without the "Bearer " prefix, or null if not set
     */
    public static getToken() {
        return headers["Authorization"] ? headers["Authorization"].replace("Bearer ", "") : null;
    }

    /**
     * Sets the authentication token in the headers
     * @param token - The JWT token to use for authentication
     */
    public static setToken(token: string) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    /**
     * Authenticates a user with shortname and password
     * @param shortname - The user's shortname (username)
     * @param password - The user's password
     * @returns Promise resolving to LoginResponse containing authentication data and access token
     */
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

    /**
     * Authenticates a user with custom credentials and password
     * @param credentials - Object containing login credentials (e.g., email, phone, etc.)
     * @param password - The user's password
     * @returns Promise resolving to LoginResponse containing authentication data and access token
     * @throws Error if login request fails
     */
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

    /**
     * Logs out the current user session
     * @returns Promise resolving to ApiResponse indicating logout status
     * @throws Error if logout request fails
     */
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

    /**
     * Creates a new user account
     * @param request - ActionRequestRecord containing user creation data
     * @returns Promise resolving to ActionResponse with creation result
     * @throws Error if user creation fails
     */
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

    /**
     * Updates an existing user's profile information
     * @param request - ActionRequestRecord containing user update data
     * @returns Promise resolving to ActionResponse with update result
     * @throws Error if user update fails
     */
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

    /**
     * Checks if a user property value already exists in the system
     * @param prop - The property name to check (e.g., 'email', 'shortname')
     * @param value - The value to check for existence
     * @returns Promise resolving to ResponseEntry indicating if the value exists
     * @throws Error if check request fails
     */
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

    /**
     * Retrieves the current user's profile information
     * @returns Promise resolving to ProfileResponse containing user profile data, permissions, and roles
     * @throws Error if profile retrieval fails
     */
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

    /**
     * Executes a query against the Dmart API to retrieve data
     * @param query - QueryRequest object containing query parameters, filters, and sorting options
     * @param scope - The scope for the query (default: DmartScope.managed)
     * @returns Promise resolving to ApiQueryResponse with query results or null
     * @throws Error if query execution fails
     */
    public static async query(
        query: QueryRequest,
        scope: string = DmartScope.managed
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

    /**
     * Exports query results as CSV format
     * @param query - Query object with parameters for CSV export
     * @returns Promise resolving to ApiQueryResponse containing CSV data
     * @throws Error if CSV generation fails
     */
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

    /**
     * Creates resources from an uploaded CSV file
     * @param request - ResourcesFromCSVRequest containing file data and resource configuration
     * @returns Promise resolving to ApiResponse with creation results, or error object if failed
     */
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

    /**
     * Performs space-level operations (create, update, delete spaces)
     * @param action - ActionRequest containing the operation details for space management
     * @returns Promise resolving to ActionResponse with operation result
     * @throws Error if space operation fails
     */
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

    /**
     * Executes a general request action against the Dmart API
     * @param action - ActionRequest containing the request details and parameters
     * @returns Promise resolving to ActionResponse with request result
     */
    public static async request(action: ActionRequest): Promise<ActionResponse> {
        const res = await Dmart.axiosDmartInstance.post<ActionResponse>(`managed/request`, action, {
            headers,
        });
        return res?.data;
    }

    /**
     * Retrieves a specific entry from the Dmart system
     * @param request - RetrieveEntryRequest containing entry identification and retrieval options
     * @param scope - The scope for the retrieval (default: DmartScope.managed)
     * @returns Promise resolving to ResponseEntry with entry data or null if not found
     * @throws Error if entry retrieval fails
     */
    public static async retrieveEntry(
        request: RetrieveEntryRequest,
        scope: string = DmartScope.managed
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


    /**
     * Uploads a resource with an attached payload file
     * @param request - UploadWithPayloadRequest containing resource data and payload file
     * @param scope - The scope for the upload operation (default: DmartScope.managed)
     * @returns Promise resolving to ApiResponse with upload result
     * @throws Error if upload fails
     */
    public static async uploadWithPayload(
        request: UploadWithPayloadRequest,
        scope: string = DmartScope.managed
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

    /**
     * Fetches data assets from the Dmart system with optional SQL query filtering
     * @param request - FetchDataAssetRequest containing asset identification and query parameters
     * @returns Promise resolving to data asset response
     * @throws Error if data asset fetch fails
     */
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

    /**
     * Retrieves a list of all available spaces in the system
     * @returns Promise resolving to ApiResponse containing spaces data or null
     */
    public static async getSpaces(): Promise<ApiResponse | null> {
        return await this.query({
            type: QueryType.spaces,
            space_name: "management",
            subpath: "/",
            search: "",
            limit: 100,
        });
    }

    /**
     * Gets child resources within a specified space and subpath
     * @param request - GetChildrenRequest containing search parameters and filters
     * @returns Promise resolving to ApiResponse with child resources or null
     */
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

    /**
     * Generates a URL for accessing attachment resources
     * @param request - GetAttachmentURLRequest containing attachment identification parameters
     * @param scope - The scope for the attachment URL (default: DmartScope.managed)
     * @returns String URL for accessing the attachment
     */
    public static getAttachmentUrl(
        request: GetAttachmentURLRequest,
        scope: string = DmartScope.managed
    ) {
        return `${Dmart.axiosDmartInstance.defaults.baseURL}/${scope}/payload/${request.resource_type}/${request.space_name}/${request.subpath.replace(
            /\/+$/,
            ""
        )}/${request.parent_shortname}/${request.shortname}${request.ext === null ? "" : `.${request.ext}`}`;
    }

    /**
     * Retrieves health information and statistics for a specific space
     * @param space_name - The name of the space to check health for
     * @returns Promise resolving to ApiQueryResponse with health data and folders report
     * @throws Error if health check fails
     */
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

    /**
     * Retrieves payload data for a specific resource
     * @param request - GetPayloadRequest containing payload identification parameters
     * @param scope - The scope for the payload retrieval (default: DmartScope.managed)
     * @returns Promise resolving to payload data
     * @throws Error if payload retrieval fails
     */
    public static async getPayload(
        request: GetPayloadRequest,
        scope: string = DmartScope.managed
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

    /**
     * Updates the progress of a ticket with resolution and comments
     * @param request - ProgressTicketRequest containing ticket identification and update data
     * @returns Promise resolving to ApiQueryResponse with progress update result
     * @throws Error if ticket progress update fails
     */
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

    /**
     * Submits data to a public endpoint with optional workflow processing
     * @param request - SubmitRequest containing submission data and routing information
     * @returns Promise resolving to submission response data
     * @throws Error if submission fails
     */
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

    /**
     * Retrieves the system manifest containing configuration and metadata
     * @returns Promise resolving to manifest data
     * @throws Error if manifest retrieval fails
     */
    public static async getManifest() {
        try {
            const {data} = await Dmart.axiosDmartInstance.get<any>(`info/manifest`, {
                headers,
            });
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Retrieves the system settings and configuration
     * @returns Promise resolving to settings data
     * @throws Error if settings retrieval fails
     */
    public static async getSettings() {
        try {
            const {data} = await Dmart.axiosDmartInstance.get<any>(`info/settings`, {
                headers,
            });
            return data;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Sends an OTP (One-Time Password) request to a user
     * @param request - SendOTPRequest containing recipient information
     * @param acceptLanguage - Optional language preference for the OTP message (default: null)
     * @returns Promise resolving to ApiResponse with OTP request result
     * @throws Error if OTP request fails
     */
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

    /**
     * Sends an OTP (One-Time Password) request for login purposes
     * @param request - SendOTPRequest containing recipient information for login OTP
     * @param acceptLanguage - Optional language preference for the OTP message (default: null)
     * @returns Promise resolving to ApiResponse with OTP login request result
     * @throws Error if OTP login request fails
     */
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

    /**
     * Initiates a password reset request for a user
     * @param request - PasswordResetRequest containing user identification for password reset
     * @returns Promise resolving to ApiResponse with password reset request result
     * @throws Error if password reset request fails
     */
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

    /**
     * Confirms an OTP (One-Time Password) code provided by the user
     * @param request - ConfirmOTPRequest containing the OTP code and verification details
     * @returns Promise resolving to ApiResponse with OTP confirmation result
     * @throws Error if OTP confirmation fails
     */
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

    /**
     * Resets a user's account or session state
     * @param shortname - The shortname (username) of the user to reset
     * @returns Promise resolving to ApiResponse with user reset result
     * @throws Error if user reset fails
     */
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

    /**
     * Validates a password against system password policies and requirements
     * @param password - The password string to validate
     * @returns Promise resolving to ApiResponse with validation result
     * @throws Error if password validation fails
     */
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
