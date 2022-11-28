import { Component, OnInit } from '@angular/core';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { WafSensor, WafRule } from '@common/types';
import { GridOptions } from 'ag-grid-community';
import { WafSensorsService } from '@services/waf-sensors.service';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { AddEditSensorModalComponent } from '@routes/waf-sensors/partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { AddEditRuleModalComponent } from '@routes/waf-sensors/partial/add-edit-rule-modal/add-edit-rule-modal.component';
import { UtilsService } from '@common/utils/app.utils';
import { saveAs } from 'file-saver';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';

@Component({
  selector: 'app-waf-sensors',
  templateUrl: './waf-sensors.component.html',
  styleUrls: ['./waf-sensors.component.scss'],
})
export class WafSensorsComponent implements OnInit {
  wafSensors: Array<WafSensor> = [];
  refreshing$ = new Subject();
  isWriteWAFSensorAuthorized: boolean = false;
  gridOptions: any;
  gridOptions4Sensors!: GridOptions;
  gridOptions4Rules!: GridOptions;
  gridOptions4Patterns!: GridOptions;
  gridOptions4EditPatterns!: GridOptions;
  filteredCount: number = 0;
  selectedSensors!: Array<WafSensor>;
  selectedSensor!: WafSensor;
  selectedRule!: WafRule;
  index4Sensor!: number;
  isPredefine!: boolean;
  context = { componentParent: this };
  $win: any;
  private _switchClusterSubscription;

  constructor(
    private wafSensorsService: WafSensorsService,
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService,
    private utilsService: UtilsService,
    private multiClusterService: MultiClusterService,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.isWriteWAFSensorAuthorized =
      this.authUtilsService.getDisplayFlag('write_waf_rule') &&
      !this.authUtilsService.userPermission.isNamespaceUser;
    this.gridOptions = this.wafSensorsService.configGrids(
      this.isWriteWAFSensorAuthorized
    );
    this.gridOptions4Sensors = this.gridOptions.gridOptions;
    this.gridOptions4Rules = this.gridOptions.gridOptions4Rules;
    this.gridOptions4Patterns = this.gridOptions.gridOptions4Patterns;
    this.gridOptions4EditPatterns = this.gridOptions.gridOptions4EditPatterns;
    this.gridOptions4Sensors.onSelectionChanged =
      this.onSelectionChanged4Sensor;
    this.gridOptions4Rules.onSelectionChanged = this.onSelectionChanged4Rule;

    this.refresh();

    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(() => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  refresh = (index: number = 0) => {
    this.getWafSensors(index);
  };

  openAddEditWafSensorModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditSensorModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        refresh: this.refresh,
      },
    });
  };

  openAddWafRuleModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditRuleModalComponent, {
      width: '80%',
      data: {
        sensor: this.selectedSensor,
        opType: GlobalConstant.MODAL_OP.ADD,
        gridOptions4EditPatterns: this.gridOptions4EditPatterns,
        index4Sensor: this.index4Sensor,
        refresh: this.refresh,
      },
    });
  };

  openImportWafSensorsModal = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.WAF_SENSORS_IMPORT_URL,
        importMsg: {
          success: this.translate.instant('waf.msg.IMPORT_FINISH'),
          error: this.translate.instant('waf.msg.IMPORT_FAILED'),
        },
      },
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.refresh();
      }, 500);
    });
  };

  exportWafSensors = () => {
    let payload = {
      names: this.selectedSensors.map(sensor => sensor.name),
    };
    this.wafSensorsService.getWafSensorConfigFileData(payload).subscribe(
      response => {
        let fileName = this.utilsService.getExportedFileName(response);
        let blob = new Blob([response.body || ''], {
          type: 'text/plain;charset=utf-8',
        });
        saveAs(blob, fileName);
        this.notificationService.open(
          this.translate.instant('waf.msg.EXPORT_SENSOR_OK')
        );
      },
      error => {
        if (MapConstant.USER_TIMEOUT.includes(error.status)) {
          this.notificationService.open(
            this.utilsService.getAlertifyMsg(
              error.error,
              this.translate.instant('waf.msg.EXPORT_SENSOR_NG'),
              false
            ),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      }
    );
  };

  private getWafSensors = (index: number) => {
    this.wafSensorsService
      .getWafSensorsData()
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        response => {
          this.wafSensors = response as Array<WafSensor>;
          this.filteredCount = this.wafSensors.length;
          setTimeout(() => {
            let rowNode =
              this.gridOptions4Sensors.api!.getDisplayedRowAtIndex(index);
            rowNode!.setSelected(true);
          }, 200);
        },
        error => {}
      );
  };

  private onSelectionChanged4Sensor = () => {
    this.selectedSensors = this.gridOptions4Sensors.api!.getSelectedRows();
    this.selectedSensor = this.selectedSensors[0];
    this.index4Sensor = this.wafSensors.findIndex(
      sensor => sensor.name === this.selectedSensor.name
    );
    this.isPredefine = this.selectedSensor.predefine;
    setTimeout(() => {
      this.gridOptions4Rules.api!.setRowData(this.selectedSensor.rules);
      this.gridOptions4Patterns.api!.setRowData([]);
      if (this.selectedSensor.rules.length > 0) {
        let rowNode = this.gridOptions4Rules.api!.getDisplayedRowAtIndex(0);
        rowNode!.setSelected(true);
        this.gridOptions4Rules.api!.sizeColumnsToFit();
      }
    }, 200);
  };
  private onSelectionChanged4Rule = () => {
    this.selectedRule = this.gridOptions4Rules.api!.getSelectedRows()[0];
    this.gridOptions4Patterns.api!.setRowData(this.selectedRule.patterns);
    setTimeout(() => {
      this.gridOptions4Patterns.api!.sizeColumnsToFit();
    }, 200);
  };
}
