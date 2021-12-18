(function() {
  "use strict";
  angular
    .module("app.dashboard")
    .factory("PrivilegeFactory", function PrivilegeFactory(
      $translate,
      $filter,
      $window,
      $timeout,
      $http,
      $sanitize,
      Utils
    ) {

      PrivilegeFactory.init = function() {
        PrivilegeFactory.privilege = {
          description: $translate.instant("dashboard.improveScoreModal.privilege.DESCRIPTION"),
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


      PrivilegeFactory.generateGrid = function() {
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
            Date.parse(node1.data.started_at) - Date.parse(node2.data.started_at)
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
              return `<span class="label label-fs label-${labelCode}">${$sanitize(displayState)}</span>`;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("containers.detail.STARTED_AT"),
            field: "started_at",
            cellRenderer: function(params) {
              return $sanitize($filter("date")(params.value, "MMM dd, y HH:mm:ss"));
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

        function filterPrivileged(workloads) {
          let res = [];
          if (workloads && workloads.length > 0) {
            workloads.forEach(function(workload) {
              let wl = angular.copy(workload);
              if (workload && workload.children.length > 0) {
                wl.children = workload.children.filter(function(child) {
                  return child.privileged;
                });
              }
              if (wl.children.length > 0) {
                res.push(wl);
              }
            });
          }
          return res;
        }

        PrivilegeFactory.gridOptions = {
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

        PrivilegeFactory.onFilterChanged = function(value) {
          // filter = value;
          PrivilegeFactory.gridOptions.api.setQuickFilter(value);
          let node = PrivilegeFactory.gridOptions.api.getDisplayedRowAtIndex(0);
          if (node) {
            PrivilegeFactory.hasContainer = true;
            node.setSelected(true);
          } else {
            PrivilegeFactory.hasContainer = false;
          }
        };

        PrivilegeFactory.getContainers = function(getScopeMembers) {
          PrivilegeFactory.containerErr = false;
          $http
            .get(CONTAINER_URL)
            .then(function(response) {
              PrivilegeFactory.gridOptions.overlayNoRowsTemplate = $translate.instant(
                "general.NO_ROWS"
              );

              PrivilegeFactory.workloads = response.data.workloads;
              PrivilegeFactory.workloads = filterPrivileged(PrivilegeFactory.workloads.filter(function(item) {
                return item.state !== "exit" && !item.platform_role;
              }));
              PrivilegeFactory.workloads4Csv = Utils.makeWorkloadsCsvData(PrivilegeFactory.workloads);
              PrivilegeFactory.gridOptions.api.setRowData(PrivilegeFactory.workloads);
              if (PrivilegeFactory.workloads.length > 0) {
                setTimeout(function() {
                  let row = PrivilegeFactory.gridOptions.api.getDisplayedRowAtIndex(0);
                  row.setSelected(true);
                  getScopeMembers(
                    PrivilegeFactory.workloads[0],
                    PrivilegeFactory.workloads.length > 0,
                    PrivilegeFactory.workloads4Csv
                  );
                }, 50);
              }
            })
            .catch(function(err) {
              console.warn(err);
              PrivilegeFactory.containerErr = true;
              PrivilegeFactory.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
              PrivilegeFactory.gridOptions.api.setRowData();
            });
        };
      };

      return PrivilegeFactory;
    });
})();
