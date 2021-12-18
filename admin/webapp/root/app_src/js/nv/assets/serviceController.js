(function() {
  "use strict";

  angular
    .module("app.assets")
    .controller("ServiceController", ServiceController);

  ServiceController.$inject = [
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
    "$controller",
    "$state"
  ];
  function ServiceController(
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
    $controller,
    $state
  ) {
    const resource = {
      switchMode: {
        global: 2,
        namespace: 2
      },
      writeRule: {
        global: 2,
        namespace: 2
      }
    };

    const vm = this;

    $scope.isSwitchModeAuthorized = Utils.isAuthorized(
      $scope.user.roles,
      resource.switchMode
    );
    $scope.isWriteRuleAuthorized = Utils.isAuthorized(
      $scope.user.roles,
      resource.writeRule
    );
    vm.selectedIndex = 0;
    const LOW_RESOLUTION_HEIGHT_LIMIT = 800;
    let filterKey = "";
    $scope.serviceErr = false;
    let prevSelectedName = "";
    let serviceDisplayRowCount =
      $window.innerHeight > LOW_RESOLUTION_HEIGHT_LIMIT ? 6 : 4;
    $window.addEventListener("resize", function() {
      serviceDisplayRowCount =
        $window.innerHeight > LOW_RESOLUTION_HEIGHT_LIMIT ? 6 : 4;
      let hostNum = $scope.services.length;
      if (hostNum < 2) $scope.serviceGridHeight = 37 + 30 * 2;
      else if (hostNum < serviceDisplayRowCount)
        $scope.serviceGridHeight = 30 + 30 * hostNum;
      else $scope.serviceGridHeight = 30 + 30 * serviceDisplayRowCount;
      $scope.ruleGridHeight =
        $window.innerHeight - $scope.serviceGridHeight - 374;
    });
    $scope.$on("$destory", function() {
      $window.removeEventListener("resize");
    });

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window);

      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("service.COUNT_POSTFIX")
        );
      };
      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");

      $scope.forAll = false;

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
                params.value +
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
              return `<span class="label label-fs label-${labelCode}">${mode}</span>`;
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
              return $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss");
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
              return `<span class="label label-fs label-${labelCode}">${mode}</span>`;
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
              return $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss");
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
            return `<span class="label label-fs label-${labelCode}">${mode}</span>`;
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
            return $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss");
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
            return params.value.join(", ");
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

      $scope.toggleSystemService = function(hideService) {
        $scope.hideSystemService = hideService;
        if (hideService) {
          if ($scope.services) {
            $scope.services = $scope.services.filter(function(item) {
              return !item.platform_role;
            });
            $scope.gridService.api.setRowData($scope.services);

            $scope.count = `${$scope.services.length} ${getEntityName(
              $scope.services.length
            )}`;

            $scope.onFilterChanged(filterKey);
          }
        } else $scope.refresh();
      };

      $scope.reviewRule = function() {
        $scope.onRule = true;
        $scope.rule.allowed = $scope.rule.action === "allow";
      };

      $scope.updateRule = function(rule) {
        Alertify.confirm($translate.instant("policy.RULE_DEPLOY_CONFIRM")).then(
          function onOk() {
            if (rule.id === 0) {
              $scope.rule.action = rule.allowed ? "allow" : "deny";
              $http
                .post(POLICY_RULE_URL, $scope.rule)
                .then(function() {
                  Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                  Alertify.success(
                    $translate.instant("network.RULE_DEPLOY_OK")
                  );
                  $scope.onRule = false;
                })
                .catch(function(err) {
                  console.log(err);
                  if (
                    USER_TIMEOUT.indexOf(err.status) < 0
                  ) {
                    Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                    Alertify.error(
                      Utils.getAlertifyMsg(err, $translate.instant("network.RULE_DEPLOY_FAILED"), false)
                    );
                  }
                });
            } else {
              const action = rule.allowed ? "allow" : "deny";
              $http
                .patch(POLICY_RULE_URL, { id: rule.id, action: action })
                .then(function() {
                  Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                  Alertify.success(
                    $translate.instant("network.RULE_DEPLOY_OK")
                  );
                  $scope.onRule = false;
                })
                .catch(function(err) {
                  console.log(err);
                  if (
                    USER_TIMEOUT.indexOf(err.status) < 0
                  ) {
                    Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                    Alertify.error(
                      Utils.getAlertifyMsg(err, $translate.instant("network.RULE_DEPLOY_FAILED"), false)
                    );
                  }
                });
            }
          },
          function onCancel() {}
        );
      };

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
      ////// Service-rules grid end

      const relativeDate = $filter("relativeDate");

      ////// Services grid
      function memberComparator(value1, value2, node1, node2) {
        return node1.data.members.length - node2.data.members.length;
      }

      function memberDateComparator(value1, value2, node1, node2) {
        function getDate(node) {
          const rules = node.data.policy_rules;
          if (rules && rules.length > 0) {
            let lastTimes = rules.map(function(rule) {
              return rule.last_modified_timestamp;
            });
            return Math.max(...lastTimes);
          } else return 0;
        }

        return getDate(node1) - getDate(node2);
      }

      let columnDefs = [
        {
          headerName: $translate.instant("group.gridHeader.NAME"),
          field: "name",
          headerCheckboxSelection: true,
          headerCheckboxSelectionFilteredOnly: true,
          checkboxSelection: true
        },
        {
          headerName: $translate.instant("group.gridHeader.DOMAIN"),
          field: "domain"
        },
        {
          headerName: $translate.instant("group.gridHeader.POLICY_MODE"),
          field: "policy_mode",
          cellRenderer: function(params) {
            let mode = "";
            if (params.value) {
              mode = Utils.getI18Name(params.value);
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else
                return `<span class="label label-fs label-${labelCode}">${mode}</span>`;
            } else return null;
          },
          width: 100,
          maxWidth: 100,
          minWidth: 100
        },
        {
          headerName: $translate.instant("service.gridHeader.MEMBERS"),
          cellRenderer: function(params) {
            return params.data.members.length;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
          },
          comparator: memberComparator
        },
        {
          headerName: $translate.instant("service.gridHeader.LAST_UPDATED_AT"),
          cellRenderer: function(params) {
            const rules = params.data.policy_rules;
            if (rules && rules.length > 0) {
              let lastTimes = rules.map(function(rule) {
                return rule.last_modified_timestamp;
              });
              return relativeDate(Math.max(...lastTimes) * 1000);
            } else return null;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
          },
          comparator: memberDateComparator
        }
      ];

      $scope.gridService = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "multiple",
        onSelectionChanged: onSelectionChanged4Service,
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onGridReady: function(params) {
          setTimeout(function() {
            params.api.sizeColumnsToFit();
          }, 100);
          $win.on(resizeEvent, function() {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 100);
          });
        },
        overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`
      };

      $scope.onFilterChanged = function(value) {
        $scope.gridService.api.setQuickFilter(value);
        $scope.filteredServices = filterFilter($scope.services, {
          name: value
        });
        filterKey = value;
        let node = $scope.gridService.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasService = true;
          $scope.gridService.api.deselectAll();
          node.setSelected(true);
        } else {
          $scope.hasService = false;
          $scope.gridService.api.deselectAll();
        }

        let filteredCount = $scope.gridService.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.services.length || value === ""
            ? `${$scope.services.length} ${getEntityName(
                $scope.services.length
              )}`
            : `${found} ${filteredCount} ${getEntityName(
                filteredCount
              )} ${outOf} ${$scope.services.length} ${getEntityName(
                $scope.services.length
              )}`;
      };

      $scope.getServiceRules = function(serviceName) {
        $scope.gridRules.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`;
        if (serviceName === "") {
          $scope.gridRules.api.setRowData([]);
        } else {
          $http
            .get(SERVICE_URL, { params: { name: serviceName } })
            .then(function(response) {
              $scope.service = response.data.service;
              renderServiceRules($scope.service.policy_rules);
            })
            .catch(function(err) {
              console.warn(err);
              $scope.gridRules.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
              $scope.gridRules.api.setRowData();
            });
        }
      };

      $scope.getProcessProfile = function(serviceName) {
        if ($scope.gridProfile.api) {
          $scope.gridProfile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          if (serviceName === "") {
            $scope.gridProfile.api.setRowData([]);
          } else {
            $http
              .get(PROCESS_PROFILE_URL, {
                params: { name: "nv." + serviceName }
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

      $scope.getFileProfile = function(serviceName) {
        if ($scope.gridFile.api) {
          $scope.gridFile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          if (serviceName === "") {
            $scope.gridFile.api.setRowData([]);
          } else {
            $http
              .get(FILE_PROFILE_URL, {
                params: { name: "nv." + serviceName }
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

      function onSelectionChanged4Service(onRefresh = false) {
        if ($scope.gridService.api) {
          let selectedRows = $scope.gridService.api.getSelectedRows();
          let selectedNodes = $scope.gridService.api.getSelectedNodes();
          if (selectedRows.length > 0) {
            $scope.hasSelectedService = true;
            $scope.gridService.api.sizeColumnsToFit();
            $scope.service = angular.copy(selectedRows[0]);
            let firstSelectedNode = selectedNodes[0].rowIndex;
            $scope.gridService.getRowClass = function(params) {
              if (params.node.rowIndex === firstSelectedNode) {
                return "first-row-in-selection";
              } else {
                return "other-rows-in-selection";
              }
            };
            $scope.gridService.api.redrawRows();
            $scope.rules = $scope.service.policy_rules;
            $scope.forAll = selectedRows.length === $scope.services.length;
            if (
              $scope.service.name !== prevSelectedName ||
              onRefresh === true
            ) {
              if (vm.selectedIndex === 0) {
                $scope.getProcessProfile($scope.service.name);
              } else if (vm.selectedIndex === 1) {
                $scope.getFileProfile($scope.service.name);
              } else {
                $scope.getServiceRules($scope.service.name);
              }
              prevSelectedName = $scope.service.name;
            }
          } else {
            $scope.hasSelectedService = false;
            if (vm.selectedIndex === 0) {
              $scope.getProcessProfile("");
            } else if (vm.selectedIndex === 1) {
              $scope.getFileProfile("");
            } else {
              $scope.getServiceRules("");
            }
            prevSelectedName = "";
            $scope.gridService.getRowClass = function() {
              return "other-rows-in-selection";
            };
            $scope.gridService.api.redrawRows();
          }
        }
      }

      function getCounts() {
        let counting = function(mode) {
          let count = 0;
          angular.forEach($scope.services, function(service) {
            count += service.policy_mode === mode ? 1 : 0;
          });
          return count;
        };

        let protecting = counting("Protect");
        let monitoring = counting("Monitor");
        let learning = counting("Discover");

        $scope.serviceStats = learning + "," + monitoring + "," + protecting;
      }

      $scope.refresh = function() {
        $scope.serviceErr = false;
        $http
          .get(SERVICE_URL)
          .then(function(response) {
            if ($scope.gridService.api) {
              $scope.gridService.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                "general.NO_ROWS"
              )}</span>`;
              let hostNum = response.data.services.length;
              if (hostNum < 2) $scope.serviceGridHeight = 37 + 30 * 2;
              else if (hostNum < serviceDisplayRowCount)
                $scope.serviceGridHeight = 30 + 30 * hostNum;
              else $scope.serviceGridHeight = 30 + 30 * serviceDisplayRowCount;
              $scope.ruleGridHeight =
                $window.innerHeight - $scope.serviceGridHeight - 374;
              $scope.hasService = response.data.services.length > 0;
              if (response.data) {
                $scope.services = response.data.services;
                if ($scope.hideSystemService) {
                  $scope.services = $scope.services.filter(function(item) {
                    return !item.platform_role;
                  });
                }
                getCounts();
                $scope.gridService.api.setRowData($scope.services);
                setTimeout(function() {
                  if ($scope.gridService.api) {
                    $scope.gridService.api.forEachNode(function(node, index) {
                      if ($scope.service) {
                        if (node.data.name === $scope.service.name) {
                          node.setSelected(true);
                          $scope.gridService.api.ensureNodeVisible(node);
                        }
                      } else if (index === 0) {
                        node.setSelected(true);
                        $scope.gridService.api.ensureNodeVisible(node);
                      }
                    });
                    onSelectionChanged4Service(true);
                  }
                }, 50);
                $scope.count = `${$scope.services.length} ${getEntityName(
                  $scope.services.length
                )}`;
                $scope.onFilterChanged(filterKey);
              }
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.serviceErr = true;
            $scope.serviceGridHeight = 30 + 30 * serviceDisplayRowCount;
            $scope.hasService = false;
            $scope.ServicesErr = true;
            $scope.gridService.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridService.api.setRowData();
          });
      };

      $scope.refresh();

      function getMessage(id) {
        return (
          $translate.instant("topbar.mode.SWITCH") +
          $translate.instant("enum." + id.toUpperCase()) +
          $translate.instant("topbar.mode.MODE") +
          "?"
        );
      }

      $scope.switchServiceMode = function(mode) {
        if (filterKey.length > 0) $scope.forAll = false;
        if ($scope.forAll) {
          Alertify.confirm(getMessage(mode)).then(
            function onOk() {
              $http
                .patch("/service/all", { policy_mode: mode })
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
              let selectedRows = $scope.gridService.api.getSelectedRows();
              if (selectedRows && selectedRows.length > 0) {
                let serviceList = selectedRows.map(function(element) {
                  return element.name;
                });

                serviceList = serviceList.filter(service =>
                  RegExp(`.*${filterKey}.*`, "g").test(service)
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

      ////// Services grid end

      angular.element($window).bind("resize", function() {
        $scope.ruleGridHeight =
          $window.innerHeight - $scope.serviceGridHeight - 374;
        $scope.$digest();
      });

      const PROFILE_DELETE_CONFIRMATION = $translate.instant(
        "service.PROFILE_DELETE_CONFIRMATION"
      );

      $scope.removeProfile = function(profile) {
        Alertify.confirm(PROFILE_DELETE_CONFIRMATION).then(
          function onOk() {
            $http
              .patch(PROCESS_PROFILE_URL, {
                process_profile_config: {
                  group: `nv.${$scope.service.name}`,
                  process_delete_list: [profile]
                }
              })
              .then(function() {
                $scope.profileEntry = null;
                $timeout(function() {
                  $scope.getProcessProfile($scope.service.name);
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

      $scope.addProfile = function(ev) {
        let success = function() {
          $mdDialog
            .show({
              locals: { service: $scope.service.name },
              controller: DialogController,
              templateUrl: "profile.add.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getProcessProfile($scope.service.name);
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
                service: $scope.service.name
              },
              controller: EditDialogController,
              templateUrl: "profile.edit.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getProcessProfile($scope.service.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.addFilter = function(ev) {
        let success = function() {
          $mdDialog
            .show({
              locals: { service: $scope.service.name },
              controller: FileDialogController,
              templateUrl: "filter.add.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getFileProfile($scope.service.name);
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
                group: `nv.${$scope.service.name}`,
                fileMonitorConfigData: {
                  config: {
                    delete_filters: [rule]
                  }
                }
              })
              .then(function() {
                $scope.fileEntry = null;
                $timeout(function() {
                  $scope.getFileProfile($scope.service.name);
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
        let success = function() {
          $mdDialog
            .show({
              locals: {
                rule: $scope.fileEntry,
                service: $scope.service.name
              },
              controller: FileEditDialogController,
              templateUrl: "filter.edit.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(function() {
                  $scope.getFileProfile($scope.service.name);
                }, 500);
              },
              function() {}
            );
        };
        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.showPredefinedFilters = function() {
        $scope.onPredefinedFilterView = true;

        function getPredefinedFileProfile(serviceName) {
          $scope.gridFilePre.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
          if (serviceName === "") {
            $scope.gridFilePre.api.setRowData([]);
          } else {
            $http
              .get(FILE_PREDEFINED_PROFILE_URL, {
                params: { name: "nv." + serviceName }
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
          getPredefinedFileProfile($scope.service.name);
        }, 100);
      };
    }

    DialogController.$inject = ["$scope", "$http", "$mdDialog", "service"];
    function DialogController($scope, $http, $mdDialog, service) {
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
                group: "nv." + service,
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
      "service"
    ];
    function EditDialogController($scope, $http, $mdDialog, rule, service) {
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
                group: "nv." + service,
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

    FileDialogController.$inject = ["$scope", "$http", "$mdDialog", "service"];
    function FileDialogController($scope, $http, $mdDialog, service) {
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
              group: `nv.${service}`,
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
      "service"
    ];
    function FileEditDialogController($scope, $http, $mdDialog, rule, service) {
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
              group: `nv.${service}`,
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
  }
})();
