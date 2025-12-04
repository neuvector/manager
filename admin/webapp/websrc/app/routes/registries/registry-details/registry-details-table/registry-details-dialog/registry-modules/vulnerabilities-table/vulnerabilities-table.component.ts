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
  GridReadyEvent,
  ValueFormatterParams,
} from 'ag-grid-community';
import { StatusCellComponent } from './status-cell/status-cell.component';
import { Vulnerability } from '@common/types';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-vulnerabilities-table',
  templateUrl: './vulnerabilities-table.component.html',
  styleUrls: ['./vulnerabilities-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VulnerabilitiesTableComponent implements OnInit, OnChanges {
  @Input() resize!: boolean;
  @Input() vulnerabilities!: Vulnerability[];
  @Input() rowData;
  gridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'name',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('role.permissions.VULNERABILITY'),
      width: 160,
      suppressSizeToFit: true,
    },
    {
      field: 'status',
      sortable: true,
      resizable: true,
      cellRenderer: 'statusCellRenderer',
      headerValueGetter: () => this.translate.instant('nodes.gridHeader.LEVEL'),
      width: 110,
      suppressSizeToFit: true,
    },
    {
      field: 'fixed-version',
      resizable: true,
      valueFormatter: this.fixedVersionFormatter.bind(this),
      headerValueGetter: () =>
        this.translate.instant('scan.gridHeader.FIXED_BY'),
    },
  ];

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.gridOptions = {
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      onGridReady: event => this.onGridReady(event),
      components: { statusCellRenderer: StatusCellComponent },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.resize && this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
    if (changes.rowData && this.gridApi) {
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
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

  fixedVersionFormatter(params: ValueFormatterParams): string {
    const vulnerability = params.data.name;
    const idx = this.vulnerabilities.findIndex(
      ({ name }) => name === vulnerability
    );
    return this.vulnerabilities[idx]
      ? this.vulnerabilities[idx].fixed_version
      : '';
  }
}
