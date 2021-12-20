(function() {
    "use strict";

    angular
        .module("app.assets")
        .controller("FederalPolicyFileAccessRulesController", FederalPolicyFileAccessRulesController);

    FederalPolicyFileAccessRulesController.$inject = [
        "$scope",
        "$mdDialog",
        "filterFilter",
        "$filter",
        "$http",
        "$translate",
        "$timeout",
        "$window",
        "$interval",
        "$sanitize",
        "Alertify",
        "Utils",
        "AuthorizationFactory"
    ];
    function FederalPolicyFileAccessRulesController(
        $scope,
        $mdDialog,
        filterFilter,
        $filter,
        $http,
        $translate,
        $timeout,
        $window,
        $interval,
        $sanitize,
        Alertify,
        Utils,
        AuthorizationFactory
    ) {

        let isFed = AuthorizationFactory.getDisplayFlag("multi_cluster");
        $scope.isWriteRuleAuthorized = AuthorizationFactory.getDisplayFlag("write_group") && isFed;

        let filterKey = "";
        $scope.fileErr = false;

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

        activate();

        function activate() {
            let resizeEvent = "resize.ag-grid";
            let $win = $($window);

            let getEntityName = function(count) {
                return Utils.getEntityName(
                    count,
                    $translate.instant("group.file.COUNT_POSTFIX")
                );
            };
            const outOf = $translate.instant("enum.OUT_OF");
            const found = $translate.instant("enum.FOUND");

            $scope.forAll = false;
            angular.element($window).bind("resize", function() {
                $scope.ruleGridHeight = $window.innerHeight - 305;
                $scope.$digest();
            });

            function dateComparator(value1, value2, node1, node2) {
                /** @namespace node1.data.last_modified_timestamp */
                return (
                    node1.data.last_modified_timestamp -
                    node2.data.last_modified_timestamp
                );
            }

            const filterPrefix = [
                {
                    headerName: $translate.instant("group.GROUP"),
                    field: "group"
                },
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
                typeColumn,
                timeColumn
            ];
            const predefinedFilterColumns = [...filterPrefix, actionColumn];

            function profileTypeRenderFunc(params) {
                if (params && params.value) {
                    return `<div class="action-label nv-label ${colourMap[params.value.toUpperCase()]}">${$sanitize($translate.instant(
                      `group.${params.value.toUpperCase()}`
                    ))}</div>`;
                }
            }

            function onSelectionChanged4File() {
                $scope.onPredefinedFilterView = false;
                if ($scope.gridFile && $scope.gridFile.api) {
                    let selectedRows = $scope.gridFile.api.getSelectedRows();
                    if (selectedRows.length > 0) {
                        $timeout(function() {
                            $scope.fileEntry = selectedRows[0];
                        });
                    }
                }
            }

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

            $scope.getFileProfile = function(groupName) {
                $scope.fileErr = false;
                $scope.groups = [];
                $scope.fullGroupList = [];
                $scope.gridFile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                    "general.NO_ROWS"
                )}</span>`;
                $http
                .get(FILE_PROFILE_URL, {params: {scope: "fed"}})
                .then(function(response) {
                    $scope.fileProfiles = response.data.profiles.flatMap((profile) => {
                        if (profile.filters.length > 0) {
                            $scope.groups.push(profile.group);
                        }
                        $scope.fullGroupList.push(profile.group.name);
                        return profile.filters.map((filter) => {
                            if (filter.applications && filter.applications.length > 0) {
                                filter.apps = filter.applications.map(function(item) {
                                    return { name: item };
                                });
                            } else {
                                filter.apps = filter.applications;
                            }
                            return Object.assign(filter, {group: profile.group});
                        });
                    });
                    getGroups();
                    console.log($scope.fileProfiles);
                    $scope.files4Group = $scope.fileProfiles.filter((profile) => {
                        if (groupName) return groupName === profile.group;
                        else return true;
                    });
                    $scope.ruleGridHeight = $window.innerHeight - 305;
                    $timeout(function() {
                        if ($scope.gridFile.api) {
                            $scope.gridFile.api.setRowData($scope.files4Group);
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
                    $scope.onFilterChanged(filterKey);
                })
                .catch(function(err) {
                    console.warn(err);
                    $scope.fileErr = true;
                    if (err.status !== 404) {
                        $scope.gridFile.overlayNoRowsTemplate = Utils.getOverlayLoadingTemplate(err);
                    }
                    $scope.gridFile.api.setRowData();
                });
            };

            function getGroups() {
                $http
                  .get(GROUP_URL, {params: {scope: "fed"}})
                  .then(function(response) {
                      $scope.fullGroupList = response.data.map((group) => {
                          return group.name;
                      }).filter((groupName) => {
                          return KIND_EXCEPTION_MAP.file.indexOf(groupName) === -1;
                      });
                  })
                  .catch(function(error) {
                      console.warn(error);
                  });
            }

            $scope.onFilterChanged = function(value) {
                $scope.onPredefinedFilterView = false;
                $scope.gridFile.api.setQuickFilter(value);
                let node = $scope.gridFile.api.getDisplayedRowAtIndex(0);
                if (node) {
                    node.setSelected(true);
                }
                filterKey = value;
                renderCount(value);
            };

            function renderCount(value) {
                let filteredCount = $scope.gridFile.api.getModel().rootNode
                    .childrenAfterFilter.length;
                $scope.count =
                    filteredCount === $scope.gridFile.length || value === ""
                        ? `${$scope.files4Group.length} ${getEntityName(
                        $scope.files4Group.length
                        )}`
                        : `${found} ${filteredCount} ${getEntityName(
                        filteredCount
                        )} ${outOf} ${$scope.files4Group.length} ${getEntityName(
                        $scope.files4Group.length
                        )}`;
            }

            $scope.getFileProfile();

            $scope.changeName = function(selectedGroup) {
                $scope.onPredefinedFilterView = false;
                if (selectedGroup && selectedGroup !== "All") {
                    $scope.files4Group = $scope.fileProfiles.filter((profile) => {
                        return profile.group === selectedGroup;
                    });
                } else {
                    $scope.files4Group = $scope.fileProfiles;
                }
                $timeout(() => {
                    $scope.gridFile.api.forEachNode(function(node, index) {
                        if(index === 0) {
                            node.setSelected(true);
                            $scope.gridFile.api.ensureNodeVisible(node);
                        }
                    });
                },200);
                $scope.gridFile.api.setRowData($scope.files4Group);
                $scope.onFilterChanged(filterKey);
            };

            $scope.addFilter = function(ev) {
                $scope.onPredefinedFilterView = false;
                let success = function() {
                    $mdDialog
                        .show({
                            locals: {
                                group: $scope.selectedGroup || "",
                                groups: Utils.removeGroupExceptions($scope.fullGroupList, "file"),
                                fileAccessFilterSample: FILE_ACCESS_FILTER_SAMPLE
                            },
                            controller: FileDialogController,
                            templateUrl: "filter.add.html",
                            targetEvent: ev
                        })
                        .then(
                            function() {
                                $timeout(function() {
                                    $scope.getFileProfile($scope.selectedGroup);
                                }, 500);
                            },
                            function() {}
                        );
                };
                let error = function() {};

                Utils.keepAlive(success, error);
            };

            const PROFILE_DELETE_CONFIRMATION = $translate.instant(
                "service.PROFILE_DELETE_CONFIRMATION"
            );
            $scope.removeFilter = function(rule) {
                $scope.onPredefinedFilterView = false;
                Alertify.confirm(PROFILE_DELETE_CONFIRMATION).then(
                    function onOk() {
                        $http
                            .patch(FILE_PROFILE_URL, {
                                group: $scope.fileEntry.group,
                                fileMonitorConfigData: {
                                    config: {
                                        delete_filters: [rule]
                                    }
                                }
                            },
                            {params: {scope: "fed"}})
                            .then(function() {
                                $scope.fileEntry = null;
                                $timeout(function() {
                                    $scope.getFileProfile($scope.selectedGroup);
                                }, 500);
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

            $scope.editFilter = function(ev) {
                $scope.onPredefinedFilterView = false;
                let success = function() {
                    $mdDialog
                        .show({
                            locals: {
                                rule: angular.copy($scope.fileEntry),
                                group: $scope.fileEntry.group || "",
                                groups: Utils.removeGroupExceptions($scope.fullGroupList, "file"),
                                fileAccessFilterSample: FILE_ACCESS_FILTER_SAMPLE
                            },
                            controller: FileEditDialogController,
                            templateUrl: "filter.edit.html",
                            targetEvent: ev
                        })
                        .then(
                            function() {
                                $timeout(function() {
                                    $scope.getFileProfile(
                                        $scope.selectedGroup && $scope.selectedGroup.length > 0 ?  $scope.selectedGroup : ""
                                    );
                                }, 500);
                            },
                            function() {}
                        );
                };
                let error = function() {};

                Utils.keepAlive(success, error);
            };
        }

        FileDialogController.$inject = ["$scope", "$http", "$mdDialog", "$sanitize", "group", "groups", "fileAccessFilterSample"];
        function FileDialogController($scope, $http, $mdDialog, $sanitize, group, groups, fileAccessFilterSample) {
            activate();

            function activate() {
                $scope.fileAccessFilterSample = fileAccessFilterSample;
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.selectedGroup = group;
                $scope.groups = groups;

                $scope.addFilter = function(rule) {
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
                    rule.cfg_type = CFG_TYPE.FED;

                    $http
                        .patch(FILE_PROFILE_URL, {
                            group: $scope.selectedGroup,
                            fileMonitorConfigData: {
                                config: {
                                    add_filters: [rule]
                                }
                            }
                        },
                        {params: {scope: "fed"}})
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
            "$sanitize",
            "rule",
            "group",
            "groups",
            "fileAccessFilterSample"
        ];
        function FileEditDialogController($scope, $http, $mdDialog, $sanitize, rule, group, groups, fileAccessFilterSample) {
            activate();

            function activate() {
                if (rule.applications && rule.applications.length > 0) {
                    rule.apps = rule.applications.map(function(item) {
                        return { name: item };
                    });
                } else rule.apps = rule.applications;
                $scope.fileAccessFilterSample = fileAccessFilterSample;

                $scope.rule = rule;

                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                $scope.selectedGroup = group;
                $scope.groups = groups;

                $scope.updateFilter = function(rule) {
                    if (rule.apps && rule.apps.length > 0) {
                        rule.applications = rule.apps.map(function(item) {
                            return item.name;
                        });
                    } else {
                        rule.applications = [];
                    }
                    if (!rule.recursive) rule.recursive = false;
                    rule.cfg_type = CFG_TYPE.FED;

                    $http
                        .patch(FILE_PROFILE_URL, {
                            group: $scope.selectedGroup,
                            fileMonitorConfigData: {
                                config: {
                                    update_filters: [rule]
                                }
                            }
                        },
                        {params: {scope: "fed"}})
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
    }
})();
