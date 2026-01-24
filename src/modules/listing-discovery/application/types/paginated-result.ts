export type PaginatedResult<T> = {
  items: T[];
  page: number;
  perPage: number;
  found?: number;
};
