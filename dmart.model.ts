export enum Status {
  success = "success",
  failed = "failed",
}

export interface ClientError {
    code: string,
    status: string,
    message: string,
    request?: {
        url: string, 
        method: string
    },
    response: ApiResponse
}

/**
 * `Error.type` values dmart sends. `server` (dmart 1.7+) marks a failure on
 * the server's side, such as `PASSWORD_HASHING_BUSY` or `REQUEST_TIMEOUT`.
 * The field itself stays a plain string, since some routes send others.
 */
export enum ErrorType {
  auth = "auth",
  jwtauth = "jwtauth",
  db = "db",
  request = "request",
  create = "create",
  exception = "exception",
  server = "server",
  restriction = "restriction",
  internal = "internal",
  media = "media",
  attachment = "attachment",
  qr = "qr",
  channel_auth = "channel_auth",
}

/**
 * The `Error.code` values a client most often has to branch on. These are
 * dmart's `InternalErrorCode` integers, which never change meaning.
 */
export enum DmartErrorCode {
  // Sign-in and accounts
  INVALID_USERNAME_AND_PASS = 10,
  USER_ISNT_VERIFIED = 11,
  SESSION = 50,
  PASSWORD_RESET_ERROR = 102,
  USER_ACCOUNT_LOCKED = 110,
  OTP_NEEDED = 115,
  NOT_ALLOWED = 401,
  // Codes
  OTP_RESEND_BLOCKED = 103,
  OTP_INVALID = 307,
  OTP_EXPIRED = 308,
  // Data
  MISSING_DATA = 202,
  INVALID_ROUTE = 230,
  INVALID_TICKET_STATUS = 300,
  SHORTNAME_ALREADY_EXIST = 400,
  INVALID_DATA = 402,
  CONFLICT = 409,
  DATA_SHOULD_BE_UNIQUE = 415,
  // Server
  PASSWORD_HASHING_BUSY = 503,
  REQUEST_TIMEOUT = 504,
}

