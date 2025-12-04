import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MatDialog } from '@angular/material/dialog';
import { MapConstant } from '@common/constants/map.constant';
import { PathConstant } from '@common/constants/path.constant';
import { UtilsService } from '@common/utils/app.utils';
import { GroupsService } from '@services/groups.service';
import { GridOptions, GridApi } from 'ag-grid-community';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { AddEditGroupModalComponent } from './partial/add-edit-group-modal/add-edit-group-modal.component';
import { SwitchModeModalComponent } from './partial/switch-mode-modal/switch-mode-modal.component';
import {
  ErrorResponse,
  Group,
  PolicyMode,
  ProfileBaseline,
  RemoteExportOptions,
  RemoteExportOptionsWrapper,
  Service,
} from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { saveAs } from 'file-saver';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { ServiceModeService } from '@services/service-mode.service';
import { serviceToGroup } from '@common/utils/common.utils';
import { RuleDetailModalService } from '@components/groups/partial/rule-detail-modal/rule-detail-modal.service';
import { ExportOptionsModalComponent } from '@components/export-options-modal/export-options-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TitleCasePipe } from '@angular/common';
import { GlobalVariable } from '@common/variables/global.variable';
import { FederatedConfigurationService } from '@services/federated-configuration.service';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import * as $ from 'jquery';


@Component({
  standalone: false,
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
  providers: [TitleCasePipe],
  
})
export class GroupsComponent implements OnInit, OnDestroy {
  @Input() isScoreImprovement: boolean = false;
  @Input() isExposure: boolean = false;
  @Input() source!: string;
  @Input() height!: number;
  @Input() linkedGroup!: string;
  @Input() isShowingSystemGroups: boolean = true;
  @Output() selectedGroup = new EventEmitter<Group | null>();
  @Output() refreshing = new EventEmitter<boolean>();
  isRefreshing: boolean = false;
  groups: Array<Group> = [];
  groupsErr: boolean = false;
  eof: boolean = false;
  isWriteGroupAuthorized: boolean = false;
  isNamespaceUser: boolean = false;
  gridOptions4Groups!: GridOptions;
  gridApi!: GridApi;
  filtered: boolean = false;
  filteredCount!: number;
  selectedGroups: Array<Group> = [];
  context = { componentParent: this };
  hasModeCapGroups: boolean = false;
  hasScoredCapGroups: boolean = false;
  allScorable: boolean = false;
  someScorable: boolean = false;
  hasNonScorable: boolean = false;
  hasNonScorableMsg: string = '';
  preselectedGroupName: string = '';
  navFrom: string = '';
  baselineProfile!: ProfileBaseline | '';
  isAllProtectMode!: boolean;
  navSource = GlobalConstant.NAV_SOURCE;
  serverErrorMessage: SafeHtml = '';
  get groupsCount() {
    return this.groups.length;
  }

  constructor(
    private utils: UtilsService,
    private groupsService: GroupsService,
    private serviceModeService: ServiceModeService,
    private notificationService: NotificationService,
    private authUtilsService: AuthUtilsService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private utilsService: UtilsService,
    private route: ActivatedRoute,
    private ruleDetailModalService: RuleDetailModalService,
    private domSanitizer: DomSanitizer,
    private titleCasePipe: TitleCasePipe,
    public federatedConfigurationService: FederatedConfigurationService
  ) {}

