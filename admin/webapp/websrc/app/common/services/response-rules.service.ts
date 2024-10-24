import { Injectable, SecurityContext } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PathConstant } from '@common/constants/path.constant';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalConstant } from '@common/constants/global.constant';
import * as $ from 'jquery';
import { UtilsService } from '@common/utils/app.utils';
import { forkJoin, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GridOptions } from 'ag-grid-community';
import { GlobalVariable } from '@common/variables/global.variable';
import { DomSanitizer } from '@angular/platform-browser';
import { getCfgType } from '@common/utils/common.utils';
import { ActionButtonsComponent } from '@components/response-rules/partial/action-buttons/action-buttons.component';

@Injectable()
export class ResponseRulesService {
  private readonly $win;
  public index4Delete: number = 0;
  public index4Add: number = 0;
  public index4Edit: number = 0;
  public index4Toggle: number = 0;
  public scope: string = GlobalConstant.SCOPE.LOCAL;
  public conditionOptions;
  public responseRules: Array<any> = [];

  constructor(
    private translate: TranslateService,
    private utils: UtilsService,
    public sanitizer: DomSanitizer
  ) {
    this.$win = $(GlobalVariable.window);
  }

  prepareGrid(
    isWriteResponseRuleAuthorized: boolean,
    source: string
  ): GridOptions {
    let columnDefs = [
      {
        headerName: this.translate.instant('responsePolicy.gridHeader.ID'),
        field: 'id',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
      },
      {
        headerName: this.translate.instant('responsePolicy.gridHeader.TYPE'),
        field: 'event',
        cellRenderer: params => {
          return this.eventRenderFunc(params);
        },
        width: 120,
        minWidth: 120,
        maxWidth: 120,
      },
      {
        headerName: this.translate.instant('admissionControl.COMMENT'),
        field: 'comment',
        width: 200,
      },
      {
        headerName: this.translate.instant('responsePolicy.gridHeader.GROUP'),
        field: 'group',
        width: 200,
      },
      {
        headerName: this.translate.instant(
          'responsePolicy.gridHeader.CRITERIA'
        ),
        field: 'conditions',
        width: 400,
      },
      {
        headerName: this.translate.instant('responsePolicy.gridHeader.ACTION'),
        field: 'actions',
        cellRenderer: params => {
          return this.actionRenderFunc(params);
        },
        width: 250,
      },
      {
        headerName: this.translate.instant('policy.gridHeader.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          return this.typeRenderFunc(params);
        },
        cellClass: 'grid-center-align',
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      {
        cellRenderer: ActionButtonsComponent,
        cellClass: 'grid-right-align',
        suppressSorting: true,
        width: 123,
        maxWidth: 123,
        minWidth: 123,
        hide: source === GlobalConstant.NAV_SOURCE.GROUP,
      },
    ];

    let gridOptions = this.utils.createGridOptions(columnDefs, this.$win);
    gridOptions.rowClassRules = {
      'disabled-row': params => {
        if (!params.data) return false;
        return !!params.data.disable;
      },
    };
    return gridOptions;
  }

  eventRenderFunc(params) {
    return (
      '<div class="type-label type-label-lg ' +
      (params.data.disable
        ? MapConstant.colourMap['disabled_background']
        : MapConstant.colourMap[params.data.event.toLowerCase()]) +
      '">' +
      this.translate.instant(
        'responsePolicy.categories.' + params.data.event.toUpperCase()
      ) +
      '</div>'
    );
  }

  actionRenderFunc(params) {
    let actions = '';
    params.data.actions.forEach(action => {
      actions +=
        '<div style="display: table; margin: 2px 2px; float: left"><div class="resp-rule-action-label px-1 ' +
        (params.data.disable
          ? MapConstant.colourMap['disabled_color']
          : MapConstant.colourMap[action.toLowerCase()]) +
        '">' +
        this.translate.instant(
          'responsePolicy.actions.' + action.toUpperCase()
        ) +
        '</div></div>';
    });
    return actions;
  }

  typeRenderFunc(params) {
    if (params && params.value) {
      let type = params.data.disable
        ? MapConstant.colourMap['disabled-rule']
        : MapConstant.colourMap[params.value.toUpperCase()];
      return `<div class="action-label px-1 ${type}">${this.sanitizer.sanitize(
        SecurityContext.HTML,
        this.translate.instant(`group.${params.value.toUpperCase()}`)
      )}</div>`;
    }
    return '';
  }

  getResponseRulesData(scope) {
    if (scope === GlobalConstant.SCOPE.FED)
      return GlobalVariable.http
        .get(PathConstant.RESPONSE_POLICY_URL, { params: { scope: scope } })
        .pipe();
    else
      return GlobalVariable.http.get(PathConstant.RESPONSE_POLICY_URL).pipe();
  }

  getIndex(array, id) {
    return array.findIndex(elem => elem.id === id);
  }

  getPattern(event) {
    let pattern: Array<string> = [];
    let conditionOptions = this.conditionOptions;
    conditionOptions[event].types.forEach(type => {
      if (type !== 'level' && type !== 'name') {
        if (type === 'cve-high' || type === 'item') {
          pattern.push(`^${type}:[0-9]+[\.][0-9]+$|^${type}:[0-9]+$`);
        } else {
          pattern.push(`^${type}:.+$`);
        }
      }
    });
    if (conditionOptions[event].name) {
      conditionOptions[event].name.forEach(name => {
        pattern.push(`^${name}$`);
      });
    } else {
      if (conditionOptions[event].types.includes('name')) {
        pattern.push('^name:.+$');
      }
    }
    if (conditionOptions[event].level) {
      conditionOptions[event].level.forEach(level => {
        pattern.push(`^${level}$`);
      });
    }
    return new RegExp(pattern.join('|'));
  }

  conditionObjToString(conditions) {
    if (
      conditions !== null &&
      conditions !== '' &&
      typeof conditions !== 'undefined'
    ) {
      conditions = conditions
        .map(condition => {
          return condition.type + ':' + condition.value;
        })
        .join(', ');
    } else {
      conditions = '';
    }
    return conditions;
  }

  conditionObjToTag(conditions) {
    if (
      conditions !== null &&
      conditions !== '' &&
      typeof conditions !== 'undefined'
    ) {
      conditions = conditions.map(condition => {
        return { name: condition.type + ':' + condition.value };
      });
    } else {
      conditions = [];
    }
    return conditions;
  }

  conditionTagToString(conditions) {
    if (
      conditions !== null &&
      conditions !== '' &&
      typeof conditions !== 'undefined'
    ) {
      conditions = conditions
        .map(condition => {
          return condition.name;
        })
        .join(', ');
    } else {
      conditions = '';
    }
    return conditions;
  }

  conditionStringToTag(conditions) {
    if (
      conditions !== null &&
      conditions !== '' &&
      typeof conditions !== 'undefined' &&
      conditions.length > 0
    ) {
      conditions = conditions.split(',').map(condition => {
        return { name: condition };
      });
    } else {
      conditions = [];
    }
    return conditions;
  }

  createFilter(query) {
    let lowercaseQuery = query.toLowerCase();
    return function filterFn(criteria) {
      return criteria.toLowerCase().indexOf(lowercaseQuery) >= 0;
    };
  }

  destructConditions(rules) {
    rules.forEach(rule => {
      rule.conditions = this.conditionObjToString(rule.conditions);
    });
    return rules;
  }

  getAutoCompleteData() {
    let groupReq = GlobalVariable.http
      .get(PathConstant.GROUP_URL, { params: { scope: this.scope } })
      .pipe(
        catchError(err => {
          return throwError(err);
        })
      );
    let optionsReq = GlobalVariable.http
      .get(PathConstant.CONDITION_OPTION_URL, { params: { scope: this.scope } })
      .pipe(
        catchError(err => {
          return throwError(err);
        })
      );
    return forkJoin([groupReq, optionsReq]).pipe();
  }

  insertUpdateResponseRuleData(responseRule, actionList, type, webhookOptions) {
    let payload: any;
    if (type === GlobalConstant.MODAL_OP.ADD) {
      payload = {
        insert: {
          after: responseRule.id,
          rules: [
            {
              event: responseRule.event,
              comment: responseRule.comment,
              group: responseRule.group || '',
              conditions: this.parseConditions(responseRule.criteria),
              actions: this.filterSelectedOptions(
                responseRule.actions,
                actionList
              ),
              disable: !responseRule.enabled,
              cfg_type: getCfgType(this.scope),
              webhooks: this.filterSelectedOptions(
                responseRule.webhooks,
                webhookOptions
              ),
            },
          ],
        },
      };
      console.log(responseRule.enabled);
      return GlobalVariable.http
        .post(PathConstant.RESPONSE_POLICY_URL, payload)
        .pipe();
    } else {
      if (type === GlobalConstant.MODAL_OP.EDIT) {
        payload = {
          config: {
            id: responseRule.id,
            event: responseRule.event,
            comment: responseRule.comment,
            group: responseRule.group || '',
            conditions: this.parseConditions(responseRule.criteria),
            actions: this.filterSelectedOptions(
              responseRule.actions,
              actionList
            ),
            disable: !responseRule.enabled,
            cfg_type: getCfgType(this.scope),
            webhooks: this.filterSelectedOptions(
              responseRule.webhooks,
              webhookOptions
            ),
          },
        };
      } else {
        payload = {
          config: responseRule,
        };
      }
      return GlobalVariable.http
        .patch(PathConstant.RESPONSE_POLICY_URL, payload)
        .pipe();
    }
  }

  parseConditions(criteria) {
    return Array.isArray(criteria)
      ? criteria.map(criterion => {
          let criterionArr = criterion.split(':');
          return {
            type: criterionArr[0],
            value: criterionArr[1],
          };
        })
      : [];
  }

  filterSelectedOptions(optionsBoolean, optionList) {
    let selecetedOptions: Array<any> = [];
    optionList.forEach((action, index) => {
      if (optionsBoolean[index]) {
        selecetedOptions.push(action);
      }
    });
    return selecetedOptions;
  }

  removeResponseRuleData(id) {
    return GlobalVariable.http
      .delete(PathConstant.RESPONSE_POLICY_URL, {
        params: { id: id, scope: this.scope },
      })
      .pipe();
  }

  unquarantine(id) {
    let payload = {
      request: {
        unquarantine: {
          response_rule: id,
        },
      },
    };
    let unquarantineReq = GlobalVariable.http
      .post(PathConstant.UNQUARANTINE_URL, payload)
      .pipe();
    let removeReq = GlobalVariable.http
      .delete(`${PathConstant.RESPONSE_POLICY_URL}?id=${id}`)
      .pipe();
    return forkJoin([unquarantineReq, removeReq]).pipe();
  }
}
