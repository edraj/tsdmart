export enum Status {
  success = "success",
  failed = "failed",
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
  kd: string;
};

export enum UserType {
  web = "web",
  mobile = "mobile",
  bot = "bot",
}

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
  allowed_fields_values: Map<string, any>;
};

export enum Language {
  arabic = "arabic",
  english = "engligh",
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

export type Payload = {
  content_type: ContentType;
  schema_shortname?: string;
  checksum: string;
  body: string | Record<string, any> | any;
  last_validated: string;
  validation_status: "valid" | "invalid";
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
  attributes: { total: number; returned: number };
};
