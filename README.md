# Dmart

A TypeScript implementation of the Dmart that depends on axios.

# Setup

make sure you define `axiosDmartInstance` with your axios instance before importing the Dmart class.


## APIs
* `setAxiosInstance(axiosInstance: AxiosInstance)` - Sets the axios instance to be used by the Dmart class.
* `getAxiosInstance() -> AxiosInstance` - Gets the axios instance used by the Dmart class.
* `getBaseUrl() -> string` - Gets the base URL of the Dmart instance.
* `setBaseUrl(baseUrl: string)` - Sets the base URL of the Dmart instance.
* `getHeaders()` - Gets the headers used by the Dmart instance.
* `setHeaders(headers: Record<string, string>)` - Sets the headers used by the Dmart instance.
* `getToken() -> string | null` - Gets the token used by the Dmart instance.
* `setToken(token: string)` - Sets the token used by the Dmart instance.
* `login(shortname: string, password: string) -> Promise<LoginResponse>` - Performs a login action (shortname).
* `loginBy(credentials: dict, password: string) -> Promise<LoginResponse>` - Performs a login action but altering the default identifier that you can customise.
* `logout() -> Promise<ApiResponse>` - Performs a logout action.
* `otp_request(request: SendOTPRequest,acceptLanguage: string | null = null)  -> Promise<ApiResponse | null>` - Requests an OTP (One Time Password) for login.
* `otp_request_login(request: SendOTPRequest,acceptLanguage: string | null = null) -> Promise<ApiResponse | null>` - Requests an OTP for login and returns a login response.
* `password_reset_request(request: PasswordResetRequest) -> Promise<ApiResponse | null>` - Requests a password reset.
* `confirm_otp(request: ConfirmOTPRequest) -> Promise<ApiResponse | null>` - Confirms the OTP (One Time Password) for login or password reset.
* `user_reset(shortname: string) -> Promise<ApiResponse | null>` - Resets the user password by sending an OTP to the user's email.
* `validate_password(password: string) -> Promise<ApiResponse | null>` - Validates the password.
* `create_user(request: any) -> Promise<ActionResponse>` - Creates a new user.
* `update_user(request: any) -> Promise<ActionResponse>` - Updates an existing user.
* `check_existing(prop: string, value: string) -> Promise<ResponseEntry | null>` - Checks if a user exists.
* `get_profile() -> Promise<ProfileResponse | null>` - Gets the profile of the current user.
* `query(query: QueryRequest) -> Promise<ApiQueryResponse | null>` - Performs a query action.
* `csv(query: any) -> Promise<ApiQueryResponse>` - Query the entries as csv file.
* `space(action: ActionRequest) -> Promise<ActionResponse>` - Performs actions on spaces.
* `request(action: ActionRequest) -> Promise<ActionResponse>` - Performs a request action.
* `retrieve_entry(resource_type: ResourceType, space_name: string, subpath: string, shortname: string, retrieve_json_payload: boolean = false, retrieve_attachments: boolean = false, validate_schema: boolean = true) -> Promise<ResponseEntry|null>` - Performs a retrieve action.
* `upload_with_payload(space_name: string, subpath: string, shortname: string, resource_type: ResourceType, payload_file: File, content_type?: ContentType, schema_shortname?: string) -> Promise<ApiResponse>` - Uploads a file with a payload.
* `fetchDataAsset(resourceType: string, dataAssetType: string, spaceName: string, subpath: string, shortname: string, query_string?: string, filter_data_assets?: string[], branch_name?: string) -> Promise<any>` - Fetches a data asset.
* `get_spaces() -> Promise<ApiResponse | null>` - Gets the spaces (user query).
* `get_children(space_name: string, subpath: string, limit: number = 20, offset: number = 0, restrict_types: Array<ResourceType> = []) -> Promise<ApiResponse | null>` - Gets the children of a space (user query).
* `get_attachment_url(resource_type: ResourceType, space_name: string, subpath: string, parent_shortname: string, shortname: string, ext: string) -> string` - Constructs the URL of an attachment.
* `get_space_health(space_name: string) -> Promise<ApiQueryResponse & { attributes: { folders_report: Object } }>` - Gets the health check of a space.
* `get_attachment_content(resource_type: string, space_name: string, subpath: string, shortname: string) -> Promise<any>` - Gets the content of an attachment.
* `get_payload(resource_type: string, space_name: string, subpath: string, shortname: string, ext: string = ".json") -> Promise<any>` - Gets the payload of a resource.
* `get_payload_content(resource_type: string, space_name: string, subpath: string, shortname: string, ext: string = ".json") -> Promise<any>` - Gets the content of a payload.
* `progress_ticket(space_name: string, subpath: string, shortname: string, action: string, resolution?: string, comment?: string) -> Promise<ApiQueryResponse & { attributes: { folders_report: Object } }>` - Performs a progress ticket action.
* `submit(spaceName: string,  schemaShortname: string,  subpath: string,  record: any)  -> Promise<any>`  - Submits a record (log/feedback) to Dmart.
* `get_manifest() -> Promise<any>` - Gets the manifest of the current instance.
* `get_settings() -> Promise<any>` - Gets the settings of the current instance.
