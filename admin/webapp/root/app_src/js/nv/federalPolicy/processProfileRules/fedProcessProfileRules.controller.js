(function() {
    "use strict";

    angular
        .module("app.assets")
        .controller("FederalPolicyProcessProfileRulesController", FederalPolicyProcessProfileRulesController);

    FederalPolicyProcessProfileRulesController.$inject = [
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
    function FederalPolicyProcessProfileRulesController(
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
        $scope.serviceErr = false;

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

        activate();

        function activate() {
            let resizeEvent = "resize.ag-grid";
            let $win = $($window);

            let getEntityName = function(count) {
                return Utils.getEntityName(
                    count,
                    $translate.instant("group.profile.COUNT_POSTFIX")
                );
            };
            const outOf = $translate.instant("enum.OUT_OF");
            const found = $translate.instant("enum.FOUND");

            $scope.forAll = false;
            angular.element($window).bind("resize", function() {
                $scope.graphHeight = $window.innerHeight - 305;
                $scope.$digest();
            });

            function dateComparator(value1, value2, node1, node2) {
                /** @namespace node1.data.last_modified_timestamp */
                return (
                    node1.data.last_modified_timestamp -
                    node2.data.last_modified_timestamp
                );
            }

            let profileColumnDefs = [
                {
                    headerName: $translate.instant("group.GROUP"),
                    headerCheckboxSelection: function(params) {
                        console.log("Header: ", $scope.selectedGroup, params);
                        return $scope.isWriteRuleAuthorized && $scope.selectedGroup;
                    },
                    headerCheckboxSelectionFilteredOnly: true,
                    checkboxSelection: function(params) {
                        console.log("Rows: ", $scope.selectedGroup);
                        return $scope.isWriteRuleAuthorized && $scope.selectedGroup;
                    },
                    field: "group"
                },
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

            function profileTypeRenderFunc(params) {
                if (params && params.value) {
                    return `<div class="action-label nv-label ${colourMap[params.value.toUpperCase()]}">${$sanitize($translate.instant(
                      `group.${params.value.toUpperCase()}`
                    ))}</div>`;
                }
            }

            function onSelectionChanged4Profile() {
                if ($scope.gridProfile && $scope.gridProfile.api) {
                    $scope.selectedRows = $scope.gridProfile.api.getSelectedRows();
                    if ($scope.selectedRows.length > 0) {
                        $timeout(function() {
                            $scope.profileEntry = $scope.selectedRows[0];
                        });
                    }
                }
                $scope.$apply();
            }

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
                rowSelection: "single",
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
                )}</span>`
            };

            $scope.getProcessProfile = function(groupName) {
                $scope.profileErr = false;
                $scope.groups = [];
                $scope.fullGroupList = [];
                $scope.gridProfile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                    "general.NO_ROWS"
                )}</span>`;
                $http
                    .get(PROCESS_PROFILE_URL, {params: {scope: "fed"}})
                    .then(function(response) {
                        $scope.profiles = response.data.process_profiles.flatMap((profile) => {
                            if (profile.process_list.length > 0) {
                                $scope.groups.push(profile.group);
                            }
                            $scope.fullGroupList.push(profile.group);
                            return profile.process_list.map((process) => {
                                return Object.assign(process, {group: profile.group});
                            });
                        });
                        getGroups();
                        console.log($scope.profiles);
                        $scope.profiles4Group = $scope.profiles.filter((profile) => {
                            if (groupName) return groupName === profile.group;
                            else return true;
                        });
                        $scope.ruleGridHeight = $window.innerHeight - 305;
                        $timeout(function() {
                            if ($scope.gridProfile.api) {
                                $scope.gridProfile.api.setRowData($scope.profiles4Group);
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
                        $scope.onFilterChanged(filterKey);
                    })
                    .catch(function(err) {
                        console.warn(err);
                        $scope.profileErr = true;
                        if (err.status !== 404) {
                            $scope.gridProfile.overlayNoRowsTemplate = Utils.getOverlayLoadingTemplate(err);
                        }
                        $scope.gridProfile.api.setRowData();
                    });
            };

            $scope.onFilterChanged = function(value) {
                $scope.gridProfile.api.setQuickFilter(value);
                filterKey = value;
                let node = $scope.gridProfile.api.getDisplayedRowAtIndex(0);
                if (node) {
                    node.setSelected(true);
                }
                renderCount(value);
            };

            function getGroups() {
                $http
                  .get(GROUP_URL, {params: {scope: "fed"}})
                  .then(function(response) {
                      $scope.fullGroupList = response.data.map((group) => {
                          return group.name;
                      }).filter((groupName) => {
                          return KIND_EXCEPTION_MAP.process.indexOf(groupName) === -1;
                      });
                  })
                  .catch(function(error) {
                      console.warn(error);
                  });
            }


            function renderCount(value) {
                let filteredCount = $scope.gridProfile.api.getModel().rootNode
                    .childrenAfterFilter.length;
                $scope.count =
                    filteredCount === $scope.gridProfile.length || value === ""
                        ? `${$scope.profiles4Group.length} ${getEntityName(
                        $scope.profiles4Group.length
                        )}`
                        : `${found} ${filteredCount} ${getEntityName(
                        filteredCount
                        )} ${outOf} ${$scope.profiles4Group.length} ${getEntityName(
                        $scope.profiles4Group.length
                        )}`;
            }

            $scope.getProcessProfile();

            const PROFILE_DELETE_CONFIRMATION = $translate.instant(
                "service.PROFILE_DELETE_CONFIRMATION"
            );

            $scope.removeProfile = function() {
                Alertify.confirm(PROFILE_DELETE_CONFIRMATION).then(
                    function onOk() {
                        $http
                            .patch(PROCESS_PROFILE_URL, {
                                process_profile_config: {
                                    group: $scope.profileEntry.group,
                                    process_delete_list: $scope.selectedRows
                                }
                            },
                            {params: {scope: "fed"}})
                            .then(function() {
                                $scope.profileEntry = null;
                                $timeout(function() {
                                    $scope.getProcessProfile($scope.selectedGroup);
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

            $scope.changeName = function(selectedGroup) {
                $scope.selectedGroup = selectedGroup === "All" ? "" : selectedGroup;
                if (selectedGroup && selectedGroup !== "All") {
                    $scope.profiles4Group = $scope.profiles.filter((profile) => {
                        return profile.group === selectedGroup;
                    });
                    $scope.gridProfile.rowSelection = "multiple";
                } else {
                    $scope.profiles4Group = $scope.profiles;
                    $scope.gridProfile.rowSelection = "single";
                }
                $scope.gridProfile.api.setColumnDefs(profileColumnDefs);
                $timeout(() => {
                    $scope.gridProfile.api.forEachNode(function(node, index) {
                        if(index === 0) {
                            node.setSelected(true);
                            $scope.gridProfile.api.ensureNodeVisible(node);
                        }
                    });
                    $scope.gridProfile.api.redrawRows();
                    $scope.gridProfile.api.setRowData($scope.profiles4Group);
                    $scope.gridProfile.api.sizeColumnsToFit();
                    $scope.onFilterChanged(filterKey);
                },200);
            }

            $scope.addProfile = function(ev) {
                let success = function() {
                    $mdDialog
                        .show({
                            locals: {
                                group: $scope.selectedGroup || "",
                                groups: Utils.removeGroupExceptions($scope.fullGroupList, "process"),
                                processProfileSample: PROCESS_PROFILE_SAMPLE
                            },
                            controller: DialogController,
                            templateUrl: "profile.add.html",
                            targetEvent: ev
                        })
                        .then(
                            function() {
                                $timeout(function() {
                                    $scope.getProcessProfile($scope.selectedGroup);
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
                                group: $scope.profileEntry.group || "",
                                groups: Utils.removeGroupExceptions($scope.fullGroupList, "process"),
                                processProfileSample: PROCESS_PROFILE_SAMPLE
                            },
                            controller: EditDialogController,
                            templateUrl: "profile.edit.html",
                            targetEvent: ev
                        })
                        .then(
                            function() {
                                $timeout(function() {
                                    $scope.getProcessProfile(
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

        DialogController.$inject = ["$scope", "$http", "$mdDialog", "$sanitize", "group", "groups", "processProfileSample"];
        function DialogController($scope, $http, $mdDialog, $sanitize, group, groups, processProfileSample) {
            activate();

            function activate() {
                $scope.processProfileSample = processProfileSample;
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };
                console.log(group)
                $scope.selectedGroup = group;
                $scope.groups = groups;

                $scope.addProfile = function(rule) {
                    if (rule.allowed) rule.action = "allow";
                    else rule.action = "deny";
                    rule.cfg_type = CFG_TYPE.FED;

                    $http
                        .patch(PROCESS_PROFILE_URL, {
                            process_profile_config: {
                                group: $scope.selectedGroup,
                                process_change_list: [rule]
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

        EditDialogController.$inject = [
            "$scope",
            "$http",
            "$mdDialog",
            "$sanitize",
            "rule",
            "group",
            "groups",
            "processProfileSample"
        ];
        function EditDialogController($scope, $http, $mdDialog, $sanitize, rule, group, groups, processProfileSample) {
            activate();

            function activate() {
                $scope.processProfileSample = processProfileSample;
                $scope.rule = rule;
                $scope.selectedGroup = group;
                $scope.groups = groups;
                let originalRule = angular.copy(rule);

                $scope.cancel = function() {
                    $mdDialog.cancel();
                };

                $scope.updateProfile = function(rule) {
                    if (rule.allowed) rule.action = "allow";
                    else rule.action = "deny";
                    rule.cfg_type = CFG_TYPE.FED;
                    rule.name = $sanitize(rule.name);
                    rule.path = $sanitize(rule.path);

                    $http
                        .patch(PROCESS_PROFILE_URL, {
                            process_profile_config: {
                                group: $scope.selectedGroup,
                                process_delete_list: [originalRule],
                                process_change_list: [rule]
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
