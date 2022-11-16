import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { GlobalConstant } from '@common/constants/global.constant';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { ResponseRulesService } from '@services/response-rules.service';
import { AddEditResponseRuleModalComponent } from '../add-edit-response-rule-modal/add-edit-response-rule-modal.component';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.scss'],
})
export class ActionButtonsComponent implements ICellRendererAngularComp {
  public params;
  private isModalOpen: boolean = false;
  constructor(
    private translate: TranslateService,
    private responseRulesService: ResponseRulesService,
    public dialog: MatDialog,
    private utils: UtilsService
  ) {}

  agInit(params: any): void {
    if (params.node && params.node.data) {
      this.params = params;
    }
  };

  refresh(params: any): boolean {
    this.params = params;
    return true;
  };

  editResponseRule = (event, id): void => {
    this.responseRulesService.index4Edit = this.responseRulesService.getIndex(
      this.responseRulesService.responseRules,
      id
    );
    let rowNode =
      this.params.context.componentParent.gridOptions.api.getDisplayedRowAtIndex(
        this.responseRulesService.index4Edit
      );
    rowNode.setSelected(true);
    this.responseRulesService.getAutoCompleteData().subscribe(
      response => {
        this.openAddResponseRuleModal(response, GlobalConstant.MODAL_OP.EDIT);
      },
      err => {
        this.openAddResponseRuleModal([], GlobalConstant.MODAL_OP.EDIT);
      }
    );
  };

  addResponseRule = (event, id): void => {
    if (!this.isModalOpen) {
      this.responseRulesService.index4Add = this.responseRulesService.getIndex(
        this.responseRulesService.responseRules,
        id
      );
      this.responseRulesService.getAutoCompleteData().subscribe(
        response => {
          this.openAddResponseRuleModal(response, GlobalConstant.MODAL_OP.ADD);
        },
        err => {
          this.openAddResponseRuleModal([], GlobalConstant.MODAL_OP.ADD);
        }
      );
      this.isModalOpen = true;
    }
  };

