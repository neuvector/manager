import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  CfgType,
  ComplianceProfileTemplateEntry,
  ErrorResponse,
  RemoteExportOptions,
  RemoteExportOptionsWrapper,
} from '@common/types';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
} from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { RegulationsCellComponent } from '@routes/compliance-profile/compliance-profile-templates/compliance-profile-templates-table/regulations-cell/regulations-cell.component';
import { CategoriesCellComponent } from '@routes/compliance-profile/compliance-profile-templates/compliance-profile-templates-table/categories-cell/categories-cell.component';
import { ActionCellComponent } from '@routes/compliance-profile/compliance-profile-templates/compliance-profile-templates-table/action-cell/action-cell.component';
import { MatDialog } from '@angular/material/dialog';
import { cloneDeep } from 'lodash';
import { EditRegulationDialogComponent } from '@routes/compliance-profile/compliance-profile-templates/compliance-profile-templates-table/edit-regulation-dialog/edit-regulation-dialog.component';
import { ComplianceProfileService } from '@routes/compliance-profile/compliance-profile.service';
import { BehaviorSubject } from 'rxjs';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import { PathConstant } from '@common/constants/path.constant';
import { saveAs } from 'file-saver';
import { ExportOptionsModalComponent } from '@components/export-options-modal/export-options-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  standalone: false,
  selector: 'app-compliance-profile-templates-table',
  templateUrl: './compliance-profile-templates-table.component.html',
  styleUrls: ['./compliance-profile-templates-table.component.scss'],
})
export class ComplianceProfileTemplatesTableComponent
  implements OnInit, OnChanges, AfterViewInit
{
  @Input() rowData!: ComplianceProfileTemplateEntry[];
  @Input() hideSystemInit!: boolean;
  @Input() cfgType!: CfgType;
  @Input() availableFilters!: string[];
  get cfgTypeClass() {
    let cfgType = (
      this.cfgType ? this.cfgType : GlobalConstant.CFG_TYPE.CUSTOMER
    ).toUpperCase();
    return MapConstant.colourMap[cfgType];
  }
  serverErrorMessage: SafeHtml = '';
  isNamespaceUser!: boolean;
  gridOptions!: GridOptions;
  filteredCount = 0;
  gridApi!: GridApi;
  hideSystem!: boolean;
  systemChanges = 0;
  totalChanges = 0;
  regulationChanges = {};
  isWriteComplianceProfileAuthorized!: boolean;
  filterForm!: { [filter: string]: boolean };
  all = true;
  pci = false;
  gdpr = false;
  nist = false;
  hipaa = false;
  columnDefs: ColDef[] = [
    {
      field: 'test_number',
      width: 70,
      sortable: true,
      resizable: true,
      headerName: 'CIS ID',
    },
    {
      field: 'tags',
      width: 180,
      sortable: true,
      resizable: true,
      cellRenderer: 'regulationsCellRenderer',
      headerValueGetter: () =>
        this.translate.instant('cis.profile.REGULATIONS'),
    },
    {
      field: 'category',
      width: 70,
      sortable: true,
      resizable: true,
      cellRenderer: 'categoryCellRenderer',
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.CATEGORY'),
    },
    {
      field: 'scored',
      width: 70,
      sortable: true,
      resizable: true,
      valueFormatter: params => (params?.node?.data.scored ? 'Y' : 'N'),
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.SCORED') + '\u00A0\u24D8',
      headerTooltip: this.translate.instant('cis.SCORED'),
    },
    {
      field: 'profile',
      width: 70,
      sortable: true,
      resizable: true,
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.PROFILE') +
        '\u00A0\u24D8',
      headerTooltip: this.translate.instant('cis.LEVEL1'),
    },
    {
      field: 'description',
      sortable: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellStyle: { 'line-height': '25px' },
      headerValueGetter: () =>
        this.translate.instant('cis.report.gridHeader.DESC'),
    },
    {
      resizable: true,
      width: 50,
      cellRenderer: 'actionCellRenderer',
      cellRendererParams: {
        edit: event => this.editRegulation(event),
      },
      headerValueGetter: () => this.translate.instant('setting.ACTIONS'),
    },
  ];
  private filteredSubject$ = new BehaviorSubject(false);
  filtered$ = this.filteredSubject$.asObservable();

  constructor(
    private translate: TranslateService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private complianceProfileService: ComplianceProfileService,
    private authUtilsService: AuthUtilsService,
    private domSanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isNamespaceUser = this.authUtilsService.userPermission.isNamespaceUser;
    this.isWriteComplianceProfileAuthorized =
      this.authUtilsService.getDisplayFlag('write_compliance_profile');
    if (!this.isWriteComplianceProfileAuthorized || this.cfgType === 'ground') {
      this.columnDefs.pop();
    }
    this.hideSystem = this.hideSystemInit;
    this.gridOptions = {
      rowData: this.rowData,
      tooltipShowDelay: 0,
      columnDefs: this.columnDefs,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      onGridReady: event => this.onGridReady(event),
      components: {
        regulationsCellRenderer: RegulationsCellComponent,
        categoryCellRenderer: CategoriesCellComponent,
        actionCellRenderer: ActionCellComponent,
      },
      doesExternalFilterPass: this.doesExternalFilterPass.bind(this),
      isExternalFilterPresent: () => true,
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
    this.filterForm = Object.fromEntries(
      this.availableFilters.map(filter => [filter, false])
    );
  }

  ngAfterViewInit() {
    this.complianceProfileService.resize$.subscribe(() => {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
        this.cd.markForCheck();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.gridApi && changes.rowData) {
      this.gridApi.setGridOption('rowData', changes.rowData.currentValue);
    }
  }

  editRegulation(event): void {
    this.openDialog(
      cloneDeep(this.gridApi.getRowNode(event.node.id)?.data),
      event.node.id
    );
  }

  openDialog(data, id): void {
    const dialog = this.dialog.open(EditRegulationDialogComponent, {
      width: '100%',
      maxWidth: '500px',
      data: { ...data, regulations: this.availableFilters },
    });
    dialog.afterClosed().subscribe(dialogData => {
      if (dialogData) {
        const rowNode = this.gridApi.getRowNode(id);
        const newData = rowNode!.data;
        newData.tags = dialogData;
        rowNode?.updateData(newData);
        this.regulationChanges[rowNode?.data.test_number] = dialogData;
        this.totalChanges =
          Object.keys(this.regulationChanges).length + this.systemChanges;
        this.cd.markForCheck();
      }
    });
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

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filteredSubject$.next(this.filteredCount !== this.rowData.length);
  }

  updateSystem() {
    if (this.hideSystemInit === this.hideSystem) {
      this.systemChanges--;
    } else {
      this.systemChanges++;
    }
    this.totalChanges =
      Object.keys(this.regulationChanges).length + this.systemChanges;
  }

  doesExternalFilterPass(node: IRowNode) {
    if (this.all) return true;
    else {
      let res = Object.keys(this.filterForm).filter(
        filter => this.filterForm[filter]
      );
      return node.data.tags?.some(tag => res.includes(tag));
    }
  }

  filterChange(type) {
    if (type !== 'ALL') {
      this.all = false;
      this.filteredSubject$.next(true);
    } else {
      this.all = true;
      Object.keys(this.filterForm).forEach(
        filter => (this.filterForm[filter] = false)
      );
    }
    if (Object.values(this.filterForm).every(filter => !filter)) {
      this.all = true;
    }
    this.gridApi.onFilterChanged();
    this.filteredCount =
      this.gridApi.getModel()['rootNode'].childrenAfterFilter.length;
  }

  reset() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('cis.profile.RESET_CONFIRM'),
        isSync: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.saveChanges(true);
      }
    });
  }

  resetPending() {
    this.totalChanges = 0;
    this.systemChanges = 0;
    this.regulationChanges = {};
  }

  saveChanges(bool?: boolean) {
    let payload = {
      name: 'default',
      disable_system: this.hideSystem,
      entries: [] as any,
    };
    if (!bool) {
      this.complianceProfileService.lastEntries.forEach(entry => {
        payload.entries.push(entry);
      });
      Object.keys(this.regulationChanges).forEach(key => {
        payload.entries.push({
          test_number: key,
          tags: this.regulationChanges[key],
        });
      });
    }
    this.complianceProfileService.saveRegulations(payload).subscribe({
      complete: () => {
        this.complianceProfileService.refresh();
        this.resetPending();
        this.notificationService.open(
          this.translate.instant('cis.profile.DEPLOY_OK')
        );
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.notificationService.openError(
          error,
          this.translate.instant('cis.profile.DEPLOY_FAILED')
        );
      },
    });
  }

  exportProfile(): void {
    const dialogRef = this.dialog.open(ExportOptionsModalComponent, {
      width: '50%',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: RemoteExportOptionsWrapper) => {
      if (result) {
        const { export_mode, ...exportOptions } = result.export_options;
        this.exportUtil(export_mode, exportOptions);
      }
    });
  }

  exportUtil(mode: string, option: RemoteExportOptions) {
    if (mode === 'local') {
      let payload = {
        names: ['default'],
      };
      this.complianceProfileService.exportProfile(payload).subscribe(
        response => {
          let fileName = this.utils.getExportedFileName(response);
          let blob = new Blob([response.body || ''], {
            type: 'text/plain;charset=utf-8',
          });
          saveAs(blob, fileName);
          this.notificationService.open(
            this.translate.instant('cis.profile.msg.EXPORT_PROFILE_OK')
          );
        },
        error => {
          this.notificationService.openError(
            error.error,
            this.translate.instant('cis.profile.msg.EXPORT_PROFILE_NG')
          );
        }
      );
    } else if (mode === 'remote') {
      let payload = {
        names: ['default'],
        remote_export_options: option,
      };
      this.complianceProfileService.exportProfile(payload).subscribe(
        response => {
          const responseObj = JSON.parse(response.body as string);
          this.notificationService.open(
            `${this.translate.instant(
              'cis.profile.msg.EXPORT_PROFILE_OK'
            )} ${this.translate.instant('general.EXPORT_FILE')} ${
              responseObj.file_path
            }`
          );
        },
        error => {
          if (
            error.message &&
            error.message.length > GlobalConstant.MAX_ERROR_MESSAGE_LENGTH
          ) {
            this.serverErrorMessage = this.domSanitizer.bypassSecurityTrustHtml(
              error.message
            );
          }

          this.notificationService.open(
            this.serverErrorMessage
              ? this.translate.instant('cis.profile.msg.EXPORT_PROFILE_NG')
              : this.utils.getAlertifyMsg(error, '', false),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
    } else {
      return;
    }
  }

  openImportProfileModal(): void {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.IMPORT_COMPLIANCE_PROFILE,
        importMsg: {
          success: this.translate.instant('cis.profile.msg.IMPORT_FINISH'),
          error: this.translate.instant('cis.profile.msg.IMPORT_FAILED'),
        },
      },
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.complianceProfileService.refresh();
      }, 500);
    });
  }
}
