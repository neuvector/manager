import {
  ChangeDetectorRef,
  Component,
  Input,
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
  RowNode,
  RowSelectedEvent,
} from 'ag-grid-community';
import { Subject } from 'rxjs';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { MultiClusterGridActionCellComponent } from '@components/multi-cluster-grid/multi-cluster-grid-action-cell/multi-cluster-grid-action-cell.component';
import { finalize } from 'rxjs/operators';
import {isAuthorized} from "@common/utils/common.utils";

@Component({
  selector: 'app-multi-cluster-grid',
  templateUrl: './multi-cluster-grid.component.html',
  styleUrls: ['./multi-cluster-grid.component.scss'],
})
export class MultiClusterGridComponent implements OnInit {
  private readonly $win;
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

  get clusterCount() {
    return this.clusterData.clusters!.length;
  }
  constructor(
    public multiClusterService: MultiClusterService,
    private translate: TranslateService,
    private utils: UtilsService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.initGrid();
  }

  initGrid(){
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

    const resource = {
      manageAuth: {
        global: 4
      },
    }
    this.isActionAuthorized = isAuthorized(
      GlobalVariable.user.roles,
      resource.manageAuth
    )

    if (this.isActionAuthorized) {
      this.columnDefs.push(this.actionColumn);
    }

    this.context = { componentParent: this };

    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);

    this.gridOptions = {
      ...this.gridOptions,
      suppressDragLeaveHidesColumns: true,
      rowSelection: 'single',
      rowData: this.clusterData.clusters,
      onGridReady: event => this.onGridReady(event),
      onRowSelected: event => this.onRowSelected(event),
    };
  }

  updateSummaryForRowNode(
    rowNode: RowNode,
    cluster: Cluster,
    index: number,
    isRowSelected: boolean
  ) {
    if (
      cluster.status === MapConstant.FED_STATUS.DISCONNECTED ||
      cluster.status === MapConstant.FED_STATUS.LEFT ||
      cluster.status === MapConstant.FED_STATUS.KICKED
    ) {
      this.updateClusterSummary4Error(rowNode);
    } else {
      if (cluster.clusterType === MapConstant.FED_ROLES.MASTER) {
        const params = { isGlobalUser: true };

        //get summary
        this.multiClusterService
          .getMultiClusterSummary(params)
          .subscribe(res => {
            this.updateClusterGridRRow4Success(
              index,
              rowNode,
              res,
              isRowSelected
            );
          });
      } else {
        const params = { isGlobalUser: true, clusterId: cluster.id };

        //get summary
        this.multiClusterService
          .getMultiClusterSummary(params)
          .subscribe(res => {
            this.updateClusterGridRRow4Success(
              index,
              rowNode,
              res,
              isRowSelected
            );
          });
      }
    }
  }
  updateSummaryForRows() {
    this.clusterData.clusters!.forEach((cluster, index) => {
      const rowNode = this.gridOptions.api!.getDisplayedRowAtIndex(index);
      if (rowNode) {
        this.updateSummaryForRowNode(rowNode, cluster, index, false);
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
      this.updateSummaryForRowNode(
        params.node,
        params.data,
        params.node.rowIndex!,
        true
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

  quickFilterParents(node: RowNode) {
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
        return `<span class="label label-idle">${params.value}</span>`;
      } else {
        return params.value;
      }
    }
  }

  scoreRenderFunction(params) {
    if (params && params.value) {
      let score = params.value.valueOf();
      if (isNaN(score)) {
        return `<span class="label label-idle">${params.value}</span>`;
      } else {
        let scoreColor = 'success';
        let scoreText = this.translate.instant(
          'dashboard.heading.guideline.MAIN_SCORE_GOOD2'
        );
        console.log('score: ', score);
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
        return `<span style="display: inline-block; width: 45px;" class="ml-sm label label-${scoreColor} badge badge-${scoreColor}">${scoreText}</span><span class="text-${scoreColor} text-bold padding-left-s">${score}</span>`;
      }
    } else {
      return "<span><em class='fa fa-spin fa-spinner text-primary' aria-hidden='true'></em></span>";
    }
  }

  statusRenderFunction(params) {
    let status = params.value || 'active';
    let labelCode = MapConstant.colourMap['mc_' + status];
    let statusText = this.utils.getI18Name(
      'cluster.status.' + this.sanitizer.sanitize(SecurityContext.HTML, status)
    );
    return `<span class="label label-fs label-${labelCode} badge badge-${labelCode}">${statusText}</span`;
  }

  podRenderFunction(params) {
    if (params && params.value) {
      if (
        params.value ===
        this.translate.instant('multiCluster.messages.SCORE_UNAVAILIBlE')
      ) {
        return `<span class="label label-idle">${params.value}</span>`;
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
        return `<span class="label label-idle">${params.value}</span>`;
      } else {
        return params.value;
      }
    }
  }

  updateClusterGridRRow4Success(index, rowNode, summary, isRowSelected) {
    const hasSummaryDetail =
      summary.summaryJson && summary.summaryJson !== 'error';
    const hasSummaryScore = !summary.score.hasError;

    if (hasSummaryDetail) {
      const summaryDetail = JSON.parse(summary.summaryJson).summary;

      if (isRowSelected) {
        this.multiClusterService.setSelectedClusterSummary(summaryDetail);
      }

      rowNode.data.hosts = summaryDetail.hosts;
      rowNode.data.running_pods = summaryDetail.running_pods.toString();
      rowNode.data.cvedb_version = summaryDetail.cvedb_version;
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
    if (hasSummaryScore) {
      rowNode.data.score = summary.score.securityRiskScore.toString();
    } else {
      rowNode.data.score = this.translate.instant(
        'multiCluster.messages.SCORE_UNAVAILIBlE'
      );
    }

    this.gridOptions.api!.redrawRows({ rowNodes: [rowNode] });
  }

  updateClusterSummary4Error(rowNode: RowNode) {
    rowNode.data.hosts = this.translate.instant(
      'multiCluster.messages.SCORE_UNAVAILIBlE'
    );
    rowNode.data.running_pods = this.translate.instant(
      'multiCluster.messages.SCORE_UNAVAILIBlE'
    );
    rowNode.data.cvedb_version = this.translate.instant(
      'multiCluster.messages.SCORE_UNAVAILIBlE'
    );
    rowNode.data.score = this.translate.instant(
      'multiCluster.messages.SCORE_UNAVAILIBlE'
    );
    this.gridOptions.api!.redrawRows({ rowNodes: [rowNode] });
  }
}
