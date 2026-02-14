import { Injectable, SecurityContext } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { ColDef, GridOptions } from 'ag-grid-community';
import * as $ from 'jquery';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { parseCamelStyle } from '@common/utils/common.utils';
import { ActionButtonsComponent } from '@components/groups/partial/action-buttons/action-buttons.component';
import { ScorableHeaderComponent } from '@components/groups/partial/scorable-header/scorable-header.component';
import { MonitorMetricHeaderComponent } from '@components/groups/partial/monitor-metric-header/monitor-metric-header.component';
import { MonitorMetricSwitchComponent } from '@components/groups/partial/monitor-metric-switch/monitor-metric-switch.component';
import { CustomCheckActionButtonComponent } from '@routes/components/group-details/partial/custom-check-action-button/custom-check-action-button.component';
import { GroupDlpConfigActionButtonComponent } from '@routes/components/group-details/partial/group-dlp-config-action-button/group-dlp-config-action-button.component';
import { GroupWafConfigActionButtonComponent } from '@routes/components/group-details/partial/group-waf-config-action-button/group-waf-config-action-button.component';
import { Group } from '@common/types';
import { CapitalizePipe } from '@common/pipes/app.pipes';
import { DomSanitizer } from '@angular/platform-browser';
import * as pako from 'pako';
import { PolicyHttpService } from '@common/api/policy-http.service';
import { ConfigHttpService } from '@common/api/config-http.service';
import { DatePipe } from '@angular/common';
import { GroupNetworkRulesComponent } from '@components/groups/partial/group-network-rules/group-network-rules.component';
import { GroupResponseRulesComponent } from '@components/groups/partial/group-response-rules/group-response-rules.component';

@Injectable()
export class GroupsService {
  private readonly $win;
  public selectedGroup: any;
  public customGroups: any;
  public groups: any;
  public activeTabIndex: number = 0;

  constructor(
    private utils: UtilsService,
    private policyHttpService: PolicyHttpService,
    private configHttpService: ConfigHttpService,
    private translate: TranslateService,
    private sanitizer: DomSanitizer,
    private datePipe: DatePipe,
    private capitalizePipe: CapitalizePipe
  ) {
    this.$win = $(GlobalVariable.window);
  }

