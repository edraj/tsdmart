import { AxiosInstance } from 'axios';
import { Config } from '../config';
import { IRecordWithAttachment, IResponseList } from '../models/record.model';
import { ITicketPayload, ITicketRequest } from '../models/ticket.model';

export const progress_ticket = async (client: AxiosInstance, ticketReuest: ITicketRequest): Promise<IResponseList<IRecordWithAttachment>> => {

  const url = Config.API.ticket.progress
    .replace(':space', ticketReuest.space_name)
    .replace(':subpath', ticketReuest.subpath)
    .replace(':shortname', ticketReuest.shortname)
    .replace(':action', ticketReuest.action);

  const payload: ITicketPayload = {
    resolution: ticketReuest.payload?.resolution || null,
    comment: ticketReuest.payload?.comment || null
  };

  const { data } = await client.put<IResponseList<IRecordWithAttachment>>(
    url,
    payload
  );
  return data;
}
