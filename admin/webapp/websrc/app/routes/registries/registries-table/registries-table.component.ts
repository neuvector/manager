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
import { catchError } from 'rxjs/operators';
import { ConfigHttpService } from '@common/api/config-http.service';


export const RegistryType = [
  'Amazon ECR Registry',
  'Azure Container Registry',
  'Docker Registry',
  'Gitlab',
  'Google Container Registry',
  'IBM Cloud Container Registry',
  'OpenShift Registry',
  'JFrog Artifactory',
  'Red Hat Public Registry',
  'Sonatype Nexus',
];

@Component({
  standalone: false,
  selector: 'app-registries-table',
  templateUrl: './registries-table.component.html',
  styleUrls: ['./registries-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class RegistriesTableComponent implements OnInit, OnChanges {
  @Input() rowData!: Summary[];
  @Input() gridHeight!: number;
  @Input() linkedRegistry: string;
  error: unknown;
  filtered: boolean = false;
  filteredCount!: number;
  isVulAuthorized: boolean =
    this.authUtilsService.getDisplayFlag('vuls_profile');
  isMultiClusterAuthorized: boolean =
    this.authUtilsService.getDisplayFlag('multi_cluster');
  includesViewAll: boolean = false;
  includesFedRepo: boolean = false;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'name',
      cellRenderer: params => {
        if (params.data && params.value) {
          if (!!params.data.isAllView) {
            return `<span class="text-info">${params.value}</span>`;
          }
          if (!!params.data.isFedRepo) {
            return `<span class="text-info">${this.translate.instant(
              `registry.${params.value.toUpperCase()}`
            )}</span>`;
          }
          return params.value;
        }
        return '';
      },
      sortable: true,
      resizable: true,
      colSpan: function (params) {
        if (
          params.data &&
          (!!params.data.isAllView || !!params.data.isFedRepo)
        ) {
          return 10;
        }
        return 1;
      },
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
  registryTypes$ = this.registriesCommunicationService.registryTypes$;
  registryTypes: string[] = [];
  isRegistryScanAuthorized: boolean = false;
  get isFedRegistry() {
    let selectedRows = this.gridApi?.getSelectedNodes();
    if (Array.isArray(selectedRows) && selectedRows.length > 0) {
      return selectedRows[0].data.cfg_type === GlobalConstant.CFG_TYPE.FED;
    }
    return false;
  }
  get isFedAdmin() {
    return this.authUtilsService.getDisplayFlag('multi_cluster');
  }

  get isRemote() {
    return GlobalVariable.isRemote;
  }

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private registriesService: RegistriesService,
    public registriesCommunicationService: RegistriesCommunicationService,
    private cd: ChangeDetectorRef,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private configHttpService: ConfigHttpService
  ) {}

  ngOnInit(): void {
    this.isRegistryScanAuthorized =
      this.authUtilsService.getDisplayFlag('registry_scan');
    this.gridOptions = {
      rowData: this.rowData,
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      getRowId: params => params.data.name,
      onGridReady: event => this.onGridReady(event),
      onSelectionChanged: event => this.onSelectionChanged(event),
      components: {
        btnCellRenderer: RegistriesTableButtonsComponent,
        statusCellRenderer: RegistryTableStatusCellComponent,
      },
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
    this.configHttpService.getConfig().subscribe(response => {
      this.configHttpService.setConfigV2(response);
    });
  }

  onSelectionChanged(params: GridReadyEvent): void {
    if (params.api.getSelectedNodes().length > 0) {
      console.log(params.api.getSelectedNodes()[0].data);
      this.registriesCommunicationService.setSelectedRegistry(
        params.api.getSelectedNodes()[0].data
      );
      this.registriesCommunicationService.detailFilter.setValue('');
    }
    this.cd.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.gridApi && changes.rowData) {
      this.gridApi.setGridOption('rowData', []);
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);

      // if selected registry is not in the current page, select the first row
      if (changes.rowData.currentValue.length > 0) {
        const selected = this.registriesCommunicationService.selectedRegistry;
        let node;
        if (selected && selected.name) {
          changes.rowData.currentValue.forEach(item => {
            if (item.name === selected.name) {
              node = this.gridApi.getRowNode(selected.name);
            }
          });
        }
        if (!node) {
          node = this.gridApi.getDisplayedRowAtIndex(0);
        }
        node.setSelected(true);
        this.gridApi.ensureNodeVisible(node, 'middle');
      }
    }
  }

  filterCountChanged(results: number) {
    let filteredRowNodes = this.gridApi.getRenderedNodes();
    let includesViewAll =
      (filteredRowNodes.length > 2 &&
        filteredRowNodes[filteredRowNodes.length - 2] &&
        filteredRowNodes[filteredRowNodes.length - 2].data.isAllView) ||
      (filteredRowNodes.length > 1 &&
        filteredRowNodes[filteredRowNodes.length - 1] &&
        filteredRowNodes[filteredRowNodes.length - 2].data.isAllView);
    let includesFedRepo =
      filteredRowNodes.length > 0 &&
      filteredRowNodes[filteredRowNodes.length - 1].data.isFedRepo;
    this.filteredCount =
      results - (includesViewAll ? 1 : 0) - (includesFedRepo ? 1 : 0);
    this.filtered =
      this.filteredCount !==
      this.rowData.length -
        (this.isVulAuthorized && includesViewAll ? 1 : 0) -
        (this.isMultiClusterAuthorized && includesFedRepo ? 1 : 0);
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
          this.registriesCommunicationService.setSelectedRegistry(undefined);
          this.registriesCommunicationService.refreshRegistries(1000);
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
      complete: () =>
        this.registriesCommunicationService.refreshRegistries(1000),
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
    this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
    this.gridApi.forEachNode(node => {
      if (this.linkedRegistry === node.data.name) {
        node.setSelected(true);
        this.gridApi.ensureNodeVisible(node, 'middle');
      }
    });
    let filteredRowNodes = this.gridApi.getRenderedNodes();
    this.includesViewAll =
      (filteredRowNodes.length > 1 &&
        filteredRowNodes[filteredRowNodes.length - 2].data.isAllView) ||
      (filteredRowNodes.length > 0 &&
        filteredRowNodes[filteredRowNodes.length - 1].data.isAllView);
    this.includesFedRepo =
      filteredRowNodes.length > 0 &&
      filteredRowNodes[filteredRowNodes.length - 1].data.isFedRepo;
    this.cd.markForCheck();
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  openDialog(isEdit = false, data?: Summary, editable = true): void {
    this.registryTypes$.subscribe({
      next: value => (this.registryTypes = value.list.registry_type),
      error: err => (this.registryTypes = RegistryType),
      complete: () => {
        const dialog = this.dialog.open(AddRegistryDialogComponent, {
          width: '80%',
          maxWidth: '1100px',
          data: {
            config: data,
            isEdit: isEdit,
            editable: editable,
            registryTypes: this.registryTypes,
          },
        });
        dialog.afterClosed().subscribe(change => {
          if (change && isEdit) {
            this.registriesCommunicationService.setSelectedRegistry(
              this.gridApi.getSelectedNodes()[0].data
            );
          }
          this.cd.markForCheck();
        });
      },
    });
  }
}
