import { Component, OnInit, SecurityContext, Input } from '@angular/core';
import { ErrorResponse, HierarchicalExposure } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowNode,
} from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import * as $ from 'jquery';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { GraphHttpService } from '@common/api/graph-http.service';
import { NotificationService } from '@services/notification.service';
import { ExposedServicePodGridActionCellComponent } from '@components/exposed-service-pod-grid/exposed-service-pod-grid-action-cell/exposed-service-pod-grid-action-cell.component';
import { ExposedServicepodGridServicepodCellComponent } from '@components/exposed-servicepod-conv-grid/exposed-servicepod-grid-servicepod-cell/exposed-servicepod-grid-servicepod-cell.component';
import { ExternalHostCellComponent } from '@components/exposed-servicepod-conv-grid/external-host-cell/external-host-cell.component'

@Component({
  selector: 'app-exposed-servicepod-conv-grid',
  templateUrl: './exposed-servicepod-conv-grid.component.html',
  styleUrls: ['./exposed-servicepod-conv-grid.component.scss']
})
export class ExposedServicepodConvGridComponent implements OnInit {

  private readonly $win;
  private _exposures!: Array<HierarchicalExposure>;
  @Input() set exposures(exposure: Array<HierarchicalExposure>) {
    this._exposures = exposure;
    this.displayedExposure = this.preprocessHierarchicalData(this._exposures);
  }
  get exposures() {
    return this._exposures;
  }
  gridOptions!: GridOptions;
  gridApi!: GridApi;
  columnDefs!: ColDef[];
  displayedExposure!: Array<any>;

  constructor(
    private graphHttpService: GraphHttpService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private utils: UtilsService
  ) {
    this.$win = $(GlobalVariable.window);
  }

  ngOnInit(): void {
    this.setGrid();
  }

  setGrid = () => {
    this.columnDefs = [
      {
        headerName: this.translate.instant(
          'dashboard.body.panel_title.SERVICE'
        ),
        field: 'service',
        cellRenderer: 'serviceCellRenderer',
        width: 180,
        sortable: false,
      },
      {
        headerName: 'Pods',
        field: 'children',
        valueFormatter: params => {
          return params.data.isParent ? params.value.length : '';
        },
        width: 70,
      },
      {
        headerName: 'Parent ID',
        field: 'parent_id',
        hide: true,
      },
      {
        headerName: 'Child Names',
        field: 'child_names',
        hide: true,
      },
      {
        headerName: this.translate.instant(
          'dashboard.body.panel_title.POLICY_MODE'
        ),
        field: 'policy_mode',
        cellRenderer: params => {
          let mode = '';
          if (params.data && params.value && params.data.isParent) {
            mode = this.utils.getI18Name(params.value);
            let labelCode = MapConstant.colourMap[params.value];
            if (!labelCode) return null;
            else
              return `<span class='type-label policy_mode ${labelCode}'>${this.sanitizer.sanitize(
                SecurityContext.HTML,
                mode
              )}</span>`;
          }
          return null;
        },
        width: 110,
        maxWidth: 110,
        minWidth: 110,
        sortable: false,
      },
      {
        headerName: this.translate.instant(
          'dashboard.body.panel_title.EXTERNAL_HOST'
        ),
        field: 'ip',
        cellRenderer: 'externalHostCellRender'
      },
      {
        headerName: this.translate.instant(
          'dashboard.body.panel_title.SESSIONS'
        ),
        field: 'sessions',
        valueFormatter: params => {
          return params.data.isParent ? '' : params.value;
        },
        width: 100,
      },
      {
        headerName: this.translate.instant(
          'dashboard.body.panel_title.APPLICATIONS'
        ),
        field: 'applications',
        cellRenderer: params => {
          if (params.data) {
            if (params.value) {
              return this.sanitizer.sanitize(
                SecurityContext.HTML,
                params.data.ports
                  ? params.value.concat(params.data.ports).join(', ')
                  : params.value.join(', ')
              );
            }
          }
          return null;
        },
        width: 100,
        sortable: false,
      },
      {
        headerName: this.translate.instant(
          'dashboard.body.panel_title.POLICY_ACTION'
        ),
        field: 'policy_action',
        cellRenderer: params => {
          if (params.value) {
            return `<span ng-class='{\'policy-remove\': data.remove}'
                  class='action-label px-1 ${
                    MapConstant.colourMap[params.value.toLowerCase()]
                  }'>
                  ${this.sanitizer.sanitize(
                    SecurityContext.HTML,
                    this.translate.instant(
                      'policy.action.' + params.value.toUpperCase()
                    )
                  )}
                </span>`;
          }
          return null;
        },
        width: 80,
        maxWidth: 80,
        minWidth: 80,
        sortable: false,
      }
    ];

    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      getRowId: params => params.data.isParent ? params.data.service : params.data.ip,
      onGridReady: this.onGridReady.bind(this),
      isExternalFilterPresent: () => true,
      doesExternalFilterPass: this.isVisible.bind(this),
      suppressMaintainUnsortedOrder: true,
      suppressScrollOnNewData: true,
      suppressRowTransform: true,
      components: {
        serviceCellRenderer: ExposedServicepodGridServicepodCellComponent,
        actionCellRenderer: ExposedServicePodGridActionCellComponent,
        externalHostCellRender: ExternalHostCellComponent,
      },
    };
  };

  isVisible = (node: RowNode): boolean => {
    return !node.data.parent_id || node.data.visible;
  };

  onGridReady = (params: GridReadyEvent): void => {
    this.gridApi = params.api;
    setTimeout(() => {
      this.gridApi.sizeColumnsToFit();
      this.gridApi.getDisplayedRowAtIndex(0)?.setSelected(true);
    });
  };

  onResize = (): void => {
    this.gridApi.sizeColumnsToFit();
  };

  preprocessHierarchicalData = (
    exposures: Array<HierarchicalExposure>
  ): Array<any> => {
    let res: Array<any> = [];
    exposures.forEach(exposure => {
      const parent_id = exposure.service;
      const child_ids = exposure.entries?.map(c => c.ip) || [];
      const child_names = exposure.entries?.map(c => c.ip) || [];
      res.push({
        ...exposure,
        child_ids,
        child_names,
        isParent: true,
        visible: true,
      });
      exposure.entries?.forEach(child => {
        res.push({
          ...child,
          parent_id,
          isParent: false,
          visible: true,
        });
      });
    });
    console.log('preprocessHierarchicalData',res)
    return res;
  };
}
