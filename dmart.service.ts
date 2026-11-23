import type {AxiosInstance} from "axios";
import {
    DmartScope,
    headers,
    HealthType,
    QueryType,
    SortType,
    Status,
} from "./dmart.model.js";
import type {
    ActionRequest,
    ActionRequestRecord,
    ActionResponse,
    ApiQueryResponse,
    ApiResponse,
    ClientConfigResponse,
    ClientCredentialsOptions,
    ClientCredentialsToken,
    ConfirmOTPRequest,
    CreateUserRequest,
    CsvOptions,
    CsvPreviewResponse,
    GetAttachmentURLRequest,
    GetChildrenRequest,
    GetPayloadRequest,
    KeyAnswer,
    KeyChallenge,
    LoginOptions,
    LoginResponse,
    PasswordResetConfirmRequest,
    Permission,
    PermissionsResponse,
    ProfileResponse,
    ProgressTicketRequest,
    QueryRequest,
    ResourcesFromCSVRequest,
    ResponseEntry,
    RetrieveEntryRequest,
    SecondFactorProof,
    SecondFactors,
    SendOTPRequest,
    SpaceHealthResponse,
    SubmitRequest,
    TotpSetup,
    UploadWithPayloadRequest,
} from "./dmart.model.js";
import {secondFactorStep, signChallenge} from "./webauthn.js";

// An answer whose data is a top-level `attributes` object (user/passkeys/*, user/totp/*).
type AttributesResponse<T> = ApiResponse & { attributes?: T };

/** The name an account signs in with, as user/login takes it. */
export type AccountName = { shortname: string } | { email: string } | { msisdn: string };


// dmart's error code for a route the server does not have.
const INVALID_ROUTE = 230;

export class Dmart {
    static axiosDmartInstance: AxiosInstance;

    // Sent as X-DeviceId on sign-in when set (see setDeviceId).
    private static deviceId: string | null = null;

    // client_credentials sign-in (loginClientCredentials): what to ask the
    // token endpoint again, when (Date.now()), and the renewal in flight.
    private static clientCredentials: {
        clientId: string;
        clientSecret: string;
        resource?: string;
        tokenUrl: string;
    } | null = null;
    private static renewAt = Number.POSITIVE_INFINITY;
    private static renewal: Promise<unknown> | null = null;

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
    public static setHeaders(newHeaders: Record<string, string>) {
        Object.assign(headers, newHeaders);
    }

    /**
     * Gets the base URL from the Axios instance
     * @returns The base URL string
     * @throws Error if no Axios instance has been set
     */
    public static getBaseURL() {
        return Dmart.getAxiosInstance().defaults.baseURL;
    }

    /**
     * Sets the base URL for the Axios instance
     * @param url - The base URL to set
     */
    public static setBaseURL(url: string) {
        Dmart.getAxiosInstance().defaults.baseURL = url;
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
        Dmart.endClientCredentials();
        headers["Authorization"] = `Bearer ${token}`;
    }

    /**
     * Clears the stored authentication token, returning the client to the
     * anonymous state. Called by logout(); also useful when a caller drops a
     * session without hitting the logout endpoint.
     */
    public static clearToken() {
        Dmart.endClientCredentials();
        delete headers["Authorization"];
    }

    /**
     * Signs a service in with its own token instead of a bot's password
     * (OAuth 2 `client_credentials`, dmart 1.8.0+): its integration record in
     * `management/integrations` is the client. The token is kept like a
     * login's, and a request made when less than min(30 s, half its
     * lifetime) remains gets a new one first, so a long-running service needs
     * nothing else; concurrent requests share one renewal. Setting or
     * clearing the token, a password login or {@link logout} ends that.
     * @param clientId - The integration record's shortname
     * @param clientSecret - One of its secrets
     * @param options - `resource` for a token addressed to one service;
     *   `tokenUrl` when the token endpoint isn't `oidc/token` under the base URL
     * @returns The token endpoint's answer
     * @throws Error with the endpoint's OAuth error as its message
     *   (`invalid_client: ...`) and `status`, when it refuses
     */
    public static async loginClientCredentials(
        clientId: string,
        clientSecret: string,
        options: ClientCredentialsOptions = {},
    ): Promise<ClientCredentialsToken> {
        const credentials = {
            clientId,
            clientSecret,
            tokenUrl: options.tokenUrl ?? "oidc/token",
            ...(options.resource ? {resource: options.resource} : {}),
        };
        await Dmart.renewal?.catch(() => undefined);
        const answer = await Dmart.fetchClientToken(credentials);
        Dmart.clientCredentials = credentials;
        return answer;
    }

