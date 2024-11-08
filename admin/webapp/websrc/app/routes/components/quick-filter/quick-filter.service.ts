import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GridOptions, GridApi } from 'ag-grid-community';

@Injectable()
export class QuickFilterService {
  private textInputSubject$ = new BehaviorSubject<string>('');
  textInput$ = this.textInputSubject$.asObservable();

  setTextInput(str: string): void {
    this.textInputSubject$.next(str);
  }

  onFilterChange(
    filterStr: string,
    gridOptions: GridOptions,
    gridApi: GridApi
  ): void {
    if (gridOptions && gridApi) {
      gridApi.setGridOption('quickFilterText', filterStr);
    }
  }
}
