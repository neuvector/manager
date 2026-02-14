import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { TokenModalComponent } from '@routes/multi-cluster/token-modal/token-modal.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { ShortenFromMiddlePipe } from '@common/pipes/app.pipes';
import { finalize, switchMap } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { PromotionModalComponent } from '@routes/multi-cluster/promotion-modal/promotion-modal.component';
import { MapConstant } from '@common/constants/map.constant';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

@Component({
  standalone: false,
  selector: 'app-multi-cluster-grid-action-cell',
  templateUrl: './multi-cluster-grid-action-cell.component.html',
  styleUrls: ['./multi-cluster-grid-action-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiClusterGridActionCellComponent implements ICellRendererAngularComp {
  public params!: ICellRendererParams;
  buttonDisplayMap: any;
  left_status: string = MapConstant.FED_STATUS.LEFT;
  disconnect_status: string = MapConstant.FED_STATUS.DISCONNECTED;
  upgrade_status: string = MapConstant.FED_STATUS.UPGADE_REQUIRED;
  kicked_status: string = MapConstant.FED_STATUS.KICKED;
  pending_status: string = MapConstant.FED_STATUS.PENDING;
  primaryClusterRestVersion: string = '';

  constructor(
    public multiClusterService: MultiClusterService,
    private shortenFromMiddlePipe: ShortenFromMiddlePipe,
    private notificationService: NotificationService,
    public translateService: TranslateService,
    private utils: UtilsService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private router: Router,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.buttonDisplayMap = {};
    this.primaryClusterRestVersion =
      this.multiClusterService.primaryClusterRestVersion;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  isMasterRole = () => {
    return this.params.context.componentParent.isMasterRole;
  };

  isMasterCluster = () => {
    return this.params.data.clusterType == GlobalConstant.CLUSTER_TYPES.MASTER;
  };

  manageFedPolicy = () => {
    this.router.navigate(['federated-policy']);
  };

  switchCluster = () => {
    console.log(this.params.data.id);
    this.multiClusterService.switchCluster(this.params.data.id, '');
  };

  generateToken = () => {
    this.multiClusterService.generateToken().subscribe(data => {
      this.openDialog(data['join_token']);
    });
  };

  syncPolicy = data => {
    this.multiClusterService.syncPolicy(data.id).subscribe(
      () => {
        this.notificationService.open(
          this.translate.instant('multiCluster.messages.deploy_ok', {
            name: data.name,
          })
        );
      },
      error => {
        this.notificationService.openError(
          error.error,
          this.translate.instant('multiCluster.messages.deploy_failure')
        );
      }
    );
  };

  removeMember(rowData): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',

      data: {
        message: `${this.translate.instant('multiCluster.prompt.remove', {
          name: this.shortenFromMiddlePipe.transform(rowData.name, 20),
        })}`,
      },
    });

    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => this.multiClusterService.removeMember(rowData.id)),
        finalize(() => {
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        })
      )
      .subscribe(
        () => {
          this.notificationService.open(
            this.translate.instant('multiCluster.messages.remove_ok')
          );
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
          setTimeout(() => {
            this.multiClusterService.dispatchRefreshEvent();
          }, 1500);
        },
        error => {
          this.notificationService.openError(
            error.error,
            this.translate.instant('multiCluster.messages.remove_failure')
          );
        }
      );
  }

  //switch to a member cluster
  manageCluster(rowData): void {
    this.multiClusterService.switchCluster(rowData.id, '').subscribe(
      value => {
        const cluster = {
          isRemote: true,
          id: rowData.id,
          name: rowData.name,
        };
        this.localStorage.set(
          GlobalConstant.LOCAL_STORAGE_CLUSTER,
          JSON.stringify(cluster)
        );
        this.multiClusterService.refreshSummary();
        this.multiClusterService.dispatchSwitchEvent();
        this.multiClusterService.dispatchManageMemberEvent();
      },
      error => {
        this.notificationService.openError(
          error.error,
          this.translateService.instant(
            'multiCluster.messages.redirect_failure',
            { name: rowData.name }
          )
        );
      }
    );
  }

  leave() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',

      data: {
        message: `${this.translate.instant('multiCluster.prompt.leave')}`,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(switchMap(() => this.multiClusterService.leaveFromMaster(true)))
      .subscribe(
        () => {
          this.notificationService.open(
            this.translate.instant('multiCluster.messages.leave_ok')
          );
          dialogRef.componentInstance.loading = false;
          dialogRef.componentInstance.onCancel();
          setTimeout(() => {
            this.multiClusterService.dispatchRefreshEvent();
          }, 1500);
        },
        error => {
          this.notificationService.open(
            this.translate.instant('multiCluster.messages.leave_failure'),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
  }

  demote = data => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: `${this.translate.instant('multiCluster.prompt.demote', {
          name: this.shortenFromMiddlePipe.transform(data.name, 20),
        })}`,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => this.multiClusterService.demoteCluster()),
        finalize(() => {
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        })
      )
      .subscribe(
        () => {
          this.notificationService.open(
            this.translate.instant('multiCluster.messages.demote_ok')
          );
          setTimeout(() => {
            dialogRef.componentInstance.loading = false;
            dialogRef.close();
            this.router.navigate(['login']);
          }, 3000);
        },
        error => {
          dialogRef.componentInstance.loading = false;
          this.notificationService.openError(
            error.error,
            this.translate.instant('multiCluster.messages.demote_failure')
          );
        }
      );
    // let desc = `1. The Master Cluster will demote to an standalone cluster.<br>
    // 2. Its federal policies will be removed from all member clusters. <br>
    // 3. The Federal Administrator will demote to the Administrator. <br>`;
  };

  openDialog = param => {
    this.dialog.open(TokenModalComponent, {
      data: { token: param },
      width: '50vw',
    });
  };

  showEditClusterDialog(event, data, context, flag): void {
    const dialogRef = this.dialog.open(PromotionModalComponent, {
      width: '80%',
      maxWidth: '1100px',

      data: {
        isEdit: true,
        cluster: {
          name: data.name,
          host: data.api_server,
          port: data.api_port,
        },
        useProxy: context.componentParent.clusterData.use_proxy,
        fed_sync_repo_toggle:
          context.componentParent.clusterData.deploy_repo_scan_data,
      },
    });
  }
}
