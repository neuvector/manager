import { Component, ChangeDetectionStrategy } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { MatDialog } from "@angular/material/dialog";
import { TokenModalComponent } from "@routes/multi-cluster/token-modal/token-modal.component";
import { MultiClusterService } from "@services/multi-cluster.service";
import { GlobalConstant } from '@common/constants/global.constant';
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import swal from 'sweetalert';

@Component({
  selector: 'app-multi-cluster-grid-action-cell',
  templateUrl: './multi-cluster-grid-action-cell.component.html',
  styleUrls: ['./multi-cluster-grid-action-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class MultiClusterGridActionCellComponent implements ICellRendererAngularComp {
  public params!: ICellRendererParams;
  buttonDisplayMap: any;

  constructor(
    public multiClusterService: MultiClusterService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private router: Router
  ) {}

  agInit (params: ICellRendererParams): void {
    this.params = params;
    console.log("params:",this.params);
    this.buttonDisplayMap = {

    };
  };

  refresh (params: ICellRendererParams): boolean {
    return false;
  };

  isMasterRole = () => {
    return this.params.context.componentParent.isMasterRole;
  }

  isMasterCluster = () => {
    return this.params.data.clusterType == GlobalConstant.CLUSTER_TYPES.MASTER;
  };

  manageFedPolicy = () => {
    this.router.navigate(['federated-policy']);
  };


  remove = () => {
    let desc = "";
    swal({
      title: `Are you sure to remove the member cluster "${
        this.params.data.name
      }" ? `,
      text: desc,
      icon: "warning",
      buttons: {
        cancel: {
          text: "Cancel",
          value: null,
          visible: true,
          closeModal: true
        },
        confirm: {
          text: "Confirm",
          value: true,
          visible: true,
          className: "bg-danger",
          closeModal: true
        }
      }
    }).then(isConfirm => {
      if (isConfirm) {
        this.multiClusterService
          .removeMember(this.params.data.id)
          .subscribe(response => {
            console.log(response);
            swal("Removed", "The Member Cluster is removed.", "success");
          });
      }
    });
  };

  switchCluster = () => {
    console.log(this.params.data.id);
    this.multiClusterService.switchCluster(this.params.data.id, "");
  };

  generateToken = () => {
    this.multiClusterService.generateToken().subscribe(response => {
      console.log(response);
      this.openDialog(response["join_token"]);
    });
  };

  syncPolicy = (event, data) => {

  };

  leave = () => {
    let desc = "All federal policies will be removed.";
    swal({
      title: `Are you sure to leave the Federal ? `,
      text: desc,
      icon: "warning",
      buttons: {
        cancel: {
          text: "Cancel",
          value: null,
          visible: true,
          closeModal: true
        },
        confirm: {
          text: "Confirm",
          value: true,
          visible: true,
          className: "bg-danger",
          closeModal: true
        }
      }
    }).then(isConfirm => {
      if (isConfirm) {
        let force = true;
        this.multiClusterService.leaveFromMaster(force).subscribe(response => {
          console.log(response);
        });
        swal(
          "Succeed",
          "The Cluster successfully left the federal.",
          "success"
        );
      }
    });
  };

  demote = (data) => {
    let desc = `1. The Master Cluster will demote to an ordinary cluster.<br>
    2. Its federal policies will be removed from all member clusters. <br>
    3. The Federal Administrator will demote to the Administrator. <br>`;
    swal({
      title: `Are your sure to demote the Master Cluster " ${
        this.params.data.name
      } " ?`,
      // content: {
      //   element: "p",
      //   attributes: {
      //     innerHTML: `${desc}`
      //   }
      // },
      icon: "warning",
      buttons: {
        cancel: {
          text: "Cancel",
          value: null,
          visible: true,
          closeModal: true
        },
        confirm: {
          text: "Confirm",
          value: true,
          visible: true,
          className: "bg-danger",
          closeModal: true
        }
      }
    }).then(isConfirm => {
      if (isConfirm) {
        // swal("Demoted!", "The Master Cluster is demoted.", "success");
        this.multiClusterService.demoteCluster().subscribe(response => {
          console.log(response);
          swal("Demoted!", "The Master Cluster is demoted.", "success");
        });
      }
    });
  };

  openDialog = param => {
    this.dialog.open(TokenModalComponent, { data: { token: param } });
  };

  showEditClusterDialog = (event, data, flag) => {

  }
}
