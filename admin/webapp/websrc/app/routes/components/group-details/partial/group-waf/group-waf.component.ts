import { Component, OnInit, Input } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { GroupsService } from '@services/groups.service';
import { WafSetting } from '@common/types';
import { MatDialog } from "@angular/material/dialog";
import { GroupWafConfigModalComponent } from '@components/group-details/partial/group-waf-config-modal/group-waf-config-modal.component';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  selector: 'app-group-waf',
  templateUrl: './group-waf.component.html',
  styleUrls: ['./group-waf.component.scss']
})
export class GroupWafComponent implements OnInit {

  @Input() source: string;
  @Input() groupName: string = '';
  @Input() resizableHeight: number;
  gridOptions4GroupWafSensors: GridOptions;
  groupWafSensors: Array<WafSetting> = [];
  filteredCount: number = 0;
  selectedSensor: WafSetting;
  enabled: boolean = false;
  isWriteWafAuthorized: boolean;

  constructor(
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService
  ) { }

  ngOnInit(): void {
    this.isWriteWafAuthorized = this.authUtilsService.getDisplayFlag("write_waf_rule");
    this.gridOptions4GroupWafSensors = this.groupsService.prepareGrid4GroupWafSensors();
    this.gridOptions4GroupWafSensors.onSelectionChanged = () => {
      this.selectedSensor = this.gridOptions4GroupWafSensors.api!.getSelectedRows()[0];
    };
    this.refresh();
  }

  refresh = () => {
    this.groupsService.getGroupWafSensorData(this.groupName)
      .subscribe(
        (response: any) => {
          this.groupWafSensors = response.sensors;
          this.gridOptions4GroupWafSensors.api!.setRowData(this.groupWafSensors);
          this.enabled = response.status;
          this.filteredCount = this.groupWafSensors.length;
        },
        error => {}
      );
  };

  openEditGroupSensorModal = () => {
    const addEditDialogRef = this.dialog.open(GroupWafConfigModalComponent, {
      width: "80%",
      data: {
        configuredSensors: this.groupWafSensors,
        groupName: this.groupName,
        status: this.enabled,
        refresh: this.refresh
      },
      disableClose: true
    });
  };

}