    // The axios instance, after renewing a client-credentials token that is
    // due: every call goes through here, so it sends the current token.
    private static async http(): Promise<AxiosInstance> {
        const credentials = Dmart.clientCredentials;
        if (credentials && Date.now() >= Dmart.renewAt) {
            Dmart.renewal ??= Dmart.fetchClientToken(credentials).finally(() => { Dmart.renewal = null; });
            await Dmart.renewal;
        }
        return Dmart.axiosDmartInstance;
    }

    private static async fetchClientToken(credentials: {
        clientId: string; clientSecret: string; resource?: string; tokenUrl: string;
    }): Promise<ClientCredentialsToken> {
        const form = new URLSearchParams({
            grant_type: "client_credentials",
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
        });
        if (credentials.resource) form.set("resource", credentials.resource);
        // Straight to the instance, not through http(): this is the renewal.
        const {status, data} = await Dmart.axiosDmartInstance.post(
            credentials.tokenUrl,
            form.toString(),
            {
                headers: {"Content-Type": "application/x-www-form-urlencoded"},
                validateStatus: () => true,
            }
        );
        // The token endpoint answers OAuth's own error shape, not dmart's
        // envelope: {"error": "invalid_client", "error_description": ...}.
        if (status >= 400 || !data?.access_token) {
            const message = data?.error
                ? `${data.error}: ${data.error_description ?? ""}`
                : "client_credentials sign-in failed";
            throw Object.assign(new Error(message), {status, response: {status, data}});
        }
        headers["Authorization"] = `Bearer ${data.access_token}`;
        const seconds = typeof data.expires_in === "number" ? data.expires_in : 0;
        Dmart.renewAt = seconds > 0
            ? Date.now() + (seconds - Math.min(30, seconds / 2)) * 1000
            : Number.POSITIVE_INFINITY;
        return data as ClientCredentialsToken;
    }

    private static endClientCredentials() {
        Dmart.clientCredentials = null;
        Dmart.renewAt = Number.POSITIVE_INFINITY;
    }

    /**
     * Sets the device this client signs in from. When set, {@link login} and
     * {@link loginBy} send it as the `X-DeviceId` header, which dmart
     * (1.7.3+) uses when the body names no `device_id`; a `device_id` in the
     * body wins. dmart 1.7.2+ requires a device for mobile accounts, and the
     * first sign-in from a new device answers `OTP_NEEDED` (115).
     * @param deviceId - A stable id for this device, or null to stop sending one
     */
    public static setDeviceId(deviceId: string | null) {
        Dmart.deviceId = deviceId ? deviceId : null;
    }

    /**
     * Gets the device id set with {@link setDeviceId}
     * @returns The device id, or null if none is set
     */
    public static getDeviceId() {
        return Dmart.deviceId;
    }

    // Headers for a sign-in call: the shared headers plus X-DeviceId when set.
    private static loginHeaders(): Record<string, string> {
        return Dmart.deviceId ? {...headers, "X-DeviceId": Dmart.deviceId} : headers;
    }

    /**
     * Picks the API scope to use when a caller did not specify one.
     *
     * Read endpoints exist in both scopes. `managed/*` requires a bearer token
     * and answers 401 without one, so defaulting an anonymous client to
     * `managed` could only ever fail — the public endpoint is the one that can
     * actually serve it. An authenticated client keeps `managed`, which is the
     * wider surface.
     *
     * Deliberately NOT used for writes: see uploadWithPayload, which stays on
     * `managed` because silently routing an anonymous upload to the public
     * endpoint would turn a guaranteed 401 into a real write attempt.
     */
    private static defaultScope(): DmartScope {
        return Dmart.getToken() ? DmartScope.managed : DmartScope.public;
    }

    /**
     * Authenticates a user with shortname and password.
     *
     * Some sign-ins take two steps. An admin's password sign-in (dmart
     * 1.6.6+), and the first sign-in from a new device (1.7.2+), answer
     * `OTP_NEEDED` (115) and send a code; call `login` again with the same
     * password, the same `device_id` and `{otp}`. A password sign-in that
     * names an unverified email or phone answers `USER_ISNT_VERIFIED` (11).
     * An account with a security key or an authenticator app (dmart 1.8.1+)
     * answers `OTP_NEEDED` with the step it needs ({@link secondFactorStep});
     * call `login` again with the same password and `{webauthn}`, `{totp}` or
     * `{recovery_code}`, or use {@link loginWithSecurityKey} in a browser.
     * See {@link DmartErrorCode}.
     * @param shortname - The user's shortname (username)
     * @param password - The user's password
     * @param options - `otp` for the second step; `device_id` for this call
     *   (otherwise the one from {@link setDeviceId} goes as `X-DeviceId`)
     * @returns Promise resolving to LoginResponse containing authentication data and access token
     */
    public static async login(shortname: string, password: string, options: LoginOptions = {}) {
        return Dmart.signIn({shortname, password, ...Dmart.secondStep(options)});
    }

