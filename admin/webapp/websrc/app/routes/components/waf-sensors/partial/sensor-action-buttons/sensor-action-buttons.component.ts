import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { updateGridData } from '@common/utils/common.utils';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { AddEditSensorModalComponent } from '@components/waf-sensors/partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { WafSensorsService } from '@services/waf-sensors.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { switchMap } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-waf-sensor-action-buttons',
  templateUrl: './sensor-action-buttons.component.html',
  styleUrls: ['./sensor-action-buttons.component.scss'],
})
export class SensorActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  navSource = GlobalConstant.NAV_SOURCE;
  CFG_TYPE = GlobalConstant.CFG_TYPE;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private wafSensorsService: WafSensorsService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    console.log('this.params', this.params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  editSensor = sensor => {
    const addEditDialogRef = this.dialog.open(AddEditSensorModalComponent, {
      width: '80%',
      data: {
        sensor: sensor,
        opType: GlobalConstant.MODAL_OP.EDIT,
        index: this.params.rowIndex,
        wafSensors: this.params.context.componentParent.wafSensors,
        gridApi: this.params.context.componentParent.gridApi4Sensors!,
        source: this.params.context.componentParent.source,
      },
    });
  };

  deleteSensor = sensor => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('waf.msg.REMOVE_CFM'),
      },
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.wafSensorsService.deleteWafSensorData(sensor.name);
        })
      )
      .subscribe(
        res => {
          // confirm actions
          updateGridData(
            this.params.context.componentParent.wafSensors,
            [sensor],
            this.params.context.componentParent.gridApi4Sensors!,
            'name',
            'delete'
          );
          this.notificationService.open(
            this.translate.instant('waf.msg.REMOVE_OK')
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
                this.translate.instant('waf.msg.REMOVE_NG'),
                false
              ),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };
}
