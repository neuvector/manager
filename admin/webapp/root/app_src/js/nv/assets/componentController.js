(function() {
  "use strict";

  angular.module("app.assets").controller("ComponentController", ComponentController);

  ComponentController.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$translate",
    "$window",
    "$document",
    "$timeout",
    "Utils",
    "$filter",
    "$controller",
    "$state",
    "$sanitize"
  ];
  function ComponentController(
    $rootScope,
    $scope,
    $http,
    $translate,
    $window,
    $document,
    $timeout,
    Utils,
    $filter,
    $controller,
    $state,
    $sanitize
  ) {
    let filter = "";
    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window);
      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("scan.COUNT_SCANNER_POSTFIX")
        );
      };
      const found = $translate.instant("enum.FOUND");

      $scope.pageY = $window.innerHeight / 2 + 41;

      $scope.gridHeight = Utils.getMasterGridHeight();
      $scope.detailViewHeight = Utils.getDetailViewHeight() + 5;

      angular.element($window).bind("resize", function() {
        $scope.gridHeight = $scope.pageY - 208;
        $scope.detailViewHeight = $window.innerHeight -  $scope.pageY - 102;
        $scope.$digest();
      });

      const mousemove = function(event) {
        $scope.pageY = event.pageY;
        if (event.pageY >= 268 && event.pageY <= $window.innerHeight - 125) {
          $scope.gridHeight = event.pageY - 208;
          $scope.detailViewHeight = $window.innerHeight -  event.pageY - 102;
          setTimeout(function() {
            $scope.gridOptions.api.sizeColumnsToFit();
            $scope.gridOptions.api.forEachNode(function(node, index) {
              if ($scope.scanner) {
                if (node.data.id === $scope.scanner.id) {
                  node.setSelected(true);
                }
              } else if (index === 0) {
                node.setSelected(true);
              }
            });
          }, 0);
          $scope.$digest();
        }
      };

      const mouseup = function() {
        $document.unbind('mousemove', mousemove);
        $document.unbind('mouseup', mouseup);
      };

      $scope.grabResizeBar4Scanner = function(event) {
        event.preventDefault();
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      };

      let columnDefs = [
        {
          headerName: $translate.instant("dashboard.heading.CVE_DB_VERSION"),
          field: "cvedb_version",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          }
        },
        {
          headerName: $translate.instant("registry.CVE_DB_DATE"),
          field: "cvedb_create_time",
          cellRenderer: function(params) {
            return $sanitize($filter("date")(params.value, "MMM dd, y HH:mm:ss"));
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          comparator: dateComparator
        },
        {
          headerName: $translate.instant("scan.gridHeader.SCANNED_WORKLOADS"),
          field: "scanned_containers",
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
          }
        },
        {
          headerName: $translate.instant("scan.gridHeader.SCANNED_NODES"),
          field: "scanned_hosts",
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
          }
        },
        {
          headerName: $translate.instant("scan.gridHeader.SCANNED_IMAGES"),
          field: "scanned_images",
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
          }
        },
      ];

      function dateComparator(value1, value2, node1, node2) {
        return (
          Date.parse(node1.data.cvedb_create_time) - Date.parse(node2.data.cvedb_create_time)
        );
      }

      function onSelectionChanged(isOnFilter) {
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.scanner = selectedRows[0];
        if (typeof isOnFilter !== "boolean") {
          $scope.$apply();
        }
      }

      $scope.gridOptions = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        onSelectionChanged: onSelectionChanged,
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 200);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 100);
          });
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
      };

      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasScanner = true;
          node.setSelected(true);
          onSelectionChanged(true);
        } else {
          $scope.hasScanner = false;
        }
        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.scanners.length || value === ""
            ? `${$scope.scanners.length} ${getEntityName(
            $scope.scanners.length
            )}`
            : `${found} ${filteredCount} / ${$scope.scanners.length} ${getEntityName(
            $scope.scanners.length
            )}`;
      };

      $scope.refresh = function() {
        $http
          .get(SCANNER_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            $scope.gridOptions.api.setRowData(response.data.scanners);
            $scope.scanners = response.data.scanners;
            if ($scope.scanners.length > 0) {
              $scope.hasScanner = true;
            }
            setTimeout(function() {
              $scope.gridOptions.api.sizeColumnsToFit();
              $scope.gridOptions.api.forEachNode(function(node, index) {
                if ($scope.scanner) {
                  if (node.data.id === $scope.scanner.id) {
                    node.setSelected(true);
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                }
              });
            }, 0);
            $scope.count = `${$scope.scanners.length} ${getEntityName(
              $scope.scanners.length
            )}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function(err) {
            console.warn(err);
            $scope.scanners = ["", "", "", "", "", "", ""];

            $scope.scannerErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.refresh();
    }
  }
})();
