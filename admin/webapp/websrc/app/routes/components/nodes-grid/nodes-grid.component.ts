import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Host } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { NodesService } from '@services/nodes.service';
import { VersionInfoService } from '@services/version-info.service';
import { GlobalConstant } from '@common/constants/global.constant';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import * as $ from 'jquery';
import { BehaviorSubject, Observable } from 'rxjs';
import { NodesGridStatusCellComponent } from './nodes-grid-status-cell/nodes-grid-status-cell.component';
import { NodesGridStateCellComponent } from './nodes-grid-state-cell/nodes-grid-state-cell.component';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';

@Component({
  standalone: false,
  selector: 'app-nodes-grid',
  templateUrl: './nodes-grid.component.html',
  styleUrls: ['./nodes-grid.component.scss'],
})
export class NodesGridComponent implements OnInit {
  private readonly $win;
  @Input() gridHeight: number = 200;
  @Input() isScanAuthorized!: boolean;
  @Input() gridOnly: boolean = false;
  @Input() isMemberData: boolean = false;
  @Input() rowData!: Array<Host>;
  @Input() source!: string;
  @Output() scan = new EventEmitter<Host>();
  @Input() useQuickFilterService: boolean = false;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  navSource = GlobalConstant.NAV_SOURCE;
  selectedNodeSubject$ = new BehaviorSubject<Host | undefined>(undefined);
  selectedNode$: Observable<Host | undefined> =
    this.selectedNodeSubject$.asObservable();
  get nodesCount() {
    return this.nodesService.nodes.length;
  }
  get cisLabel() {
    return this.utils.getCisLabel(this.versionInfoService.infoData);
  }
  get isRemote() {
    return GlobalVariable.isRemote;
  }
  columnDefs!: ColDef[];

  constructor(
    public nodesService: NodesService,
    public versionInfoService: VersionInfoService,
    public quickFilterService: QuickFilterService,
    private utils: UtilsService,
    private datePipe: DatePipe,
    private tr: TranslateService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.columnDefs = [
      {
        headerName: this.tr.instant('nodes.detail.NAME'),
        field: 'name',
        width: 80,
        minWidth: 80,
      },
      {
        headerName: 'ID',
        field: 'id',
        width: 80,
        minWidth: 80,
        hide: !this.isMemberData,
      },
      {
        headerName: this.tr.instant('containers.detail.STATE'),
        field: 'state',
        cellRenderer: 'stateCellRenderer',
        cellClass: ['d-flex', 'align-items-center', 'justify-content-center'],
        width: 90,
        minWidth: 90,
      },
      {
        headerName: this.tr.instant('nodes.detail.OS'),
        field: 'os',
        hide: this.isMemberData,
      },
      {
        headerName: this.tr.instant('nodes.detail.PLATFORM'),
        field: 'platform',
        hide: this.isMemberData,
      },
      {
        headerName: this.tr.instant('nodes.detail.NUM_OF_CONTAINERS'),
        field: 'containers',
        icons: {
          sortAscending: '<em class="fa fa-sort-amount-down"></em>',
          sortDescending: '<em class="fa fa-sort-amount-up"></em>',
        },
        hide: this.isMemberData,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.STATUS'),
        field: 'scan_summary.status',
        cellRenderer: 'statusCellRenderer',
        width: 100,
        minWidth: 100,
        hide: this.isMemberData,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.HIGH'),
        field: 'scan_summary.high',
        sort: 'desc',
        icons: {
          sortAscending: '<em class="fa fa-sort-amount-down"></em>',
          sortDescending: '<em class="fa fa-sort-amount-up"></em>',
        },
        width: 80,
        minWidth: 80,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.MEDIUM'),
        field: 'scan_summary.medium',
        icons: {
          sortAscending: '<em class="fa fa-sort-amount-down"></em>',
          sortDescending: '<em class="fa fa-sort-amount-up"></em>',
        },
        width: 80,
        minWidth: 80,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.TIME'),
        field: 'scan_summary.scanned_at',
        cellRenderer: params =>
          this.datePipe.transform(params.value, 'MMM dd, y HH:mm:ss'),
        comparator: (value1, value2, node1, node2) => {
          const n1_at = node1.data.scan_summary.scanned_at,
            n2_at = node2.data.scan_summary.scanned_at;
          if (!n1_at || !n2_at) return (n1_at ? -100 : 0) + (n2_at ? 100 : 0);
          return (
            node1.data.scan_summary.scanned_timestamp -
            node2.data.scan_summary.scanned_timestamp
          );
        },
        icons: {
          sortAscending: '<em class="fa fa-sort-numeric-down"/>',
          sortDescending: '<em class="fa fa-sort-numeric-up"/>',
        },
        width: 160,
        minWidth: 160,
        hide: this.isMemberData,
      },
    ];
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      getRowId: params => params.data.id,
      onGridReady: this.onGridReady.bind(this),
      onRowSelected: this.onRowSelected.bind(this),
      onRowDataUpdated: this.onRowDataUpdated.bind(this),
      components: {
        statusCellRenderer: NodesGridStatusCellComponent,
        stateCellRenderer: NodesGridStateCellComponent,
      },
    };
    if (this.isMemberData) {
      this.nodesService.nodes = this.rowData;
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
    this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.selectedNodeSubject$.next(params.data);
    }
  }

  onRowDataUpdated(event: RowDataUpdatedEvent) {
    const selected = this.selectedNodeSubject$.value,
      node = selected
        ? event.api.getRowNode(selected.id)
        : event.api.getDisplayedRowAtIndex(0);
    node?.setSelected(true);
    setTimeout(() => {
      this.gridApi.ensureNodeVisible(node, 'middle');
    }, 200);
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.nodesCount;
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
