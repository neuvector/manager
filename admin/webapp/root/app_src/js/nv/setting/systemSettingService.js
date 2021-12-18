(function() {
  "use strict";
  angular
    .module("app.login")
    .factory("SystemSettingFactory", function(
      $translate,
      $sanitize,
      $timeout,
      $window,
      Utils
    ) {
      let SystemSettingFactory = {};
      SystemSettingFactory.setGrid = function() {
        const $win = $($window);
        const resizeEvent = "resize.ag-grid";
        const enforcerColumn = [
          {
            headerName: $translate.instant("enforcers.detail.NAME"),
            field: "display_name",
            headerCheckboxSelection: true,
            headerCheckboxSelectionFilteredOnly: true,
            checkboxSelection: true,
            width: 200
          },
          {
            headerName: $translate.instant("enforcers.detail.HOST_NAME"),
            field: "host_name",
            width: 100
          },
          {
            headerName: $translate.instant("enforcers.detail.CLUSTER_IP"),
            field: "cluster_ip",
            width: 140
          },
          {
            headerName: $translate.instant("enforcers.detail.STATUS"),
            field: "connection_state",
            cellRenderer: function(params) {
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else
                return `<span class="label label-fs label-${labelCode}">${$sanitize(
                  Utils.getI18Name(params.value)
                )}</span>`;
            },
            cellClass: "grid-center-align",
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("enforcers.detail.VERSION"),
            field: "version",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
            },
            width: 160
          },
          {
            headerName: $translate.instant("controllers.detail.DURATION"),
            cellRenderer: function(params) {
              /** @namespace params.data.joined_at */
              return $sanitize(
                moment.duration(moment().diff(params.data.joined_at)).humanize()
              );
            },
            comparator: dateComparator,
            width: 100,
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
            }
          }
        ];

        function dateComparator(value1, value2, node1, node2) {
          return (
            Date.parse(node1.data.joined_at) - Date.parse(node2.data.joined_at)
          );
        }

        const gridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: enforcerColumn,
          rowData: null,
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
        return gridOptions;
      };
      return SystemSettingFactory;
    });
})();
