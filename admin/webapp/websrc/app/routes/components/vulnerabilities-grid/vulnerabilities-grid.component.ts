import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowClassRules,
  ValueFormatterParams,
} from 'ag-grid-community';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { VulnerabilitiesGridSeverityCellComponent } from '@components/vulnerabilities-grid/vulnerabilities-grid-severity-cell/vulnerabilities-grid-severity-cell.component';
import { TranslateService } from '@ngx-translate/core';
import * as $ from 'jquery';
import { GlobalVariable } from '@common/variables/global.variable';
import { UtilsService } from '@common/utils/app.utils';
import {
  FEED_RATING_SORT_ORDER,
  capitalizeWord,
} from '@common/utils/common.utils';
import { VulnerabilityItemsTableScoreCellComponent } from '@routes/vulnerabilities/vulnerability-items/vulnerability-items-table/vulnerability-items-table-score-cell/vulnerability-items-table-score-cell.component';

@Component({
  standalone: false,
  selector: 'app-vulnerabilities-grid',
  templateUrl: './vulnerabilities-grid.component.html',
  styleUrls: ['./vulnerabilities-grid.component.scss'],
})
export class VulnerabilitiesGridComponent implements OnInit, OnChanges {
  private readonly $win;
  @Output() vulnerabilitySelected = new EventEmitter();
  @Input() tableHeight!: string;
  @Input() resize!: boolean;
  @Input() useQuickFilterService!: boolean;
  @Input() preselect: boolean = true;
  @Input() rowData;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  rowClassRules: RowClassRules = {
    'accepted-vulnerability': params => {
      return (
        params.data?.tags && params.data?.tags.some(tag => tag === 'accepted')
      );
    },
  };
  columnDefs: ColDef[] = [
    {
      field: 'name',
      headerValueGetter: () => this.translate.instant('scan.gridHeader.NAME'),
    },
    {
      field: 'severity',
      cellRenderer: 'severityCellRenderer',
      cellClass: ['d-flex', 'align-items-center'],
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.SEVERITY'),
      width: 130,
    },
    {
      field: 'score',
      hide: true,
      sortable: true,
      resizable: true,
      cellRenderer: 'scoreCellRenderer',
      cellRendererParams: {
        type: 'V2',
      },
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.SCORE_V2'),
      width: 140,
      maxWidth: 140,
      minWidth: 140,
    },
    {
      field: 'score_v3',
      sortable: true,
      resizable: true,
      cellRenderer: 'scoreCellRenderer',
      cellRendererParams: {
        type: 'V3',
      },
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.SCORE_V3'),
      width: 140,
      maxWidth: 140,
      minWidth: 140,
    },
    {
      field: 'feed_rating',
      cellClass: ['d-flex', 'align-items-center'],
      comparator: (value1, value2, node1, node2) => {
        return (
          FEED_RATING_SORT_ORDER.indexOf(node2.data.feed_rating.toLowerCase()) -
          FEED_RATING_SORT_ORDER.indexOf(node1.data.feed_rating.toLowerCase())
        );
      },
      valueFormatter: params =>
        capitalizeWord(params.data.feed_rating.toLowerCase()),
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.FEED_RATING'),
      icons: {
        sortAscending: '<em class="fa fa-sort-amount-down"></em>',
        sortDescending: '<em class="fa fa-sort-amount-up"></em>',
      },
      width: 150,
    },
    {
      field: 'file_name',
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.FILE_NAME'),
    },
    {
      field: 'package_name',
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.PACKAGE_NAME'),
    },
    {
      field: 'package_version',
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.VERSION'),
    },
    {
      field: 'fixed_version',
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.FIXED_BY'),
    },
    {
      field: 'published_timestamp',
      valueFormatter: this.dateFormatter,
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.PUBLISHED_TIME'),
    },
  ];

  constructor(
    private quickFilterService: QuickFilterService,
    private utils: UtilsService,
    private translate: TranslateService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      rowData: this.rowData,
      rowClassRules: this.rowClassRules,
      suppressDragLeaveHidesColumns: true,
      onGridReady: event => this.onGridReady(event),
      onSelectionChanged: event => this.onSelectionChanged(event),
      components: {
        severityCellRenderer: VulnerabilitiesGridSeverityCellComponent,
        scoreCellRenderer: VulnerabilityItemsTableScoreCellComponent,
      },
    };
  }

  onSelectionChanged(params: GridReadyEvent): void {
    const data = params.api.getSelectedNodes()[0]?.data;
    if (data) this.vulnerabilitySelected.emit(data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resize && this.gridApi) {
      this.onResize();
    }
    if (changes.rowData && this.gridApi) {
      console.log('row data changed');
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
      if (this.preselect) {
        this.gridApi.forEachNode(node =>
          node.rowIndex ? 0 : node.setSelected(true)
        );
      }
      if (this.gridApi.getSelectedNodes()[0]) {
        const selected = this.gridApi.getSelectedNodes()[0].data;
        this.vulnerabilitySelected.emit(selected);
      } else {
        this.vulnerabilitySelected.emit();
      }
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
    if (this.preselect) {
      this.gridApi.forEachNode(node =>
        node.rowIndex ? 0 : node.setSelected(true)
      );
    }
    if (this.rowData) {
      this.gridApi.setGridOption('rowData', this.rowData);
    }
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  dateFormatter(params: ValueFormatterParams): string {
    const date = new Date(params.data.published_timestamp * 1000);
    const dateString = date.toDateString().split(' ').slice(1);
    dateString[1] = dateString[1] + ',';
    return dateString.join(' ');
  }
}
