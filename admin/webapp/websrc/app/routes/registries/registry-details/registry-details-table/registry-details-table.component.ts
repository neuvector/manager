import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import { Image, Summary } from '@common/types';
import { RegistryDetailsVulnerabilitiesCellComponent } from './registry-details-vulnerabilities-cell/registry-details-vulnerabilities-cell.component';
import { RegistryDetailsDialogComponent } from './registry-details-dialog/registry-details-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { RegistryDetailsTableStatusCellComponent } from './registry-details-table-status-cell/registry-details-table-status-cell.component';
import { FormControl } from '@angular/forms';
import { MapConstant } from '@common/constants/map.constant';


@Component({
  standalone: false,
  selector: 'app-registry-details-table',
  templateUrl: './registry-details-table.component.html',
  styleUrls: ['./registry-details-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class RegistryDetailsTableComponent implements OnInit, OnChanges {
  @Input() gridHeight!: number;
  @Input() selectedRegistry!: Summary;
  @Input() rowData!: Image[];
  @Input() filter!: FormControl;
  @Input() linkedImage!: string;
  @Input() linkedTag!: string;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'repository',
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.REPOSITORY'),
      valueGetter: params =>
        params.data.tag
          ? `${params.data.repository}:${params.data.tag}`
          : params.data.repository,
    },
    {
      field: 'image_id',
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.IMAGE_ID'),
    },
    {
      field: 'created_at',
      valueFormatter: this.createdAtFormatter.bind(this),
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.CREATED_AT'),
    },
    {
      field: 'base_os',
      valueFormatter: params =>
        params.value || this.translate.instant('scan.message.OS_ERR'),
      headerValueGetter: () => this.translate.instant('scan.gridHeader.OS'),
    },
    {
      field: 'size',
      valueFormatter: this.sizeFormatter.bind(this),
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.SIZE'),
    },
    {
      field: 'vulnerabilities',
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
      valueFormatter: this.scannedAtFormatter.bind(this),
      headerValueGetter: () => this.translate.instant('scan.gridHeader.TIME'),
    },
  ];

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private date: DatePipe
  ) {}

  ngOnInit(): void {
    this.gridOptions = {
      defaultColDef: {
        sortable: true,
        resizable: true,
      },
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      rowSelection: 'single',
      cacheBlockSize: MapConstant.PAGE.IMAGES * 3,
      paginationPageSize: MapConstant.PAGE.IMAGES,
      pagination: true,
      suppressDragLeaveHidesColumns: true,
      onGridReady: event => this.onGridReady(event),
      onRowClicked: event => this.onRowClicked(event),
      components: {
        vulnerabilitiesCellRenderer:
          RegistryDetailsVulnerabilitiesCellComponent,
        statusCellRenderer: RegistryDetailsTableStatusCellComponent,
      },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
    this.filter.valueChanges.subscribe(val => this.gridApi.setQuickFilter(val));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridApi && changes.rowData?.currentValue) {
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
    }
  }

  onRowClicked(params: GridReadyEvent): void {
    if (params.api.getSelectedNodes()[0].data.status === 'finished') {
      this.openDialog(
        this.selectedRegistry,
        params.api.getSelectedNodes()[0].data
      );
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
    this.openImageDetailDialogByLinkedImage();
  }

  createdAtFormatter(params: ValueFormatterParams): string {
    const date = this.date.transform(
      params.data.created_at,
      'MMM dd, y HH:mm:ss'
    );
    return date ? date : '';
  }

  scannedAtFormatter(params: ValueFormatterParams): string {
    const date = this.date.transform(
      params.data.scanned_at,
      'MMM dd, y HH:mm:ss'
    );
    return date ? date : '';
  }

  sizeFormatter(params: ValueFormatterParams): string {
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

  openImageDetailDialogByLinkedImage() {
    let imageData = this.getImageData(
      this.rowData,
      this.linkedImage,
      this.linkedTag
    );
    if (
      Array.isArray(imageData) &&
      imageData[0] &&
      imageData[0].status === 'finished'
    ) {
      this.openDialog(this.selectedRegistry, imageData[0]);
    }
  }

  getImageData(imageList, image, tag) {
    return imageList.filter(
      _image => _image.repository === image && _image.tag === tag
    );
  }
}
