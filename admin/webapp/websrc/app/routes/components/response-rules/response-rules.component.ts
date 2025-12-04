import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ResponseRulesService } from '@services/response-rules.service';
import { TranslateService } from '@ngx-translate/core';
import { GridOptions, GridApi } from 'ag-grid-community';
import { UtilsService } from '@common/utils/app.utils';
import { MatDialog } from '@angular/material/dialog';
import { AddEditResponseRuleModalComponent } from './partial/add-edit-response-rule-modal/add-edit-response-rule-modal.component';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { getScope } from '@common/utils/common.utils';
import { GroupsService } from '@services/groups.service';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { saveAs } from 'file-saver';
import { PathConstant } from '@common/constants/path.constant';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import { RemoteExportOptionsWrapper, RemoteExportOptions } from '@common/types';
import { ExportOptionsModalComponent } from '@components/export-options-modal/export-options-modal.component';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  standalone: false,
  selector: 'app-response-rules',
  templateUrl: './response-rules.component.html',
  styleUrls: ['./response-rules.component.scss'],
  
})
export class ResponseRulesComponent implements OnInit, OnDestroy {
  @Input() source: string = '';
  @Input() groupName: string = '';
  @Input() resizableHeight: number = 0;
  @Input() useQuickFilterService: boolean = false;
  refreshing$ = new Subject();
  private isModalOpen: boolean = false;
  public responsePolicyErr: boolean = false;
  public gridOptions: GridOptions = <GridOptions>{};
  public gridApi!: GridApi;
  public gridHeight: number = 0;
  public filtered: boolean = false;
  public filteredCount: number = 0;
  public selectedRules: any[];
  public selectedExportableRules: any[];
  public context;
  public navSource = GlobalConstant.NAV_SOURCE;
  public isWriteResponseRuleAuthorized: boolean = false;
  private w: any;
  private switchClusterSubscription;
  private serverErrorMessage: SafeHtml = '';

  constructor(
    public responseRulesService: ResponseRulesService,
    private groupsService: GroupsService,
    private authUtilsService: AuthUtilsService,
    private translate: TranslateService,
    private utils: UtilsService,
    private multiClusterService: MultiClusterService,
    private quickFilterService: QuickFilterService,
    private notificationService: NotificationService,
    private domSanitizer: DomSanitizer,
    public dialog: MatDialog
  ) {
    this.w = GlobalVariable.window;
  }

