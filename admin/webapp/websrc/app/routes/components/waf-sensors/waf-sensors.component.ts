import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { AuthUtilsService } from '@common/utils/auth.utils';
import {
  WafSensor,
  WafRule,
  RemoteExportOptionsWrapper,
  RemoteExportOptions,
} from '@common/types';
import { GridOptions, GridApi } from 'ag-grid-community';
import { WafSensorsService } from '@services/waf-sensors.service';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { AddEditSensorModalComponent } from '@components/waf-sensors/partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { AddEditRuleModalComponent } from '@components/waf-sensors/partial/add-edit-rule-modal/add-edit-rule-modal.component';
import { UtilsService } from '@common/utils/app.utils';
import { saveAs } from 'file-saver';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { ExportOptionsModalComponent } from '@components/export-options-modal/export-options-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  standalone: false,
  selector: 'app-waf-sensors',
  templateUrl: './waf-sensors.component.html',
  styleUrls: ['./waf-sensors.component.scss'],
  
})
export class WafSensorsComponent implements OnInit {
  @Input() source: string;
  navSource = GlobalConstant.NAV_SOURCE;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  wafSensors: Array<WafSensor> = [];
  refreshing$ = new Subject();
  isWriteWAFSensorAuthorized: boolean = false;
  gridOptions: any;
  gridOptions4Sensors!: GridOptions;
  gridOptions4Rules!: GridOptions;
  gridOptions4Patterns!: GridOptions;
  gridOptions4EditPatterns!: GridOptions;
  gridApi4Sensors!: GridApi;
  gridApi4Rules!: GridApi;
  gridApi4Patterns!: GridApi;
  filteredCount: number = 0;
  selectedSensors!: Array<WafSensor>;
  selectedSensor!: WafSensor;
  selectedRule!: WafRule;
  index4Sensor!: number;
  isPredefine!: boolean;
  filtered: boolean = false;
  context = { componentParent: this };
  $win: any;
  serverErrorMessage: SafeHtml = '';

  get wafSensorsCount() {
    if (this.wafSensors?.length) return this.wafSensors.length;
    else return 0;
  }

  constructor(
    private el: ElementRef,
    private wafSensorsService: WafSensorsService,
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService,
    private utilsService: UtilsService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private domSanitizer: DomSanitizer
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.isWriteWAFSensorAuthorized =
      this.authUtilsService.getDisplayFlag('write_waf_rule') &&
      !this.authUtilsService.userPermission.isNamespaceUser;
    this.gridOptions = this.wafSensorsService.configGrids(
      this.isWriteWAFSensorAuthorized,
      this.source
    );
    this.gridOptions4Sensors = this.gridOptions.gridOptions;
    this.gridOptions4Sensors.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi4Sensors = params.api;
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
    this.gridOptions4Rules = this.gridOptions.gridOptions4Rules;
    this.gridOptions4Rules.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi4Rules = params.api;
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
    this.gridOptions4Patterns = this.gridOptions.gridOptions4Patterns;
    this.gridOptions4Patterns.onGridReady = params => {
      const $win = $(GlobalVariable.window);
      if (params && params.api) {
        this.gridApi4Patterns = params.api;
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
    this.gridOptions4EditPatterns = this.gridOptions.gridOptions4EditPatterns;
    this.gridOptions4Sensors.onSelectionChanged =
      this.onSelectionChanged4Sensor;
    this.gridOptions4Rules.onSelectionChanged = this.onSelectionChanged4Rule;

    this.refresh();
  }

  refresh = (index: number = 0) => {
    this.getWafSensors(index);
  };

  openAddEditWafSensorModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditSensorModalComponent, {
      width: '80%',
      data: {
        source: this.source,
        opType: GlobalConstant.MODAL_OP.ADD,
        wafSensors: this.wafSensors,
        gridApi: this.gridApi4Sensors!,
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
        gridApi: this.gridApi4Rules!,
        cfgType:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? GlobalConstant.CFG_TYPE.FED
            : GlobalConstant.CFG_TYPE.CUSTOMER,
      },
    });
  };

