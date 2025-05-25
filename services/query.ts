import axios from 'axios';
import { ApiQueryResponse, QueryRequest, QueryType, SortyType, headers } from '../dmart.model';

export const query =  async (
    query: QueryRequest,
    scope: string = "managed"
  ): Promise<ApiQueryResponse | null> => {
    try {
      if (query.type != QueryType.spaces) {
        query.sort_type = query.sort_type || SortyType.ascending;
        query.sort_by = query.sort_by || "created_at";
      }
      query.subpath = query.subpath.replace(/\/+/g, "/");
      const { data } = await axios.post<ApiQueryResponse>(
        `${scope}/query`,
        query,
        { headers, timeout: 3000 }
      );
      return data;
    } catch (error: any) {
      throw error;
    }
  }