  ngOnInit(): void {
    this.source = this.source ? this.source : GlobalConstant.NAV_SOURCE.SELF;
    this.isWriteResponseRuleAuthorized =
      this.authUtilsService.getDisplayFlag('write_response_rule') &&
      (this.source !== GlobalConstant.NAV_SOURCE.GROUP &&
      this.source !== GlobalConstant.NAV_SOURCE.SELF
        ? this.authUtilsService.getDisplayFlag('multi_cluster_w')
        : true);
    this.gridOptions = this.responseRulesService.prepareGrid(
      this.isWriteResponseRuleAuthorized,
      this.source
    );
    this.gridOptions.onSelectionChanged = this.onSelectionChanged4ResponseRules;
    this.gridOptions.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
          if (this.useQuickFilterService) {
            this.quickFilterService.textInput$.subscribe((value: string) => {
              this.quickFilterService.onFilterChange(
                value,
                this.gridOptions,
                this.gridApi
              );
            });
          }
          params.api.sizeColumnsToFit();
        }
      }, 300);
      $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
        setTimeout(() => {
          if (params && params.api) {
            params.api.sizeColumnsToFit();
          }
        }, 100);
      });
    };
    this.context = { componentParent: this };
    this.responseRulesService.scope = getScope(this.source);
    this.refresh();

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

  refresh() {
    this.refreshing$.next(true);
    if (
      this.source === GlobalConstant.NAV_SOURCE.GROUP ||
      this.source === GlobalConstant.NAV_SOURCE.FED_GROUP
    ) {
      this.getGroupPolicy();
    } else {
      this.getResponseRules();
    }
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered =
      this.filteredCount !== this.responseRulesService.responseRules.length;
  }

  private onSelectionChanged4ResponseRules = () => {
    this.selectedRules = this.gridApi!.getSelectedRows();
    this.selectedExportableRules = this.selectedRules.filter(
      rule => !rule.group
    );
  };

  getResponseRules = (): void => {
    this.responsePolicyErr = false;
    this.responseRulesService
      .getResponseRulesData(this.responseRulesService.scope)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        (response: any) => {
          this.responseRulesService.responseRules =
            this.responseRulesService.destructConditions(response.rules);
          this.gridHeight =
            this.source === GlobalConstant.NAV_SOURCE.SELF
              ? this.w.innerHeight - 180 - 70
              : this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
              ? this.w.innerHeight - 298
              : 0;
        },
        err => {
          this.responsePolicyErr = true;
        }
      );
  };

  addResponseRule2Top = (event): void => {
    if (!this.isModalOpen) {
      this.responseRulesService.index4Add = -1;
      this.responseRulesService.getAutoCompleteData().subscribe(
        response => {
          this.openAddResponseRuleModal(response);
        },
        err => {
          this.openAddResponseRuleModal();
        }
      );
      this.isModalOpen = true;
    }
  };

  openImportResponseRulesModal = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? PathConstant.RESPONSE_RULE_IMPORT_FED_URL
            : PathConstant.RESPONSE_RULE_IMPORT_URL,
        importMsg: {
          success: this.translate.instant('responsePolicy.message.IMPORT_OK'),
          error: this.translate.instant('responsePolicy.message.IMPORT_NG'),
        },
      },
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.refresh();
      }, 500);
    });
  };

  exportResponseRules = () => {
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
  };

  private exportUtil(mode: string, option: RemoteExportOptions | null) {
    if (mode === 'local') {
      let payload = {
        ids: this.selectedExportableRules.map(rule => rule.id),
      };
      this.responseRulesService
        .getResponseRuleConfigFileData(payload, this.source)
        .subscribe(
          response => {
            let fileName = this.utils.getExportedFileName(response);
            let blob = new Blob([response.body || ''], {
              type: 'text/plain;charset=utf-8',
            });
            saveAs(blob, fileName);
            this.notificationService.open(
              this.translate.instant('responsePolicy.message.EXPORT_OK')
            );
          },
          error => {
            if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
              this.notificationService.open(
                this.utils.getAlertifyMsg(
                  error.error,
                  this.translate.instant('responsePolicy.message.EXPORT_NG'),
                  false
                ),
                GlobalConstant.NOTIFICATION_TYPE.ERROR
              );
            }
          }
        );
    } else if (mode === 'remote') {
      let payload = {
        ids: this.selectedExportableRules.map(rule => rule.id),
        remote_export_options: option,
      };
      this.responseRulesService
        .getResponseRuleConfigFileData(payload, this.source)
        .subscribe(
          response => {
            const responseObj = JSON.parse(response.body as string);
            this.notificationService.open(
              `${this.translate.instant(
                'responsePolicy.message.EXPORT_OK'
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
              this.serverErrorMessage =
                this.domSanitizer.bypassSecurityTrustHtml(error.message);
            }

            this.notificationService.open(
              this.serverErrorMessage
                ? this.translate.instant('responsePolicy.message.EXPORT_NG')
                : this.utils.getAlertifyMsg(error, '', false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        );
    } else {
      return;
    }
  }

  private getGroupPolicy = () => {
    this.groupsService
      .getGroupInfo(this.groupName)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        (response: any) => {
          let convertedRules = this.responseRulesService.destructConditions(
            response.response_rules
          );
          this.gridApi!.setGridOption('rowData', convertedRules);
        },
        error => {}
      );
  };

  private openAddResponseRuleModal = (
    autoCompleteData: Object[] = []
  ): void => {
    let addDialogRef = this.dialog.open(AddEditResponseRuleModalComponent, {
      data: {
        autoCompleteData: autoCompleteData,
        source: this.source,
        type: 'add',
        refresh: this.getResponseRules,
      },
      width: '70vw',
    });
    addDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.isModalOpen = false;
      }, 1000);
    });
  };
}
