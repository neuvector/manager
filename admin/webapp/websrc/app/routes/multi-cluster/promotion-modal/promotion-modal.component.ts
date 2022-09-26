import { Component, Inject, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { MatDialogRef } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { MultiClusterService } from "@services/multi-cluster.service";
import { UtilsService } from "@common/utils/app.utils";
import { SettingsService } from "@services/settings.service";
import { Router } from "@angular/router";
import { SESSION_STORAGE, StorageService } from "ngx-webstorage-service";
import { GlobalVariable } from "@common/variables/global.variable";
import { GlobalConstant } from "@common/constants/global.constant";
import swal from "sweetalert";

@Component({
  selector: "app-promotion-modal",
  templateUrl: "./promotion-modal.component.html",
  styleUrls: ["./promotion-modal.component.scss"]
})
export class PromotionModalComponent implements OnInit {
  public cluster: any;
  public useProxy: String = "";

  constructor(
    private clustersService: MultiClusterService,
    private settingsService: SettingsService,
    private translate: TranslateService,
    private utils: UtilsService,
    private http: HttpClient,
    private router: Router,
    private location: Location,
    public dialogRef: MatDialogRef<PromotionModalComponent>,
    @Inject(SESSION_STORAGE) private sessionStorage: StorageService,
    // @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    dialogRef.disableClose = true;
    this.location = location;
  }

  ngOnInit(): void {
    this.cluster = {
      name: "",
      host: "",
      port: ""
    };
    this.useProxy = "";
    this.getClusterName();
  }

  getClusterName = () => {
    this.settingsService.getConfig().subscribe(
      data => {
        console.info("response1 =", data);
        console.debug(data);
        console.info("name:",data.cluster_name);
        this.cluster.name = data.cluster_name;

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
    console.log("onConfirm:"+this.cluster + "useProxy:"+this.useProxy)
    this.clustersService.promoteCluster(this.cluster, this.useProxy).subscribe(
      response => {
        console.log(response);
        swal(
          "Success",
          this.translate.instant("multiCluster.promotion.success"),
          "success"
        ).then(ev => {
          console.log(ev);
          setTimeout(() => {
            this.logout();
          }, 1000 );

          this.dialogRef.close();

        });
      },
      err => {
        let message = this.utils.getErrorMessage(err);
        swal(
          this.translate.instant("multiCluster.promotion.failure"),
          message,
          "error"
        );
      }
    );
  };

  logout = () => {
    this.http.delete(GlobalConstant.LOGIN_URL)
      .subscribe({
        next: value => {
          this.sessionStorage.remove("token");
          this.sessionStorage.remove("cluster");
          this.sessionStorage.set("from",this.location.path());
          GlobalVariable.user = null;
          GlobalVariable.sidebarDone = false;
          GlobalVariable.versionDone = false;
          GlobalVariable.isFooterReady = false;
          this.router.navigate([GlobalConstant.PATH_LOGIN]);
        },
        error: error => {
          this.router.navigate([GlobalConstant.PATH_LOGIN]);
        }
      });
  }
}
