export type ISODateString = string;
export type PaginatedResponse<T> = { data: T[]; total?: number; page?: number; limit?: number };