    // The second-step fields of a sign-in, as user/login takes them.
    private static secondStep(options: LoginOptions): Record<string, unknown> {
        const body: Record<string, unknown> = {};
        if (options.otp) body["otp"] = options.otp;
        if (options.device_id) body["device_id"] = options.device_id;
        if (options.webauthn) body["webauthn"] = options.webauthn;
        if (options.totp) body["totp"] = options.totp;
        if (options.recovery_code) body["recovery_code"] = options.recovery_code;
        return body;
    }

    private static async signIn(body: Record<string, unknown>) {
        const response = await (await Dmart.http()).post<LoginResponse>(
            'user/login',
            body,
            {headers: Dmart.loginHeaders()}
        );
        const data: LoginResponse = response.data;
        if (data.status === Status.success && data.records.length > 0) {
            Dmart.endClientCredentials();
            headers["Authorization"] = "Bearer " + data.records[0]?.attributes.access_token;
        }
        return data;
    }

    /**
     * Signs in an account whose second factor is a security key, in a browser
     * (dmart 1.8.1+): the password, then the key's answer to the challenge the
     * password returned, with the password again. An account without a key
     * signs in with the first call. Any other second step (an authenticator
     * app's code) throws as {@link login} does; {@link secondFactorStep} reads
     * it, and `login` with `{totp}` or `{recovery_code}` finishes it.
     */
    public static async loginWithSecurityKey(shortname: string, password: string, options: LoginOptions = {}) {
        try {
            return await Dmart.login(shortname, password, options);
        } catch (error) {
            const step = secondFactorStep(error);
            if (!step?.webauthn || !step.factors.includes("passkey")) throw error;
            return Dmart.login(shortname, password, {...options, webauthn: await signChallenge(step.webauthn)});
        }
    }

    /**
     * Key-only sign-in's challenge for a name (dmart 1.8.1+), before there is
     * a session. Every name gets one; only an account that turned key-only
     * sign-in on gets one its key answers.
     */
    public static async keyOnlyChallenge(account: AccountName): Promise<KeyChallenge> {
        const {data} = await (await Dmart.http()).post<AttributesResponse<KeyChallenge>>(
            'user/passkeys/login-options', account, {headers});
        return data.attributes as KeyChallenge;
    }

    /**
     * Key-only sign-in (dmart 1.8.1+): the account's key and its PIN, no
     * password, for an account that turned it on ({@link setKeyOnly}). With
     * no answer given, asks the key in this browser. A refusal throws with
     * `SECOND_FACTOR_INVALID` (117), the same for every reason.
     */
    public static async loginWithKeyAlone(account: AccountName, answer?: KeyAnswer, options: LoginOptions = {}) {
        const webauthn = answer ?? await signChallenge(await Dmart.keyOnlyChallenge(account));
        return Dmart.signIn({...account, ...Dmart.secondStep(options), webauthn});
    }

    /** GET user/passkeys (dmart 1.8.1+): the signed-in account's second factors. */
    public static async getSecondFactors(): Promise<SecondFactors> {
        const {data} = await (await Dmart.http()).get<AttributesResponse<SecondFactors>>('user/passkeys', {headers});
        return data.attributes as SecondFactors;
    }

    /** A proof challenge for the account's keys: what a change asks its key to sign ({@link SecondFactorProof}). */
    public static async passkeyProofChallenge(): Promise<KeyChallenge> {
        const {data} = await (await Dmart.http()).post<AttributesResponse<KeyChallenge>>(
            'user/passkeys/proof-options', {}, {headers});
        return data.attributes as KeyChallenge;
    }

    /** The challenge for a new key, for `navigator.credentials.create` (see {@link makeKey}). */
    public static async passkeyRegisterChallenge(proof: SecondFactorProof): Promise<KeyChallenge> {
        const {data} = await (await Dmart.http()).post<AttributesResponse<KeyChallenge>>(
            'user/passkeys/register-options', proof, {headers});
        return data.attributes as KeyChallenge;
    }

    /** The new key. The account's first second factor comes with ten recovery codes, shown once. */
    public static async passkeyRegister(answer: KeyAnswer, name?: string) {
        const {data} = await (await Dmart.http()).post<AttributesResponse<{ id: string; name: string; recovery_codes?: string[] }>>(
            'user/passkeys/register', {webauthn: answer, ...(name ? {name} : {})}, {headers});
        return data.attributes!;
    }

