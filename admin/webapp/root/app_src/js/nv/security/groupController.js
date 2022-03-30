(function() {
  "use strict";

  angular.module("app.group").controller("GroupController", GroupController);

  GroupController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$translate",
    "$timeout",
    "$sanitize",
    "$window",
    "$document",
    "Utils",
    "Alertify",
    "$filter",
    "$controller",
    "$state",
    "$stateParams",
    "FileSaver",
    "AuthorizationFactory",
    "responseRulesService"
  ];
  function GroupController(
    $scope,
    $http,
    $mdDialog,
    $translate,
    $timeout,
    $sanitize,
    $window,
    $document,
    Utils,
    Alertify,
    $filter,
    $controller,
    $state,
    $stateParams,
    FileSaver,
    AuthorizationFactory,
    responseRulesService
  ) {

    const TAB_NAME = {
      MEMBER: 0,
      SCRIPT: 1,
      PROFILE: 2,
      FILE: 3,
      NETWORK: 4,
      RESPONSE: 5,
      DLP: 6,
      WAF: 7
    };

    const SCORED_ST = {
      ALL_SCORED: 0,
      PARTIAL_SCORED: 1,
      ALL_NOT_SCORED: 2
    };

    const PROCESS_PROFILE_SAMPLE = `
      <div>
        <h5 class="text-bold">Sample</h5>
        <table>
          <tr class="sample-table-header">
            <th class="sample-table-border column-1">${$translate.instant("service.gridHeader.NAME")}</th>
            <th class="sample-table-border column-2">${$translate.instant("service.gridHeader.PATH")}</th>
            <th class="sample-table-border column-3">${$translate.instant("policy.addPolicy.COMMENT")}</th>
          </tr>
          <tr>
            <td class="sample-table-border column-1">cat</td>
            <td class="sample-table-border column-2">* or empty</td>
            <td class="sample-table-border column-3">"cat" in any path</td>
          </tr>
          <tr>
            <td class="sample-table-border column-1">cat</td>
            <td class="sample-table-border column-2">/bin/cat</td>
            <td class="sample-table-border column-3">"cat" in a specific path</td>
          </tr>
          <tr>
            <td class="sample-table-border column-1">cat</td>
            <td class="sample-table-border column-2">/bin/*</td>
            <td class="sample-table-border column-3">"cat" under a specific path</td>
          </tr>
          <tr>
            <td class="sample-table-border column-1">*</td>
            <td class="sample-table-border column-2">*</td>
            <td class="sample-table-border column-3">a special rule for allowing all binary to run ( not for deny rules)</td>
          </tr>
        </table>
        <div class="text-bold">
          A single wildcard must be at the end
        </div>
      </div>
    `;

    const FILE_ACCESS_FILTER_SAMPLE = `
      <div id="file-access-filter-sample">
        <h5 class="text-bold">Sample</h5>
        <table>
          <tr class="sample-table-header">
            <th class="sample-table-border">${$translate.instant("service.gridHeader.FILTER")}</th>
          </tr>
          <tr>
            <td class="sample-table-border">/dir/xxx</td>
          </tr>
          <tr>
            <td class="sample-table-border">/dir/xxx.*</td>
          </tr>
          <tr>
            <td class="sample-table-border">/dir/*.xxx</td>
          </tr>
          <tr>
            <td class="sample-table-border">/dir/*/abc/*</td>
          </tr>
        </table>
        <div class="text-bold">not support [] () regexp</div>
      </div>
    `;

    const setDetailsViewHeight4Init = function() {
      $scope.gridHeight = Utils.getMasterGridHeight() - 13;
      $scope.memberGridHeight = Utils.getDetailViewHeight() - 76;
      $scope.ruleGridHeight = Utils.getDetailViewHeight() - 76;
      $scope.ruleGridHeightWithBtn = Utils.getDetailViewHeight() - 76;
      $scope.ruleGridHeightWithBtn2 = Utils.getDetailViewHeight() - 76;
      $scope.scriptHeight = Utils.getDetailViewHeight() - 206;
      $scope.scriptGridHeight = Utils.getDetailViewHeight() - 93;
      $scope.scriptViewHeight = Utils.getDetailViewHeight() - 41;
    };
    const PAGE_SIZE = PAGE.GROUPS;

    $scope.selectedTab = TAB_NAME.MEMBER;
    $scope.isSwitchingMode = false;
    $scope.eof = false;
    $scope.noChecked = true;
    $scope.selectedCount = 0;

    $scope.WRITE_MODE = {
      ADD: 0,
      UPDATE: 1
    };

    $scope.writeMode = $scope.WRITE_MODE.ADD;

    $scope.isWriteGroupAuthorized = AuthorizationFactory.getDisplayFlag("write_group");
    $scope.isNamespaceUser = AuthorizationFactory.userPermission.isNamespaceUser;

    $scope.CFG_TYPE = CFG_TYPE;

    $scope.forAll = false;
    let filter = "";
    let firstCheckedGroupName = "";
    const PROFILE_DELETE_CONFIRMATION = $translate.instant(
      "service.PROFILE_DELETE_CONFIRMATION"
    );
    let vm = this;

    const getCheckedRows = function() {
      return $scope.groups.filter(group => group.checked);
    }

    activate();

    ////////////////////

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window); // cache reference for resize
      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("group.COUNT_POSTFIX")
        );
      };
      let isCheckAll = false;
      let isPartialChecked = false;
      const found = $translate.instant("enum.FOUND");

      let groupName = $stateParams.groupName;
      let pageFrom = $stateParams.from;

      $scope.title = "fa-edit";
      $scope.mode = "view";
      $scope.onRulePreview = false;
      $scope.onResponseRulePreview = false;
      $scope.addingGroup = false;
      $scope.hasGroupss = false;
      $scope.colorMap = colourMap;
      $scope.modes = ["discover", "monitor", "protect"];

      $scope.pageY = $window.innerHeight / 2 + 28;

      setDetailsViewHeight4Init();

      const setDetailsViewHeight4Drag = function(pageY) {
        $scope.gridHeight = pageY - 208;
        $scope.memberGridHeight = $window.innerHeight -  pageY - 197;
        $scope.ruleGridHeight = $window.innerHeight -  pageY - 197;
        $scope.ruleGridHeightWithBtn = $window.innerHeight -  pageY - 197;
        $scope.ruleGridHeightWithBtn2 = $window.innerHeight -  pageY - 197;
        $scope.scriptHeight = $window.innerHeight -  pageY - 327;
        $scope.scriptGridHeight = $window.innerHeight -  pageY - 214;
        $scope.scriptViewHeight = $window.innerHeight -  pageY - 162;
      };

      angular.element($window).bind("resize", function() {
        setDetailsViewHeight4Drag($scope.pageY);
        $scope.$digest();
      });

      const mousemove = function(event) {
        $scope.pageY = event.pageY;
        if (event.pageY >= 234 && event.pageY <= $window.innerHeight - 195) {
          setDetailsViewHeight4Drag(event.pageY);
          $scope.gridHeight = event.pageY - 208;
          $scope.detailViewHeight = $window.innerHeight -  event.pageY - 133;
          setTimeout(function () {
            $scope.gridGroup.api.sizeColumnsToFit();
            $scope.gridGroup.api.forEachNode(function(node, index) {
              if ($scope.group) {
                if (node.data.name === $scope.group.name) {
                  node.setSelected(true);
                  $scope.gridGroup.api.ensureNodeVisible(node);
                }
              } else if (index === 0) {
                node.setSelected(true);
                $scope.gridGroup.api.ensureNodeVisible(node);
              }
            });
          }, 200);
        }
      };

      const mouseup = function() {
        $document.unbind('mousemove', mousemove);
        $document.unbind('mouseup', mouseup);
      };

      $scope.grabResizeBar = function(event) {
        event.preventDefault();
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      };

      let timer;
      let responseRuleTimer;

      let classMap = {
        disconnected: "label-warning",
        discover: "label-info",
        protect: "label-green",
        unmanaged: "label-danger",
        monitor: "label-primary",
        quarantined: "label-pink",
        exit: "label-inverse"
      };

      $scope.getClassCode = function(state) {
        return classMap[state];
      };

      const verifyRemovable = function(group) {
        return (
            group.cfg_type !== CFG_TYPE.GROUND &&
            group.cfg_type !== CFG_TYPE.FED &&
            (
              group.cfg_type !== CFG_TYPE.LEARNED ||
              (group.cfg_type === CFG_TYPE.LEARNED && group.members.length === 0)
            ) &&
            !group.reserved &&
            group.kind !== GROUP_KIND.IP_SERVICE
        );
      };

      const isFilteredAllSelected = function(checkedRows, filteredRows) {
        return filteredRows.every(filteredRow => {
          return checkedRows.findIndex(checkedRow => checkedRow.name === filteredRow.data.name) >= 0;
        });
      }

      const verifyPartialChecked = function () {
        let checkedRows = getCheckedRows();
        let filteredRows =$scope.gridGroup.api.getModel().rootNode.childrenAfterFilter;
        if (checkedRows.length > 0 && $scope.groups.length > checkedRows.length) {
          if (isFilteredAllSelected(checkedRows, filteredRows)) {
            isCheckAll = true;
            $("#all-groups").prop("checked", true);
            $("#all-groups").removeClass("partial-checked");
          } else {
            isCheckAll = false;
            $("#all-groups").prop("checked", false);
            $("#all-groups").addClass("partial-checked");
          }
        } else {
          $("#all-groups").removeClass("partial-checked");
        }
      }

      const verifyNoModeCap = function() {
        $scope.noModeList = getCheckedRows().filter(group => !group.cap_change_mode);
        $scope.noScoredList = getCheckedRows().filter(group => !group.cap_scorable);
        $scope.isIncludingNoMode = $scope.noModeList.length > 0;
        $scope.isNotAble2SwitchScorable = $scope.noScoredList.length > 0;
        if ($scope.isIncludingNoMode) {
          let noModeGroups = $scope.noModeList.map(group => {
            return `<li>${group.name}</li>`;
          }).join("");
          $scope.disabledSwitchModeHtml = `
            <div class="mt-sm mb-sm ml-sm mr-sm">
              <div>${$translate.instant("group.SWITCH_MODE_DISABLED")}</div>
              <ul>
                ${noModeGroups}
              </ul>
            </div>
          `;
        }
        if ($scope.isNotAble2SwitchScorable) {
          let noScorableGroups = $scope.noScoredList.map(group => {
            return `<li>${group.name}</li>`;
          }).join("");
          $scope.disabledScorableHtml = `
            <div class="mt-sm mb-sm ml-sm mr-sm">
              <div>${$translate.instant("group.SCORED_DISABLED")}</div>
              <ul>
                ${noScorableGroups}
              </ul>
            </div>
          `;
        }
      };

      $scope.switchScorable = function(scorable) {
        if (scorable) {
          $("#switch-scorable").prop("checked", true);
        } else {
          $("#switch-scorable").prop("checked", false);
        }
        $("#switch-scorable").removeClass("partial-checked");
        $scope.group.scorable = scorable;
        $scope.group.not_scored = !scorable;
        let switchedGroup = angular.copy($scope.group);
        console.log("switchedGroup: ",switchedGroup);
        let serviceList = getCheckedRows().map(function(element) {
          return element.name.indexOf("nv.") >= 0
            ? element.name.substring(3)
            : element.name;
        });
        let data = {
          config: { services: serviceList, not_scored: switchedGroup.not_scored }
        };
        data = pako.gzip(JSON.stringify(data));
        data = new Blob([data], {type: 'application/gzip'});
        let config = {
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip'
          }
        };
        $http
          .patch(SERVICE_URL, data, config)
          .then(function() {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success(
              $translate.instant("service.SUBMIT_SCORABLE_OK")
            );
            $timeout(() => {
              $scope.refresh();
            }, 1000);
          })
          .catch(function(error) {
            console.warn(error);
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(error, $translate.instant("service.SUBMIT_SCORABLE_FAILED"), false)
              );
            }
            isCheckAll = false;
            $scope.isSwitchingMode = false;
          });
      }

      const verifyNoChecked = function() {
        $scope.noChecked = getCheckedRows().length === 0;
      };

      const containsNotScored = function(selectedRows) {
        let scorableGroups = selectedRows.filter(group => group.cap_scorable);
        if (scorableGroups.length > 0) {
          let isAllScored =  scorableGroups.map(group => {
            return !group.not_scored;
          }).reduce((res, curr) => res && curr);

          let isAllNotScored = scorableGroups.map(group => {
            return group.not_scored && group.cap_scorable;
          }).reduce((res, curr) => res && curr);

          return isAllScored ? SCORED_ST.ALL_SCORED : (isAllNotScored ? SCORED_ST.ALL_NOT_SCORED : SCORED_ST.PARTIAL_SCORED);
        } else {
          return SCORED_ST.ALL_NOT_SCORED;
        }
      };

      const verifyScored = function() {
        let checkedRows = getCheckedRows();
        $scope.selectedCount = checkedRows.length;
        if (checkedRows.length > 0) {
          switch(containsNotScored(checkedRows)) {
            case SCORED_ST.ALL_SCORED:
              $("#switch-scorable").prop("checked", true);
              $("#switch-scorable").removeClass("partial-checked");
              break;
            case SCORED_ST.PARTIAL_SCORED:
              $("#switch-scorable").prop("checked", false);
              $("#switch-scorable").addClass("partial-checked");
              break;
            case SCORED_ST.ALL_NOT_SCORED:
              $("#switch-scorable").prop("checked", false);
              $("#switch-scorable").removeClass("partial-checked");
          }
        } else {
          $("#switch-scorable").removeClass("partial-checked");
        }
      };

      $scope.onChecked = function(data, node) {
        data.checked = !data.checked;
        verifyPartialChecked();
        verifyNoModeCap();
        verifyNoChecked();
        $timeout(() => {
          verifyScored();
        },200);
      };

      $scope.onCheckedAll = function() {
        isCheckAll = !isCheckAll;
        $scope.selectedCount = 0;
        if (isCheckAll) {
          $scope.gridGroup.api.forEachNodeAfterFilter(node => {
            node.data.checked = true;
            $scope.selectedCount++;
          });
        } else {
          $scope.gridGroup.api.forEachNodeAfterFilter(node => {
            node.data.checked = false;
          });
        }
        $timeout(() => {
          verifyPartialChecked();
          verifyNoModeCap();
          verifyNoChecked();
          $scope.gridGroup.api.redrawRows();
        }, 200)
      };

      let columnDefs4Group = [
        {
          headerName: '',
          cellRenderer: function(params) {
            if (params && params.data)
              return `<span class="nv-checkbox"><input type="checkbox" ng-checked="${params.data.checked}" ng-click="onChecked(data)"><em></em></span>`;
          },
          sortable: false,
          width: 27,
          minWidth: 27,
          maxWidth: 27
        },
        {
          headerName: $translate.instant("group.gridHeader.NAME"),
          field: "name",
          cellRenderer: function(params) {
            if(params.data.reserved)
              return `<span class="text-bold">${$sanitize(params.value)}</span>`;
            else
              return `<span >${$sanitize(params.value)}</span>`;
          },
          width: 150
        },
        {
          headerName: $translate.instant("group.gridHeader.DOMAIN"),
          field: "domain",
          width: 90
        },
        {
          headerName: $translate.instant("group.gridHeader.POLICY_MODE"),
          field: "policy_mode",
          valueGetter: function(params) {
            return {"policy_mode": params.data.policy_mode, "baseline_profile": params.data.baseline_profile};
          },
          cellRenderer: function(params) {
            let mode = "";
            let zeroDrift = params.value.baseline_profile === "zero-drift";
            if (params.value.policy_mode) {
              mode = Utils.getI18Name(params.value.policy_mode);
              let labelCode = colourMap[params.value.policy_mode];
              if (!labelCode) return null;
              else {
                let modeLabel = `<span class="label label-fs label-${labelCode}">${$sanitize(
                  mode
                )}</span>`;
                if (zeroDrift)
                  return modeLabel + `<md-icon md-svg-src="app/img/icons/anchor.svg"
                                        aria-label="Zero Drift"></md-icon>`;
                else
                  return modeLabel;
              };
            } else return null;
          },
          width: 100,
          minWidth: 100
        },
        {
          headerName: $translate.instant("group.gridHeader.TYPE"),
          field: "cfg_type",
          cellRenderer: function(params) {
            if (params.value === CFG_TYPE.LEARNED) {
              return `<span class="action-label nv-label ${
                colourMap["LEARNED"]
              }">${$translate.instant("group.LEARNED")}</span>`;
            } else if (params.value === CFG_TYPE.CUSTOMER) {
              return `<span class="action-label nv-label ${
                colourMap["CUSTOM"]
              }">${$translate.instant("group.CUSTOM")}</span>`;
            } else if (params.value === CFG_TYPE.GROUND) {
              return `<span class="action-label nv-label ${
                colourMap["GROUND"]
              }">${$translate.instant("group.GROUND")}</span>`;
            } else if (params.value === CFG_TYPE.FED) {
              return `<span class="action-label nv-label ${
                colourMap["FED"]
              }">${$translate.instant("group.FED")}</span>`;
            }
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("group.gridHeader.MEMBERS"),
          field: "members.length",
          maxWidth: 80,
          minWidth: 80,
          width: 80
        },
        {
          headerName: $translate.instant("group.gridHeader.NETWORK_RULES"),
          field: "policy_rules",
          cellRenderer: (params) => {
            if (params && params.value) {
              return params.value.length;
            }
          },
          comparator: (value1, value2, node1, node2) => {
            return value1.length - value2.length;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
          },
          maxWidth: 140,
          minWidth: 50,
          width: 50
        },
        {
          headerName: $translate.instant("group.gridHeader.RESPONSE_RULES"),
          field: "response_rules",
          cellRenderer: (params) => {
            if (params && params.value) {
              return params.value.length;
            }
          },
          comparator: (value1, value2, node1, node2) => {
            return value1.length - value2.length;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
          },
          maxWidth: 140,
          minWidth: 50,
          width: 50
        },
        {
          headerName: `<em class="fa fa-tachometer text-primary" aria-hidden="true"></em>`,
          field: "not_scored",
          cellRenderer: function(params) {
            if (params && params.data) {
              let isScorableCanSwitch = params.data.cap_scorable;
              if (isScorableCanSwitch && !params.value)
                return (
                  `<i class="fa fa-check text-primary" aria-hidden="true"></i>`
                );
            }
          },
          sortable: false,
          width: 27,
          minWidth: 27,
          maxWidth: 27
        },
        {
          headerName: "",
          cellRenderer: (params) => {
            if (params && params.data) {
              let isReadonlyRule =
                params.data.cfg_type === CFG_TYPE.GROUND ||
                params.data.cfg_type === CFG_TYPE.FED ||
                params.data.cfg_type === CFG_TYPE.LEARNED;
              let isAddressGroupAndNamespaceUser = $scope.isNamespaceUser && params.data.kind.toLowerCase() === GROUP_KIND.ADDRESS;
              let isRemovableGroup = verifyRemovable(params.data);
              return (
                `     <div>
                        <em class="fa fa-edit fa-lg mr-sm text-action" ng-if="${!isReadonlyRule && !params.data.reserved && !isAddressGroupAndNamespaceUser && $scope.isWriteGroupAuthorized}"
                          ng-click="editGroup($event, data, true)" uib-tooltip="{{\'group.TIP.EDIT\' | translate}}">
                        </em>
                        <em class="fa fa-newspaper-o fa-lg mr-sm text-action" ng-if="${isReadonlyRule || params.data.reserved || isAddressGroupAndNamespaceUser || !$scope.isWriteGroupAuthorized}"
                          ng-click="editGroup($event, data, false)" uib-tooltip="{{\'group.TIP.VIEW\' | translate}}">
                        </em>
                        <em class="fa fa-trash fa-lg mr-sm text-action" ng-if="${isRemovableGroup && !isAddressGroupAndNamespaceUser && $scope.isWriteGroupAuthorized}"
                          ng-click="remove(data)" uib-tooltip="{{\'group.TIP.DELETE\' | translate}}">
                        </em>
                      </div>`
              );
            }
          },
          maxWidth: 70,
          minWidth: 70,
          width: 70
        }
      ];

      if (!$scope.isWriteGroupAuthorized) {
        columnDefs4Group.shift();
      }

      $scope.onEnter = function(id) {
        timer = $timeout(function() {
          $scope.showRule(id);
        }, 2000);
      };

      $scope.onLeave = function() {
        $timeout.cancel(timer);
      };

      $scope.onResponseRuleEnter = function(id) {
        responseRuleTimer = $timeout(function() {
          $scope.showResponseRule(id);
        }, 2000);
      };

      $scope.onResponseRuleLeave = function() {
        $timeout.cancel(responseRuleTimer);
      };

      $scope.showRule = function(id) {
        $http
          .get(POLICY_RULE_URL, { params: { id: id } })
          .then(function(response) {
            $scope.rule = response.data.rule;
            $scope.onRulePreview = true;
            $scope.onResponseRulePreview = false;
            $timeout(function() {
              $scope.onRulePreview = false;
            }, 8000);
          })
          .catch(function(err) {
            console.log(err);
          });
      };

      function destructConditions(conditions) {
        let resCondition = "";
        if (
          conditions !== null &&
          conditions !== "" &&
          typeof conditions !== "undefined"
        ) {
          conditions.forEach(function(condition) {
            resCondition += condition.type + ":" + condition.value + ", ";
          });
          resCondition = resCondition.substring(0, resCondition.length - 2);
        } else {
          resCondition = "";
        }
        return resCondition;
      }

      $scope.showResponseRule = function(id) {
        $http
          .get(RESPONSE_RULE_URL, { params: { id: id } })
          .then(function(response) {
            $scope.responseRule = response.data.rule;
            $scope.responseRule.conditions = destructConditions(
              $scope.responseRule.conditions
            );
            let actions = "";
            $scope.responseRule.actions.map(function(action) {
              actions +=
                $translate.instant(
                  "responsePolicy.actions." + action.toUpperCase()
                ) + ", ";
            });
            $scope.responseRule.actions = actions.substring(
              0,
              actions.length - 2
            );
            $scope.onResponseRulePreview = true;
            $scope.onRulePreview = false;
            $timeout(function() {
              $scope.onResponseRulePreview = false;
            }, 8000);
          })
          .catch(function(err) {
            console.log(err);
          });
      };

      $scope.gridGroup = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        suppressScrollOnNewData: true,
        columnDefs: columnDefs4Group,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        onSelectionChanged: onSelectionChanged4Group,
        // rowModelType: 'infinite',
        // paginationPageSize: 20,
        // maxConcurrentDatasourceRequests: 2,
        // cacheBlockSize: 20,
        // infiniteInitialRowCount: 20,
        // maxBlocksInCache: 15,
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 2000);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
      };

      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridGroup.api.setQuickFilter(value);

        let filteredCount = $scope.gridGroup.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.groups.length || value === ""
            ? `${$scope.groups.length} ${getEntityName($scope.groups.length)}`
            : `${found} ${filteredCount} / ${$scope.groups.length} ${getEntityName(
                $scope.groups.length
              )}`;
        verifyPartialChecked();
        verifyNoChecked();
      };

      $scope.onDetailsFilterChanged = function(gridOptionsName, value) {
        $scope[gridOptionsName].api.setQuickFilter(value);
      };

      $scope.toggleSystemGroup = function(hideGroup) {
        $scope.hideSystemGroup = hideGroup;
        if (hideGroup) {
          $scope.groups = $scope.groups.filter(function(item) {
            return !item.platform_role;
          });
          $scope.gridGroup.api.setRowData($scope.groups);
          $scope.count = `${$scope.groups.length} ${getEntityName(
            $scope.groups.length
          )}`;
          $scope.onFilterChanged(filter);
        } else $scope.refresh();
      };

      function setRowData4Group(rowData) {
        $scope.gridGroup.api.setRowData(rowData);
      }

      function forEach(array, action) {
        for (let i = 0; i < array.length; i++) action(array[i]);
      }

      function getGridHeight() {
        let itemNum = $scope.group.members.length;
        let height;
        if (itemNum < 1) height = 67 + 30;
        else if (itemNum < 6) height = 67 + 30 * itemNum;
        else height = 67 + 30 * 6;
        return height;
      }

      function getDisplayName(name) {
        return $translate.instant("enum." + name.toUpperCase());
      }

      function truncate(string, maxLength) {
        if (string.length > maxLength)
          return string.substring(0, maxLength) + "...";
        else return string;
      }

      function idGetter(params) {
        return truncate(params.data.id, 20);
      }

      function innerCellRenderer(params) {
        if (params.data.display_name) {
          return $sanitize(params.data.display_name);
        } else {
          return $sanitize(params.data.name);
        }
      }

      let columnDefs4Members = [
        {
          headerName: $translate.instant("group.gridHeader.NAME"),
          field: "display_name",
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: { innerRenderer: innerCellRenderer }
        },
        {
          headerName: "id",
          field: "id",
          cellRenderer: params => {
            if (params.value)
              return `<span uib-tooltip="'${params.value}'">${Utils.shortenString(params.value, 20)}</span>`
          },
          width: 200
        },
        {
          headerName: $translate.instant("group.gridHeader.DOMAIN"),
          field: "domain"
        },
        {
          headerName: $translate.instant("containers.detail.STATE"),
          field: "state",
          cellRenderer: function(params) {
            let displayState = getDisplayName(params.value);
            if (params.value === "disconnected")
              return `<span class="label label-warning">${$sanitize(
                displayState
              )}</span>`;
            else if (
              params.value === "discover" ||
              params.value === "protect" ||
              params.value === "monitor"
            )
              return `<span class="label ${params.value}">${$sanitize(
                displayState
              )}</span>`;
            else if (params.value === "unmanaged")
              return `<span class="label label-danger">${$sanitize(
                displayState
              )}</span>`;
            else if (params.value === "quarantined")
              return `<span class="label label-pink">${$sanitize(
                displayState
              )}</span>`;
            else
              return `<span class="label label-inverse">${$sanitize(
                displayState
              )}</span>`;
          },
          width: 70
        },
        {
          headerName: $translate.instant("group.gridHeader.VULNERABILITIES"),
          field: "scan_summary",
          cellRenderer: function(params) {
            let display = "";
            if (params.value && params.value.high)
              display += `<span class="label label-danger mr-sm">${
                params.value.high
              }</span>`;
            if (params.value && params.value.medium)
              display += `<span class="label label-warning">${
                params.value.medium
              }</span>`;
            return $sanitize(display);
          },
          width: 120,
          maxWidth: 130
        }
      ];

      let columnDefs4NodesMembers = [
        {
          headerName: $translate.instant("group.gridHeader.NAME"),
          field: "display_name",
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: { innerRenderer: innerCellRenderer }
        },
        {
          headerName: "Id",
          field: "id",
          cellRenderer: params => {
            if (params.value)
              return `<span uib-tooltip="'${params.value}'">${Utils.shortenString(params.value, 20)}</span>`
          },
          width: 200
        },
        {
          headerName: $translate.instant("containers.detail.STATE"),
          field: "state",
          cellRenderer: function(params) {
            if (params.value)
              return '<span><em class="fa fa-circle text-warning"></em> </span>';
            else
              return '<span><em class="fa fa-circle text-success"></em> </span>';
          },
          cellClass: "grid-center-align",
          headerClass: "grid-center-header",
          width: 70,
          maxWidth: 80
        },
        {
          headerName: $translate.instant("group.gridHeader.VULNERABILITIES"),
          field: "scan_summary",
          cellRenderer: function(params) {
            let display = "";
            if (params.value && params.value.high)
              display += `<span class="label label-danger mr-sm">${
                params.value.high
              }</span>`;
            if (params.value && params.value.medium)
              display += `<span class="label label-warning">${
                params.value.medium
              }</span>`;
            return $sanitize(display);
          },
          width: 120,
          maxWidth: 130
        }
      ];

      $scope.memberGridOptions = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs4Members,
        rowData: null,
        getNodeChildDetails: getWorkloadChildDetails,
        animateRows: true,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 2000);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
        overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
          "group.NO_MEMBERS"
        )}</span>`
      };

      function getWorkloadChildDetails(rowItem) {
        if (rowItem.children && rowItem.children.length > 0) {
          return {
            group: true,
            children: rowItem.children,
            expanded: rowItem.children.length > 0
          };
        } else {
          return null;
        }
      }

      const renderGroups = function(data, options) {
        $scope.eof = data.length < PAGE_SIZE;
        $scope.groups = $scope.groups.concat(data);
        $scope.groups = $scope.groups.map(group => {
          group.scorable = !group.not_scored;
          return Object.assign({checked: false}, group);
        });
        if ($scope.hideSystemGroup) {
          $scope.groups = $scope.groups.filter(function(item) {
            return !item.platform_role;
          });
        }
        setRowData4Group($scope.groups);
        $("#all-groups").prop("checked", false);
        $("#all-groups").removeClass("partial-checked");
        $scope.hasGroups = $scope.groups.length > 0;
        setTimeout(function() {
          $scope.gridGroup.api.sizeColumnsToFit();
          if (firstCheckedGroupName) {
            let fisrtCheckedGroupRowId = $scope.groups.findIndex(group => group.name === firstCheckedGroupName);
            let firstCheckedGroupNode = $scope.gridGroup.api.getRowNode(fisrtCheckedGroupRowId);
            firstCheckedGroupNode.setSelected(true);
            $scope.gridGroup.api.ensureNodeVisible(firstCheckedGroupNode);
            firstCheckedGroupName = "";
          } else {
            console.log("single selection")
            if ($scope.eof || $scope.groups.length <= PAGE_SIZE) {
              $scope.gridGroup.api.forEachNode(function(node, index) {
                if (groupName && groupName !== "null") {
                  if (node.data.name === groupName) {
                    node.setSelected(true);
                    $scope.gridGroup.api.ensureNodeVisible(node, "middle");
                    if (pageFrom === "process") {
                      $timeout(() => {
                        $scope.selectedIndex = TAB_NAME.PROFILE;
                        $scope.getProcessProfile($scope.group.name);
                      }, 200);
                    }
                  }
                } else {
                  if ($scope.group) {
                    if (node.data.name === $scope.group.name) {
                      node.setSelected(true);
                      $scope.gridGroup.api.ensureNodeVisible(node);
                    }
                  } else if (index === 0) {
                    node.setSelected(true);
                    $scope.gridGroup.api.ensureNodeVisible(node);
                  }
                }
              });
            }
          }
        }, 50);
        $scope.count = `${$scope.groups.length} ${getEntityName(
          $scope.groups.length
        )}`;
        $scope.onFilterChanged(filter);
      };

      const handleError = function(err) {
        console.warn(err);
        $scope.hasGroups = false;
        $scope.groups = [];
        $scope.groupErr = true;
        $scope.gridGroup.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
        setRowData4Group($scope.groups);
        $("#all-groups").prop("checked", false);
      };

      $scope.refresh = function() {
        $scope.onFormatError = false;
        $scope.groupErr = false;
        $scope.eof = false;
        $scope.groups = [];
        $scope.selectedCount = 0;
        Utils.loadPagedData(
          GROUP_URL,
          {
            start: 0,
            limit: PAGE_SIZE,
            with_cap: true
          },
          null,
          renderGroups,
          handleError
        );
      };

      $scope.refresh();

      function onSelectionChanged4Group() {
        console.log("change")
        $scope.hasSelectedGroups = true;
        $scope.displayedMultiGroup = [];
        $scope.selectedRows4Profile = [];

        let selectedRows = $scope.gridGroup.api.getSelectedRows();
        if (selectedRows.length > 0) {
          setTimeout(function() {
            $scope.group = angular.copy(selectedRows[0]);
            console.log($scope.group);
            console.log("$scope.isNamespaceUser", $scope.isNamespaceUser, "$scope.group.kind", $scope.group.kind);
            $scope.isAddressGroupAndNamespaceUser = $scope.isNamespaceUser && $scope.group.kind.toLowerCase() === GROUP_KIND.ADDRESS;
            $scope.isRemovableGroup = verifyRemovable($scope.group);
            $scope.isReadonlyRule =
              $scope.group.cfg_type === CFG_TYPE.GROUND ||
              $scope.group.cfg_type === CFG_TYPE.FED ||
              $scope.group.cfg_type === CFG_TYPE.LEARNED;

            $scope.isGroupRuleAddable =
              $scope.group.cfg_type !== CFG_TYPE.FED &&
              $scope.group.cfg_type !== CFG_TYPE.GROUND;
            $scope.memberGridOptions.api.setColumnDefs($scope.group.kind === GROUP_KIND.NODE ? columnDefs4NodesMembers : columnDefs4Members);
            $scope.memberGridOptions.api.setRowData($scope.group.members);
            $scope.memberGridOptions.api.sizeColumnsToFit();
            $scope.$apply();
            keepTab();
          }, 50);
        } else {
          console.log("no row selected");
          $scope.hasSelectedGroups = false;
          isCheckAll = false;
          setTimeout(function() {
            $scope.$apply();
          }, 50);
        }
      }

      function getSelectedTab(tabName) {
        $scope.selectedTab = tabName;
      }

      function keepTab() {
        console.log("keep tab")
        let tabsId = $("#group-tabs md-tab")
          .toArray()
          .map(tab => {
            return tab.id;
          });
        let currIndex = tabsId.indexOf($scope.selectedTab.toString());
        if (currIndex === -1) {
          $scope.selectedIndex = 0;
          $scope.onPredefinedFilterView = false;
        } else {
          $scope.selectedIndex = currIndex;
          switch ($scope.selectedTab) {
            case TAB_NAME.MEMBER:
              $scope.onMember();
              break;
            case TAB_NAME.PROFILE:
              $scope.getProcessProfile($scope.group.name);
              break;
            case TAB_NAME.FILE:
              $scope.getFileProfile($scope.group.name);
              break;
            case TAB_NAME.NETWORK:
              $scope.getServiceRules($scope.group.name);
              break;
            case TAB_NAME.RESPONSE:
              $scope.getServiceResponseRules($scope.group.name);
              break;
            case TAB_NAME.DLP:
              $scope.getDLPSensors($scope.group.name);
              break;
            case TAB_NAME.WAF:
              $scope.getWAFSensors($scope.group.name);
              break;
            case TAB_NAME.SCRIPT:
              $scope.getCustomCheck($scope.group.name);
              break;
          }
        }
      }

      $scope.openSwitchModeDialog = function() {
        let success = function () {
          $mdDialog
            .show({
              controller: DialogController4SwitchMode,
              templateUrl: "dialog.switchMode.html",
              locals: {
                refresh: $scope.refresh,
                callback: $scope.switchServiceMode,
                counts: getModeCounts()
              }
            })
            .then(
              function() {},
              function() {}
            );
        };

        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.openImportDialog = function() {
        let success = function() {
          $mdDialog
            .show({
              controller: DialogController4ImportGroupPolicy,
              templateUrl: "dialog.importGroupPolicy.html",
              locals: {
                refresh: $scope.refresh
              }
            })
            .then(
              function() {
                $timeout(() => {
                  $scope.refresh();
                }, 3000);
              },
              function() {}
            );
        };

        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.addGroup = function() {
        let success = function() {
          $mdDialog
            .show({
              controller: DialogController4AddGroup,
              templateUrl: "dialog.addGroup.html"
            })
            .then(
              function() {
                $timeout(() => {
                  $scope.refresh();
                }, 3000);
              },
              function() {}
            );
        };

        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.editGroup = function(event, group, isEditable) {
        let success = function() {
          $mdDialog
            .show({
              controller: DialogController4EditGroup,
              templateUrl: "dialog.editGroup.html",
              locals: {
                selectedGroup: group,
                isWriteGroupAuthorized: $scope.isWriteGroupAuthorized,
                isEditable: isEditable
              }
            })
            .then(
              function() {
                $timeout(() => {
                  $scope.refresh();
                }, 3000);
              },
              function() {}
            );
        };

        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.reset = function() {
        $scope.eof = false;
        $scope.groupErr = false;
        $scope.groupForm.$setPristine();
        $scope.groupForm.$setUntouched();
        $scope.refresh();
      };

      $scope.remove = function(group) {
        let confirmBox =
          $translate.instant("group.REMOVE_CONFIRM") +
          " - " +
          $sanitize(group.name);
        if (group.policy_rules.length > 0 || group.response_rules.length > 0) {
          confirmBox += `<br/>${$translate.instant("group.HAS_RULES_WARNING")}`;
        }
        Alertify.confirm(confirmBox).then(
          function toOK() {
            $http
              .delete(GROUP_URL, { params: { name: group.name } })
              .then(function() {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success($translate.instant("group.REMOVE_OK_MSG"));
                $timeout(function() {
                  $scope.group = null;
                  $scope.refresh();
                }, 3000);
              })
              .catch(function(e) {
                if (USER_TIMEOUT.indexOf(e.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  console.log(e.data);
                  Alertify.error(
                    Utils.getAlertifyMsg(e, $translate.instant("group.REMOVE_ERR_MSG"), false)
                  );
                }
              });
          },
          function toCancel() {}
        );
      };

      function renderServiceRules(rules) {
        $timeout(function() {
          $scope.gridRules.api.setRowData(rules);
          $scope.gridRules.api.forEachNode(function(node, index) {
            if ($scope.rule) {
              if (node.data.id === $scope.rule.id) {
                node.setSelected(true);
                $scope.gridRules.api.ensureNodeVisible(node);
              }
            } else if (index === 0) {
              node.setSelected(true);
              $scope.gridRules.api.ensureNodeVisible(node);
            }
          });
          $scope.gridRules.api.sizeColumnsToFit();
        });
      }

      function destructConditions(rules) {
        rules.forEach(function(rule) {
          rule.conditions = responseRulesService.conditionObjToString(
            rule.conditions
          );
        });
        return rules;
      }

      function renderResponseRules(rules) {
        console.log("response rules")
        $timeout(function() {
          $scope.gridResponseRules.api.setRowData(destructConditions(rules));
          $scope.gridResponseRules.api.forEachNode(function(node, index) {
            if ($scope.responseRule) {
              if (node.data.id === $scope.responseRule.id) {
                node.setSelected(true);
                $scope.gridResponseRules.api.ensureNodeVisible(node);
              }
            } else if (index === 0) {
              node.setSelected(true);
              $scope.gridResponseRules.api.ensureNodeVisible(node);
            }
          });
          $scope.gridResponseRules.api.sizeColumnsToFit();
        });
      }

      $scope.onMember = function() {
        getSelectedTab(TAB_NAME.MEMBER);
        onTabChanged();
        // $scope.$apply();
      };

      $scope.selectNetworkRules =function(groupName) {
        let tabsId = $("#group-tabs md-tab")
          .toArray()
          .map(tab => {
            return tab.id;
          });
        let currIndex = tabsId.indexOf(TAB_NAME.NETWORK.toString());
        console.log("currIndex: ", currIndex);
        $scope.selectedIndex = currIndex;
        $scope.getServiceRules(groupName);
      };

      $scope.getServiceRules = function(groupName) {
        getSelectedTab(TAB_NAME.NETWORK);
        onTabChanged();
        $scope.gridRules.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`;
        if (groupName === "") {
          $scope.gridRules.api.setRowData([]);
        } else {
          $http
            .get(GROUP_URL, { params: { name: groupName } })
            .then(function(response) {
              $scope.group = response.data.group;
              renderServiceRules($scope.group.policy_rules);
            })
            .catch(function(err) {
              console.warn(err);
              if (err.status !== 404) {
                $scope.gridRules.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
              }
              $scope.gridRules.api.setRowData();
            });
        }
      };

      $scope.selectResponseRules =function(groupName) {
        let tabsId = $("#group-tabs md-tab")
          .toArray()
          .map(tab => {
            return tab.id;
          });
        let currIndex = tabsId.indexOf(TAB_NAME.RESPONSE.toString());
        console.log("currIndex: ", currIndex);
        $scope.selectedIndex = currIndex;
        $scope.getServiceResponseRules(groupName);
      };

      $scope.getServiceResponseRules = function(groupName) {
        getSelectedTab(TAB_NAME.RESPONSE);
        onTabChanged();
        $scope.gridResponseRules.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`;
        if (groupName === "") {
          $scope.gridResponseRules.api.setRowData([]);
        } else {
          $http
            .get(GROUP_URL, { params: { name: groupName } })
            .then(function(response) {
              $scope.group = response.data.group;
              renderResponseRules($scope.group.response_rules);
            })
            .catch(function(err) {
              console.warn(err);
              if (err.status !== 404) {
                $scope.gridResponseRules.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
              }
              $scope.gridResponseRules.api.setRowData();
            });
        }
      };

      $scope.getProcessProfile = function(groupName) {
        getSelectedTab(TAB_NAME.PROFILE);
        onTabChanged();
        if ($scope.gridProfile.api) {
          $scope.gridProfile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          $scope.gridProfile.api.setRowData([]);
          if (groupName !== "") {
            $http
              .get(PROCESS_PROFILE_URL, {
                params: { name: groupName }
              })
              .then(function(response) {
                $scope.profile = response.data.process_profile.process_list;
                $scope.gridProfile.api.setColumnDefs(profileColumnDefs);
                $scope.gridProfile.api.setRowData($scope.profile);
                $scope.isProcessProfileRuleEditable = false;
                $timeout(function() {
                  if ($scope.gridProfile.api) {
                    $scope.gridProfile.api.sizeColumnsToFit();
                  }
                }, 200);
              })
              .catch(function(err) {
                console.warn(err);
                if (err.status !== 404) {
                  $scope.gridProfile.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
                }
                $scope.gridProfile.api.setRowData();
              });
          }
        }
      };

      $scope.getFileProfile = function(groupName) {
        getSelectedTab(TAB_NAME.FILE);
        onTabChanged();
        if ($scope.gridFile.api) {
          $scope.gridFile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          $scope.gridFile.api.setRowData([]);
          if (groupName !== "") {
            $http
              .get(FILE_PROFILE_URL, {
                params: { name: groupName }
              })
              .then(function(response) {
                $scope.fileProfile = response.data.profile.filters.map(function(
                  element
                ) {
                  if (element.applications && element.applications.length > 0) {
                    element.apps = element.applications.map(function(item) {
                      return { name: item };
                    });
                  } else {
                    element.apps = element.applications;
                  }
                  return element;
                });
                $scope.gridFile.api.setRowData($scope.fileProfile);
                $timeout(function() {
                  if ($scope.gridFile.api) {
                    if ($scope.gridFile.api.getDisplayedRowCount() > 0) {
                      $scope.gridFile.api.getRowNode(0).setSelected(true);
                    }
                    $scope.gridFile.api.forEachNode(function(node, index) {
                      if ($scope.fileEntry) {
                        if (node.data.filter === $scope.fileEntry.filter) {
                          node.setSelected(true);
                          $scope.gridFile.api.ensureNodeVisible(node);
                        }
                      } else if (index === 0) {
                        node.setSelected(true);
                        $scope.gridFile.api.ensureNodeVisible(node);
                      }
                    });
                    $scope.gridFile.api.sizeColumnsToFit();
                  }
                });
              })
              .catch(function(err) {
                console.warn(err);
                if (err.status !== 404) {
                  $scope.gridFile.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
                }
                $scope.gridFile.api.setRowData();
              });
          }
        }
      };

      $scope.getDLPSensors = function(groupName, toggledStatus) {
        getSelectedTab(TAB_NAME.DLP);
        onTabChanged();
        if ($scope.gridDLP.api) {
          $scope.gridDLP.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          $scope.gridDLP.api.setRowData([]);
          if (groupName !== "") {
            $http
              .get(DLP_GROUPS_URL, {
                params: { name: groupName }
              })
              .then(function(response) {
                $scope.dlpSesors = response.data.dlp_group.sensors;
                if (typeof toggledStatus !== "undefined") {
                  console.log("toggledStatus", toggledStatus);
                  $scope.dlpGroup = {
                    name: response.data.dlp_group.name,
                    sensors: response.data.dlp_group.sensors,
                    status: toggledStatus
                  }
                } else {
                  $scope.dlpGroup = response.data.dlp_group;
                }
                $timeout(function() {
                  if ($scope.gridDLP.api) {
                    if ($scope.dlpSesors.length === 0) {
                      if (response.data.dlp_group.status) {
                        $scope.gridDLP.overlayNoRowsTemplate =
                          `<div class="server-error">
                            <div>
                              <em class="fa fa-warning warning-signal" aria-hidden="true"></em>
                            </div>
                            <div>
                              <div>${$translate.instant("group.dlp.msg.ADD_DLP_WARNING")}</div>
                            </div>
                          </div>`
                      } else {
                        $scope.gridDLP.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                          "general.NO_ROWS"
                        )}</span>`
                      }
                    }
                    $scope.gridDLP.api.setRowData($scope.dlpSesors);
                    $scope.gridDLP.api.forEachNode(function(node, index) {
                      if ($scope.dlpEntry) {
                        if (node.data.filter === $scope.dlpEntry.filter) {
                          node.setSelected(true);
                          $scope.gridDLP.api.ensureNodeVisible(node);
                        }
                      } else if (index === 0) {
                        node.setSelected(true);
                        $scope.gridDLP.api.ensureNodeVisible(node);
                      }
                    });
                    $scope.gridDLP.api.sizeColumnsToFit();
                  }
                });
              })
              .catch(function(err) {
                console.warn(err);
                if (err.status !== 404) {
                  $scope.gridDLP.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
                }
                $scope.gridDLP.api.setRowData();
              });
          }
        }
      };

      $scope.getWAFSensors = function(groupName, toggledStatus) {
        getSelectedTab(TAB_NAME.WAF);
        onTabChanged();
        if ($scope.gridWAF.api) {
          $scope.gridWAF.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          $scope.gridWAF.api.setRowData([]);
          if (groupName !== "") {
            $http
              .get(WAF_GROUPS_URL, {
                params: { name: groupName }
              })
              .then(function(response) {
                $scope.wafSesors = response.data.waf_group.sensors;
                if (typeof toggledStatus !== "undefined") {
                  console.log("toggledStatus", toggledStatus);
                  $scope.wafGroup = {
                    name: response.data.waf_group.name,
                    sensors: response.data.waf_group.sensors,
                    status: toggledStatus
                  }
                } else {
                  $scope.wafGroup = response.data.waf_group;
                }
                $timeout(function() {
                  if ($scope.gridWAF.api) {
                    if ($scope.wafSesors.length === 0) {
                      if (response.data.waf_group.status) {
                        $scope.gridWAF.overlayNoRowsTemplate =
                          `<div class="server-error">
                            <div>
                              <em class="fa fa-warning warning-signal" aria-hidden="true"></em>
                            </div>
                            <div>
                              <div>${$translate.instant("group.waf.msg.ADD_WAF_WARNING")}</div>
                            </div>
                          </div>`
                      } else {
                        $scope.gridWAF.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                          "general.NO_ROWS"
                        )}</span>`
                      }
                    }
                    $scope.gridWAF.api.setRowData($scope.wafSesors);
                    $scope.gridWAF.api.forEachNode(function(node, index) {
                      if ($scope.wafEntry) {
                        if (node.data.filter === $scope.wafEntry.filter) {
                          node.setSelected(true);
                          $scope.gridWAF.api.ensureNodeVisible(node);
                        }
                      } else if (index === 0) {
                        node.setSelected(true);
                        $scope.gridWAF.api.ensureNodeVisible(node);
                      }
                    });
                    $scope.gridWAF.api.sizeColumnsToFit();
                  }
                });
              })
              .catch(function(err) {
                console.warn(err);
                if (err.status !== 404) {
                  $scope.gridWAF.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
                }
                $scope.gridWAF.api.setRowData();
              });
          }
        }
      };

      $scope.getCustomCheck = function(groupName) {
        getSelectedTab(TAB_NAME.SCRIPT);
        onTabChanged();
        if ($scope.gridScript.api) {
          $scope.gridScript.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          $scope.gridScript.api.setRowData([]);
          if (groupName !== "") {
            $http
              .get(GROUP_SCRIPT_URL, {
                params: { name: groupName }
              })
              .then(function(response) {
                $scope.scripts = response.data.config.scripts;
                $timeout(function() {
                  if ($scope.gridScript.api) {
                    $scope.gridScript.api.setRowData($scope.scripts);
                    $scope.gridScript.api.forEachNode(function(node, index) {
                      if (vm.scriptEntry) {
                        if (node.data.filter === vm.scriptEntry.filter) {
                          node.setSelected(true);
                          $scope.gridScript.api.ensureNodeVisible(node);
                        }
                      } else if (index === 0) {
                        node.setSelected(true);
                        $scope.gridScript.api.ensureNodeVisible(node);
                      }
                    });
                    $scope.gridScript.api.sizeColumnsToFit();
                  }
                });
              })
              .catch(function(err) {
                console.warn(err);
                if (err.status !== 404 && err.status !== 403) {
                  $scope.gridScript.overlayNoRowsTemplate = Utils.getOverlayLoadingTemplate(err);
                }
                $scope.gridScript.api.setRowData();
              });
          }
        }
      };

      function dateComparator(value1, value2, node1, node2) {
        /** @namespace node1.data.last_modified_timestamp */
        return (
          node1.data.last_modified_timestamp -
          node2.data.last_modified_timestamp
        );
      }

      ////// Service-rules grid
      let ruleColumnDefs = [
        {
          headerName: $translate.instant("policy.addPolicy.POLICY_ID"),
          field: "id",
          width: 70,
          maxWidth: 80,
          cellRenderer: function(params) {
            if (params.data) {
              return (
                '<div ng-class="{\'policy-remove\': data.remove}" uib-tooltip="' +
                $sanitize(params.data.comment) +
                '">' +
                $sanitize(params.value) +
                "</div>"
              );
            }
          }
        },
        {
          headerName: $translate.instant("policy.addPolicy.FROM"),
          field: "from"
        },
        {
          headerName: $translate.instant("policy.addPolicy.TO"),
          field: "to"
        },
        {
          headerName: $translate.instant("policy.addPolicy.APP"),
          field: "applications"
        },
        {
          headerName: $translate.instant("policy.addPolicy.PORT"),
          field: "ports"
        },
        {
          headerName: $translate.instant("policy.addPolicy.DENY_ALLOW"),
          field: "action",
          cellRenderer: function(params) {
            if (params.value) {
              let mode = Utils.getI18Name(params.value);
              let labelCode = colourMap[params.value];
              if (!labelCode) labelCode = "info";
              return `<span class="label label-fs label-${labelCode}">${$sanitize(
                mode
              )}</span>`;
            } else return null;
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("policy.gridHeader.TYPE"),
          field: "cfg_type",
          cellRenderer: typeRenderFunc,
          cellClass: "grid-center-align",
          width: 90,
          minWidth: 90,
          maxWidth: 90
        },
        {
          headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
          field: "last_modified_timestamp",
          cellRenderer: function(params) {
            if (params.value) {
              return $sanitize(
                $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss")
              );
            }
          },
          comparator: dateComparator,
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
          },
          width: 160,
          maxWidth: 180,
          minWidth: 160
        }
      ];

      function typeRenderFunc(params) {
        if (params && params.value) {
          let type = params.data.disable
            ? colourMap["disabled-rule"]
            : colourMap[params.value.toUpperCase()];
          return `<div class="action-label nv-label ${type}">${$sanitize(
            $translate.instant(`group.${params.value.toUpperCase()}`)
          )}</div>`;
        }
      }

      let responseRuleColumnDefs = [
        {
          headerName: $translate.instant("responsePolicy.gridHeader.ID"),
          field: "id",
          width: 60,
          minWidth: 60,
          maxWidth: 60
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.TYPE"),
          field: "event",
          cellRenderer: eventRenderFunc,
          width: 105,
          minWidth: 105,
          maxWidth: 105
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.GROUP"),
          field: "group",
          cellRenderer: function(params) {
            if (params.value) {
              return `<div style="word-wrap: break-word;">${$sanitize(
                params.value
              )}</div>`;
            }
          },
          cellClass: ["wrap-word-in-cell"],
          width: 200
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.CRITERIA"),
          field: "conditions",
          cellRenderer: function(params) {
            if (params.value) {
              return `<div style="word-wrap: break-word;">${$sanitize(
                params.value
              )}</div>`;
            }
          },
          cellClass: ["wrap-word-in-cell"],
          width: 430
        },
        {
          headerName: $translate.instant("policy.gridHeader.TYPE"),
          field: "cfg_type",
          cellRenderer: typeRenderFunc,
          cellClass: "grid-center-align",
          width: 90,
          minWidth: 90,
          maxWidth: 90
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.ACTION"),
          field: "actions",
          cellRenderer: actionRenderFunc,
          width: 220,
          minWidth: 220
        }
      ];

      function eventRenderFunc(params) {
        return (
          '<div class="type-label type-label-lg ' +
          (params.data.disable
            ? colourMap["disabled_background"]
            : colourMap[params.data.event.toLowerCase()]) +
          '">' +
          $sanitize(
            $translate.instant(
              "responsePolicy.categories." + params.data.event.toUpperCase()
            )
          ) +
          "</div>"
        );
      }
      function actionRenderFunc(params) {
        let actions = "";
        params.data.actions.forEach(action => {
          actions +=
            '<div style="display: table; margin: 2px 2px; float: left"><div class="resp-rule-action-label ' +
            (params.data.disable
              ? colourMap["disabled_color"]
              : colourMap[action.toLowerCase()]) +
            '">' +
            $sanitize(
              $translate.instant(
                "responsePolicy.actions." + action.toUpperCase()
              )
            ) +
            "</div></div>";
        });
        return actions;
      }

      let profileColumnDefs = [
        {
          headerName: $translate.instant("service.gridHeader.NAME"),
          headerCheckboxSelection: function(params) {
            return $scope.isWriteGroupAuthorized && $scope.isGroupRuleAddable;
          },
          headerCheckboxSelectionFilteredOnly: true,
          checkboxSelection: function(params) {
            return $scope.isWriteGroupAuthorized && $scope.isGroupRuleAddable;
          },
          field: "name",
          cellRenderer: function(params) {
            if (params && params.data) {
              return params.data.cfg_type === CFG_TYPE.CUSTOMER || params.data.cfg_type === CFG_TYPE.LEARNED || !$scope.isGroupRuleAddable ?
                $sanitize(params.value) :
                `<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${$sanitize(
                  params.value
                )}</span>`
            }
          }
        },
        {
          headerName: $translate.instant("service.gridHeader.PATH"),
          field: "path"
        },
        {
          headerName: $translate.instant("policy.addPolicy.DENY_ALLOW"),
          field: "action",
          cellRenderer: function(params) {
            if (params.value) {
              let mode = Utils.getI18Name(params.value);
              let labelCode = colourMap[params.value];
              if (!labelCode) labelCode = "info";
              return `<span class="label label-fs label-${labelCode}">${$sanitize(
                mode
              )}</span>`;
            } else return null;
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("policy.gridHeader.TYPE"),
          field: "cfg_type",
          cellRenderer: profileTypeRenderFunc,
          cellClass: "grid-center-align",
          width: 90,
          minWidth: 90,
          maxWidth: 90
        },
        {
          headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
          field: "last_modified_timestamp",
          cellRenderer: function(params) {
            if (params.value) {
              return $sanitize(
                $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss")
              );
            }
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
          },
          comparator: dateComparator,
          width: 160,
          maxWidth: 180,
          minWidth: 160
        }
      ];

      function profileTypeRenderFunc(params) {
        if (params && params.value) {
          let typeClass =
            params.value === CFG_TYPE.GROUND || params.value === CFG_TYPE.FED
              ? colourMap[params.value.toUpperCase()]
              : "local-rule";

          let typeName =
            params.value === CFG_TYPE.GROUND || params.value === CFG_TYPE.FED
              ? $translate.instant(`group.${params.value.toUpperCase()}`)
              : $translate.instant("group.LOCAL");
          return `<div class="action-label nv-label ${typeClass}">${$sanitize(
            typeName
          )}</div>`;
        }
      }

      const filterPrefix = [
        {
          headerName: $translate.instant("service.gridHeader.FILTER"),
          field: "filter",
          width: 120,
          minWidth: 100
        },
        {
          headerName: $translate.instant("service.gridHeader.RECURSIVE"),
          field: "recursive",
          width: 100,
          maxWidth: 100,
          minWidth: 100
        }
      ];

      const typeColumn = {
        headerName: $translate.instant("policy.gridHeader.TYPE"),
        field: "cfg_type",
        cellRenderer: profileTypeRenderFunc,
        cellClass: "grid-center-align",
        width: 90,
        minWidth: 90,
        maxWidth: 90
      };

      const actionColumn = {
        headerName: $translate.instant("policy.addPolicy.DENY_ALLOW"),
        field: "behavior",
        cellRenderer: function(params) {
          if (params.value) {
            let mode = Utils.getI18Name(params.value);
            let labelCode = colourMap[params.value];
            if (!labelCode) labelCode = "info";
            return `<span class="label label-fs label-${labelCode}">${$sanitize(
              mode
            )}</span>`;
          } else return null;
        },
        width: 140,
        maxWidth: 150,
        minWidth: 140
      };
      const timeColumn = {
        headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
        field: "last_modified_timestamp",
        cellRenderer: function(params) {
          if (params.value) {
            return $sanitize(
              $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss")
            );
          }
        },
        icons: {
          sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
          sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
        },
        comparator: dateComparator,
        width: 160,
        maxWidth: 180,
        minWidth: 160
      };
      const applicationColumn = {
        headerName: $translate.instant("service.gridHeader.APPLICATIONS"),
        field: "applications",
        cellRenderer: function(params) {
          if (params.value) {
            return $sanitize(params.value.join(", "));
          }
        },
        width: 220,
        minWidth: 200
      };
      const fileColumnDefs = [
        ...filterPrefix,
        applicationColumn,
        actionColumn,
        typeColumn,
        timeColumn
      ];
      const predefinedFilterColumns = [...filterPrefix, actionColumn];

      let dlpColumnDefs = [
        {
          headerName: $translate.instant("group.dlp.gridHeader.NAME"),
          field: "name",
          width: 120,
          minWidth: 100
        },
        {
          headerName: $translate.instant("group.dlp.gridHeader.COMMENT"),
          field: "comment"
        },
        {
            headerName: $translate.instant("admissionControl.TYPE"),
            field: "cfg_type",
            cellRenderer: (params) => {
              if (params) {
                if (params.data && params.data.predefine) {
                  return `<div class="action-label nv-label success">${$sanitize(
                    $translate.instant("group.PREDEFINED")
                  )}</div>`;
                }
                let cfgType = params.value ? params.value.toUpperCase() : CFG_TYPE.CUSTOMER.toUpperCase();
                let type = colourMap[cfgType];
                return `<div class="action-label nv-label ${type}">${$sanitize(
                  $translate.instant(`group.${cfgType}`)
                )}</div>`;
              }
            },
            width: 90,
            minWidth: 90,
            maxWidth: 90
        },
        {
          headerName: $translate.instant("group.dlp.gridHeader.ACTION"),
          field: "action",
          cellRenderer: function(params) {
            if (params.value) {
              let mode = Utils.getI18Name(
                params.value === "allow" ? "alert" : params.value
              );
              let labelCode =
                colourMap[params.value === "allow" ? "alert" : params.value];
              if (!labelCode) labelCode = "info";
              if (params.data) {
                if (params.data.exist) {
                  return `<span class="label label-fs label-${labelCode}">${$sanitize(
                    mode
                  )}</span>`;
                } else {
                  return `<span class="label label-fs disabled-action">${$sanitize(
                    mode
                  )}</span>`;
                }
              }
            } else return null;
          },
          width: 90,
          minWidth: 90,
          maxWidth: 90
        }
      ];

      let wafColumnDefs = [
        {
          headerName: $translate.instant("group.waf.gridHeader.NAME"),
          field: "name",
          width: 120,
          minWidth: 100
        },
        {
          headerName: $translate.instant("group.waf.gridHeader.COMMENT"),
          field: "comment"
        },
        {
            headerName: $translate.instant("admissionControl.TYPE"),
            field: "cfg_type",
            cellRenderer: (params) => {
              if (params) {
                let cfgType = params.value ? params.value.toUpperCase() : CFG_TYPE.CUSTOMER.toUpperCase();
                let type = colourMap[cfgType];
                return `<div class="action-label nv-label ${type}">${$sanitize(
                  $translate.instant(`group.${cfgType}`)
                )}</div>`;
              }
            },
            width: 90,
            minWidth: 90,
            maxWidth: 90
        },
        {
          headerName: $translate.instant("group.waf.gridHeader.ACTION"),
          field: "action",
          cellRenderer: function(params) {
            if (params.value) {
              let mode = Utils.getI18Name(
                params.value === "allow" ? "alert" : params.value
              );
              let labelCode =
                colourMap[params.value === "allow" ? "alert" : params.value];
              if (!labelCode) labelCode = "info";

              if (params.data) {
                if (params.data.exist) {
                  return `<span class="label label-fs label-${labelCode}">${$sanitize(
                    mode
                  )}</span>`;
                } else {
                  return `<span class="label label-fs disabled-action">${$sanitize(
                    mode
                  )}</span>`;
                }
              }
            } else return null;
          },
          width: 90,
          minWidth: 90,
          maxWidth: 90
        }
      ];

      let scriptColumnDefs = [
        {
          headerName: $translate.instant("group.script.NAME"),
          field: "name",
          width: 90,
          minWidth: 80
        },
        {
          headerName: $translate.instant("group.script.SCRIPT"),
          field: "script"
        },
        {
          headerName: "",
          cellRenderer: function(params) {
            return (
              "<div>" +
              '       <em ng-if="writeMode===WRITE_MODE.UPDATE" class="fa fa-trash fa-lg mr-sm text-action" id="remove-form-action"' +
              '         ng-click="removeScript(data)">' +
              "       </em>" +
              "     </div>"
            );
          },
          width: 30,
          minWidth: 30,
          maxWidth: 30
        }
      ];

      function onSelectionChanged4Rule() {
        if ($scope.gridRules && $scope.gridRules.api) {
          let selectedRows = $scope.gridRules.api.getSelectedRows();
          if (selectedRows.length > 0) {
            $timeout(function() {
              $scope.rule = selectedRows[0];
              $scope.rule.allowed = $scope.rule.action === "allow";
              $scope.ruleReady = true;
            });
          }
        }
      }

      function onSelectionChanged4ResponseRule() {
        if ($scope.gridResponseRules && $scope.gridResponseRules.api) {
          let selectedRows = $scope.gridResponseRules.api.getSelectedRows();
          if (selectedRows.length > 0) {
            $timeout(function() {
              $scope.responseRule = selectedRows[0];
              $scope.responseRule.allowed = $scope.responseRule.action === "allow";
              $scope.responseRuleReady = true;
            });
          }
        }
      }

      function onSelectionChanged4Profile() {
        if ($scope.gridProfile && $scope.gridProfile.api) {
          $scope.selectedRows4Profile = $scope.gridProfile.api.getSelectedRows();
          if ($scope.selectedRows4Profile.length > 0) {
            $timeout(function() {
              $scope.profileEntry = $scope.selectedRows4Profile[0];
              $scope.isProcessProfileRuleEditable =
                $scope.isGroupRuleAddable &&
                $scope.profileEntry.cfg_type !== CFG_TYPE.FED &&
                $scope.profileEntry.cfg_type !== CFG_TYPE.GROUND
            });
          }
        }
        $scope.$apply();
      }

      function onSelectionChanged4File() {
        if ($scope.gridFile && $scope.gridFile.api) {
          let selectedRows = $scope.gridFile.api.getSelectedRows();
          if (selectedRows.length > 0) {
            $timeout(function() {
              $scope.fileEntry = selectedRows[0];
              $scope.isFileAccessRuleEditable =
                $scope.isGroupRuleAddable &&
                $scope.fileEntry.cfg_type !== CFG_TYPE.FED &&
                $scope.fileEntry.cfg_type !== CFG_TYPE.GROUND;
            });
          }
        }
      }

      function onSelectionChanged4DLP() {
        if ($scope.gridDLP && $scope.gridDLP.api) {
          let selectedRows = $scope.gridDLP.api.getSelectedRows();
          if (selectedRows.length > 0) {
            $timeout(function() {
              $scope.dlpEntry = selectedRows[0];
            });
          }
        }
      }

      function onSelectionChanged4WAF() {
        if ($scope.gridWAF && $scope.gridWAF.api) {
          let selectedRows = $scope.gridWAF.api.getSelectedRows();
          if (selectedRows.length > 0) {
            $timeout(function() {
              $scope.wafEntry = selectedRows[0];
            });
          }
        }
      }

      function onTabChanged() {
        $scope.onPredefinedFilterView = false;
        clearFields();
      }

      function clearFields() {
        vm.scriptEntry = null;
        $scope.writeMode = $scope.WRITE_MODE.ADD;
      }

      $scope.prepareAdd = function() {
        clearFields();
        $scope.gridScript.api.deselectAll();
      };

      function onSelectionChanged4Script() {
        if ($scope.gridScript && $scope.gridScript.api) {
          let selectedRows = $scope.gridScript.api.getSelectedRows();
          if (selectedRows.length > 0) {
            $timeout(function() {
              vm.scriptEntry = angular.copy(selectedRows[0]);
              $scope.writeMode = $scope.WRITE_MODE.UPDATE;
              console.log(vm.scriptEntry);
            });
          }
        }
        $scope.$apply();
      }

      $scope.gridRules = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: false,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: ruleColumnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        onSelectionChanged: onSelectionChanged4Rule,
        onGridReady: function(params) {
          setTimeout(function() {
            params.api.sizeColumnsToFit();
          }, 0);
          $win.on(resizeEvent, function() {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
          });
        },
        overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`
      };

      $scope.gridResponseRules = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: false,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: responseRuleColumnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        onSelectionChanged: onSelectionChanged4ResponseRule,
        onGridReady: function(params) {
          setTimeout(function() {
            params.api.sizeColumnsToFit();
          }, 0);
          $win.on(resizeEvent, function() {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
          });
        },
        overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`
      };

      $scope.gridProfile = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: profileColumnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "multiple",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onSelectionChanged: onSelectionChanged4Profile,
        onGridReady: function(params) {
          setTimeout(function() {
            params.api.sizeColumnsToFit();
          }, 0);
          $win.on(resizeEvent, function() {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
          });
        },
        overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`,
        isRowSelectable: function(node) {
          return node.data
            ? node.data.cfg_type === CFG_TYPE.CUSTOMER || node.data.cfg_type === CFG_TYPE.LEARNED
            : false;
        },
      };

      $scope.gridFile = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: fileColumnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onSelectionChanged: onSelectionChanged4File,
        onGridReady: function(params) {
          setTimeout(function() {
            params.api.sizeColumnsToFit();
          }, 0);
          $win.on(resizeEvent, function() {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
          });
        },
        overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`
      };

      $scope.gridFilePre = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: predefinedFilterColumns,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onGridReady: function(params) {
          setTimeout(function() {
            params.api.sizeColumnsToFit();
          }, 0);
        },
        overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`
      };

      $scope.gridDLP = Utils.createGridOptions(dlpColumnDefs);
      $scope.gridDLP.rowClassRules = {
        "disabled-row": function(params) {
          if (params.data) {
            return !params.data.exist;
          } else {
            return false;
          }
        }
      };
      $scope.gridWAF = Utils.createGridOptions(wafColumnDefs);
      $scope.gridWAF.rowClassRules = {
        "disabled-row": function(params) {
          if (params.data) {
            return !params.data.exist;
          } else {
            return false;
          }
        }
      };

      $scope.gridScript = Utils.createGridOptions(scriptColumnDefs);
      $scope.gridScript.onSelectionChanged = onSelectionChanged4Script;

      $scope.showPredefinedFilters = function() {
        $scope.onPredefinedFilterView = true;

        function getPredefinedFileProfile(groupName) {
          $scope.gridFilePre.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          if (groupName === "") {
            $scope.gridFilePre.api.setRowData([]);
          } else {
            $http
              .get(FILE_PREDEFINED_PROFILE_URL, {
                params: { name: groupName }
              })
              .then(function(response) {
                $scope.predefinedFilters = response.data.profile.filters;
                $timeout(function() {
                  if ($scope.gridFilePre.api) {
                    $scope.gridFilePre.api.setRowData($scope.predefinedFilters);
                    $scope.gridFilePre.api.sizeColumnsToFit();
                  }
                });
              })
              .catch(function(err) {
                console.warn(err);
                if (err.status !== 404) {
                  $scope.gridFilePre.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
                }
                $scope.gridFilePre.api.setRowData();
              });
          }
        }

        setTimeout(function() {
          getPredefinedFileProfile($scope.group.name);
        }, 100);
      };

      $scope.addFilter = function(ev) {
        let success = function() {
          $mdDialog
            .show({
              locals: {
                group: $scope.group,
                fileAccessFilterSample: FILE_ACCESS_FILTER_SAMPLE
              },
              controller: FileDialogController,
              templateUrl: "filter.add.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getFileProfile($scope.group.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.editFilter = function(ev) {
        let success = function() {
          $mdDialog
            .show({
              locals: {
                rule: angular.copy($scope.fileEntry),
                group: $scope.group,
                fileAccessFilterSample: FILE_ACCESS_FILTER_SAMPLE
              },
              controller: FileEditDialogController,
              templateUrl: "filter.edit.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getFileProfile($scope.group.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.removeFilter = function(rule) {
        Alertify.confirm(PROFILE_DELETE_CONFIRMATION).then(
          function onOk() {
            $http
              .patch(FILE_PROFILE_URL, {
                group: $scope.group.name,
                fileMonitorConfigData: {
                  config: {
                    delete_filters: [rule]
                  }
                }
              })
              .then(function() {
                $scope.fileEntry = null;
                $timeout(function() {
                  $scope.getFileProfile($scope.group.name);
                }, 2000);
              })
              .catch(function(err) {
                console.warn(err);
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(err,  $translate.instant("service.PROFILE_DELETE_FAILED"), false)
                  );
                }
              });
          },
          function onCancel() {}
        );
      };

      $scope.removeProfile = function() {
        Alertify.confirm(PROFILE_DELETE_CONFIRMATION).then(
          function onOk() {
            $http
              .patch(PROCESS_PROFILE_URL, {
                process_profile_config: {
                  group: $scope.group.name,
                  process_delete_list: $scope.selectedRows4Profile
                }
              })
              .then(function() {
                $scope.profileEntry = null;
                $timeout(function() {
                  $scope.getProcessProfile($scope.group.name);
                }, 2000);
              })
              .catch(function(err) {
                console.warn(err);
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(err, $translate.instant("service.PROFILE_DELETE_FAILED"), false)
                  );
                }
              });
          },
          function onCancel() {}
        );
      };

      $scope.addProfile = function(ev) {
        let success = function() {
          $mdDialog
            .show({
              locals: {
                group: $scope.group.name,
                processProfileSample: PROCESS_PROFILE_SAMPLE
              },
              controller: DialogController,
              templateUrl: "profile.add.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getProcessProfile($scope.group.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.editProfile = function(ev) {
        let success = function() {
          $scope.profileEntry.allowed = !!(
            $scope.profileEntry && $scope.profileEntry.action === "allow"
          );
          $mdDialog
            .show({
              locals: {
                rule: angular.copy($scope.profileEntry),
                group: $scope.group.name,
                processProfileSample: PROCESS_PROFILE_SAMPLE
              },
              controller: EditDialogController,
              templateUrl: "profile.edit.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getProcessProfile($scope.group.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.editDLPSensor = function(warning = "") {
        let success = function() {
          $mdDialog
            .show({
              locals: {
                chosenSensors: $scope.dlpSesors,
                groupEntry: $scope.dlpGroup,
                warning: warning
              },
              controller: SelectDLPSensorDialogController,
              templateUrl: "dlp.setting.html"
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getDLPSensors($scope.group.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.editWAFSensor = function(warning = "") {
        let success = function() {
          $mdDialog
            .show({
              locals: {
                chosenSensors: $scope.wafSesors,
                groupEntry: $scope.wafGroup,
                warning: warning
              },
              controller: SelectWAFSensorDialogController,
              templateUrl: "waf.setting.html"
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getWAFSensors($scope.group.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.exportGroups = function(policyMode) {
        let selectedGroups = getCheckedRows().map(group => group.name);
        let payload = {
          groups: selectedGroups,
          policy_mode: policyMode? policyMode : ""
        };
        $http
          .post(GROUP_EXPORT_URL, payload)
          .then(response => {
            let fileName = response
              .headers("Content-Disposition")
              .split("=")[1]
              .trim()
              .split(".");
            let exportedFileName = `${fileName[0]}_${Utils.parseDatetimeStr(new Date())}.${fileName[1]}`;
            let blob = new Blob([response.data], {
              type: "text/plain;charset=utf-8"
            });
            FileSaver.saveAs(blob, exportedFileName);
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.success($translate.instant("group.dlp.msg.EXPORT_OK"));
          })
          .catch(err => {
            console.warn(err);
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("group.dlp.msg.EXPORT_NG"), false)
              );
            }
          });
      };

      $scope.toggleDLPGroupStatus = function(isEnabled) {
        let payload = {
          config: {
            name: $scope.group.name,
            status: isEnabled
          }
        };
        $http
          .patch(DLP_GROUPS_URL, payload)
          .then(response => {
            $scope.dlpGroup.status = isEnabled;
            if (
              $scope.dlpGroup.status &&
              $scope.dlpGroup.sensors.length === 0
            ) {
              let warning = $translate.instant("group.dlp.msg.ADD_DLP_WARNING");
              $scope.editDLPSensor(warning);
            }
            $timeout(() => {
              $scope.getDLPSensors($scope.group.name, isEnabled);
            }, 1000);
            if ($scope.dlpGroup.status) {
              if ($scope.dlpGroup.sensors.length > 0) {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success($translate.instant("group.dlp.msg.ENABLED_OK"));
              }
            } else {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("group.dlp.msg.DISABLED_OK"));
            }
          })
          .catch(error => {
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(error, $scope.dlpGroup.status
                  ? $translate.instant("group.dlp.msg.ENABLED_NG")
                  : $translate.instant("group.dlp.msg.DISABLED_NG"), false)
              );
            }
          });
      };

      $scope.toggleWAFGroupStatus = function(isEnabled) {
        let payload = {
          config: {
            name: $scope.group.name,
            status: isEnabled
          }
        };
        $http
          .patch(WAF_GROUPS_URL, payload)
          .then(response => {
            $scope.wafGroup.status = isEnabled;
            if (
              $scope.wafGroup.status &&
              $scope.wafGroup.sensors.length === 0
            ) {
              let warning = $translate.instant("group.waf.msg.ADD_WAF_WARNING");
              $scope.editWAFSensor(warning);
            }
            $timeout(() => {
              $scope.getWAFSensors($scope.group.name, isEnabled);
            }, 1000);
            if ($scope.wafGroup.status) {
              if ($scope.wafGroup.sensors.length > 0) {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success($translate.instant("group.waf.msg.ENABLED_OK"));
              }
            } else {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("group.waf.msg.DISABLED_OK"));
            }
          })
          .catch(error => {
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(error, $scope.wafGroup.status
                  ? $translate.instant("group.waf.msg.ENABLED_NG")
                  : $translate.instant("group.waf.msg.DISABLED_NG"), false)
              );
            }
          });
      };

      function getMessage(id) {
        if (id.zeroDrift !== "basic") {
          return (
            $translate.instant("topbar.mode.SWITCH") +
            $translate.instant("enum." + id.mode.toUpperCase()) +
            $translate.instant("topbar.mode.MODE") +
            " - " + $translate.instant("enum." + id.zeroDrift.split("-").join("").toUpperCase()) +
            "?"
          );
        }
        return (
          $translate.instant("topbar.mode.SWITCH") +
          $translate.instant("enum." + id.mode.toUpperCase()) +
          $translate.instant("topbar.mode.MODE") +
          "?"
        );
      }

      function getMessage4NodesSelected(id) {
        return (
          $translate.instant("group.SELECT_ALL_ALERT") +
          $translate.instant("enum." + id.toUpperCase()) +
          $translate.instant("group.MODE_NODES")
        );
      }

      const suppressShowNodesAlerts = function(mode, nodesGroup) {
        const modeGradeMap = {
          discover: 0,
          monitor: 1,
          protect: 2
        };
        let currMode = nodesGroup.policy_mode.toLowerCase();
        let targetMode = mode.mode.toLowerCase();
        let isSwitchingSameMode = currMode === targetMode;
        let isDowngradingMode = modeGradeMap[targetMode] === 0;
        console.log(
          "isSwitchingSameMode: ",
          isSwitchingSameMode,
          "isDowngradingMode: ",
          isDowngradingMode
        );
        return (
          isSwitchingSameMode ||
          isDowngradingMode ||
          getCheckedRows().length < 2
        );
      };

      const suppressSwitchMode = function(mode) {
        let modeCountMap = {
          discover: 0,
          monitor: 0,
          protect: 0
        };
        let baselineCountMap = {
          basic: 0,
          zerodrift: 0
        };
        getCheckedRows().forEach(group => {
          if (group.cap_change_mode)
            modeCountMap[group.policy_mode.toLowerCase()]++;
            baselineCountMap[group.baseline_profile.split("-").join("").toLowerCase()]++;
        });
        let areAllGroupsInSameTargetMode =
          modeCountMap[mode.mode.toLowerCase()] ===
          Object.values(modeCountMap).reduce(
            (accumulator, currentValue) => accumulator + currentValue
          );
        let areAllGroupsInSameTargetBaseline =
          baselineCountMap[mode.zeroDrift.split("-").join("").toLowerCase()] ===
          Object.values(modeCountMap).reduce(
            (accumulator, currentValue) => accumulator + currentValue
          );
        return areAllGroupsInSameTargetMode && areAllGroupsInSameTargetBaseline;
      };

      const getModeCounts = function() {
        let modeCountMap = {
          discover: 0,
          monitor: 0,
          protect: 0
        };
        let baselineCountMap = {
          basic: 0,
          zerodrift: 0
        };
        getCheckedRows().forEach(group => {
          if (group.cap_change_mode)
            modeCountMap[group.policy_mode.toLowerCase()]++;
            baselineCountMap[group.baseline_profile.split("-").join("").toLowerCase()]++;
        });
        return {modeCount: modeCountMap, baselineCount: baselineCountMap}
      };

      const selectNodesAlert = function(cb, mode, nodesGroup) {
        if (!suppressShowNodesAlerts(mode, nodesGroup)) {
          Alertify.confirm(getMessage4NodesSelected(mode.mode)).then(
            function onOk() {
              cb(mode, true);
            },
            function onCancel() {}
          );
        } else {
          cb(mode);
        }
      };

      const switchAllMode = function(mode, isAlerted) {
        const switchAll = function(mode) {
          $scope.isSwitchingMode = true;
          $http
            .patch(SERVICE_ALL, { policy_mode: mode.mode, baseline_profile: mode.zeroDrift })
            .then(function() {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("service.ALL_SUBMIT_OK"));
              $timeout(function() {
                $scope.refresh();
                isCheckAll = false;
                $scope.isSwitchingMode = false;
              }, 2000);
            })
            .catch(function(error) {
              console.warn(error);
              if (USER_TIMEOUT.indexOf(error.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(error, $translate.instant("service.ALL_SUBMIT_FAILED"), false)
                );
              }
              isCheckAll = false;
              $scope.isSwitchingMode = false;
            });
        }
        if (isAlerted) {
          switchAll(mode);
        } else {
          if (!suppressSwitchMode(mode)) {
            Alertify.confirm(getMessage
            (mode)).then(
              function onOk() {
                switchAll(mode);
              },
              function onCancel() {}
            );
          }
        }
      };

      const switchSomeMode = function(mode, isAlerted) {
        const switchSome = function(mode) {
          let serviceList = getCheckedRows().map(function(element) {
            return element.name.indexOf("nv.") >= 0
              ? element.name.substring(3)
              : element.name;
          });
          $scope.isSwitchingMode = true;
          let data = {
            config: { services: serviceList, policy_mode: mode.mode, baseline_profile: mode.zeroDrift }
          };
          data = pako.gzip(JSON.stringify(data));
          data = new Blob([data], {type: 'application/gzip'});
          let config = {
            headers: {
              'Content-Type': 'application/json',
              'Content-Encoding': 'gzip'
            }
          };
          $http
            .patch(SERVICE_URL, data, config)
            .then(function() {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success(
                $translate.instant("service.SUBMIT_OK")
              );
              $timeout(function() {
                $scope.refresh();
                isCheckAll = false;
                $scope.isSwitchingMode = false;
              }, 2000);
            })
            .catch(function(error) {
              console.warn(error);
              if (USER_TIMEOUT.indexOf(error.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(error, $translate.instant("service.SUBMIT_FAILED"), false)
                );
              }
              isCheckAll = false;
              $scope.isSwitchingMode = false;
            });
        }
        if (isAlerted) {
          switchSome(mode);
        } else {
          if (!suppressSwitchMode(mode)) {
            Alertify.confirm(getMessage(mode)).then(
              function onOk() {
                switchSome(mode);
              },
              function onCancel() {}
            );
          }
        }
      };

      const getSwitchableGroups = function() {
        return $scope.groups.filter(group => group.cap_change_mode);
      }

      $scope.switchServiceMode = function(mode) {
        let checkedRows = getCheckedRows();
        firstCheckedGroupName = checkedRows[0].name;
        $scope.forAll = checkedRows.length === getSwitchableGroups().length;
        let nodesGroup = checkedRows.filter(
          group => group.name === "nodes"
        );
        if (nodesGroup.length > 0) {
          if ($scope.forAll) {
            selectNodesAlert(switchAllMode, mode, nodesGroup[0]);
          } else {
            selectNodesAlert(switchSomeMode, mode, nodesGroup[0]);
          }
        } else {
          switchSomeMode(mode);
        }
      };
    }

    $scope.onMax = false;

    $scope.togglePanel = function() {
      $scope.onMax = !$scope.onMax;
      if ($scope.onMax) {
        $scope.gridHeight = $window.innerHeight - 315;
      } else {
        setDetailsViewHeight4Init();
      }
    };

    $scope.removeScript = function(data) {
      let payload = {
        group: $scope.group.name,
        config: {
          delete: {
            scripts: [data]
          }
        }
      };
      submitScript(payload);
    };

    $scope.addScript = function() {
      let payload = {
        group: $scope.group.name,
        config: {
          add: {
            scripts: [vm.scriptEntry]
          }
        }
      };
      submitScript(payload);
    };

    $scope.editScript = function() {
      let payload = {
        group: $scope.group.name,
        config: {
          update: {
            scripts: [vm.scriptEntry]
          }
        }
      };
      submitScript(payload);
    };

    function submitScript(payload) {
      $http
        .patch(GROUP_SCRIPT_URL, payload)
        .then(response => {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          Alertify.success($translate.instant("group.script.msg.SCRIPT_OK"));
          $timeout(() => {
            $scope.getCustomCheck($scope.group.name);
          }, 1000);
        })
        .catch(e => {
          if (USER_TIMEOUT.indexOf(e.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            console.log(e.data);
            Alertify.error(
              Utils.getAlertifyMsg(e, $translate.instant("group.script.msg.SCRIPT_NG"), false)
            );
          }
        });
    }
  }

  DialogController4AddGroup.$inject = [
    "$scope",
    "$mdDialog",
    "$translate",
    "$http",
    "$timeout",
    "$sanitize",
    "Utils",
    "Alertify"
  ];
  function DialogController4AddGroup(
    $scope,
    $mdDialog,
    $translate,
    $http,
    $timeout,
    $sanitize,
    Utils,
    Alertify
  ) {
    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    };
    activate();

    function activate() {
      $scope.singleCriterion = {
        value: "",
        index: -1
      };
      $scope.group = {
        name: "",
        comment: "",
        criteria: []
      };
      $scope.nameRegex = /^(?!nv\.)(?!fed\.)(?!external)(?!Host:)(?!Workload:)/;
      const initializeTagStyle = function() {
        let allTagsElem = angular.element("ul.tag-list > li");
        for (let i = 0; i < allTagsElem.length; i++) {
          allTagsElem[i].classList.remove("selected-tag");
          allTagsElem[i].classList.add("tag-item");
        }
      };

      const initializeSpecificTagStyle = function(insertIndex) {
        let elem = angular.element("ul.tag-list > li")[insertIndex];
        elem.classList.remove("selected-tag");
        elem.classList.add("tag-item");
      };

      const setFocusedTagStyle = function(focusedIndex) {
        let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
        tagElem.classList.remove("tag-item");
        tagElem.classList.add("selected-tag");
      };

      $scope.checkDuplicated = function() {
        let elem = angular.element("#tagEditor");
        if ($scope.group.criteria) {
          for (let i = 0; i < $scope.group.criteria.length; i++) {
            if (
              $scope.singleCriterion.value === $scope.group.criteria[i].name &&
              $scope.singleCriterion.index !== $scope.group.criteria[i].index
            ) {
              elem[0].classList.remove("ng-valid");
              elem[0].classList.add("ng-invalid");
              $scope.isInvalidTag = true;
              return;
            }
          }
        }
        elem[0].classList.remove("ng-invalid");
        elem[0].classList.add("ng-valid");
        $scope.isInvalidTag = false;
      };

      $scope.preventFormSubmit = function(event) {
        if (event.which === 13) {
          event.preventDefault();
          $scope.editCriterion($scope.singleCriterion);
        }
      };

      $scope.editCriterion = function(singleCriterion) {
        if (!$scope.group.criteria)  $scope.group.criteria = [];
        let insertIndex = singleCriterion.index === -1 ? $scope.group.criteria.length : singleCriterion.index;
        let insertOrReplace = singleCriterion.index === -1 ? 0 : 1;
        $scope.group.criteria.splice(insertIndex, insertOrReplace, {
          name: singleCriterion.value,
          index: insertIndex
        });
        $scope.singleCriterion = {
          value: "",
          index: -1
        };
        $scope.isShowingEditCriterion = false;
        initializeSpecificTagStyle(insertIndex);
      };

      $scope.tagAdding = function(tag) {
        let insertIndex = $scope.group.criteria.length;
        tag.index = insertIndex;
        $scope.isShowingEditCriterion = false;
        initializeTagStyle();
      }

      $scope.showTagDetail = function(tag) {
        initializeTagStyle();
        setFocusedTagStyle(tag.index);
        $scope.singleCriterion.value = tag.name;
        $scope.singleCriterion.index = tag.index;
        $scope.isShowingEditCriterion = true;
        $scope.isInvalidTag = false;
        $timeout(() => {
          let tagEditorElem = angular.element("#tagEditor");
          tagEditorElem.focus();
        }, 200);
      };

      $scope.tagRemoving = function(tag) {
        $scope.group.criteria.forEach(filter => {
          if (tag.index < filter.index) {
            filter.index -= 1;
          }
        });
        $timeout(() => {
          if (!$scope.group.criteria)  $scope.group.criteria = [];
          $scope.isShowingEditCriterion = false;
          initializeTagStyle();
        }, 200);
      };

      $scope.addGroup = function() {
        $http
          .post(GROUP_URL, $scope.group)
          .then(function(res) {
            console.log(res);
            $mdDialog.hide();
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("group.addGroup.OK_MSG"));
          })
          .catch(function(e) {
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              console.log(e.data);
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("group.addGroup.ERR_MSG"), false)
              );
            }
          });
      };
    }
  }

  DialogController4EditGroup.$inject = [
    "$scope",
    "$mdDialog",
    "$translate",
    "$http",
    "$sanitize",
    "$timeout",
    "Utils",
    "Alertify",
    "selectedGroup",
    "isWriteGroupAuthorized",
    "isEditable"
  ];
  function DialogController4EditGroup(
    $scope,
    $mdDialog,
    $translate,
    $http,
    $sanitize,
    $timeout,
    Utils,
    Alertify,
    selectedGroup,
    isWriteGroupAuthorized,
    isEditable
  ) {
    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $scope.group = angular.copy(selectedGroup);
      $mdDialog.cancel();
    };
    activate();
    function activate() {
      $scope.singleCriterion = {
        value: "",
        index: -1
      };
      $scope.group = angular.copy(selectedGroup);
      $scope.group.criteria = $scope.group.criteria.map((criterion, index) => {
        criterion.index = index;
        return criterion;
      });
      $scope.CFG_TYPE = CFG_TYPE;
      const initializeTagStyle = function() {
        let allTagsElem = angular.element("ul.tag-list > li");
        for (let i = 0; i < allTagsElem.length; i++) {
          allTagsElem[i].classList.remove("selected-tag");
          allTagsElem[i].classList.add("tag-item");
        }
      };

      const initializeSpecificTagStyle = function(insertIndex) {
        let elem = angular.element("ul.tag-list > li")[insertIndex];
        elem.classList.remove("selected-tag");
        elem.classList.add("tag-item");
      };

      const setFocusedTagStyle = function(focusedIndex) {
        let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
        tagElem.classList.remove("tag-item");
        tagElem.classList.add("selected-tag");
      };

      $scope.checkDuplicated = function() {
        let elem = angular.element("#tagEditor");
        if ($scope.group.criteria) {
          for (let i = 0; i < $scope.group.criteria.length; i++) {
            if (
              $scope.singleCriterion.value === $scope.group.criteria[i].name &&
              $scope.singleCriterion.index !== $scope.group.criteria[i].index
            ) {
              elem[0].classList.remove("ng-valid");
              elem[0].classList.add("ng-invalid");
              $scope.isInvalidTag = true;
              return;
            }
          }
        }
        elem[0].classList.remove("ng-invalid");
        elem[0].classList.add("ng-valid");
        $scope.isInvalidTag = false;
      };

      $scope.preventFormSubmit = function(event) {
        if (event.which === 13) {
          event.preventDefault();
          $scope.editCriterion($scope.singleCriterion);
        }
      };

      $scope.editCriterion = function(singleCriterion) {
        if (!$scope.group.criteria)  $scope.group.criteria = [];
        let insertIndex = singleCriterion.index === -1 ? $scope.group.criteria.length : singleCriterion.index;
        let insertOrReplace = singleCriterion.index === -1 ? 0 : 1;
        $scope.group.criteria.splice(insertIndex, insertOrReplace, {
          name: singleCriterion.value,
          index: insertIndex
        });
        $scope.singleCriterion = {
          value: "",
          index: -1
        };
        $scope.isShowingEditCriterion = false;
        initializeSpecificTagStyle(insertIndex);
      };

      $scope.tagAdding = function(tag) {
        let insertIndex = $scope.group.criteria.length;
        tag.index = insertIndex;
        $scope.isShowingEditCriterion = false;
        initializeTagStyle();
      }

      $scope.showTagDetail = function(tag) {
        initializeTagStyle();
        setFocusedTagStyle(tag.index);
        $scope.singleCriterion.value = tag.name;
        $scope.singleCriterion.index = tag.index;
        $scope.isShowingEditCriterion = true;
        $scope.isInvalidTag = false;
        $timeout(() => {
          let tagEditorElem = angular.element("#tagEditor");
          tagEditorElem.focus();
        }, 200);
      };

      $scope.tagRemoving = function(tag) {
        $scope.group.criteria.forEach(filter => {
          if (tag.index < filter.index) {
            filter.index -= 1;
          }
        });
        $timeout(() => {
          if (!$scope.group.criteria)  $scope.group.criteria = [];
          $scope.isShowingEditCriterion = false;
          initializeTagStyle();
        }, 200);
      };

      $scope.isEditable = isEditable;
      console.log($scope.group);
      $scope.editGroup = function() {
        $http
          .patch(GROUP_URL, $scope.group)
          .then(function(res) {
            console.log(res);
            $mdDialog.hide();
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("group.editGroup.OK_MSG"));
          })
          .catch(function(e) {
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              console.log(e.data);
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("group.editGroup.ERR_MSG"), false)
              );
            }
          });
      };
    }
  }

  FileDialogController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$translate",
    "$sanitize",
    "group",
    "fileAccessFilterSample",
    "Utils",
    "Alertify"
  ];
  function FileDialogController(
    $scope,
    $http,
    $mdDialog,
    $translate,
    $sanitize,
    group,
    fileAccessFilterSample,
    Utils,
    Alertify
  ) {
    activate();

    function activate() {
      $scope.fileAccessFilterSample = fileAccessFilterSample;
      $scope.cancel = function() {
        $mdDialog.cancel();
      };
      console.log(group.cap_change_mode);
      $scope.isServiceGroup = group.cap_change_mode;

      $scope.addFilter = function(rule) {
        if (rule.apps && rule.apps.length > 0) {
          rule.applications = rule.apps.map(function(item) {
            return item.name;
          });
        } else {
          rule.applications = [];
        }
        if (!rule.recursive) rule.recursive = false;

        $http
          .patch(FILE_PROFILE_URL, {
            group: group.name,
            fileMonitorConfigData: {
              config: {
                add_filters: [rule]
              }
            }
          })
          .then(function() {
            $mdDialog.hide();
          })
          .catch(function(err) {
            console.warn(err);
            $mdDialog.hide();
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("general.FAILED_TO_ADD"), false)
              );
            }
          });
      };
    }
  }

  FileEditDialogController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$translate",
    "$sanitize",
    "rule",
    "group",
    "fileAccessFilterSample",
    "Utils",
    "Alertify"
  ];
  function FileEditDialogController(
    $scope,
    $http,
    $mdDialog,
    $translate,
    $sanitize,
    rule,
    group,
    fileAccessFilterSample,
    Utils,
    Alertify
  ) {
    activate();

    function activate() {
      $scope.fileAccessFilterSample = fileAccessFilterSample;
      if (rule.applications && rule.applications.length > 0) {
        rule.apps = rule.applications.map(function(item) {
            return { name: item };
        });
      } else rule.apps = rule.applications;

      $scope.rule = rule;

      console.log(group.cap_change_mode);
      $scope.isServiceGroup = group.cap_change_mode;
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.updateFilter = function(rule) {
        if (rule.apps && rule.apps.length > 0) {
          rule.apps = rule.apps.map(function(item) {
              item.name = $sanitize(item.name);
              return item;
          });
          rule.applications = rule.apps.map(function(item) {
            return item.name;
          });
        } else {
          rule.applications = [];
        }
        if (!rule.recursive) rule.recursive = false;

        $http
          .patch(FILE_PROFILE_URL, {
            group: group.name,
            fileMonitorConfigData: {
              config: {
                update_filters: [rule]
              }
            }
          })
          .then(function() {
            $mdDialog.hide();
          })
          .catch(function(err) {
            console.warn(err);
            $mdDialog.hide();
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("general.FAILED_TO_UPDATE"), false)
              );
            }
          });
      };
    }
  }

  DialogController4SwitchMode.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$mdDialog",
    "$timeout",
    "$sanitize",
    "Utils",
    "Alertify",
    "$translate",
    "FileUploader",
    "refresh",
    "callback",
    "counts"
  ]
  function DialogController4SwitchMode(
    $rootScope,
    $scope,
    $http,
    $mdDialog,
    $timeout,
    $sanitize,
    Utils,
    Alertify,
    $translate,
    FileUploader,
    refresh,
    callback,
    counts
  ) {

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    activate();

    function activate() {
      $scope.switch = {
        zeroDrift: 'basic'
      };

      $scope.updateServiceMode = function() {
        $mdDialog.hide();
        $scope.switch.mode = $scope.switch.mode.charAt(0).toUpperCase() + $scope.switch.mode.slice(1);
        callback($scope.switch);
      };

      $scope.getDefaultMode = function(modeCount) {
        let countSum = Object.values(modeCount).reduce((a, b) => a + b);
        if (countSum == 0)
          return "";
        if (modeCount["monitor"] == countSum)
          return "monitor";
        if (modeCount["protect"] == countSum)
          return "protect";
        if (modeCount["discover"] == countSum)
          return "discover";
      };

      $scope.getDefaultBaseline = function(baselineCount) {
        if (baselineCount["zerodrift"] !== 0 && baselineCount["basic"] == 0) {
          return "zero-drift";
        } else {
          return "basic";
        }
      };

      $scope.switch.mode = $scope.getDefaultMode(counts.modeCount);
      $scope.switch.zeroDrift = $scope.getDefaultBaseline(counts.baselineCount);
    }
  }


  DialogController4ImportGroupPolicy.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$mdDialog",
    "$timeout",
    "$sanitize",
    "Utils",
    "Alertify",
    "$translate",
    "FileUploader",
    "refresh"
  ];
  function DialogController4ImportGroupPolicy(
    $rootScope,
    $scope,
    $http,
    $mdDialog,
    $timeout,
    $sanitize,
    Utils,
    Alertify,
    $translate,
    FileUploader,
    refresh
  ) {

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    activate();

    function activate() {

      const getImportProgressInfo = function(params) {
          console.log("getImportProgressInfo");
          if (params.transactionId) {
            $http
            .post(
              IMPORT_GROUP_URL,
              "",
              {
                headers: {
                  "X-Transaction-Id": params.transactionId
                }
              }
            )
            .then((res) => {
              if (res.status === 200) {
                $scope.percentage = res.data.data.percentage;
                $scope.status = res.data.data.status;
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.success(
                  $translate.instant("group.IMPORT_OK")
                );
                $timeout(() => {
                  $scope.cancel();
                  refresh();
                }, 2000);
              } else if (res.status === 206) {
                let transactionId = res.data.data.tid;
                $scope.percentage = res.data.data.percentage;
                $scope.status = res.data.data.status;
                getImportProgressInfo(
                  {
                    transactionId,
                    percentage: $scope.percentage
                  }
                );
              }
            })
            .catch((err) => {
              console.warn(err);
              $scope.status = Utils.getAlertifyMsg(err, $translate.instant("setting.IMPORT_FAILED"), false);
              if (status !== USER_TIMEOUT) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  $scope.status
                );
              }
            });
          }
      };

      let uploader = ($scope.uploader = new FileUploader({
        url: IMPORT_GROUP_URL,
        alias: "groupPolicy",
        headers: {
          Token: $rootScope.user.token.token,
          Accept: "application/octet-stream"
        }
      }));

      // FILTERS
      uploader.filters.push({
        name: "customFilter",
        fn: function (/*item, options*/) {
          return this.queue.length < 1;
        },
      });

      // CALLBACKS
      uploader.onWhenAddingFileFailed = function (
        item /*{File|FileLikeObject}*/,
        filter,
        options
      ) {};
      uploader.onAfterAddingFile = function (fileItem) {};
      uploader.onAfterAddingAll = function (addedFileItems) {};
      uploader.onBeforeUploadItem = function (item) {};
      uploader.onProgressItem = function (fileItem, progress) {};
      uploader.onProgressAll = function (progress) {};
      uploader.onSuccessItem = function (fileItem, response, status, headers) {
        if (status === 200) {
          $scope.percentage = response.data.data.percentage;
          $scope.status = response.data.data.status;
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.success(
            $translate.instant("group.IMPORT_OK")
          );
          $timeout(() => {
            $scope.cancel();
            refresh();
          }, 2000);
        } else if (status === 206) {
          let transactionId = response.data.tid;
          $scope.percentage = response.data.percentage;
          $scope.status = response.data.status;

          getImportProgressInfo(
            {
              transactionId,
              percentage: $scope.percentage
            }
          );
        }


      };
      uploader.onErrorItem = function (fileItem, response, status, headers) {
        $scope.status = Utils.getAlertifyMsg(response.message, $translate.instant("setting.IMPORT_FAILED"), false);
        $scope.percentage = 0;
        if (status !== USER_TIMEOUT) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            $scope.status
          );
        }
      };
      uploader.onCancelItem = function (fileItem, response, status, headers) {};
      uploader.onCompleteItem = function (
        fileItem,
        response,
        status,
        headers
      ) {};
      uploader.onCompleteAll = function () {};

    }
  }

  DialogController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$sanitize",
    "group",
    "processProfileSample",
    "Utils",
    "Alertify",
    "$translate"
  ];
  function DialogController(
    $scope,
    $http,
    $mdDialog,
    $sanitize,
    group,
    processProfileSample,
    Utils,
    Alertify,
    $translate
  ) {
    activate();

    function activate() {
      $scope.processProfileSample = processProfileSample;
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.addProfile = function(rule) {
        if (rule.allowed) rule.action = "allow";
        else rule.action = "deny";

        $http
          .patch(PROCESS_PROFILE_URL, {
            process_profile_config: {
              group: group,
              process_change_list: [rule]
            }
          })
          .then(function() {
            $mdDialog.hide();
          })
          .catch(function(err) {
            console.warn(err);
            $mdDialog.hide();
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("general.FAILED_TO_ADD"), false)
              );
            }
          });
      };
    }
  }

  EditDialogController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$sanitize",
    "rule",
    "group",
    "processProfileSample",
    "Utils",
    "Alertify",
    "$translate"
  ];
  function EditDialogController(
    $scope,
    $http,
    $mdDialog,
    $sanitize,
    rule,
    group,
    processProfileSample,
    Utils,
    Alertify,
    $translate
  ) {
    activate();

    function activate() {
      $scope.processProfileSample = processProfileSample;
      $scope.rule = rule;
      let originalRule = JSON.parse(JSON.stringify(rule));

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.updateProfile = function(rule) {
        if (rule.allowed) rule.action = "allow";
        else rule.action = "deny";

        $http
          .patch(PROCESS_PROFILE_URL, {
            process_profile_config: {
              group: group,
              process_delete_list: [originalRule],
              process_change_list: [rule]
            }
          })
          .then(function() {
            $mdDialog.hide();
          })
          .catch(function(err) {
            console.warn(err);
            $mdDialog.hide();
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("general.FAILED_TO_UPDATE"), false)
              );
            }
          });
      };
    }
  }

  SelectDLPSensorDialogController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$translate",
    "$timeout",
    "$window",
    "chosenSensors",
    "groupEntry",
    "warning",
    "Utils",
    "Alertify"
  ];
  function SelectDLPSensorDialogController(
    $scope,
    $http,
    $mdDialog,
    $translate,
    $timeout,
    $window,
    chosenSensors,
    groupEntry,
    warning,
    Utils,
    Alertify
  ) {
    let $win = $($window);
    const resizeEvent = "resize.ag-grid";
    $scope.gridHeight4Sensor = 350;
    $scope.warning = warning;

    let getEntityName = function(count) {
      return Utils.getEntityName(
        count,
        $translate.instant("dlp.COUNT_POSTFIX")
      );
    };
    const outOf = $translate.instant("enum.OUT_OF");
    const found = $translate.instant("enum.FOUND");

    let sensorColumnDefs = [
      {
        headerName: $translate.instant("group.dlp.gridHeader.NAME"),
        field: "name",
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: true,
        width: 120,
        minWidth: 100
      },
      {
        headerName: $translate.instant("group.dlp.gridHeader.COMMENT"),
        field: "comment",
        width: 420,
        minWidth: 400
      },
      {
        headerName: $translate.instant("group.dlp.gridHeader.ACTION"),
        field: "isAllowed",
        cellRenderer: function(params) {
          if (params) {
            return `<div class="md-switch5">
                        <label class="nv-modal-item-title">
                          <input type="checkbox" ng-model="data.isAllowed" ng-change="toggleType(data.isAllowed)">
                          <span class="toggle"></span>
                          <span ng-class="{'text-deny': !data.isAllowed,'text-warning': data.isAllowed}">{{(data.isAllowed ? "enum.ALERT" : "admissionControl.DENY") | translate}}</span>
                        </label>
                      </div>`;
          }
        },
        width: 105,
        minWidth: 105,
        maxWidth: 105
      }
    ];

    $scope.gridSensor = {
      headerHeight: 30,
      rowHeight: 30,
      animateRows: true,
      enableColResize: true,
      angularCompileRows: true,
      suppressDragLeaveHidesColumns: true,
      columnDefs: sensorColumnDefs,
      rowData: null,
      // onSelectionChanged: onSelectionChanged,
      rowSelection: "multiple",
      rowMultiSelectWithClick: true,
      rowClassRules: {
        "disabled-row": function(params) {
          if (!params.data) return;
          return !!params.data.disable;
        }
      },
      onGridReady: function(params) {
        $timeout(function() {
          params.api.sizeColumnsToFit();
        }, 500);
        $win.on(resizeEvent, function() {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 500);
        });
      },
      overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
    };

    activate();

    function activate() {
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.toggleType = function(isAllowed) {
        console.log($scope.sensors);
      };

      function getSensorList() {
        $http
          .get(DLP_SENSORS_URL)
          .then(function(response) {
            $scope.sensors = response.data.sensors;
            $scope.sensors = $scope.sensors.map(sensor => {
              return Object.assign(sensor, { isAllowed: false });
            });
            $scope.gridSensor.api.setRowData(response.data.sensors);
            $timeout(() => {
              $scope.gridSensor.api.forEachNode((node, index) => {
                chosenSensors.forEach(chosenSensor => {
                  if (node.data.name === chosenSensor.name) {
                    node.data.isAllowed = chosenSensor.action === "allow";
                    node.setSelected(true);
                  }
                });
              });
            }, 200);
            $scope.count = `${$scope.sensors.length} ${getEntityName(
              $scope.sensors.length
            )}`;
          })
          .catch(function(err) {
            $scope.dlpSensorsErr = true;
            console.warn(err);
            $scope.sensors = [];
            $scope.gridSensor.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridSensor.api.setRowData($scope.sensors);
          });
      }

      getSensorList();

      $scope.onFilterChanged = function(value) {
        $scope.gridSensor.api.setQuickFilter(value);
        let filteredCount = $scope.gridSensor.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.sensors.length || value === ""
            ? `${$scope.sensors.length} ${getEntityName($scope.sensors.length)}`
            : `${found} ${filteredCount} / ${$scope.sensors.length} ${getEntityName(
                $scope.sensors.length
              )}`;
      };
      $scope.adopt = function() {
        let selectedSensor = $scope.gridSensor.api.getSelectedRows();
        console.log(selectedSensor);
        let payload = {
          config: {
            name: groupEntry.name,
            status: groupEntry.status,
            replace: selectedSensor.map(sensor => {
              return {
                name: sensor.name,
                action: sensor.isAllowed ? "allow" : "deny"
              };
            })
          }
        };
        console.log(payload);
        $http
          .patch(DLP_GROUPS_URL, payload)
          .then(response => {
            $mdDialog.hide();
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.success($translate.instant("group.dlp.msg.SETTING_OK"));
          })
          .catch(err => {
            console.warn(err);
            $mdDialog.hide();
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("group.dlp.msg.SETTING_NG"), false)
              );
            }
          });
      };
    }
  }

  SelectWAFSensorDialogController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$translate",
    "$timeout",
    "$window",
    "$sanitize",
    "chosenSensors",
    "groupEntry",
    "warning",
    "Utils",
    "Alertify"
  ];
  function SelectWAFSensorDialogController(
    $scope,
    $http,
    $mdDialog,
    $translate,
    $timeout,
    $window,
    $sanitize,
    chosenSensors,
    groupEntry,
    warning,
    Utils,
    Alertify
  ) {
    let $win = $($window);
    const resizeEvent = "resize.ag-grid";
    $scope.gridHeight4Sensor = 350;
    $scope.warning = warning;

    let getEntityName = function(count) {
      return Utils.getEntityName(
        count,
        $translate.instant("waf.COUNT_POSTFIX")
      );
    };
    const outOf = $translate.instant("enum.OUT_OF");
    const found = $translate.instant("enum.FOUND");

    let sensorColumnDefs = [
      {
        headerName: $translate.instant("group.waf.gridHeader.NAME"),
        field: "name",
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: true,
        width: 120,
        minWidth: 100
      },
      {
        headerName: $translate.instant("group.waf.gridHeader.COMMENT"),
        field: "comment",
        width: 420,
        minWidth: 400
      },
      {
          headerName: $translate.instant("admissionControl.TYPE"),
          field: "cfg_type",
          cellRenderer: (params) => {
            if (params) {
              let cfgType = params.value ? params.value.toUpperCase() : CFG_TYPE.CUSTOMER.toUpperCase();
              let type = colourMap[cfgType];
              return `<div class="action-label nv-label ${type}">${$sanitize(
                $translate.instant(`group.${cfgType}`)
              )}</div>`;
            }
          },
          width: 90,
          minWidth: 90,
          maxWidth: 90
      },
      {
        headerName: $translate.instant("group.waf.gridHeader.ACTION"),
        field: "isAllowed",
        cellRenderer: function(params) {
          if (params) {
            return `<div class="md-switch5">
                        <label class="nv-modal-item-title">
                          <input type="checkbox" ng-model="data.isAllowed" ng-change="toggleType(data.isAllowed)">
                          <span class="toggle"></span>
                          <span ng-class="{'text-deny': !data.isAllowed,'text-warning': data.isAllowed}">{{(data.isAllowed ? "enum.ALERT" : "admissionControl.DENY") | translate}}</span>
                        </label>
                      </div>`;
          }
        },
        width: 105,
        minWidth: 105,
        maxWidth: 105
      }
    ];

    $scope.gridSensor = {
      headerHeight: 30,
      rowHeight: 30,
      animateRows: true,
      enableColResize: true,
      angularCompileRows: true,
      suppressDragLeaveHidesColumns: true,
      columnDefs: sensorColumnDefs,
      rowData: null,
      // onSelectionChanged: onSelectionChanged,
      rowSelection: "multiple",
      rowMultiSelectWithClick: true,
      rowClassRules: {
        "disabled-row": function(params) {
          if (!params.data) return;
          return !!params.data.disable;
        }
      },
      onGridReady: function(params) {
        $timeout(function() {
          params.api.sizeColumnsToFit();
        }, 500);
        $win.on(resizeEvent, function() {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 500);
        });
      },
      overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
    };

    activate();

    function activate() {
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.toggleType = function(isAllowed) {
        console.log($scope.sensors);
      };

      function getSensorList() {
        $http
          .get(WAF_SENSORS_URL)
          .then(function(response) {
            $scope.sensors = response.data.sensors;
            $scope.sensors = $scope.sensors.map(sensor => {
              return Object.assign(sensor, { isAllowed: false });
            });
            $scope.gridSensor.api.setRowData(response.data.sensors);
            $timeout(() => {
              $scope.gridSensor.api.forEachNode((node, index) => {
                chosenSensors.forEach(chosenSensor => {
                  if (node.data.name === chosenSensor.name) {
                    node.data.isAllowed = chosenSensor.action === "allow";
                    node.setSelected(true);
                  }
                });
              });
            }, 200);
            $scope.count = `${$scope.sensors.length} ${getEntityName(
              $scope.sensors.length
            )}`;
          })
          .catch(function(err) {
            $scope.wafSensorsErr = true;
            console.warn(err);
            $scope.sensors = [];
            $scope.gridSensor.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridSensor.api.setRowData($scope.sensors);
          });
      }

      getSensorList();

      $scope.onFilterChanged = function(value) {
        $scope.gridSensor.api.setQuickFilter(value);
        let filteredCount = $scope.gridSensor.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.sensors.length || value === ""
            ? `${$scope.sensors.length} ${getEntityName($scope.sensors.length)}`
            : `${found} ${filteredCount} / ${$scope.sensors.length} ${getEntityName(
                $scope.sensors.length
              )}`;
      };
      $scope.adopt = function() {
        let selectedSensor = $scope.gridSensor.api.getSelectedRows();
        console.log(selectedSensor);
        let payload = {
          config: {
            name: groupEntry.name,
            status: groupEntry.status,
            replace: selectedSensor.map(sensor => {
              return {
                name: sensor.name,
                action: sensor.isAllowed ? "allow" : "deny"
              };
            })
          }
        };
        console.log(payload);
        $http
          .patch(WAF_GROUPS_URL, payload)
          .then(response => {
            $mdDialog.hide();
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.success($translate.instant("group.waf.msg.SETTING_OK"));
          })
          .catch(err => {
            console.warn(err);
            $mdDialog.hide();
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("group.waf.msg.SETTING_NG"), false)
              );
            }
          });
      };
    }
  }
})();