  prepareGrid4Groups = (isScoreImprovement: boolean, isFed: boolean) => {
    const idRendererFunc = params => {
      if (params.value && params.data) {
        return `<span class=${params.data.reserved ? 'text-bold' : ''}>${
          params.value
        }</span>`;
      }
      return '';
    };
    const policyModeRendererFunc = params => {
      let policyMode,
        profileMode = '';
      if (
        params.value &&
        (params.value.policy_mode || params.value.profile_mode)
      ) {
        policyMode = params.value.policy_mode
          ? this.utils.getI18Name(`${params.value.policy_mode}_S`)
          : '';
        profileMode = params.value.profile_mode
          ? this.utils.getI18Name(`${params.value.profile_mode}_S`)
          : '';
        let labelCode4PolicyMode =
          MapConstant.colourMap[params.value.policy_mode] || '';
        let labelCode4ProfileMode =
          MapConstant.colourMap[params.value.profile_mode] || '';
        if (!(labelCode4PolicyMode || labelCode4ProfileMode)) return '';
        else
          return `${
            policyMode
              ? `<span class="type-label type-label-s ${labelCode4PolicyMode}">${policyMode}</span>`
              : ''
          }
            ${
              profileMode
                ? `<span class="type-label type-label-s ${labelCode4ProfileMode}">${profileMode}</span>`
                : ''
            }
            ${
              params.value.baseline_profile?.toLowerCase() === 'zero-drift'
                ? '<em class="eos-icons icon-18">anchor</em>'
                : ''
            }`;
      } else return '';
    };
    const typeRendererFunc = params => {
      if (params.value === GlobalConstant.CFG_TYPE.LEARNED) {
        return `<span class="action-label px-1 group-type ${
          MapConstant.colourMap['LEARNED']
        }">${this.translate.instant('group.LEARNED')}</span>`;
      } else if (params.value === GlobalConstant.CFG_TYPE.CUSTOMER) {
        return `<span class="action-label px-1 group-type ${
          MapConstant.colourMap['CUSTOM']
        }">${this.translate.instant('group.CUSTOM')}</span>`;
      } else if (params.value === GlobalConstant.CFG_TYPE.GROUND) {
        return `<span class="action-label px-1 group-type ${
          MapConstant.colourMap['GROUND']
        }">${this.translate.instant('group.GROUND')}</span>`;
      } else if (params.value === GlobalConstant.CFG_TYPE.FED) {
        return `<span class="action-label px-1 group-type ${
          MapConstant.colourMap['FED']
        }">${this.translate.instant('group.FED')}</span>`;
      }
      return '';
    };
    const scorableRendererFunc = params => {
      if (params && params.data) {
        let isScorableCanSwitch = params.data.cap_scorable;
        if (isScorableCanSwitch && !params.value)
          return `<i class="eos-icons icon-18">check</i>`;
      }
      return '';
    };
    let gridOptions4Groups: GridOptions = <GridOptions>{};
    let columnDefs4Groups: ColDef[] = [
      {
        headerName: this.translate.instant('group.gridHeader.NAME'),
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: params => {
          if (params && params.data) {
            return (
              isFed ||
              (!isFed && params.data.cfg_type !== GlobalConstant.CFG_TYPE.FED)
            );
          }
          return false;
        },
        field: 'name',
        cellRenderer: idRendererFunc,
      },
      {
        headerName: this.translate.instant('policy.addPolicy.COMMENT'),
        field: 'comment',
        hide: !isFed,
      },
      {
        headerName: this.translate.instant('group.gridHeader.DOMAIN'),
        field: 'domain',
        hide: isFed,
        width: 100,
      },
      {
        headerName: this.translate.instant(
          'group.gridHeader.POLICY_PROFILE_MODE'
        ),
        valueGetter: params => {
          return {
            policy_mode: params.data.policy_mode || '',
            profile_mode: params.data.profile_mode || '',
            baseline_profile: params.data.baseline_profile || '',
          };
        },
        cellRenderer: policyModeRendererFunc,
        comparator: (value1, value2, node1, node2) => {
          return `${value1.policy_mode.toLowerCase()}-${value1.profile_mode.toLowerCase()}-${value1.baseline_profile.toLowerCase()}`.localeCompare(
            `${value2.policy_mode.toLowerCase()}-${value1.profile_mode.toLowerCase()}-${value1.baseline_profile.toLowerCase()}`
          );
        },
        hide: isFed,
        width: 120,
        minWidth: 120,
      },
      {
        headerName: this.translate.instant('group.gridHeader.TYPE'),
        field: 'cfg_type',
        cellRenderer: typeRendererFunc,
        hide: isFed,
        width: 110,
        maxWidth: 110,
        minWidth: 110,
      },
      {
        headerName: this.translate.instant('group.gridHeader.MEMBERS'),
        field: 'members.length',
        hide: isFed,
        maxWidth: 80,
        minWidth: 80,
        width: 80,
      },
      {
        headerName: this.translate.instant('group.gridHeader.NETWORK_RULES'),
        field: 'policy_rules.length',
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
        maxWidth: 140,
        minWidth: 70,
        width: 70,
        hide: isFed,
      },
      {
        headerName: this.translate.instant('group.gridHeader.RESPONSE_RULES'),
        field: 'response_rules.length',
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
        maxWidth: 140,
        minWidth: 80,
        width: 80,
        hide: isFed,
      },
      {
        headerName: this.translate.instant('group.gridHeader.USED_BY_RULES'),
        field: 'policy_rules',
        cellRenderer: GroupNetworkRulesComponent,
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
        minWidth: 150,
        width: 150,
        hide: !isFed,
      },
      {
        headerName: this.translate.instant(
          'group.gridHeader.USED_BY_RESPONSE_RULES'
        ),
        field: 'response_rules',
        cellRenderer: GroupResponseRulesComponent,
        icons: {
          sortAscending: '<em class="fas fa-sort-numeric-up"></em>',
          sortDescending: '<em class="fas fa-sort-numeric-down"></em>',
        },
        minWidth: 150,
        width: 150,
        hide: !isFed,
      },
      {
        headerComponent: ScorableHeaderComponent,
        field: 'not_scored',
        cellRenderer: scorableRendererFunc,
        hide: isFed,
        sortable: false,
        width: 50,
        minWidth: 50,
        maxWidth: 50,
      },
      {
        headerComponent: MonitorMetricHeaderComponent,
        field: 'monitor_metric',
        cellRenderer: MonitorMetricSwitchComponent,
        width: 50,
        sortable: false,
        minWidth: 50,
        maxWidth: 50,
      },
      {
        headerName: '',
        cellRenderer: ActionButtonsComponent,
        maxWidth: 60,
        minWidth: 60,
        width: 60,
      },
    ];

    if (isScoreImprovement) {
      columnDefs4Groups = [
        {
          headerName: this.translate.instant('group.gridHeader.NAME'),
          headerCheckboxSelection: true,
          headerCheckboxSelectionFilteredOnly: true,
          checkboxSelection: true,
          field: 'name',
        },
        {
          headerName: this.translate.instant('group.gridHeader.DOMAIN'),
          field: 'domain',
        },
        {
          headerName: this.translate.instant(
            'group.gridHeader.POLICY_PROFILE_MODE'
          ),
          valueGetter: params => {
            return {
              policy_mode: params.data.policy_mode || '',
              profile_mode: params.data.profile_mode || '',
              baseline_profile: params.data.baseline_profile || '',
            };
          },
          cellRenderer: policyModeRendererFunc,
          comparator: (value1, value2, node1, node2) => {
            return `${value1.policy_mode.toLowerCase()}-${value1.profile_mode.toLowerCase()}-${value1.baseline_profile.toLowerCase()}`.localeCompare(
              `${value2.policy_mode.toLowerCase()}-${value1.profile_mode.toLowerCase()}-${value1.baseline_profile.toLowerCase()}`
            );
          },
          width: 130,
          minWidth: 130,
        },
        {
          headerName: this.translate.instant('service.gridHeader.MEMBERS'),
          field: 'members.length',
          icons: {
            sortAscending: '<em class="fa fa-sort-amount-down"></em>',
            sortDescending: '<em class="fa fa-sort-amount-up"></em>',
          },
        },
        {
          headerName: this.translate.instant(
            'service.gridHeader.LAST_UPDATED_AT'
          ),
          valueGetter: params => {
            const rules = params.data.policy_rules;
            if (rules && rules.length > 0) {
              let lastTimes = rules.map(rule => rule.last_modified_timestamp);
              let date = new Date(Math.max(...lastTimes) * 1000);
              return isNaN(date.getTime())
                ? null
                : this.datePipe.transform(date, 'MMM dd, y HH:mm:ss');
            } else return null;
          },
          comparator: (value1, value2, node1, node2) => {
            const getDate = node => {
              const rules = node.data.policy_rules;
              if (rules && rules.length > 0) {
                let lastTimes = rules.map(function (rule) {
                  return rule.last_modified_timestamp;
                });
                return Math.max(...lastTimes);
              } else return 0;
            };
            return getDate(node1) - getDate(node2);
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-amount-down"></em>',
            sortDescending: '<em class="fa fa-sort-amount-up"></em>',
          },
        },
      ];
    }

    gridOptions4Groups = this.utils.createGridOptions(
      columnDefs4Groups,
      this.$win
    );

    gridOptions4Groups.rowSelection = 'multiple';

    return gridOptions4Groups;
  };

