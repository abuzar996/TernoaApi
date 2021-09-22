export interface CustomResponse<DataType> {
    totalCount?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    data: DataType[];
  }  