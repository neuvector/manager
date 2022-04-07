(function() {
    "use strict";

    angular.module("app.common").controller("FederalPolicyGroupController", FederalPolicyGroupController);

    FederalPolicyGroupController.$inject = [
        "$scope",
        "$http",
        "$mdDialog",
        "$translate",
        "$timeout",
        "$sanitize",
        "$window",
        "Utils",
        "Alertify",
        "$filter",
        "AuthorizationFactory"
    ];
    function FederalPolicyGroupController(
        $scope,
        $http,
        $mdDialog,
        $translate,
        $timeout,
        $sanitize,
        $window,
        Utils,
        Alertify,
        $filter,
        AuthorizationFactory
    ) {
        let isFed = AuthorizationFactory.getDisplayFlag("multi_cluster");
        $scope.isWriteGroupAuthorized = AuthorizationFactory.getDisplayFlag("write_group") && isFed;

        $scope.forAll = false;
        let filter = "";
        const PROFILE_DELETE_CONFIRMATION = $translate.instant(
            "service.PROFILE_DELETE_CONFIRMATION"
        );


        activate();

        ////////////////////

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
            const outOf = $translate.instant("enum.OUT_OF");
            const found = $translate.instant("enum.FOUND");
            const PAGE_SIZE = PAGE.FED_GROUPS;

            $scope.eof = false;
            $scope.title = "fa-edit";
            $scope.mode = "view";
            $scope.onRulePreview = false;
            $scope.onResponseRulePreview = false;
            $scope.addingGroup = false;
            $scope.hasGroupss = false;
            $scope.colorMap = colourMap;
            $scope.modes = ["discover", "monitor", "protect"];


            // $scope.gridHeight = $window.innerHeight - 260 - 365;
            $scope.gridHeight = $window.innerHeight - 310;
            if ($scope.gridHeight < 213) $scope.gridHeight = 213;
            // $scope.ruleGridHeight =
            //     $window.innerHeight - $scope.gridHeight - 410;
            // $scope.memberGridHeight =
            //     $window.innerHeight - $scope.gridHeight - 410;
            angular.element($window).bind("resize", function() {
                // $scope.gridHeight = $window.innerHeight - 260 - 365;
                $scope.gridHeight = $window.innerHeight - 310;
                if ($scope.gridHeight < 213) $scope.gridHeight = 213;
                // $scope.ruleGridHeight =
                //     $window.innerHeight - $scope.gridHeight - 410;
                // $scope.memberGridHeight =
                //     $window.innerHeight - $scope.gridHeight - 410;
                $scope.$digest();
            });

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

            let columnDefs4Group = [
                // {
                //     headerName: $scope.isWriteGroupAuthorized
                //         ? `　.　${$translate.instant("group.gridHeader.NAME")}`
                //         : $translate.instant("group.gridHeader.NAME"),
                //     checkboxSelection: function(params) {
                //         if (params.data) {
                //             return params.data.cap_change_mode && $scope.isWriteGroupAuthorized;
                //         }
                //         return false;
                //     },
                //     field: "name",
                //     cellRenderer: function(params) {
                //         if (params.data.cap_change_mode && $scope.isWriteGroupAuthorized) {
                //             return params.value;
                //         } else {
                //             return `<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${
                //                 params.value
                //                 }</span>`;
                //         }
                //     },
                //     width: 150
                // },
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
                    headerName: $translate.instant("policy.addPolicy.COMMENT"),
                    field: "comment",
                    width: 250
                },
                {
                    headerName: $translate.instant("group.gridHeader.USED_BY_RULES"),
                    field: "policy_rules",
                    cellRenderer: function(params) {
                        let result = "";
                        if (params.value && params.value.length > 0) {
                            forEach(params.value, function(item) {
                                if (item >= 100000)
                                    result += `<span class="label ${
                                      colourMap["FEDERAL"]
                                      } mr-sm" ng-mouseenter="onEnter(${item})" ng-mouseleave="onLeave()">${$sanitize(item)}</span>`;
                                else if (item >= 10000)
                                    result += `<span class="label ${
                                        colourMap["LEARNED"]
                                        } mr-sm" ng-mouseenter="onEnter(${item})" ng-mouseleave="onLeave()">${$sanitize(item)}</span>`;
                                else
                                    result += `<span class="label ${
                                        colourMap["CUSTOM"]
                                        } mr-sm" ng-mouseenter="onEnter(${item})" ng-mouseleave="onLeave()">${$sanitize(item)}</span>`;
                            });
                        }
                        return result;
                    },
                    width: 200
                },
                {
                    headerName: $translate.instant(
                        "group.gridHeader.USED_BY_RESPONSE_RULES"
                    ),
                    field: "response_rules",
                    cellRenderer: function(params) {
                        let result = "";
                        if (params.value && params.value.length > 0) {
                            forEach(params.value, function(item) {
                                result += `<span class="label ${
                                    colourMap["CUSTOM"]
                                    } mr-sm" ng-mouseenter="onResponseRuleEnter(${item})" ng-mouseleave="onResponseRuleLeave()">${$sanitize(item)}</span>`;
                            });
                        }
                        return result;
                    },
                    width: 200
                }
            ];

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
                // rowSelection: "multiple",
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

            $scope.checkAll = function() {
                if (!isCheckAll) {
                    isCheckAll = true;
                    $scope.gridGroup.api.forEachNode(node => {
                        if (node.data.cap_change_mode) {
                            console.log(node.data)
                            node.setSelected(true);
                            node.data.expanded = false;
                        }
                    });
                    $("#global-checkbox").prop("checked", true);
                    $scope.gridGroup.api.redrawRows();
                } else {
                    isCheckAll = false;
                    $scope.gridGroup.api.forEachNode(node => {
                        node.setSelected(false);
                    });
                    $("#global-checkbox").prop("checked", false);
                }
            };

            $scope.onFilterChanged = function(value) {
                filter = value;
                $scope.gridGroup.api.setQuickFilter(value);
                let node = $scope.gridGroup.api.getDisplayedRowAtIndex(0);
                if (node) {
                    $scope.hasGroups = true;
                    $scope.group = node.data;
                    node.setSelected(true);
                    onSelectionChanged4Group();
                } else {
                    $scope.hasGroups = false;
                }
                let filteredCount = $scope.gridGroup.api.getModel().rootNode
                    .childrenAfterFilter.length;
                $scope.count =
                    filteredCount === $scope.groups.length || value === ""
                        ? `${$scope.groups.length} ${getEntityName($scope.groups.length)}`
                        : `${found} ${filteredCount} ${getEntityName(
                        filteredCount
                        )} ${outOf} ${$scope.groups.length} ${getEntityName(
                        $scope.groups.length
                        )}`;
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
                return truncate(params.data.id, 12);
            }

            function innerCellRenderer(params) {
                return $sanitize(params.data.display_name);
            }

            let columnDefs4Members = [
                {
                    headerName: $translate.instant("group.gridHeader.NAME"),
                    field: "display_name",
                    cellRenderer: "agGroupCellRenderer",
                    cellRendererParams: { innerRenderer: innerCellRenderer }
                },
                { headerName: "Id", valueGetter: idGetter, width: 100 },
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
                            return `<span class="label label-warning">${$sanitize(displayState)}</span>`;
                        else if (params.value === "discover")
                            return `<span class="label label-info">${$sanitize(displayState)}</span>`;
                        else if (params.value === "protect")
                            return `<span class="label label-green">${$sanitize(displayState)}</span>`;
                        else if (params.value === "unmanaged")
                            return `<span class="label label-danger">${$sanitize(displayState)}</span>`;
                        else if (params.value === "monitor")
                            return `<span class="label label-primary">${$sanitize(displayState)}</span>`;
                        else if (params.value === "quarantined")
                            return `<span class="label label-pink">${$sanitize(displayState)}</span>`;
                        else
                            return `<span class="label label-inverse">${$sanitize(displayState)}</span>`;
                    },
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
              if ($scope.hideSystemGroup) {
                  $scope.groups = $scope.groups.filter(function(item) {
                      return !item.platform_role;
                  });
              }
              setRowData4Group($scope.groups);
              // $scope.refreshCache($scope.groups);
              $scope.hasGroups = $scope.groups.length > 0;
              setTimeout(function() {
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
              }, 50);
              $scope.count = `${$scope.groups.length} ${getEntityName(
                  $scope.groups.length
              )}`;
              $scope.onFilterChanged(filter);
            }

            const handleError = function(err) {
              console.warn(err);
              $scope.hasGroups = false;
              $scope.groups = [];
              $scope.groupErr = true;
              $scope.gridGroup.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
              $scope.gridGroup.api.setRowData4Group($scope.groups);
            };

            $scope.refresh = function() {
                $scope.onFormatError = false;
                $scope.groupErr = false;
                $scope.eof = false;
                $scope.groups = [];

                Utils.loadPagedData(
                  GROUP_URL,
                  {
                    scope: "fed",
                    start: 0,
                    limit: PAGE_SIZE
                  },
                  null,
                  renderGroups,
                  handleError
                );
            };

            // $scope.refreshCache = function(content) {
            //   $scope.dataSource = {
            //     rowCount: null,
            //     getRows: function(params) {
            //       $timeout(function() {
            //         let rowsThisPage = content.slice(params.startRow, params.endRow);
            //         let lastRow = -1;
            //         if (content.length <= params.endRow) {
            //           lastRow = content.length;
            //         }
            //         params.successCallback(rowsThisPage, lastRow);
            //       }, 100);
            //     }
            //   };
            //   $scope.gridGroup.api.setDatasource($scope.dataSource);
            // };

            $scope.refresh();

            function getSelectedRows() {
                let selectedRows = $scope.gridGroup.api.getSelectedRows();
                let selectedindex4NonMode = selectedRows.findIndex(row => {
                    return !row.cap_change_mode;
                });
                if (selectedRows.length > 1 && selectedindex4NonMode != -1) {
                    let index = $scope.groups.findIndex(group => {
                        return selectedRows[selectedindex4NonMode].name === group.name;
                    });
                    let rowNode = $scope.gridGroup.api.getDisplayedRowAtIndex(index);
                    rowNode.setSelected(false);
                    selectedRows = $scope.gridGroup.api.getSelectedRows();
                    // $scope.prepareChildPanelData(selectedRows);
                } else {
                    $scope.is4SwitchMode = true;
                }
                return selectedRows;
            }

            function onSelectionChanged4Group() {
                $scope.isMultipleSelecting = false;
                $scope.hasSelectedGroups = true;
                $scope.displayedMultiGroup = [];
                let selectedRows = getSelectedRows();
                let count4HasMode = $scope.groups.filter(group => {
                    return group.cap_change_mode;
                }).length;
                $scope.forAll = selectedRows.length === count4HasMode;

                console.log(selectedRows);
                $scope.displayedMultiGroup = selectedRows;
                if (selectedRows.length > 1) {
                    $scope.isMultipleSelecting = true;
                    console.log($scope.isMultipleSelecting);

                    if (selectedRows.length < count4HasMode) {
                        $("#global-checkbox").addClass("partial-checked");
                    } else {
                        $("#global-checkbox").removeClass("partial-checked");
                    }
                    setTimeout(function() {
                        $scope.$apply();
                    }, 50);
                } else if (selectedRows.length === 1) {
                    $scope.is4SwitchMode = false;
                    $scope.group = angular.copy(selectedRows[0]);
                    $scope.isGroundRule = $scope.group.cfg_type === CFG_TYPE.GROUND;
                    setTimeout(function() {
                        // $scope.memberGridOptions.api.setRowData($scope.group.members);
                        // $scope.memberGridOptions.api.sizeColumnsToFit();
                        $scope.$apply();
                    }, 50);
                    if ($scope.selectedIndex === 1) {
                        $scope.getProcessProfile($scope.group.name);
                    } else if ($scope.selectedIndex === 2) {
                        $scope.getFileProfile($scope.group.name);
                    } else if ($scope.selectedIndex === 3) {
                        if ($scope.group.name.substring(0, 3) >= "nv.") {
                            $scope.getServiceRules($scope.group.name.substring(3));
                        } else {
                            $scope.getServiceRules("");
                        }
                    }
                    if (
                        selectedRows.length < count4HasMode &&
                        selectedRows[0].cap_change_mode
                    ) {
                        $("#global-checkbox").addClass("partial-checked");
                    } else {
                        $("#global-checkbox").removeClass("partial-checked");
                        $("#global-checkbox").prop("checked", false);
                    }
                    // $scope.prepareChildPanelData(selectedRows);
                } else {
                    console.log("no row selected")
                    $scope.hasSelectedGroups = false;
                    $("#global-checkbox").removeClass("partial-checked");
                    // $scope.prepareChildPanelData();
                    setTimeout(function() {
                        $scope.$apply();
                    }, 50);
                }
            }

            $scope.addGroup = function() {
                let success = function() {
                    $mdDialog
                        .show({
                            controller: DialogController4AddGroup,
                            templateUrl: "dialog.addGroup.html",
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

            $scope.editGroup = function(event, isEditable) {
                let success = function() {
                    $mdDialog
                        .show({
                            controller: DialogController4EditGroup,
                            templateUrl: "dialog.editGroup.html",
                            locals: {
                                selectedGroup: $scope.group,
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
                    $translate.instant("group.REMOVE_CONFIRM") + " - " + $sanitize(group.name);
                Alertify.confirm(confirmBox).then(
                    function toOK() {
                        $http
                            .delete(GROUP_URL, { params: { name: group.name, scope: "fed" } })
                            .then(function() {
                                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                                Alertify.success(
                                    $translate.instant("group.REMOVE_OK_MSG")
                                );
                                $timeout(function() {
                                    $scope.refresh();
                                }, 3000);
                            })
                            .catch(function(e) {
                                if (USER_TIMEOUT.indexOf(e.status) < 0 ) {
                                    Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                                    console.log(e.data);
                                    Alertify.error(
                                      Utils.getAlertifyMsg(e, $translate.instant("group.REMOVE_ERR_MSG"), false)
                                    );
                                }
                            });
                    },
                    function toCancel() {
                    }
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

            $scope.getServiceRules = function(groupName) {
                $scope.gridRules.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                    "general.NO_ROWS"
                )}</span>`;
                if (groupName === "") {
                    $scope.gridRules.api.setRowData([]);
                } else {
                    $http
                        .get(SERVICE_URL, { params: { name: groupName } })
                        .then(function(response) {
                            $scope.service = response.data.service;
                            renderServiceRules($scope.service.policy_rules);
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


            $scope.getProcessProfile = function(groupName) {
                if ($scope.gridProfile.api) {
                    $scope.gridProfile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                        "general.NO_ROWS"
                    )}</span>`;
                    if (groupName === "") {
                        $scope.gridProfile.api.setRowData([]);
                    } else {
                        $http
                            .get(PROCESS_PROFILE_URL, {
                                params: { name: groupName }
                            })
                            .then(function(response) {
                                $scope.profile = response.data.process_profile.process_list;
                                $timeout(function() {
                                    if ($scope.gridProfile.api) {
                                        $scope.gridProfile.api.setRowData($scope.profile);
                                        $scope.gridProfile.api.forEachNode(function(node, index) {
                                            if ($scope.profileEntry) {
                                                if (
                                                    node.data.name === $scope.profileEntry.name &&
                                                    node.data.path === $scope.profileEntry.path
                                                ) {
                                                    node.setSelected(true);
                                                    $scope.gridProfile.api.ensureNodeVisible(node);
                                                }
                                            } else if (index === 0) {
                                                node.setSelected(true);
                                                $scope.gridProfile.api.ensureNodeVisible(node);
                                            }
                                        });
                                        $scope.gridProfile.api.sizeColumnsToFit();
                                    }
                                });
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
                if ($scope.gridFile.api) {
                    $scope.gridFile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                        "general.NO_ROWS"
                    )}</span>`;
                    if (groupName === "") {
                        $scope.gridFile.api.setRowData([]);
                    } else {
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
                                $timeout(function() {
                                    if ($scope.gridFile.api) {
                                        $scope.gridFile.api.setRowData($scope.fileProfile);
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
                            return `<span class="label label-fs label-${labelCode}">${$sanitize(mode)}</span>`;
                        } else return null;
                    },
                    width: 90,
                    maxWidth: 90,
                    minWidth: 90
                },
                {
                    headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
                    field: "last_modified_timestamp",
                    cellRenderer: function(params) {
                        if (params.value) {
                            return $sanitize($filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss"));
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

            let profileColumnDefs = [
                {
                    headerName: $translate.instant("service.gridHeader.NAME"),
                    field: "name"
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
                            return `<span class="label label-fs label-${labelCode}">${$sanitize(mode)}</span>`;
                        } else return null;
                    },
                    width: 90,
                    maxWidth: 90,
                    minWidth: 90
                },
                {
                    headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
                    field: "last_modified_timestamp",
                    cellRenderer: function(params) {
                        if (params.value) {
                            return $sanitize($filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss"));
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
            const actionColumn = {
                headerName: $translate.instant("policy.addPolicy.DENY_ALLOW"),
                field: "behavior",
                cellRenderer: function(params) {
                    if (params.value) {
                        let mode = Utils.getI18Name(params.value);
                        let labelCode = colourMap[params.value];
                        if (!labelCode) labelCode = "info";
                        return `<span class="label label-fs label-${labelCode}">${$sanitize(mode)}</span>`;
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
                        return $sanitize($filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss"));
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
                timeColumn
            ];
            const predefinedFilterColumns = [...filterPrefix, actionColumn];

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

            function onSelectionChanged4Profile() {
                if ($scope.gridProfile && $scope.gridProfile.api) {
                    let selectedRows = $scope.gridProfile.api.getSelectedRows();
                    if (selectedRows.length > 0) {
                        $timeout(function() {
                            $scope.profileEntry = selectedRows[0];
                        });
                    }
                }
            }

            function onSelectionChanged4File() {
                if ($scope.gridFile && $scope.gridFile.api) {
                    let selectedRows = $scope.gridFile.api.getSelectedRows();
                    if (selectedRows.length > 0) {
                        $timeout(function() {
                            $scope.fileEntry = selectedRows[0];
                        });
                    }
                }
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

            $scope.gridProfile = {
                headerHeight: 30,
                rowHeight: 30,
                enableSorting: false,
                enableColResize: true,
                angularCompileRows: true,
                suppressDragLeaveHidesColumns: true,
                columnDefs: profileColumnDefs,
                rowData: null,
                animateRows: true,
                rowSelection: "single",
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
                )}</span>`
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
                onGridReady: function(params) {
                    setTimeout(function() {
                        params.api.sizeColumnsToFit();
                    }, 0);
                },
                overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
                    "general.NO_ROWS"
                )}</span>`
            };

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
                            locals: { group: $scope.group.name },
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
                                rule: $scope.fileEntry,
                                group: $scope.group.name
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
                                if (
                                    USER_TIMEOUT.indexOf(err.status) < 0
                                ) {
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

            $scope.removeProfile = function(profile) {
                Alertify.confirm(PROFILE_DELETE_CONFIRMATION).then(
                    function onOk() {
                        $http
                            .patch(PROCESS_PROFILE_URL, {
                                process_profile_config: {
                                    group: $scope.group.name,
                                    process_delete_list: [profile]
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
                                if (
                                    USER_TIMEOUT.indexOf(err.status) < 0
                                ) {
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
                            locals: { group: $scope.group.name },
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
                                rule: $scope.profileEntry,
                                group: $scope.group.name
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

            function getMessage(id) {
                return (
                    $translate.instant("topbar.mode.SWITCH") +
                    $translate.instant("enum." + id.toUpperCase()) +
                    $translate.instant("topbar.mode.MODE") +
                    "?"
                );
            }

            $scope.switchServiceMode = function(mode) {
                if (filter.length > 0) $scope.forAll = false;
                if ($scope.forAll) {
                    Alertify.confirm(getMessage(mode)).then(
                        function onOk() {
                            $http
                                .patch(SERVICE_ALL, { policy_mode: mode })
                                .then(function() {
                                    Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                                    Alertify.success($translate.instant("service.ALL_SUBMIT_OK"));
                                    $timeout(function() {
                                        $scope.refresh();
                                    }, 2000);
                                })
                                .catch(function(error) {
                                    console.warn(error);
                                    if (
                                        USER_TIMEOUT.indexOf(error.status) < 0
                                    ) {
                                        Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                                        Alertify.error(
                                          Utils.getAlertifyMsg(error, $translate.instant("service.ALL_SUBMIT_FAILED"), false)
                                        );
                                    }
                                });
                        },
                        function onCancel() {}
                    );
                } else {
                    Alertify.confirm(getMessage(mode)).then(
                        function onOk() {
                            let selectedRows = $scope.gridGroup.api.getSelectedRows();
                            if (selectedRows && selectedRows.length > 0) {
                                let serviceList = selectedRows.map(function(element) {
                                    return element.name.substring(3);
                                });

                                serviceList = serviceList.filter(service =>
                                    RegExp(`.*${filter}.*`, "g").test(service)
                                );

                                $http
                                    .patch(SERVICE_URL, {
                                        config: { services: serviceList, policy_mode: mode }
                                    })
                                    .then(function() {
                                        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                                        Alertify.success(
                                            $translate.instant("service.ALL_SUBMIT_OK")
                                        );
                                        $timeout(function() {
                                            $scope.refresh();
                                        }, 2000);
                                    })
                                    .catch(function(error) {
                                        console.warn(error);
                                        if (
                                            USER_TIMEOUT.indexOf(error.status) < 0
                                        ) {
                                            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                                            Alertify.error(
                                              Utils.getAlertifyMsg(error, $translate.instant("service.ALL_SUBMIT_FAILED"), false)
                                            );
                                        }
                                    });
                            }
                        },
                        function onCancel() {}
                    );
                }
            };

        }

        $scope.onMax = false;

        $scope.togglePanel = function() {
            $scope.onMax = !$scope.onMax;
            if ($scope.onMax) $scope.gridHeight = $window.innerHeight - 315;
            else $scope.gridHeight = $window.innerHeight - 260 - 365;
        };
    }

    DialogController4AddGroup.$inject = [
        "$scope",
        "$mdDialog",
        "$translate",
        "$sanitize",
        "$http",
        "$timeout",
        "Utils",
        "Alertify"
    ];
    function DialogController4AddGroup(
        $scope,
        $mdDialog,
        $translate,
        $sanitize,
        $http,
        $timeout,
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
              name: "fed.",
              criteria: [],
              comment: ""
            };
            $scope.nameRegex = /^(fed\.)/;

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
                $scope.group.cfg_type = CFG_TYPE.FED;
                $http
                    .post(GROUP_URL, $scope.group)
                    .then(function(res) {
                        console.log(res);
                        $mdDialog.hide();
                        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                        Alertify.success(
                            $translate.instant("group.addGroup.OK_MSG")
                        );
                    })
                    .catch(function(e) {
                        if (USER_TIMEOUT.indexOf(e.status) < 0 ) {
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
        "$sanitize",
        "$http",
        "$timeout",
        "Utils",
        "Alertify",
        "selectedGroup",
        "isEditable"
    ];
    function DialogController4EditGroup(
        $scope,
        $mdDialog,
        $translate,
        $sanitize,
        $http,
        $timeout,
        Utils,
        Alertify,
        selectedGroup,
        isEditable
    ) {
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $scope.group = angular.copy(selectedGroup);
            $mdDialog.cancel();
        };
        $scope.isEditable = isEditable;
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

            $scope.editGroup = function() {
                $http
                    .patch(GROUP_URL, $scope.group)
                    .then(function(res) {
                        console.log(res);
                        $mdDialog.hide();
                        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                        Alertify.success(
                            $translate.instant("group.editGroup.OK_MSG")
                        );
                    })
                    .catch(function(e) {
                        if (USER_TIMEOUT.indexOf(e.status) < 0 ) {
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
    FileDialogController.$inject = ["$scope", "$http", "$mdDialog", "group", "Utils", "Alertify"];
    function FileDialogController($scope, $http, $mdDialog, group, Utils, Alertify) {
        activate();

        function activate() {
            $scope.cancel = function() {
                $mdDialog.cancel();
            };

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
                        group: group,
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
                        if (
                            USER_TIMEOUT.indexOf(err.status) < 0
                        ) {
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
        "rule",
        "group",
        "Utils",
        "Alertify"
    ];
    function FileEditDialogController($scope, $http, $mdDialog, rule, group, Utils, Alertify) {
        activate();

        function activate() {
            if (rule.applications && rule.applications.length > 0) {
                rule.apps = rule.applications.map(function(item) {
                    return { name: item };
                });
            } else rule.apps = rule.applications;

            $scope.rule = rule;

            $scope.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.updateFilter = function(rule) {
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
                        group: group,
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
                        if (
                            USER_TIMEOUT.indexOf(err.status) < 0
                        ) {
                            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                            Alertify.error(
                              Utils.getAlertifyMsg(err, $translate.instant("general.FAILED_TO_UPDATE"), false)
                            );
                        }
                    });
            };
        }
    }

    DialogController.$inject = ["$scope", "$http", "$mdDialog", "group", "Utils", "Alertify"];
    function DialogController($scope, $http, $mdDialog, group, Utils, Alertify) {
        activate();

        function activate() {
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
                        if (
                            USER_TIMEOUT.indexOf(err.status) < 0
                        ) {
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
        "rule",
        "group",
        "Utils",
        "Alertify"
    ];
    function EditDialogController($scope, $http, $mdDialog, rule, group, Utils, Alertify) {
        activate();

        function activate() {
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
                        if (
                            USER_TIMEOUT.indexOf(err.status) < 0
                        ) {
                            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                            Alertify.error(
                              Utils.getAlertifyMsg(err, $translate.instant("general.FAILED_TO_UPDATE"), false)
                            );
                        }
                    });
            };
        }
    }
})();
