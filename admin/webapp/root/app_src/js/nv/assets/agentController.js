(function () {
  "use strict";

  angular.module("app.assets").controller("AgentController", AgentController);

  AgentController.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$interval",
    "$translate",
    "$window",
    "$document",
    "$timeout",
    "$filter",
    "Utils",
    "$controller",
    "$state",
    "$sanitize",
  ];
  function AgentController(
    $rootScope,
    $scope,
    $http,
    $interval,
    $translate,
    $window,
    $document,
    $timeout,
    $filter,
    Utils,
    $controller,
    $state,
    $sanitize
  ) {
    let intervalId;
    let filter = "";

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window); // cache reference for resize
      let getEntityName = function (count) {
        return Utils.getEntityName(
          count,
          $translate.instant("enforcers.COUNT_POSTFIX")
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
            $scope.gridOptions.api.forEachNode(function (node, index) {
              if ($scope.device) {
                if (node.data.id === $scope.device.id) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node);
                }
              } else if (index === 0) {
                node.setSelected(true);
                $scope.gridOptions.api.ensureNodeVisible(node);
              }
            });
          }, 50);
          $scope.$digest();
        }
      };

      const mouseup = function () {
        $document.unbind("mousemove", mousemove);
        $document.unbind("mouseup", mouseup);
      };

      $scope.grabResizeBar4Enforcer = function (event) {
        event.preventDefault();
        $document.on("mousemove", mousemove);
        $document.on("mouseup", mouseup);
      };

      if ($rootScope.user.token.locale !== "zh_cn") moment.locale("en");
      else moment.locale("zh-cn");

      let columnDefs = [
        {
          headerName: $translate.instant("enforcers.detail.NAME"),
          field: "display_name",
        },
        {
          headerName: $translate.instant("enforcers.detail.HOST_NAME"),
          field: "host_name",
        },
        {
          headerName: $translate.instant("enforcers.detail.CLUSTER_IP"),
          field: "cluster_ip",
        },
        {
          headerName: $translate.instant("enforcers.detail.STATUS"),
          field: "connection_state",
          cellRenderer: function (params) {
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
          minWidth: 90,
        },
        {
          headerName: $translate.instant("enforcers.detail.VERSION"),
          field: "version",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>',
          },
        },
        {
          headerName: $translate.instant("controllers.detail.DURATION"),
          cellRenderer: function (params) {
            /** @namespace params.data.joined_at */
            return $sanitize(
              moment.duration(moment().diff(params.data.joined_at)).humanize()
            );
          },
          comparator: dateComparator,
          width: 100,
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>',
          },
        },
      ];

      function dateComparator(value1, value2, node1, node2) {
        return (
          Date.parse(node1.data.joined_at) - Date.parse(node2.data.joined_at)
        );
      }

      $scope.onDetailsTab = true;
      $scope.onStatsTab = false;

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
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"></em>',
        },
        onGridReady: function (params) {
          $timeout(function () {
            params.api.sizeColumnsToFit();
          }, 2000);
          $win.on(resizeEvent, function () {
            $timeout(function () {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS"),
      };

      $scope.onFilterChanged = function (value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasEnforcer = true;
          node.setSelected(true);
          onSelectionChanged(true);
        } else {
          $scope.hasEnforcer = false;
        }
        let filteredCount =
          $scope.gridOptions.api.getModel().rootNode.childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.devices.length || value === ""
            ? `${$scope.devices.length} ${getEntityName($scope.devices.length)}`
            : `${found} ${filteredCount} / ${
                $scope.devices.length
              } ${getEntityName($scope.devices.length)}`;
      };

      function setRowData(rowData) {
        $scope.gridOptions.api.setRowData(rowData);
      }

      $scope.gridHeight = Utils.getMasterGridHeight();
      $scope.detailViewHeight = Utils.getDetailViewHeight();

      $scope.refresh = function () {
        $http
          .get(ENFORCER_URL)
          .then(function (response) {
            /** @namespace response.data.enforcers */
            $scope.gridOptions.overlayNoRowsTemplate =
              $translate.instant("general.NO_ROWS");
            $scope.devices = response.data.enforcers;
            setRowData($scope.devices);
            if ($scope.devices.length > 0) {
              $scope.hasEnforcer = true;
            }

            setTimeout(function () {
              $scope.gridOptions.api.forEachNode(function (node, index) {
                if ($scope.device) {
                  if (node.data.id === $scope.device.id) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node);
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node);
                }
              });
            }, 50);
            $scope.count = `${$scope.devices.length} ${getEntityName(
              $scope.devices.length
            )}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function (err) {
            console.warn(err);
            $scope.devices = ["", "", "", "", "", "", ""];

            $scope.deviceErr = true;
            $scope.gridOptions.overlayNoRowsTemplate =
              Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.refresh();

      function onSelectionChanged(isOnFilter) {
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        if (selectedRows.length > 0) {
          $scope.gridOptions.api.sizeColumnsToFit();
          $scope.device = selectedRows[0];
          if ($scope.onStatsTab) {
            $scope.stopDeviceRefresh();
            resetChartData();
            initData();
            $scope.refreshDevice($scope.device.id);
          }
          if (typeof isOnFilter !== "boolean") {
            $scope.$apply();
          }
        }
      }
    }

    $scope.resources = {
      cpu: $translate.instant("enforcers.stats.CPU"),
      memory: $translate.instant("enforcers.stats.MEMORY"),
      sessionIn: $translate.instant("enforcers.stats.INCOMING_SESSIONS"),
      sessionOut: $translate.instant("enforcers.stats.OUTGOING_SESSIONS"),
      byteIn: $translate.instant("enforcers.stats.INCOMING_BYTES"),
      byteOut: $translate.instant("enforcers.stats.OUTGOING_BYTES"),
    };
    $scope.selectedResource = $scope.resources["cpu"];

    let cpu = [];
    let packet = [];
    let bytes = [];
    let sessions = [];
    let dataset;
    let totalPoints = 30;
    const CPU_MEMORY = "graph1";
    const BYTE = "gragh3";
    const SESSION = "gragh4";

    function resetChartData() {
      cpu = [];
      packet = [];
      bytes = [];
      sessions = [];
      dataset = [];
      totalPoints = 30;
    }

    function initData() {
      for (let i = 0; i < totalPoints; i++) {
        let temp = ["", 0, 0];
        cpu.push(temp);
        packet.push(temp);
        bytes.push(temp);
        sessions.push(temp);
      }
    }

    initData();

    let temp;

    function updateNew(resource, data) {
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
      let singleYAxisOptions = {
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
              type: "linear",
              position: "left",
              gridLines: {
                display: false,
              },
              ticks: {
                beginAtZero: true,
                callback: function (value) {
                  if (value % 1 === 0) {
                    if (value < 1000) {
                      return value + "kB";
                    } else if (value < 1000 * 1000 && value >= 1000) {
                      return Math.round(value / 1000) + "MB";
                    } else if (
                      value < 1000 * 1000 * 1000 &&
                      value >= 1000 * 1000
                    ) {
                      return Math.round(value / 1000 / 1000) + "GB";
                    } else if (
                      value < 1000 * 1000 * 1000 * 1000 &&
                      value >= 1000 * 1000 * 1000
                    ) {
                      return Math.round(value / 1000 / 1000 / 1000) + "TB";
                    }
                  }
                },
              },
            },
            {
              type: "linear",
              position: "right",
              gridLines: {
                display: false,
              },
              ticks: {
                callback: function () {
                  return "";
                },
              },
            },
          ],
        },
      };
      let singleYAxisOptions2 = {
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
              type: "linear",
              position: "left",
              gridLines: {
                display: false,
              },
              ticks: {
                beginAtZero: true,
                callback: function (value) {
                  if (value % 1 === 0) {
                    if (value < 1000) {
                      return value;
                    } else if (value < 1000 * 1000 && value >= 1000) {
                      return Math.round(value / 1000) + "k";
                    } else if (
                      value < 1000 * 1000 * 1000 &&
                      value >= 1000 * 1000
                    ) {
                      return Math.round(value / 1000 / 1000) + "M";
                    } else if (
                      value < 1000 * 1000 * 1000 * 1000 &&
                      value >= 1000 * 1000 * 1000
                    ) {
                      return Math.round(value / 1000 / 1000 / 1000) + "G";
                    }
                  }
                },
              },
            },
            {
              type: "linear",
              position: "right",
              gridLines: {
                display: false,
              },
              ticks: {
                callback: function () {
                  return "";
                },
              },
            },
          ],
        },
      };
      let singleYAxisDatasetOverride = [
        {
          borderWidth: 1,
          pointRadius: 0,
          lineTension: 0.2,
        },
        {
          borderWidth: 1,
          pointRadius: 0,
          lineTension: 0.2,
        },
      ];
      $scope.colors = ["#789831", "#75baf3"];
      switch (resource) {
        case CPU_MEMORY:
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
          break;
        // case PACKET:
        //   packet.shift();
        //   now += updateInterval;
        //
        //   temp = [now, data.data1, -data.data2];
        //   $scope.currInPacket = data.data1 + data.postfix1;
        //   $scope.currOutPacket = data.data2 + data.postfix2;
        //   packet.push(temp);
        //
        //   $scope.realTimeData21 = packet.map(function(elem) {
        //     return parseInt(elem[1], 10);
        //   });
        //   $scope.realTimeData22 = packet.map(function(elem) {
        //     return parseInt(elem[2], 10);
        //   });
        //
        //   $scope.labels2 = packet.map(function(elem) {
        //     return dateFormater(elem[0]);
        //   });
        //   $scope.series2 = ["Input packet", "Output packet"];
        //   $scope.realTimeData2 = [$scope.realTimeData21, $scope.realTimeData22];
        //   $scope.datasetOverride2 = singleYAxisDatasetOverride;
        //   $scope.realTimeOptions2 = singleYAxisOptions;
        //   break;
        case BYTE:
          bytes.shift();

          temp = [data.read_at, data.data1, data.data2];
          $scope.currInByte = data.data1 + data.postfix1;
          $scope.currOutByte = data.data2 + data.postfix2;
          bytes.push(temp);

          $scope.realTimeData31 = bytes.map(function (elem) {
            return parseFloat(elem[1], 10);
          });
          $scope.realTimeData32 = bytes.map(function (elem) {
            return parseFloat(elem[2], 10);
          });

          $scope.labels3 = bytes.map(function (elem) {
            return elem[0] ? $filter("date")(elem[0], "HH:mm:ss") : "";
          });
          $scope.series3 = ["Input byte", "Output byte"];
          $scope.realTimeData3 = [$scope.realTimeData31, $scope.realTimeData32];
          // barChartOptions.scales.yAxes[0].ticks.stepSize = 0.5;
          $scope.datasetOverride3 = singleYAxisDatasetOverride;
          $scope.realTimeOptions3 = singleYAxisOptions;
          break;
        case SESSION:
          sessions.shift();

          temp = [data.read_at, data.data1, data.data2];
          $scope.currInSession = data.data1 + data.postfix1;
          $scope.currOutSession = data.data2 + data.postfix2;
          sessions.push(temp);

          $scope.realTimeData41 = sessions.map(function (elem) {
            return parseFloat(elem[1], 10);
          });
          $scope.realTimeData42 = sessions.map(function (elem) {
            return parseFloat(elem[2], 10);
          });

          $scope.labels4 = sessions.map(function (elem) {
            return elem[0] ? $filter("date")(elem[0], "HH:mm:ss") : "";
          });
          $scope.series4 = ["Input session", "Output session"];
          $scope.realTimeData4 = [$scope.realTimeData41, $scope.realTimeData42];
          // barChartOptions.scales.yAxes[0].ticks.stepSize = 1;
          $scope.datasetOverride4 = singleYAxisDatasetOverride;
          $scope.realTimeOptions4 = singleYAxisOptions2;
          break;
        default:
          return null;
      }
    }

    /** @namespace dataSrc.span_1 */
    function getDataNew(resource, dataSrc) {
      switch (resource) {
        case CPU_MEMORY:
          return {
            data1: (dataSrc.stats.span_1.cpu * 100).toFixed(2),
            postfix1: "%",
            data2: (dataSrc.stats.span_1.memory / 1000 / 1000).toFixed(2),
            postfix2: "MB",
            read_at: dataSrc.read_at,
          };
        case BYTE:
          /** @namespace dataSrc.stats.span_1.byte_in */
          /** @namespace dataSrc.stats.span_1.byte_out */
          return {
            data1: (dataSrc.stats.span_1.byte_in / 1000).toFixed(2),
            postfix1: "KB",
            data2: (dataSrc.stats.span_1.byte_out / 1000).toFixed(2),
            postfix2: "KB",
            read_at: dataSrc.read_at,
          };
        case SESSION:
          /** @namespace dataSrc.stats.total.cur_session_in */
          /** @namespace dataSrc.stats.total.cur_session_out */
          return {
            data1: dataSrc.stats.total.cur_session_in
              ? dataSrc.stats.total.cur_session_in
              : 0,
            postfix1: "",
            data2: dataSrc.stats.total.cur_session_out
              ? dataSrc.stats.total.cur_session_out
              : 0,
            postfix2: "",
            read_at: dataSrc.read_at,
          };
        default:
          return null;
      }
    }

    function getStatsNew(deviceId) {
      $scope.statsError = false;
      $http
        .get(ENFORCER_URL, { params: { id: deviceId } })
        .then(function (response) {
          /** @namespace response.data.stats */
          $scope.deviceStat = response.data;
          updateNew(CPU_MEMORY, getDataNew(CPU_MEMORY, $scope.deviceStat));
          updateNew(BYTE, getDataNew(BYTE, $scope.deviceStat));
          updateNew(SESSION, getDataNew(SESSION, $scope.deviceStat));
        })
        .catch(function (err) {
          console.log(err);
          $scope.stopDeviceRefresh();
          $scope.statsError = true;
          $scope.statsErrMSG = Utils.getErrorMessage(err);
        });
    }

    $scope.getState = function (device) {
      /** @namespace device.connection_state */
      if (device && device.connection_state)
        return $translate.instant(
          "enum." + device.connection_state.toUpperCase()
        );
      else return "";
    };

    $scope.refreshDevice = function (deviceId) {
      $scope.onDetailsTab = false;
      $scope.onStatsTab = true;
      $scope.noStats = false;
      if (
        deviceId === null ||
        typeof deviceId === "undefined" ||
        $scope.selectedEnforce === 0 ||
        $scope.device.connection_state === "disconnected"
      ) {
        $scope.noStats = true;
        return;
      }
      if (intervalId === null || typeof intervalId === "undefined") {
        getStatsNew(deviceId);
        intervalId = $interval(function () {
          if ($scope.selectedEnforce === 0) $scope.stopDeviceRefresh();
          getStatsNew(deviceId);
        }, 5000);
      }
    };

    $scope.stopDeviceRefresh = function () {
      $scope.onDetailsTab = true;
      // $scope.onStatsTab = false;
      if (intervalId !== null && typeof intervalId !== "undefined") {
        $interval.cancel(intervalId);
        intervalId = null;
      }
    };

    $rootScope.$on("OnController", function () {
      $scope.stopDeviceRefresh();
    });

    $rootScope.$on("OnScanner", function () {
      $scope.stopDeviceRefresh();
    });

    $rootScope.$on("OnAgent", function () {
      if ($scope.selectedEnforcer === 1) $scope.refreshDevice($scope.device.id);
    });

    $scope.$on("$destroy", function () {
      $scope.stopDeviceRefresh();
    });
  }
})();
