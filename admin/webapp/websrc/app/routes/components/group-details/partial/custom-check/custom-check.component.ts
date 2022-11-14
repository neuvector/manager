import { Component, OnInit, Input } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { GroupsService } from '@services/groups.service';
import { GridOptions } from 'ag-grid-community';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { Script } from '@common/types';

@Component({
  selector: 'app-custom-check',
  templateUrl: './custom-check.component.html',
  styleUrls: ['./custom-check.component.scss']
})
export class CustomCheckComponent implements OnInit {

  @Input() source: string;
  @Input() groupName: string = '';
  @Input() resizableHeight: number;
  opType: string = GlobalConstant.MODAL_OP.ADD;
  submittingUpdate: boolean = false;
  modalOp = GlobalConstant.MODAL_OP;
  customCheckForm: FormGroup;
  gridOptions4CustomCheck: GridOptions;
  isWriteScriptAuthorized: boolean = false;
  customCheckScripts: Array<Script> = [];
  selectedScript: Script;
  context = { componentParent: this };
  filteredCount: number = 0;

  constructor(
    private groupsService: GroupsService,
    private authUtilsService: AuthUtilsService
  ) { }

  ngOnInit(): void {
    this.isWriteScriptAuthorized = this.authUtilsService.getDisplayFlag("write_script");
    this.initializeVM();
    this.gridOptions4CustomCheck = this.groupsService.prepareGrid4CustomCheck(this.isWriteScriptAuthorized);
    this.gridOptions4CustomCheck.onSelectionChanged = () => {
      this.selectedScript = this.gridOptions4CustomCheck.api!.getSelectedRows()[0];
      this.opType = GlobalConstant.MODAL_OP.EDIT;
      if (this.selectedScript) {
        this.customCheckForm.controls.name.setValue(this.selectedScript.name);
        this.customCheckForm.controls.script.setValue(this.selectedScript.script);
      }
    };
    this.refresh();
  }

  refresh = () => {
    this.groupsService.getCustomCheckData(this.groupName)
      .subscribe(
        (response: any) => {
          this.customCheckScripts = response;
          this.filteredCount = this.customCheckScripts.length;
          this.gridOptions4CustomCheck.api!.setRowData(response);
          this.switch2Add();
        },
        error => {
          this.gridOptions4CustomCheck.api!.setRowData([]);
        }
      );
  };

  switch2Add = () => {
    this.gridOptions4CustomCheck.api!.deselectAll();
    this.customCheckForm.controls.name.setValue('');
    this.customCheckForm.controls.script.setValue('');
    setTimeout(() => {
      this.opType = GlobalConstant.MODAL_OP.ADD;
    }, 200);
  };

  updateScript = () => {
    let payload = this.opType === GlobalConstant.MODAL_OP.ADD ?
      {
        group: this.groupName,
        config: {
          add: {
            scripts: [this.customCheckForm.value]
          }
        }
      } : {
        group: this.groupName,
        config: {
          update: {
            scripts: [this.customCheckForm.value]
          }
        }
      };
    this.groupsService.updateCustomCheckData(payload)
      .subscribe(
        response => {
          this.refresh();
        },
        error => {}
      );
  };

  private initializeVM = () => {
    this.customCheckForm = new FormGroup({
      name: new FormControl('', this.isWriteScriptAuthorized ? Validators.required : null),
      script: new FormControl('')
    });
  };
}
