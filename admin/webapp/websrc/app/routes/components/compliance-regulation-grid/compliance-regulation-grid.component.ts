import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ComplianceTagData } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';

@Component({
  standalone: false,
  selector: 'app-compliance-regulation-grid',
  templateUrl: './compliance-regulation-grid.component.html',
  styleUrls: ['./compliance-regulation-grid.component.scss'],
})
export class ComplianceRegulationGridComponent implements OnInit {
  @Input() rowData!: ComplianceTagData[];
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'CIS_Sub_Control',
      width: 70,
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.SUBCONTROL'),
    },
    {
      field: 'description',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.DESC'),
    },
    {
      field: 'id',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.CONTROL_ID'),
    },
    {
      field: 'title',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.TITLE'),
    },
  ];

  constructor(
    private translate: TranslateService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.gridOptions = {
      rowData: this.rowData,
      tooltipShowDelay: 0,
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      onGridReady: event => this.onGridReady(event),
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );
    this.cd.markForCheck();
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }
}
