import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { NetworkRulesService } from '@common/services/network-rules.service';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { PathConstant } from '@common/constants/path.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { NetworkRule } from '@common/types';
import { GridOptions, GridApi } from 'ag-grid-community';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { UpdateType } from '@common/types/network-rules/enum';
import { Subscription } from 'rxjs';
import { AddEditNetworkRuleModalComponent } from '@components/network-rules/partial/add-edit-network-rule-modal/add-edit-network-rule-modal.component';
import { MoveNetworkRulesModalComponent } from '@components/network-rules/partial/move-network-rules-modal/move-network-rules-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { arrayToCsv } from '@common/utils/common.utils';
import { saveAs } from 'file-saver';
import { switchMap, filter } from 'rxjs/operators';
import { Router, NavigationStart } from '@angular/router';
import { GroupsService } from '@services/groups.service';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import * as $ from 'jquery';


const READONLY_RULE_MODIFIED = 46;
const UNPROMOTABLE_ENDPOINT_PATTERN = new RegExp(/^Host\:*|^Workload\:*/);

@Component({
  standalone: false,
  selector: 'app-network-rules',
  templateUrl: './network-rules.component.html',
  styleUrls: ['./network-rules.component.scss'],
  
})
export class NetworkRulesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isScoreImprovement: boolean = false;
  @Input() source!: string;
  @Input() groupName!: string;
  @Input() resizableHeight!: number;
  @Input() useQuickFilterService: boolean = false;

  refreshing$ = new Subject();
  navSource = GlobalConstant.NAV_SOURCE;
  eof = false;
  networkRuleErr = false;
  networkRules: Array<NetworkRule> = [];
  countOfGroundRule: number = 0;
  isWriteNetworkRuleAuthorized!: boolean;
  networkRuleOptions: any;
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  gridHeight!: number;
  filtered: boolean = false;
  filteredCount: number = 0;
  selectedNetworkRules: Array<NetworkRule> = [];
  containsUnpromotableEndpoint: boolean = false;
  context = { componentParent: this };
  routeEventSubscription!: Subscription;
  isWriteGlobalRulesAuthorized: boolean = false;
  isPrinting: boolean = false;
  isIncludingCRD: boolean = false;
  isIncludingFed: boolean = false;
  readonlyNotificationMsgs: any;
  ruleCount: number = 0;
  private w: any;
  private switchClusterSubscription;
  @ViewChild('networkRulePrintableReport') printableReportView!: ElementRef;
  @ViewChild('readonlyNotification') notificationTemplate;

  constructor(
    private networkRulesService: NetworkRulesService,
    private groupsService: GroupsService,
    private authUtilsService: AuthUtilsService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private datePipe: DatePipe,
    private utils: UtilsService,
    private multiClusterService: MultiClusterService,
    public router: Router,
    private quickFilterService: QuickFilterService,
    private notificationService: NotificationService
  ) {
    this.w = GlobalVariable.window;
  }

  ngOnInit(): void {
    this.isWriteGlobalRulesAuthorized =
      this.authUtilsService.getDisplayFlag('write_network_rule');
    this.bindRouteEventListener();
    this.gridHeight =
      this.w.innerHeight -
      (this.source === GlobalConstant.NAV_SOURCE.SELF ? 245 : 300);
    this.isWriteNetworkRuleAuthorized =
      this.authUtilsService.getDisplayFlag('write_network_rule') &&
      (this.source !== GlobalConstant.NAV_SOURCE.GROUP &&
      this.source !== GlobalConstant.NAV_SOURCE.SELF
        ? this.authUtilsService.getDisplayFlag('multi_cluster_w')
        : true);
    this.gridOptions = this.networkRulesService.configGrid(
      this.isWriteNetworkRuleAuthorized,
      this.source,
      this.isScoreImprovement
    );
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
    this.gridOptions.onSelectionChanged = () => {
      this.selectedNetworkRules = this.gridApi!.getSelectedRows();
      this.isIncludingCRD = this.selectedNetworkRules.some(rule => {
        return rule.cfg_type === GlobalConstant.CFG_TYPE.GROUND;
      });
      this.isIncludingFed = this.selectedNetworkRules.some(rule => {
        return (
          rule.cfg_type === GlobalConstant.CFG_TYPE.FED &&
          this.source === GlobalConstant.NAV_SOURCE.SELF
        );
      });
      this.containsUnpromotableEndpoint = this.selectedNetworkRules.some(
        rule => {
          return (
            UNPROMOTABLE_ENDPOINT_PATTERN.test(rule.from) ||
            UNPROMOTABLE_ENDPOINT_PATTERN.test(rule.to)
          );
        }
      );
    };
    if (!this.isScoreImprovement) {
      this.networkRulesService.getAutoCompleteData(this.source).subscribe(
        ([groupList, hostList, appList]) => {
          this.networkRuleOptions = {
            groupList,
            hostList,
            appList,
          };
        },
        error => {
          console.error(error);
        }
      );
    }
    this.refresh();

    //refresh the page when it switched to a remote cluster
    this.switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.refresh();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.groupName &&
      changes.groupName.previousValue &&
      changes.groupName.previousValue !== changes.groupName.currentValue
    ) {
      this.refresh();
    }
  }

  ngOnDestroy(): void {
    this.unbindRouteEventListener();

    if (this.switchClusterSubscription) {
      this.switchClusterSubscription.unsubscribe();
    }
  }

  refresh = () => {
    this.refreshing$.next(true);
    this.selectedNetworkRules = [];
    if (
      this.source === GlobalConstant.NAV_SOURCE.GROUP ||
      this.source === GlobalConstant.NAV_SOURCE.FED_GROUP
    ) {
      if (this.isScoreImprovement) this.getServiceRules();
      else this.getGroupPolicy();
    } else {
      this.getNetworkRules();
    }
  };

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.ruleCount;
  }

  updateGridData = (
    updatedNetworkRules: Array<NetworkRule>,
    targetIndex: number,
    updateType: UpdateType,
    targetId: number = 0
  ) => {
    switch (updateType) {
      case UpdateType.AddToTop:
        this.insertRule(updatedNetworkRules[0], -1);
        break;
      case UpdateType.Insert:
        this.insertRule(updatedNetworkRules[0], targetIndex);
        break;
      case UpdateType.Edit:
        this.replaceRule(updatedNetworkRules[0], targetIndex);
        break;
      case UpdateType.MoveBefore:
        this.moveRules(updatedNetworkRules, targetId, updateType);
        break;
      case UpdateType.MoveAfter:
        this.moveRules(updatedNetworkRules, targetId, updateType);
        break;
    }
  };

  isNetworkRuleDirty = (): Boolean => {
    return this.networkRulesService.isNetworkRuleChanged;
  };

  addNetworkRuleToTop = () => {
    this.dialog.open(AddEditNetworkRuleModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        networkRuleOptions: this.networkRuleOptions,
        index: -1,
        source: this.source,
        cfgType:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? GlobalConstant.SCOPE.FED
            : GlobalConstant.SCOPE.LOCAL,
        updateGridData: this.updateGridData,
      },
    });
  };

  openMoveNetworkRulesModal = () => {
    this.dialog.open(MoveNetworkRulesModalComponent, {
      width: '450px',
      data: {
        selectedNetworkRules: this.selectedNetworkRules,
        networkRules: this.networkRules,
        updateGridData: this.updateGridData,
      },
    });
  };

  promoteRuleOnTop = () => {
    let payload = {
      request: {
        ids: this.selectedNetworkRules.map(rule => rule.id),
      },
    };
    this.networkRulesService.promoteNetworkRulesData(payload).subscribe(
      () => {
        this.notificationService.open(
          this.translate.instant('policy.message.PROMOTE_OK')
        );
        setTimeout(() => {
          this.refresh();
        }, 2000);
      },
      error => {
        this.notificationService.openError(
          error.error,
          this.translate.instant('policy.message.PROMOTE_NG')
        );
      }
    );
  };

  removeNetworkRules = () => {
    let ids = this.selectedNetworkRules
      .map(rule => rule.id)
      .filter(id => id !== -1);
    let idsMsg = ids.map(id => {
      return id >= GlobalConstant.NEW_ID_SEED.NETWORK_RULE
        ? `New-${id - GlobalConstant.NEW_ID_SEED.NETWORK_RULE + 1}`
        : id;
    });
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: `${this.translate.instant(
          'policy.dialog.REMOVE'
        )} ${idsMsg.join(', ')}`,
        isSync: true,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.maskingDeletedRows(ids);
      }
    });
  };

  private getServiceRules = () => {
    let httpService = '';
    if (this.groupName === 'nodes') {
      httpService = 'getGroupInfo';
    } else {
      httpService = 'getService';
    }
    this.groupsService[httpService](this.groupName)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe({
        next: service => {
          this.ruleCount = service.policy_rules.length;
          this.gridApi!.setGridOption('rowData', service.policy_rules);
        },
        error: err => {
          console.warn(err);
          if (err.status !== GlobalConstant.STATUS_NOT_FOUND) {
            this.gridOptions.overlayNoRowsTemplate =
              this.utils.getOverlayTemplateMsg(err);
          }
          this.ruleCount = 0;
          this.gridApi!.setGridOption('rowData', []);
        },
      });
  };

  private getGroupPolicy = () => {
    this.groupsService
      .getGroupInfo(this.groupName)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        (response: any) => {
          this.ruleCount = response.policy_rules.length;
          this.gridApi!.setGridOption('rowData', response.policy_rules);
        },
        error => {
          console.error(error);
        }
      );
  };

  private getNetworkRules = () => {
    this.eof = false;
    this.networkRulesService.isNetworkRuleChanged = false;
    this.networkRuleErr = false;
    this.networkRules = [];
    this.createRuleWorker();
    this.utils.loadPagedData(
      PathConstant.POLICY_URL,
      this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? {
            start: 0,
            limit: MapConstant.PAGE.NETWORK_RULES,
            scope: GlobalConstant.SCOPE.FED,
          }
        : {
            start: 0,
            limit: MapConstant.PAGE.NETWORK_RULES,
          },
      null,
      this.mergeRulesByWebWorkerClient,
      this.handleError
    );
  };

  submit = () => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('policy.POLICY_DEPLOY_CONFIRM'),
      },
    });
    // listen to confirm subject
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.networkRulesService.submitNetworkRule(
            this.networkRules,
            this.source
          );
        })
      )
      .subscribe(
        res => {
          console.log(res);
          this.notificationService.open(
            this.translate.instant('policy.dialog.content.SUBMIT_OK')
          );
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
          // confirm actions
          setTimeout(() => {
            this.gridApi!.deselectAll();
            this.networkRulesService.squence =
              GlobalConstant.NEW_ID_SEED.NETWORK_RULE;
            this.getNetworkRules();
          }, 2000);
        },
        error => {
          console.log('error', error);
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            if (
              error.status === 400 &&
              error.error &&
              error.error.code === READONLY_RULE_MODIFIED
            ) {
              this.notificationService.open(
                `${this.utils.getAlertifyMsg(
                  error,
                  this.translate.instant('policy.dialog.content.SUBMIT_NG'),
                  false
                )} -
                Read-only rule ID is: ${error.error.read_only_rule_ids.join(
                  ', '
                )}.\n
                You can click revert button on the rule to rollback your change.`,
                GlobalConstant.NOTIFICATION_TYPE.ERROR
              );
              // this.readonlyNotificationMsgs =
              //   `${this.utils.getAlertifyMsg(error, this.translate.instant("policy.dialog.content.SUBMIT_NG"), false)}<br/>
              //   Read-only rule ID is: ${error.error.read_only_rule_ids.join(", ")}<br/>
              //   You can click revert button on the rule to rollback your change.`;
              // this.notificationService.openHtmlError(this.readonlyNotificationMsgs, this.notificationTemplate);
              this.changeState4ReadOnlyRules(error.error.read_only_rule_ids);
            } else {
              this.notificationService.openError(
                error.error,
                this.translate.instant('policy.dialog.content.SUBMIT_NG')
              );
            }
            dialogRef.componentInstance.onCancel();
            dialogRef.componentInstance.loading = false;
          }
        }
      );
  };

  exportCsv = () => {
    let reportData: Array<any> = [];
    this.gridApi!.forEachNodeAfterFilterAndSort((node, index) => {
      if (node.data.id > 0) {
        reportData.push({
          sequence: index + 1,
          id: node.data.id,
          comment: node.data.comment,
          from: node.data.from,
          to: node.data.to,
          applications: node.data.applications,
          ports: node.data.ports,
          action: node.data.action,
          type: MapConstant.DISPLAY_CFG_TYPE_MAP[
            node.data.cfg_type.toLowerCase()
          ],
          status: node.data.disable ? 'disabled' : 'enabled',
          updated_at: this.datePipe.transform(
            node.data.last_modified_timestamp * 1000,
            'MMM dd, y HH:mm:ss'
          ),
        });
      }
    });

    let csv = arrayToCsv(reportData);
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(
      blob,
      `Network_rules_Reports_${this.utils.parseDatetimeStr(new Date())}.csv`
    );
  };

  print = () => {
    this.isPrinting = true;
    setInterval(() => {
      if (this.printableReportView) {
        window.print();
        this.isPrinting = false;
      }
    }, 500);
  };

  private createRuleWorker = () => {};

  private changeState4ReadOnlyRules = readOnlyruleIds => {
    readOnlyruleIds.forEach(readOnlyruleId => {
      let index = this.networkRules.findIndex(
        rule => rule.id === readOnlyruleId
      );
      this.networkRules[index].state =
        GlobalConstant.NETWORK_RULES_STATE.READONLY;
    });
    console.log('this.networkRules', this.networkRules);
    this.ruleCount = this.networkRules.length;
    this.gridApi!.setGridOption('rowData', this.networkRules);
  };

  private mergeRulesByWebWorkerClient = (rulesBlock: Array<any>) => {
    let eof = rulesBlock.length < MapConstant.PAGE.NETWORK_RULES;
    this.networkRules = this.networkRules.concat(rulesBlock);
    this.networkRulesService.networkRuleBackup = JSON.parse(
      JSON.stringify(this.networkRules)
    );
    this.renderNetworkRule(this.networkRules, eof);
  };

  private handleError = () => {
    this.networkRuleErr = true;
    this.renderNetworkRule([], true);
  };

  private renderNetworkRule = (networkRules, eof) => {
    this.eof = eof;
    if (networkRules.some(row => row.id === -1)) {
      networkRules.pop();
    }
    if (this.eof) {
      networkRules.push({
        id: -1,
        from: this.translate.instant('policy.DEFAULT_RULE'),
        to: '',
        application: [],
        ports: '',
        action: '',
        last_modified_timestamp: '',
      });
    }
    this.ruleCount = networkRules.length;
    this.gridApi!.setGridOption('rowData', networkRules);
    if (this.eof) this.refreshing$.next(false);
  };

  private insertRule = (
    updatedNetworkRule: NetworkRule,
    targetIndex: number
  ) => {
    this.networkRules.splice(targetIndex, 0, updatedNetworkRule);
    this.networkRulesService.isNetworkRuleChanged = true;
    setTimeout(() => {
      this.ruleCount = this.networkRules.length;
      this.gridApi!.setGridOption('rowData', this.networkRules);
      // this.gridApi!.redrawRows();
      this.gridApi!.ensureIndexVisible(targetIndex, 'top');
    }, 500);
  };

  private replaceRule = (
    updatedNetworkRule: NetworkRule,
    targetIndex: number
  ) => {
    this.networkRules.splice(targetIndex, 1, updatedNetworkRule);
    let row = this.gridApi!.getDisplayedRowAtIndex(targetIndex)!;
    this.gridApi!.setGridOption('rowData', this.networkRules);
    this.networkRulesService.isNetworkRuleChanged = true;
    setTimeout(() => {
      this.gridApi!.ensureIndexVisible(targetIndex, 'top');
    }, 500);
  };

  private moveRules = (
    selectedNetworkRules: Array<NetworkRule>,
    targetId: number,
    moveType: UpdateType
  ) => {
    let selectedRuleId = selectedNetworkRules.map(rule => rule.id);
    let networkRulesTmp = this.networkRules.filter(rule => {
      return !selectedRuleId.includes(rule.id);
    });
    let targetIndex = networkRulesTmp.findIndex(rule => rule.id === targetId);
    if (moveType === UpdateType.MoveBefore) {
      networkRulesTmp.splice(targetIndex, 0, ...selectedNetworkRules);
    } else {
      networkRulesTmp.splice(targetIndex + 1, 0, ...selectedNetworkRules);
    }
    this.networkRules = networkRulesTmp;
    this.ruleCount = this.networkRules.length;
    this.gridApi!.setGridOption('rowData', this.networkRules);
    // this.gridApi!.redrawRows();
    this.networkRulesService.isNetworkRuleChanged = true;
    this.selectedNetworkRules = [];
  };

  private maskingDeletedRows = (ids: Array<number>) => {
    let index = 0;
    this.networkRules = this.networkRules.map(rule => {
      if (rule.id === ids[index] && rule.id !== -1) {
        rule.remove = true;
        index++;
      }
      return rule;
    });
    this.ruleCount = this.networkRules.length;
    this.gridApi!.setGridOption('rowData', this.networkRules);
    // this.gridApi!.redrawRows();
    this.networkRulesService.isNetworkRuleChanged = true;
  };

  private bindRouteEventListener = () => {
    const currentRoute = this.router.routerState;
    if (!this.routeEventSubscription) {
      this.routeEventSubscription = this.router.events
        .pipe(
          filter((event): event is NavigationStart => {
            return (
              event instanceof NavigationStart &&
              `#${currentRoute.snapshot.url}` === location.hash
            );
          })
        )
        .subscribe(() => {
          if (
            this.isNetworkRuleDirty() &&
            !confirm(this.translate.instant('policy.dialog.reminder.MESSAGE'))
          ) {
            this.router.navigateByUrl(currentRoute.snapshot.url, {
              skipLocationChange: true,
            });
          }
        });
    }
  };

  private unbindRouteEventListener = () => {
    this.routeEventSubscription.unsubscribe();
  };
}