    public static async passkeyRename(id: string, name: string) {
        const {data} = await (await Dmart.http()).post<ApiResponse>('user/passkeys/rename', {id, name}, {headers});
        return data;
    }

    /** Removes a key. Removing the account's last key ends its sessions, this one too. */
    public static async passkeyRemove(id: string, proof: SecondFactorProof) {
        const {data} = await (await Dmart.http()).post<ApiResponse>('user/passkeys/remove', {id, ...proof}, {headers});
        return data;
    }

    /** Ten new recovery codes; the old set is void. */
    public static async newRecoveryCodes(proof: SecondFactorProof): Promise<string[]> {
        const {data} = await (await Dmart.http()).post<AttributesResponse<{ recovery_codes: string[] }>>(
            'user/passkeys/recovery-codes', proof, {headers});
        return data.attributes?.recovery_codes ?? [];
    }

    /** Key-only sign-in on or off for the signed-in account (it needs a key). */
    public static async setKeyOnly(enabled: boolean, proof: SecondFactorProof) {
        const {data} = await (await Dmart.http()).post<ApiResponse>('user/passkeys/key-only', {enabled, ...proof}, {headers});
        return data;
    }

    /** An authenticator app's setup: show `uri` as a QR code, or `secret` to type in. */
    public static async totpBegin(proof: SecondFactorProof): Promise<TotpSetup> {
        const {data} = await (await Dmart.http()).post<AttributesResponse<TotpSetup>>('user/totp/begin', proof, {headers});
        return data.attributes as TotpSetup;
    }

    /** Confirms the app with a code from it; the recovery codes when it is the account's first second factor. */
    public static async totpConfirm(setupId: string, code: string): Promise<string[] | undefined> {
        const {data} = await (await Dmart.http()).post<AttributesResponse<{ recovery_codes?: string[] }>>(
            'user/totp/confirm', {setup_id: setupId, code}, {headers});
        return data.attributes?.recovery_codes;
    }

    public static async totpRemove(proof: SecondFactorProof) {
        const {data} = await (await Dmart.http()).post<ApiResponse>('user/totp/remove', proof, {headers});
        return data;
    }

    /**
     * Authenticates a user with custom credentials and password. The
     * credentials may also carry `otp` (the second step after `OTP_NEEDED`,
     * 115) and `device_id`; see {@link login} for the two-step flow.
     * @param credentials - Object containing login credentials (e.g., email, msisdn, otp, device_id)
     * @param password - The user's password
     * @param options - The second step's fields, as for {@link login}
     * @returns Promise resolving to LoginResponse containing authentication data and access token
     */
    public static async loginBy(credentials: Record<string, string>, password: string, options: LoginOptions = {}) {
        return Dmart.signIn({...credentials, password, ...Dmart.secondStep(options)});
    }

    /**
     * Logs out the current user session
     * @returns Promise resolving to ApiResponse indicating logout status
     */
    public static async logout() {
        const {data} = await (await Dmart.http()).post<ApiResponse>(
            'user/logout',
            {},
            {headers}
        );
        // Drop the bearer token: without this the client stays "authenticated"
        // from getToken()'s point of view, so scope auto-detection would keep
        // choosing managed/* and 401 on every subsequent read.
        Dmart.clearToken();
        return data;
    }

    /**
     * Registers a new user account (POST user/create).
     *
     * Since dmart 1.7.10 open registration always needs a code for each
     * address: request one with `otpRequest({purpose: OtpPurpose.register,
     * email|msisdn})` and send it as `attributes.email_otp` /
     * `attributes.msisdn_otp`. A top-level `shortname` is the username the
     * registrant chose (dmart 1.7.9+), or `"auto"` for one the server makes;
     * older servers ignore it. Use `checkExisting("shortname", ...)` first to
     * see whether it is free and meets the username rule.
     * @param request - `{shortname?, attributes}`. An ActionRequestRecord is
     *   still accepted; note that its `shortname` is now honoured as the
     *   chosen username.
     * @returns Promise resolving to ActionResponse with creation result
     */
    public static async createUser(request: CreateUserRequest | ActionRequestRecord) {
        const {data} = await (await Dmart.http()).post<ActionResponse>(
            'user/create',
            request,
            {headers}
        );
        return data;
    }

