import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { AuthUtilsService } from '@common/utils/auth.utils';
import {
  DlpSensor,
  DlpRule,
  RemoteExportOptionsWrapper,
  RemoteExportOptions,
} from '@common/types';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community';
import { DlpSensorsService } from '@services/dlp-sensors.service';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { AddEditSensorModalComponent } from '@components/dlp-sensors/partial/add-edit-sensor-modal/add-edit-sensor-modal.component';
import { AddEditRuleModalComponent } from '@components/dlp-sensors/partial/add-edit-rule-modal/add-edit-rule-modal.component';
import { UtilsService } from '@common/utils/app.utils';
import { saveAs } from 'file-saver';
import { ImportFileModalComponent } from '@components/ui/import-file-modal/import-file-modal.component';
import { MultiClusterService } from '@services/multi-cluster.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '@services/notification.service';
import { ExportOptionsModalComponent } from '@components/export-options-modal/export-options-modal.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as $ from 'jquery';

@Component({
  selector: 'app-dlp-sensors',
  templateUrl: './dlp-sensors.component.html',
  styleUrls: ['./dlp-sensors.component.scss'],
})
export class DlpSensorsComponent implements OnInit, OnDestroy {
  @Input() source: string;
  navSource = GlobalConstant.NAV_SOURCE;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  refreshing$ = new Subject();
  dlpSensors: Array<DlpSensor> = [];
  isWriteDLPSensorAuthorized!: boolean;
  gridOptions: any;
  gridOptions4Sensors!: GridOptions;
  gridOptions4Rules!: GridOptions;
  gridOptions4Patterns!: GridOptions;
  gridOptions4EditPatterns!: GridOptions;
  gridApi4Sensors!: GridApi;
  gridApi4Rules!: GridApi;
  gridApi4Patterns!: GridApi;
  filteredCount: number = 0;
  selectedSensors!: Array<DlpSensor>;
  selectedSensor!: DlpSensor;
  selectedRule!: DlpRule;
  index4Sensor!: number;
  isPredefine!: boolean;
  filtered: boolean = false;
  context = { componentParent: this };
  $win: any;
  private _switchClusterSubscription;
  serverErrorMessage: SafeHtml = '';

  constructor(
    private dlpSensorsService: DlpSensorsService,
    private dialog: MatDialog,
    private authUtilsService: AuthUtilsService,
    private utilsService: UtilsService,
    private multiClusterService: MultiClusterService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private domSanitizer: DomSanitizer
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.isWriteDLPSensorAuthorized =
      this.authUtilsService.getDisplayFlag('write_dlp_rule') &&
      !this.authUtilsService.userPermission.isNamespaceUser;
    this.gridOptions = this.dlpSensorsService.configGrids(
      this.isWriteDLPSensorAuthorized,
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

    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  refresh = (index: number = 0) => {
    this.refreshing$.next(true);
    this.getDlpSensors(index);
  };

  openAddEditDlpSensorModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditSensorModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
        dlpSensors: this.dlpSensors,
        gridApi: this.gridApi4Sensors!,
        source: this.source,
      },
    });
  };

  openAddDlpRuleModal = () => {
    const addEditDialogRef = this.dialog.open(AddEditRuleModalComponent, {
      width: '80%',
      data: {
        sensor: this.selectedSensor,
        opType: GlobalConstant.MODAL_OP.ADD,
        gridOptions4EditPatterns: this.gridOptions4EditPatterns,
        index4Sensor: this.index4Sensor,
        gridApi: this.gridApi4Rules!,
      },
    });
  };

  openImportDlpSensorsModal = () => {
    const importDialogRef = this.dialog.open(ImportFileModalComponent, {
      data: {
        importUrl: PathConstant.DLP_SENSORS_IMPORT_URL,
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

  exportDlpSensors = () => {
    const dialogRef = this.dialog.open(ExportOptionsModalComponent, {
      width: '50%',
      disableClose: true,
      data: {
        filename: GlobalConstant.REMOTE_EXPORT_FILENAME.DLP,
      },
    });

    dialogRef.afterClosed().subscribe((result: RemoteExportOptionsWrapper) => {
      if (result) {
        const { export_mode, ...exportOptions } = result.export_options;
        this.exportUtil(export_mode, exportOptions);
      }
    });
  };

  exportUtil(mode: string, option: RemoteExportOptions) {
    if (mode === 'local') {
      let payload = {
        names: this.selectedSensors.map(sensor => sensor.name),
      };
      this.dlpSensorsService.getDlpSensorConfigFileData(payload).subscribe(
        response => {
          let fileName = this.utilsService.getExportedFileName(response);
          let blob = new Blob([response.body || ''], {
            type: 'text/plain;charset=utf-8',
          });
          saveAs(blob, fileName);
          this.notificationService.open(
            this.translate.instant('dlp.msg.EXPORT_SENSOR_OK')
          );
        },
        error => {
          if (MapConstant.USER_TIMEOUT.includes(error.status)) {
            this.notificationService.open(
              this.utilsService.getAlertifyMsg(
                error.error,
                this.translate.instant('dlp.msg.EXPORT_SENSOR_NG'),
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
      this.dlpSensorsService.getDlpSensorConfigFileData(payload).subscribe(
        response => {
          this.notificationService.open(
            this.translate.instant('dlp.msg.EXPORT_SENSOR_OK')
          );
        },
        error => {
          if (
            error.message &&
            error.message.length > GlobalConstant.MAX_ERROR_MESSAGE_LENGTH
          ) {
            this.serverErrorMessage = this.domSanitizer.bypassSecurityTrustHtml(
              error.message
            );
          }

          this.notificationService.open(
            this.serverErrorMessage
              ? this.translate.instant('dlp.msg.EXPORT_SENSOR_NG')
              : this.utilsService.getAlertifyMsg(error, '', false),
            GlobalConstant.NOTIFICATION_TYPE.ERROR
          );
        }
      );
    } else {
      return;
    }
  }

  get dlpSensorsCount() {
    if (this.dlpSensors?.length) return this.dlpSensors.length;
    else return 0;
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered = this.filteredCount !== this.dlpSensorsCount;
  }

  private getDlpSensors = (index: number) => {
    this.dlpSensorsService
      .getDlpSensorsData(this.source)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        response => {
          this.dlpSensors = response as Array<DlpSensor>;
          this.filteredCount = this.dlpSensors.length;
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
    this.index4Sensor = this.dlpSensors.findIndex(
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
