import { Component, OnInit, Input } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { GroupsService } from '@services/groups.service';
import { GridOptions } from 'ag-grid-community';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { Script } from '@common/types';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import { updateGridData } from '@common/utils/common.utils';

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
  @Input() useQuickFilterService: boolean = false;
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
  isCustomCheckPromiseCompleted: boolean = false;
  hasConfigurationWarning: boolean = false;
  CFG_TYPE = GlobalConstant.CFG_TYPE;

  constructor(
    private groupsService: GroupsService,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private quickFilterService: QuickFilterService,
  ) { }

  ngOnInit(): void {
    if (this.useQuickFilterService) {
      this.quickFilterService.textInput$.subscribe((value: string) => {
        this.quickFilterService.onFilterChange(value, this.gridOptions4CustomCheck);
      });
    }

    this.initializeVM();
    this.refresh();
  }
  refresh = () => {
    this.isCustomCheckPromiseCompleted = false;
    this.hasConfigurationWarning = false;
    let hasWritePermissionUnderStrictControl = GlobalVariable.user.roles.global === '2' || GlobalVariable.user.roles.global === '4';
    this.groupsService.getCustomCheckData(this.groupName)
      .subscribe(
        (response: any) => {
          this.isCustomCheckPromiseCompleted = true;
          this.customCheckScripts = response.scripts;
          this.filteredCount = this.customCheckScripts ? this.customCheckScripts.length : 0;
          this.isWriteScriptAuthorized = response.enabled && response.writable;
          this.hasConfigurationWarning = hasWritePermissionUnderStrictControl && !this.isWriteScriptAuthorized;
          this.gridOptions4CustomCheck = this.groupsService.prepareGrid4CustomCheck(this.isWriteScriptAuthorized, this.cfgType);
          this.gridOptions4CustomCheck.onSelectionChanged = () => {
            this.selectedScript = this.gridOptions4CustomCheck.api!.getSelectedRows()[0];
            this.opType = GlobalConstant.MODAL_OP.EDIT;
            if (this.selectedScript) {
              this.customCheckForm.controls.name.setValue(this.selectedScript.name);
              this.customCheckForm.controls.script.setValue(this.selectedScript.script);
            }
          };
          setTimeout(() => {
            if (response) {
              this.gridOptions4CustomCheck.api!.setRowData(this.customCheckScripts);
              this.switch2Add();
            } else {
              this.gridOptions4CustomCheck.api!.setRowData([]);
            }
          }, 200);
        },
        error => {
          this.isCustomCheckPromiseCompleted = true;
          this.gridOptions4CustomCheck = this.groupsService.prepareGrid4CustomCheck(false, this.cfgType);
          this.gridOptions4CustomCheck.onSelectionChanged = () => {
            this.selectedScript = this.gridOptions4CustomCheck.api!.getSelectedRows()[0];
            this.opType = GlobalConstant.MODAL_OP.EDIT;
            if (this.selectedScript) {
              this.customCheckForm.controls.name.setValue(this.selectedScript.name);
              this.customCheckForm.controls.script.setValue(this.selectedScript.script);
            }
          };
          setTimeout(() => {
            this.gridOptions4CustomCheck.api!.setRowData([]);
          }, 200);
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
          updateGridData(
            this.customCheckScripts,
            payload.config[this.opType === GlobalConstant.MODAL_OP.ADD ? 'add' : 'update']!.scripts,
            this.gridOptions4CustomCheck.api!,
            'name',
            this.opType === GlobalConstant.MODAL_OP.ADD ? 'add' : 'edit'
          );
          this.initializeVM();
        },
        error => {
          this.notificationService.openError(error.error, this.translate.instant("group.script.msg.SCRIPT_NG"));
        }
      );
  };

  initializeVM = () => {
    this.isRefreshingForm = true;
    this.customCheckForm = new FormGroup({
      name: new FormControl('', this.isWriteScriptAuthorized ? Validators.required : null),
      script: new FormControl('')
    });
    setTimeout(() => {
      this.isRefreshingForm = false;
    });
  };
}
