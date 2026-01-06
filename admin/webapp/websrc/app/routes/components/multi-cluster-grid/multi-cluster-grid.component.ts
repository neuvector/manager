import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  SecurityContext,
} from '@angular/core';
import { Cluster, ClusterData } from '@common/types';
import { MultiClusterService } from '@services/multi-cluster.service';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
  ColDef,
  FirstDataRenderedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
  RowSelectedEvent,
} from 'ag-grid-community';
import { Subject } from 'rxjs';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { MultiClusterGridActionCellComponent } from '@components/multi-cluster-grid/multi-cluster-grid-action-cell/multi-cluster-grid-action-cell.component';
import { finalize, takeWhile } from 'rxjs/operators';
import { interval } from 'rxjs';
import { GlobalConstant } from '@common/constants/global.constant';
import { NotificationService } from '@services/notification.service';


type Task = {
  index: number;
  rowNode: IRowNode;
  cluster: Cluster;
};

@Component({
  standalone: false,
  selector: 'app-multi-cluster-grid',
  templateUrl: './multi-cluster-grid.component.html',
  styleUrls: ['./multi-cluster-grid.component.scss'],
  
})
export class MultiClusterGridComponent implements OnInit, OnDestroy {
  private readonly $win;
  private _activeTaskNum: number = 0;
  private _taskQueue: Task[] = [];
  private _finishedNum: number = 0;
  private _getSummarySubscription;
  private rowData: Cluster[] = [];
  @Input() clusterData!: ClusterData;
  @Input() gridHeight: number = 200;
  isMasterRole;
  isMemberRole;
  isActionAuthorized: boolean = false;
  refreshing$ = new Subject();
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      headerName: this.translate.instant('multiCluster.grid.name'),
      field: 'name',
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
      },
      width: 110,
    },
    {
      headerName: this.translate.instant('multiCluster.grid.type'),
      field: 'clusterType',
      cellRenderer: params => {
        return this.typeRenderFunction(params);
      },
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
      },
      width: 70,
      minWidth: 60,
    },
    {
      headerName: this.translate.instant('multiCluster.grid.server'),
      field: 'api_server',
      width: 100,
    },
    {
      headerName: this.translate.instant('multiCluster.grid.port'),
      field: 'api_port',
      width: 80,
    },
  ];
  majorSummaryColumn = [
    {
      headerName: this.translate.instant('dashboard.summary.HOST'),
      field: 'hosts',
      cellRenderer: params => {
        return this.hostRenderFunction(params);
      },
      width: 60,
    },
    {
      headerName: this.translate.instant('multiCluster.summary.RUNNING_POD'),
      field: 'running_pods',
      cellRenderer: params => {
        return this.podRenderFunction(params);
      },
      width: 90,
    },
    {
      headerName: this.translate.instant('audit.gridHeader.CVE_DB_VERSION'),
      field: 'cvedb_version',
      cellRenderer: params => {
        return this.versionRenderFunction(params);
      },
      width: 90,
    },
    {
      headerName: this.translate.instant('multiCluster.grid.score'),
      field: 'score',
      cellRenderer: params => {
        return this.scoreRenderFunction(params);
      },
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
      },
      width: 100,
    },
    {
      headerName: this.translate.instant('multiCluster.grid.status'),
      field: 'status',
      cellRenderer: params => {
        return this.statusRenderFunction(params);
      },
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
      },
      width: 90,
    },
    {
      headerName: '',
      field: 'component_versions',
      hide: true,
    },
  ];

  statusColumn = [
    {
      headerName: this.translate.instant('multiCluster.grid.status'),
      field: 'status',
      cellRenderer: params => {
        return this.statusRenderFunction(params);
      },
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
      },
      width: 70,
      minWidth: 60,
    },
  ];

  actionColumn = {
    headerName: this.translate.instant('multiCluster.grid.action'),
    cellRenderer: MultiClusterGridActionCellComponent,
    cellClass: ['grid-right-align'],
    width: 120,
    maxWidth: 120,
    minWidth: 120,
  };

  filtered: boolean = false;
  filteredCount: number = 0;
  context;
  hasDiffManager: boolean = false;
  pendingTaskNum: number = 0;

  get clusterCount() {
    return this.clusterData.clusters!.length;
  }

  get taskQueue(): Task[] {
    return this._taskQueue;
  }

  set taskQueue(value: Task[]) {
    this._taskQueue = value;
  }

  get finishedNum(): number {
    return this._finishedNum;
  }

  set finishedNum(value: number) {
    if (value === this.clusterCount && this.pendingTaskNum === 0) {
      let componentVersions = this.rowData
        .map(data => data.component_versions)
        .flatMap(data => data);
      this.hasDiffManager = componentVersions.some(
        ver => ver !== componentVersions[0]
      );
      if (this.hasDiffManager) {
        this.notificationService.open(
          this.translate.instant('multiCluster.HAS_INCOMPATIBLE_VERSION'),
          GlobalConstant.NOTIFICATION_TYPE.WARNING
        );
      }
    }
    this._finishedNum = value;
  }

  constructor(
    public multiClusterService: MultiClusterService,
    private translate: TranslateService,
    private utils: UtilsService,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.initGrid();
  }

  ngOnDestroy() {
    if (this._getSummarySubscription) {
      this._getSummarySubscription.unsubscribe();
    }
  }

  initGrid() {
    // login as a master
    this.isMasterRole =
      this.clusterData.fed_role === MapConstant.FED_ROLES.MASTER;

    // login as a member
    this.isMemberRole =
      this.clusterData.fed_role === MapConstant.FED_ROLES.MEMBER;

    if (this.isMasterRole) {
      this.columnDefs = this.columnDefs.concat(this.majorSummaryColumn);
    }
    if (this.isMemberRole) {
      this.columnDefs = this.columnDefs.concat(this.statusColumn);
    }

    this.isActionAuthorized =
      GlobalVariable.user.roles.global === '2' ||
      GlobalVariable.user.roles.global === '4';

    if (this.isActionAuthorized) {
      this.columnDefs.push(this.actionColumn);
    }

    this.context = {
      componentParent: this,
    };

    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);

    this.gridOptions = {
      ...this.gridOptions,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      rowData: this.clusterData.clusters,
      onGridReady: event => this.onGridReady(event),
      onRowSelected: event => this.onRowSelected(event),
    };

    this._activeTaskNum = 0;
    this.pendingTaskNum = 0;
    this.finishedNum = 0;
  }

  updateSummaryForRow(rowNode: IRowNode, cluster: Cluster, index: number) {
    if (
      cluster.status === MapConstant.FED_STATUS.DISCONNECTED ||
      cluster.status === MapConstant.FED_STATUS.LEFT ||
      cluster.status === MapConstant.FED_STATUS.KICKED ||
      cluster.status === MapConstant.FED_STATUS.PENDING
    ) {
      this.updateRow4Error(rowNode, '');
      this._activeTaskNum--;
      this.pendingTaskNum--;
      this.finishedNum++;
    } else {
      const params =
        cluster.clusterType === MapConstant.FED_ROLES.MASTER
          ? { isGlobalUser: true }
          : { isGlobalUser: true, clusterId: cluster.id };
      //get summary
      this.multiClusterService.getMultiClusterSummary(params).subscribe(
        res => {
          this.updateRow4Success(index, rowNode, res);
          this._activeTaskNum--;
          this.pendingTaskNum--;
          this.finishedNum++;
        },
        error => {
          console.error(error);
          this.updateRow4Error(
            rowNode,
            this.translate.instant('multiCluster.messages.SCORE_UNAVAILIBlE')
          );
          this._activeTaskNum--;
          this.pendingTaskNum--;
          this.finishedNum++;
        }
      );
    }
  }

  updateSummaryForRows() {
    this.clusterData.clusters!.forEach((cluster, index) => {
      if (this.gridOptions && this.gridApi) {
        const rowNode = this.gridApi!.getDisplayedRowAtIndex(index);
        if (rowNode) {
          const task: Task = {
            index: index,
            rowNode: rowNode,
            cluster: cluster,
          };
          this._taskQueue.push(task);
          this.taskQueue = this._taskQueue;
        }
      }
    });

    // send maximum requests no more than current_limit when getting the summary info
    const limit = GlobalConstant.MULTICLUSTER_CONCURRENT_LIMIT;
    this._getSummarySubscription = interval(500)
      .pipe(
        takeWhile(() => {
          return this.taskQueue.length > 0;
        })
      )
      .subscribe(() => {
        while (this._activeTaskNum < limit && this.taskQueue.length > 0) {
          const task = this.taskQueue.shift();
          this.taskQueue = this._taskQueue;
          if (task) {
            this._activeTaskNum++;
            this.pendingTaskNum++;
            this.updateSummaryForRow(task.rowNode, task.cluster, task.index);
          }
        }
      });
  }

  getClusters(): void {
    this.multiClusterService
      .getClusters()
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(res => {
        this.multiClusterService.clusters = res;
      });
  }

  onRowSelected(params: RowSelectedEvent) {
    if (params.node.isSelected()) {
      this.multiClusterService.setSelectedCluster(params.data);
      this.updateSummaryForSelectedRow(
        params.node,
        params.data,
        params.node.rowIndex!
      );
    }
  }

  updateSummaryForSelectedRow(
    rowNode: IRowNode,
    cluster: Cluster,
    index: number
  ) {
    if (
      cluster.status === MapConstant.FED_STATUS.DISCONNECTED ||
      cluster.status === MapConstant.FED_STATUS.LEFT ||
      cluster.status === MapConstant.FED_STATUS.KICKED ||
      cluster.status === MapConstant.FED_STATUS.PENDING
    ) {
      this.updateRow4Error(rowNode, '');
    } else {
      const params =
        cluster.clusterType === MapConstant.FED_ROLES.MASTER
          ? { isGlobalUser: true }
          : { isGlobalUser: true, clusterId: cluster.id };
      //get summary
      this.multiClusterService.getMultiClusterSummary(params).subscribe(
        res => {
          this.updateRow4Success(index, rowNode, res);
          const hasSummaryDetail =
            res.summaryJson && res.summaryJson !== 'error';
          if (hasSummaryDetail) {
            const summaryDetail = JSON.parse(res.summaryJson).summary;
            this.multiClusterService.setSelectedClusterSummary(summaryDetail);
          }
        },
        error => {
          console.error(error);
          this.updateRow4Error(
            rowNode,
            this.translate.instant('multiCluster.messages.SCORE_UNAVAILIBlE')
          );
        }
      );
    }
  }

  onFirstDataRendered(params: FirstDataRenderedEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.setDefaultSelection();
  }

  setDefaultSelection(): void {
    if (this.gridApi) {
      this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
    }
  }

  onResize(): void {
    this.gridApi.sizeColumnsToFit();
  }

  typeRenderFunction(params) {
    let displayName = '';
    if (params.value) {
      if (params.value == MapConstant.FED_ROLES.MASTER) {
        displayName = this.translate.instant('multiCluster.master');
      } else {
        displayName = this.translate.instant('multiCluster.joint');
      }
      return this.sanitizer.sanitize(SecurityContext.HTML, displayName);
    }

    return '';
  }

  quickFilterParents(node: IRowNode) {
    return !node.data.parent_id;
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.clusterCount;
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.gridApi.forEachNode(node =>
      node.rowIndex ? 0 : node.setSelected(true)
    );

    //update the grid with the summary info
    if (this.isMasterRole) {
      if (this.clusterData.clusters && this.clusterData.clusters.length > 0) {
        this.updateSummaryForRows();
      }
    }
    this.cd.markForCheck();
  }

  hostRenderFunction(params) {
    if (params && params.value) {
      if (
        params.value ===
        this.translate.instant('multiCluster.messages.SCORE_UNAVAILIBlE')
      ) {
        return `<span class="label label-warning">${params.value}</span>`;
      } else {
        return params.value;
      }
    }
  }

  scoreRenderFunction(params) {
    if (params && params.value) {
      let score = params.value.valueOf();
      if (isNaN(score)) {
        return `<span class="label label-warning">${params.value}</span>`;
      } else {
        let scoreColor = 'success';
        let scoreText = this.translate.instant(
          'dashboard.heading.guideline.MAIN_SCORE_GOOD2'
        );
        if (score > 20 && score <= 50) {
          scoreColor = 'warning';
          scoreText = this.translate.instant(
            'dashboard.heading.guideline.MAIN_SCORE_FAIR'
          );
        }
        if (score > 50) {
          scoreColor = 'danger';
          scoreText = this.translate.instant(
            'dashboard.heading.guideline.MAIN_SCORE_POOR'
          );
        }
        return `<span style="display: inline-block; width: 45px;" class="label label-${scoreColor} badge badge-${scoreColor}">${scoreText}</span><span class="text-${scoreColor} text-bold padding-left-s">${score}</span>`;
      }
    } else {
      if (typeof params.value === 'undefined') {
        return "<span><em class='fa fa-spin fa-spinner text-primary' aria-hidden='true'></em></span>";
      } else {
        return '<span></span>';
      }
    }
  }

  statusRenderFunction(params) {
    let status = params.value || 'active';
    let labelCode = MapConstant.colourMap['mc_' + status];
    let statusText = this.utils.getI18Name(
      'cluster.status.' + this.sanitizer.sanitize(SecurityContext.HTML, status)
    );
    return `<span class="label label-fs label-${labelCode} badge badge-${labelCode}">${statusText}</span>`;
  }

  podRenderFunction(params) {
    if (params && params.value) {
      if (
        params.value ===
        this.translate.instant('multiCluster.messages.SCORE_UNAVAILIBlE')
      ) {
        return `<span class="label label-warning">${params.value}</span>`;
      } else {
        return params.value;
      }
    }
  }

  versionRenderFunction(params) {
    if (params && params.value) {
      if (
        params.value ===
        this.translate.instant('multiCluster.messages.SCORE_UNAVAILIBlE')
      ) {
        return `<span class="label label-warning">${params.value}</span>`;
      } else {
        return params.value;
      }
    }
  }

  updateRow4Success(index, rowNode, summary) {
    const hasSummaryDetail =
      summary.summaryJson && summary.summaryJson !== 'error';

    if (hasSummaryDetail) {
      const summaryDetail = JSON.parse(summary.summaryJson).summary;
      rowNode.data.hosts = summaryDetail.hosts;
      rowNode.data.running_pods = summaryDetail.running_pods.toString();
      rowNode.data.cvedb_version = summaryDetail.cvedb_version;
      rowNode.data.component_versions = summaryDetail.component_versions;
    } else {
      rowNode.data.hosts = this.translate.instant(
        'multiCluster.messages.SCORE_UNAVAILIBlE'
      );
      rowNode.data.running_pods = this.translate.instant(
        'multiCluster.messages.SCORE_UNAVAILIBlE'
      );
      rowNode.data.cvedb_version = this.translate.instant(
        'multiCluster.messages.SCORE_UNAVAILIBlE'
      );
    }

    const hasSummaryScore = !summary.score.hasError;

    if (hasSummaryScore) {
      rowNode.data.score = summary.score.security_risk_score.toString();
    } else {
      rowNode.data.score = this.translate.instant(
        'multiCluster.messages.SCORE_UNAVAILIBlE'
      );
    }

    this.rowData.push(rowNode.data);

    if (this.gridOptions && this.gridApi) {
      this.gridApi!.redrawRows({ rowNodes: [rowNode] });
      this.finishedNum++;
    }
  }

  updateRow4Error(rowNode: IRowNode, message: string) {
    rowNode.data.hosts = message;
    rowNode.data.running_pods = message;
    rowNode.data.cvedb_version = message;
    rowNode.data.score = message;

    this.gridApi!.redrawRows({ rowNodes: [rowNode] });
  }
}
