import { Component, OnInit, Input } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { GroupsService } from '@services/groups.service';
import { GridOptions } from 'ag-grid-community';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { Script } from '@common/types';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-custom-check',
  templateUrl: './custom-check.component.html',
  styleUrls: ['./custom-check.component.scss']
})
export class CustomCheckComponent implements OnInit {

  @Input() source: string;
  @Input() groupName: string = '';
  @Input() resizableHeight: number;
  @Input() cfgType: string;
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
  isRefreshingForm: boolean = false;
  CFG_TYPE = GlobalConstant.CFG_TYPE;

  constructor(
    private groupsService: GroupsService,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.isWriteScriptAuthorized = this.authUtilsService.getDisplayFlag("write_script");
    this.initializeVM();
    this.gridOptions4CustomCheck = this.groupsService.prepareGrid4CustomCheck(this.isWriteScriptAuthorized, this.cfgType);
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
          if (response) {
            this.customCheckScripts = response;
            this.filteredCount = this.customCheckScripts.length;
            this.gridOptions4CustomCheck.api!.setRowData(response);
            this.switch2Add();
          } else {
            this.gridOptions4CustomCheck.api!.setRowData([]);
          }
        },
        error => {
          this.gridOptions4CustomCheck.api!.setRowData([]);
        }
      );
  };

  switch2Add = () => {
    this.gridOptions4CustomCheck.api!.deselectAll();
    this.customCheckForm.reset();
    setTimeout(() => {
      this.opType = GlobalConstant.MODAL_OP.ADD;
      this.customCheckForm.controls.name.setErrors(null);
    }, 200);
  };

  blurOnName = () => {
    if (!this.customCheckForm.controls.name!.value)
      this.customCheckForm.controls.name!.setValue('');
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
          this.notificationService.open(this.translate.instant("group.script.msg.SCRIPT_OK"));
          this.refresh();
        },
        error => {
          this.notificationService.openError(error, this.translate.instant("group.script.msg.SCRIPT_NG"));
        }
      );
  };

  private initializeVM = () => {
    this.customCheckForm = new FormGroup({
      name: new FormControl('', this.isWriteScriptAuthorized ? Validators.required : null),
      script: new FormControl('')
    });
  };
}
