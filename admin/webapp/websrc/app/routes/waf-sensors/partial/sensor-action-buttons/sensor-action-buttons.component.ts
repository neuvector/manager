import { Component, OnInit, SecurityContext } from '@angular/core';
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from 'ag-grid-community';
import { AddEditSensorModalComponent } from '@routes/waf-sensors/partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { MatDialog } from "@angular/material/dialog";
import { GlobalConstant } from '@common/constants/global.constant';
import { ConfirmDialogComponent } from "@components/ui/confirm-dialog/confirm-dialog.component";
import { switchMap } from 'rxjs/operators';
import { ShortenFromMiddlePipe } from "@common/pipes/app.pipes";
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { WafSensorsService } from '@services/waf-sensors.service';

@Component({
  selector: 'app-sensor-action-buttons',
  templateUrl: './sensor-action-buttons.component.html',
  styleUrls: ['./sensor-action-buttons.component.scss']
})
export class SensorActionButtonsComponent implements ICellRendererAngularComp {

  params!: ICellRendererParams;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private shortenFromMiddlePipe: ShortenFromMiddlePipe,
    private wafSensorsService: WafSensorsService
  ) { }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    console.log("this.params", this.params);
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  editSensor = (sensor) => {
    const addEditDialogRef = this.dialog.open(AddEditSensorModalComponent, {
      width: "80%",
      data: {
        sensor: sensor,
        opType: GlobalConstant.MODAL_OP.EDIT,
        index: this.params.rowIndex,
        refresh: this.params.context.componentParent.refresh
      },
      disableClose: true
    });
  };

  deleteSensor = (sensor) => {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "700px",
      data: {
        message: `${this.translate.instant("waf.msg.REMOVE_CFM")}` + this.sanitizer.sanitize(SecurityContext.HTML, this.shortenFromMiddlePipe.transform(sensor.name, 30))
      },
      disableClose: true
    });
    dialogRef.componentInstance.confirm.pipe(switchMap(() => {
      return this.wafSensorsService.deleteWafSensorData(sensor.name);
    })).subscribe(
      (res) => {
        // confirm actions
        this.params.context.componentParent.refresh();
        // close dialog
        dialogRef.componentInstance.onCancel();
        dialogRef.componentInstance.loading = false;
      },
      error => {}
    )
  };

}
