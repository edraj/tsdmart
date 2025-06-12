
export interface ITicketRequest {
  space_name: string;
  subpath: string;
  shortname: string;
  action: string; // TODO: find out all possible actions
  payload: ITicketPayload;
}

export interface ITicketPayload {
  resolution?: string | null;
  comment?: string | null;
}

