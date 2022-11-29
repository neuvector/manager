import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AddEditSensorModalComponent } from '@routes/dlp-sensors/partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { DlpSensorsService } from '@services/dlp-sensors.service';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';

@Component({
  selector: 'app-sensor-action-buttons',
  templateUrl: './sensor-action-buttons.component.html',
  styleUrls: ['./sensor-action-buttons.component.scss'],
})
export class SensorActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private dlpSensorsService: DlpSensorsService,
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
        refresh: this.params.context.componentParent.refresh,
      },
      disableClose: true,
    });
  };

  deleteSensor = sensor => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: this.translate.instant('dlp.msg.REMOVE_CFM'),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.confirm
      .pipe(
        switchMap(() => {
          return this.dlpSensorsService.deleteDlpSensorData(sensor.name);
        })
      )
      .subscribe(
        res => {
          // confirm actions
          this.params.context.componentParent.refresh();
          this.notificationService.open(
            this.translate.instant('dlp.msg.REMOVE_OK')
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
                this.translate.instant('dlp.msg.REMOVE_NG'),
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
