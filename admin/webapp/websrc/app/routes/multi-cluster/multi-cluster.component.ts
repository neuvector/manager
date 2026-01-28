import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MultiClusterService } from '@services/multi-cluster.service';
import { UtilsService } from '@common/utils/app.utils';
import { MatDialog } from '@angular/material/dialog';
import { PromotionModalComponent } from './promotion-modal/promotion-modal.component';
import { JoiningModalComponent } from './joining-modal/joining-modal.component';
import { GlobalVariable } from '@common/variables/global.variable';
import { ClusterData, ClusterSummary } from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { MapConstant } from '@common/constants/map.constant';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { MultiClusterGridComponent } from '@components/multi-cluster-grid/multi-cluster-grid.component';
import { ConfigHttpService } from '@common/api/config-http.service';

@Component({
  standalone: false,
  selector: 'app-multi-cluster',
  templateUrl: './multi-cluster.component.html',
  styleUrls: ['./multi-cluster.component.scss'],
})
export class MultiClusterComponent implements OnInit, OnDestroy {
  public switch: string = '';
  public loaded = false;
  public error!: string;
  clusterError: boolean = false;
  public gridOptions: any;
  public $win;
  public isMasterRole;
  public isMemberRole;
  public isStandalone;
  public isFederal;
  public fed_role: string = '';
  public multiClusterMsg: string = '';
  public gridHeight: number = 0;
  public context;
  public search: string = '';
  public multiClusterErr: boolean = false;
  public count: string = '';
  public readonly w: any;
  public summary!: ClusterSummary;
  public clusterData!: ClusterData;
  public useProxy: string = '';
  public columns: number = 2;
  private switchClusterSubscription;
  private refreshClusterSubscription;
  refreshing$ = new Subject();
  readonly CONST = GlobalConstant;
  private _clusterGrid!: MultiClusterGridComponent;

  @ViewChild(MultiClusterGridComponent) set multiClusterGrid(
    grid: MultiClusterGridComponent
  ) {
    this._clusterGrid = grid;
  }

  constructor(
    public dialog: MatDialog,
    private translate: TranslateService,
    public multiClusterService: MultiClusterService,
    public utils: UtilsService,
    private router: Router,
    private configHttpService: ConfigHttpService
  ) {
    this.w = GlobalVariable.window;
    this.$win = $(this.w);
  }

  breakPoints(): void {
    switch (true) {
      case window.innerWidth <= 480:
        this.columns = 1;
        break;
      default:
        this.columns = 2;
    }
  }

  ngOnInit(): void {
    this.pageInit();
    this.switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.router.navigate(['dashboard']);
      });
    this.refreshClusterSubscription =
      this.multiClusterService.onRefreshClustersEvent$.subscribe(data => {
        this.pageInit();
      });
    this.configHttpService.getConfig().subscribe(response => {
      this.configHttpService.setConfigV2(response);
    });
  }

  ngOnDestroy(): void {
    if (this.switchClusterSubscription) {
      this.switchClusterSubscription.unsubscribe();
    }
    if (this.refreshClusterSubscription) {
      this.refreshClusterSubscription.unsubscribe();
    }
  }

  initialize(fedData: ClusterData): void {
    this.isMasterRole = fedData.fed_role === MapConstant.FED_ROLES.MASTER;
    this.isMemberRole = fedData.fed_role === MapConstant.FED_ROLES.MEMBER;
    this.isStandalone = fedData.fed_role.length === 0;
    this.isFederal = fedData.fed_role.length > 0;
    this.clusterData = fedData;
    if (this._clusterGrid && this._clusterGrid.gridApi) {
      this._clusterGrid.gridApi.setGridOption(
        'rowData',
        this.clusterData.clusters!
      );
      this._clusterGrid.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
      setTimeout(() => {
        this._clusterGrid.updateSummaryForRows();
      }, 500);
    }
    //get primary cluster's rest_version
    const primaryCluster = this.clusterData.clusters?.find(
      cluster => cluster.clusterType === GlobalConstant.CLUSTER_TYPES.MASTER
    );
    this.multiClusterService.primaryClusterRestVersion = primaryCluster
      ? primaryCluster.rest_version
      : '';
  }

  onResize(): void {
    this.breakPoints();
  }

  pageInit() {
    //get the list of the multiple clusters
    this.multiClusterService
      .getClusters()
      .pipe(
        finalize(() => {
          this.loaded = true;
          this.refreshing$.next(false);
        })
      )
      .subscribe({
        next: (fedData: ClusterData) => {
          if (fedData.hasOwnProperty('fed_role')) {
            this.initialize(fedData);
          } else {
            this.clusterError = true;
          }
          if (!this.loaded) this.loaded = true;
        },
        error: error => {
          this.error = error.message;
          this.clusterError = true;
        },
      });
  }

  showPromotionDialog(): void {
    const dialogRef = this.dialog.open(PromotionModalComponent, {
      width: '80%',
      maxWidth: '1100px',

      data: {
        isEdit: false,
      },
    });

    dialogRef.afterClosed().subscribe(result => {});
  }

  showJoiningDialog(): void {
    const dialogRef = this.dialog.open(JoiningModalComponent, {
      width: '80%',
      maxWidth: '1100px',
    });
    dialogRef.afterClosed().subscribe(result => {});
  }

  refresh(): void {
    this.refreshing$.next(true);
    this.multiClusterService.dispatchRefreshEvent();
  }
}
