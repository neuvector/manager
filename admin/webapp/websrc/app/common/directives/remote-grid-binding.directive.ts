import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { RemoteGridApi } from '@common/types';
import { GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Directive({
  selector: '[remoteGridBinding]',
  standalone: false,
})
export class RemoteGridBindingDirective {
  @Input() remoteGridBinding!: RemoteGridApi;
  @Output() remoteGridReady = new EventEmitter();

  constructor() {}

  @HostListener('gridReady', ['$event'])
  gridReady(event: GridReadyEvent) {
    event.api.setGridOption('datasource', this.dataSource);
    this.remoteGridReady.emit(event);
  }

  handleError(err) {
    this.remoteGridBinding.getDataError?.(err);
    return EMPTY;
  }

  dataSource: IDatasource = {
    getRows: (params: IGetRowsParams) => {
      this.remoteGridBinding
        .getData(params)
        .pipe(
          tap(({ data, totalRecords }) => {
            params.successCallback(data, totalRecords);
          }),
          catchError(err => this.handleError(err))
        )
        .subscribe();
    },
  };
}
