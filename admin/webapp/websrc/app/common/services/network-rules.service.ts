import { Injectable, SecurityContext } from '@angular/core';
import { GlobalConstant } from '@common/constants/global.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActionButtonsComponent } from '@components/network-rules/partial/action-buttons/action-buttons.component';
import { FromToCellComponent } from '@components/network-rules/partial/from-to-cell/from-to-cell.component';
import { IdCellComponent } from '@components/network-rules/partial/id-cell/id-cell.component';
import { PortsCellComponent } from '@components/network-rules/partial/ports-cell/ports-cell.component';
import { NetworkRule } from '@common/types/network-rules/network-rules';
import * as pako from 'pako';

interface GroupResponse {
  groups: Array<any>;
}

interface HostResponse {
  hosts: Array<any>;
}

interface ApplicationResponse {
  list: {
    application: Array<string>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NetworkRulesService {
  w: any;
  isNetworkRuleChanged: boolean = false;
  networkRuleBackup: Array<any> = [];
  squence: number = GlobalConstant.NEW_ID_SEED.NETWORK_RULE;

  constructor(
    public sanitizer: DomSanitizer,
    public translate: TranslateService,
    public datePipe: DatePipe
  ) {
    this.w = GlobalVariable.window;
  }

  configGrid = (
    isWriteNetworkRuleAuthorized: boolean,
    source: string,
    isScoreImprovement: boolean = false
  ) => {
    const onGridReadyFunc = params => {
      setTimeout(function () {
        params.api.sizeColumnsToFit();
      }, 500);
      $(this.w).on(GlobalConstant.RESIZE_EVENT, function () {
        setTimeout(function () {
          params.api.sizeColumnsToFit();
        }, 1000);
      });
    };

    const checkboxSelectionFunc = params => {
      if (params.data && params.data.id > -1) {
        if (source === GlobalConstant.NAV_SOURCE.FED_POLICY) {
          if (params.data) {
            return params.data.cfg_type !== GlobalConstant.CFG_TYPE.GROUND;
          }
          return false;
        } else {
          return (
            params.data.cfg_type !== GlobalConstant.CFG_TYPE.GROUND &&
            params.data.cfg_type !== GlobalConstant.CFG_TYPE.FED &&
            !(
              params.data.disable &&
              params.data.cfg_type === GlobalConstant.CFG_TYPE.FED
            ) &&
            isWriteNetworkRuleAuthorized &&
            source !== GlobalConstant.NAV_SOURCE.GROUP
          );
        }
      }
      return false;
    };

    const lastModifiedTimestampRenderFunc = params => {
      if (params.value && params.data && params.data.id > -1) {
        const date = new Date(params.value * 1000);
        return this.sanitizer.sanitize(
          SecurityContext.HTML,
          this.datePipe.transform(date, 'MMM dd, y HH:mm:ss')
        );
      }
      return '';
    };

    const appRenderFunc = params => {
      if (params.value && params.data && params.data.id > -1) {
        let app =
          Array.isArray(params.value) &&
          params.value.length > 0 &&
          params.value[0] === 'any'
            ? this.translate.instant('enum.ANY')
            : params.value;
        return `<span ${params.data.remove ? `class="policy-remove"` : ''}>
          ${this.sanitizer.sanitize(SecurityContext.HTML, app)}
        </span>`;
      }
      return [];
    };

    const portsRenderFunc = params => {
      let ports = '';
      if (params.value && params.data && params.data.id > -1) {
        ports =
          params.value === 'any'
            ? this.translate.instant('enum.ANY')
            : params.value.split(',').join(', ').toString();
        if (params.value.split(',').length <= 3) {
          return `<div style="word-wrap: break-word;" [ngClass]="{'policy-remove': ${
            params.data.remove
          }}">
            ${this.sanitizer.sanitize(SecurityContext.HTML, ports)}
          </div>`;
        } else {
          ports = params.value.split(',').slice(0, 2).join(', ').toString();
          return `<div [ngClass]="{'policy-remove': ${
            params.data.remove
          }}" (click)="showAllPorts(data.id, data.ports, $event)">
            ${this.sanitizer.sanitize(SecurityContext.HTML, ports)}&nbsp;...
          </div>`;
        }
      }
      return '';
    };

    const actionRenderFunc = params => {
      if (params.data && params.data && params.data.id > -1) {
        return `<span class="action-label px-1 ${
          params.data.disable
            ? MapConstant.colourMap['disabled_background']
            : MapConstant.colourMap[params.data.action.toLowerCase()]
        } ${
          params.data.remove ? 'policy-remove' : ''
        }">${this.sanitizer.sanitize(
          SecurityContext.HTML,
          this.translate.instant(
            'policy.action.' + params.data.action.toUpperCase()
          )
        )}</span>`;
      }
      return '';
    };

    const typeRenderFunc = params => {
      if (params.data && params.data && params.data.id > -1) {
        if (
          params.data.remove &&
          params.data.state !== GlobalConstant.NETWORK_RULES_STATE.READONLY
        ) {
          return `<div class="type-label px-1 removed-rule">${this.translate.instant(
            'policy.head.REMOVED_RULE'
          )}</div>`;
        } else {
          let typeClass = params.data.disable
            ? MapConstant.colourMap['disabled-rule']
            : params.data.state
            ? MapConstant.colourMap[params.data.state]
            : MapConstant.colourMap[
                params.data.cfg_type ? params.data.cfg_type : 'customer-rule'
              ];
          let type = params.data.state
            ? MapConstant.colourMap[params.data.state]
            : MapConstant.colourMap[
                params.data.cfg_type ? params.data.cfg_type : 'customer-rule'
              ];
          return `<div class="type-label px-1 ${typeClass}">${this.sanitizer.sanitize(
            SecurityContext.HTML,
            this.translate.instant(
              `policy.head.${type.replace('-', '_').toUpperCase()}`
            )
          )}</div>`;
        }
      }
      return '';
    };

    const dateComparator = (value1, value2, node1, node2) => {
      /** @namespace node1.data.last_modified_timestamp */
      return (
        node1.data.last_modified_timestamp - node2.data.last_modified_timestamp
      );
    };

    const fromComparator = (value1, value2, node1, node2) => {
      /** From as primary sort, to as secondary sort */
      return `${node1.data.from}-${node1.data.to}`.localeCompare(
        `${node2.data.from}-${node2.data.to}`
      );
    };

    const toComparator = (value1, value2, node1, node2) => {
      /** To as primary sort, from as secondary sort */
      return `${node1.data.to}-${node1.data.from}`.localeCompare(
        `${node2.data.to}-${node2.data.from}`
      );
    };

    const idSelectionFunc = params => {
      if (params.data) {
        return (
          isWriteNetworkRuleAuthorized &&
          params.data.category !== GlobalConstant.GLOBAL
        );
      }
      return false;
    };

    const columnDefs = [
      {
        headerName: this.translate.instant('policy.gridHeader.ID'),
        headerCheckboxSelection:
          isWriteNetworkRuleAuthorized &&
          source !== GlobalConstant.NAV_SOURCE.GROUP,
        headerCheckboxSelectionFilteredOnly:
          isWriteNetworkRuleAuthorized &&
          source !== GlobalConstant.NAV_SOURCE.GROUP,
        field: 'id',
        checkboxSelection: checkboxSelectionFunc,
        cellRenderer: IdCellComponent,
        width: 100,
        minWidth: 100,
        maxWidth: 100,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.FROM'),
        field: 'from',
        cellRenderer: FromToCellComponent,
        colSpan: function (params) {
          if (params.data && params.data.id === -1) {
            return isWriteNetworkRuleAuthorized ? 8 : 7;
          }
          return 1;
        },
        comparator: fromComparator,
        width: 280,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.TO'),
        field: 'to',
        cellRenderer: FromToCellComponent,
        comparator: toComparator,
        width: 280,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.APPLICATIONS'),
        field: 'applications',
        cellRenderer: appRenderFunc,
        width: 200,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.PORT'),
        field: 'ports',
        cellRenderer: PortsCellComponent,
        width: 200,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.ACTION'),
        field: 'action',
        cellRenderer: actionRenderFunc,
        width: 85,
        minWidth: 85,
        maxWidth: 85,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.TYPE'),
        cellRenderer: typeRenderFunc,
        cellClass: 'grid-center-align',
        width: 110,
        minWidth: 110,
        maxWidth: 110,
        hide: isScoreImprovement,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.UPDATE_AT'),
        field: 'last_modified_timestamp',
        cellRenderer: lastModifiedTimestampRenderFunc,
        comparator: dateComparator,
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"/>',
          sortDescending: '<em class="fas fa-sort-numeric-down"/>',
        },
        width: 180,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.MATCH_COUNTER'),
        field: 'match_counter',
        width: 120,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.MATCH_AT'),
        field: 'last_match_timestamp',
        cellRenderer: lastModifiedTimestampRenderFunc,
        comparator: dateComparator,
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"/>',
          sortDescending: '<em class="fas fa-sort-numeric-down"/>',
        },
        width: 180,
      },
      {
        cellRenderer: ActionButtonsComponent,
        cellClass: ['grid-right-align'],
        width: 90,
        maxWidth: 90,
        minWidth: 90,
        hide:
          !isWriteNetworkRuleAuthorized ||
          source === GlobalConstant.NAV_SOURCE.GROUP,
      },
    ];

    return {
      defaultColDef: {
        resizable: true,
        sortable: source === GlobalConstant.NAV_SOURCE.GROUP,
      },
      headerHeight: 30,
      rowHeight: 30,
      animateRows: true,
      suppressDragLeaveHidesColumns: true,
      columnDefs: columnDefs,
      rowSelection: 'multiple' as 'single' | 'multiple' | undefined,
      isRowSelectable: idSelectionFunc,
      rowClassRules: {
        'disabled-row': function (params) {
          if (!params.data) return false;
          return !!params.data.disable;
        },
        'critical-row': function (params) {
          if (!params.data) return;
          return params.data.id === -1 && params.data.critical;
        },
      },
      onGridReady: onGridReadyFunc,
      overlayNoRowsTemplate: this.translate.instant('general.NO_ROWS'),
    };
  };

