import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Audit } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { AuditRow, RiskReportsService } from '@services/risk-reports.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowValueChangedEvent,
  RowDataUpdatedEvent,
  IRowNode,
  IsFullWidthRowParams,
  PostSortRowsParams,
} from 'ag-grid-community';
import * as $ from 'jquery';
import { RiskReportGridCsvService } from './csv-generation/risk-report-grid-csv.service';
import { RiskReportGridFilterComponent } from './risk-report-grid-filter/risk-report-grid-filter.component';
import { RiskReportGridLevelCellComponent } from './risk-report-grid-level-cell/risk-report-grid-level-cell.component';
import { RiskReportGridLocationCellComponent } from './risk-report-grid-location-cell/risk-report-grid-location-cell.component';
import { RiskReportGridMessageCellComponent } from './risk-report-grid-message-cell/risk-report-grid-message-cell.component';
import { RiskReportGridNameCellComponent } from './risk-report-grid-name-cell/risk-report-grid-name-cell.component';
import {
  FilterCategory,
  FilterLevel,
  RiskReportGridFilterService,
} from './risk-report-grid.filter.service';


@Component({
  standalone: false,
  selector: 'app-risk-report-grid',
  templateUrl: './risk-report-grid.component.html',
  styleUrls: ['./risk-report-grid.component.scss'],
  
})
export class RiskReportGridComponent implements OnInit {
  private readonly $win;
  @Input() gridHeight: number = 400;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filteredCount = 0;
  filtered$ = this.riskReportGridFilterService.filtered$;
  advFilter: any = this.riskReportGridFilterService.advFilter;
  filterDialog!: MatDialogRef<any>;
  filterOpen = false;
  get reportsCount() {
    return this.riskReportsService.riskReports.length;
  }
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('threat.gridHeader.NAME'),
      field: 'name',
      cellRenderer: 'nameCellRenderer',
      width: 230,
    },
    {
      headerName: this.tr.instant('audit.gridHeader.LEVEL'),
      field: 'level',
      cellRenderer: 'levelCellRenderer',
      width: 95,
      minWidth: 95,
    },
    {
      headerName: this.tr.instant('general.LOCATION'),
      cellRenderer: 'locationCellRenderer',
      comparator: (value1, value2, node1, node2) =>
        node1.data.reported_at.localeCompare(node2.data.reported_at),
      width: 660,
    },
    {
      headerName: this.tr.instant('threat.gridHeader.TIME'),
      field: 'reported_at',
      cellRenderer: params =>
        this.datePipe.transform(params.value, 'MMM dd, y HH:mm:ss'),
      comparator: (value1, value2, node1, node2) =>
        Date.parse(node1.data.reported_at) - Date.parse(node2.data.reported_at),
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-down"/>',
        sortDescending: '<em class="fa fa-sort-numeric-up"/>',
      },
      minWidth: 160,
      maxWidth: 170,
    },
    {
      headerName: 'Workload Domain',
      field: 'workload_domain',
      hide: true,
    },
    {
      headerName: 'Workload Name',
      field: 'workload_name',
      hide: true,
    },
    {
      headerName: 'Host Name',
      field: 'host_name',
      hide: true,
    },
    {
      headerName: 'Registry',
      field: 'registry',
      hide: true,
    },
    {
      headerName: 'Workload Image',
      field: 'workload_image',
      hide: true,
    },
    {
      headerName: 'Repository',
      field: 'repository',
      hide: true,
    },
    {
      headerName: 'Tag',
      field: 'tag',
      hide: true,
    },
    {
      headerName: 'Platform',
      field: 'platform',
      hide: true,
    },
    {
      headerName: 'Platform Version',
      field: 'platform_version',
      hide: true,
    },
  ];
  autoComplete!: {
    domain: string[];
    host: string[];
    container: string[];
    image: string[];
  };

  constructor(
    public riskReportsService: RiskReportsService,
    private riskReportGridFilterService: RiskReportGridFilterService,
    private riskReportGridCsvService: RiskReportGridCsvService,
    public dialog: MatDialog,
    private datePipe: DatePipe,
    private utils: UtilsService,
    private tr: TranslateService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      defaultColDef: {
        ...this.gridOptions.defaultColDef,
        cellClass: ['d-flex', 'align-items-center'],
      },
      getRowId: params => params.data.id,
      getRowHeight: params => (!this.isParent(params.node) ? 110 : 90),
      postSortRows: this.postSortRows.bind(this),
      onGridReady: this.onGridReady.bind(this),
      onRowDataUpdated: this.onRowDataUpdated.bind(this),
      isExternalFilterPresent: () => true,
      isFullWidthRow: (params: IsFullWidthRowParams<any, any>) =>
        !this.isParent(params.rowNode),
      fullWidthCellRenderer: 'messageCellRenderer',
      fullWidthCellRendererParams: {
        exportBenchCSV: this.exportBenchCSV.bind(this),
        exportCVECSV: this.exportCVECSV.bind(this),
      },
      rowClassRules: {
        'nv-full-width-row': params => !this.isParent(params.node),
      },
      doesExternalFilterPass: ({ data }) =>
        this.isVisible(data) && this.doesExternalFilterPass(data),
      suppressMaintainUnsortedOrder: true,
      suppressScrollOnNewData: true,
      components: {
        nameCellRenderer: RiskReportGridNameCellComponent,
        levelCellRenderer: RiskReportGridLevelCellComponent,
        locationCellRenderer: RiskReportGridLocationCellComponent,
        messageCellRenderer: RiskReportGridMessageCellComponent,
      },
    };
    this.riskReportGridFilterService.resetFilter();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onRowDataUpdated(event: RowDataUpdatedEvent) {
    this.refreshAutoCompleteData();
    event.api.refreshCells({
      force: true,
      columns: ['name'],
    });
  }

  exportCSV(): void {
    let reports4Csv = [] as any;
    this.gridApi.forEachNodeAfterFilterAndSort(node => {
      if (!node.data.parent_id) {
        reports4Csv.push(node.data);
      }
    });
    this.riskReportGridCsvService.exportCSV(reports4Csv);
  }

  exportBenchCSV(audit: AuditRow) {
    this.riskReportGridCsvService.exportBenchCSV(audit);
  }

  exportCVECSV(audit: AuditRow) {
    this.riskReportGridCsvService.exportCVECSV(audit);
  }

  refreshAutoCompleteData() {
    this.autoComplete = {
      domain: this.getAutoCompleteData(r => r.workload_domain),
      host: this.getAutoCompleteData(r => r.host_name),
      container: this.getAutoCompleteData(r => r.workload_name),
      image: this.getAutoCompleteData(r => r.workload_image),
    };
  }

  getAutoCompleteData(cb: (r: Audit) => any): string[] {
    return Array.from(
      new Set(this.riskReportsService.riskReports.map(e => cb(e)))
    )
      .filter(s => !!s)
      .sort();
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  doesExternalFilterPass(audit: AuditRow) {
    if (!this.riskReportGridFilterService.isAdvFilterOn()) return true;
    else {
      return this.riskReportGridFilterService.filterFn(audit);
    }
  }

  postSortRows(params: PostSortRowsParams<any, any>): void {
    let lastParentIdx = -1;
    for (let i = 0; i < params.nodes.length; i++) {
      const pid = params.nodes[i].data.parent_id;
      if (pid) {
        const pidx = params.nodes.findIndex(node => node.data.id === pid);
        if (lastParentIdx !== pidx) {
          params.nodes.splice(pidx + 1, 0, params.nodes.splice(i, 1)[0]);
          if (pidx > i) {
            i--;
          }
        }
      } else {
        lastParentIdx = i;
      }
    }
  }

  openAdvancedFilter(): void {
    if (!this.filterOpen) {
      this.filterOpen = true;
      this.filterDialog = this.dialog.open(RiskReportGridFilterComponent, {
        width: '675px',
        data: {
          filter: this.advFilter,
          domains: this.autoComplete.domain,
          hosts: this.autoComplete.host,
          containers: this.autoComplete.container,
          images: this.autoComplete.image,
        },
        hasBackdrop: false,
        position: { right: '25px', top: '80px' },
      });
      this.filterDialog.afterClosed().subscribe(filter => {
        console.log(filter);
        if (filter && filter.reset) {
          this.riskReportGridFilterService.resetFilter();
          this.setAdvancedFilter();
        } else if (filter) {
          filter.level = this.getLevels(filter.level);
          filter.category = this.getCategories(filter.category);
          this.setAdvancedFilter(filter);
        }
        this.filterOpen = false;
      });
    }
  }

  setAdvancedFilter(filter?: any) {
    if (filter) {
      this.riskReportGridFilterService.advFilter = filter;
    }
    this.advFilter = this.riskReportGridFilterService.advFilter;
    this.gridApi.onFilterChanged();
    this.filterCountChanged(
      this.gridApi
        .getModel()
        ['rootNode'].childrenAfterFilter.filter(n => this.isParent(n)).length
    );
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.riskReportGridFilterService.filtered =
      this.filteredCount !== this.reportsCount;
  }

  isParent(node: IRowNode) {
    return !node.data.parent_id;
  }

  isVisible(audit: AuditRow): boolean {
    return !audit.parent_id || audit.visible;
  }

  private getLevels(levels: boolean[]) {
    let _levels = [] as any;
    levels.forEach((l, idx) => {
      if (l) _levels.push(Object.values(FilterLevel)[idx]);
    });
    return _levels;
  }

  private getCategories(categories: boolean[]) {
    let _categories = [] as any;
    categories.forEach((c, idx) => {
      if (c) _categories.push(Object.values(FilterCategory)[idx]);
    });
    return _categories;
  }
}
