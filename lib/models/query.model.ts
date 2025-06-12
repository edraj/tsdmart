

export type typeScope = 'managed' | 'public';

export enum EnumQueryType {
  aggregation = 'aggregation',
  search = 'search',
  subpath = 'subpath',
  events = 'events',
  history = 'history',
  tags = 'tags',
  spaces = 'spaces',
  counters = 'counters',
  reports = 'reports',
  attachments = 'attachments',
  attachments_aggregation = 'attachments_aggregation',
}


export enum EnumStatus {
  success = 'success',
  failed = 'failed',
}


export enum EnumResourceType {
  user = 'user',
  group = 'group',
  folder = 'folder',
  schema = 'schema',
  content = 'content',
  acl = 'acl',
  comment = 'comment',
  reaction = 'reaction',
  media = 'media',
  locator = 'locator',
  relationship = 'relationship',
  alteration = 'alteration',
  history = 'history',
  space = 'space',
  branch = 'branch',
  permission = 'permission',
  role = 'role',
  ticket = 'ticket',
  json = 'json',
  post = 'post',
  plugin_wrapper = 'plugin_wrapper',
  notification = 'notification',
  jsonl = 'jsonl',
  csv = 'csv',
  sqlite = 'sqlite',
  parquet = 'parquet',
}
export enum EnumRequestType {
  create = 'create',
  update = 'update',
  replace = 'replace',
  delete = 'delete',
  move = 'move',
  updateACL = 'update_acl',
  assign = 'assign',
}

// not used
// type TAttachment = 'json' |
//   'comment' |
//   'media' |
//   'relationship' |
//   'alteration' |
//   'csv' |
//   'parquet' |
//   'jsonl' |
//   'sqlite';



export enum EnumContentType {
  text = 'text',
  html = 'html',
  markdown = 'markdown',
  json = 'json',
  image = 'image',
  python = 'python',
  pdf = 'pdf',
  audio = 'audio',
  video = 'video',
  jsonl = 'jsonl',
  csv = 'csv',
  sqlite = 'sqlite',
  parquet = 'parquet',
}


export enum EnumSort {
  ascending = 'ascending',
  descending = 'descending',
}

export interface IAggregationType {
  load: Array<string>;
  group_by: Array<string>;
  reducers: Array<{
    name: string;
    alias: string;
    args: Array<string>;
  }> | Array<string>;
};

export interface IQueryRequest {
  type: EnumQueryType;
  space_name: string;
  subpath: string;
  search: string;
  filter_types?: Array<EnumResourceType>;
  filter_schema_names?: Array<string>;
  filter_shortnames?: Array<string>;
  from_date?: string;
  to_date?: string;
  sort_by?: string; // nothing?
  sort_type?: EnumSort;
  retrieve_json_payload?: boolean;
  retrieve_attachments?: boolean;
  validate_schema?: boolean;
  jq_filter?: string;
  exact_subpath?: boolean;
  limit?: number;
  offset?: number;
  aggregation_data?: IAggregationType;
};