  getAutoCompleteData = source => {
    let groupReq = GlobalVariable.http
      .get<GroupResponse>(PathConstant.GROUP_LIST_URL, {
        params: {
          scope:
            source === GlobalConstant.NAV_SOURCE.FED_POLICY
              ? GlobalConstant.SCOPE.FED
              : GlobalConstant.SCOPE.LOCAL,
        },
      })
      .pipe(map(r => r.groups));

    let hostReq = GlobalVariable.http
      .get<HostResponse>(PathConstant.NODES_URL)
      .pipe(map(r => r.hosts));

    let applicationReq = GlobalVariable.http
      .get<ApplicationResponse>(PathConstant.POLICY_APP_URL)
      .pipe(map(r => r.list.application));

    return forkJoin([groupReq, hostReq, applicationReq]).pipe();
  };

  promoteNetworkRulesData = payload => {
    return GlobalVariable.http
      .post(PathConstant.PROMOTE_NETWORK_RULE, payload)
      .pipe();
  };

  submitNetworkRule = (networkRules: Array<NetworkRule>, source: string) => {
    let networkRulesCopy = JSON.parse(JSON.stringify(networkRules));
    let payload = {};
    let onlyRemove = true;
    let deletedRules = networkRulesCopy
      .map(function (rule) {
        if (rule.remove) {
          return rule.id;
        } else {
          onlyRemove = false;
        }
      })
      .filter(x => !!x);

    networkRulesCopy = networkRulesCopy
      .map(function (rule) {
        if (
          rule.state !== GlobalConstant.NETWORK_RULES_STATE.NEW &&
          rule.state !== GlobalConstant.NETWORK_RULES_STATE.MODIFIED &&
          !rule.remove
        ) {
          return { id: rule.id };
        } else {
          if (rule.state === GlobalConstant.NETWORK_RULES_STATE.NEW)
            rule.id = 0;
          if (!rule.remove) return rule;
        }
      })
      .filter(x => !!x && x.id !== -1);

    if (onlyRemove && deletedRules.length > 0) {
      payload = { delete: deletedRules };
    } else {
      payload = { rules: networkRulesCopy, delete: deletedRules };
    }

    let data = pako.gzip(JSON.stringify(payload));
    data = new Blob([data], { type: 'application/gzip' });
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
      params: {
        scope:
          source === GlobalConstant.NAV_SOURCE.FED_POLICY
            ? GlobalConstant.SCOPE.FED
            : GlobalConstant.SCOPE.LOCAL,
      },
    };
    return GlobalVariable.http
      .patch(PathConstant.POLICY_URL, data, config)
      .pipe();
  };
}
