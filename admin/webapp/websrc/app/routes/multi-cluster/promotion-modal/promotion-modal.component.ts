import { Component, Inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MultiClusterService } from '@services/multi-cluster.service';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { SettingsService } from '@services/settings.service';
import { Router } from '@angular/router';
import { SESSION_STORAGE, StorageService } from 'ngx-webstorage-service';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import swal from 'sweetalert';
import { Cluster } from '@common/types';

export interface EditClusterDialog {
  isEdit: boolean;
  cluster: {
    name: '',
    host: '',
    port: ''
  } ;
  useProxy: string;
  fed_sync_registry_toggle :boolean;
  fed_sync_repo_toggle :boolean;
}

@Component({
  selector: 'app-promotion-modal',
  templateUrl: './promotion-modal.component.html',
  styleUrls: ['./promotion-modal.component.scss'],
})
export class PromotionModalComponent implements OnInit {
  public cluster: any;
  public useProxy: string = '';
  public fed_sync_registry_toggle: boolean = false;
  public fed_sync_repo_toggle: boolean = false;

  constructor(
    private clustersService: MultiClusterService,
    private settingsService: SettingsService,
    private translate: TranslateService,
    private utils: UtilsService,
    private http: HttpClient,
    private router: Router,
    private location: Location,
    public dialogRef: MatDialogRef<PromotionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditClusterDialog,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService // @Inject(MAT_DIALOG_DATA) public
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
    this.fed_sync_registry_toggle = false;
    this.fed_sync_repo_toggle = false;
    this.getClusterName();

    if(this.data.isEdit){
      this.cluster = this.data.cluster;
      this.useProxy = this.data.useProxy;
      this.fed_sync_registry_toggle = this.data.fed_sync_registry_toggle;
      this.fed_sync_repo_toggle = this.data.fed_sync_repo_toggle;
    }
  }

  getClusterName = () => {
    this.settingsService.getConfig().subscribe(
      data => {
        this.cluster.name = data.misc.cluster_name;
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
    if( this.data.isEdit){
      const payload = {name:"",api_server:"",api_port:""};
      payload.name = this.cluster.name;
      payload.api_server = this.cluster.host;
      payload.api_port = this.cluster.port;
      this.clustersService.updateCluster(payload, true, this.useProxy, this.fed_sync_repo_toggle, this.fed_sync_registry_toggle).subscribe(
        response => swal(
          'Success',
          this.translate.instant('multiCluster.messages.update_ok'),
          'success'
        )
      );

    }else{
      this.clustersService.promoteCluster(
        this.cluster, this.useProxy,
        this.fed_sync_registry_toggle, this.fed_sync_repo_toggle).subscribe(
        response => {
          console.log(response);
          swal(
            'Success',
            this.translate.instant('multiCluster.promotion.success'),
            'success'
          ).then(ev => {
            setTimeout(() => {
              this.logout();
            }, 1000);

            this.dialogRef.close();
          });
        },
        err => {
          let message = this.utils.getErrorMessage(err);
          swal(
            this.translate.instant('multiCluster.promotion.failure'),
            message,
            'error'
          );
        }
      );
    }

  };

  logout = () => {
    this.http.delete(GlobalConstant.LOGIN_URL).subscribe({
      next: value => {
        this.sessionStorage.remove('token');
        this.sessionStorage.remove('cluster');
        this.sessionStorage.set('from', this.location.path());
        GlobalVariable.user = null;
        GlobalVariable.sidebarDone = false;
        GlobalVariable.versionDone = false;
        GlobalVariable.isFooterReady = false;
        this.router.navigate([GlobalConstant.PATH_LOGIN]);
      },
      error: error => {
        this.router.navigate([GlobalConstant.PATH_LOGIN]);
      },
    });
  };
}
