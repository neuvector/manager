(function() {
    "use strict";
    angular.module("app.assets").controller("FederalPolicyNetworkRulesController", FederalPolicyNetworkRulesController);
    FederalPolicyNetworkRulesController.$inject = [
        "$rootScope",
        "$scope",
        "$timeout",
        "$translate",
        "$http",
        "$mdDialog",
        "policyService",
        "Alertify",
        "$window",
        "Utils",
        "$filter",
        "$sanitize",
        "AuthorizationFactory"
    ];
    function FederalPolicyNetworkRulesController(
        $rootScope,
        $scope,
        $timeout,
        $translate,
        $http,
        $mdDialog,
        policyService,
        Alertify,
        $window,
        Utils,
        $filter,
        $sanitize,
        AuthorizationFactory
    ) {
        policyService.rules = [];
        policyService.newRules = [];
        $scope.rules = [];
        policyService.groupList = [];
        policyService.appList = [];
        policyService.serializedRules = [];
        $scope.duplicatedPolicy = false;
        $rootScope.isPolicyDirty = false;
        $scope.onlyRemove = true;
        $scope.eof = false;
        $scope.graphHeight = $window.innerHeight - 315;
        angular.element($window).bind("resize", function() {
            $scope.graphHeight = $window.innerHeight - 315;
            $scope.$digest();
        });
        const PAGE_SIZE = PAGE.FED_NETWORK_RULES;
        const STATE_NEW = "new-rule";
        const STATE_MODIFIED = "modified-rule";
        const STATE_LEARNED = "learn-rule";
        const STATE_DISABLED = "disabled-rule";
        const STATE_GROUND_RULE = "ground-rule";
        const STATE_CUSTOMER = "customer-rule";
        const STATE_FED = "federate-rule";
        const STATE_MOVED = "moved-rule";
        const PORTS_DISPLAY_LEN = 40;
        const NEW_ID_SEED = 1000000;
        let sequence = NEW_ID_SEED;
        let hoveringRowNode = null;
        let countOfGroundRule = 0;

        const SYSTEM_GROUP = [
          "external",
          "containers",
          "nodes"
        ]


        $rootScope.isReset = false;

        $scope.colorMap = colourMap;

        let isFed = AuthorizationFactory.getDisplayFlag("multi_cluster");
        $scope.isWriteRuleAuthorized = AuthorizationFactory.getDisplayFlag("write_network_rule") && isFed;

        function keepAlive() {
            $rootScope.isReset = true;
            let success = function() {
                $timeout(function() {
                    $rootScope.isReset = false;
                }, 500);
            };
            let error = function() {
                $timeout(function() {
                    $rootScope.isReset = false;
                }, 500);
            };
            Utils.keepAlive(success, error);
        }

        $scope.isDialogOpen = false;
        let filter = "";

        activate();

        let getEntityName = function(count) {
            return Utils.getEntityName(
                count,
                $translate.instant("policy.COUNT_POSTFIX")
            );
        };
        const outOf = $translate.instant("enum.OUT_OF");
        const found = $translate.instant("enum.FOUND");
        function activate() {
            let resizeEvent = "resize.ag-grid";
            let $win = $($window);
            let columnDefs = [
                {
                    headerName: `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${$translate.instant("policy.gridHeader.ID")}`,
                    field: "id",
                    checkboxSelection: function(params) {
                        if (params.data) {
                            return params.data.state !== STATE_GROUND_RULE && params.data.id !== "";
                        }
                        return false;
                    },
                    cellRenderer: ruleIdRenderFunc,
                    width: 100,
                    minWidth: 100,
                    maxWidth: 100
                },
                {
                    headerName: $translate.instant("policy.gridHeader.FROM"),
                    field: "from",
                    colSpan: function(params) {
                      if (params.data && params.data.id === "") {
                        return 8;
                      }
                      return 1;
                    },
                    cellRenderer: fromRenderFunc,
                    cellClass: ["wrap-word-in-cell"],
                    width: 280
                },
                {
                    headerName: $translate.instant("policy.gridHeader.TO"),
                    field: "to",
                    cellRenderer: toRenderFunc,
                    cellClass: ["wrap-word-in-cell"],
                    width: 280
                },
                {
                    headerName: $translate.instant("policy.gridHeader.APPLICATIONS"),
                    field: "applications",
                    cellClass: ["wrap-word-in-cell"],
                    cellRenderer: appRenderFunc,
                    width: 200
                },
                {
                    headerName: $translate.instant("policy.gridHeader.PORT"),
                    field: "ports",
                    cellClass: ["wrap-word-in-cell"],
                    cellRenderer: portsRenderFunc,
                    width: 200
                },
                {
                    headerName: $translate.instant("policy.gridHeader.ACTION"),
                    field: "action",
                    cellRenderer: actionRenderFunc,
                    width: 85,
                    minWidth: 85,
                    maxWidth: 85
                },
                {
                    headerName: $translate.instant("policy.gridHeader.TYPE"),
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
                            const date = new Date(params.value * 1000);
                            return $sanitize($filter("date")(date, "MMM dd, y HH:mm:ss"));
                        }
                    },
                    comparator: dateComparator,
                    icons: {
                        sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
                        sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
                    },
                    width: 130,
                    minWidth: 90,
                    maxWidth: 170
                },
                {
                    cellRenderer: actionsRenderFunc,
                    cellClass: "grid-right-align",
                    suppressSorting: true,
                    width: 90,
                    maxWidth: 90,
                    minWidth: 90
                }
            ];
            if (!$scope.isWriteRuleAuthorized) {
                columnDefs.splice(0, 1);
                columnDefs.splice(columnDefs.length - 1, 1);
            }

            function dateComparator(value1, value2, node1, node2) {
                /** @namespace node1.data.last_modified_timestamp */
                return (
                    node1.data.last_modified_timestamp -
                    node2.data.last_modified_timestamp
                );
            }

            function ruleIdRenderFunc(params) {
                if (params.data) {
                    if (params.data.state === STATE_GROUND_RULE) {
                        return (
                            '<span ng-class="{\'policy-remove\': data.remove}" uib-tooltip="' +
                            $sanitize(params.data.comment) +
                            '">' +
                            "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
                            $sanitize(params.value) +
                            "</span>"
                        );
                    } else {
                        if (params.value >= NEW_ID_SEED)
                            return (
                                '<span ng-class="{\'policy-remove\': data.remove}" uib-tooltip="' +
                                (params.data.comment ? $sanitize(params.data.comment) : "") +
                                '">New-' +
                                $sanitize((params.value - NEW_ID_SEED + 1)) +
                                "</span>"
                            );
                        return (
                            '<span ng-class="{\'policy-remove\': data.remove}" uib-tooltip="' +
                            $sanitize(params.data.comment) +
                            '">' +
                            $sanitize(params.value) +
                            "</span>"
                        );
                    }
                }
            }
            $scope.isAllPortsShown = false;
            $scope.showAllPorts = function(id, ports, ev) {
                hoveringRowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                    getIndex(id)
                );
                hoveringRowNode.setSelected(true);
                $scope.currPorts = ports
                    .split(",")
                    .join(", ")
                    .toString();
                $timeout(() => {
                    $scope.isGradientTopBottomShown =
                        document.getElementById("all-ports").clientHeight >= 300;
                }, 200);
                $scope.isAllPortsShown = true;
                console.log(ev.pageY);
                if (ev.pageY < $window.innerHeight / 2) {
                    $scope.panelPosition = {
                        bottom: $window.innerHeight - ev.pageY - 200 + "px",
                        right: $window.innerWidth - ev.pageX + "px"
                    };
                } else {
                    $scope.panelPosition = {
                        bottom: $window.innerHeight - ev.pageY - 100 + "px",
                        right: $window.innerWidth - ev.pageX + "px"
                    };
                }
            };
            $scope.hideAllPorts = function() {
                hoveringRowNode.setSelected(false);
                $scope.isAllPortsShown = false;
            };

            function fromRenderFunc(params) {
                if (params.value)
                  if (params.data.id === "") {
                    return `<div style="word-wrap: break-word;">
                      ${$sanitize(params.value)}
                    </div>`;
                  } else {
                    return `<div style="word-wrap: break-word;" ng-class="{\'policy-remove\': data.remove}" tooltip-enable="${params.value.length > 50}"
                      uib-tooltip="${$sanitize(params.value)}">
                      ${$sanitize(Utils.shortenString(params.value, 50))}
                    </div>`;
                  }
            }

            function toRenderFunc(params) {
                if (params.value)
                    return `<div style="word-wrap: break-word;" ng-class="{\'policy-remove\': data.remove}" tooltip-enable="${params.value.length > 50}"
                      uib-tooltip="${$sanitize(params.value)}">
                      ${$sanitize(Utils.shortenString(params.value, 50))}
                    </div>`;
            }

            function appRenderFunc(params) {
                if (params.value) {
                    let app =
                        Array.isArray(params.value) &&
                        params.value.length > 0 &&
                        params.value[0] === "any"
                            ? $translate.instant("enum.ANY")
                            : params.value;
                    return `<div style="word-wrap: break-word;" ng-class="{\'policy-remove\': data.remove}">${$sanitize(app)}</div>`;
                }
            }

            function portsRenderFunc(params) {
                let ports = "";
                if (params.value) {
                    ports =
                        params.value === "any"
                            ? $translate.instant("enum.ANY")
                            : params.value
                                .split(",")
                                .join(", ")
                                .toString();
                    if (params.value.split(",").length <= 3) {
                        return `<div style="word-wrap: break-word;" ng-class="{\'policy-remove\': data.remove}">${$sanitize(ports)}</div>`;
                    } else {
                        ports = params.value
                            .split(",")
                            .slice(0, 2)
                            .join(", ")
                            .toString();
                        return `<div ng-class="{\'policy-remove\': data.remove}" ng-click="showAllPorts(data.id, data.ports, $event)">${$sanitize(ports)}&nbsp;...</div>`;
                    }
                }
            }
            function actionsRenderFunc(params) {
                if (params.data) {
                    if (params.data.remove) {
                        return (
                            '<div class="rule-actions-expand fade-in-right">' +
                            '       <em class="fa fa-plus-circle fa-lg mr-sm text-action" ' +
                            '         ng-click="addPolicy($event, data.id)" uib-tooltip="{{\'policy.TIP.ADD\' | translate}}">' +
                            "       </em>" +
                            '       <em class="fa fa-recycle fa-lg mr-sm text-action" id="remove-form-action"' +
                            '         ng-click="undeleteRuleItem($event, data.id)" uib-tooltip="{{\'policy.TIP.UNDELETE\' | translate}}">' +
                            "       </em>" +
                            "     </div>" +
                            '     <div class="rule-actions-collapse">' +
                            '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                            "       </em>" +
                            "     </div>"
                        );
                    } else if (params.data.state === STATE_GROUND_RULE) {
                        return null;
                    } else {
                        return (
                            '<div class="rule-actions-expand fade-in-right">' +
                            '       <em class="fa fa-edit fa-lg mr-sm text-action" ng-if="!data.learned"' +
                            '         ng-click="editPolicy($event, data.id)" uib-tooltip="{{\'policy.TIP.EDIT\' | translate}}">' +
                            "       </em>" +
                            '       <em class="fa fa-plus-circle fa-lg mr-sm text-action" ' +
                            '         ng-click="addPolicy($event, data.id)" uib-tooltip="{{\'policy.TIP.ADD\' | translate}}">' +
                            "       </em>" +
                            '       <em class="fa fa-trash fa-lg mr-sm text-action" id="remove-form-action"' +
                            '         ng-click="deleteRuleItem($event, data.id)" uib-tooltip="{{\'policy.TIP.DELETE\' | translate}}">' +
                            "       </em>" +
                            "     </div>" +
                            '     <div class="rule-actions-collapse">' +
                            '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                            "       </em>" +
                            "     </div>"
                        );
                    }
                }
            }
            function actionRenderFunc(params) {
                if (params.data) {
                    return `<span ng-class="{\'policy-remove\': data.remove}" class="action-label ${
                        params.data.disable
                            ? colourMap["disabled_background"]
                            : colourMap[params.data.action.toLowerCase()]
                        }">${$sanitize($translate.instant(
                        "policy.action." + params.data.action.toUpperCase()
                    ))}</span>`;
                }
            }
            function typeRenderFunc(params) {
                if (params.data) {
                    if (params.data.remove) {
                        return `<div class="sample removed-rule">${$sanitize($translate.instant("policy.head.REMOVED_RULE"))}</div>`;
                    } else {
                        let type = params.data.state
                            ? colourMap[params.data.state]
                            : colourMap["customer-rule"];
                        return `<div class="sample ${type}">${$sanitize($translate.instant(`policy.head.${type.replace("-", "_").toUpperCase()}`))}</div>`;
                    }
                }
            }
            $scope.isGlobalChecked = false;
            $scope.check = function() {
                if (!$scope.isGlobalChecked) {
                    $scope.isGlobalChecked = true;
                    $scope.gridOptions.api.forEachNode(function(node) {
                        node.setSelected(true);
                        node.data.expanded = false;
                    });
                    document.getElementById("global-checkbox").checked = true;
                    $scope.gridOptions.api.redrawRows();
                    $scope.removable = true;
                } else {
                    $scope.isGlobalChecked = false;
                    $scope.gridOptions.api.forEachNode(function(node) {
                        node.setSelected(false);
                    });
                    document.getElementById("global-checkbox").checked = false;
                    $scope.removable = false;
                }
            };
            $scope.gridOptions = {
                headerHeight: 56,
                rowHeight: 56,
                animateRows: true,
                enableColResize: true,
                angularCompileRows: true,
                suppressDragLeaveHidesColumns: true,
                columnDefs: columnDefs,
                rowData: null,
                onSelectionChanged: onSelectionChanged,
                rowSelection: "multiple",
                suppressRowClickSelection: true,
                suppressScrollOnNewData: true,
                // rowModelType: "infinite",
                // paginationPageSize: 20,
                // maxConcurrentDatasourceRequests: 2,
                // cacheBlockSize: 20,
                // infiniteInitialRowCount: 20,
                // maxBlocksInCache: 15,
                rowClassRules: {
                    "disabled-row": function(params) {
                        if (!params.data) return;
                        return !!params.data.disable;
                    }
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

            const renderNetworkRule = function(data, options) {
              $scope.eof = data.length < PAGE_SIZE;
              policyService.rules = policyService.rules.concat(data);
              policyService.rules = policyService.rules.map(function(element) {
                  element.allowed = element.action === "allow";
                  if (element.cfg_type === CFG_TYPE.LEARNT) element.state = STATE_LEARNED;
                  if (element.cfg_type === CFG_TYPE.CUSTOMER) element.state = STATE_CUSTOMER;
                  if (element.cfg_type === CFG_TYPE.FED) element.state = STATE_FED;
                  if (element.disable) element.state = STATE_DISABLED;
                  if (element.cfg_type === CFG_TYPE.GROUND_RULE) {
                      element.state = STATE_GROUND_RULE;
                      countOfGroundRule++;
                  }
                  element.apps = element.applications.map(function(item) {
                      return { name: item };
                  });
                  return element;
              });
              $scope.rules = policyService.rules;
              $rootScope.isPolicyDirty = false;
              $scope.count = `${policyService.rules.length} ${getEntityName(
                  policyService.rules.length
              )}`;
              if (filter) {
                  $scope.onFilter(filter);
              } else {
                  $scope.refreshCache($scope.rules);
              }
            };

            const handleError = function(err) {
              console.warn("policy" + err);
              $scope.rules = [];
              $scope.rulesErr = true;
              $scope.rulesErrMSG = Utils.getErrorMessage(err);
              $scope.refreshCache($scope.rules);
            };

            function requestPolicy() {
                $scope.rulesErr = false;
                countOfGroundRule = 0;
                policyService.rules = [];
                $scope.eof = false;
                Utils.loadPagedData(
                  POLICY_URL,
                  {
                    start: 0,
                    limit: PAGE_SIZE,
                    scope: "fed"
                  },
                  null,
                  renderNetworkRule,
                  handleError
                );
            }
            function requestPolicyApplication() {
                policyService.policyAppErr = false;
                $http
                    .get(POLICY_APP_URL)
                    .then(function(response) {
                        policyService.appList.length = 0;
                        for (let index in response.data.list.application) {
                            policyService.appList.push({
                                name: response.data.list.application[index]
                            });
                        }
                        return requestPolicy();
                    })
                    .catch(function(error) {
                        console.warn(error);
                        policyService.policyAppErr = true;
                        policyService.policyAppErrMSG = Utils.getErrorMessage(error);
                        return requestPolicy();
                    });
            }
            function requestHosts() {
                policyService.groupErr = false;
                $http
                    .get(NODES_URL)
                    .then(function(response) {
                        if (response.data && response.data.hosts) {
                            response.data.hosts.forEach(function(host) {
                                policyService.groupList.push("Host:" + host.name);
                            });
                        }
                        return requestPolicyApplication();
                    })
                    .catch(function(error) {
                        console.warn(error);
                        policyService.groupErr = true;
                        policyService.groupErrMSG = Utils.getErrorMessage(error);
                        return requestPolicyApplication();
                    });
            }
            function requestGroup() {
                policyService.groupErr = false;
                $http
                    .get(GROUP_LIST_URL, {params: {scope: "fed"}})
                    .then(function(response) {
                        $rootScope.isReset = false;
                        policyService.groupList = response.data.groups.map(group => group.name);
                        return requestPolicyApplication();
                    })
                    .catch(function(error) {
                        console.warn(error);
                        policyService.groupErr = true;
                        policyService.groupErrMSG = Utils.getErrorMessage(error);
                        return requestPolicyApplication();
                    });
            }
            $scope.reload = function() {
                requestGroup();
            };
        }
        $scope.refreshCache = function(content) {
            // $scope.dataSource = {
            //     rowCount: null,
            //     getRows: function(params) {
            //         $timeout(function() {
            //             let rowsThisPage = content.slice(params.startRow, params.endRow);
            //             let lastRow = -1;
            //             if (content.length <= params.endRow) {
            //                 lastRow = content.length;
            //             }
            //             params.successCallback(rowsThisPage, lastRow);
            //         }, 100);
            //     }
            // };
            // $scope.gridOptions.api.setDatasource($scope.dataSource);
            $scope.gridDataIds = content.map(row => row.id);
            content.push({
              id: "",
              from: "Deny deployments that don't match any of above allowed rules for any applications/ports.",
              to: "",
              application: [],
              ports: "",
              action: "",
              last_modified_timestamp: ""
            });
            $scope.gridOptions.api.setRowData(content);
        };
        $scope.reload();
        $scope.tooltip = $translate.instant("policy.TIP.DISABLE");
        $scope.getTooltip = function(disabled) {
            if (disabled) {
                $scope.tooltip = $translate.instant("policy.TIP.ENABLE");
            } else {
                $scope.tooltip = $translate.instant("policy.TIP.DISABLE");
            }
        };
        $scope.isPolicyDirty = function() {
            return $rootScope.isPolicyDirty;
        };
        $scope.globalCheck = false;
        $scope.onFilter = function(search) {
            filter = search;
            if (search !== undefined && search.length > 0) {
                let filteredRules = [];
                policyService.rules.forEach(function(rule) {
                    let regex = new RegExp("^.*" + escape(search.toLowerCase()) + ".*$");
                    let filterableValue = Object.values(rule)
                        .join(" ")
                        .toLowerCase();
                    if (regex.test(escape(filterableValue))) {
                        filteredRules.push(rule);
                    }
                });
                if (filteredRules.length === policyService.rules.length) {
                    $scope.count = `${policyService.rules.length} ${getEntityName(
                        policyService.rules.length
                    )}`;
                } else {
                    $scope.count = `${found} ${filteredRules.length} ${getEntityName(
                        filteredRules.length
                    )} ${outOf} ${policyService.rules.length} ${getEntityName(
                        policyService.rules.length
                    )}`;
                }
                $scope.refreshCache(filteredRules);
            } else {
                $scope.count = `${policyService.rules.length} ${getEntityName(
                    policyService.rules.length
                )}`;
                $scope.removable = false;
                $scope.refreshCache(policyService.rules);
            }
        };
        $scope.toggleRule = function(index) {
            policyService.rules[index].state = STATE_MODIFIED;
            policyService.rules[index].disable = !policyService.rules[index].disable;
            $scope.rules = policyService.rules;
            $rootScope.isPolicyDirty = true;
        };
        function onSelectionChanged(event) {
            $scope.selectedRules = $scope.gridOptions.api.getSelectedRows();
            let rowCount = $scope.selectedRules.length;
            let globalCheckboxElem = document.getElementById("global-checkbox");
            if (rowCount > 0) {
                $scope.removable = true;
                if (rowCount === policyService.rules.length) {
                    globalCheckboxElem.checked = true;
                } else {
                    let partialCheckedClass = document.getElementsByClassName(
                        "partial-checked"
                    );
                    if (partialCheckedClass.length === 0) {
                        globalCheckboxElem.classList.add("partial-checked");
                    }
                }
            } else {
                globalCheckboxElem.classList.remove("partial-checked");
                $scope.removable = false;
            }
            $scope.gridOptions.api.sizeColumnsToFit();
            $scope.$apply();
        }
        $scope.addPolicy = function(ev, id) {
            $rootScope.isReset = true;
            let success = function() {
                policyService.index4Add = id === -1 ? 0 + countOfGroundRule : getIndex(id) + 1;
                let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                    $scope.gridDataIds.findIndex(gridDataId => gridDataId == id)
                );
                if (id !== -1) rowNode.setSelected(true);
                $scope.isDialogOpen = true;
                $mdDialog
                    .show({
                        controller: DialogController4AddPolicy,
                        templateUrl: "dialog.addPolicy.html",
                        targetEvent: ev,
                        locals: {
                          policyService: policyService
                        }
                    })
                    .then(
                        function() {
                            keepAlive();
                            $scope.rules = policyService.rules;
                            $scope.onlyRemove = false;
                            // $scope.gridOptions.api.updateRowData({addIndex: policyService.index4Add, add: policyService.newRules});
                            // policyService.newRules = [];
                            $scope.gridOptions.api.refreshInfiniteCache();
                            $timeout(() => {
                                // let newRowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(policyService.index4Add);
                                // let rowNodes = [];
                                // rowNodes.push(newRowNode);
                                // $scope.gridOptions.api.redrawRows({rowNodes: rowNodes});
                                // rowNodes  = [];
                                if (id !== -1) rowNode.setSelected(false);
                                $scope.isDialogOpen = false;
                                $scope.gridOptions.api.redrawRows();
                                $scope.gridOptions.api.ensureIndexVisible(policyService.index4Add, "top");
                                $scope.onFilter(filter);
                            }, 400);
                        },
                        function() {
                            $scope.isDialogOpen = false;
                            $scope.refreshCache($scope.rules);
                            $scope.search = "";
                            $timeout(function() {
                                $rootScope.isReset = false;
                            }, 500);
                        }
                    );
            };

            let error = function() {};
            Utils.keepAlive(success, error);
        };
        function getIndex(id) {
            return policyService.rules.findIndex(rule => rule.id == id);
        }
        $scope.editPolicy = function(ev, id) {
            $rootScope.isReset = true;
            let success = function() {
                policyService.index4edit = getIndex(id);
                let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                    $scope.gridDataIds.findIndex(gridDataId => gridDataId == id)
                );
                rowNode.setSelected(true);
                $scope.isDialogOpen = true;
                $mdDialog
                    .show({
                        controller: DialogController4EditPolicy,
                        templateUrl: "dialog.editPolicy.html",
                        targetEvent: ev,
                        locals: {
                          policyService: policyService
                        }
                    })
                    .then(
                        function() {
                            keepAlive();
                            let rowNodes = [];
                            rowNodes.push(rowNode);
                            $scope.gridOptions.api.redrawRows({ rowNodes: rowNodes });
                            rowNodes = [];
                            rowNode.setSelected(false);
                            $scope.rules = policyService.rules;
                            $scope.onlyRemove = false;
                            $scope.isDialogOpen = false;
                            $scope.onFilter(filter);
                        },
                        function() {
                            rowNode.setSelected(false);
                            $scope.isDialogOpen = false;
                            $scope.refreshCache($scope.rules);
                            $scope.search = "";
                            $timeout(function() {
                                $rootScope.isReset = false;
                            }, 500);
                        }
                    );
            };
            let error = function() {};
            Utils.keepAlive(success, error);
        };

        $scope.undeleteRuleItem = function(event, id) {
            let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
              $scope.gridDataIds.findIndex(gridDataId => gridDataId == id)
            );
            Alertify.confirm(
                $translate.instant("policy.dialog.UNREMOVE") +
                $sanitize(id >= NEW_ID_SEED ? `New-${id - NEW_ID_SEED + 1}` : id) +
                "?"
            ).then(
                function onOk() {
                    keepAlive();
                    policyService.rules[getIndex(id)].remove = false;
                    $scope.rules = policyService.rules;
                    $rootScope.isPolicyDirty = true;
                    $scope.onFilter(filter);
                    rowNode.setSelected(false);
                },
                function onCancel() {
                    rowNode.setSelected(false);
                }
            );
        };

        $scope.deleteRuleItem = function(event, id) {
            if (
                event.target.id === "remove-selected-row" &&
                $scope.selectedRules &&
                $scope.selectedRules.length > 0
            ) {
                $scope.selectedRules.forEach(function(selectedRule) {
                    policyService.index4Delete = getIndex(selectedRule.id);
                    let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                        $scope.gridDataIds.findIndex(gridDataId => gridDataId == selectedRule.id)
                    );
                    rowNode.setSelected(true);
                    $timeout(function() {
                        Alertify.confirm(
                            $translate.instant("policy.dialog.REMOVE") +
                            $sanitize(selectedRule.id >= NEW_ID_SEED
                                ? `New-${selectedRule.id - NEW_ID_SEED + 1}`
                                : selectedRule.id) +
                            "?"
                        ).then(
                            function onOk() {
                                keepAlive();
                                // policyService.rules.splice(getIndex(selectedRule.id), 1);
                                policyService.rules[getIndex(selectedRule.id)].remove = true;
                                $scope.rules = policyService.rules;
                                $rootScope.isPolicyDirty = true;
                                $scope.onFilter(filter);
                                rowNode.setSelected(false);
                            },
                            function onCancel() {
                                rowNode.setSelected(false);
                            }
                        );
                    }, 200);
                });
            } else {
                $scope.isDialogOpen = true;
                policyService.index4Delete = getIndex(id);
                let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                    $scope.gridDataIds.findIndex(gridDataId => gridDataId == id)
                );
                rowNode.setSelected(true);
                $timeout(function() {
                    Alertify.confirm(
                        $translate.instant("policy.dialog.REMOVE") +
                        $sanitize(id >= NEW_ID_SEED ? `New-${id - NEW_ID_SEED + 1}` : id) +
                        "?"
                    ).then(
                        function onOk() {
                            keepAlive();
                            // policyService.rules.splice(getIndex(id), 1);
                            policyService.rules[getIndex(id)].remove = true;
                            $scope.rules = policyService.rules;
                            $rootScope.isPolicyDirty = true;
                            $scope.onFilter(filter);
                            rowNode.setSelected(false);
                            $scope.isDialogOpen = false;
                        },
                        function onCancel() {
                            rowNode.setSelected(false);
                            $scope.isDialogOpen = false;
                        }
                    );
                }, 200);
            }
        };
        $scope.reset = function() {
            $scope.eof = false;
            $scope.rulesErr = false;
            $rootScope.isReset = true;
            $scope.gridOptions.api.stopEditing();
            $scope.reload();
            $scope.onlyRemove = true;
            $scope.removable = false;
        };
        $scope.disableRuleItem = function(id) {
            let index4Disable = getIndex(id);
            policyService.rules[index4Disable].disable = !policyService.rules[
                index4Disable
                ].disable;
            policyService.rules[index4Disable].state = STATE_MODIFIED;
            $scope.gridOptions.api.redrawRows();
            $scope.rules = policyService.rules;
            $scope.onlyRemove = false;
            $rootScope.isPolicyDirty = true;
        };
        $scope.numericOnly = function(evt) {
            $scope.invalid = false;
            let enterable = Utils.numericTextInputOnly(evt);
            if (enterable) {
                document.getElementById("move-btn").disabled = false;
            }
        };
        $scope.toggled = function(open) {
            if (!open) {
                document.getElementById("after").value = "";
                document.getElementById("before").value = "";
                document.getElementById("after").disabled = false;
                document.getElementById("before").disabled = false;
                document.getElementById("move-btn").disabled = true;
                $scope.invalid = false;
            }
        };
        $scope.moveRules = function() {
            keepAlive();
            let cursor = 0;
            // let insertCursor = $scope.after ? $scope.after - 0 : $scope.before - 1;
            let after = document.getElementById("after").value;
            let before = document.getElementById("before").value;
            let targetRuleId = parseInt(after ? after : before, 10);
            let targetOrder = null;
            for (let i = 0; i < policyService.rules.length; i++) {
                if (targetRuleId === policyService.rules[i].id) {
                    targetOrder = i;
                    break;
                }
            }
            if (!targetOrder && targetOrder !== 0) {
                $scope.invalid = true;
            } else {
                $scope.invalid = false;
                let insertCursor = after ? targetOrder + 1 : targetOrder;
                for (
                    let selectedRulesIdx = 0;
                    selectedRulesIdx < $scope.selectedRules.length;
                    selectedRulesIdx++
                ) {
                    while (cursor < policyService.rules.length) {
                        if (
                            $scope.selectedRules[selectedRulesIdx].id ===
                            policyService.rules[cursor].id
                        ) {
                            if ($scope.selectedRules[selectedRulesIdx].id === targetRuleId) {
                                $scope.selectedRules.splice(parseInt(selectedRulesIdx, 10), 1);
                                selectedRulesIdx--;
                            } else {
                                if (cursor < insertCursor) insertCursor--;
                                policyService.rules.splice(cursor, 1);
                            }
                            break;
                        }
                        cursor++;
                    }
                }
                $scope.selectedRules = $scope.selectedRules.map(selectedRule => {
                  if (selectedRule.state !== STATE_MODIFIED && selectedRule.state !== STATE_NEW){
                    selectedRule.state = STATE_MOVED;
                  }
                  return selectedRule;
                });
                policyService.rules.splice(insertCursor, 0, ...$scope.selectedRules);
                $scope.rules = policyService.rules;
                $rootScope.isPolicyDirty = true;
                $scope.onlyRemove = false;
                $scope.gridOptions.api.deselectAll();
                $scope.gridOptions.api.refreshInfiniteCache();
                $timeout(() => {
                    $scope.refreshCache($scope.rules);
                }, 400);
                document.getElementById("policy-move-list").click();
            }
        };

        $scope.submit = function(ev) {
            let submittingRules = JSON.parse(JSON.stringify(policyService.rules));
            $scope.payload = {};
            Alertify.confirm($translate.instant("policy.POLICY_DEPLOY_CONFIRM")).then(
                function onOk() {
                    $rootScope.isReset = true;
                    let deletedRules = submittingRules
                    .map(function(rule) {
                      if (rule.remove) {
                        return rule.id;
                      }
                    })
                    .filter(x => !!x);

                    submittingRules = submittingRules
                        .map(function(rule) {
                            if (rule.state !== STATE_NEW && rule.state !== STATE_MODIFIED && !rule.remove){
                              return {id: rule.id};
                            } else {
                              if (rule.state === STATE_NEW) rule.id = 0;
                              if (!rule.remove) return rule;
                            }
                        })
                        .filter(x => !!x);
                    if ($scope.onlyRemove && deletedRules.length > 0) {
                      $scope.payload = { delete: deletedRules };
                    } else {
                      $scope.payload = { rules: submittingRules, delete: deletedRules };
                    }
                    console.log("Federated network rules (Submit): ", $scope.payload);
                    let data = pako.gzip(JSON.stringify($scope.payload));
                    data = new Blob([data], {type: 'application/gzip'});
                    let config = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Encoding': 'gzip'
                        }
                    };
                    $http
                        .patch(`${POLICY_URL}?scope=fed`, data, config)
                        .then(function() {
                            $timeout(() => {
                                $scope.reload();
                                $rootScope.isPolicyDirty = false;
                                $scope.onlyRemove = true;
                                $rootScope.isReset = false;
                            }, 2000);
                            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                            Alertify.success(
                                $translate.instant("policy.dialog.content.SUBMIT_OK")
                            );
                        })
                        .catch(function(error) {
                            $scope.rules = policyService.rules;
                            if (
                                USER_TIMEOUT.indexOf(error.status) < 0
                            ) {
                                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                                Alertify.error(
                                  Utils.getAlertifyMsg(error, $translate.instant("policy.dialog.content.SUBMIT_NG"), false)
                                );
                            }
                        });
                },
                function onCancel() {}
            );
        };
        $scope.$on("$locationChangeStart", function($event, next, current) {
            if (!$rootScope.isReset) {
                if (
                    $rootScope.isPolicyDirty &&
                    !confirm($translate.instant("policy.dialog.reminder.MESSAGE"))
                ) {
                    $event.preventDefault();
                }
            }
        });
        DialogController4AddPolicy.$inject = ["$scope", "$mdDialog", "$sanitize", "policyService"];
        function DialogController4AddPolicy($scope, $mdDialog, $sanitize, policyService) {
            $scope.groupErr = policyService.groupErr;
            $scope.policyAppErr = policyService.policyAppErr;
            $scope.groupErrMSG = policyService.groupErrMSG;
            $scope.policyAppErrMSG = policyService.policyAppErrMSG;
            activate();
            function activate() {
                makeAutoCompleteList();
                $scope.hide = function() {
                    $mdDialog.hide();
                };
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.cutStringByMaxLength = function(str, itemName) {
                    let cuttedStr = Utils.restrictLength4Autocomplete(
                        str,
                        parseInt($translate.instant("general.FILTER_MAX_LEN"), 10)
                    );
                    switch (itemName) {
                        case "searchTextFrom":
                            $scope.searchTextFrom = cuttedStr;
                            break;
                        case "searchTextTo":
                            $scope.searchTextTo = cuttedStr;
                            break;
                    }
                };
            }
            $scope.loadTags = function(query) {
                return query ? policyService.appList.filter(createFilter(query)) : [];
            };
            function createFilter(query) {
                let lowercaseQuery = angular.lowercase(query);
                return function filterFn(app) {
                    return app.name.toLowerCase().indexOf(lowercaseQuery) >= 0;
                };
            }
            function makeAutoCompleteList() {
                let self = this;
                $scope.groups = loadAll();
                $scope.selectedItemFrom = null;
                $scope.selectedItemTo = null;
                $scope.searchTextFrom = null;
                $scope.searchTextTo = null;
                $scope.isDisabled = false;
                function loadAll() {
                    let allGroup = policyService.groupList;
                    return allGroup.map(function(group) {
                        return {
                            value: group,
                            display: group
                        };
                    });
                }
            }
            //
            $scope.newRule = {
                id: 0,
                ports: "",
                apps: []
            };
            $scope.addNewRule = function(ev) {
                $scope.newRule.id = sequence++;
                if (
                    typeof policyService.rules.find(function(element) {
                        return element.id === $scope.newRule.id;
                    }) !== "undefined"
                ) {
                    $scope.duplicatedPolicy = true;
                } else {
                    $scope.duplicatedPolicy = false;
                    $scope.newRule.allowed = !!$scope.newRule.allowed;
                    $scope.newRule.action = $scope.newRule.allowed ? "allow" : "deny";
                    if ($scope.newRule.apps && $scope.newRule.apps.length > 0) {
                        $scope.newRule.applications = $scope.newRule.apps.map(function(
                            item
                        ) {
                            return item.name;
                        });
                    } else {
                        $scope.newRule.applications = [];
                    }
                    $scope.newRule.state = STATE_NEW;
                    $scope.newRule.learned = false;
                    $scope.newRule.disable = false;
                    $scope.newRule.cfg_type = CFG_TYPE.FED;
                    try {
                        if ($scope.selectedItemFrom === null) {
                            $scope.newRule.from = $scope.searchTextFrom;
                        } else {
                            $scope.newRule.from = $scope.selectedItemFrom.value;
                        }
                        if ($scope.selectedItemTo === null) {
                            $scope.newRule.to = $scope.searchTextTo;
                        } else {
                            $scope.newRule.to = $scope.selectedItemTo.value;
                        }
                        policyService.rules.splice(
                            policyService.index4Add,
                            0,
                            $scope.newRule
                        );
                        policyService.newRules.push($scope.newRule);
                        $rootScope.isPolicyDirty = true;
                        $mdDialog.hide();
                    } catch (e) {}
                }
            };
        }
        DialogController4EditPolicy.$inject = ["$scope", "$mdDialog", "$sanitize", "policyService"];
        function DialogController4EditPolicy($scope, $mdDialog, $sanitize, policyService) {
            $scope.groupErr = policyService.groupErr;
            $scope.policyAppErr = policyService.policyAppErr;
            $scope.groupErrMSG = policyService.groupErrMSG;
            $scope.policyAppErrMSG = policyService.policyAppErrMSG;
            activate();
            function activate() {
                makeAutoCompleteList();
                //Keep original value of selected policy
                if (
                    policyService.rules[policyService.index4edit].state === "bg-green-100"
                )
                    $scope.editId = "";
                else $scope.editId = policyService.rules[policyService.index4edit].id;
                $scope.searchTextFrom =
                    policyService.rules[policyService.index4edit].from;
                $scope.searchTextTo = policyService.rules[policyService.index4edit].to;
                $scope.editApps = JSON.parse(
                    JSON.stringify(policyService.rules[policyService.index4edit].apps)
                );
                $scope.editApps =
                    Array.isArray($scope.editApps) &&
                    $scope.editApps.length > 0 &&
                    $scope.editApps[0].name === "any"
                        ? [{ name: $translate.instant("enum.ANY") }]
                        : $scope.editApps;
                $scope.editPorts = policyService.rules[policyService.index4edit].ports
                    .split(",")
                    .join(", ");
                $scope.editPorts =
                    $scope.editPorts === "any"
                        ? $translate.instant("enum.ANY")
                        : $scope.editPorts;
                $scope.editComment =
                    policyService.rules[policyService.index4edit].comment;
                $scope.editAllowed =
                    policyService.rules[policyService.index4edit].allowed;
                $scope.editStatus = !policyService.rules[policyService.index4edit]
                    .disable;
                $scope.hide = function() {
                    $mdDialog.hide();
                };
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.cutStringByMaxLength = function(str, itemName) {
                    let cuttedStr = Utils.restrictLength4Autocomplete(
                        str,
                        parseInt($translate.instant("general.FILTER_MAX_LEN"), 10)
                    );
                    switch (itemName) {
                        case "searchTextFrom":
                            $scope.searchTextFrom = cuttedStr;
                            break;
                        case "searchTextTo":
                            $scope.searchTextTo = cuttedStr;
                            break;
                    }
                };
            }
            $scope.loadTags = function(query) {
                return query ? policyService.appList.filter(createFilter(query)) : [];
            };
            function createFilter(query) {
                let lowercaseQuery = angular.lowercase(query);
                return function filterFn(app) {
                    return app.name.toLowerCase().indexOf(lowercaseQuery) >= 0;
                };
            }
            $scope.editRule = function(ev) {
                if (
                    typeof policyService.rules.find(function(element) {
                        return element.id === $scope.editId;
                    }) !== "undefined" &&
                    $scope.editId !== policyService.rules[policyService.index4edit].id
                ) {
                    $scope.duplicatedPolicy = true;
                } else {
                    $scope.duplicatedPolicy = false;
                    // policyService.rules[policyService.index4edit].id = $scope.editId;
                    policyService.rules[policyService.index4edit].comment =
                        $scope.editComment;
                    policyService.rules[policyService.index4edit].allowed =
                        $scope.editAllowed;
                    policyService.rules[
                        policyService.index4edit
                        ].action = $scope.editAllowed ? "allow" : "deny";
                    policyService.rules[
                        policyService.index4edit
                        ].disable = !$scope.editStatus;
                    policyService.rules[policyService.index4edit].cfg_type = CFG_TYPE.FED;

                    if ($scope.editApps && $scope.editApps.length > 0) {
                        policyService.rules[
                            policyService.index4edit
                            ].applications = $scope.editApps.map(function(item) {
                            if (item.name === $translate.instant("enum.ANY"))
                                item.name = "any";
                            return item.name;
                        });
                    } else {
                        policyService.rules[policyService.index4edit].applications = [];
                    }
                    policyService.rules[policyService.index4edit].apps = angular.copy(
                        $scope.editApps
                    );
                    policyService.rules[policyService.index4edit].ports =
                        $scope.editPorts === $translate.instant("enum.ANY")
                            ? "any"
                            : $scope.editPorts;
                    if (policyService.rules[policyService.index4edit].state !== STATE_NEW)
                        policyService.rules[
                            policyService.index4edit
                            ].state = STATE_MODIFIED;
                    try {
                        policyService.rules[policyService.index4edit].from =
                          $scope.selectedItemFrom === null
                              ? $scope.searchTextFrom
                              : $scope.selectedItemFrom.value;
                        policyService.rules[policyService.index4edit].to =
                          $scope.selectedItemTo === null
                              ? $scope.searchTextTo
                              : $scope.selectedItemTo.value;
                        $rootScope.isPolicyDirty = true;
                        $mdDialog.hide();
                    } catch (e) {}
                }
            };
            $scope.switchPermit = function(index) {
                policyService.rules[index].allowed = !policyService.rules[index]
                    .allowed;
                policyService.rules[index].action = policyService.rules[index].allowed
                    ? "allow"
                    : "deny";
            };
            function makeAutoCompleteList() {
                $scope.groups = loadAll();
                $scope.applicatios = policyService.appList;
                $scope.selectedItemFrom = null;
                $scope.selectedItemTo = null;
                $scope.searchTextFrom = null;
                $scope.searchTextTo = null;
                $scope.isDisabled = false;
                function loadAll() {
                    let allGroup = policyService.groupList;
                    return allGroup.map(function(group) {
                        return {
                            value: group,
                            display: group
                        };
                    });
                }
            }
        }
    }
})();