export type Error = {
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

export type Translation = {
  ar: string;
  en: string;
  ku: string;
};

export enum UserType {
  web = "web",
  mobile = "mobile",
  bot = "bot",
  /** dmart 1.6.6+. Signs in with a password and a code. */
  admin = "admin",
}

export enum OtpPurpose {
  login = "login",
  reset = "reset",
  register = "register",
  verifyContact = "verify-contact",
}

export interface SendOTPRequest {
  msisdn?: string;
  email?: string;
  shortname?: string;
  purpose: OtpPurpose;
}

export enum DmartScope {
    managed = "managed",
    public = "public",
}

export interface ConfirmOTPRequest {
  code: string;
  email?: string;
  msisdn?: string;
  /**
   * Needed to CHANGE the email or phone of an account that has a password
   * (an admin always does). Not needed to confirm the address already on
   * the account.
   */
  password?: string;
  /**
   * Needed instead of `password` to change the address of an account with
   * no password: a verify-contact code sent to the address it already has
   * (its phone, else its email).
   */
  current_code?: string;
}

/**
 * POST /user/password-reset-confirm. Name exactly one of `shortname`,
 * `email` or `msisdn` (a server may refuse `shortname`), with the code from
 * `otpRequest({purpose: OtpPurpose.reset, ...})` and the new password.
 */
export interface PasswordResetConfirmRequest {
  otp: string;
  password: string;
  shortname?: string;
  email?: string;
  msisdn?: string;
}

/**
 * POST /user/create (self-registration).
 *
 * `shortname` is the username the registrant chose, or `"auto"`/absent for
 * one the server makes (dmart 1.7.9+; older servers ignore it). It must be
 * free and meet the server's username rule (see {@link ClientConfig}).
 *
 * `attributes` carries `email` and/or `msisdn`, `password`, `displayname`,
 * and the codes proving each address: `email_otp` / `msisdn_otp`, sent by
 * `otpRequest({purpose: OtpPurpose.register, ...})`. Since dmart 1.7.10 open
 * registration always needs those codes.
 */
export interface CreateUserRequest {
  shortname?: string;
  attributes: Record<string, any>;
}

/** Options for a password sign-in. */
/**
 * Options for {@link Dmart.loginClientCredentials}.
 */
export interface ClientCredentialsOptions {
  /**
   * Ask for a token addressed to one service (RFC 8707). dmart's own API
   * refuses such a token.
   */
  resource?: string;
  /**
   * The token endpoint; `oidc/token` under the base URL when not set.
   */
  tokenUrl?: string;
}

/**
 * The token endpoint's answer to a `client_credentials` request.
 */
export interface ClientCredentialsToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface LoginOptions {
  /**
   * The code, for the second step after an `OTP_NEEDED` (115) answer. Send
   * it together with the same identifier, password and `device_id`.
   */
  otp?: string;
  /**
   * The device signing in. dmart 1.7.2+ requires one for mobile accounts.
   * Overrides {@link Dmart.setDeviceId} for this call.
   */
  device_id?: string;
}

/** GET /public/client-config (dmart 1.6.12+): settings a client should follow. */
export interface ClientConfig {
  /** Milliseconds a client should wait before giving up on a request. */
  backend_timeout: number;
  otp_length: number;
  /** Seconds before a code may be requested again. */
  otp_resend_after: number;
  /** Seconds a code stays valid. */
  otp_token_ttl: number;
  max_upload_size_mb: number;
  /** The `limit` the server uses when a query sends none. */
  default_query_limit: number;
  max_query_limit: number;
  ui_list_limit: number;
  password_rule_custom?: boolean;
  password_hint?: string;
  /** dmart 1.7.9+. */
  username_rule_custom?: boolean;
  /** dmart 1.7.9+. */
  username_hint?: string;
}

export type ClientConfigResponse = {
  status: Status;
  error?: Error;
  attributes: ClientConfig;
};

/** The checks GET /managed/health/{health_type}/{space} can run. */
export enum HealthType {
  soft = "soft",
  hard = "hard",
  all = "all",
}

export type SpaceHealthResponse = {
  status: Status;
  error?: Error;
  attributes: {
    space_name: string;
    health_type: string;
    total_issues: number;
    checks: Array<{ name: string; count: number; samples: Array<unknown> }>;
  };
};

export type LoginResponseRecord = ApiResponseRecord & {
  attributes: {
    access_token: string;
    type: UserType;
    displayname: Translation;
  };
};

export type LoginResponse = ApiResponse & {
  records: Array<LoginResponseRecord>;
};

export type Permission = {
  allowed_actions: Array<ActionType>;
  conditions: Array<string>;
  restricted_fields: Array<any>;
  allowed_fields_values: Record<string, any>;
};

export enum Language {
  arabic = "arabic",
  english = "english",
  kurdish = "kurdish",
  french = "french",
  turkish = "turkish",
}

export type ProfileResponseRecord = ApiResponseRecord & {
  attributes: {
    email: string;
    displayname: Translation;
    type: string;
    language: Language;
    is_email_verified: boolean;
    is_msisdn_verified: boolean;
    force_password_change: boolean;
    /**
     * Deprecated by dmart in favour of GET /user/permissions
     * ({@link Dmart.getPermissions}), and absent once a server drops it.
     */
    permissions?: Record<string, Permission>;
  } & UserDirectoryFields;
};

/** GET /user/permissions: the caller's resolved permission map. */
export type PermissionsResponse = {
  status: Status;
  error?: Error;
  attributes?: { permissions?: Record<string, Permission> };
};

/**
 * A user's directory fields (dmart 1.6+): the mail address the deployment
 * hosts for them, the aliases that deliver into it, and the services they may
 * use. Distinct from `email`, the contact address. Set only through the
 * managed API; absent from servers that predate them.
 */
export type UserDirectoryFields = {
  mailbox?: string | null;
  mail_aliases?: string[];
  services?: string[];
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

export let headers: { [key: string]: string } = {
  "Content-type": "application/json",
  Authorization: "",
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
  attachments = "attachments",
  attachments_aggregation = "attachments_aggregation",
}

export enum SortType {
  ascending = "ascending",
  descending = "descending",
}

export enum JoinType {
  left = "left",
  right = "right",
  inner = "inner",
  outer = "outer",
}

/** @deprecated Use `SortType` instead. Will be removed in a future version. */
export const SortyType = SortType;
/** @deprecated Use `SortType` instead. Will be removed in a future version. */
export type SortyType = SortType;

// enum NotificationPriority {
//   high = "high",
//   medium = "medium",
//   low = "low"
// };

export type JoinQuery = {
  join_on: string; // comma-separated "left:right" pairs, e.g. "payload.body.customer:shortname"
  alias: string; // matched right records attach under attributes.join[alias]
  query: QueryRequest; // the right-side sub-query
  type?: JoinType; // join semantic; server default is left
};

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
  sort_type?: SortType;
  retrieve_json_payload?: boolean;
  retrieve_attachments?: boolean;
  retrieve_total?: boolean;
  /** @deprecated dmart ignores it (removed in 1.5.0). */
  validate_schema?: boolean;
  jq_filter?: string;
  exact_subpath?: boolean;
  /**
   * Leave it out for the server's default (`default_query_limit`, normally
   * 10). `-1` asks for `max_query_limit`.
   */
  limit?: number;
  offset?: number;
  aggregation_data?: AggregationType;
  join?: Array<JoinQuery>;
};

export enum RequestType {
  create = "create",
  update = "update",
  progress_ticket = "progress_ticket",
  delete = "delete",
  move = "move",
  updateACL = "update_acl",
  assign = "assign",
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
  reaction = "reaction",
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
  data_asset = "data_asset",
  lock = "lock",
  log = "log",
  reply = "reply",
  share = "share",
  integration = "integration",
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
  apk = "apk",
  csv = "csv",
  sqlite = "sqlite",
  parquet = "parquet",
  /** dmart 1.5.6+: an upload of unknown or octet-stream type. */
  binary = "binary",
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

export type Payload = {
  content_type: ContentType;
  schema_shortname?: string;
  checksum?: string;
  body: string | Record<string, any> | any;
  last_validated?: string;
  validation_status?: "valid" | "invalid";
};

export type MetaExtended = {
  email: string;
  msisdn: string;
  is_email_verified: boolean;
  is_msisdn_verified: boolean;
  force_password_change: boolean;
  password: string;
  workflow_shortname: string;
  state: string;
  is_open: boolean;
} & UserDirectoryFields;

export type ResponseEntry = MetaExtended & {
  uuid: string;
  shortname: string;
  subpath: string;
  is_active: boolean;
  displayname: Translation;
  description: Translation;
  tags: Array<string>;
  created_at: string;
  updated_at: string;
  owner_shortname: string;
  payload?: Payload;
  relationships?: any;
  attachments?: Record<string, unknown>;
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
    tags: Array<string>;
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

export type ActionRequestRecord = {
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

export type ApiQueryResponse = ApiResponse & {
  attributes: {
    total: number;
    returned: number;
    /**
     * Set when the server capped the count (QUERY_TOTAL_CAP): `total` is
     * then a lower bound, not the exact number of matches.
     */
    total_is_lower_bound?: boolean;
  };
};

/** POST /managed/csv?preview=1: what the export would hold. */
export type CsvPreviewResponse = ApiResponse & {
  attributes: {
    exported: number;
    limit: number;
    truncated: boolean;
    total?: number;
    total_is_lower_bound?: boolean;
    reason?: string;
    message: string;
  };
};

export interface CsvOptions {
  /** Ask what the CSV would hold instead of the CSV itself. */
  preview?: boolean;
}

export interface ResourcesFromCSVRequest {
    space_name: string,
    subpath: string,
    isUpdate?: boolean,
    /** Start at this row (1-based) of the file, to resume an upload. */
    firstRow?: number,
    resourceType: ResourceType,
    schema: string,
    payload: File,
}

export interface RetrieveEntryRequest {
    resource_type: ResourceType,
    space_name: string,
    subpath: string,
    shortname: string,
    retrieve_json_payload: boolean,
    retrieve_attachments: boolean,
    /** @deprecated dmart ignores it; no longer sent. */
    validate_schema?: boolean|null,
}

export interface UploadWithPayloadRequest {
    space_name: string,
    subpath: string,
    shortname: string,
    resource_type: ResourceType,
    payload_file: File,
    attributes?: Record<string, any> | null,
}

export interface GetChildrenRequest {
    space_name: string,
    subpath: string,
    search: string,
    limit: number|null,
    offset: number|null,
    restrict_types: Array<ResourceType>|null
}

export interface GetAttachmentURLRequest {
    resource_type: ResourceType,
    space_name: string,
    subpath: string,
    parent_shortname: string,
    shortname: string,
    ext: string | null,
}

export interface GetPayloadRequest {
    resource_type: ResourceType,
    space_name: string,
    subpath: string,
    shortname: string,
    schemaShortname: string | null,
    ext: string,
}

export interface ProgressTicketRequest {
    space_name: string,
    subpath: string,
    shortname: string,
    action: string,
    resolution?: string,
    comment?: string
}

export interface SubmitRequest {
    spaceName: string,
    schemaShortname: string,
    subpath: string,
    record: any,
    resourceType?: string,
    workflowShortname?: string,
}



