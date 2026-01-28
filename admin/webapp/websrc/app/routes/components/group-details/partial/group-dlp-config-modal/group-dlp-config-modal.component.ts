import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GridOptions, GridApi } from 'ag-grid-community';
import { GroupsService } from '@services/groups.service';
import { DlpSensor } from '@common/types';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import * as $ from 'jquery';

@Component({
  standalone: false,
  selector: 'app-group-dlp-config-modal',
  templateUrl: './group-dlp-config-modal.component.html',
  styleUrls: ['./group-dlp-config-modal.component.scss'],
})
export class GroupDlpConfigModalComponent implements OnInit {
  gridOptions4DlpSensorOption: GridOptions;
  gridApi!: GridApi;
  filteredCount: number = 0;
  filtered: boolean = false;
  dlpSensorOption: Array<DlpSensor> = [];
  selectedDlpSensors: Array<DlpSensor> = [];
  selectedDLPSensorNodes: Array<any> = [];
  submittingUpdate: boolean = false;
  context = { componentParent: this };

  constructor(
    public dialogRef: MatDialogRef<GroupDlpConfigModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private groupsService: GroupsService,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.gridOptions4DlpSensorOption =
      this.groupsService.prepareGrid4DlpSensorOption();
    this.gridOptions4DlpSensorOption.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
          params.api.sizeColumnsToFit();
        }
      }, 300);
      $win.on(GlobalConstant.AG_GRID_RESIZE, () => {
        setTimeout(() => {
          if (params && params.api) {
            params.api.sizeColumnsToFit();
          }
        }, 100);
      });
    };
    this.gridOptions4DlpSensorOption.onSelectionChanged = () => {
      this.selectedDlpSensors = this.gridApi!.getSelectedRows();
      this.selectedDLPSensorNodes = this.gridApi!.getSelectedNodes();
    };
    this.refresh();
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  refresh = () => {
    this.groupsService.getDlpSensorData(this.data.source).subscribe(
      (response: any) => {
        this.dlpSensorOption = response;
        this.dlpSensorOption = this.dlpSensorOption.map(sensor => {
          return Object.assign(sensor, { isAllowed: false });
        });
        this.gridApi!.setGridOption('rowData', this.dlpSensorOption);
        setTimeout(() => {
          this.gridApi!.forEachNode((node, index) => {
            this.data.configuredSensors.forEach(configuredSensor => {
              if (node.data.name === configuredSensor.name) {
                node.data.isAllowed = configuredSensor.action === 'allow';
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
        status: this.data.status,
        replace: this.selectedDlpSensors.map(sensor => {
          return {
            name: sensor.name,
            action: sensor.isAllowed ? 'allow' : 'deny',
          };
        }),
      },
    };

    this.groupsService.updateGroupDlpSensorData(payload).subscribe(
      response => {
        this.notificationService.open(
          this.translate.instant('group.dlp.msg.SETTING_OK')
        );
        setTimeout(() => {
          this.data.refresh();
        }, 1000);
        this.dialogRef.close(true);
      },
      error => {
        this.notificationService.openError(
          error.error,
          this.translate.instant('group.dlp.msg.SETTING_NG')
        );
      }
    );
  };

  filterCountChanged = (results: number) => {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.dlpSensorOption.length;
  };
}
