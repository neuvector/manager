import { Injectable, SecurityContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { PathConstant } from '@common/constants/path.constant';
import * as $ from 'jquery';
import { UtilsService } from '@common/utils/app.utils';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import { DatePipe } from '@angular/common';
import { GlobalVariable } from '@common/variables/global.variable';
import { ProcessProfileRuleNameHeaderComponent } from '@components/process-profile-rules/partial/process-profile-rule-name-header/process-profile-rule-name-header.component';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable()
export class ProcessProfileRulesService {
  private readonly $win;

  constructor(
    public sanitizer: DomSanitizer,
    private utils: UtilsService,
    private http: HttpClient,
    private translate: TranslateService,
    private datePipe: DatePipe
  ) {
    this.$win = $(GlobalVariable.window);
  }

  prepareGrid(
    isWriteGroupAuthorized: boolean,
    isWriteProcessProfileRuleAuthorized: boolean,
    source: string,
    isScoreImprovement: boolean = false
  ) {
    let columnDefs = [
      {
        headerName: this.translate.instant('group.GROUP'),
        field: 'group',
        filter: 'agTextColumnFilter',
        hide: source === GlobalConstant.NAV_SOURCE.GROUP,
      },
      {
        headerComponent: ProcessProfileRuleNameHeaderComponent,
        headerCheckboxSelection: params => {
          return isWriteGroupAuthorized && isWriteProcessProfileRuleAuthorized;
        },
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: params => {
          return (
            isWriteGroupAuthorized &&
            isWriteProcessProfileRuleAuthorized &&
            [
              GlobalConstant.CFG_TYPE.CUSTOMER,
              GlobalConstant.CFG_TYPE.LEARNED,
            ].includes(params.data.cfg_type)
          );
        },
        field: 'name',
        hide: !(
          source === GlobalConstant.NAV_SOURCE.GROUP &&
          isWriteGroupAuthorized &&
          isWriteProcessProfileRuleAuthorized
        ),
      },
      {
        headerComponent: ProcessProfileRuleNameHeaderComponent,
        field: 'name',
        hide:
          source === GlobalConstant.NAV_SOURCE.GROUP &&
          isWriteGroupAuthorized &&
          isWriteProcessProfileRuleAuthorized,
      },
      {
        headerName: this.translate.instant('service.gridHeader.PATH'),
        field: 'path',
      },
      {
        headerName: this.translate.instant('policy.addPolicy.DENY_ALLOW'),
        field: 'action',
        cellRenderer: params => {
          if (params.value) {
            let mode = this.utils.getI18Name(params.value);
            let labelCode = MapConstant.colourMap[params.value];
            if (!labelCode) labelCode = 'info';
            return `<span class="action-label px-1 ${labelCode}">${mode}</span>`;
          } else return null;
        },
        width: 90,
        maxWidth: 90,
        minWidth: 90,
      },
      {
        headerName: this.translate.instant('admissionControl.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          if (params && params.value) {
            let typeClass =
              params.value === GlobalConstant.CFG_TYPE.GROUND ||
              params.value === GlobalConstant.CFG_TYPE.FED
                ? MapConstant.colourMap[params.value.toUpperCase()]
                : MapConstant.colourMap[params.value];

            let typeName =
              params.value === GlobalConstant.CFG_TYPE.GROUND ||
              params.value === GlobalConstant.CFG_TYPE.FED
                ? this.translate.instant(`group.${params.value.toUpperCase()}`)
                : this.sanitizer.sanitize(
                    SecurityContext.HTML,
                    this.translate.instant(
                      `group.${params.value.replace('-', '_').toUpperCase()}`
                    )
                  );
            return `<div class="action-label nv-label ${typeClass}">${typeName}</div>`;
          }
          return '';
        },
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      {
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
          sortAscending: '<em class="fas fa-sort-numeric-up"/>',
          sortDescending: '<em class="fas fa-sort-numeric-down"/>',
        },
        comparator: (value1, value2, node1, node2) => {
          return this.dateComparator(value1, value2, node1, node2);
        },
        width: 160,
        maxWidth: 180,
        minWidth: 160,
        hide: isScoreImprovement,
      },
    ];

    let gridOptions = this.utils.createGridOptions(columnDefs, this.$win);
    gridOptions.rowSelection = 'multiple';

    return gridOptions;
  }

  private dateComparator(value1, value2, node1, node2) {
    /** @namespace node1.data.last_modified_timestamp */
    return (
      node1.data.last_modified_timestamp - node2.data.last_modified_timestamp
    );
  }

  getProcessProfileRulesData(groupName) {
    return groupName === ''
      ? this.http
          .get(PathConstant.PROCESS_PROFILE_URL, {
            params: { scope: GlobalConstant.SCOPE.FED },
          })
          .pipe()
      : this.http
          .get(PathConstant.PROCESS_PROFILE_URL, {
            params: { name: groupName },
          })
          .pipe();
  }

  updateProcessProfileRules(
    operation,
    groupName,
    newData,
    oldData,
    scope = GlobalConstant.SCOPE.LOCAL
  ) {
    let payload = {};
    switch (operation) {
      case GlobalConstant.CRUD.C:
        payload = {
          process_profile_config: {
            group: groupName,
            process_change_list: [newData],
          },
        };
        break;
      case GlobalConstant.CRUD.U:
        payload = {
          process_profile_config: {
            group: groupName,
            process_delete_list: [oldData],
            process_change_list: [newData],
          },
        };
        break;
      case GlobalConstant.CRUD.D:
        payload = {
          process_profile_config: {
            group: groupName,
            process_delete_list: oldData,
          },
        };
    }
    return this.http
      .patch(PathConstant.PROCESS_PROFILE_URL, payload, {
        params: { scope: scope },
      })
      .pipe();
  }
}
