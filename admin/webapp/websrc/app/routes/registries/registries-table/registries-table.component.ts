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
import { ErrorResponse, RegistryConfig, Summary } from '@common/types';
import { RegistriesTableButtonsComponent } from './registries-table-buttons/registries-table-buttons.component';
import { RegistriesService } from '@services/registries.service';
import { RegistriesCommunicationService } from '../regestries-communication.service';
import { FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { RegistryTableStatusCellComponent } from './registry-table-status-cell/registry-table-status-cell.component';
import { cloneDeep } from 'lodash';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { finalize, switchMap, take, tap } from 'rxjs/operators';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { NotificationService } from '@services/notification.service';
import { GlobalVariable } from '@common/variables/global.variable';
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
      field: 'cfg_type',
      cellRenderer: params => {
        if (params.value === GlobalConstant.CFG_TYPE.LEARNED) {
          return `<span class="action-label px-1 group-type ${
            MapConstant.colourMap['LEARNED']
          }">${this.translate.instant('group.LEARNED')}</span>`;
        } else if (params.value === GlobalConstant.CFG_TYPE.CUSTOMER) {
          return `<span class="action-label px-1 group-type ${
            MapConstant.colourMap['CUSTOM']
          }">${this.translate.instant('group.CUSTOM')}</span>`;
        } else if (params.value === GlobalConstant.CFG_TYPE.GROUND) {
          return `<span class="action-label px-1 group-type ${
            MapConstant.colourMap['GROUND']
          }">${this.translate.instant('group.GROUND')}</span>`;
        } else if (params.value === GlobalConstant.CFG_TYPE.FED) {
          return `<span class="action-label px-1 group-type ${
            MapConstant.colourMap['FED']
          }">${this.translate.instant('group.FED')}</span>`;
        }
        return '';
      },
      sortable: true,
      resizable: true,
      headerValueGetter: () => this.translate.instant('policy.gridHeader.TYPE'),
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
      field: '',
      cellRenderer: 'btnCellRenderer',
      cellRendererParams: {
        edit: event => this.editRegistry(event),
        delete: event => this.deleteRegistry(event),
        view: event => this.viewRegistry(event),
      },
      cellClass: ['d-flex', 'align-items-center'],
    },
  ];
  startingScan$ = this.registriesCommunicationService.startingScan$;
  stoppingScan$ = this.registriesCommunicationService.stoppingScan$;
  isRegistryScanAuthorized: boolean = false;
  get isFedRegistry() {
    let selectedRows = this.gridApi?.getSelectedNodes();
    if (Array.isArray(selectedRows) && selectedRows.length > 0) {
      return (
        selectedRows[0].data.cfg_type ===
        GlobalConstant.CFG_TYPE.FED
      );
    }
    return false;
  }
  get isFedAdmin() {
    return GlobalVariable.user.token.role === MapConstant.FED_ROLES.FEDADMIN;
  }

  get isRemote() {
    return GlobalVariable.isRemote;
  }

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private registriesService: RegistriesService,
    private registriesCommunicationService: RegistriesCommunicationService,
    private cd: ChangeDetectorRef,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.isRegistryScanAuthorized = this.authUtilsService.getDisplayFlag('registry_scan');
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
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
    this.filter.valueChanges.subscribe(val => this.gridApi.setQuickFilter(val));
  }

  onSelectionChanged(params: GridReadyEvent): void {
    if (params.api.getSelectedNodes().length > 0)
      this.registriesCommunicationService.setSelectedRegistry(
        params.api.getSelectedNodes()[0].data
      );
    this.cd.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridApi && changes.rowData) {
      this.gridApi.setRowData([]);
      this.gridApi.setRowData(changes.rowData.currentValue);
      if (!this.gridApi.getSelectedNodes().length) {
        this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
      }
    }
  }

  deleteRegistry(event): void {
    const deleteDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '80%',
      maxWidth: '600px',

      data: {
        message: this.translate.instant(
          'registry.REGISTRY_DELETE_CONFIRMATION'
        ),
      },
    });
    deleteDialogRef.componentInstance.confirm
      .pipe(
        take(1),
        tap(() => this.registriesCommunicationService.initDelete()),
        switchMap(() => this.registriesService.deleteRegistry(event.data.name)),
        finalize(() => {
          deleteDialogRef.componentInstance.onCancel();
          deleteDialogRef.componentInstance.loading = false;
        })
      )
      .subscribe({
        complete: () => {
          this.registriesCommunicationService.refreshRegistries();
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.translate.instant('registry.REGISTRY_DELETE_FAILED')
          );
        },
      });
  }

  startScan(): void {
    this.registriesCommunicationService.initStartScan();
    const name = this.gridApi.getSelectedNodes()[0].data.name;
    this.registriesService.startScanning(name).subscribe({
      complete: () => this.registriesCommunicationService.refreshRegistries(),
      error: ({ error }: { error: ErrorResponse }) => {
        this.registriesCommunicationService.cancelStartScan();
        this.notificationService.openError(
          error,
          this.translate.instant('registry.REGISTRY_SCAN_FAILED')
        );
      },
    });
  }

  stopScan(): void {
    this.registriesCommunicationService.initStopScan();
    const name = this.gridApi.getSelectedNodes()[0].data.name;
    this.registriesService.stopScanning(name).subscribe({
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.openError(
          error,
          this.translate.instant('registry.REGISTRY_STOP_SCAN_FAILED')
        );
      },
    });
  }

  editRegistry(event): void {
    this.openDialog(
      true,
      cloneDeep(this.gridApi.getRowNode(event.node.id)?.data)
    );
  }

  viewRegistry(event): void {
    this.openDialog(
      true,
      cloneDeep(this.gridApi.getRowNode(event.node.id)?.data),
      false
    );
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

  openDialog(isEdit = false, data?: RegistryConfig, editable = true): void {
    const dialog = this.dialog.open(AddRegistryDialogComponent, {
      width: '80%',
      maxWidth: '1100px',
      data: { config: data, isEdit: isEdit, editable: editable },
    });
    dialog.afterClosed().subscribe(change => {
      if (change) {
        this.registriesCommunicationService.setSelectedRegistry(
          this.gridApi.getSelectedNodes()[0].data
        );
      }
      this.cd.markForCheck();
    });
  }
}
