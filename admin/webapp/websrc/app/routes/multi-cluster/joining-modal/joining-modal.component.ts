import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { TranslateService } from "@ngx-translate/core";
import { UtilsService } from "@common/utils/app.utils";
import { MultiClusterService } from "@services/multi-cluster.service";
import { SettingsService } from "@services/settings.service";
import { MapConstant } from "@common/constants/map.constant";
import { NotificationService } from "@services/notification.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-joining-modal",
  templateUrl: "./joining-modal.component.html",
  styleUrls: ["./joining-modal.component.scss"]
})
export class JoiningModalComponent implements OnInit {
  public cluster: any;
  public useProxy: String = "";

  constructor(
    private clustersService: MultiClusterService,
    private settingsService: SettingsService,
    private translate: TranslateService,
    private utils: UtilsService,
    public dialogRef: MatDialogRef<JoiningModalComponent>,
    private notificationService: NotificationService,
    private router: Router
    // @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    this.cluster = {
      master_host: "",
      master_port: "",
      token: "",
      name: "",
      host: "",
      port: MapConstant.FED_PORT.JOINT
    };
    this.useProxy = "";
    this.getClusterName();
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

  parseToken = () => {
    if (!(this.cluster.master_host || this.cluster.master_port)) {
      try {
        let decodedStr = JSON.parse(atob(this.cluster.token.trim()));
        this.cluster.master_host = decodedStr["s"];
        this.cluster.master_port = decodedStr["p"];
      } catch (e) {
        console.warn("token format is invalid.", e);
      }
    }
  };

  onConfirm = () => {
    this.clustersService.joinCluster(this.cluster, this.useProxy).subscribe(
      response => {
        this.notificationService.open(
          this.translate.instant('multiCluster.joining.success'));
        setTimeout(() => {
          this.router.navigate(
            ['logout']);
        } ,3000);
        this.dialogRef.close();
      },
      err => {
        let message = this.utils.getErrorMessage(err);
        this.notificationService.openError(message,this.translate.instant("multiCluster.joining.failure"));
      }
    );
  };
}
