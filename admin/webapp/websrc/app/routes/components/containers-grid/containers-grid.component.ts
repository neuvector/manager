import { DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { TranslateService } from '@ngx-translate/core';
import { ContainersService, WorkloadRow } from '@services/containers.service';
import { VersionInfoService } from '@services/version-info.service';
import { GlobalConstant } from '@common/constants/global.constant';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  IRowNode,
  PostSortRowsParams,
  RowSelectedEvent,
} from 'ag-grid-community';
import * as $ from 'jquery';
import { BehaviorSubject, Observable } from 'rxjs';
import { ContainersGridNameCellComponent } from './containers-grid-name-cell/containers-grid-name-cell.component';
import { ContainersGridStateCellComponent } from './containers-grid-state-cell/containers-grid-state-cell.component';
import { ContainersGridStatusCellComponent } from './containers-grid-status-cell/containers-grid-status-cell.component';
import { QuickFilterComponent } from '@components/quick-filter/quick-filter.component';


@Component({
  standalone: false,
  selector: 'app-containers-grid',
  templateUrl: './containers-grid.component.html',
  styleUrls: ['./containers-grid.component.scss'],
  
})
export class ContainersGridComponent implements OnInit {
  private readonly $win;
  @Input() gridHeight: number = 200;
  @Input() useQuickFilterService: boolean = false;
  @Input() gridOnly: boolean = false;
  @Input() workloadV2: boolean = true;
  @Input() isScanAuthorized!: boolean;
  @Input() rowData!: Array<WorkloadRow>;
  @Input() isMemberData: boolean = false;
  @Input() source!: string;
  @Input() linkedContainer: string;
  @Output() scan = new EventEmitter<WorkloadRow>();
  @ViewChild(QuickFilterComponent) quickFilter!: QuickFilterComponent;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs!: ColDef[];
  filtered: boolean = false;
  filteredCount!: number;
  navSource = GlobalConstant.NAV_SOURCE;
  selectedContainerSubject$ = new BehaviorSubject<WorkloadRow | undefined>(
    undefined
  );
  selectedContainer$: Observable<WorkloadRow | undefined> =
    this.selectedContainerSubject$.asObservable();
  get containersCount() {
    return this.containersService.getDisplayParents(
      this.containersService.displayContainers
    ).length;
  }
  get cisLabel() {
    return this.utils.getCisLabel(this.versionInfoService.infoData);
  }
  get isRemote() {
    return GlobalVariable.isRemote;
  }

