import {
  Component,
  Input,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { ProcessInfo } from '@common/types';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { ProcessGridActionCellComponent } from './process-grid-action-cell/process-grid-action-cell.component';
import * as $ from 'jquery';
import { GlobalVariable } from '@common/variables/global.variable';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  standalone: false,
  selector: 'app-process-grid',
  templateUrl: './process-grid.component.html',
  styleUrls: ['./process-grid.component.scss'],
})
export class ProcessGridComponent implements OnInit, OnChanges {
  private readonly $win;
  @Input() tableHeight!: string;
  @Input() resize!: boolean;
  @Input() useQuickFilterService!: boolean;
  @Input() rowData!: ProcessInfo[];
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'pid',
      headerValueGetter: () => this.tr.instant('containers.process.PID'),
    },
    {
      field: 'cmdline',
      headerValueGetter: () => this.tr.instant('containers.process.COMMAND'),
    },
    {
      field: 'user',
      headerValueGetter: () => this.tr.instant('containers.process.USER'),
      cellRenderer: params =>
        params.value === 'root'
          ? `<em class="fa fa-exclamation text-danger me-1"></em>${params.value}`
          : params.value,
      width: 80,
    },
    {
      field: 'status',
      headerValueGetter: () => this.tr.instant('containers.process.STATUS'),
    },
    {
      field: 'action',
      cellRenderer: 'actionCellRenderer',
      cellClass: ['d-flex', 'align-items-center'],
      headerValueGetter: () => this.tr.instant('policy.addPolicy.DENY_ALLOW'),
      width: 95,
    },
    {
      field: 'start_timestamp',
      cellRenderer: params => {
        if (params.value) {
          const date = new Date(params.value * 1000);
          return this.datePipe.transform(date, 'MMM dd, y HH:mm:ss');
        }
        return '';
      },
      headerValueGetter: () => this.tr.instant('containers.detail.STARTED_AT'),
      width: 200,
    },
  ];

  constructor(
    private quickFilterService: QuickFilterService,
    private utils: UtilsService,
    private tr: TranslateService,
    private datePipe: DatePipe
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      rowData: this.rowData,
      suppressDragLeaveHidesColumns: true,
      onGridReady: event => this.onGridReady(event),
      components: {
        actionCellRenderer: ProcessGridActionCellComponent,
      },
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resize && this.gridApi) {
      this.onResize();
    }
    if (changes.rowData && this.gridApi) {
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    if (this.useQuickFilterService) {
      this.quickFilterService.textInput$.subscribe((value: string) => {
        this.quickFilterService.onFilterChange(
          value,
          this.gridOptions,
          this.gridApi
        );
      });
    }
    this.gridApi.sizeColumnsToFit();
    if (this.rowData) {
      this.gridApi.setGridOption('rowData', this.rowData);
    }
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  dateFormatter(params: ValueFormatterParams): string {
    const date = new Date(params.data.start_timestamp * 1000);
    return this.datePipe.transform(date, 'MMM dd, y HH:mm:ss') || '';
  }
}
