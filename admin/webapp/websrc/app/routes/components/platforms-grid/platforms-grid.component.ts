import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { Platform } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { PlatformsService } from '@services/platforms.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import { BehaviorSubject, Observable } from 'rxjs';
import { PlatformsGridStatusCellComponent } from './platforms-grid-status-cell/platforms-grid-status-cell.component';

@Component({
  standalone: false,
  selector: 'app-platforms-grid',
  templateUrl: './platforms-grid.component.html',
  styleUrls: ['./platforms-grid.component.scss'],
})
export class PlatformsGridComponent implements OnInit {
  private readonly $win;
  @Input() gridHeight: number = 200;
  @Input() isScanAuthorized!: boolean;
  @Output() scan = new EventEmitter<Platform>();
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  selectedPlatformSubject$ = new BehaviorSubject<Platform | undefined>(
    undefined
  );
  selectedPlatform$: Observable<Platform | undefined> =
    this.selectedPlatformSubject$.asObservable();
  get platformsCount() {
    return this.platformsService.platforms.length;
  }
  get isRemote() {
    return GlobalVariable.isRemote;
  }
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('scan.gridHeader.NAME'),
      field: 'platform',
    },
    {
      headerName: this.tr.instant('scan.gridHeader.VERSION'),
      cellRenderer: params => {
        const platform = params.data.platform.toLowerCase();
        if (platform.includes(GlobalConstant.KUBE)) {
          if (platform.includes(GlobalConstant.OC)) {
            return params.data.openshift_version;
          } else {
            return params.data.kube_version;
          }
        }
      },
      getQuickFilterText: params => {
        const platform = params.data.platform.toLowerCase();
        if (platform.includes(GlobalConstant.KUBE)) {
          if (platform.includes(GlobalConstant.OC)) {
            return 'openshift_version';
          } else {
            return 'kube_version';
          }
        }
        return '';
      },
    },
    {
      headerName: this.tr.instant('scan.gridHeader.STATUS'),
      field: 'status',
      cellRenderer: 'statusCellRenderer',
      width: 100,
      minWidth: 100,
    },
    {
      headerName: this.tr.instant('scan.gridHeader.HIGH'),
      field: 'high',
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
      field: 'medium',
      icons: {
        sortAscending: '<em class="fa fa-sort-amount-down"></em>',
        sortDescending: '<em class="fa fa-sort-amount-up"></em>',
      },
      width: 80,
      minWidth: 80,
    },
    {
      headerName: this.tr.instant('scan.gridHeader.TIME'),
      field: 'scanned_at',
      cellRenderer: params => {
        return this.datePipe.transform(params.value, 'MMM dd, y HH:mm:ss');
      },
      comparator: (value1, value2, node1, node2) => {
        const n1_at = node1.data.scanned_at,
          n2_at = node2.data.scanned_at;
        if (!n1_at || !n2_at) return (n1_at ? -100 : 0) + (n2_at ? 100 : 0);
        return node1.data.scanned_timestamp - node2.data.scanned_timestamp;
      },
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-down"/>',
        sortDescending: '<em class="fa fa-sort-numeric-up"/>',
      },
      width: 160,
      minWidth: 160,
    },
  ];

  constructor(
    public platformsService: PlatformsService,
    private utils: UtilsService,
    private datePipe: DatePipe,
    private tr: TranslateService
  ) {}

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      getRowId: params => params.data.platform,
      onGridReady: this.onGridReady.bind(this),
      onRowSelected: this.onRowSelected.bind(this),
      onRowDataUpdated: this.onRowDataUpdated.bind(this),
      components: {
        statusCellRenderer: PlatformsGridStatusCellComponent,
      },
    };
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.selectedPlatformSubject$.next(params.data);
    }
  }

  onRowDataUpdated(event: RowDataUpdatedEvent) {
    const selected = this.selectedPlatformSubject$.value,
      platform = selected
        ? event.api.getRowNode(selected.platform)
        : event.api.getDisplayedRowAtIndex(0);
    platform?.setSelected(true);
    setTimeout(() => {
      this.gridApi.ensureNodeVisible(platform, 'middle');
    }, 200);
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.platformsCount;
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