  openImportWafSensorsModal = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl:
          this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? PathConstant.WAF_SENSORS_IMPORT_FED_URL
            : PathConstant.WAF_SENSORS_IMPORT_URL,
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
    const dialogRef = this.dialog.open(ExportOptionsModalComponent, {
      width: '50%',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: RemoteExportOptionsWrapper) => {
      if (result) {
        const { export_mode, ...exportOptions } = result.export_options;
        this.exportUtils(export_mode, exportOptions);
      }
    });
  };

  exportUtils(mode: string, option: RemoteExportOptions | null) {
    if (mode === 'local') {
      let payload = {
        names: this.selectedSensors.map(sensor => sensor.name),
      };
      this.wafSensorsService
        .getWafSensorConfigFileData(payload, this.source)
        .subscribe(
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
            if (!MapConstant.USER_TIMEOUT.includes(error.status)) {
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
    } else if (mode === 'remote') {
      let payload = {
        names: this.selectedSensors.map(sensor => sensor.name),
        remote_export_options: option,
      };
      this.wafSensorsService
        .getWafSensorConfigFileData(payload, this.source)
        .subscribe(
          response => {
            const responseObj = JSON.parse(response.body as string);
            this.notificationService.open(
              `${this.translate.instant(
                'waf.msg.EXPORT_SENSOR_OK'
              )} ${this.translate.instant('general.EXPORT_FILE')} ${
                responseObj.file_path
              }`
            );
          },
          error => {
            if (
              error.message &&
              error.message.length > GlobalConstant.MAX_ERROR_MESSAGE_LENGTH
            ) {
              this.serverErrorMessage =
                this.domSanitizer.bypassSecurityTrustHtml(error.message);
            }

            this.notificationService.open(
              this.serverErrorMessage
                ? this.translate.instant('waf.msg.EXPORT_SENSOR_NG')
                : this.utilsService.getAlertifyMsg(error, '', false),
              GlobalConstant.NOTIFICATION_TYPE.ERROR
            );
          }
        );
    } else {
      return;
    }
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.wafSensorsCount;
  }

  private getWafSensors = (index: number) => {
    this.wafSensorsService
      .getWafSensorsData(this.source)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        response => {
          this.wafSensors = response as Array<WafSensor>;
          this.filteredCount = this.wafSensors.length;
          setTimeout(() => {
            let rowNode = this.gridApi4Sensors!.getDisplayedRowAtIndex(index);
            rowNode?.setSelected(true);
          }, 200);
        },
        error => {}
      );
  };

  private onSelectionChanged4Sensor = () => {
    this.selectedSensors = this.gridApi4Sensors!.getSelectedRows();
    this.selectedSensor = this.selectedSensors[0];
    this.index4Sensor = this.wafSensors.findIndex(
      sensor => sensor.name === (this.selectedSensor?.name || '')
    );
    this.isPredefine = this.selectedSensor?.predefine || false;
    setTimeout(() => {
      this.gridApi4Rules!.setGridOption(
        'rowData',
        this.selectedSensor?.rules || []
      );
      this.gridApi4Patterns!.setGridOption('rowData', []);
      if (this.selectedSensor?.rules?.length > 0) {
        let rowNode = this.gridApi4Rules!.getDisplayedRowAtIndex(0);
        rowNode!.setSelected(true);
        this.gridApi4Rules!.sizeColumnsToFit();
      }
    }, 200);
  };
  private onSelectionChanged4Rule = () => {
    this.selectedRule = this.gridApi4Rules!.getSelectedRows()[0];
    this.gridApi4Patterns!.setGridOption(
      'rowData',
      this.selectedRule?.patterns || []
    );
    setTimeout(() => {
      this.gridApi4Patterns!.sizeColumnsToFit();
    }, 200);
  };
}
