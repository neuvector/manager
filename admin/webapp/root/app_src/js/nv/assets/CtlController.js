(function () {
  "use strict";

  angular.module("app.assets").controller("CtlController", CtlController);

  CtlController.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$translate",
    "$window",
    "$document",
    "$timeout",
    "Utils",
    "$controller",
    "$state",
    "$sanitize",
    "$interval",
    "$filter",
  ];
  function CtlController(
    $rootScope,
    $scope,
    $http,
    $translate,
    $window,
    $document,
    $timeout,
    Utils,
    $controller,
    $state,
    $sanitize,
    $interval,
    $filter
  ) {
    let intervalId = null;
    let filter = "";
    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window);
      let getEntityName = function (count) {
        return Utils.getEntityName(
          count,
          $translate.instant("controllers.COUNT_POSTFIX")
        );
      };
      const found = $translate.instant("enum.FOUND");

      $scope.pageY = $window.innerHeight / 2 + 41;

      $scope.gridHeight = Utils.getMasterGridHeight();
      $scope.detailViewHeight = Utils.getDetailViewHeight() + 5;

      angular.element($window).bind("resize", function () {
        $scope.gridHeight = $scope.pageY - 208;
        $scope.detailViewHeight = $window.innerHeight - $scope.pageY - 102;
        $scope.$digest();
      });

      const mousemove = function (event) {
        $scope.pageY = event.pageY;
        if (event.pageY >= 268 && event.pageY <= $window.innerHeight - 125) {
          $scope.gridHeight = event.pageY - 208;
          $scope.detailViewHeight = $window.innerHeight - event.pageY - 102;
          setTimeout(function () {
            $scope.gridOptions.api.sizeColumnsToFit();
            $scope.gridOptions.api.forEachNode(function (node, index) {
              if ($scope.controller) {
                if (node.data.id === $scope.controller.id) {
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

      const mouseup = function () {
        $document.unbind("mousemove", mousemove);
        $document.unbind("mouseup", mouseup);
      };

      $scope.grabResizeBar4Ctrl = function (event) {
        event.preventDefault();
        $document.on("mousemove", mousemove);
        $document.on("mouseup", mouseup);
      };

      if ($rootScope.user.token.locale !== "zh_cn") moment.locale("en");
      else moment.locale("zh-cn");

      let columnDefs = [
        {
          headerName: $translate.instant("controllers.detail.NAME"),
          field: "display_name",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
          },
          minWidth: 300,
        },
        {
          headerName: $translate.instant("controllers.detail.CLUSTER_IP"),
          field: "cluster_ip",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
          },
        },
        {
          headerName: $translate.instant("controllers.detail.STATUS"),
          field: "connection_state",
          cellRenderer: function (params) {
            let labelCode = colourMap[params.value];
            if (!labelCode) return null;
            else
              return `<span class="label label-fs label-${labelCode}">${$sanitize(
                Utils.getI18Name(params.value)
              )}</span>`;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90,
        },
        {
          headerName: $translate.instant("controllers.detail.VERSION"),
          field: "version",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
          },
        },
        {
          headerName: $translate.instant("controllers.detail.LEADER"),
          field: "leader",
          cellRenderer: function (params) {
            if (params.value)
              return '<em class="fa fa-flag-checkered text-green fa-lg"></em>';
            else return null;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
          },
          width: 80,
          maxWidth: 100,
        },
        {
          headerName: $translate.instant("controllers.detail.DURATION"),
          cellRenderer: function (params) {
            return $sanitize(
              moment.duration(moment().diff(params.data.joined_at)).humanize()
            );
          },
          comparator: dateComparator,
          width: 80,
          maxWidth: 100,
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
          },
        },
      ];

      function dateComparator(value1, value2, node1, node2) {
        return (
          Date.parse(node1.data.joined_at) - Date.parse(node2.data.joined_at)
        );
      }

      function onSelectionChanged(isOnFilter) {
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.controller = selectedRows[0];
        if ($scope.onStatsTab) {
          $scope.stopControllerRefresh();
          resetChartData();
          initData();
          $scope.refreshController($scope.controller.id);
        }
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
        onGridReady: function (params) {
          $timeout(function () {
            params.api.sizeColumnsToFit();
          }, 200);
          $win.on(resizeEvent, function () {
            $timeout(function () {
              params.api.sizeColumnsToFit();
            }, 100);
          });
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS"),
      };

      $scope.onFilterChanged = function (value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasController = true;
          node.setSelected(true);
          onSelectionChanged(true);
        } else {
          $scope.hasController = false;
        }
        let filteredCount =
          $scope.gridOptions.api.getModel().rootNode.childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.controllers.length || value === ""
            ? `${$scope.controllers.length} ${getEntityName(
                $scope.controllers.length
              )}`
            : `${found} ${filteredCount} / ${
                $scope.controllers.length
              } ${getEntityName($scope.controllers.length)}`;
      };

      $scope.refresh = function () {
        $http
          .get(CONTROLLER_URL)
          .then(function (response) {
            $scope.gridOptions.overlayNoRowsTemplate =
              $translate.instant("general.NO_ROWS");
            $scope.gridOptions.api.setRowData(response.data.controllers);
            $scope.controllers = response.data.controllers;
            if ($scope.controllers.length > 0) {
              $scope.hasController = true;
            }
            setTimeout(function () {
              $scope.gridOptions.api.sizeColumnsToFit();
              $scope.gridOptions.api.forEachNode(function (node, index) {
                if ($scope.controller) {
                  if (node.data.id === $scope.controller.id) {
                    node.setSelected(true);
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                }
              });
            }, 0);
            $scope.count = `${$scope.controllers.length} ${getEntityName(
              $scope.controllers.length
            )}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function (err) {
            console.warn(err);
            $scope.controllers = ["", "", "", "", "", "", ""];

            $scope.controllerErr = true;
            $scope.gridOptions.overlayNoRowsTemplate =
              Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.onController = () => {
        $rootScope.$broadcast("OnController");
        if ($scope.selectedController === 1)
          $scope.refreshController($scope.controller.id);
      };

      $scope.onScanner = () => {
        $rootScope.$broadcast("OnScanner");
      };

      $scope.onAgent = () => {
        $rootScope.$broadcast("OnAgent");
      };

      $scope.refresh();

      let cpu = [];
      let totalPoints = 30;

      function resetChartData() {
        cpu = [];
        totalPoints = 30;
      }

      function initData() {
        for (let i = 0; i < totalPoints; i++) {
          let temp = ["", 0, 0];
          cpu.push(temp);
        }
      }

      initData();

      let temp;

      function updateNew(data) {
        let dualYAxisOptions = {
          animation: false,
          maintainAspectRatio: false,
          scales: {
            xAxes: [
              {
                gridLines: {
                  display: true,
                },
                ticks: {
                  callback: function (value) {
                    return value;
                  },
                },
              },
            ],
            yAxes: [
              {
                id: "y-axis-1",
                type: "linear",
                position: "left",
                gridLines: {
                  display: false,
                },
                ticks: {
                  beginAtZero: true,
                  callback: function (value) {
                    if ((value * 100) % 1 === 0) {
                      return value + "%";
                    }
                  },
                },
              },
              {
                id: "y-axis-2",
                type: "linear",
                position: "right",
                gridLines: {
                  display: false,
                },
                ticks: {
                  beginAtZero: true,
                  callback: function (value) {
                    if ((value * 100) % 1 === 0) {
                      if (value < 1000) {
                        return Math.abs(value) + "MB";
                      } else if (value < 1000 * 1000 && value >= 1000) {
                        return Math.abs(Math.round(value / 1000)) + "GB";
                      } else if (
                        value < 1000 * 1000 * 1000 &&
                        value >= 1000 * 1000
                      ) {
                        return Math.abs(Math.round(value / 1000 / 1000)) + "TB";
                      }
                    }
                  },
                },
              },
            ],
          },
        };
        let dualYAxisDatasetOverride = [
          {
            yAxisID: "y-axis-1",
            borderWidth: 1,
            pointRadius: 0,
            lineTension: 0.2,
          },
          {
            yAxisID: "y-axis-2",
            borderWidth: 1,
            pointRadius: 0,
            lineTension: 0.2,
          },
        ];

        $scope.colors = ["#789831", "#75baf3"];

        cpu.shift();

        temp = [data.read_at, data.data1, data.data2];
        $scope.currCpu = data.data1 + data.postfix1;
        $scope.currMemory = data.data2 + data.postfix2;
        cpu.push(temp);

        $scope.realTimeData11 = cpu.map(function (elem) {
          return parseFloat(elem[1], 10);
        });
        $scope.realTimeData12 = cpu.map(function (elem) {
          return parseFloat(elem[2], 10);
        });

        $scope.labels1 = cpu.map(function (elem) {
          return elem[0] ? $filter("date")(elem[0], "HH:mm:ss") : "";
        });
        $scope.series1 = ["CPU", "Memory"];
        $scope.realTimeData1 = [$scope.realTimeData11, $scope.realTimeData12];
        $scope.datasetOverride1 = dualYAxisDatasetOverride;
        $scope.realTimeOptions1 = dualYAxisOptions;
      }

      function getDataNew(dataSrc) {
        return {
          data1: (dataSrc.stats.span_1.cpu * 100).toFixed(2),
          postfix1: "%",
          data2: (dataSrc.stats.span_1.memory / 1000 / 1000).toFixed(2),
          postfix2: "MB",
          read_at: dataSrc.read_at,
        };
      }

      function getStatsNew(controllerId) {
        $scope.statsError = false;
        $http
          .get(CONTROLLER_URL, { params: { id: controllerId } })
          .then(function (response) {
            /** @namespace response.data.stats */
            $scope.ControllerStat = response.data;
            updateNew(getDataNew($scope.ControllerStat));
          })
          .catch(function (err) {
            console.log(err);
            $scope.stopControllerRefresh();
            $scope.statsError = true;
            $scope.statsErrMSG = Utils.getErrorMessage(err);
          });
      }

      $scope.refreshController = function (controllerId) {
        $scope.onDetailsTab = false;
        $scope.onStatsTab = true;
        $scope.noStats = false;
        if (
          controllerId === null ||
          typeof controllerId === "undefined" ||
          $scope.selectedEnforce === 0 ||
          $scope.controller.connection_state === "disconnected"
        ) {
          $scope.noStats = true;
          return;
        }
        if (intervalId === null || typeof intervalId === "undefined") {
          getStatsNew(controllerId);
          intervalId = $interval(function () {
            if ($scope.selectedEnforce === 0) $scope.stopControllerRefresh();
            getStatsNew(controllerId);
          }, 5000);
        }
      };

      $scope.stopControllerRefresh = function () {
        $scope.onDetailsTab = true;
        // $scope.onStatsTab = false;
        if (intervalId !== null && typeof intervalId !== "undefined") {
          $interval.cancel(intervalId);
          intervalId = null;
        }
      };

      $rootScope.$on("OnAgent", function () {
        $scope.stopControllerRefresh();
      });

      $rootScope.$on("OnScanner", function () {
        $scope.stopControllerRefresh();
      });

      $scope.$on("$destroy", function () {
        $scope.stopControllerRefresh();
      });
    }
  }
})();
