import { Component, OnInit, SecurityContext, Input } from '@angular/core';
import { ErrorResponse, HierarchicalExposure } from '@common/types';
import { GlobalVariable } from '@common/variables/global.variable';
import { ExposedServicePodGridServiceCellComponent } from './exposed-service-pod-grid-service-cell/exposed-service-pod-grid-service-cell.component';
import {
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
} from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import * as $ from 'jquery';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { ExposedServicePodGridActionCellComponent } from './exposed-service-pod-grid-action-cell/exposed-service-pod-grid-action-cell.component';
import { GraphHttpService } from '@common/api/graph-http.service';
import { NotificationService } from '@services/notification.service';

@Component({
  standalone: false,
  selector: 'app-exposed-service-pod-grid',
  templateUrl: './exposed-service-pod-grid.component.html',
  styleUrls: ['./exposed-service-pod-grid.component.scss'],
})
export class ExposedServicePodGridComponent implements OnInit {
  private readonly $win;
  private _exposures!: Array<HierarchicalExposure>;
  @Input() set exposures(exposure: Array<HierarchicalExposure>) {
    this._exposures = exposure;
    this.displayedExposure = this.preprocessHierarchicalData(this._exposures);
  }
  get exposures() {
    return this._exposures;
  }
  @Input() clearSession: boolean = false;
  @Input() isEgress!: boolean;
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
          'dashboard.body.panel_title.APPLICATIONS'
        ),
        field: 'applications',
        cellRenderer: params => {
          if (params.value) {
            return this.sanitizer.sanitize(
              SecurityContext.HTML,
              params.data.ports
                ? params.value.concat(params.data.ports).join(', ')
                : params.value.join(', ')
            );
          }
          return null;
        },
        width: 100,
        sortable: false,
      },
      {
        headerName: this.translate.instant(
          'dashboard.body.panel_title.POLICY_MODE'
        ),
        field: 'policy_mode',
        cellRenderer: params => {
          let mode = '';
          if (params.value) {
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
      },
      {
        cellRenderer: 'actionCellRenderer',
        cellRendererParams: {
          clearConversation: this.clearConversation.bind(this),
        },
        width: 45,
        minWidth: 45,
        maxWidth: 45,
        sortable: false,
        hide: !this.clearSession,
      },
    ];
    this.gridOptions = this.utils.createGridOptions(this.columnDefs, this.$win);
    this.gridOptions = {
      ...this.gridOptions,
      getRowId: params =>
        params.data.isParent ? params.data.service : params.data.id,
      onGridReady: this.onGridReady.bind(this),
      isExternalFilterPresent: () => true,
      doesExternalFilterPass: this.isVisible.bind(this),
      suppressMaintainUnsortedOrder: true,
      suppressScrollOnNewData: true,
      components: {
        serviceCellRenderer: ExposedServicePodGridServiceCellComponent,
        actionCellRenderer: ExposedServicePodGridActionCellComponent,
      },
    };
  };

  isVisible = (node: IRowNode): boolean => {
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
    console.log('exposures', exposures);
    let res: Array<any> = [];
    exposures.forEach(exposure => {
      const parent_id = exposure.service;
      const child_ids = exposure.children.map(c => c.id);
      const child_names = exposure.children.map(c => c.display_name);
      res.push({
        ...exposure,
        child_ids,
        child_names,
        isParent: true,
        visible: true,
      });
      exposure.children.forEach(child => {
        res.push({
          ...child,
          parent_id,
          isParent: false,
          visible: true,
        });
      });
    });
    console.log('displayedExposure', res);
    return res;
  };

  clearConversation(id: string) {
    let from = 'external';
    let to = id;
    if (this.isEgress) {
      [from, to] = [to, from];
    }
    this.graphHttpService
      .deleteConversation(encodeURIComponent(from), encodeURIComponent(to))
      .subscribe({
        complete: () => {
          const remove = this.displayedExposure.findIndex(
            exposure => exposure.id === id
          );
          const removeParent = this.displayedExposure.findIndex(exposure =>
            exposure.child_ids.includes(id)
          );
          let emptyParent = false;
          if (removeParent >= 0) {
            this.displayedExposure[removeParent].child_ids =
              this.displayedExposure[removeParent].child_ids.filter(
                child_id => child_id !== id
              );
            emptyParent =
              this.displayedExposure[removeParent].child_ids.length === 0;
          }
          this.displayedExposure = this.displayedExposure.filter(
            (exposure, idx) =>
              idx !== remove && (emptyParent ? idx !== removeParent : true)
          );
        },
        error: ({ error }: { error: ErrorResponse }) => {
          this.notificationService.openError(
            error,
            this.translate.instant('network.popup.SESSION_CLEAR_FAILURE')
          );
        },
      });
  }
}
