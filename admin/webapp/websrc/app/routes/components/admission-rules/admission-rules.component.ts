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
import { GridOptions } from 'ag-grid-community';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { TranslateService } from '@ngx-translate/core';
import { MultiClusterService } from '@services/multi-cluster.service';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  selector: 'app-admission-rules',
  templateUrl: './admission-rules.component.html',
  styleUrls: ['./admission-rules.component.scss'],
})
export class AdmissionRulesComponent implements OnInit {
  @Input() source!: string;
  navSource = GlobalConstant.NAV_SOURCE;
  admissionRules: Array<AdmissionRule> = [];
  admissionStateRec: AdmissionStateRec = <AdmissionStateRec>{};
  globalStatus: boolean = false;
  mode: string = '';
  admissionOptions: any;
  gridOptions: GridOptions = <GridOptions>{};
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
  isMaster: boolean = false;
  frameworkComponents;
  context;
  private default_action: string = 'deny';
  private w: any;
  private isModalOpen: boolean = false;
  private switchClusterSubscription;
  isPrinting: boolean = false;
  configAssessmentDialogRef!: MatDialogRef<ConfigurationAssessmentModalComponent>;
  configTestResult: any;

  @ViewChild('testResult') printableReportView!: ElementRef;

  constructor(
    private dialog: MatDialog,
    private admissionRulesService: AdmissionRulesService,
    private authUtilsService: AuthUtilsService,
    private translate: TranslateService,
    private multiClusterService: MultiClusterService,
    private utils: UtilsService
  ) {
    this.w = GlobalVariable.window;
  }

  ngOnInit(): void {
    this.isWriteAdmissionRuleAuthorized =
      this.authUtilsService.getDisplayFlag('write_admission');
    this.isAdmissionRuleAuthorized =
      this.authUtilsService.getDisplayFlag('admission');
    this.gridOptions = this.admissionRulesService.configRuleGrid(
      this.isWriteAdmissionRuleAuthorized
    );
    this.gridOptions.onSelectionChanged = this.onAdmissionRulesSelected;
    this.context = { componentParent: this };
    this.gridHeight =
      this.source === GlobalConstant.NAV_SOURCE.SELF
        ? this.w.innerHeight - 238
        : this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? this.w.innerHeight - 300
        : 0;
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

  onAdmissionRulesSelected = () => {
    this.selectedAdmissionRules =
      this.gridOptions.api?.getSelectedRows() as Array<AdmissionRule>;
    this.hasSelectedDefaultRule = this.selectedAdmissionRules.some(
      rule => rule.critical || rule.cfg_type === GlobalConstant.CFG_TYPE.FED
    );
    this.isMaster = GlobalVariable.isMaster;
  };

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.admissionRules.length;
  }

  private getAdmissionStateAndRules = () => {
    this.admissionStateErr = false;
    this.admissionRulesService
      .getAdmissionData(
        this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
          ? GlobalConstant.SCOPE.FED
          : ''
      )
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
          this.default_action = this.admissionStateRec.state?.default_action!;
          if (this.source === GlobalConstant.NAV_SOURCE.SELF) {
            const GLOBAL_ACTION_RULE = {
              id: -1,
              comment:
                this.default_action === 'allow'
                  ? "Allow deployments that don't match any of above rules."
                  : "Deny deployments that don't match any of above rules.",
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
            state.state!.cfg_type !== GlobalConstant.CFG_TYPE.GROUND;
          this.isK8s = state.k8s_env;
          if (!this.canConfig) {
            this.stateWarning = this.translate.instant(
              'admissionControl.CAN_NOT_CONFIG'
            );
          } else if (!this.isK8s) {
            this.stateWarning = this.translate.instant(
              'admissionControl.NOT_SUPPORT'
            );
          }
        },
        error => {
          console.log(error);
          this.admissionStateErr = true;
          if (error.status === 404) {
            this.gridOptions.overlayNoRowsTemplate =
              this.utils.getOverlayTemplateMsg(error);
            this.gridOptions!.api!.setRowData([]);
            this.stateWarning = this.translate.instant(
              'admissionControl.NOT_BINDING'
            );
          } else if (error.status === 403) {
            this.gridOptions.overlayNoRowsTemplate =
              this.translate.instant('general.NO_ROWS');
            this.gridOptions!.api!.setRowData([]);
          } else {
            this.gridOptions.overlayNoRowsTemplate =
              this.utils.getOverlayTemplateMsg(error);
            this.gridOptions!.api!.setRowData([]);
          }
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
      error => {}
    );
  };

  refresh = () => {
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
        disableClose: true,
      }
    );
  };

  openExportPopup = () => {
    const exportDialogRef = this.dialog.open(
      ExportAdmissionRulesModalComponent,
      {
        width: '50%',
        data: {
          selectedAdmissionRules: this.selectedAdmissionRules,
        },
        disableClose: true,
      }
    );
  };

  openImportPopup = () => {
    this.isModalOpen = true;
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.IMPORT_ADM_CTRL,
        importMsg: {
          success: this.translate.instant('admissionControl.msg.IMPORT_FINISH'),
          error: this.translate.instant('admissionControl.msg.IMPORT_FAILED'),
        },
      },
      disableClose: true,
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.refresh();
      }, 500);
      this.isModalOpen = false;
    });
  };

  showAdvancedSetting = () => {
    const advancedSettingDialogRef = this.dialog.open(
      AdvanceSettingModalComponent,
      {
        width: '60%',
        data: {
          state: this.admissionStateRec.state || {},
          refreshFn: this.refresh,
        },
        disableClose: true,
      }
    );
  };

  openAddEditAdmissionRuleModal = () => {
    const addEditDialogRef = this.dialog.open(
      AddEditAdmissionRuleModalComponent,
      {
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
        disableClose: true,
      }
    );
  };

  toggleStatus = () => {
    this.admissionStateRec.state!.enable! = this.globalStatus;
    this.admissionRulesService
      .updateAdmissionState(this.admissionStateRec)
      .subscribe(
        response => {
          this.getAdmissionState();
        },
        error => {}
      );
  };

  toggleMode = () => {
    this.admissionStateRec.state!.mode! = this.mode;
    this.admissionRulesService
      .updateAdmissionState(this.admissionStateRec)
      .subscribe(
        response => {
          this.getAdmissionState();
        },
        error => {}
      );
  };

  promoteRule = () => {
    let payload = {
      request: {
        ids: this.selectedAdmissionRules.map(rule => rule.id),
      },
    };

    this.admissionRulesService.updateRulePromotion(payload).subscribe({
      next: res => {
        setTimeout(() => {
          this.refresh();
        }, 1000);
      },
      error: error => {},
    });
  };

  showGlobalActions = event => {};

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
