import {
  ChangeDetectionStrategy,
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
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import { LayersTableCvesCellComponent } from './layers-table-cves-cell/layers-table-cves-cell.component';
import { TranslateService } from '@ngx-translate/core';
import { shortenString } from '@common/utils/common.utils';

@Component({
  standalone: false,
  selector: 'app-layers-table',
  templateUrl: './layers-table.component.html',
  styleUrls: ['./layers-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersTableComponent implements OnInit, OnChanges {
  @Output() layerSelected = new EventEmitter();
  @Input() resize!: boolean;
  @Input() rowData;
  gridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'digest',
      valueFormatter: this.digestFormatter.bind(this),
      tooltipField: 'digest',
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.DIGEST'),
    },
    {
      field: 'cves',
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.CVES'),
      cellRenderer: 'cvesCellRenderer',
    },
    {
      field: 'size',
      valueFormatter: this.sizeFormatter.bind(this),
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.SIZE'),
    },
  ];

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.gridOptions = {
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      tooltipShowDelay: 0,
      enableBrowserTooltips: true,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      onGridReady: event => this.onGridReady(event),
      onSelectionChanged: event => this.onSelectionChanged(event),
      components: { cvesCellRenderer: LayersTableCvesCellComponent },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
  }

  onSelectionChanged(params: GridReadyEvent): void {
    const data = params.api.getSelectedNodes()[0].data;
    this.layerSelected.emit(data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resize && this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
    if (changes.rowData && this.gridApi) {
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
      this.gridApi.forEachNode(node =>
        node.rowIndex ? 0 : node.setSelected(true)
      );
    }
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  digestFormatter(params: ValueFormatterParams): string {
    let digest: string;
    if (params.node?.firstChild) {
      digest = shortenString(params.data.digest.substring(7), 15);
    } else if (params.node?.lastChild) {
      digest = `\u2517\u00A0${shortenString(
        params.data.digest.substring(7),
        15
      )}`;
    } else {
      digest = `\u2523\u00A0${shortenString(
        params.data.digest.substring(7),
        15
      )}`;
    }
    return digest;
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
}
