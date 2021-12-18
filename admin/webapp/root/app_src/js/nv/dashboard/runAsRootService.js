(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("RunAsRootFactory", function RunAsRootFactory(
      $translate,
      $filter,
      $window,
      $timeout,
      $http,
      $sanitize,
      Utils
    ) {
      RunAsRootFactory.init = function() {
        RunAsRootFactory.runAsRoot = {
          description: $translate.instant(
            "dashboard.improveScoreModal.runAsRoot.DESCRIPTION"
          ),
          currScore: {
            value: 0,
            test: ""
          },
          futureScore: {
            value: 0,
            test: ""
          }
        };
      };

      RunAsRootFactory.generateGrid = function() {
        let resizeEvent = "resize.ag-grid";
        let $win = $($window);

        function getIps(interfaces) {
          let ips = "";
          for (let key in interfaces) {
            if (interfaces.hasOwnProperty(key)) {
              ips += interfaces[key].reduce(function(result, ip) {
                return result + ip.ip + ",";
              }, "");
            }
          }
          return ips;
        }

        function innerCellRenderer(params) {
          return $sanitize(params.data.display_name);
        }

        function dateComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.started_at */
          return (
            Date.parse(node1.data.started_at) -
            Date.parse(node2.data.started_at)
          );
        }

        const containerColumns = [
          {
            headerName: $translate.instant("containers.detail.NAME"),
            field: "display_name",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: { innerRenderer: innerCellRenderer }
          },
          {
            headerName: $translate.instant("containers.detail.NAME"),
            field: "name",
            hide: true
          },
          {
            headerName: $translate.instant("group.gridHeader.DOMAIN"),
            field: "domain"
          },
          {
            headerName: $translate.instant("containers.detail.HOST_NAME"),
            field: "host_name"
          },
          {
            headerName: $translate.instant(
              "containers.detail.NETWORK_INTERFACES"
            ),
            valueGetter: function(params) {
              /** @namespace params.data.interfaces */
              return getIps(params.data.interfaces);
            },
            hide: true
          },
          {
            headerName: $translate.instant("containers.detail.IMAGE"),
            field: "image"
          },
          {
            headerName: $translate.instant("containers.detail.APPLICATIONS"),
            field: "applications"
          },
          {
            headerName: $translate.instant("containers.detail.STATE"),
            field: "state",
            cellRenderer: function(params) {
              let displayState = Utils.getI18Name(params.value);

              let labelCode = colourMap[params.value];
              if (!labelCode) labelCode = "inverse";
              return `<span class="label label-fs label-${labelCode}">${$sanitize(
                displayState
              )}</span>`;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("containers.detail.STARTED_AT"),
            field: "started_at",
            cellRenderer: function(params) {
              return $sanitize(
                $filter("date")(params.value, "MMM dd, y HH:mm:ss")
              );
            },
            comparator: dateComparator,
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
            },
            minWidth: 160,
            maxWidth: 170
          }
        ];

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

        function filterRunAsRoot(workloads) {
          let res = [];
          if (workloads && workloads.length > 0) {
            workloads.forEach(function(workload) {
              let wl = angular.copy(workload);
              if (workload && workload.children.length > 0) {
                wl.children = workload.children.filter(function(child) {
                  return child.run_as_root;
                });
              }
              if (wl.children.length > 0) {
                res.push(wl);
              }
            });
          }
          return res;
        }

        RunAsRootFactory.gridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: containerColumns,
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
          overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
        };

        RunAsRootFactory.onFilterChanged = function(value) {
          // filter = value;
          RunAsRootFactory.gridOptions.api.setQuickFilter(value);
          let node = RunAsRootFactory.gridOptions.api.getDisplayedRowAtIndex(0);
          if (node) {
            RunAsRootFactory.hasContainer = true;
            node.setSelected(true);
          } else {
            RunAsRootFactory.hasContainer = false;
          }
        };

        RunAsRootFactory.getContainers = function(getScopeMembers) {
          RunAsRootFactory.containerErr = false;
          $http
            .get(CONTAINER_URL)
            .then(function(response) {
              RunAsRootFactory.gridOptions.overlayNoRowsTemplate = $translate.instant(
                "general.NO_ROWS"
              );

              RunAsRootFactory.workloads = response.data.workloads;
              RunAsRootFactory.workloads = filterRunAsRoot(
                RunAsRootFactory.workloads.filter(function(item) {
                  return item.state !== "exit" && !item.platform_role;
                })
              );
              RunAsRootFactory.workloads4Csv = Utils.makeWorkloadsCsvData(RunAsRootFactory.workloads);
              RunAsRootFactory.gridOptions.api.setRowData(
                RunAsRootFactory.workloads
              );
              if (RunAsRootFactory.workloads.length > 0) {
                setTimeout(function() {
                  let row = RunAsRootFactory.gridOptions.api.getDisplayedRowAtIndex(
                    0
                  );
                  row.setSelected(true);
                  getScopeMembers(
                    RunAsRootFactory.workloads[0],
                    RunAsRootFactory.workloads.length > 0,
                    RunAsRootFactory.workloads4Csv
                  );
                }, 50);
              }
            })
            .catch(function(err) {
              console.warn(err);
              RunAsRootFactory.containerErr = true;
              RunAsRootFactory.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
              RunAsRootFactory.gridOptions.api.setRowData();
            });
        };
      };

      return RunAsRootFactory;
    });
})();
