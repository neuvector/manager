import { DatePipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { Scanner } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { ScannersService } from '@services/scanners.service';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowSelectedEvent,
} from 'ag-grid-community';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import * as $ from 'jquery';
import { MultiClusterService } from '@services/multi-cluster.service';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-scanners-grid',
  templateUrl: './scanners-grid.component.html',
  styleUrls: ['./scanners-grid.component.scss'],
})
export class ScannersGridComponent implements OnInit, OnChanges, OnDestroy {
  private readonly $win;
  @Input() gridHeight: number = 200;
  @Input() resize!: boolean;
  @Input() isVisible: boolean = true;
  refreshing$ = new Subject();
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  selectedScannerSubject$ = new BehaviorSubject<Scanner | undefined>(undefined);
  selectedScanner: Observable<Scanner | undefined> =
    this.selectedScannerSubject$.asObservable();
  private switchClusterSubscription;

  get scannerCount() {
    return this.scannersService.scanners.length;
  }
  columnDefs: ColDef[] = [
    {
      headerName: this.tr.instant('dashboard.heading.CVE_DB_VERSION'),
      field: 'cvedb_version',
    },
    {
      headerName: this.tr.instant('registry.CVE_DB_DATE'),
      field: 'cvedb_create_time',
      cellRenderer: params =>
        this.datePipe.transform(params.value, 'MMM dd, y HH:mm:ss'),
      comparator: (valueA, valueB, nodeA, nodeB) =>
        Date.parse(nodeA.data.cvedb_create_time) -
        Date.parse(nodeB.data.cvedb_create_time),
    },
    {
      headerName: this.tr.instant('scan.gridHeader.SCANNED_WORKLOADS'),
      field: 'scanned_containers',
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-down"/>',
        sortDescending: '<em class="fa fa-sort-numeric-up"/>',
      },
    },
    {
      headerName: this.tr.instant('scan.gridHeader.SCANNED_NODES'),
      field: 'scanned_hosts',
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-down"/>',
        sortDescending: '<em class="fa fa-sort-numeric-up"/>',
      },
    },
    {
      headerName: this.tr.instant('scan.gridHeader.SCANNED_IMAGES'),
      field: 'scanned_images',
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-down"/>',
        sortDescending: '<em class="fa fa-sort-numeric-up"/>',
      },
    },
    {
      field: 'id',
      hide: true,
    },
    {
      field: 'server',
      hide: true,
    },
  ];

  constructor(
    public scannersService: ScannersService,
    private datePipe: DatePipe,
    private utils: UtilsService,
    private tr: TranslateService,
    private multiClusterService: MultiClusterService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      onRowSelected: params => this.onRowSelected(params),
      onGridReady: event => this.onGridReady(event),
    };
    this.getScanners();

    //refresh the page when it switched to a remote cluster
    this.switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this.switchClusterSubscription) {
      this.switchClusterSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resize && this.gridApi) {
      this.onResize();
    }
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.scannerCount;
  }

  refresh(): void {
    this.refreshing$.next(true);
    this.selectedScannerSubject$.next(undefined);
    this.getScanners();
  }

  onResize(): void {
    if (this.isVisible) this.gridApi.sizeColumnsToFit();
  }

  setDefaultSelection(): void {
    if (this.gridApi) {
      this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
    }
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.selectedScannerSubject$.next(params.data);
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.onResize();
    this.setDefaultSelection();
  }

  getScanners(): void {
    this.scannersService
      .getScanners()
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(res => {
        this.scannersService.scanners = res;
        this.filteredCount = this.scannersService.scanners.length;
      });
  }
}
