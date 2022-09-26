import { Component, OnInit, Input } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { GroupsService } from '@services/groups.service';
import { DlpSetting } from '@common/types';
import { MatDialog } from "@angular/material/dialog";
import { GroupDlpConfigModalComponent } from '@components/group-details/partial/group-dlp-config-modal/group-dlp-config-modal.component';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  selector: 'app-group-dlp',
  templateUrl: './group-dlp.component.html',
  styleUrls: ['./group-dlp.component.scss']
})
export class GroupDlpComponent implements OnInit {

  @Input() source: string;
  @Input() groupName: string = '';
  @Input() resizableHeight: number;
  gridOptions4GroupDlpSensors: GridOptions;
  groupDlpSensors: Array<DlpSetting> = [];
  filteredCount: number = 0;
  selectedSensor: DlpSetting;
  enabled: boolean = false;
  isWriteDlpAuthorized: boolean;

  constructor(
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService
  ) { }

  ngOnInit(): void {
    this.isWriteDlpAuthorized = this.authUtilsService.getDisplayFlag("write_dlp_rule");
    this.gridOptions4GroupDlpSensors = this.groupsService.prepareGrid4GroupDlpSensors();
    this.gridOptions4GroupDlpSensors.onSelectionChanged = () => {
      this.selectedSensor = this.gridOptions4GroupDlpSensors.api!.getSelectedRows()[0];
    };
    this.refresh();
  }

  refresh = () => {
    this.groupsService.getGroupDlpSensorData(this.groupName)
      .subscribe(
        (response: any) => {
          this.groupDlpSensors = response.sensors;
          this.gridOptions4GroupDlpSensors.api!.setRowData(this.groupDlpSensors);
          this.enabled = response.status;
          this.filteredCount = this.groupDlpSensors.length;
        },
        error => {}
      );
  };

  openEditGroupSensorModal = () => {
    const addEditDialogRef = this.dialog.open(GroupDlpConfigModalComponent, {
      width: "80%",
      data: {
        configuredSensors: this.groupDlpSensors,
        groupName: this.groupName,
        status: this.enabled,
        refresh: this.refresh
      },
      disableClose: true
    });
  };

}
