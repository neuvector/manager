import { Injectable, SecurityContext } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilsService } from '@common/utils/app.utils';
import { map } from 'rxjs/operators';
import { SensorActionButtonsComponent } from '@components/waf-sensors/partial/sensor-action-buttons/sensor-action-buttons.component';
import { RuleActionButtonsComponent } from '@components/waf-sensors/partial/rule-action-buttons/rule-action-buttons.component';
import { PatternActionButtonsComponent } from '@components/waf-sensors/partial/pattern-action-buttons/pattern-action-buttons.component';

interface sensorsResponse {
  sensors: any[];
}

@Injectable({
  providedIn: 'root',
})
export class WafSensorsService {
  private readonly $win;

  constructor(
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private utils: UtilsService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  configGrids = (isWriteWAFSensorAuthorized: boolean, source: string = '') => {
    const columnDefs4Sensor = [
      {
        headerName: this.translate.instant('waf.gridHeader.SENSOR_NAME'),
        field: 'name',
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        width: 100,
        minWidth: 100,
      },
      {
        headerName: this.translate.instant('waf.gridHeader.COMMENT'),
        field: 'comment',
        width: 420,
        minWidth: 420,
      },
      {
        headerName: this.translate.instant('waf.gridHeader.GROUPS'),
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
        sortable: false,
        cellRenderer: SensorActionButtonsComponent,
        hide: !isWriteWAFSensorAuthorized,
        width: 60,
        minWidth: 60,
        maxWidth: 60,
      },
    ];

    columnDefs4Sensor[0]['checkboxSelection'] = params => {
      if (params.data)
        return (
          !params.data.predefine &&
          ((source !== GlobalConstant.NAV_SOURCE.FED_POLICY &&
            params.data.cfg_type !== GlobalConstant.CFG_TYPE.FED) ||
            (source === GlobalConstant.NAV_SOURCE.FED_POLICY &&
              params.data.cfg_type === GlobalConstant.CFG_TYPE.FED))
        );
      return false;
    };

    const columnDefs4Rules = [
      {
        headerName: this.translate.instant('waf.gridHeader.PATTERN_NAME'),
        field: 'name',
        width: 150,
        minWidth: 120,
      },
      {
        cellClass: 'grid-right-align',
        sortable: false,
        cellRenderer: RuleActionButtonsComponent,
        hide: !isWriteWAFSensorAuthorized,
        width: 60,
        minWidth: 60,
        maxWidth: 60,
      },
    ];

    let columnDefs4Patterns = [
      {
        headerName: this.translate.instant('waf.patternGrid.LOGIC_IS_NOT'),
        field: 'op',
        cellRenderer: params => {
          if (params && params.value) {
            return this.translate.instant(
              `waf.patternGrid.${params.value.toUpperCase()}`
            );
          }
          return '';
        },
        width: 120,
        maxWidth: 120,
        minWidth: 120,
      },
      {
        headerName: this.translate.instant('waf.patternGrid.PATTERN'),
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
        sortable: false,
        width: 450,
        minWidth: 350,
      },
      {
        headerName: this.translate.instant('waf.patternGrid.CONTEXT'),
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
        hide: !isWriteWAFSensorAuthorized,
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

    grids.gridOptions.rowSelection = 'multiple';

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

  getWafSensorsData = source => {
    const options: any = [];
    if (source === GlobalConstant.NAV_SOURCE.FED_POLICY) {
      options.push({
        params: {
          scope: 'fed',
        },
      });
    }
    return GlobalVariable.http
      .get<sensorsResponse>(PathConstant.WAF_SENSORS_URL, ...options)
      .pipe(map(r => r.sensors));
  };

  updateWafSensorData = (payload, opType) => {
    let httpMethod =
      opType === GlobalConstant.MODAL_OP.ADD
        ? GlobalConstant.CRUD.C
        : GlobalConstant.CRUD.U;
    return GlobalVariable.http[httpMethod](
      PathConstant.WAF_SENSORS_URL,
      payload
    ).pipe();
  };

  deleteWafSensorData = name => {
    return GlobalVariable.http
      .delete(PathConstant.WAF_SENSORS_URL, { params: { name: name } })
      .pipe();
  };

  getWafSensorConfigFileData = (payload, scope) => {
    return GlobalVariable.http
      .post(
        scope === GlobalConstant.NAV_SOURCE.FED_POLICY
          ? PathConstant.WAF_SENSORS_EXPORT_FED_URL
          : PathConstant.WAF_SENSORS_EXPORT_URL,
        payload,
        {
          observe: 'response',
          responseType: 'text',
        }
      )
      .pipe();
  };
}
