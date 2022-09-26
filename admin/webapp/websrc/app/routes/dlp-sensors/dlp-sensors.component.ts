import { Component, OnInit } from '@angular/core';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { DlpSensor, DlpRule } from '@common/types';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { DlpSensorsService } from '@services/dlp-sensors.service';
import { MatDialog } from "@angular/material/dialog";
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { AddEditSensorModalComponent } from '@routes/dlp-sensors/partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { AddEditRuleModalComponent } from '@routes/dlp-sensors/partial/add-edit-rule-modal/add-edit-rule-modal.component';
import { UtilsService } from "@common/utils/app.utils";
import { saveAs } from 'file-saver';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import {MultiClusterService} from "@services/multi-cluster.service";

@Component({
  selector: 'app-dlp-sensors',
  templateUrl: './dlp-sensors.component.html',
  styleUrls: ['./dlp-sensors.component.scss']
})
export class DlpSensorsComponent implements OnInit {

  dlpSensors: Array<DlpSensor> = [];
  isWriteDLPSensorAuthorized: boolean;
  gridOptions: any;
  gridOptions4Sensors: GridOptions;
  gridOptions4Rules: GridOptions;
  gridOptions4Patterns: GridOptions;
  gridOptions4EditPatterns: GridOptions;
  filteredCount: number = 0;
  selectedSensors: Array<DlpSensor>;
  selectedSensor: DlpSensor;
  selectedRule: DlpRule;
  index4Sensor: number;
  isPredefine: boolean;
  context = { componentParent: this };
  $win: any;
  private _switchClusterSubscription;

  constructor(
    private dlpSensorsService: DlpSensorsService,
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService,
    private utilsService: UtilsService,
    private multiClusterService: MultiClusterService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.isWriteDLPSensorAuthorized = this.authUtilsService.getDisplayFlag("write_dlp_rule") && !this.authUtilsService.userPermission.isNamespaceUser;
    this.gridOptions = this.dlpSensorsService.configGrids(this.isWriteDLPSensorAuthorized);
    this.gridOptions4Sensors = this.gridOptions.gridOptions;
    this.gridOptions4Rules = this.gridOptions.gridOptions4Rules;
    this.gridOptions4Patterns = this.gridOptions.gridOptions4Patterns;
    this.gridOptions4EditPatterns = this.gridOptions.gridOptions4EditPatterns;
    this.gridOptions4Sensors.onSelectionChanged = this.onSelectionChanged4Sensor;
    this.gridOptions4Rules.onSelectionChanged = this.onSelectionChanged4Rule;

    this.refresh();

    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription = this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
      this.refresh();
    });
  }

  ngOnDestroy(): void{
    if(this._switchClusterSubscription){
      this._switchClusterSubscription.unsubscribe();
    }
  }

  refresh = (index: number = 0) => {
    this.getDlpSensors(index);
  };

  openAddEditDlpSensorModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditSensorModalComponent, {
      width: "80%",
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        refresh: this.refresh
      },
      disableClose: true
    });
  };

  openAddDlpRuleModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditRuleModalComponent, {
      width: "80%",
      data: {
        sensor: this.selectedSensor,
        opType: GlobalConstant.MODAL_OP.ADD,
        gridOptions4EditPatterns: this.gridOptions4EditPatterns,
        index4Sensor: this.index4Sensor,
        refresh: this.refresh
      },
      disableClose: true
    });
  };

  openImportDlpSensorsModal = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.DLP_SENSORS_IMPORT_URL,
      },
      disableClose: true,
    });
    importDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.refresh();
      }, 500);
    });
  };

  exportDlpSensors = () => {
    let payload = {
      names: this.selectedSensors.map(sensor => sensor.name)
    };
    this.dlpSensorsService.getDlpSensorConfigFileData(payload)
      .subscribe(
        response => {
          let fileName = this.utilsService.getExportedFileName(response);
          let exportedFileName = `${fileName[0]}_${this.utilsService.parseDatetimeStr(new Date())}.${fileName[1]}`;
          let blob = new Blob([response.body || ""], {
            type: "text/plain;charset=utf-8"
          });
          saveAs(blob, exportedFileName);
          // Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          // Alertify.success($translate.instant("dlp.msg.EXPORT_SENSOR_OK"));
        },
        error => {
          if (MapConstant.USER_TIMEOUT.indexOf(error.status) < 0) {
            // Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            // Alertify.error(
            //   Utils.getAlertifyMsg(error, $translate.instant("dlp.msg.EXPORT_SENSOR_NG"), false)
            // );
          }
        }
      );
  };

  private getDlpSensors = (index: number) => {
    this.dlpSensorsService.getDlpSensorsData()
      .subscribe(
        response => {
          this.dlpSensors = response as Array<DlpSensor>;
          this.filteredCount = this.dlpSensors.length;
          setTimeout(() => {
            let rowNode = this.gridOptions4Sensors.api!.getDisplayedRowAtIndex(index);
            rowNode!.setSelected(true);
          }, 200);
        },
        error => {}
      );
  };

  private onSelectionChanged4Sensor = () => {
    this.selectedSensors = this.gridOptions4Sensors.api!.getSelectedRows();
    this.selectedSensor = this.selectedSensors[0];
    this.index4Sensor = this.dlpSensors.findIndex(sensor => sensor.name === this.selectedSensor.name);
    this.gridOptions4Rules.api!.setRowData(this.selectedSensor.rules);
    this.gridOptions4Patterns.api!.setRowData([]);
    this.isPredefine = this.selectedSensor.predefine;
    if (this.selectedSensor.rules.length > 0) {
      setTimeout(() => {
        let rowNode = this.gridOptions4Rules.api!.getDisplayedRowAtIndex(0);
        rowNode!.setSelected(true);
        this.gridOptions4Rules.api!.sizeColumnsToFit();
      }, 200);
    }
  };
  private onSelectionChanged4Rule = () => {
    this.selectedRule = this.gridOptions4Rules.api!.getSelectedRows()[0];
    this.gridOptions4Patterns.api!.setRowData(this.selectedRule.patterns);
    setTimeout(() => {
      this.gridOptions4Patterns.api!.sizeColumnsToFit();
    }, 200);
  };
}
