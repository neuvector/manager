import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { GraphService } from '../graph.service';
import {
  ActivityState,
  PopupState,
} from '@common/types/network-activities/activityState';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { BehaviorSubject } from 'rxjs';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { SecurityEventsService } from '@services/security-events.service';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalConstant } from '@common/constants/global.constant';

export interface ConversationPair {
  from: string;
  to: string;
}

@Component({
  standalone: false,
  selector: 'app-edge-details',
  templateUrl: './edge-details.component.html',
  styleUrls: ['./edge-details.component.scss'],
})
export class EdgeDetailsComponent implements AfterViewInit, OnInit, OnChanges {
  get edgeDetails(): any {
    return this._edgeDetails;
  }

  @Input()
  set edgeDetails(value: any) {
    this._edgeDetails = value;
  }
  isWriteNetworkAuthorized: boolean = false;
  rule: any;
  onRule: boolean = false;

  get entriesGridHeight(): number {
    return this._entriesGridHeight;
  }
  @ViewChildren('conversationDetail') edgeView!: QueryList<ElementRef>;
  @ViewChildren('entriesGridHeight') heightView!: QueryList<ElementRef>;

  private resizeSubject$ = new BehaviorSubject<boolean>(true);
  resize$ = this.resizeSubject$.asObservable();

  private _conversationDetail: any;

  gridOptions;
  gridApi!: GridApi;
  traffic: any;
  showRuleId: boolean = false;
  isRuleAccessible: boolean = false;
  ruleId: string = '';
  sessionCount: string = '';
  onThreat: boolean = false;
  onViolation: boolean = false;
  context = { componentParent: this };

  entries;
  private _entriesGridHeight: number = 0;

  _popupState: ActivityState;
  private _edgeDetails: any;

  get popupState() {
    return this._popupState;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  @Output()
  doClearSession: EventEmitter<ConversationPair> =
    new EventEmitter<ConversationPair>();

  constructor(
    private authUtilsService: AuthUtilsService,
    private securityEventsService: SecurityEventsService,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private graphService: GraphService,
    private cd: ChangeDetectorRef
  ) {
    this._popupState = new ActivityState(PopupState.onInit);
  }

  ngAfterViewInit(): void {
    this.resize$.subscribe(() => {
      if (this.gridApi) {
        this.gridApi.sizeColumnsToFit();
        this.cd.markForCheck();
      }
    });
  }

  get conversationDetail() {
    return this._conversationDetail;
  }

  @Input()
  set conversationDetail(value) {
    this._conversationDetail = value;
  }

  @Input()
  set entriesGridHeight(value) {
    this._entriesGridHeight = value;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.conversationDetail) {
      this.prepareGridData();
      setTimeout(() => {
        let nodes = this.gridApi.getRenderedNodes();
        if (nodes.length) {
          nodes[0].setSelected(true); //selects the first row in the rendered view
        }
      }, 500);
    }
    this.sessionCount = '';
    this.onRule = false;
    this.onThreat = false;
    this.onViolation = false;
  }

  ngOnInit() {
    this.isWriteNetworkAuthorized =
      this.authUtilsService.getDisplayFlag('write_network_rule');
    this.gridOptions = this.graphService.prepareTrafficHistoryGrid(
      this._conversationDetail
    );
    this.gridOptions.onGridReady = event => this.onGridReady(event);
    this.gridOptions.onSelectionChanged = () => {
      this.onTrafficChanged();
    };
    this.sessionCount = '';
    this.onThreat = false;
    this.onViolation = false;
  }

