import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
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

@Component({
  selector: 'app-edge-details',
  templateUrl: './edge-details.component.html',
  styleUrls: ['./edge-details.component.scss'],
})
export class EdgeDetailsComponent implements AfterViewInit, OnInit {
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
  ruleId: string = '';
  sessionCount: string = '';
  onThreat: boolean = false;
  onViolation: boolean = false;

  entries;
  private _entriesGridHeight: number = 0;

  _popupState: ActivityState;

  get popupState() {
    return this._popupState;
  }

  @Input()
  set popupState(value: ActivityState) {
    this._popupState = value;
  }

  constructor(
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

  ngOnInit() {
    this.prepareGridData();
    this.gridOptions = this.graphService.prepareTrafficHistoryGrid(
      this._conversationDetail
    );
    this.gridOptions.onGridReady = event => this.onGridReady(event);
    this.gridOptions.onSelectionChanged = () => {
      this.onTrafficChanged();
    };
  }

  private prepareGridData = () => {
    const ELEM_CONV_HISTORY = document.getElementById('conversationHistory');
    this.entriesGridHeight = Math.max(
      this.entriesGridHeight,
      ELEM_CONV_HISTORY!.clientHeight - 130
    );
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
    });
  };

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );
    this.cd.markForCheck();
  }

  onTrafficChanged = () => {
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
  };

  onFilterChanged = value => {
    this.graphService.keepLive();
    this.gridApi.setQuickFilter(value);
  };
}
