import { Injectable, SecurityContext } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilsService } from '@common/utils/app.utils';
import { pluck } from 'rxjs/operators';
import { SensorActionButtonsComponent } from '@components/dlp-sensors/partial/sensor-action-buttons/sensor-action-buttons.component';
import { RuleActionButtonsComponent } from '@components/dlp-sensors/partial/rule-action-buttons/rule-action-buttons.component';
import { PatternActionButtonsComponent } from '@components/dlp-sensors/partial/pattern-action-buttons/pattern-action-buttons.component';

@Injectable({
  providedIn: 'root',
})
export class DlpSensorsService {
  private readonly $win;

  constructor(
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private utils: UtilsService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  configGrids = (isWriteDLPSensorAuthorized: boolean, source: string = '') => {
    const columnDefs4Sensor = [
      {
        headerName: this.translate.instant('dlp.gridHeader.SENSOR_NAME'),
        field: 'name',
        headerCheckboxSelection: params =>
          params.context.componentParent.source !==
          GlobalConstant.NAV_SOURCE.FED_POLICY,
        headerCheckboxSelectionFilteredOnly: params =>
          params.context.componentParent.source !==
          GlobalConstant.NAV_SOURCE.FED_POLICY,
        cellRenderer: params => {
          if (params.value)
            return `<span class="${
              params.data.predefine &&
              params.context.componentParent.source !==
                GlobalConstant.NAV_SOURCE.FED_POLICY
                ? 'left-margin-32'
                : ''
            }">
                      ${params.value}
                    </span>`;
          return false;
        },
        width: 100,
        minWidth: 100,
      },
      {
        headerName: this.translate.instant('dlp.gridHeader.COMMENT'),
        field: 'comment',
        width: 420,
        minWidth: 420,
      },
      {
        headerName: this.translate.instant('dlp.gridHeader.GROUPS'),
        field: 'groups',
        cellRenderer: params => {
          if (params && params.value) {
            return this.sanitizer.sanitize(
              SecurityContext.HTML,
              params.value.join(', ')
            );
          }
          return '';
        },
        width: 200,
      },
      {
        headerName: this.translate.instant('admissionControl.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          if (params) {
            let cfgType = params.value
              ? params.value.toUpperCase()
              : GlobalConstant.CFG_TYPE.CUSTOMER.toUpperCase();
            let type = MapConstant.colourMap[cfgType];
            return `<div class="type-label px-1 ${type}">${this.sanitizer.sanitize(
              SecurityContext.HTML,
              this.translate.instant(`group.${cfgType}`)
            )}</div>`;
          }
          return '';
        },
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      {
        cellClass: 'grid-right-align',
        suppressSorting: true,
        cellRenderer: SensorActionButtonsComponent,
        hide: !isWriteDLPSensorAuthorized,
        width: 60,
        minWidth: 60,
        maxWidth: 60,
      },
    ];

    if (source !== GlobalConstant.NAV_SOURCE.FED_POLICY) {
      columnDefs4Sensor[0]['checkboxSelection'] = params => {
        if (params.data)
          return (
            !params.data.predefine &&
            params.context.componentParent.source !==
              GlobalConstant.NAV_SOURCE.FED_POLICY &&
            params.data.cfg_type !== GlobalConstant.CFG_TYPE.FED
          );
        return false;
      };
    }

    const columnDefs4Rules = [
      {
        headerName: this.translate.instant('dlp.gridHeader.PATTERN_NAME'),
        field: 'name',
        width: 150,
        minWidth: 120,
      },
      {
        cellClass: 'grid-right-align',
        suppressSorting: true,
        cellRenderer: RuleActionButtonsComponent,
        hide: !isWriteDLPSensorAuthorized,
        width: 60,
        minWidth: 60,
        maxWidth: 60,
      },
    ];

    let columnDefs4Patterns = [
      {
        headerName: this.translate.instant('dlp.patternGrid.LOGIC_IS_NOT'),
        field: 'op',
        cellRenderer: params => {
          if (params && params.value) {
            return this.translate.instant(
              `dlp.patternGrid.${params.value.toUpperCase()}`
            );
          }
          return '';
        },
        width: 120,
        maxWidth: 120,
        minWidth: 120,
      },
      {
        headerName: this.translate.instant('dlp.patternGrid.PATTERN'),
        field: 'value',
        cellRenderer: params => {
          if (params && params.value) {
            return this.sanitizer.sanitize(
              SecurityContext.HTML,
              params.value.replace(/\</g, '&lt;').replace(/\>/g, '&gt;')
            );
          }
          return '';
        },
        suppressSorting: true,
        width: 450,
        minWidth: 350,
      },
      {
        headerName: this.translate.instant('dlp.patternGrid.CONTEXT'),
        field: 'context',
        width: 100,
        maxWidth: 100,
        minWidth: 100,
      },
    ];

    const editPatternColumn = [
      {
        headerName: '',
        cellRenderer: PatternActionButtonsComponent,
        hide: !isWriteDLPSensorAuthorized,
        width: 30,
        maxWidth: 30,
        minWidth: 30,
      },
    ];

    let grids = {
      gridOptions: this.utils.createGridOptions(columnDefs4Sensor, this.$win),
      gridOptions4Rules: this.utils.createGridOptions(
        columnDefs4Rules,
        this.$win
      ),
      gridOptions4Patterns: this.utils.createGridOptions(
        columnDefs4Patterns,
        this.$win
      ),
      gridOptions4EditPatterns: this.utils.createGridOptions(
        [...columnDefs4Patterns, ...editPatternColumn],
        this.$win
      ),
    };

    grids.gridOptions.rowSelection =
      source !== GlobalConstant.NAV_SOURCE.FED_POLICY ? 'multiple' : 'single';

    grids.gridOptions.rowClassRules = {
      'disabled-row': params => {
        if (!params.data) return false;
        if (params.data.disable) {
          return true;
        }
        return false;
      },
      'critical-row': params => {
        if (!params.data) return;
        return params.data.id === '' && params.data.critical;
      },
    };
    return grids;
  };

  getDlpSensorsData = source => {
    const options: any = [];
    if (source === GlobalConstant.NAV_SOURCE.FED_POLICY) {
      options.push({
        params: {
          scope: 'fed',
        },
      });
    }
    return GlobalVariable.http
      .get(PathConstant.DLP_SENSORS_URL, ...options)
      .pipe(pluck('sensors'));
  };

  updateDlpSensorData = (payload, opType) => {
    let httpMethod =
      opType === GlobalConstant.MODAL_OP.ADD
        ? GlobalConstant.CRUD.C
        : GlobalConstant.CRUD.U;
    return GlobalVariable.http[httpMethod](
      PathConstant.DLP_SENSORS_URL,
      payload
    ).pipe();
  };

  deleteDlpSensorData = name => {
    return GlobalVariable.http
      .delete(PathConstant.DLP_SENSORS_URL, { params: { name: name } })
      .pipe();
  };

  getDlpSensorConfigFileData = payload => {
    return GlobalVariable.http
      .post(PathConstant.DLP_SENSORS_EXPORT_URL, payload, {
        observe: 'response',
        responseType: 'text',
      })
      .pipe();
  };
}
