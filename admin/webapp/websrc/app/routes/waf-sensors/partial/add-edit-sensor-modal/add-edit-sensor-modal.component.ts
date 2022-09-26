import { Component, OnInit, Inject } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WafSensorsService } from '@services/waf-sensors.service';

@Component({
  selector: 'app-add-edit-sensor-modal',
  templateUrl: './add-edit-sensor-modal.component.html',
  styleUrls: ['./add-edit-sensor-modal.component.scss']
})
export class AddEditSensorModalComponent implements OnInit {

  opTypeOptions = GlobalConstant.MODAL_OP;
  addEditSensorForm: FormGroup;
  submittingUpdate: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<AddEditSensorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private wafSensorsService: WafSensorsService
  ) { }

  ngOnInit(): void {
    this.addEditSensorForm = new FormGroup({
      name: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? "" : this.data.sensor.name, Validators.required),
      comment: new FormControl(this.data.opType === GlobalConstant.MODAL_OP.ADD ? "" : this.data.sensor.comment)
    });
  }

  onCancel = () => {
    this.dialogRef.close(false);
  }

  updateSensor = () => {
    let payload = {
      config: this.addEditSensorForm.value
    };
    this.wafSensorsService.updateWafSensorData(payload, this.data.opType)
      .subscribe(
        response => {
          this.dialogRef.close(true);
          setTimeout(() => {
            this.data.refresh(this.data.index);
          }, 2000);
        },
        error => {}
      );
  };
}
