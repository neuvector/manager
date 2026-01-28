import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EventItem } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { EventRow, EventsService } from '@services/events.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  IRowNode,
  PostSortRowsParams,
  IsFullWidthRowParams,
} from 'ag-grid-community';
import * as $ from 'jquery';
import { EventsGridCsvService } from './csv-generation/events-grid-csv.service';
import { EventsGridFilterComponent } from './events-grid-filter/events-grid-filter.component';
import { EventsGridLevelCellComponent } from './events-grid-level-cell/events-grid-level-cell.component';
import { EventsGridLocationCellComponent } from './events-grid-location-cell/events-grid-location-cell.component';
import { EventsGridMessageCellComponent } from './events-grid-message-cell/events-grid-message-cell.component';
import { EventsGridNameCellComponent } from './events-grid-name-cell/events-grid-name-cell.component';
import { EventsGridUserCellComponent } from './events-grid-user-cell/events-grid-user-cell.component';
import {
  EventsGridFilterService,
  FilterLevel,
} from './events-grid.filter.service';

export const MIN_UNIT64 = 0;

@Component({
  standalone: false,
  selector: 'app-events-grid',
  templateUrl: './events-grid.component.html',
  styleUrls: ['./events-grid.component.scss'],
})
export class EventsGridComponent implements OnInit {
  private readonly $win;
  @Input() gridHeight: number = 400;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filteredCount = 0;
  filtered$ = this.eventsGridFilterService.filtered$;
  advFilter: any = this.eventsGridFilterService.advFilter;
  filterDialog!: MatDialogRef<any>;
  filterOpen = false;
  get eventsCount() {
    return this.eventsService.events.length;
  }
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('event.gridHeader.NAME'),
      field: 'name',
      cellRenderer: 'nameCellRenderer',
      width: 170,
    },
    {
      headerName: this.tr.instant('event.gridHeader.LEVEL'),
      field: 'level',
      cellRenderer: 'levelCellRenderer',
      width: 90,
      minWidth: 90,
    },
    {
      headerName: this.tr.instant('event.gridHeader.USER'),
      field: 'user',
      cellRenderer: 'userCellRenderer',
      width: 200,
    },
    {
      headerName: this.tr.instant('event.gridHeader.LOCATION'),
      cellRenderer: 'locationCellRenderer',
      comparator: (value1, value2, node1, node2) =>
        `${node1.data.host_name},${node1.data.workload_name},${node1.data.workload_domain},${node1.data.workload_image},${node1.data.controller_id},${node1.data.enforcer_name}`.localeCompare(
          `${node2.data.host_name},${node2.data.workload_name},${node2.data.workload_domain},${node2.data.workload_image},${node2.data.controller_id},${node2.data.enforcer_name}`
        ),
      width: 250,
    },
    {
      headerName: this.tr.instant('event.gridHeader.TIME'),
      field: 'reported_at',
      cellRenderer: params =>
        this.datePipe.transform(params.value, 'MMM dd, y HH:mm:ss'),
      comparator: (value1, value2, node1, node2) =>
        node1.data.reported_timestamp - node2.data.reported_timestamp,
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-down"/>',
        sortDescending: '<em class="fa fa-sort-numeric-up"/>',
      },
      minWidth: 160,
      maxWidth: 170,
    },
    {
      headerName: 'Host Name',
      field: 'host_name',
      hide: true,
    },
    {
      headerName: 'Workload Name',
      field: 'workload_name',
      hide: true,
    },
    {
      headerName: 'Workload Domain',
      field: 'workload_domain',
      hide: true,
    },
    {
      headerName: 'Workload Image',
      field: 'workload_image',
      hide: true,
    },
    {
      headerName: 'User',
      field: 'user',
      hide: true,
    },
    {
      headerName: 'User Roles',
      field: 'user_roles',
      hide: true,
    },
    {
      headerName: 'User Addr',
      field: 'user_addr',
      hide: true,
    },
    {
      headerName: 'Rest Method',
      field: 'rest_method',
      hide: true,
    },
    {
      headerName: 'Rest Request',
      field: 'rest_request',
      hide: true,
    },
    {
      headerName: 'Rest Body',
      field: 'rest_body',
      hide: true,
    },
  ];
  autoComplete!: {
    name: string[];
    userName: string[];
    domain: string[];
    host: string[];
    container: string[];
    image: string[];
  };

  constructor(
    public eventsService: EventsService,
    private eventsGridFilterService: EventsGridFilterService,
    private eventsGridCsvService: EventsGridCsvService,
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
      getRowHeight: params => (!this.isParent(params.node) ? 100 : 90),
      postSortRows: this.postSortRows.bind(this),
      onGridReady: this.onGridReady.bind(this),
      onRowDataUpdated: this.onRowDataUpdated.bind(this),
      isExternalFilterPresent: () => true,
      isFullWidthRow: (params: IsFullWidthRowParams<any, any>) =>
        !this.isParent(params.rowNode),
      fullWidthCellRenderer: 'messageCellRenderer',
      rowClassRules: {
        'nv-full-width-row': params => !this.isParent(params.node),
      },
      doesExternalFilterPass: ({ data }) =>
        this.isVisible(data) && this.doesExternalFilterPass(data),
      suppressMaintainUnsortedOrder: true,
      suppressScrollOnNewData: true,
      components: {
        nameCellRenderer: EventsGridNameCellComponent,
        levelCellRenderer: EventsGridLevelCellComponent,
        userCellRenderer: EventsGridUserCellComponent,
        locationCellRenderer: EventsGridLocationCellComponent,
        messageCellRenderer: EventsGridMessageCellComponent,
      },
    };
    this.eventsGridFilterService.resetFilter();
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
    let events4Csv = [] as any;
    this.gridApi.forEachNodeAfterFilterAndSort(node => {
      if (!node.data.parent_id) {
        events4Csv.push(node.data);
      }
    });
    this.eventsGridCsvService.exportCSV(events4Csv);
  }

  refreshAutoCompleteData() {
    this.autoComplete = {
      name: this.getAutoCompleteData(e => e.name),
      userName: this.getAutoCompleteData(e => e.user),
      domain: this.getAutoCompleteData(e => e.workload_domain),
      host: this.getAutoCompleteData(e => e.host_name),
      container: this.getAutoCompleteData(e => e.workload_name),
      image: this.getAutoCompleteData(e => e.workload_image),
    };
  }

  getAutoCompleteData(cb: (e: EventItem) => any): string[] {
    return Array.from(new Set(this.eventsService.events.map(e => cb(e))))
      .filter(s => !!s)
      .sort();
  }

  doesExternalFilterPass(event: EventRow) {
    if (!this.eventsGridFilterService.isAdvFilterOn()) return true;
    else {
      return this.eventsGridFilterService.filterFn(event);
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

  isVisible(event: EventRow): boolean {
    return !event.parent_id || event.visible;
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  openAdvancedFilter(): void {
    if (!this.filterOpen) {
      this.filterOpen = true;
      this.filterDialog = this.dialog.open(EventsGridFilterComponent, {
        width: '675px',
        data: {
          filter: this.advFilter,
          names: this.autoComplete.name,
          userNames: this.autoComplete.userName,
          domains: this.autoComplete.domain,
          hosts: this.autoComplete.host,
          containers: this.autoComplete.container,
          images: this.autoComplete.image,
        },
        hasBackdrop: false,
        position: { right: '25px', top: '80px' },
      });

      this.filterDialog.afterClosed().subscribe(filter => {
        if (filter && filter.reset) {
          this.eventsGridFilterService.resetFilter();
          this.setAdvancedFilter();
        } else if (filter) {
          filter.level = this.getLevels(filter.level);
          this.setAdvancedFilter(filter);
        }
        this.filterOpen = false;
      });
    }
  }

  setAdvancedFilter(filter?: any) {
    if (filter) {
      this.eventsGridFilterService.advFilter = filter;
    }
    this.advFilter = this.eventsGridFilterService.advFilter;
    this.gridApi.onFilterChanged();
    this.filterCountChanged(
      this.gridApi
        .getModel()
        ['rootNode'].childrenAfterFilter.filter(n => this.isParent(n)).length
    );
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.eventsGridFilterService.filtered =
      this.filteredCount !== this.eventsCount;
  }

  isParent(node: IRowNode) {
    return !node.data.parent_id;
  }

  private getLevels(levels: boolean[]) {
    let _levels = [] as any;
    levels.forEach((l, idx) => {
      if (l) _levels.push(Object.values(FilterLevel)[idx]);
    });
    return _levels;
  }
}
