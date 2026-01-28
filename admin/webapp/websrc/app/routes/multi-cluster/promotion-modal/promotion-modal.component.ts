import { Component, Inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MultiClusterService } from '@services/multi-cluster.service';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { SettingsService } from '@services/settings.service';
import { Router } from '@angular/router';
import {
  LOCAL_STORAGE,
  SESSION_STORAGE,
  StorageService,
} from 'ngx-webstorage-service';
import { GlobalConstant } from '@common/constants/global.constant';
import { NotificationService } from '@services/notification.service';
import { GlobalVariable } from '@common/variables/global.variable';
import { ConfigHttpService } from '@common/api/config-http.service';

export interface EditClusterDialog {
  isEdit: boolean;
  cluster: {
    name: '';
    host: '';
    port: '';
  };
  useProxy: string;
  fed_sync_repo_toggle: boolean;
}

@Component({
  standalone: false,
  selector: 'app-promotion-modal',
  templateUrl: './promotion-modal.component.html',
  styleUrls: ['./promotion-modal.component.scss'],
})
export class PromotionModalComponent implements OnInit {
  public cluster: any;
  public useProxy: string = '';
  public fed_sync_repo_toggle: boolean = false;
  public isMaster: boolean = false;
  public readOnly: boolean = false;
  public isProcessing: boolean = false;
  public isProxyEnabled: boolean = false;

  constructor(
    private clustersService: MultiClusterService,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private utils: UtilsService,
    private http: HttpClient,
    private router: Router,
    private location: Location,
    private configHttpService: ConfigHttpService,
    public dialogRef: MatDialogRef<PromotionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditClusterDialog,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    @Inject(LOCAL_STORAGE) private localStorage: StorageService
  ) {
    this.location = location;
  }

  ngOnInit(): void {
    this.cluster = {
      name: '',
      host: '',
      port: MapConstant.FED_PORT.MASTER,
    };
    this.useProxy = '';
    this.fed_sync_repo_toggle = false;
    this.isMaster = GlobalVariable.isMaster;
    this.getClusterName();

    if (this.data.isEdit) {
      this.cluster = this.data.cluster;
      this.useProxy = this.data.useProxy;
      this.fed_sync_repo_toggle = this.data.fed_sync_repo_toggle;
      this.readOnly = true;
    }
    this.configHttpService.configV2$.subscribe(response => {
      if (response?.proxy?.registry_https_proxy_status == true) {
        this.isProxyEnabled = true;
      } else {
        this.useProxy = '';
        this.isProxyEnabled = false;
      }
    });
  }

  getClusterName = () => {
    this.configHttpService.configV2$.subscribe(
      data => {
        this.cluster.name = data?.misc.cluster_name;
      },
      error => {
        console.log(error.message);
      }
    );
  };

  onCancel = () => {
    this.dialogRef.close();
  };

  onConfirm = () => {
    if (this.data.isEdit) {
      const payload = { name: '', api_server: '', api_port: '' };
      payload.name = this.cluster.name;
      payload.api_server = this.cluster.host;
      payload.api_port = this.cluster.port;
      if (GlobalVariable.isMaster) {
        this.clustersService
          .updateCluster(
            payload,
            true,
            this.useProxy,
            this.fed_sync_repo_toggle
          )
          .subscribe(
            response => {
              this.notificationService.open(
                this.translate.instant('multiCluster.messages.update_ok')
              );
              this.dialogRef.close();
              this.clustersService.dispatchRefreshEvent();
            },
            error => {
              this.notificationService.openError(
                error.error,
                this.translate.instant('multiCluster.messages.update_failure')
              );
            }
          );
      } else {
        this.clustersService
          .updateMemberCluster(payload, true, this.useProxy)
          .subscribe(
            response => {
              this.notificationService.open(
                this.translate.instant('multiCluster.messages.update_ok')
              );
              this.dialogRef.close();
              this.clustersService.dispatchRefreshEvent();
            },
            error => {
              this.notificationService.openError(
                error.error,
                this.translate.instant('multiCluster.messages.update_failure')
              );
            }
          );
      }
    } else {
      this.isProcessing = true;
      this.clustersService
        .promoteCluster(this.cluster, this.useProxy, this.fed_sync_repo_toggle)
        .subscribe(
          response => {
            this.notificationService.open(
              this.translate.instant('multiCluster.promotion.success')
            );
            setTimeout(() => {
              this.localStorage.clear();
              this.router.navigate(['login']);
            }, 1000);
            this.isProcessing = false;
            this.dialogRef.close();
          },
          err => {
            this.isProcessing = false;
            this.notificationService.openError(
              err.error,
              this.translate.instant('multiCluster.promotion.failure')
            );
          }
        );
    }
  };
}
