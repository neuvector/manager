import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PathConstant } from '@common/constants/path.constant';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import { AddEditAdmissionRuleModalComponent } from '@components/admission-rules/partial/add-edit-admission-rule-modal/add-edit-admission-rule-modal.component';
import { AdvanceSettingModalComponent } from '@components/admission-rules/partial/advance-setting-modal/advance-setting-modal.component';
import { ConfigurationAssessmentModalComponent } from '@components/admission-rules/partial/configuration-assessment-modal/configuration-assessment-modal.component';
import { ExportAdmissionRulesModalComponent } from '@components/admission-rules/partial/export-admission-rules-modal/export-admission-rules-modal.component';
import {
  AdmissionRule,
  AdmissionStateRec,
} from '@common/types/admission/admission';
import { AdmissionRulesService } from '@common/services/admission-rules.service';
import { GridOptions, GridApi } from 'ag-grid-community';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { Subject } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { saveAs } from 'file-saver';
import * as $ from 'jquery';


@Component({
  standalone: false,
  selector: 'app-admission-rules',
  templateUrl: './admission-rules.component.html',
  styleUrls: ['./admission-rules.component.scss'],
  
})
export class AdmissionRulesComponent implements OnInit {
  @Input() source!: string;
  refreshing$ = new Subject();
  navSource = GlobalConstant.NAV_SOURCE;
  admissionRules: Array<AdmissionRule> = [];
  admissionStateRec: AdmissionStateRec = <AdmissionStateRec>{};
  globalStatus: boolean = false;
  mode: string = '';
  admissionOptions: any;
  gridOptions: GridOptions = <GridOptions>{};
  gridApi!: GridApi;
  gridHeight: number = 0;
  filtered: boolean = false;
  filteredCount!: number;
  selectedAdmissionRules: Array<AdmissionRule> = [];
  isWriteAdmissionRuleAuthorized: boolean = false;
  isAdmissionRuleAuthorized: boolean = false;
  admissionStateErr: boolean = false;
  canConfig: boolean = false;
  isK8s: boolean = false;
  stateWarning: string = '';
  hasSelectedDefaultRule: boolean = false;
  isRemote: boolean = false;
  frameworkComponents;
  context;
  private default_action: string = 'deny';
  private w: any;
  private isModalOpen: boolean = false;
  isPrinting: boolean = false;
  configAssessmentDialogRef!: MatDialogRef<ConfigurationAssessmentModalComponent>;
  configTestResult: any;
  isGridOptionsReady: boolean = false;

  @ViewChild('testResult') printableReportView!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private admissionRulesService: AdmissionRulesService,
    private authUtilsService: AuthUtilsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {
    this.w = GlobalVariable.window;
  }

  ngOnInit(): void {
    this.isWriteAdmissionRuleAuthorized =
      this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? this.authUtilsService.getDisplayFlag('write_admission') &&
          this.authUtilsService.getDisplayFlag('multi_cluster_w')
        : this.authUtilsService.getDisplayFlag('write_admission');
    this.isAdmissionRuleAuthorized =
      this.authUtilsService.getDisplayFlag('admission');
    this.context = { componentParent: this };
    this.gridHeight =
      this.source === GlobalConstant.NAV_SOURCE.SELF
        ? this.w.innerHeight - 238
        : this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? this.w.innerHeight - 300
        : 0;
    this.refresh();
  }

