import { GridApi, IGetRowsParams } from 'ag-grid-community';
import { Observable } from 'rxjs';

export interface RemoteGridApi {
  getData: (params: IGetRowsParams) => Observable<{ data; totalRecords }>;
  getDataError?: (err) => void;
  gridApi: GridApi;
}