  private prepareGridData() {
    const ELEM_CONV_HISTORY = document.getElementById('conversationHistory');
    // this.entriesGridHeight = Math.max(
    //   this.entriesGridHeight,
    //   ELEM_CONV_HISTORY!.clientHeight - 130
    // );
    // this.convHisGridOptions.api.resetRowHeights();
    let ipList: any[] = this._conversationDetail.entries.flatMap(entry => {
      let ips: any[] = [];
      if (entry.client_ip) {
        ips.push(entry.client_ip);
      }
      if (entry.server_ip) {
        ips.push(entry.server_ip);
      }
      return ips;
    });
    this.graphService.getIpMap(ipList).subscribe(response => {
      let ipMap = response['ip_map'];
      this._conversationDetail.entries = this._conversationDetail.entries.map(
        entry => {
          if (entry.client_ip) {
            entry.client_ip_location = ipMap[entry.client_ip];
          }
          if (entry.server_ip) {
            entry.server_ip_location = ipMap[entry.server_ip];
          }
          return entry;
        }
      );
      this.gridApi.setGridOption('rowData', this._conversationDetail.entries);
    });
  }
  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    setTimeout(() => {
      this.gridApi.forEachNode(node =>
        node.rowIndex ? 0 : node.setSelected(true)
      );
      this.gridApi.sizeColumnsToFit();
      this.cd.markForCheck();
    }, 500);
  }

  onTrafficChanged() {
    let selectedRows = this.gridApi.getSelectedRows();
    this.traffic = selectedRows[0];
    this.showRuleId = true;
    this.ruleId = this.traffic.policy_id;

    this.sessionCount =
      this.traffic.sessions + '/' + this.conversationDetail.sessions;
    this.onThreat = !!this.traffic.severity;
    this.onViolation =
      this.traffic.policy_action === 'violate' ||
      this.traffic.policy_action === 'deny';
    this.graphService.keepLive();
    if (this.traffic.policy_id !== 0) {
      this.showRule(this.traffic.policy_id);
    } else {
      this.isRuleAccessible = true;
    }
  }

  onFilterChanged(value) {
    this.graphService.keepLive();
    this.gridApi.setQuickFilter(value);
  }

  clearSessions(from, to) {
    this.doClearSession.emit({ from: from, to: to });
  }

  overrideRule(traffic, edgeDetails) {
    if (traffic.policy_id === 0) this.proposeRule(traffic, edgeDetails);
    this.onRule = true;
  }

  closeRuleDetail() {
    this.onRule = false;
    this.graphService.keepLive();
  }

  updateRule(rule) {
    if (rule.id === 0) {
      let action = 'deny';
      if (rule.allowed) action = 'allow';

      rule.action = action;
      this.securityEventsService.updateNetworkRule(rule).subscribe(
        () => {
          this.onRule = false;
        },
        err => {
          console.warn(err);
          this.notificationService.open(
            this.utils.getAlertifyMsg(
              err,
              this.translate.instant('network.RULE_DEPLOY_FAILED'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
    } else {
      let action = 'deny';
      if (rule.allowed) action = 'allow';

      this.securityEventsService
        .updateNetworkRuleAction(rule.id, action)
        .subscribe(
          () => {
            this.onRule = false;
          },
          err => {
            console.warn(err);
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                err,
                this.translate.instant('network.RULE_DEPLOY_FAILED'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        );
    }
  }

  private showRule(id) {
    this.securityEventsService.getNetworkRule(id).subscribe(
      response => {
        this.rule = response;
        this.rule.allowed = this.rule.action === 'allow';
        this.isRuleAccessible = true;
      },
      err => {
        console.warn(err);
        this.isRuleAccessible = false;
        this.onRule = false;
      }
    );
  }

  private proposeRule(traffic, edgeDetails) {
    const UNMANAGED_NODE = ['workloadIp', 'nodeIp'];

    this.rule = {};

    this.rule.id = 0;
    if (
      edgeDetails.fromGroup &&
      UNMANAGED_NODE.indexOf(edgeDetails.fromGroup) > -1
    )
      this.rule.from = edgeDetails.source;
    else this.rule.from = edgeDetails.fromGroup;
    if (edgeDetails.toGroup && UNMANAGED_NODE.indexOf(edgeDetails.toGroup) > -1)
      this.rule.to = edgeDetails.target;
    else this.rule.to = edgeDetails.toGroup;
    this.rule.ports = traffic.port;
    if (traffic.application)
      this.rule.applications = traffic.application.split(',');
    else this.rule.applications = ['any'];
    this.rule.learned = false;
    this.rule.comment = '';
    this.onRule = true;
    this.rule.action = traffic.policy_action;
    this.rule.allowed = traffic.policy_action === 'allow';
    this.rule.disable = false;
    this.graphService.keepLive();
  }
}