  constructor(
    public containersService: ContainersService,
    public versionInfoService: VersionInfoService,
    private quickFilterService: QuickFilterService,
    private utils: UtilsService,
    private tr: TranslateService,
    private datePipe: DatePipe
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.columnDefs = [
      {
        headerName: this.tr.instant('containers.detail.NAME'),
        field: 'brief.display_name',
        cellRenderer: 'nameCellRenderer',
        width: 160,
        minWidth: 160,
      },
      {
        headerName: this.tr.instant('containers.detail.NAME'),
        field: 'brief.name',
        hide: true,
      },
      {
        headerName: 'ID',
        field: 'brief.id',
        hide: !this.isMemberData,
      },
      {
        headerName: 'Parent ID',
        field: 'parent_id',
        hide: true,
      },
      {
        headerName: 'Child IDs',
        field: 'child_ids',
        hide: true,
      },
      {
        headerName: 'Child Data',
        field: 'child_data',
        hide: true,
        getQuickFilterText: params => {
          const { parent_data, child_data, ...data } = params.data;
          if (!parent_data && !child_data) {
            return '';
          }
          return child_data || JSON.stringify(data);
        },
      },
      {
        headerName: 'Parent Data',
        field: 'parent_data',
        hide: true,
        getQuickFilterText: params => {
          const { parent_data, child_data, ...data } = params.data;
          if (!parent_data && !child_data) {
            return '';
          }
          return parent_data || JSON.stringify(data);
        },
      },
      {
        headerName: this.tr.instant('group.gridHeader.DOMAIN'),
        field: 'brief.domain',
      },
      {
        headerName: this.tr.instant('containers.detail.HOST_NAME'),
        field: 'brief.host_name',
        hide: this.isMemberData,
      },
      {
        headerName: this.tr.instant('containers.detail.NETWORK_INTERFACES'),
        valueGetter: params =>
          this.containersService.getIps(params.data.rt_attributes.interfaces),
        hide: true,
      },
      {
        headerName: this.tr.instant('containers.detail.APPLICATIONS'),
        field: 'rt_attributes.applications',
        hide: this.isMemberData,
      },
      {
        headerName: this.tr.instant('containers.detail.STATE'),
        field: 'brief.state',
        cellRenderer: 'stateCellRenderer',
        width: 110,
        minWidth: 110,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.STATUS'),
        field: 'security.scan_summary.status',
        cellRenderer: 'statusCellRenderer',
        width: 110,
        minWidth: 110,
        hide: this.isMemberData,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.HIGH'),
        field: 'security.scan_summary.high',
        cellRenderer: params => {
          if (
            params.data.children &&
            params.data.children.length > 0 &&
            (params.data.security.scan_summary.hidden_high ||
              params.data.security.scan_summary.hidden_high === 0)
          ) {
            return `${params.value} (${params.data.security.scan_summary.hidden_high})`;
          } else {
            return params.value;
          }
        },
        sort: 'desc',
        comparator: (value1, value2, node1, node2) =>
          (node1.data.security.scan_summary.hidden_high || 0) -
          (node2.data.security.scan_summary.hidden_high || 0),
        icons: {
          sortAscending: '<em class="fa fa-sort-amount-down"></em>',
          sortDescending: '<em class="fa fa-sort-amount-up"></em>',
        },
        width: 80,
        maxWidth: 80,
        minWidth: 80,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.MEDIUM'),
        field: 'security.scan_summary.medium',
        cellRenderer: function (params) {
          if (
            params.data.children &&
            params.data.children.length > 0 &&
            (params.data.security.scan_summary.hidden_medium ||
              params.data.security.scan_summary.hidden_medium === 0)
          ) {
            return `${params.value} (${params.data.security.scan_summary.hidden_medium})`;
          } else {
            return params.value;
          }
        },
        comparator: (value1, value2, node1, node2) =>
          (node1.data.security.scan_summary.hidden_medium || 0) -
          (node2.data.security.scan_summary.hidden_medium || 0),
        icons: {
          sortAscending: '<em class="fa fa-sort-amount-down"></em>',
          sortDescending: '<em class="fa fa-sort-amount-up"></em>',
        },
        width: 90,
        minWidth: 90,
      },
      {
        headerName: this.tr.instant('scan.gridHeader.TIME'),
        field: 'security.scan_summary.scanned_at',
        cellRenderer: params =>
          this.datePipe.transform(params.value, 'MMM dd, y HH:mm:ss'),
        comparator: (value1, value2, node1, node2) =>
          node1.data.security.scan_summary.scanned_timestamp -
          node2.data.security.scan_summary.scanned_timestamp,
        icons: {
          sortAscending: '<em class="fa fa-sort-numeric-down"/>',
          sortDescending: '<em class="fa fa-sort-numeric-up"/>',
        },
        minWidth: 160,
        maxWidth: 170,
        hide: this.isMemberData,
      },
    ];

    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      getRowId: params => params.data.brief.id,
      postSortRows: this.postSortRows.bind(this),
      onGridReady: this.onGridReady.bind(this),
      onRowSelected: this.onRowSelected.bind(this),
      onRowDataUpdated: this.onRowDataUpdated.bind(this),
      isExternalFilterPresent: () => true,
      doesExternalFilterPass: this.isVisible.bind(this),
      suppressMaintainUnsortedOrder: true,
      suppressScrollOnNewData: true,
      components: {
        nameCellRenderer: ContainersGridNameCellComponent,
        stateCellRenderer: ContainersGridStateCellComponent,
        statusCellRenderer: ContainersGridStatusCellComponent,
      },
    };
    if (this.isMemberData) {
      this.containersService.displayContainers = this.rowData;
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
    if (this.linkedContainer) {
      this.gridApi.forEachNode((node, index) => {
        if (this.linkedContainer === node.data.brief.display_name) {
          node.setSelected(true);
          this.gridApi.ensureNodeVisible(node);
        }
      });
    }
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.selectedContainerSubject$.next(params.data);
    }
  }

  onRowDataUpdated(event: RowDataUpdatedEvent) {
    event.api.refreshCells({
      force: true,
      columns: ['brief.display_name'],
    });
    const selected = this.selectedContainerSubject$.value,
      node = selected
        ? event.api.getRowNode(selected.brief.id)
        : event.api.getDisplayedRowAtIndex(0);
    node?.setSelected(true);
    this.quickFilter?.onFilterChange(this.quickFilter.filter.value || '');
    setTimeout(() => {
      this.gridApi.ensureNodeVisible(node, 'middle');
    }, 200);
  }

  postSortRows(params: PostSortRowsParams<any, any>): void {
    // sort parents first
    params.nodes = params.nodes.sort((a, b) =>
      !a.data.parent_id ? -1 : !b.data.parent_id ? 1 : 0
    );
    for (let i = 0; i < params.nodes.length; i++) {
      const pid = params.nodes[i].data.parent_id;
      if (pid) {
        const pidx = params.nodes.findIndex(node => node.data.brief.id === pid);
        // splice child after parent
        params.nodes.splice(pidx + 1, 0, params.nodes.splice(i, 1)[0]);
      }
    }
  }

  isVisible(node: IRowNode): boolean {
    return !node.data.parent_id || node.data.visible;
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.containersCount;
  }

  quickFilterParents(node: IRowNode) {
    return !node.data.parent_id;
  }
}