  ngOnInit(): void {
    this.isWriteGroupAuthorized =
      this.source === this.navSource.FED_POLICY
        ? this.authUtilsService.getDisplayFlag('write_group') &&
          this.authUtilsService.getDisplayFlag('multi_cluster_w')
        : this.authUtilsService.getDisplayFlag('write_group');
    this.isNamespaceUser = this.authUtilsService.userPermission.isNamespaceUser;
    this.route.paramMap.pipe().subscribe(rep => {
      this.preselectedGroupName = String(rep.get('groupName'));
      this.navFrom = String(rep.get('from'));
      console.log('this.preselectedGroupName', this.preselectedGroupName);
    });
    this.gridOptions4Groups = this.groupsService.prepareGrid4Groups(
      this.isScoreImprovement,
      this.source === this.navSource.FED_POLICY
    );
    this.gridOptions4Groups.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
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
    this.gridOptions4Groups.getRowId = params => params.data.name;
    this.gridOptions4Groups.onSelectionChanged = () => {
      this.selectedGroups = [];
      setTimeout(() => {
        this.selectedGroups = this.gridApi!.getSelectedRows();
        this.selectedGroups = this.groups.filter(group =>
          this.selectedGroups.find(
            selectedGroup => selectedGroup.name === group.name
          )
        );
        this.gridApi!.redrawRows();
        this.highlightDisplayedGroup();
        this.selectedGroup.emit(
          this.selectedGroups.length > 0 ? this.selectedGroups[0] : null
        );
        this.hasModeCapGroups = this.selectedGroups.some(
          group => group.cap_change_mode
        );
        this.hasScoredCapGroups = this.selectedGroups.some(
          group => group.cap_scorable
        );
        this.allScorable =
          this.selectedGroups.filter(
            group => group.not_scored && group.cap_scorable
          ).length === 0;
        this.someScorable =
          this.selectedGroups.filter(group => !group.not_scored).length <
            this.selectedGroups.length &&
          this.selectedGroups.filter(group => !group.not_scored).length > 0;
        let nonScorableGroups = this.selectedGroups
          .filter(group => !group.cap_scorable)
          .map(group => group.name);
        this.hasNonScorable = nonScorableGroups.length > 0;
        this.hasNonScorableMsg = `${this.translate.instant(
          'group.SCORED_DISABLED'
        )}: ${nonScorableGroups}`;
        let counts = this.getModeCounts();
        this.baselineProfile = this.getDefaultBaseline(counts.baselineCount);
        if (this.source === GlobalConstant.NAV_SOURCE.FED_POLICY) {
          this.federatedConfigurationService.activeTabIndex4Group =
            this.federatedConfigurationService.activeTabIndex4Group || 0;
        } else {
          this.groupsService.activeTabIndex =
            this.groupsService.activeTabIndex || 0;
        }
      }, 0);
    };
    if (this.isScoreImprovement) {
      this.gridOptions4Groups.getRowId = params => params.data.name;
      this.gridOptions4Groups.rowClassRules = {
        'font-weight-bold': params =>
          this.selectedGroups.length > 0 &&
          params.data.name === this.selectedGroups[0].name,
      };
      this.getScoreImprovementGroups();
      this.serviceModeService.refreshEvent$.subscribe(refresh => {
        if (refresh) {
          if (refresh.all) {
            this.groups.forEach(g => (g.policy_mode = refresh.mode));
          }
          this.groups = [...this.groups];
          this.gridApi?.refreshCells({ force: true });
        }
      });
    } else {
      if (this.source === this.navSource.FED_POLICY) {
        this.getFedGroups();
      } else {
        this.getGroups();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.source === this.navSource.FED_POLICY) {
      this.ruleDetailModalService.ruleDialog?.close(false);
      this.ruleDetailModalService.isDialogOpen = false;
    }
  }

  getScoreImprovementGroups = () => {
    if (this.isExposure) {
      this.getExposureGroups();
    } else {
      this.getLocalGroups();
    }
  };

  getExposureGroups = () => {
    this.groups = [];
    this.groupsErr = false;
    this.groupsService.getServices().subscribe({
      next: services => {
        this.groups = services
          .map(service => {
            service.name =
              service.name === 'nodes' ? service.name : 'nv.' + service.name;
            return service;
          })
          .filter(
            service => service.ingress_exposure || service.egress_exposure
          )
          .map(service => serviceToGroup(service));
        this.isAllProtectMode =
          this.groups.filter(
            service =>
              service.policy_mode?.toLowerCase() !== 'protect' ||
              service.profile_mode?.toLowerCase() !== 'protect'
          ).length === 0;
        this.gridApi!.setGridOption(
          'rowData',
          this.groups.filter(p => !p.platform_role)
        );
        this.filteredCount = this.groups.length;
        this.setDefaultSelection();
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.groupsErr = true;
        this.notificationService.openError(
          error,
          this.translate.instant('general.UNFORMATTED_ERR')
        );
      },
    });
  };

  getLocalGroups = () => {
    this.groups = [];
    this.groupsErr = false;
    this.groupsService.getLocalGroups().subscribe({
      next: groups => {
        this.groups = groups.filter(g => g.cap_change_mode);
        this.isAllProtectMode =
          this.groups.filter(
            service =>
              service.policy_mode?.toLowerCase() !== 'protect' ||
              service.profile_mode?.toLowerCase() !== 'protect'
          ).length === 0;
        this.gridApi!.setGridOption(
          'rowData',
          this.groups.filter(g => !g.platform_role)
        );
        this.filteredCount = this.groups.length;
        this.setDefaultSelection();
      },
      error: ({ error }: { error: ErrorResponse }) => {
        this.groupsErr = true;
        this.notificationService.openError(
          error,
          this.translate.instant('general.UNFORMATTED_ERR')
        );
      },
    });
  };

  getGroups = () => {
    this.refreshing.emit(true);
    this.groups = [];
    this.groupsErr = false;
    this.utils.loadPagedDataFinalize(
      PathConstant.GROUP_URL,
      {
        start: 0,
        limit: MapConstant.PAGE.GROUPS,
        with_cap: true,
      },
      null,
      this.renderGroups,
      this.handleError,
      () => {
        this.refreshing.emit(false);
      },
      { isHardReloaded: true }
    );
  };

  getFedGroups = () => {
    this.isRefreshing = true;
    this.groups = [];
    this.groupsService.getFedGroupsData().subscribe({
      next: groups => {
        this.renderGroups(groups, { isHardReloaded: true });
      },
      error: ({ error }: { error: ErrorResponse }) => {},
      complete: () => {
        this.isRefreshing = false;
      },
    });
  };

  setDefaultSelection = () => {
    if (this.selectedGroups.length > 0) {
      this.gridApi!.getRowNode(this.selectedGroups[0].name)?.setSelected(true);
    } else {
      this.gridApi!.getDisplayedRowAtIndex(0)?.setSelected(true);
    }
  };

  openAddGroupModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditGroupModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        source: this.source,
        cfgType:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? GlobalConstant.CFG_TYPE.FED
            : GlobalConstant.CFG_TYPE.CUSTOMER,
        refresh:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? this.getFedGroups
            : this.getGroups,
      },
    });
  };

  toggleScorable = event => {
    console.log(event);
    let payload = {
      config: {
        services: this.selectedGroups
          .filter(group => group.cap_scorable)
          .map(group => {
            return group.name.indexOf('nv.') >= 0
              ? group.name.substring(3)
              : group.name;
          }),
        not_scored: !event.checked,
      },
    };

    this.groupsService.updateScorableData(payload).subscribe(
      response => {
        this.notificationService.open(
          this.translate.instant('service.SUBMIT_SCORABLE_OK')
        );
        this.getGroups();
      },
      error => {
        this.notificationService.openError(
          error.error,
          this.translate.instant('service.SUBMIT_SCORABLE_FAILED')
        );
      }
    );
  };

  openSwitchModeModal = () => {
    const switchModeDialogRef = this.dialog.open(SwitchModeModalComponent, {
      width: '80%',
      data: {
        selectedGroups: this.selectedGroups,
        groups: this.groups,
        refresh: this.getGroups,
      },
    });
  };

  switchServiceMode = (mode: PolicyMode, profileMode: PolicyMode) => {
    const forAll = this.selectedGroups.length === this.groups.length;
    this.serviceModeService.switchServiceMode(
      this.selectedGroups,
      forAll,
      mode,
      profileMode
    );
  };

  switchBaselineProfile = () => {
    const forAll = this.selectedGroups.length === this.groups.length;
    this.serviceModeService.switchBaselineProfile(
      this.selectedGroups,
      this.baselineProfile as ProfileBaseline
    );
  };

  exportGroups = () => {
    const dialogRef = this.dialog.open(ExportOptionsModalComponent, {
      width: '50%',
      disableClose: true,
      data: {
        page: 'group',
        source: this.source,
      },
    });

    dialogRef.afterClosed().subscribe((result: RemoteExportOptionsWrapper) => {
      if (result) {
        const {
          policy_mode,
          profile_mode,
          export_mode,
          use_name_referral,
          ...exportOptions
        } = result.export_options;
        this.exportUtil(
          export_mode,
          exportOptions,
          policy_mode,
          profile_mode,
          use_name_referral
        );
      }
    });
  };

  exportUtil(
    mode: string,
    option: RemoteExportOptions,
    policyMode: string,
    profileMode: string,
    useNameRef: boolean
  ) {
    if (mode === 'local') {
      let payload = {
        groups: this.selectedGroups.map(group => group.name),
        policy_mode: this.titleCasePipe.transform(policyMode),
        profile_mode: this.titleCasePipe.transform(profileMode),
        use_name_referral: useNameRef,
      };
      this.groupsService.exportGroupsConfigData(payload, this.source).subscribe(
        response => {
          let fileName = this.utilsService.getExportedFileName(response);
          let blob = new Blob([response.body || ''], {
            type: 'text/plain;charset=utf-8',
          });
          saveAs(blob, fileName);
        },
        error => {
          console.warn(error);
          this.notificationService.openError(
            error.error,
            this.translate.instant('group.dlp.msg.EXPORT_NG')
          );
        }
      );
    } else if (mode === 'remote') {
      let payload = {
        groups: this.selectedGroups.map(group => group.name),
        policy_mode: this.titleCasePipe.transform(policyMode),
        profile_mode: this.titleCasePipe.transform(profileMode),
        remote_export_options: option,
        use_name_referral: useNameRef,
      };
      this.groupsService.exportGroupsConfigData(payload, this.source).subscribe(
        response => {
          const responseObj = JSON.parse(response.body as string);
          this.notificationService.open(
            `${this.translate.instant(
              'group.dlp.msg.EXPORT_OK'
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
              ? this.translate.instant('group.dlp.msg.EXPORT_NG')
              : this.utils.getAlertifyMsg(error, '', false),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
    } else {
      return;
    }
  }

  openImportFedGroupsDialog = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.IMPORT_GROUP_FED_URL,
        importMsg: {
          success: this.translate.instant('group.IMPORT_OK'),
          error: this.translate.instant('setting.IMPORT_FAILED'),
        },
      },
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.getFedGroups();
      }, 500);
    });
  };

  onResize(): void {
    this.gridApi!.sizeColumnsToFit();
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.groupsCount;
  }

  renderGroups = (data, options) => {
    this.eof = data.length < MapConstant.PAGE.GROUPS;
    this.groups = options.isHardReloaded ? this.groups.concat(data) : data;
    if (!this.isShowingSystemGroups) {
      this.groups = this.groups.filter(function (item) {
        return !item.platform_role;
      });
    }
    console.log('this.groups', this.groups);
    this.gridApi!.setGridOption('rowData', this.groups);
    this.filteredCount = options.isHardReloaded
      ? this.groups.length
      : this.filteredCount;
    if (this.eof) this.refreshing.emit(false);
    console.log('this.linkedGroup:', this.linkedGroup);
    setTimeout(() => {
      this.gridApi!.sizeColumnsToFit();
      this.gridApi!.forEachNode((node, index) => {
        node.setSelected(false);
        if (this.selectedGroups.length === 1) {
          if (node.data.name === this.selectedGroups[0].name) {
            node.setSelected(true);
            this.gridApi!.ensureNodeVisible(node);
          }
        }
        if (this.linkedGroup) {
          if (this.linkedGroup === node.data.name) {
            node.setSelected(true);
            this.gridApi!.ensureNodeVisible(node);
          }
        }
      });
    }, 200);
  };

  private highlightDisplayedGroup = () => {
    if (!this.selectedGroups || this.selectedGroups.length === 0) return;
    let index = this.groups.findIndex(
      group => group.name === this.selectedGroups[0].name
    );
    let rowNode = this.gridApi!.getDisplayedRowAtIndex(index);
    let groupGridEl = document.querySelector(
      '#groups-grid .ag-center-cols-container'
    );
    if (groupGridEl) {
      Array.from(groupGridEl!.children).forEach((el, index) => {
        if (index === rowNode?.rowIndex) {
          el.classList.add('ag-row-highlight');
        } else {
          el.classList.remove('ag-row-highlight');
        }
      });
    }
  };

  private handleError = () => {
    this.groupsErr = true;
    this.renderGroups([], { isHardReloaded: true });
  };

  private getModeCounts = () => {
    let modeCountMap: Map<string, number> = new Map([
      ['discover', 0],
      ['monitor', 0],
      ['protect', 0],
    ]);
    let baselineCountMap: Map<string, number> = new Map([
      ['basic', 0],
      ['zerodrift', 0],
    ]);
    this.selectedGroups.forEach(group => {
      if (group.cap_change_mode) {
        modeCountMap.set(
          group.policy_mode!.toLowerCase(),
          modeCountMap.get(group.policy_mode!.toLowerCase())! + 1
        );
        baselineCountMap.set(
          group.baseline_profile.toLowerCase(),
          baselineCountMap.get(group.baseline_profile.toLowerCase())! + 1
        );
      }
    });
    return { modeCount: modeCountMap, baselineCount: baselineCountMap };
  };

  private getDefaultMode = (modeCount: Map<string, number>) => {
    let countSum = Array.from(modeCount.values()).reduce((a, b) => a + b);
    if (countSum == 0) return '';
    if (modeCount.get('monitor') == countSum) return 'monitor';
    if (modeCount.get('protect') == countSum) return 'protect';
    if (modeCount.get('discover') == countSum) return 'discover';
    else return '';
  };

  private getDefaultBaseline = (baselineCount: Map<string, number>) => {
    if (
      baselineCount.get('zero-drift') !== 0 &&
      baselineCount.get('basic') === 0
    ) {
      return 'zero-drift';
    } else if (
      baselineCount.get('zero-drift') === 0 &&
      baselineCount.get('basic') !== 0
    ) {
      return 'basic';
    } else {
      return '';
    }
  };
}