    /**
     * Updates an existing user's profile information.
     * Note: the underlying `user/profile` endpoint no longer accepts email, new_email,
     * email_otp, msisdn, new_msisdn, or msisdn_otp attributes. To confirm or change a
     * user's contact info, use otpRequest with purpose OtpPurpose.verifyContact followed
     * by confirmOtp instead. Changing the password always needs `old_password`
     * next to `password` (dmart 1.6.6+), even under `force_password_change`;
     * an account without a password sets its first one with
     * {@link passwordResetConfirm}.
     * @param request - ActionRequestRecord containing user update data
     * @returns Promise resolving to ActionResponse with update result
     */
    public static async updateUser(request: ActionRequestRecord) {
        const {data} = await (await Dmart.http()).post<ActionResponse>(
            'user/profile',
            request,
            {headers}
        );
        return data;
    }

    /**
     * Checks if a user property value already exists in the system
     * @param prop - The property name to check (e.g., 'email', 'shortname')
     * @param value - The value to check for existence
     * @returns Promise resolving to ResponseEntry indicating if the value exists
     */
    public static async checkExisting(prop: string, value: string) {
        const {data} = await (await Dmart.http()).get<ResponseEntry>(
            `user/check-existing?${prop}=${value}`,
            {headers}
        );
        return data;
    }

    /**
     * Retrieves the current user's profile information
     * @returns Promise resolving to ProfileResponse containing user profile data, permissions, and roles
     */
    public static async getProfile() {
        const {data} = await (await Dmart.http()).get<ProfileResponse>('user/profile', {
            headers,
        });
        if (typeof localStorage !== "undefined" && data.status === "success") {
            const attributes = (data?.records ?? [{}])[0]?.attributes;
            // dmart deprecates the profile's copy for GET /user/permissions
            // (getPermissions). Once a server leaves it out, keep what is
            // stored rather than writing "undefined" over it.
            if (attributes?.permissions !== undefined) {
                localStorage.setItem("permissions", JSON.stringify(attributes.permissions));
            }
            localStorage.setItem("roles", JSON.stringify(attributes?.["roles"]));
        }
        return data;
    }

    /**
     * Retrieves the caller's resolved permission map from GET /user/permissions
     * (keyed `"space:subpath:resource_type"`) and stores it in
     * `localStorage["permissions"]`, where {@link getProfile} has always put it.
     * The route answers with an ETag, so a browser revalidates the map rather
     * than downloading it again. A server without the route answers
     * INVALID_ROUTE (230, with HTTP 422) and is answered from the profile's
     * copy. Any other failure throws, as other calls do.
     * @returns The permission map
     */
    public static async getPermissions(): Promise<Record<string, Permission>> {
        let map: Record<string, Permission> | undefined;
        try {
            const {data} = await (await Dmart.http()).get<PermissionsResponse>("user/permissions", {headers});
            map = data?.attributes?.permissions;
        } catch (error) {
            const response = (error as {
                response?: { status?: number; data?: { error?: { code?: number } } };
            })?.response;
            if (response?.data?.error?.code !== INVALID_ROUTE && response?.status !== 404) {
                throw error;
            }
            map = (await Dmart.getProfile())?.records?.[0]?.attributes?.permissions;
        }
        map ??= {};
        if (typeof localStorage !== "undefined") {
            localStorage.setItem("permissions", JSON.stringify(map));
        }
        return map;
    }

    /**
     * Executes a query against the Dmart API to retrieve data
     * @param query - QueryRequest object containing query parameters, filters, and sorting options
     * @param scope - API scope. Omit to auto-detect: `managed` when a token is set, `public` otherwise.
     * @returns Promise resolving to ApiQueryResponse with query results or null
     */
    public static async query(
        query: QueryRequest,
        scope?: DmartScope
    ): Promise<ApiQueryResponse | null> {
        scope ??= Dmart.defaultScope();
        if (query.type !== QueryType.spaces) {
            query.sort_type = query.sort_type || SortType.ascending;
            query.sort_by = query.sort_by || "created_at";
        }
        query.subpath = query.subpath.replace(/\/+/g, "/");
        const {data} = await (await Dmart.http()).post<ApiQueryResponse>(
            `${scope}/query`,
            query,
            {headers}
        );
        return data;
    }

