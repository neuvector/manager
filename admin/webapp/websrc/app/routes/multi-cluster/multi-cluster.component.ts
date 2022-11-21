import { Component, OnInit } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MultiClusterService } from '@services/multi-cluster.service';
import { UtilsService } from '@common/utils/app.utils';
import { MatDialog } from '@angular/material/dialog';
import { PromotionModalComponent } from './promotion-modal/promotion-modal.component';
import { JoiningModalComponent } from './joining-modal/joining-modal.component';
import { GlobalVariable } from '@common/variables/global.variable';
import {
  Cluster,
  ClusterData,
  ClusterSummary,
  ErrorResponse,
} from '@common/types';
import { TranslateService } from '@ngx-translate/core';
import { MapConstant } from '@common/constants/map.constant';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import {Subject} from "rxjs";

@Component({
  selector: 'app-multi-cluster',
  templateUrl: './multi-cluster.component.html',
  styleUrls: ['./multi-cluster.component.scss'],
})
export class MultiClusterComponent implements OnInit {
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
  private workerCount: number = 0;
  private clusterCount: number = 0;
  private switchClusterSubscription;
  refreshing$ = new Subject();

  readonly CONST = GlobalConstant;

  constructor(
    public dialog: MatDialog,
    private translate: TranslateService,
    public multiClusterService: MultiClusterService,
    public utils: UtilsService,
    private router: Router
  ) {
    this.w = GlobalVariable.window;
    this.$win = $(this.w);
    this.multiClusterService.refresh().subscribe(value => {
      this.refresh();
    })
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
    this.switchClusterSubscription = this.multiClusterService.onClusterSwitchedEvent$.subscribe(
      data => {
        this.router.navigate(['dashboard']);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.switchClusterSubscription) {
      this.switchClusterSubscription.unsubscribe();
    }
  }

  initialize(fedData: ClusterData): void {
    this.isMasterRole = fedData.fed_role === MapConstant.FED_ROLES.MASTER;
    this.isMemberRole = fedData.fed_role === MapConstant.FED_ROLES.MEMBER;
    this.isStandalone = fedData.fed_role.length === 0;
    this.isFederal = fedData.fed_role.length > 0;
    this.clusterData = fedData;

    this.clusterCount = this.clusterData.clusters
      ? this.clusterData.clusters.length
      : 0;
    //get the web worker number (up to 10)
    this.workerCount = this.clusterCount < 10 ? this.clusterCount : 10;

    if (this.clusterCount > 0) {
      this.getSummaries(this.clusterData);
    }

    //todo: to broadcast reloadClusters to the dropdown menu
    //todo: to get summary info
  }

  getSummaries(clusters: ClusterData) {
    for (let index in clusters.clusters) {
      this.getSummary();
    }
  }

  getSummary(id?: String) {
    if (id) {
      this.multiClusterService
        .getRemoteSummary(id)
        .subscribe((summary: any) => {
          console.log('summary:', summary);
        });
    } else {
      this.multiClusterService.getLocalSummary().subscribe((summary: any) => {
        console.log('summary:', summary);
      });
    }
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
        })
      )
      .subscribe({
        next: (fedData: ClusterData) => {
          if (fedData.hasOwnProperty('fed_role')) {
            this.initialize(fedData);
          } else {
            this.clusterError = true;
          }
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
      disableClose: true,
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
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {});
  }

  refresh(): void {
    this.pageInit();
  }
}
