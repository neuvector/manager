import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { TokenModalComponent } from '@routes/multi-cluster/token-modal/token-modal.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { GlobalConstant } from '@common/constants/global.constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import swal from 'sweetalert';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { ShortenFromMiddlePipe } from '@common/pipes/app.pipes';
import { finalize, switchMap } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { UtilsService } from '@common/utils/app.utils';
import { PromotionModalComponent } from '@routes/multi-cluster/promotion-modal/promotion-modal.component';

@Component({
  selector: 'app-multi-cluster-grid-action-cell',
  templateUrl: './multi-cluster-grid-action-cell.component.html',
  styleUrls: ['./multi-cluster-grid-action-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiClusterGridActionCellComponent
  implements ICellRendererAngularComp
{
  public params!: ICellRendererParams;
  buttonDisplayMap: any;

  constructor(
    public multiClusterService: MultiClusterService,
    private shortenFromMiddlePipe: ShortenFromMiddlePipe,
    private notificationService: NotificationService,
    private utils: UtilsService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private router: Router
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.buttonDisplayMap = {};
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

  remove = () => {
    let desc = '';
    swal({
      title: `Are you sure to remove the member cluster "${this.params.data.name}" ? `,
      text: desc,
      icon: 'warning',
      buttons: {
        cancel: {
          text: 'Cancel',
          value: null,
          visible: true,
          closeModal: true,
        },
        confirm: {
          text: 'Confirm',
          value: true,
          visible: true,
          className: 'bg-danger',
          closeModal: true,
        },
      },
    }).then(isConfirm => {
      if (isConfirm) {
        this.multiClusterService
          .removeMember(this.params.data.id)
          .subscribe(response => {
            console.log(response);
            swal('Removed', 'The Member Cluster is removed.', 'success');
          });
      }
    });
  };

  switchCluster = () => {
    console.log(this.params.data.id);
    this.multiClusterService.switchCluster(this.params.data.id, '');
  };

  generateToken = () => {
    this.multiClusterService.generateToken().subscribe(response => {
      this.openDialog(response['join_token']);
    });
  };

  syncPolicy = (event, data) => {
    this.multiClusterService.syncPolicy(data.id).subscribe(
      () => {
        this.notificationService.open(
          this.translate.instant('multiCluster.messages.deploy_ok', {name: data.name})
        );
      },
      error => {
        this.notificationService.openError(
          error,
          this.translate.instant('multiCluster.messages.deploy_failure')
        );
      }
    );
  };

  removeMember(rowData): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      disableClose: true,
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
          setTimeout(() => {
            this.multiClusterService.requestRefresh();
          }, 2000);
        },
        error => {
          this.notificationService.openError(
            error,
            this.translate.instant('multiCluster.messages.remove_failure')
          );
        }
      );
  }

  manageCluster(rowData): void {
    this.multiClusterService.switchCluster(rowData.id, '').subscribe(
      value => {},
      error => {}
    );
  }

  leave() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      disableClose: true,
      data: {
        message: `${this.translate.instant('multiCluster.prompt.leave')}`,
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => this.multiClusterService.leaveFromMaster(true)),
        finalize(() => {
          // dialogRef.componentInstance.onCancel();
          // dialogRef.componentInstance.loading = false;
        })
      )
      .subscribe(
        () => {
          this.notificationService.open(
            this.translate.instant('multiCluster.messages.leave_ok')
          );
          dialogRef.componentInstance.loading = false;
          dialogRef.componentInstance.onCancel();
          setTimeout(() => {
            this.multiClusterService.requestRefresh();
          }, 2000);
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
            this.router.navigate(['logout']);
          }, 3000);
        },
        error => {
          this.notificationService.openError(
            error,
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
