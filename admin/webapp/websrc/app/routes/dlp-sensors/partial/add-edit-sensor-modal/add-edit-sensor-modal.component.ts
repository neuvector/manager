import { Component, OnInit, Inject } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DlpSensorsService } from '@services/dlp-sensors.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { updateGridData } from '@common/utils/common.utils';

@Component({
  selector: 'app-add-edit-sensor-modal',
  templateUrl: './add-edit-sensor-modal.component.html',
  styleUrls: ['./add-edit-sensor-modal.component.scss'],
})
export class AddEditSensorModalComponent implements OnInit {
  opTypeOptions = GlobalConstant.MODAL_OP;
  addEditSensorForm: FormGroup;
  submittingUpdate: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AddEditSensorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dlpSensorsService: DlpSensorsService,
    private translate: TranslateService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.addEditSensorForm = new FormGroup({
      name: new FormControl(
        this.data.opType === GlobalConstant.MODAL_OP.ADD
          ? ''
          : this.data.sensor.name,
        Validators.required
      ),
      comment: new FormControl(
        this.data.opType === GlobalConstant.MODAL_OP.ADD
          ? ''
          : this.data.sensor.comment
      ),
    });
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  updateSensor = () => {
    let payload = {
      config: this.addEditSensorForm.value,
    };
    this.dlpSensorsService
      .updateDlpSensorData(payload, this.data.opType)
      .subscribe(
        response => {
          this.notificationService.open(
            this.data.opType === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant('dlp.msg.INSERT_OK')
              : this.translate.instant('dlp.msg.UPDATE_OK')
          );
          this.dialogRef.close(true);
          updateGridData(
            this.data.dlpSensors,
            [
              this.data.opType === GlobalConstant.MODAL_OP.ADD
                ? {
                    cfg_type: GlobalConstant.CFG_TYPE.CUSTOMER,
                    comment: this.addEditSensorForm.value.comment,
                    groups: [],
                    name: this.addEditSensorForm.value.name,
                    predefine: false,
                    rules: [],
                  }
                : this.addEditSensorForm.value,
            ],
            this.data.gridApi,
            'name',
            this.data.opType === GlobalConstant.MODAL_OP.ADD ? 'add' : 'edit'
          );
        },
        error => {
          if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
            let msg =
              this.data.opType === GlobalConstant.MODAL_OP.ADD
                ? this.translate.instant('dlp.msg.INSERT_NG')
                : this.translate.instant('dlp.msg.UPDATE_NG');
            this.notificationService.open(
              this.utils.getAlertifyMsg(error.error, msg, false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        }
      );
  };
}