  onAdmissionRulesSelected = () => {
    this.selectedAdmissionRules =
      this.gridApi?.getSelectedRows() as Array<AdmissionRule>;
    this.hasSelectedDefaultRule = this.selectedAdmissionRules.some(
      rule => rule.critical || rule.cfg_type === GlobalConstant.CFG_TYPE.FED
    );
    this.isRemote = GlobalVariable.isRemote;
  };

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.admissionRules.length;
  }

  private getAdmissionStateAndRules = () => {
    this.admissionStateErr = false;
    this.isGridOptionsReady = false;
    this.admissionRulesService
      .getAdmissionData(
        this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
          ? GlobalConstant.SCOPE.FED
          : ''
      )
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        ([state, rules, options]: [
          AdmissionStateRec,
          Array<AdmissionRule>,
          any
        ]) => {
          this.admissionStateRec = state;
          this.admissionRules = rules;
          this.admissionOptions = options;
          this.globalStatus = this.admissionStateRec.state?.enable!;
          this.mode = this.admissionStateRec.state?.mode!;
          this.admissionRulesService.globalMode = this.mode;
          this.gridOptions = this.admissionRulesService.configRuleGrid(
            this.isAdmissionRuleAuthorized
          );
          this.gridOptions.onGridReady = params => {
            const $win = $(GlobalVariable.window);
            if (params && params.api) {
              this.gridApi = params.api;
            }
            setTimeout(() => {
              if (params && params.api) {
                params.api.sizeColumnsToFit();
              }
            }, 500);
            $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
              setTimeout(() => {
                if (params && params.api) {
                  params.api.sizeColumnsToFit();
                }
              }, 1000);
            });
          };
          this.gridOptions.onSelectionChanged = this.onAdmissionRulesSelected;
          this.isGridOptionsReady = true;
          this.default_action = this.admissionStateRec.state?.default_action!;
          if (this.source === GlobalConstant.NAV_SOURCE.SELF) {
            const GLOBAL_ACTION_RULE = {
              id: -1,
              comment:
                this.default_action === 'allow'
                  ? this.translate.instant(
                      'admissionControl.msg.ALLOW_NO_MATCH'
                    )
                  : this.translate.instant(
                      'admissionControl.msg.DENY_NO_MATCH'
                    ),
              criteria: [],
              critical: true,
              category: 'Global action',
              rule_type: this.default_action,
              disable: false,
            };
            this.admissionRules.push(GLOBAL_ACTION_RULE);
          }
          this.filteredCount = this.admissionRules.length;

          this.canConfig =
            state.state == null
              ? false
              : state.state.cfg_type !== GlobalConstant.CFG_TYPE.GROUND;
          this.isK8s = state.k8s_env;
          if (!this.canConfig) {
            this.stateWarning = this.translate.instant(
              'admissionControl.CAN_NOT_CONFIG'
            );
            this.stateWarning = this.translate.instant(
              'admissionControl.CAN_NOT_CONFIG'
            );
          } else if (!this.isK8s) {
            this.stateWarning = this.translate.instant(
              'admissionControl.NOT_SUPPORT'
            );
            this.stateWarning = this.translate.instant(
              'admissionControl.NOT_SUPPORT'
            );
          }
          setTimeout(() => {
            this.gridApi.setGridOption('rowData', this.admissionRules);
          }, 200);
        },
        error => {
          console.log(error);
          this.isGridOptionsReady = true;
          this.admissionStateErr = true;
          setTimeout(() => {
            if (error.status === 404) {
              this.gridOptions.overlayNoRowsTemplate =
                this.utils.getOverlayTemplateMsg(error);
              this.gridApi!.setGridOption('rowData', []);
              this.stateWarning = this.translate.instant(
                'admissionControl.NOT_BINDING'
              );
            } else if (error.status === 403) {
              this.gridOptions.overlayNoRowsTemplate =
                this.translate.instant('general.NO_ROWS');
              this.gridApi!.setGridOption('rowData', []);
            } else {
              this.gridOptions.overlayNoRowsTemplate =
                this.utils.getOverlayTemplateMsg(error);
              this.gridApi!.setGridOption('rowData', []);
            }
          }, 200);
        }
      );
  };

  private getAdmissionState = () => {
    this.admissionRulesService.getAdmissionState().subscribe(
      response => {
        this.admissionStateRec = response;
        this.globalStatus = this.admissionStateRec.state?.enable!;
        this.mode = this.admissionStateRec.state?.mode!;
      },
      error => {
        console.log(error);
        const errTitle = this.translate.instant(
          'admissionControl.msg.GET_ADM_STATE_NG'
        );
        this.notificationService.open(
          this.utils.getAlertifyMsg(error.error, errTitle, false),
          GlobalConstant.NOTIFICATION_TYPE.ERROR
        );
      }
    );
  };

  refresh = () => {
    this.selectedAdmissionRules = [];
    this.isRemote = false;
    this.refreshing$.next(true);
    this.getAdmissionStateAndRules();
  };

  openConfigAssessmentDialog = () => {
    this.configAssessmentDialogRef = this.dialog.open(
      ConfigurationAssessmentModalComponent,
      {
        data: {
          printConfigurationAssessmentResultFn:
            this.printConfigurationAssessmentResult,
        },
        width: '1024px',
      }
    );
  };

  openExportPopup = () => {
    this.dialog.open(ExportAdmissionRulesModalComponent, {
      width: '50%',
      disableClose: true,
      data: {
        selectedAdmissionRules: this.selectedAdmissionRules,
        source: this.source,
      },
    });
  };

  openImportPopup = () => {
    this.isModalOpen = true;
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? PathConstant.IMPORT_ADM_FED_CTRL
            : PathConstant.IMPORT_ADM_CTRL,
        importMsg: {
          success: this.translate.instant('admissionControl.msg.IMPORT_FINISH'),
          error: this.translate.instant('admissionControl.msg.IMPORT_FAILED'),
        },
      },
    });
    importDialogRef.afterClosed().subscribe(() => {
      setTimeout(() => {
        this.refresh();
      }, 500);
      this.isModalOpen = false;
    });
  };

  showAdvancedSetting = () => {
    this.dialog.open(AdvanceSettingModalComponent, {
      width: '60%',
      data: {
        state: this.admissionStateRec.state || {},
        refreshFn: this.refresh,
      },
    });
  };

  openAddEditAdmissionRuleModal = () => {
    this.dialog.open(AddEditAdmissionRuleModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        admissionOptions: this.admissionOptions,
        cfgType:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? GlobalConstant.SCOPE.FED
            : GlobalConstant.SCOPE.LOCAL,
        refresh: this.refresh,
      },
    });
  };

  toggleStatus = () => {
    this.admissionStateRec.state!.enable! = this.globalStatus;
    this.admissionRulesService
      .updateAdmissionState(this.admissionStateRec)
      .subscribe(
        () => {
          let msg = this.globalStatus
            ? this.translate.instant('admissionControl.msg.G_ENABLE_OK')
            : this.translate.instant('admissionControl.msg.G_DISABLE_OK');
          this.notificationService.open(msg);
          setTimeout(() => {
            this.getAdmissionState();
          }, 500);
        },
        error => {
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            let errMsg: string;
            if (
              error.status === GlobalConstant.STATUS_INTERNAL_SERVER_ERR &&
              error.error.code ===
                GlobalConstant.ADMISSION.INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
            ) {
              errMsg = this.translate.instant(
                'admissionControl.msg.CONFIG_K8S_FAIL'
              );
            } else {
              errMsg = error.error;
            }
            let errTitle = this.globalStatus
              ? this.translate.instant('admissionControl.msg.G_ENABLE_NG')
              : this.translate.instant('admissionControl.msg.G_DISABLE_NG');
            this.notificationService.open(
              this.utils.getAlertifyMsg(errMsg, errTitle, false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
            this.globalStatus = !this.globalStatus;
          }
        }
      );
  };

  toggleMode = () => {
    const doSuccess = () => {
      this.notificationService.open(
        this.translate.instant('admissionControl.msg.MODE_SWITCH_OK')
      );
      setTimeout(() => {
        this.getAdmissionStateAndRules();
      }, 500);
    };

    const doError = error => {
      if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
        let errMsg: string;
        if (
          error.status === GlobalConstant.STATUS_INTERNAL_SERVER_ERR &&
          error.error.code ===
            GlobalConstant.ADMISSION.INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
        ) {
          errMsg = this.translate.instant(
            'admissionControl.msg.CONFIG_K8S_FAIL'
          );
        } else {
          errMsg = error.error;
        }
        this.notificationService.open(
          this.utils.getAlertifyMsg(
            errMsg,
            this.translate.instant('admissionControl.msg.MODE_SWITCH_NG'),
            false
          ),
          GlobalConstant.NOTIFICATION_TYPE.ERROR
        );
        this.mode = this.mode === 'monitor' ? 'protect' : 'monitor';
      }
    };

    this.admissionStateRec.state!.mode! = this.mode;

    if (this.mode === 'protect') {
      let message = this.translate.instant(
        'admissionControl.msg.PROTECT_CONFIRM'
      );
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '700px',
        data: {
          message: message,
        },
      });
      dialogRef.componentInstance.confirm
        .pipe(
          switchMap(() => {
            return this.admissionRulesService.updateAdmissionState(
              this.admissionStateRec
            );
          })
        )
        .subscribe(
          res => {
            // confirm actions
            doSuccess();
            // close dialog
            dialogRef.componentInstance.onCancel();
            dialogRef.componentInstance.loading = false;
          },
          error => {
            doError(error);
            dialogRef.componentInstance.loading = false;
          }
        );
    } else {
      this.admissionRulesService
        .updateAdmissionState(this.admissionStateRec)
        .subscribe(
          res => doSuccess(),
          error => doError(error)
        );
    }
  };

  promoteRule = () => {
    let payload = {
      request: {
        ids: this.selectedAdmissionRules.map(rule => rule.id),
      },
    };

    this.admissionRulesService.updateRulePromotion(payload).subscribe({
      next: () => {
        this.notificationService.open(
          this.translate.instant('policy.message.PROMOTE_OK')
        );
        setTimeout(() => {
          this.refresh();
        }, 1000);
      },
      error: error => {
        if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              error.error,
              this.translate.instant('policy.message.PROMOTE_NG'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      },
    });
  };

  private printConfigurationAssessmentResult = testResult => {
    this.configTestResult = testResult;
    this.configAssessmentDialogRef.close();
    this.isPrinting = true;
    setInterval(() => {
      if (this.printableReportView) {
        window.print();
        this.isPrinting = false;
      }
    }, 500);
  };
}