  prepareGrid4Members = () => {
    let gridOptions4Members: GridOptions = <GridOptions>{};
    let columnDefs4Members = [
      {
        headerName: this.translate.instant('group.gridHeader.NAME'),
        field: 'display_name',
        cellRenderer: 'agGroupCellRenderer',
        cellRendererParams: {
          innerRenderer: params => {
            return params.data.display_name;
          },
        },
      },
      {
        headerName: 'Id',
        valueGetter: params => {
          return this.truncate(params.data.id, 12);
        },
        width: 100,
      },
      {
        headerName: this.translate.instant('group.gridHeader.DOMAIN'),
        field: 'domain',
      },
      {
        headerName: this.translate.instant('containers.detail.STATE'),
        field: 'state',
        cellRenderer: params => {
          let displayState = this.getDisplayName(params.value);
          if (params.value === 'disconnected')
            return `<span class="action-label px-1 warning">${displayState}</span>`;
          else if (params.value === 'discover')
            return `<span class="action-label px-1 info">${displayState}</span>`;
          else if (params.value === 'protect')
            return `<span class="action-label px-1 green">${displayState}</span>`;
          else if (params.value === 'unmanaged')
            return `<span class="action-label px-1 danger">${displayState}</span>`;
          else if (params.value === 'monitor')
            return `<span class="action-label px-1 primary">${displayState}</span>`;
          else if (params.value === 'quarantined')
            return `<span class="action-label px-1 pink">${displayState}</span>`;
          else
            return `<span class="action-label px-1 inverse">${displayState}</span>`;
        },
        width: 115,
        maxWidth: 115,
        minWidth: 115,
      },
      {
        headerName: this.translate.instant('group.gridHeader.VULNERABILITIES'),
        field: 'scan_summary',
        cellRenderer: params => {
          let display = '';
          if (params.value && params.value.high)
            display += `<span class="action-label px-1 danger ">${params.value.high}</span>`;
          if (params.value && params.value.medium)
            display += `<span class="action-label px-1 warning">${params.value.medium}</span>`;
          return display;
        },
        width: 120,
        maxWidth: 130,
      },
    ];
  };

