import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { PathConstant } from '@common/constants/path.constant';
import * as $ from 'jquery';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { DatePipe } from '@angular/common';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';

@Injectable()
export class FileAccessRulesService {
  private readonly $win;

  constructor(
    private utils: UtilsService,
    private http: HttpClient,
    private translate: TranslateService,
    private datePipe: DatePipe
  ) {
    this.$win = $(GlobalVariable.window);
  }

  prepareGrid(
    isWriteGroupAuthorized: boolean,
    source: string,
    isScoreImprovement: boolean = false
  ) {
    const filterColumn = [
      {
        headerName: this.translate.instant('service.gridHeader.FILTER'),
        field: 'filter',
        width: 120,
        minWidth: 100,
      },
    ];
    const filterPrefix = [
      {
        headerName: this.translate.instant('group.GROUP'),
        // headerCheckboxSelection: function(params) {
        //     console.log("Header: ", $scope.selectedGroup, params);
        //     return $scope.isWriteRuleAuthorized && $scope.selectedGroup;
        // },
        // headerCheckboxSelectionFilteredOnly: true,
        // checkboxSelection: function(params) {
        //     console.log("Rows: ", $scope.selectedGroup);
        //     return $scope.isWriteRuleAuthorized && $scope.selectedGroup;
        // },
        field: 'group',
        filter: 'agTextColumnFilter',
        hide: source === GlobalConstant.NAV_SOURCE.GROUP,
      },
      ...filterColumn,
      {
        headerName: this.translate.instant('service.gridHeader.RECURSIVE'),
        field: 'recursive',
        width: 100,
        maxWidth: 100,
        minWidth: 100,
      },
    ];
    const actionColumn = {
      headerName: this.translate.instant('policy.addPolicy.DENY_ALLOW'),
      field: 'behavior',
      cellRenderer: params => {
        if (params.value) {
          let mode = this.utils.getI18Name(params.value);
          let labelCode = MapConstant.colourMap[params.value];
          if (!labelCode) labelCode = 'info';
          return `<span class="action-label px-1 ${labelCode}">${mode}</span>`;
        } else return null;
      },
      width: 180,
      maxWidth: 200,
      minWidth: 180,
    };
    const timeColumn = {
      headerName: this.translate.instant('policy.gridHeader.UPDATE_AT'),
      field: 'last_modified_timestamp',
      cellRenderer: params => {
        if (params.value) {
          const date = new Date(params.value * 1000);
          return this.datePipe.transform(date, 'MMM dd, y HH:mm:ss');
        }
        return '';
      },
      icons: {
        sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
        sortDescending: '<em class="fa fa-sort-numeric-desc"/>',
      },
      comparator: (value1, value2, node1, node2) => {
        this.dateComparator(value1, value2, node1, node2);
      },
      width: 140,
      maxWidth: 160,
      minWidth: 140,
    };
    const applicationColumn = {
      headerName: this.translate.instant('service.gridHeader.APPLICATIONS'),
      field: 'applications',
      cellRenderer: params => {
        if (params.value) {
          return params.value.join(', ');
        }
      },
      width: 220,
      minWidth: 200,
    };

    const typeColumn = {
      headerName: this.translate.instant("policy.gridHeader.TYPE"),
      field: "cfg_type",
      cellRenderer: params => {
        if (params && params.value) {
          let typeClass =
            params.value === GlobalConstant.CFG_TYPE.GROUND || params.value === GlobalConstant.CFG_TYPE.FED
              ? MapConstant.colourMap[params.value.toUpperCase()]
              : "local-rule";

          let typeName =
            params.value === GlobalConstant.CFG_TYPE.GROUND || params.value === GlobalConstant.CFG_TYPE.FED
              ? this.translate.instant(`group.${params.value.toUpperCase()}`)
              : this.translate.instant("group.LOCAL");
          return `<div class="action-label nv-label ${typeClass}">${typeName}</div>`;
        }
        return '';
      },
      cellClass: "grid-center-align",
      width: 90,
      minWidth: 90,
      maxWidth: 90
    };

    const fileColumnDefs = isScoreImprovement
      ? [...filterColumn, timeColumn, actionColumn]
      : [...filterPrefix, applicationColumn, actionColumn, typeColumn, timeColumn];
    const predefinedFilterColumns = [...filterPrefix, actionColumn];

    return {
      gridOptions4fileAccessRules: this.utils.createGridOptions(
        fileColumnDefs,
        this.$win
      ),
      gridOptions4PredefinedFileAccessRules: this.utils.createGridOptions(
        predefinedFilterColumns,
        this.$win
      ),
    };
  }

  private dateComparator(value1, value2, node1, node2) {
    /** @namespace node1.data.last_modified_timestamp */
    return (
      node1.data.last_modified_timestamp - node2.data.last_modified_timestamp
    );
  }

  getFileAccessRulesData(groupName) {
    return groupName === ''
      ? this.http
          .get(PathConstant.FILE_PROFILE_URL, {
            params: { scope: GlobalConstant.SCOPE.FED },
          })
          .pipe()
      : this.http
          .get(PathConstant.FILE_PROFILE_URL, { params: { name: groupName } })
          .pipe();
  }

  getPredefinedFileAccessRulesData(groupName) {
    return this.http
      .get(PathConstant.FILE_PREDEFINED_PROFILE_URL, {
        params: { name: groupName },
      })
      .pipe();
  }

  updateFileAccessRuleList(
    operation,
    data,
    groupName,
    scope = GlobalConstant.SCOPE.LOCAL
  ) {
    let payload = {};
    switch (operation) {
      case GlobalConstant.CRUD.C:
        payload = {
          fileMonitorConfigData: {
            config: {
              add_filters: [data],
            },
          },
          group: groupName,
        };
        break;
      case GlobalConstant.CRUD.U:
        payload = {
          fileMonitorConfigData: {
            config: {
              update_filters: [data],
            },
          },
          group: groupName,
        };
        break;
      case GlobalConstant.CRUD.D:
        payload = {
          fileMonitorConfigData: {
            config: {
              delete_filters: [data],
            },
          },
          group: groupName,
        };
        break;
    }
    return scope === GlobalConstant.SCOPE.FED ?
      this.http.patch(
        PathConstant.FILE_PROFILE_URL,
        payload,
        {
          params: {
            scope: GlobalConstant.SCOPE.FED,
          }
        },
      ).pipe() :
      this.http.patch(
        PathConstant.FILE_PROFILE_URL,
        payload
      ).pipe();
  }
}
