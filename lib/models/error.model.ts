import { IAttributes, IResponse } from './record.model';



export interface IClientError {
  code: string,
  status: string,
  message: string,
  request?: {
    url: string,
    method: string;
  },
  response: IResponse<IAttributes>;
}

export type Error = {
  type: string;
  code: number;
  message: string;
  info: any;
};