    /**
     * Exports query results as CSV. dmart answers the file itself
     * (`text/csv`), so this resolves to the CSV text, not a JSON envelope.
     * A refusal still rejects as an axios error whose `response.data` is
     * dmart's JSON error.
     * @param query - Query object with parameters for CSV export; it is not modified
     * @param options - `preview: true` asks what the CSV would hold
     *   (`exported`, `total`, `truncated`, `message`, ...) instead of the CSV
     * @returns Promise resolving to the CSV text, or with `preview: true` the preview
     */
    public static csv(query: QueryRequest): Promise<string>;
    public static csv(query: QueryRequest, options: CsvOptions & { preview: true }): Promise<CsvPreviewResponse>;
    public static csv(query: QueryRequest, options?: CsvOptions): Promise<string | CsvPreviewResponse>;
    public static async csv(query: QueryRequest, options: CsvOptions = {}): Promise<string | CsvPreviewResponse> {
        // A copy: the caller's query object is left as it was. created_at is
        // only the default order, for a query that names none.
        const body: QueryRequest = {
            ...query,
            sort_type: query.sort_type || SortType.ascending,
            sort_by: query.sort_by || "created_at",
            subpath: query.subpath.replace(/\/+/g, "/"),
        };
        if (options.preview) {
            const {data} = await (await Dmart.http()).post<CsvPreviewResponse>(
                'managed/csv?preview=1',
                body,
                {headers}
            );
            return data;
        }
        try {
            const {data} = await (await Dmart.http()).post<string>(
                'managed/csv',
                body,
                {headers, responseType: "text"}
            );
            return typeof data === "string" ? data : String(data ?? "");
        } catch (error) {
            // Asked for text, a refusal's JSON body arrives as a string too:
            // hand callers dmart's error envelope, as every other call does.
            const response = (error as { response?: { data?: unknown } } | null)?.response;
            if (response && typeof response.data === "string") {
                try {
                    response.data = JSON.parse(response.data);
                } catch {
                    // Not JSON (a proxy's error page, say): leave it as text.
                }
            }
            throw error;
        }
    }

    /**
     * Creates resources from an uploaded CSV file
     * @param request - ResourcesFromCSVRequest containing file data and resource configuration
     * @returns Promise resolving to ApiResponse with creation results
     */
    public static async resourcesFromCsv(
        request: ResourcesFromCSVRequest
    ) {
        let csvUrl = `/managed/resources_from_csv/${request.resourceType}/${request.space_name}/${request.subpath}`;
        const params: Record<string, boolean | number> = {};
        if (request.schema) {
            csvUrl += `/${request.schema}`;
        }

        const formdata = new FormData();
        formdata.append("resources_file", request.payload);

        if (request.isUpdate) {
            params['is_update'] = request.isUpdate;
        }
        if (request.firstRow) {
            params['first_row'] = request.firstRow;
        }

        const multipartHeaders = {...headers, "Content-Type": "multipart/form-data"};

        const {data} = await (await Dmart.http()).post<ApiResponse>(
            csvUrl,
            formdata,
            {headers: multipartHeaders, params}
        );

        return data;
    }

    // /** LEGACY, DEPRECATED CODE, DO NOT USE
    //  * Performs space-level operations (create, update, delete spaces)
    //  * @param action - ActionRequest containing the operation details for space management
    //  * @returns Promise resolving to ActionResponse with operation result
    //  */
    // public static async space(action: ActionRequest): Promise<ActionResponse> {
    //     const {data} = await (await Dmart.http()).post<ActionResponse>(
    //         'managed/space',
    //         action,
    //         {headers}
    //     );
    //     return data;
    // }

    /**
     * Executes a general request action against the Dmart API
     * @param action - ActionRequest containing the request details and parameters
     * @returns Promise resolving to ActionResponse with request result
     */
    public static async request(action: ActionRequest): Promise<ActionResponse> {
        const res = await (await Dmart.http()).post<ActionResponse>('managed/request', action, {
            headers,
        });
        return res?.data;
    }

    /**
     * Retrieves a specific entry from the Dmart system
     * @param request - RetrieveEntryRequest containing entry identification and retrieval options
     * @param scope - API scope. Omit to auto-detect: `managed` when a token is set, `public` otherwise.
     * @returns Promise resolving to ResponseEntry with entry data or null if not found
     */
    public static async retrieveEntry(
        request: RetrieveEntryRequest,
        scope?: DmartScope
    ): Promise<ResponseEntry | null> {
        scope ??= Dmart.defaultScope();
        if (!request.subpath || request.subpath === "/") request.subpath = "__root__";
        const url = `${scope}/entry/${request.resource_type}/${request.space_name}/${request.subpath}/${request.shortname}?retrieve_json_payload=${request.retrieve_json_payload}&retrieve_attachments=${request.retrieve_attachments}`;
        const {data} = await (await Dmart.http()).get<ResponseEntry>(
            `${url.replace(/\/+/g, "/")}`,
            {headers}
        );
        return data;
    }


