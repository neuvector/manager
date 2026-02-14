import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ValueFormatterParams,
  IGetRowsParams,
} from 'ag-grid-community';
import { Image, Summary, RemoteGridApi } from '@common/types';
import { RegistryDetailsVulnerabilitiesCellComponent } from './registry-details-vulnerabilities-cell/registry-details-vulnerabilities-cell.component';
import { RegistryDetailsDialogComponent } from './registry-details-dialog/registry-details-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { RegistryDetailsTableStatusCellComponent } from './registry-details-table-status-cell/registry-details-table-status-cell.component';
import { RegistriesService } from '@services/registries.service';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  tap,
  retry,
} from 'rxjs/operators';
import { MapConstant } from '@common/constants/map.constant';

@Component({
  standalone: false,
  selector: 'app-registry-details-table-all-view',
  templateUrl: './registry-details-table-all-view.component.html',
  styleUrls: ['./registry-details-table-all-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistryDetailsTableAllViewComponent
  implements OnInit, RemoteGridApi
{
  @Input() gridHeight!: number;
  @Input() selectedRegistry!: Summary;
  @Input() queryToken!: string;
  @Input() totalCount!: number;
  @Input() filter!: FormControl;
  @Input() linkedImage: string;
  @Input() linkedTag: string;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  remoteGridBinding = this;
  columnDefs: ColDef[] = [
    {
      field: '-',
      hide: true,
      lockVisible: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        newRowsAction: 'keep',
      },
    },
    {
      field: 'repository',
      colId: 'repository',
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.REPOSITORY'),
      valueGetter: params => {
        if (!params || !params.data) return '';
        return params.data.tag
          ? `${params.data.repository}:${params.data.tag}`
          : params.data.repository;
      },
      sortable: true,
    },
    {
      field: 'image_id',
      colId: 'imageid',
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.IMAGE_ID'),
      sortable: true,
    },
    {
      field: 'created_at',
      colId: 'createdat',
      valueFormatter: this.createdAtFormatter.bind(this),
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.CREATED_AT'),
      sortable: true,
    },
    {
      field: 'base_os',
      colId: 'os',
      headerValueGetter: () => this.translate.instant('scan.gridHeader.OS'),
      sortable: true,
    },
    {
      field: 'size',
      colId: 'size',
      valueFormatter: this.sizeFormatter.bind(this),
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.SIZE'),
      sortable: true,
    },
    {
      field: 'vulnerabilities',
      colId: 'cvecount',
      cellRenderer: 'vulnerabilitiesCellRenderer',
      comparator: (valueA, valueB, nodeA, nodeB) => {
        if (
          nodeA.data.high + nodeA.data.medium ===
          nodeB.data.high + nodeB.data.medium
        ) {
          return 0;
        }
        return nodeA.data.high + nodeA.data.medium >
          nodeB.data.high + nodeB.data.medium
          ? 1
          : -1;
      },
      sortable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.VUL'),
    },
    {
      field: 'status',
      cellRenderer: 'statusCellRenderer',
      headerValueGetter: () => this.translate.instant('scan.gridHeader.STATUS'),
    },
    {
      field: 'scanned_at',
      colId: 'scannedat',
      valueFormatter: this.scannedAtFormatter.bind(this),
      headerValueGetter: () => this.translate.instant('scan.gridHeader.TIME'),
      sortable: true,
    },
  ];

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private date: DatePipe,
    private registriesService: RegistriesService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('On all images view', this.queryToken);
    this.gridOptions = {
      defaultColDef: {
        resizable: true,
      },
      columnDefs: this.columnDefs,
      rowSelection: 'single',
      suppressDragLeaveHidesColumns: true,
      onGridReady: event => this.onGridReady(event),
      onRowClicked: event => this.onRowClicked(event),
      rowModelType: 'infinite',
      cacheBlockSize: MapConstant.PAGE.IMAGES * 3,
      paginationPageSize: MapConstant.PAGE.IMAGES,
      pagination: true,
      components: {
        vulnerabilitiesCellRenderer:
          RegistryDetailsVulnerabilitiesCellComponent,
        statusCellRenderer: RegistryDetailsTableStatusCellComponent,
      },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
    this.filter.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(filterText => {
        this.gridApi.setFilterModel({ '-': { filter: filterText } });
      });
  }

  onFirstDataRendered(params): void {
    setTimeout(() => {
      this.gridApi = params.api;
      this.gridApi.forEachNode(node =>
        node.rowIndex ? 0 : node.setSelected(true)
      );
    }, 2000);
  }

  getData(params: IGetRowsParams) {
    return this.registriesService
      .getAllScannedImages(
        this.queryToken,
        params.startRow,
        300,
        params.sortModel,
        params.filterModel
      )
      .pipe(
        tap(sessionData => {
          // this.vulnerabilitiesFilterService.qfCount =
          //   sessionData.qf_matched_records;
        }),
        map(sessionData => {
          return {
            data: sessionData.data.map(image => {
              image.status = 'finished';
              return image;
            }),
            totalRecords: sessionData.qf_matched_records,
            // totalRecords: this.filter.value
            //   ? this.vulnerabilitiesFilterService.qfCount
            //   : this.vulnerabilitiesFilterService.filteredCount,
          };
        }),
        retry(10)
      );
  }

  onRowClicked(params: GridReadyEvent): void {
    if (params.api.getSelectedNodes()[0].data.status === 'finished') {
      let selectedImage = params.api.getSelectedNodes()[0].data;
      if (!!this.selectedRegistry.isAllView) {
        this.selectedRegistry.name = selectedImage.reg_name;
      }
      this.openDialog(this.selectedRegistry, selectedImage);
    }
  }

  openDialog(selectedRegistry: Summary, image: Image): void {
    this.dialog.open(RegistryDetailsDialogComponent, {
      width: '90%',
      height: '90%',
      maxWidth: '1800px',
      data: {
        selectedRegistry,
        image,
      },
    });
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    setTimeout(() => {
      this.cd.markForCheck();
    }, 200);
  }

  createdAtFormatter(params: ValueFormatterParams): string {
    if (!params || !params.data) return '';
    const date = this.date.transform(
      params.data.created_at,
      'MMM dd, y HH:mm:ss'
    );
    return date ? date : '';
  }

  scannedAtFormatter(params: ValueFormatterParams): string {
    if (!params || !params.data) return '';
    const date = this.date.transform(
      params.data.scanned_at,
      'MMM dd, y HH:mm:ss'
    );
    return date ? date : '';
  }

  sizeFormatter(params: ValueFormatterParams): string {
    if (!params || !params.data) return '';
    return this.bytes(params.data.size);
  }

  bytes(bytes, precision?: number): string {
    if (bytes === 0) {
      return '';
    }
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
      return '-';
    }
    if (typeof precision === 'undefined') {
      precision = 1;
    }
    const units = ['', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const num = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = (bytes / Math.pow(1024, Math.floor(num))).toFixed(precision);
    return (
      (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) +
      ' ' +
      units[num]
    );
  }

  getImageData(imageList, image, tag) {
    return imageList.filter(
      _image => _image.repository === image && _image.tag === tag
    );
  }
}
