export interface PageResponse<T> {
  content: T[];
  page?: number;
  pageSize?: number;
  number?: number;
  size?: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}
