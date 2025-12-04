import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { GridOptions, GridApi } from 'ag-grid-community';
import { GroupsService } from '@services/groups.service';
import { DlpSetting } from '@common/types';
import { MatDialog } from '@angular/material/dialog';
import { GroupDlpConfigModalComponent } from '@components/group-details/partial/group-dlp-config-modal/group-dlp-config-modal.component';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { QuickFilterService } from '@components/quick-filter/quick-filter.service';
import * as $ from 'jquery';


@Component({
  standalone: false,
  selector: 'app-group-dlp',
  templateUrl: './group-dlp.component.html',
  styleUrls: ['./group-dlp.component.scss'],
  
})
export class GroupDlpComponent implements OnInit, OnChanges {
  @Input() source: string;
  @Input() groupName: string = '';
  @Input() resizableHeight: number;
  @Input() cfgType: string;
  @Input() useQuickFilterService: boolean = false;
  @Output() getEditGroupSensorModal = new EventEmitter();
  @Output() getToggleDLPConfigEnablement = new EventEmitter();
  @Output() getStatus = new EventEmitter();
  gridOptions4GroupDlpSensors: GridOptions;
  gridApi!: GridApi;
  groupDlpSensors: Array<DlpSetting> = [];
  filteredCount: number = 0;
  selectedSensor: DlpSetting;
  enabled: boolean = false;
  isWriteDlpAuthorized: boolean;
  CFG_TYPE = GlobalConstant.CFG_TYPE;

  constructor(
    private groupsService: GroupsService,
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService,
    private notificationService: NotificationService,
    private quickFilterService: QuickFilterService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.isWriteDlpAuthorized =
      this.authUtilsService.getDisplayFlag('write_dlp_rule');
    this.gridOptions4GroupDlpSensors =
      this.groupsService.prepareGrid4GroupDlpSensors();
    this.gridOptions4GroupDlpSensors.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi = params.api;
      }
      setTimeout(() => {
        if (params && params.api) {
          if (this.useQuickFilterService) {
            this.quickFilterService.textInput$.subscribe((value: string) => {
              this.quickFilterService.onFilterChange(
                value,
                this.gridOptions4GroupDlpSensors,
                this.gridApi
              );
            });
          }
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
    this.gridOptions4GroupDlpSensors.onSelectionChanged = () => {
      this.selectedSensor = this.gridApi!.getSelectedRows()[0];
    };
    this.getEditGroupSensorModal.emit(this.openEditGroupSensorModal);
    this.getToggleDLPConfigEnablement.emit(this.toggleDLPConfigEnablement);
    this.refresh();
  }

  ngOnChanges(): void {
    this.getEditGroupSensorModal.emit(this.openEditGroupSensorModal);
    this.getToggleDLPConfigEnablement.emit(this.toggleDLPConfigEnablement);
  }

  refresh = () => {
    this.groupsService.getGroupDlpSensorData(this.groupName).subscribe(
      (response: any) => {
        if (response.sensors.length === 0) {
          if (response.status) {
            this.gridOptions4GroupDlpSensors.overlayNoRowsTemplate = `<div class="server-error">
                  <div>
                    <em class="eos-icons text-warning" aria-hidden="true">gpp_maybe</em>
                  </div>
                  <div>
                    <div>${this.translate.instant(
                      'group.dlp.msg.ADD_DLP_WARNING'
                    )}</div>
                  </div>
                </div>`;
          } else {
            this.gridOptions4GroupDlpSensors.overlayNoRowsTemplate = `<span class="overlay">${this.translate.instant(
              'general.NO_ROWS'
            )}</span>`;
          }
        }
        this.groupDlpSensors = response.sensors;
        this.gridApi!.setGridOption('rowData', this.groupDlpSensors);
        this.enabled = response.status;
        this.getStatus.emit(this.enabled);
        this.filteredCount = this.groupDlpSensors.length;
      },
      error => {}
    );
  };

  openEditGroupSensorModal = (warning = '') => {
    setTimeout(() => {
      const addEditDialogRef = this.dialog.open(GroupDlpConfigModalComponent, {
        width: '80%',
        data: {
          configuredSensors: this.groupDlpSensors,
          groupName: this.groupName,
          status: this.enabled,
          warning: warning,
          refresh: this.refresh,
          source: this.source,
        },
      });
    }, 200);
  };

  toggleDLPConfigEnablement = enabled => {
    let payload = {
      config: {
        name: this.groupName,
        status: !enabled,
      },
    };
    this.groupsService.updateGroupDlpSensorData(payload).subscribe(
      (response: any) => {
        if (!enabled && this.groupDlpSensors.length === 0) {
          this.openEditGroupSensorModal(
            this.translate.instant('group.dlp.msg.ADD_DLP_WARNING')
          );
        }
        setTimeout(() => {
          this.refresh();
        }, 1000);
        this.notificationService.open(
          enabled
            ? this.translate.instant('group.dlp.msg.DISABLED_OK')
            : this.translate.instant('group.dlp.msg.ENABLED_OK')
        );
      },
      error => {
        this.notificationService.openError(
          error.error,
          enabled
            ? this.translate.instant('group.dlp.msg.DISABLED_NG')
            : this.translate.instant('group.dlp.msg.ENABLED_NG')
        );
      }
    );
  };
}
