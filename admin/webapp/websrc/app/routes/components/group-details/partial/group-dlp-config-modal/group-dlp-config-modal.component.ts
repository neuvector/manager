import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GridOptions } from 'ag-grid-community';
import { GroupsService } from '@services/groups.service';
import { DlpSensor } from '@common/types';

@Component({
  selector: 'app-group-dlp-config-modal',
  templateUrl: './group-dlp-config-modal.component.html',
  styleUrls: ['./group-dlp-config-modal.component.scss']
})
export class GroupDlpConfigModalComponent implements OnInit {

  gridOptions4DlpSensorOption: GridOptions;
  filteredCount: number = 0;
  dlpSensorOption: Array<DlpSensor> = [];
  selectedDlpSensors: Array<DlpSensor> = [];
  submittingUpdate: boolean = false;


  constructor(
    public dialogRef: MatDialogRef<GroupDlpConfigModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private groupsService: GroupsService
  ) { }

  ngOnInit(): void {
    this.gridOptions4DlpSensorOption = this.groupsService.prepareGrid4DlpSensorOption();
    this.gridOptions4DlpSensorOption.onSelectionChanged = () => {
      this.selectedDlpSensors = this.gridOptions4DlpSensorOption.api!.getSelectedRows();
    };
    this.refresh();
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  refresh = () => {
    this.groupsService.getDlpSensorData()
      .subscribe(
        (response: any) => {
          this.dlpSensorOption = response;
          this.dlpSensorOption = this.dlpSensorOption.map(sensor => {
            return Object.assign(sensor, { isAllowed: false });
          });
          this.gridOptions4DlpSensorOption.api!.setRowData(this.dlpSensorOption);
          setTimeout(() => {
            this.gridOptions4DlpSensorOption.api!.forEachNode((node, index) => {
              this.data.configuredSensors.forEach(configuredSensor => {
                if (node.data.name === configuredSensor.name) {
                  node.data.isAllowed = configuredSensor.action === "allow";
                  node.setSelected(true);
                }
              });
            });
          }, 200);
          this.filteredCount = this.dlpSensorOption.length;
        },
        error => {}
      );
  };

  adoptSensors = () => {
    this.submittingUpdate = true;
    let payload = {
      config: {
        name: this.data.groupName,
        status:  this.data.status,
        replace: this.selectedDlpSensors.map(sensor => {
          return {
            name: sensor.name,
            action: sensor.isAllowed ? "allow" : "deny"
          };
        })
      }
    };

    this.groupsService.updateGroupDlpSensorData(payload)
      .subscribe(
        response => {
          setTimeout(() => {
            this.data.refresh();
          }, 1000);
          this.dialogRef.close(true);
        },
        error => {}
      );
  };

}
