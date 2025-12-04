import { GlobalConstant } from '@common/constants/global.constant';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@common/utils/app.utils';
import { MultiClusterService } from '@services/multi-cluster.service';
import { SettingsService } from '@services/settings.service';
import { MapConstant } from '@common/constants/map.constant';
import { NotificationService } from '@services/notification.service';
import { Router } from '@angular/router';
import { ConfigHttpService } from '@common/api/config-http.service';
import { timer } from 'rxjs';
import { switchMap, filter, take, timeout } from 'rxjs/operators';


@Component({
  standalone: false,
  selector: 'app-joining-modal',
  templateUrl: './joining-modal.component.html',
  styleUrls: ['./joining-modal.component.scss'],
  
})
export class JoiningModalComponent implements OnInit {
  public cluster: any;
  public useProxy: String = '';
  public invalidToken: boolean = false;
  public isProcessing: boolean = false;
  public isProxyEnabled: boolean = false;

  constructor(
    private clustersService: MultiClusterService,
    private settingsService: SettingsService,
    private translate: TranslateService,
    private configHttpService: ConfigHttpService,
    private utils: UtilsService,
    public dialogRef: MatDialogRef<JoiningModalComponent>,
    private notificationService: NotificationService,
    private router: Router // @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    this.cluster = {
      master_host: '',
      master_port: '',
      token: '',
      name: '',
      host: '',
      port: MapConstant.FED_PORT.JOINT,
    };
    this.useProxy = '';
    this.getClusterName();
    this.configHttpService.configV2$.subscribe(data => {
      if (data?.proxy?.registry_https_proxy_status == true) {
        this.isProxyEnabled = true;
      } else {
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
        this.notificationService.openError(
          error.error,
          this.translate.instant('multiCluster.messages.get_name_failure')
        );
      }
    );
  };

  onCancel = () => {
    this.dialogRef.close();
  };

  parseToken = () => {
    try {
      if (this.cluster.token) {
        if (this.cluster.token.length % 4 == 0) {
          let decodedStr = JSON.parse(atob(this.cluster.token));
          this.cluster.master_host = decodedStr['s'];
          this.cluster.master_port = decodedStr['p'];
          this.invalidToken = false;
        } else {
          this.invalidToken = true;
        }
      }
    } catch (error) {
      this.invalidToken = true;
    }
  };

  handleMousePaste() {
    setTimeout(() => {
      this.parseToken();
    }, 0);
  }

  onConfirm = () => {
    this.isProcessing = true;
    this.clustersService
      .joinCluster(this.cluster, this.useProxy)
      .pipe(
        switchMap(() => {
          return timer(0, 2000).pipe(
            switchMap(() => this.clustersService.getClusters()),
            filter((response: any) => {
              return (
                response &&
                response.fed_role &&
                response.fed_role === GlobalConstant.CLUSTER_TYPES.MEMBER
              );
            }),
            take(1),
            timeout(20000)
          );
        })
      )
      .subscribe({
        next: validResponse => {
          this.notificationService.open(
            this.translate.instant('multiCluster.joining.success')
          );
          this.clustersService.dispatchRefreshEvent();
          this.isProcessing = false;
          this.dialogRef.close();
        },
        error: err => {
          this.isProcessing = false;
          this.notificationService.openError(
            err.error,
            this.translate.instant('multiCluster.joining.failure')
          );
        },
      });
  };
}
