import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
} from 'ag-grid-community';
import { AddRegistryDialogComponent } from './add-registry-dialog/add-registry-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { RegistryConfig, Summary } from '@common/types';
import { RegistriesTableButtonsComponent } from './registries-table-buttons/registries-table-buttons.component';
import { RegistriesService } from '@services/registries.service';
import { RegistriesCommunicationService } from '../regestries-communication.service';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { RegistryTableStatusCellComponent } from './registry-table-status-cell/registry-table-status-cell.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog/confirm-delete-dialog.component';
import { cloneDeep } from 'lodash';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  selector: 'app-registries-table',
  templateUrl: './registries-table.component.html',
  styleUrls: ['./registries-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistriesTableComponent implements OnInit, OnChanges {
  @Input() rowData!: Summary[];
  @Input() gridHeight!: number;
  filter = new FormControl('');
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'name',
      sortable: true,
      resizable: true,
      headerValueGetter: () => this.translate.instant('scan.gridHeader.NAME'),
    },
    {
      field: 'registry',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.REGISTRY'),
    },
    {
      field: 'filters',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.FILTER'),
    },
    {
      field: 'username',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.USERNAME'),
    },
    {
      field: 'status',
      cellRenderer: 'statusCellRenderer',
      sortable: true,
      resizable: true,
      headerValueGetter: () => this.translate.instant('scan.gridHeader.STATUS'),
    },
    {
      field: 'scheduled',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.QUEUED'),
    },
    {
      field: 'scanned',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.FINISHED'),
    },
    {
      field: 'failed',
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('registry.gridHeader.FAILED'),
    },
    {
      field: 'controls',
      cellRenderer: 'btnCellRenderer',
      cellRendererParams: {
        edit: event => this.editRegistry(event),
        delete: event => this.deleteRegistry(event),
      },
      cellClass: ['d-flex', 'align-items-center'],
    },
  ];
  startingScan$ = this.registriesCommunicationService.startingScan$;
  stoppingScan$ = this.registriesCommunicationService.stoppingScan$;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private registriesService: RegistriesService,
    private registriesCommunicationService: RegistriesCommunicationService,
    private cd: ChangeDetectorRef,
    private authUtilsService: AuthUtilsService
  ) {}

  ngOnInit(): void {
    let isWriteRegistryAuthorized = this.authUtilsService.getDisplayFlag('registry_scan');
    if (!isWriteRegistryAuthorized) {
      this.columnDefs.pop();
    }
    this.gridOptions = {
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      getRowNodeId: data => data.name,
      deltaRowDataMode: true,
      onGridReady: event => this.onGridReady(event),
      onSelectionChanged: event => this.onSelectionChanged(event),
      components: {
        btnCellRenderer: RegistriesTableButtonsComponent,
        statusCellRenderer: RegistryTableStatusCellComponent,
      },
    };
    this.filter.valueChanges.subscribe(val => this.gridApi.setQuickFilter(val));
  }

  onSelectionChanged(params: GridReadyEvent): void {
    this.registriesCommunicationService.setSelectedRegistry(
      params.api.getSelectedNodes()[0].data
    );
    this.cd.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridApi && changes.rowData) {
      this.gridApi.setRowData(changes.rowData.currentValue);
    }
  }

  deleteRegistry(event): void {
    this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '80%',
      maxWidth: '600px',
      disableClose: true,
      data: {
        name: event.data.name,
      },
    });
  }

  startScan(): void {
    this.registriesCommunicationService.initStartScan();
    const name = this.gridApi.getSelectedNodes()[0].data.name;
    this.registriesService
      .startScanning(name)
      .subscribe(() => this.registriesCommunicationService.refreshRegistries());
  }

  stopScan(): void {
    this.registriesCommunicationService.initStopScan();
    const name = this.gridApi.getSelectedNodes()[0].data.name;
    this.registriesService.stopScanning(name).subscribe();
  }

  editRegistry(event): void {
    this.openDialog(cloneDeep(this.gridApi.getRowNode(event.node.id)?.data));
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

  openDialog(data?: RegistryConfig): void {
    const dialog = this.dialog.open(AddRegistryDialogComponent, {
      width: '80%',
      maxWidth: '1100px',
      data,
    });
    dialog.afterClosed().subscribe(change => {
      this.cd.markForCheck();
    });
  }
}