  prepareGrid4CustomCheck = (isGranted, cfgType) => {
    const scriptColumnDefs = [
      {
        headerName: this.translate.instant('group.script.NAME'),
        field: 'name',
        width: 90,
        minWidth: 80,
      },
      {
        headerName: this.translate.instant('group.script.SCRIPT'),
        field: 'script',
      },
      {
        headerName: '',
        cellRenderer: CustomCheckActionButtonComponent,
        width: 45,
        minWidth: 45,
        maxWidth: 45,
        hide: !isGranted || cfgType === GlobalConstant.CFG_TYPE.GROUND,
      },
    ];
    return this.utils.createGridOptions(scriptColumnDefs, this.$win);
  };

  prepareGrid4GroupDlpSensors = () => {
    const dlpColumnDefs = [
      {
        headerName: this.translate.instant('group.dlp.gridHeader.NAME'),
        field: 'name',
        width: 120,
        minWidth: 100,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.COMMENT'),
        field: 'comment',
      },
      {
        headerName: this.translate.instant('admissionControl.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          if (params) {
            let cfgType = params.value ? params.value.toUpperCase() : '';
            let type = cfgType ? MapConstant.colourMap[cfgType] : '';
            if (params.data && params.data.exist && !cfgType) {
              cfgType = GlobalConstant.CFG_TYPE.CUSTOMER.toUpperCase();
            }
            return cfgType
              ? `<div class="type-label ${type}">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  this.translate.instant(`group.${cfgType}`)
                )}</div>`
              : '';
          }
          return '';
        },
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.ACTION'),
        field: 'action',
        cellRenderer: params => {
          if (params.value) {
            let mode = this.utils.getI18Name(
              params.value === 'allow' ? 'alert' : params.value
            );
            let labelCode =
              MapConstant.colourMap[
                params.value === 'allow' ? 'alert' : params.value
              ];
            if (!labelCode) labelCode = 'info';
            if (params.data) {
              if (params.data.exist) {
                return `<span class="action-label px-1 ${labelCode}">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  mode
                )}</span>`;
              } else {
                return `<span class="action-label px-1 disabled-action">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  mode
                )}</span>`;
              }
            }
          }
          return '';
        },
        width: 90,
        minWidth: 90,
        maxWidth: 90,
      },
    ];
    let gridOptions = this.utils.createGridOptions(dlpColumnDefs, this.$win);
    gridOptions.rowClassRules = {
      'disabled-row': params => {
        if (params.data) {
          return !params.data.exist;
        } else {
          return false;
        }
      },
    };
    return gridOptions;
  };

  prepareGrid4DlpSensorOption = () => {
    const sensorColumnDefs = [
      {
        headerName: this.translate.instant('group.dlp.gridHeader.NAME'),
        field: 'name',
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: true,
        width: 120,
        minWidth: 100,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.COMMENT'),
        field: 'comment',
        width: 420,
        minWidth: 400,
      },
      {
        headerName: this.translate.instant('admissionControl.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          if (params) {
            let cfgType = params.value ? params.value.toUpperCase() : '';
            let type = cfgType ? MapConstant.colourMap[cfgType] : '';
            if (params.data && params.data.exist && !cfgType) {
              cfgType = GlobalConstant.CFG_TYPE.CUSTOMER.toUpperCase();
            }
            return cfgType
              ? `<div class="type-label ${type}">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  this.translate.instant(`group.${cfgType}`)
                )}</div>`
              : '';
          }
          return '';
        },
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.ACTION'),
        field: 'isAllowed',
        cellRenderer: GroupDlpConfigActionButtonComponent,
        width: 105,
        minWidth: 105,
        maxWidth: 105,
      },
    ];
    let gridOptions = this.utils.createGridOptions(sensorColumnDefs, this.$win);

    gridOptions.rowSelection = 'multiple';
    return gridOptions;
  };

  prepareGrid4GroupWafSensors = () => {
    const dlpColumnDefs = [
      {
        headerName: this.translate.instant('group.dlp.gridHeader.NAME'),
        field: 'name',
        width: 120,
        minWidth: 100,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.COMMENT'),
        field: 'comment',
      },
      {
        headerName: this.translate.instant('admissionControl.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          if (params) {
            let cfgType = params.value ? params.value.toUpperCase() : '';
            let type = cfgType ? MapConstant.colourMap[cfgType] : '';
            if (params.data && params.data.exist && !cfgType) {
              cfgType = GlobalConstant.CFG_TYPE.CUSTOMER.toUpperCase();
            }
            return cfgType
              ? `<div class="type-label ${type}">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  this.translate.instant(`group.${cfgType}`)
                )}</div>`
              : '';
          }
          return '';
        },
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.ACTION'),
        field: 'action',
        cellRenderer: params => {
          if (params.value) {
            let mode = this.utils.getI18Name(
              params.value === 'allow' ? 'alert' : params.value
            );
            let labelCode =
              MapConstant.colourMap[
                params.value === 'allow' ? 'alert' : params.value
              ];
            if (!labelCode) labelCode = 'info';
            if (params.data) {
              if (params.data.exist) {
                return `<span class="action-label px-1 ${labelCode}">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  mode
                )}</span>`;
              } else {
                return `<span class="action-label px-1 disabled-action">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  mode
                )}</span>`;
              }
            }
          }
          return '';
        },
        width: 90,
        minWidth: 90,
        maxWidth: 90,
      },
    ];
    let gridOptions = this.utils.createGridOptions(dlpColumnDefs, this.$win);
    gridOptions.rowClassRules = {
      'disabled-row': params => {
        if (params.data) {
          return !params.data.exist;
        } else {
          return false;
        }
      },
    };
    return gridOptions;
  };

  prepareGrid4WafSensorOption = () => {
    const sensorColumnDefs = [
      {
        headerName: this.translate.instant('group.dlp.gridHeader.NAME'),
        field: 'name',
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: true,
        width: 120,
        minWidth: 100,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.COMMENT'),
        field: 'comment',
        width: 420,
        minWidth: 400,
      },
      {
        headerName: this.translate.instant('admissionControl.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          if (params) {
            let cfgType = params.value ? params.value.toUpperCase() : '';
            let type = cfgType ? MapConstant.colourMap[cfgType] : '';
            if (params.data && params.data.exist && !cfgType) {
              cfgType = GlobalConstant.CFG_TYPE.CUSTOMER.toUpperCase();
            }
            return cfgType
              ? `<div class="type-label ${type}">${this.sanitizer.sanitize(
                  SecurityContext.HTML,
                  this.translate.instant(`group.${cfgType}`)
                )}</div>`
              : '';
          }
          return '';
        },
        width: 110,
        minWidth: 110,
        maxWidth: 110,
      },
      {
        headerName: this.translate.instant('group.dlp.gridHeader.ACTION'),
        field: 'isAllowed',
        cellRenderer: GroupWafConfigActionButtonComponent,
        width: 105,
        minWidth: 105,
        maxWidth: 105,
      },
    ];
    let gridOptions = this.utils.createGridOptions(sensorColumnDefs, this.$win);

    gridOptions.rowSelection = 'multiple';
    return gridOptions;
  };

  getConfigData = () => {
    return this.configHttpService.getConfig();
  };

  getService = (name: string) => {
    return this.policyHttpService.getService(name);
  };

  getGroupsData = () => {
    return this.policyHttpService.getGroups().pipe();
  };

  getGroupInfo = (name: string) => {
    return this.policyHttpService.getGroup(name);
  };

  getGroupList = (scope: string = 'local') => {
    return this.policyHttpService.getGroupList(scope).pipe();
  };

  getLocalGroups = (with_cap: boolean = true) => {
    return this.policyHttpService.getGroups({ scope: 'local', with_cap });
  };

  getServices = (with_cap: boolean = true) => {
    return this.policyHttpService.getServices({ with_cap });
  };

  insertUpdateGroupData = (payload, opType) => {
    if (opType === GlobalConstant.MODAL_OP.ADD) {
      return this.policyHttpService.postGroup(payload);
    } else {
      return this.policyHttpService.patchGroup(payload);
    }
  };

  removeGroupData = name => {
    return this.policyHttpService.deleteGroup(name);
  };

  getNetworkRuleById = (id: number) => {
    return this.policyHttpService.getPolicyRule(id);
  };

  getResponseRuleById = (id: number) => {
    return this.policyHttpService.getResponseRule(id);
  };

  updatePolicyModeData = (policyMode: string, groups: any) => {
    let payload = {
      config: {
        policy_mode: parseCamelStyle(policyMode),
        services: groups.map(group => {
          return group.name.split('nv.')[1];
        }),
      },
    };
    return this.policyHttpService.patchService(payload);
  };

  updateScorableData = payload => {
    let data = pako.gzip(JSON.stringify(payload));
    data = new Blob([data], { type: 'application/gzip' });
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
    };
    return this.policyHttpService.patchService(data, config);
  };

  updateModeByService = (
    mode: string,
    profileMode: string,
    baselineProfile: string,
    switchableGroups: Array<Group>
  ) => {
    let serviceList = switchableGroups.map(element => {
      return element.name.indexOf('nv.') >= 0
        ? element.name.substring(3)
        : element.name;
    });
    let payload = { services: serviceList };
    if (baselineProfile !== 'no-change') {
      payload = Object.assign({ baseline_profile: baselineProfile }, payload);
    }
    if (mode !== '') {
      payload = Object.assign(
        { policy_mode: this.capitalizePipe.transform(mode) },
        payload
      );
    }
    if (profileMode !== '') {
      payload = Object.assign(
        { profile_mode: this.capitalizePipe.transform(profileMode) },
        payload
      );
    }

    console.log('service payload', { config: payload });
    let data = pako.gzip(JSON.stringify({ config: payload }));
    data = new Blob([data], { type: 'application/gzip' });
    let config = {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
      },
    };
    return this.policyHttpService.patchService(data, config);
  };

  updateMode4All = (
    mode: string,
    profileMode: string,
    baselineProfile: string
  ) => {
    let payload = {};
    if (baselineProfile !== 'no-change') {
      payload = Object.assign({ baseline_profile: baselineProfile }, payload);
    }
    if (mode !== '') {
      payload = Object.assign(
        { policy_mode: this.capitalizePipe.transform(mode) },
        payload
      );
    }
    if (profileMode !== '') {
      payload = Object.assign(
        { profile_mode: this.capitalizePipe.transform(profileMode) },
        payload
      );
    }
    return this.policyHttpService.patchServiceAll(payload);
  };

  exportGroupsConfigData = (payload, source) => {
    return this.policyHttpService.postGroupExport(payload, source);
  };

  getCustomCheckData = groupName => {
    return this.policyHttpService.getGroupScript(groupName);
  };

  updateCustomCheckData = payload => {
    return this.policyHttpService.patchGroupScript(payload);
  };

  getGroupDlpSensorData = groupName => {
    return this.policyHttpService.getDLPGroups(groupName);
  };

  getDlpSensorData = source => {
    return this.policyHttpService.getDLPSensors(source);
  };

  updateGroupDlpSensorData = payload => {
    return this.policyHttpService.patchDLPGroup(payload);
  };

  getGroupWafSensorData = groupName => {
    return this.policyHttpService.getWAFGroups(groupName);
  };

  getWafSensorData = getWAFSensors => {
    return this.policyHttpService.getWAFSensors(getWAFSensors);
  };

  updateGroupWafSensorData = payload => {
    return this.policyHttpService.patchWAFGroup(payload);
  };

  getFedGroupsData = () => {
    return this.policyHttpService.getFedGroups();
  };

  private truncate = (str, maxLength) => {
    if (str.length > maxLength) return str.substring(0, maxLength) + '...';
    else return str;
  };

  private getDisplayName = name => {
    return this.translate.instant('enum.' + name.toUpperCase());
  };
}