    /**
     * Uploads a resource with an attached payload file
     * @param request - UploadWithPayloadRequest containing resource data and payload file
     * @param scope - The scope for the upload operation (default: DmartScope.managed).
     *                Writes are NOT auto-detected — pass DmartScope.public explicitly if intended.
     * @returns Promise resolving to ApiResponse with upload result
     */
    public static async uploadWithPayload(
        request: UploadWithPayloadRequest,
        scope: DmartScope = DmartScope.managed
    ) {
        const request_record_body: Record<string, any> = {
            resource_type: request.resource_type,
            subpath: request.subpath,
            shortname: request.shortname,
            attributes: request.attributes ?? {},
        };

        if (!request.attributes || Object.keys(request.attributes).length === 0) {
            request_record_body['attributes'] = {is_active: true, payload: {body: {}, content_type: 'json'}};
        } else {
            if (!Object.keys(request.attributes).includes('is_active')) {
                request_record_body['attributes'].is_active = true;
            }
        }

        const request_record = new Blob([JSON.stringify(request_record_body)], {
            type: "application/json",
        });

        const form_data = new FormData();
        form_data.append("space_name", request.space_name);
        form_data.append("request_record", request_record);
        form_data.append("payload_file", request.payload_file);

        const _headers = {...headers, "Content-Type": "multipart/form-data"};

        const {data} = await (await Dmart.http()).post<ApiResponse>(
            `${scope}/resource_with_payload`,
            form_data,
            {headers: _headers}
        );

        return data;
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
        if (request.limit === null) {
            request.limit = 20;
        }
        if (request.offset === null) {
            request.offset = 0;
        }
        if (request.restrict_types === null) {
            request.restrict_types = [];
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
     * @param scope - API scope. Omit to auto-detect: `managed` when a token is set, `public` otherwise.
     * @returns String URL for accessing the attachment
     */
    public static getAttachmentUrl(
        request: GetAttachmentURLRequest,
        scope?: DmartScope
    ) {
        scope ??= Dmart.defaultScope();
        const subpath = request.subpath.replace(
            /\/+$/,
            ""
        );
        return `${Dmart.getAxiosInstance().defaults.baseURL}` + `/${scope}/payload/${request.resource_type}/${request.space_name}/${subpath}/${request.parent_shortname}/${request.shortname}${request.ext === null ? "" : `.${request.ext}`}`.replaceAll('//', '/');
    }

    /**
     * Runs the health checks on a space (GET managed/health/{health_type}/{space}).
     * Global admins only: anyone else is refused.
     * @param space_name - The name of the space to check health for
     * @param health_type - `soft` (default), `hard` or `all`; see {@link HealthType}
     * @returns Promise resolving to the checks run, each with a count and samples
     */
    public static async getSpaceHealth(
        space_name: string,
        health_type: HealthType | `${HealthType}` = HealthType.soft
    ) {
        const {data} = await (await Dmart.http()).get<SpaceHealthResponse>(
            `managed/health/${health_type}/${space_name}`,
            {headers}
        );
        return data;
    }

    /**
     * Retrieves payload data for a specific resource
     * @param request - GetPayloadRequest containing payload identification parameters
     * @param scope - API scope. Omit to auto-detect: `managed` when a token is set, `public` otherwise.
     * @returns Promise resolving to payload data
     */
    public static async getPayload(
        request: GetPayloadRequest,
        scope?: DmartScope
    ) {
        scope ??= Dmart.defaultScope();
        let url = `${scope}/payload/${request.resource_type}/${request.space_name}/${request.subpath}/${request.shortname}`;

        if (request.schemaShortname) {
            url += `.${request.schemaShortname}`;
        }
        url += `.${request.ext}`;
        const {data} = await (await Dmart.http()).get<any>(
            url,
            {headers}
        );
        return data;
    }

    /**
     * Updates the progress of a ticket with resolution and comments
     * @param request - ProgressTicketRequest containing ticket identification and update data
     * @returns Promise resolving to ApiQueryResponse with progress update result
     */
    public static async progressTicket(
        request: ProgressTicketRequest
    ) {
        const payload: Record<string, string> = {};
        if (request.resolution) {
            payload['resolution'] = request.resolution;
        }
        if (request.comment) {
            payload['comment'] = request.comment;
        }
        const {data} = await (await Dmart.http()).put<
            ApiQueryResponse & { attributes: { folders_report: Record<string, unknown> } }
        >(
            `managed/progress-ticket/${request.space_name}/${request.subpath}/${request.shortname}/${request.action}`,
            payload,
            {headers}
        );
        return data;
    }

    /**
     * Submits data to a public endpoint with optional workflow processing
     * @param request - SubmitRequest containing submission data and routing information
     * @returns Promise resolving to submission response data
     */
    public static async submit(
        request: SubmitRequest
    ) {
        let url = `public/submit/${request.spaceName}`;
        if (request.resourceType) {
            url += `/${request.resourceType}`;
        }
        if (request.workflowShortname) {
            url += `/${request.workflowShortname}`;
        }
        url += `/${request.schemaShortname}/${request.subpath}`;
        const {data} = await (await Dmart.http()).post(
            url,
            request.record,
            {headers}
        );
        return data;
    }

    /**
     * Retrieves the system manifest containing configuration and metadata
     * @returns Promise resolving to manifest data
     */
    public static async getManifest() {
        const {data} = await (await Dmart.http()).get<any>('info/manifest', {
            headers,
        });
        return data;
    }

    /**
     * Retrieves the system settings and configuration
     * @returns Promise resolving to settings data
     */
    public static async getSettings() {
        const {data} = await (await Dmart.http()).get<any>('info/settings', {
            headers,
        });
        return data;
    }

    /**
     * Retrieves the settings a client should follow (GET public/client-config,
     * dmart 1.6.12+): OTP length and timing, query limits, upload size, the
     * request timeout, and whether custom password/username rules apply, with
     * their hints. Needs no sign-in, and sends no token: a stale one must not
     * keep a signed-out client from reading it.
     * @returns Promise resolving to a response whose `attributes` is a {@link ClientConfig}
     */
    public static async getClientConfig() {
        const {Authorization: _token, ...publicHeaders} = headers;
        const {data} = await (await Dmart.http()).get<ClientConfigResponse>('public/client-config', {
            headers: publicHeaders,
        });
        return data;
    }

    /**
     * Lists every plugin currently loaded by the dmart server, with the
     * version each plugin announces from its own binary (assembly attribute
     * for in-process .NET, dlsym(dmart_plugin_version) for native .so, the
     * `version` field of the {"type":"info"} response for subprocess plugins).
     * @returns Promise resolving to a Response envelope whose `records` array
     *   carries one record per active plugin, each with attributes
     *   `version` and `type` ("hook" | "api").
     */
    public static async getPlugins() {
        const {data} = await (await Dmart.http()).get<any>('info/plugins', {
            headers,
        });
        return data;
    }

    /**
     * Sends an OTP (One-Time Password) request to a user
     * @param request - SendOTPRequest containing recipient information and the purpose
     *   of the request (login, reset, register, or verify-contact)
     * @param acceptLanguage - Optional language preference for the OTP message (default: null)
     * @returns Promise resolving to ApiResponse with OTP request result
     */
    public static async otpRequest(
        request: SendOTPRequest,
        acceptLanguage: string | null = null
    ) {
        const requestHeaders = {...headers};
        if (acceptLanguage) {
            requestHeaders['Accept-Language'] = acceptLanguage;
        }

        const {data} = await (await Dmart.http()).post<ApiResponse>(
            'user/otp-request',
            request,
            {headers: requestHeaders}
        );
        return data;
    }

    /**
     * Confirms an OTP (One-Time Password) code to verify a user's contact (email/msisdn).
     * Must be preceded by an otpRequest call with purpose OtpPurpose.verifyContact.
     * Changing the address (dmart 1.6.7+) also needs `password` on an account
     * that has one, or `current_code` (a verify-contact code sent to the
     * address the account already has) on one that does not.
     * @param request - ConfirmOTPRequest containing the OTP code and the email/msisdn being verified
     * @returns Promise resolving to ApiResponse with the verification result
     */
    public static async confirmOtp(request: ConfirmOTPRequest) {
        const {data} = await (await Dmart.http()).post<ApiResponse>(
            'user/verify-contact',
            request,
            {headers}
        );
        return data;
    }

    /**
     * Sets a new password with a reset code (POST user/password-reset-confirm).
     * Request the code first with `otpRequest({purpose: OtpPurpose.reset, ...})`.
     * Name exactly one of `shortname`, `email` or `msisdn`; a server may
     * refuse `shortname` and expect an address.
     * @param request - The code, the new password and the account's identifier
     * @returns Promise resolving to ApiResponse with the reset result
     */
    public static async passwordResetConfirm(request: PasswordResetConfirmRequest) {
        const {data} = await (await Dmart.http()).post<ApiResponse>(
            'user/password-reset-confirm',
            request,
            {headers}
        );
        return data;
    }

    /**
     * Validates a password against system password policies and requirements
     * @param password - The password string to validate
     * @returns Promise resolving to ApiResponse with validation result
     */
    public static async validatePassword(password: string) {
        const {data} = await (await Dmart.http()).post<ApiResponse>(
            'user/validate_password',
            {password},
            {headers}
        );
        return data;
    }
}
