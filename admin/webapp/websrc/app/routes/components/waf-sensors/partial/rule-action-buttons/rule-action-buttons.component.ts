import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { AddEditRuleModalComponent } from '@components/waf-sensors/partial/add-edit-rule-modal/add-edit-rule-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { WafSensorsService } from '@services/waf-sensors.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { switchMap } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-waf-rule-action-buttons',
  templateUrl: './rule-action-buttons.component.html',
  styleUrls: ['./rule-action-buttons.component.scss'],
})
export class RuleActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  isPredefine!: boolean;
  navSource = GlobalConstant.NAV_SOURCE;
  CFG_TYPE = GlobalConstant.CFG_TYPE;

  constructor(
    private translate: TranslateService,
    private wafSensorsService: WafSensorsService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isPredefine = this.params.context.componentParent.isPredefine;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  editRule = rule => {
    const addEditDialogRef = this.dialog.open(AddEditRuleModalComponent, {
      width: '80%',
      data: {
        sensor: this.params.context.componentParent.selectedSensor,
        rule: rule,
        opType: GlobalConstant.MODAL_OP.EDIT,
        index: this.params.rowIndex,
        index4Sensor: this.params.context.componentParent.index4Sensor,
        gridOptions4EditPatterns:
          this.params.context.componentParent.gridOptions4EditPatterns,
        gridApi: this.params.context.componentParent.gridApi4Rules!,
      },
    });
  };

  deleteRule = rule => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('waf.msg.REMOVE_CFM'),
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          this.params.context.componentParent.selectedSensor.rules.splice(
            this.params.rowIndex,
            1
          );
          let payload = {
            config: {
              name: this.params.context.componentParent.selectedSensor.name,
              comment:
                this.params.context.componentParent.selectedSensor.comment,
              rules: this.params.context.componentParent.selectedSensor.rules,
            },
          };
          return this.wafSensorsService.updateWafSensorData(
            payload,
            GlobalConstant.MODAL_OP.EDIT
          );
        })
      )
      .subscribe(
        res => {
          // confirm actions
          let gridApi = this.params.context.componentParent.gridApi4Rules!;
          let rules = this.params.context.componentParent.selectedSensor.rules;
          gridApi.setGridOption('rowData', rules);
          if (rules.length > 0) {
            setTimeout(() => {
              let rowNode = gridApi.getDisplayedRowAtIndex(0);
              rowNode?.setSelected(true);
            }, 200);
          } else {
            this.params.context.componentParent.gridApi4Patterns!.setGridOption(
              'rowData',
              []
            );
          }
          this.notificationService.open(
            this.translate.instant('waf.msg.REMOVE_RULE_OK')
          );
          // close dialog
          dialogRef.componentInstance.onCancel();
          dialogRef.componentInstance.loading = false;
        },
        error => {
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            this.notificationService.open(
              this.utils.getAlertifyMsg(
                error.error,
                this.translate.instant('waf.msg.REMOVE_RULE_NG'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
          dialogRef.componentInstance.loading = false;
        }
      );
  };
}