  private openAddResponseRuleModal = (
    autoCompleteData: Object[] = [],
    type
  ): void => {
    let addDialogRef = this.dialog.open(AddEditResponseRuleModalComponent, {
      data: {
        autoCompleteData: autoCompleteData,
        type: type,
      },
      disableClose: true, width: "70vw"
    });
    addDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.params.context.componentParent.getResponseRules();
        this.isModalOpen = false;
      }, 1000);
    });
  };

  toggleRuleItem = (event, data): void => {
    data.disable = !data.disable;
    let responseRule = {
      id: data.id,
      disable: data.disable,
      cfg_type: data.cfg_type
    };
    this.responseRulesService
      .insertUpdateResponseRuleData(responseRule, [], 'toggle', [])
      .subscribe(
        response => {
          setTimeout(() => {
            this.params.context.componentParent.getResponseRules();
          }, 1000);
          if (data.disable) {
            // sweetAlert(
            //   "Disabled!",
            //   "Your response rule has been disabled.",
            //   "success"
            // );
          } else {
            // sweetAlert(
            //   "Enabled!",
            //   "Your response rule has been enabled.",
            //   "success"
            // );
          }
        },
        err => {
          if (
            err.status !== GlobalConstant.STATUS_AUTH_TIMEOUT &&
            err.status !== GlobalConstant.STATUS_UNAUTH &&
            err.status !== GlobalConstant.STATUS_SERVER_UNAVAILABLE
          ) {
            let message = this.utils.getErrorMessage(err);
            // sweetAlert(
            //   "Error!",
            //   `Something wrong when toggle response rule status! - ${message}`,
            //   "error"
            // );
          }
        }
      );
  };

  deleteRuleItem = (event, id): void => {
    this.responseRulesService.index4Delete = this.responseRulesService.getIndex(
      this.responseRulesService.responseRules,
      id
    );
    let rowNode =
      this.params.context.componentParent.gridOptions.api.getDisplayedRowAtIndex(
        this.responseRulesService.index4Delete
      );
    rowNode.setSelected(true);
    let isQuarantined =
      this.responseRulesService.responseRules[
        this.responseRulesService.index4Delete
      ].actions.includes('quarantine');
    // // sweetAlert({
    // //   title: "HTML <small>Title</small>!",
    // //   text: "A custom <span style='color:#F8BB86'>html<span> message.",
    // //   html: true
    // // });
    // sweetAlert({
    //   title: "Removal confirmation",
    //   text: `${this.translate.instant(
    //     "responsePolicy.dialog.content.REMOVE_CONFIRM"
    //   )}? ID: ${id}`,
    //   html: true,
    //   icon: "warning",
    //   buttons: {
    //     cancel: {
    //       text: "Cancel",
    //       value: null,
    //       visible: true,
    //       className: "",
    //       closeModal: false
    //     },
    //     confirm: {
    //       text: "Remove",
    //       value: true,
    //       visible: true,
    //       className: "bg-danger",
    //       closeModal: false
    //     }
    //   }
    // }).then(isConfirm => {
    //   if (isConfirm) {
    this.responseRulesService.removeResponseRuleData(id).subscribe(
      response => {
        setTimeout(() => {
          this.params.context.componentParent.getResponseRules();
        }, 1000);
        // sweetAlert(
        //   "Deleted!",
        //   "Your response rule has been removed.",
        //   "success"
        // );
      },
      err => {
        if (
          err.status !== GlobalConstant.STATUS_AUTH_TIMEOUT &&
          err.status !== GlobalConstant.STATUS_UNAUTH &&
          err.status !== GlobalConstant.STATUS_SERVER_UNAVAILABLE
        ) {
          let message = this.utils.getErrorMessage(err);
          // sweetAlert(
          //   "Error!",
          //   `Something wrong when process response rule removal! - ${message}`,
          //   "error"
          // );
        }
      }
    );
    //   } else {
    //     sweetAlert("Cancelled", "Your response rule is safe", "error");
    //   }
    // });
  };

  unquarantine = (event, id) => {
    // sweetAlert({
    //   title: "Unquarantine and Removal confirmation",
    //   text: `${this.translate.instant(
    //     "responsePolicy.dialog.UNQUARANTINE_CHECK"
    //   )} and remove the rule? - ID: ${id}`,
    //   html: true,
    //   icon: "warning",
    //   buttons: {
    //     cancel: {
    //       text: "Cancel",
    //       value: null,
    //       visible: true,
    //       className: "",
    //       closeModal: false
    //     },
    //     confirm: {
    //       text: "Unquarantine and Remove",
    //       value: true,
    //       visible: true,
    //       className: "bg-danger",
    //       closeModal: false
    //     }
    //   }
    // }).then(isConfirm => {
    //   if (isConfirm) {
    this.responseRulesService.unquarantine(id).subscribe(
      response => {
        setTimeout(() => {
          this.params.context.componentParent.getResponseRules();
        }, 1000);
        // sweetAlert(
        //   "Unquarantined and Deleted!",
        //   "Your response rule has been removed and all the containers under this rule are unquarantined.",
        //   "success"
        // );
      },
      err => {
        if (
          err.status !== GlobalConstant.STATUS_AUTH_TIMEOUT &&
          err.status !== GlobalConstant.STATUS_UNAUTH &&
          err.status !== GlobalConstant.STATUS_SERVER_UNAVAILABLE
        ) {
          let message = this.utils.getErrorMessage(err);
          // sweetAlert(
          //   "Error!",
          //   `Something wrong when remove response rule and unquarantine containers! - ${message}`,
          //   "error"
          // );
        }
      }
    );
    //   } else {
    //     sweetAlert("Cancelled", "Your response rule is safe", "error");
    //   }
    // });
  };
}
