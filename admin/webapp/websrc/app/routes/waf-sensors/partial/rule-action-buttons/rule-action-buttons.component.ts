import { Component, OnInit, SecurityContext } from '@angular/core';
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from 'ag-grid-community';
import { AddEditRuleModalComponent } from '@routes/waf-sensors/partial/add-edit-rule-modal/add-edit-rule-modal.component';
import { MatDialog } from "@angular/material/dialog";
import { GlobalConstant } from '@common/constants/global.constant';
import { ConfirmDialogComponent } from "@components/ui/confirm-dialog/confirm-dialog.component";
import { switchMap } from 'rxjs/operators';
import { WafSensorsService } from '@services/waf-sensors.service';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ShortenFromMiddlePipe } from "@common/pipes/app.pipes";
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  selector: 'app-rule-action-buttons',
  templateUrl: './rule-action-buttons.component.html',
  styleUrls: ['./rule-action-buttons.component.scss']
})
export class RuleActionButtonsComponent implements ICellRendererAngularComp {

  params!: ICellRendererParams;
  isPredefine: boolean;

  constructor(
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private shortenFromMiddlePipe: ShortenFromMiddlePipe,
    private wafSensorsService: WafSensorsService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) { }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isPredefine = this.params.context.componentParent.isPredefine;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  editRule = (rule) => {
    const addEditDialogRef = this.dialog.open(AddEditRuleModalComponent, {
      width: "80%",
      data: {
        sensor: this.params.context.componentParent.selectedSensor,
        rule: rule,
        opType: GlobalConstant.MODAL_OP.EDIT,
        index: this.params.rowIndex,
        index4Sensor: this.params.context.componentParent.index4Sensor,
        gridOptions4EditPatterns: this.params.context.componentParent.gridOptions4EditPatterns,
        refresh: this.params.context.componentParent.refresh
      },
      disableClose: true
    });
  };

  deleteRule = (rule) => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "700px",
      data: {
        message: `${this.translate.instant("waf.msg.REMOVE_CFM")}` + this.sanitizer.sanitize(SecurityContext.HTML, this.shortenFromMiddlePipe.transform(rule.name, 30))
      },
      disableClose: true
    });
    dialogRef.componentInstance.confirm.pipe(switchMap(() => {
      this.params.context.componentParent.selectedSensor.rules.splice(this.params.rowIndex, 1);
      let payload = {
        config: {
          name: this.params.context.componentParent.selectedSensor.name,
          comment: this.params.context.componentParent.selectedSensor.comment,
          rules: this.params.context.componentParent.selectedSensor.rules
        }
      };
      return this.wafSensorsService.updateWafSensorData(payload, GlobalConstant.MODAL_OP.EDIT);
    })).subscribe(
      (res) => {
        // confirm actions
        this.params.context.componentParent.refresh(this.params.context.componentParent.index4Sensor);
        this.notificationService.open(this.translate.instant("waf.msg.REMOVE_RULE_OK"));
        // close dialog
        dialogRef.componentInstance.onCancel();
        dialogRef.componentInstance.loading = false;
      },
      error => {
        if (MapConstant.USER_TIMEOUT.includes(error.status)) {
          this.notificationService.open(
            this.utils.getAlertifyMsg(error.error, this.translate.instant("waf.msg.REMOVE_RULE_NG"), false),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      }
    )
  };

}
