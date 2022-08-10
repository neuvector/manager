(function () {
  "use strict";

  angular
    .module("app.assets")
    .controller("ContainerController", ContainerController);

  ContainerController.$inject = [
    "$scope",
    "$rootScope",
    "$http",
    "$interval",
    "$translate",
    "$window",
    "$document",
    "$timeout",
    "Alertify",
    "$filter",
    "ContainerFactory",
    "ScanFactory",
    "ComplianceFactory",
    "Utils",
    "Blob",
    "$stateParams",
    "FileSaver",
    "$controller",
    "$state",
    "AuthorizationFactory",
    "CveProfileFactory"
  ];
  function ContainerController(
    $scope,
    $rootScope,
    $http,
    $interval,
    $translate,
    $window,
    $document,
    $timeout,
    Alertify,
    $filter,
    ContainerFactory,
    ScanFactory,
    ComplianceFactory,
    Utils,
    Blob,
    $stateParams,
    FileSaver,
    $controller,
    $state,
    AuthorizationFactory,
    CveProfileFactory
  ) {
    //=======For preloading English translation file only=====
    $translate.instant("general.VERSION", {}, "", "en");
    //=======For preloading English translation file only=====
    let intervalId;
    let filter = "";
    const PAGE_SIZE = PAGE.CONTAINERS;
    $scope.eof = false;
    $scope.workloadsMap = {};
    $scope.hideExitedProcess = true;
    $scope.showExitNode = false;
    $scope.isSimpleTab = false;
    $scope.isSimpleButton = false;
    $scope.isShowingAccepted = false;
    $scope.isAccepted = true;
    $scope.cve = [];
    $scope.complianceGridOptions = null;
    $scope.isScanAuthorized =
      AuthorizationFactory.getDisplayFlag("runtime_scan");
    console.log("$scope.isAutoScanAuthorized: ", $scope.isAutoScanAuthorized);
    $scope.isVulsAuthorized = AuthorizationFactory.getDisplayFlag("vuls_profile");
    $scope.isWriteVulsAuthorized = AuthorizationFactory.getDisplayFlag("write_vuls_profile");
    $scope.isNamespaceUser =
      AuthorizationFactory.userPermission.isNamespaceUser;

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function onCVESelectionChanged() {
      let selectedRows = $scope.cveGridOptions.api.getSelectedRows();
      $scope.cve = selectedRows[0];
      $scope.isAccepted = $scope.cve.tags && $scope.cve.tags.some(tag => tag === "accepted");
      $scope.cveName = selectedRows[0].name;
      $scope.cveLink = selectedRows[0].link;
      $scope.cveDescription = selectedRows[0].description;
      $scope.onCVE = true;
      $scope.$apply();
      $timeout(function () {
        $scope.onCVE = false;
      }, 10000);
    }

    function getScanConfig() {
      if ($scope.isScanAuthorized && !$scope.isNamespaceUser) {
        ScanFactory.getScanConfig()
          .then(function (scanConfig) {
            $scope.scanConfig = scanConfig;
            $scope.isAutoScanAuthorized = true;
          })
          .catch(function (err) {
            console.warn(err);
            if (err.status === ACC_FORBIDDEN) {
              $scope.isAutoScanAuthorized = false;
            }
          });
      }
    }

    let onScanInterval = undefined;
    let autoScanInterval = undefined;

    function stopInterval() {
      if (angular.isDefined(onScanInterval)) {
        $interval.cancel(onScanInterval);
        onScanInterval = undefined;
      }
    }

    function stopAutoInterval() {
      if (angular.isDefined(autoScanInterval)) {
        $interval.cancel(autoScanInterval);
        autoScanInterval = undefined;
      }
    }

    function activate() {
      let imageId = decodeURIComponent($stateParams.imageId);

      ContainerFactory.prepareGrids(true);
      ContainerFactory.prepareProcessGrids();
      ComplianceFactory.prepareGrids();
      ScanFactory.setGrids();
      getScanConfig();
      $scope.cveGridOptions = ScanFactory.cveGridOptions;
      $scope.cveGridOptions.onSelectionChanged = onCVESelectionChanged;

      $scope.selectedIndex = 0;
      const podPostFix = $translate.instant("containers.COUNT_POD_POSTFIX");
      const containerPostFix = $translate.instant("containers.COUNT_POSTFIX");
      let entityName = "";
      let getEntityName = function (count, name) {
        return Utils.getEntityName(count, name);
      };
      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");

      $scope.gridOptions = ContainerFactory.getGridOptions();
      $scope.gridOptions.suppressScrollOnNewData = true;
      $scope.gridOptions.onRowClicked = rowClicked;

      $scope.toggleSystemNode = function (showNode) {
        $scope.hideSystemNode = !showNode;
        if ($scope.hideSystemNode) {
          $scope.workloads = $scope.workloads.filter(function (item) {
            return !item.platform_role;
          });
        } else {
          $scope.workloads = angular.copy($scope.workloadsBackup);
        }
        if (!$scope.showExitNode) {
          $scope.workloads = $scope.workloads.filter(function (item) {
            return item.brief.state !== "exit";
          });
        }
        $scope.gridOptions.api.setRowData($scope.workloads);
        $scope.count = `${$scope.workloads.length} ${getEntityName(
          $scope.workloads.length,
          entityName
        )}`;
        $scope.onFilterChanged(filter);
      };

      $scope.toggleExitNode = function (showNode) {
        $scope.showExitNode = showNode;
        if ($scope.showExitNode) {
          $scope.workloads = angular.copy($scope.workloadsBackup);
        } else {
          $scope.workloads = $scope.workloads.filter(function (item) {
            return item.brief.state !== "exit";
          });
        }
        if ($scope.hideSystemNode) {
          $scope.workloads = $scope.workloads.filter(function (item) {
            return !item.platform_role;
          });
        }
        $scope.gridOptions.api.setRowData($scope.workloads);
        $scope.count = `${$scope.workloads.length} ${getEntityName(
          $scope.workloads.length,
          entityName
        )}`;
        $scope.onFilterChanged(filter);
      };

      function onRow(node) {
        $scope.gridOptions.api.sizeColumnsToFit();
        $scope.workload = node.data;
        if ($scope.selectedIndex === 3) {
          $scope.getProcess($scope.workload);
        }
        if ($scope.workload.brief.state === "monitor") {
          $scope.protect = false;
          $scope.toggledMode = "Monitor";
        } else {
          $scope.protect = true;
          $scope.toggledMode = "Protect";
        }
        $scope.workloadMode = $scope.workload.brief.state;
        if ($scope.selectedIndex === 4) {
          $scope.stopRefresh();
          resetChartData();
          initData();
          $scope.refreshStats($scope.workload.brief.id);
        }
        if ($scope.selectedIndex === 2) {
          $scope.disableScan = !!(
            ($scope.workload.security.scan_summary &&
              $scope.workload.security.scan_summary.status &&
              $scope.workload.security.scan_summary.status === "scanning") ||
            node.data.state === "exit"
          );
          if (node.data.brief.state === "exit")
            $scope.getScanReport($scope.workload.brief.id, true);
          else $scope.getScanReport($scope.workload.brief.id, false);
          if (
            $scope.workload.security.scan_summary &&
            $scope.workload.security.scan_summary.status &&
            $scope.workload.security.scan_summary.status === "scanning"
          ) {
            getContainerInfo($scope.workload.brief.id);
          }
        }
        if ($scope.selectedIndex === 1) {
          $scope.getCompliance($scope.workload.brief.id);
        }
      }

      function onRowWithDigest(node) {
        onRow(node);
        $scope.$apply();
        console.log("onRowWithDigest", $scope.workload);
      }

      function rowClicked(params) {
        let node = params.node;
        $scope.onCompliance = false;
        $scope.isShowingAccepted = false;
        node.setSelected(true, true);
        onRowWithDigest(node);
      }

      $scope.onFilterChanged = function (value) {
        filter = value;
        $scope.filteredWorkloads = [];
        $scope.gridOptions.api.setQuickFilter(value);
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasContainer = true;
          node.setSelected(true, true);
          onRow(node);
        } else {
          $scope.hasContainer = false;
        }
        let filteredCount =
          $scope.gridOptions.api.getModel().rootNode.childrenAfterFilter.length;
        $scope.gridOptions.api.forEachNodeAfterFilterAndSort((node) => {
          $scope.filteredWorkloads.push(node.data);
        });
        $scope.count =
          filteredCount === $scope.workloads.length || value === ""
            ? `${$scope.workloads.length} ${getEntityName(
                $scope.workloads.length,
                entityName
              )}`
            : `${found} ${filteredCount} ${getEntityName(
                filteredCount,
                entityName
              )} ${outOf} ${$scope.workloads.length} ${getEntityName(
                $scope.workloads.length,
                entityName
              )}`;
      };

      $scope.onFilterChangedOnBottom = function(tabId, searchBottom) {
        switch (tabId) {
          case 1:
            $scope.onComplianceFilterChanged(searchBottom);
            break;
          case 2:
            $scope.onCveFilterChanged(searchBottom);
            break;
          case 3:
            $scope.onProcessFilterChanged(searchBottom);
            break;
        }
      };

      $scope.isEmpty = function (obj) {
        if (!obj) return true;
        return Object.keys(obj).length === 0;
      };

      $scope.procGridOptions = ContainerFactory.getProcessGridOptions();

      const renderContainers = function (data, options) {
        let onScan = options.onScan;
        let noAutoScan = options.noAutoScan;
        $scope.gridOptions.overlayNoRowsTemplate =
          $translate.instant("general.NO_ROWS");

        $scope.eof = data.length < PAGE_SIZE;
        $scope.workloads = $scope.workloads.concat(data);
        $scope.workloads.map(function (workload) {
          $scope.workloadsMap[workload.brief.id] = workload;
        });

        if (imageId && imageId !== "null") {
          $scope.workloads = $scope.workloads.filter(function (item) {
            return item.brief.id === imageId;
          });
          $scope.selectedIndex = 2;
        }

        if ($scope.workloads.length > 0) {
          $scope.hasContainer = true;
          if ($scope.workloads[0].brief.name.startsWith("k8s_")) {
            entityName = podPostFix;
          } else {
            entityName = containerPostFix;
          }
        } else {
          entityName = containerPostFix;
        }

        $scope.workloadsBackup = angular.copy($scope.workloads);

        if (!$scope.showExitNode) {
          $scope.workloads = $scope.workloads.filter(function (item) {
            return item.brief.state !== "exit";
          });
        }

        let currSelectedWorkload = angular.copy($scope.workload);

        $scope.gridOptions.api.setRowData($scope.workloads);

        setTimeout(function () {
          $scope.gridOptions.api.forEachNode(function (node, index) {
            if (currSelectedWorkload) {
              if (node.data.brief.id === currSelectedWorkload.brief.id) {
                node.setSelected(true, true);
                if (!noAutoScan) onRow(node);
                $scope.gridOptions.api.ensureNodeVisible(node, "middle");
              }
            }
          });
        });

        $scope.count = `${$scope.workloads.length} ${getEntityName(
          $scope.workloads.length,
          entityName
        )}`;
        if (!onScan) $scope.onFilterChanged(filter);

        //prepare pdf charts

        $scope.quarantineData = $scope.workloads.filter(function (item) {
          return item.brief.state === "quarantined";
        });

        $scope.hasQuarantineData = $scope.quarantineData.length > 0;

        renderChartsForPDF($scope.quarantineData);
      };

      const handleError = function (err) {
        console.warn(err);
        $scope.containerErr = true;
        $scope.gridOptions.overlayNoRowsTemplate =
          Utils.getOverlayTemplateMsg(err);
        $scope.gridOptions.api.setRowData();
      };

      $scope.refresh = function (onScan = false, noAutoScan = false) {
        $scope.isAccepted = true;
        $scope.cve = [];
        $scope.containerErr = false;
        $scope.workloads = [];
        $scope.eof = false;
        Utils.loadPagedData(
          SCANNED_CONTAINER_URL,
          {
            start: 0,
            limit: PAGE_SIZE,
          },
          null,
          renderContainers,
          handleError,
          {
            onScan: onScan,
            noAutoScan: noAutoScan,
          }
        );
      };

      $scope.refresh();

      $scope.onProcFilterChanged = function (value) {
        $scope.procGridOptions.api.setQuickFilter(value);
      };

      $scope.toggleProcess = function (hideExitedProcess) {
        $scope.hideExitedProcess = hideExitedProcess;
        $scope.getProcess($scope.workload);
      };

      $scope.getProcess = function (workload) {
        $scope.stopRefresh();
        if (workload.brief.state !== "exit") {
          let url = CONTAINER_PROCESS_URL;
          if (!$scope.hideExitedProcess) {
            url = CONTAINER_PROCESS_HISTORY_URL;
          }
          $http
            .get(url, { params: { id: workload.brief.id } })
            .then(function (response) {
              /** @namespace response.data.processes */
              $scope.procGridOptions.overlayNoRowsTemplate =
                $translate.instant("general.NO_ROWS");

              let processList = response.data.processes;

              let treeData = ContainerFactory.buildTree(
                processList,
                "pid",
                "parent"
              );
              $scope.procGridOptions.api.setRowData(treeData);
              $scope.procGridOptions.api.sizeColumnsToFit();
            })
            .catch(function (err) {
              console.log(err);
              if (err.data.code === 7) $scope.onLost();
              else {
                $scope.procGridOptions.overlayNoRowsTemplate =
                  Utils.getOverlayTemplateMsg(err);
                $scope.procGridOptions.api.setRowData();
              }
            });
        } else {
          $scope.procGridOptions.api.setRowData([]);
        }
        console.log($scope.selectedIndex);
      };

      $scope.resources = {
        cpu: $translate.instant("enforcers.stats.CPU"),
        memory: $translate.instant("enforcers.stats.MEMORY"),
        sessionIn: $translate.instant("enforcers.stats.INCOMING_SESSIONS"),
        sessionOut: $translate.instant("enforcers.stats.OUTGOING_SESSIONS"),
        byteIn: $translate.instant("enforcers.stats.INCOMING_BYTES"),
        byteOut: $translate.instant("enforcers.stats.OUTGOING_BYTES"),
      };
      $scope.selectedResource = $scope.resources["cpu"];

      $scope.resources.set = function (id) {
        $scope.selectedResource = $scope.resources[id];
        $scope.stopRefresh();
        resetChartData();
        initData();
        $scope.refreshStats($scope.workload.brief.id);
      };
    }

    $scope.onLost = function () {
      $scope.workload = null;
      $scope.refresh();
    };

    let cpu = [];
    let bytes = [];
    let sessions = [];
    let totalPoints = 30;
    const CPU_MEMORY = "graph1";
    const BYTE = "gragh3";
    const SESSION = "gragh4";

    function resetChartData() {
      cpu = [];
      bytes = [];
      sessions = [];
      totalPoints = 30;
    }

    function initData() {
      for (let i = 0; i < totalPoints; i++) {
        let temp = ["", 0, 0];
        cpu.push(temp);
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
                display: true,
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
                display: true,
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
            return parseFloat(elem[1]);
          });
          $scope.realTimeData12 = cpu.map(function (elem) {
            return parseFloat(elem[2]);
          });

          $scope.labels1 = cpu.map(function (elem) {
            return elem[0] ? $filter("date")(elem[0], "HH:mm:ss") : "";
          });
          $scope.series1 = ["CPU", "Memory"];
          $scope.realTimeData1 = [$scope.realTimeData11, $scope.realTimeData12];
          $scope.datasetOverride1 = dualYAxisDatasetOverride;
          $scope.realTimeOptions1 = dualYAxisOptions;
          break;
        case BYTE:
          bytes.shift();

          temp = [data.read_at, data.data1, data.data2];
          $scope.currInByte = data.data1 + data.postfix1;
          $scope.currOutByte = data.data2 + data.postfix2;
          bytes.push(temp);

          $scope.realTimeData31 = bytes.map(function (elem) {
            return parseFloat(elem[1]);
          });
          $scope.realTimeData32 = bytes.map(function (elem) {
            return parseFloat(elem[2]);
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
            return parseFloat(elem[1]);
          });
          $scope.realTimeData42 = sessions.map(function (elem) {
            return parseFloat(elem[2]);
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
          return {
            data1: (dataSrc.stats.span_1.byte_in / 1000).toFixed(2),
            postfix1: "KB",
            data2: (dataSrc.stats.span_1.byte_out / 1000).toFixed(2),
            postfix2: "KB",
            read_at: dataSrc.read_at,
          };
        case SESSION:
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

    function getStatsNew(containerId, resource) {
      $scope.statsError = false;
      $scope.statsError2 = false;
      $http
        .get(CONTAINER_URL, { params: { id: containerId } })
        .then(function (response) {
          $scope.workloadStat = response.data;
          //CPU & Memory
          updateNew(CPU_MEMORY, getDataNew(CPU_MEMORY, $scope.workloadStat));
          updateNew(BYTE, getDataNew(BYTE, $scope.workloadStat));
          //Session
          updateNew(SESSION, getDataNew(SESSION, $scope.workloadStat));
        })
        .catch(function (err) {
          console.log(err);
          $scope.stopRefresh();
          $scope.statsError = true;
          if (err.data && err.data.code === 7) $scope.onLost();
          else {
            $scope.statsError2 = true;
            $scope.statsErrMSG = err.data.message || "internal server error";
          }
        });
    }

    $scope.pageY = $window.innerHeight / 2 + 26;

    $scope.gridHeight = Utils.getMasterGridHeight() - 15;
    $scope.detailViewHeight = Utils.getDetailViewHeight() + 20;
    $scope.isSimpleTab = $window.innerWidth < 1500;
    $scope.isSimpleButton = ($window.innerWidth < 1730 && $window.innerWidth > 1500) || $window.innerWidth < 1200;

    angular.element($window).bind("resize", function () {
      $scope.gridHeight = $scope.pageY - 208;
      $scope.detailViewHeight = $window.innerHeight - $scope.pageY - 107;
      $scope.isSimpleTab = $window.innerWidth < 1500;
      $scope.isSimpleButton = ($window.innerWidth < 1730 && $window.innerWidth > 1500) || $window.innerWidth < 1200;
      $scope.$digest();
    });

    const mousemove = function (event) {
      $scope.pageY = event.pageY;
      if (event.pageY >= 208 && event.pageY <= $window.innerHeight - 115) {
        $scope.gridHeight = event.pageY - 208;
        $scope.detailViewHeight = $window.innerHeight - event.pageY - 107;
        setTimeout(function () {
          $scope.gridOptions.api.forEachNode((node, index) => {
            if ($scope.workload) {
              if (node.data.id === $scope.workload.brief.id) {
                node.setSelected(true, true);
                $scope.gridOptions.api.ensureNodeVisible(node, "middle");
              }
            } else if (index === 0) {
              node.setSelected(true, true);
              $scope.gridOptions.api.ensureNodeVisible(node, "middle");
            }
          });
          $scope.gridOptions.api.sizeColumnsToFit();
        });
      }
    };

    const mouseup = function () {
      $document.unbind("mousemove", mousemove);
      $document.unbind("mouseup", mouseup);
    };

    $scope.grabResizeBar = function (event) {
      event.preventDefault();
      $document.on("mousemove", mousemove);
      $document.on("mouseup", mouseup);
    };

    $scope.refreshStats = (containerId) => {
      $scope.noStats = false;
      if (
        containerId === null ||
        typeof containerId === "undefined" ||
        $scope.workload.brief.state === "unmanaged"
      ) {
        $scope.noStats = true;
        return;
      }
      if (intervalId === null || typeof intervalId === "undefined") {
        getStatsNew(containerId);
        if (
          containerId &&
          $scope.workloadsMap[containerId] &&
          $scope.workloadsMap[containerId].state === "exit"
        ) {
          $interval.cancel(intervalId);
          intervalId = null;
          return;
        }
        intervalId = $interval(function () {
          getStatsNew(containerId);
        }, 5000);
      }
    };

    $scope.stopRefresh = () => {
      if (intervalId !== null && typeof intervalId !== "undefined") {
        $interval.cancel(intervalId);
        intervalId = null;
      }
    };

    $scope.$on("$destroy", () => {
      $scope.stopRefresh();
      stopAutoInterval();
      stopInterval();
    });

    function renderChartsForPDF(data) {
      let userConfiguredSize = 0;
      let ruleTriggeredSize = 0;

      for (let item in data) {
        if (data.hasOwnProperty(item)) {
          if (data[item].quarantine_reason === "user-configured") {
            userConfiguredSize++;
          } else {
            ruleTriggeredSize++;
          }
        }
      }

      let sizes = [];
      let colors = [];
      let labels = [];

      if (userConfiguredSize > 0) {
        labels.push($translate.instant("containers.report.userConfig"));
        sizes.push(userConfiguredSize);
        colors.push("#ff9800");
      }

      if (ruleTriggeredSize > 0) {
        labels.push($translate.instant("containers.report.ruleTriggered"));
        sizes.push(ruleTriggeredSize);
        colors.push("#e91e63");
      }

      $scope.quarantineLabel = labels;
      $scope.quarantineData4pdf = sizes;
      $scope.quarantineColor = colors;
      $scope.quarantineOptions = {
        title: {
          display: true,
          text: $translate.instant("containers.report.chartTitleByReason"),
          position: "top",
          fontSize: 36,
          padding: 30,
        },
        scales: {
          yAxes: [
            {
              gridLines: {
                display: true,
              },
              ticks: {
                callback: function (value) {
                  if (value % 1 === 0) {
                    return value;
                  }
                },
                fontSize: 28,
                beginAtZero: true,
              },
            },
          ],
          xAxes: [
            {
              barThickness: 30,
              ticks: {
                fontSize: 28,
              },
            },
          ],
        },
        maintainAspectRatio: false,
      };
    }

    function _getFormattedData(quarantineData) {
      let content = [];
      let index = 1;
      for (let row of quarantineData) {
        content.push([
          index,
          row.display_name,
          !row.domain ? "default" : row.domain,
          row.host_name,
          row.children && Array.isArray(row.children) && row.children.length > 0
            ? row.children[0].image
            : row.image || "",
          !row.applications[0] ? " " : row.applications.join(", "),
          !row.quarantine_reason ? " " : row.quarantine_reason,
          $filter("date")(row.started_at, "MMM dd, y HH:mm:ss"),
        ]);
        index++;
      }

      return content;
    }

    function preparePdfData() {
      let byQuarantineReason = document
        .getElementById("byQuarantineReason")
        .toDataURL();

      let pdfData = _getFormattedData($scope.quarantineData);

      let dataGroupedBy = Utils.groupBy(
        $scope.quarantineData,
        "quarantine_reason"
      );

      let rawMap = new Map();
      for (let d in dataGroupedBy) {
        if (dataGroupedBy.hasOwnProperty(d)) {
          rawMap.set(d, dataGroupedBy[d].length);
        }
      }

      let sortedMap = new Map(
        [...rawMap.entries()].sort((a, b) => b[1] - a[1])
      );

      return {
        canvas: {
          byQuarantineReason: byQuarantineReason,
        },
        details: pdfData,
        quarantineByReason: sortedMap,
      };
    }

    function isScanFinished() {
      if (!$scope.workloads) return true;
      else {
        return (
          $scope.workloads
            .filter((workload) => {
              return workload.brief.state !== "exit";
            })
            .findIndex(function (item) {
              return (
                item.security.scan_summary.status !== "finished" &&
                item.security.scan_summary.status !== "failed"
              );
            }) < 0
        );
      }
    }

    $scope.downloadPdf = function () {
      let pdfData = preparePdfData();
      let docDefinition = ContainerFactory.defineDoc(pdfData);
      let pdf = pdfMake.createPdf(docDefinition);
      pdf.getBlob(function (blob) {
        // $scope.isPdfPreparing = false;
        FileSaver.saveAs(
          blob,
          `${$translate.instant("containers.report.title")}.pdf`
        );
      });
    };

    $scope.getScanReport = function (id, isExited = false, isShowingAccepted = false) {
      $scope.stopRefresh();
      if (isExited) {
        $scope.vulnerabilities = [];
        setTimeout(function () {
          $scope.cveGridOptions.api.setRowData([]);
          $scope.cveGridOptions.api.sizeColumnsToFit();
        }, 500);
      } else {
        ScanFactory.getWorkloadReport(id, isShowingAccepted)
          .then(function (vulnerabilities) {
            $scope.vulnerabilities = vulnerabilities;
            $scope.cveGridOptions.api.setRowData($scope.vulnerabilities);
            $scope.cveGridOptions.api.sizeColumnsToFit();
          })
          .catch(function (err) {
            $scope.vulnerabilities = [];
            $scope.contGridOptions.overlayNoRowsTemplate =
              Utils.getOverlayTemplateMsg(err);
            $scope.contGridOptions.api.setRowData();
          });
      }
    };

    $scope.toggleShowingAcceptedVuls = function(isShowingAccepted) {
      $scope.isShowingAccepted = !isShowingAccepted;
      $scope.getScanReport($scope.workload.brief.id, $scope.workload.brief.state === "exit", $scope.isShowingAccepted);
    };

    $scope.configAutoScan = function (scanConfig) {
      ScanFactory.configAutoScan(scanConfig)
        .then(function () {
          if (scanConfig.auto_scan) {
            let runningCount = 0;
            autoScanInterval = $interval(function () {
              if (isScanFinished() && runningCount > 0)
                $scope.$broadcast("auto-stopping");
              else $scope.refresh(true, true);
              runningCount++;
            }, 8000);
          } else {
            if (angular.isDefined(autoScanInterval)) {
              $interval.cancel(autoScanInterval);
              autoScanInterval = undefined;
            }
          }
        })
        .catch(function (err) {
          console.error(err);
        });
    };

    $scope.$on("auto-stopping", function () {
      stopAutoInterval();
    });

    $scope.$on("stop-manual-loading", function () {
      stopInterval();
    });

    $scope.onProcessFilterChanged = function (value) {
      $scope.procGridOptions.api.setQuickFilter(value);
    };

    $scope.onCveFilterChanged = function (value) {
      $scope.cveGridOptions.api.setQuickFilter(value);
    };

    $scope.onComplianceFilterChanged = function (value) {
      if (value.toLowerCase() === "level 1")
        $scope.complianceGridOptions.api.setQuickFilter("level1");
      else if (value.toLowerCase() === "level 2")
        $scope.complianceGridOptions.api.setQuickFilter("level2");
      else $scope.complianceGridOptions.api.setQuickFilter(value);
    };

    $scope.showRemediation = function (event, compliance) {
      event.stopPropagation();
      $scope.complianceName = compliance.name;
      $scope.remediation = compliance.remediation;
      $scope.onCompliance = true;
      $timeout(function () {
        $scope.onCompliance = false;
      }, 10000);
    };

    const getContainerInfo = function (id) {
      stopInterval();
      onScanInterval = $interval(function () {
        if ($scope.workload.brief.id === id) {
          if (
            $scope.workload.security.scan_summary.status === "finished" ||
            $scope.workload.security.scan_summary.status === "failed" ||
            $scope.workload.security.scan_summary.status === ""
          )
            $scope.$broadcast("stop-manual-loading");
        }
        $scope.refresh(true);
      }, 5000);
    };

    $scope.scan = function (id) {
      ScanFactory.startScan(SCAN_CONTAINER_URL, id)
        .then(function () {
          $scope.workload.security.scan_summary.status = "scanning";
          getContainerInfo(id);
        })
        .catch(function (err) {
          console.error(err);
        });
    };

    $scope.exportCsv = function () {
      let benchList = $scope.complianceGridOptions.api
        .getModel()
        .rootNode.childrenAfterFilter.map((node) => node.data);
      benchList = ComplianceFactory.flatCompliance(benchList);
      if (benchList.length > 0) {
        benchList.forEach((bench) => {
          if (bench.hasOwnProperty("test_number"))
            Utils.renameKey(bench, "test_number", "name");
        });
        let benches4Csv = JSON.parse(JSON.stringify(benchList));
        benches4Csv = benches4Csv.map(function (bench) {
          bench.description = bench.message
            ? `${bench.description.replace(/\"/g, "'")}\n${bench.message.join(
                "\n"
              )}`
            : `${bench.description.replace(/\"/g, "'")}`;
          if (bench.remediation)
            bench.remediation = `${bench.remediation.replace(/\"/g, "'")}`;
          delete bench.message;
          return bench;
        });
        let csvTitle = [];
        csvTitle.push(
          `${
            $scope.compliance.docker_cis_version
              ? `Docker ${$translate.instant("containers.CIS_VERSION")}: ${
                  $scope.compliance.docker_cis_version
                }`
              : ""
          }`
        );
        csvTitle.push(
          `${
            $scope.compliance.kubernetes_cis_version
              ? `Kubernetes ${$translate.instant("containers.CIS_VERSION")}: ${
                  $scope.compliance.kubernetes_cis_version
                }`
              : ""
          }`
        );
        csvTitle.push(
          `${
            $scope.compliance.run_at
              ? `${$translate.instant("scan.gridHeader.TIME")}: ${$filter(
                  "date"
                )($scope.compliance.run_at, "MMM dd y HH:mm:ss")}`
              : ""
          }`
        );
        csvTitle = csvTitle.filter((title) => title).join(",");
        let csv = Utils.arrayToCsv(benches4Csv, csvTitle);
        let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        let filename = `compliance-${$scope.workload.brief.name}_${Utils.parseDatetimeStr(new Date())}.csv`;
        FileSaver.saveAs(blob, filename);
      }
    };

    $scope.exportCve = function () {
      let cveList = $scope.cveGridOptions.api
        .getModel()
        .rootNode.childrenAfterFilter.map((node) => node.data);
      if (cveList.length > 0) {
        let vulnerabilities4Csv = JSON.parse(JSON.stringify(cveList));
        vulnerabilities4Csv = vulnerabilities4Csv.map(function (vulnerability) {
          // noinspection RegExpRedundantEscape
          vulnerability.description = `${vulnerability.description.replace(
            /\"/g,
            "'"
          )}`;
          vulnerability.tags = vulnerability.tags || "";
          return vulnerability;
        });
        let csv = Utils.arrayToCsv(vulnerabilities4Csv);
        let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        let filename =
          `vulnerabilities-${$scope.workload.brief.display_name}_${Utils.parseDatetimeStr(new Date())}.csv`;
        FileSaver.saveAs(blob, filename);
      }
    };

    $scope.acceptVulnerability = function(event, data) {
      let payload = {
        config: {
          entries: [
            {
              name: data.name,
              days: 0,
              comment: `Vulnerability was accepted on ${$scope.workload.brief.display_name} at ${$filter("date")(new Date(), "MMM dd, y HH:mm:ss")} from Containers page`,
              images: [],
              domains: [$scope.workload.brief.domain]
            }
          ],
          name: "default"
        }
      };

      CveProfileFactory.addCveProfile(payload)
      .then((res) => {
        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
        Alertify.success($translate.instant("cveProfile.msg.ADD_OK"));
        $timeout(() => {
          if ($scope.workload.brief.state === "exit")
            $scope.getScanReport($scope.workload.brief.id, true);
          else $scope.getScanReport($scope.workload.brief.id, false);
        }, 2000);
      })
      .catch((err) => {
        if (USER_TIMEOUT.indexOf(err.status) < 0) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(err, $translate.instant("cveProfile.msg.ADD_NG"), false)
          );
        }
      });
    };

    const getCisLabel = (compliance) => {
      if (compliance.kubernetes_cis_version.includes("-")) {
        let kubeCisVersionStrArray = compliance.kubernetes_cis_version.split("-");
        return `${kubeCisVersionStrArray[0]} ${$translate.instant(
          "containers.CIS_VERSION"
        )}: ${kubeCisVersionStrArray[1]}`;
      } else {
        return `Kubernetes ${$translate.instant("containers.CIS_VERSION")}: ${
          compliance.kubernetes_cis_version
        }`;
      }
    };

    const createComplianceGrid = () => {
      ComplianceFactory.prepareGrids();
      $scope.complianceGridOptions = ComplianceFactory.getGridOptions();
      $scope.complianceGridOptions.onColumnResized = function (params) {
        params.api.resetRowHeights();
      };
      $scope.complianceGridOptions.onSelectionChanged = () => {
        const acceptedRows = $scope.complianceGridOptions.api.getSelectedRows();
        $scope.onAccept = acceptedRows.length > 0;
        setTimeout(function () {
          $scope.$apply();
        }, 50);
      };
    };

    createComplianceGrid();

    $scope.getCompliance = function (id) {
      $scope.stopRefresh();
      ComplianceFactory.getCompliance(id)
        .then(function (response) {
          $scope.compliance = response.data;
          $scope.compliance.items = $scope.compliance.items.map(compliance => {
            if ($scope.compliance.kubernetes_cis_version && $scope.compliance.kubernetes_cis_version.includes("-")) {
              let kubeCisVersionStrArray = $scope.compliance.kubernetes_cis_version.split("-");
              compliance.category =  kubeCisVersionStrArray[0];
            }
            return compliance;
          });
          $scope.cisLabel = getCisLabel($scope.compliance);
          setTimeout(function () {
            let compliancelist = ComplianceFactory.remodelCompliance($scope.compliance.items);
            $scope.complianceGridOptions.api.setRowData(
              compliancelist
            );
            $scope.complianceGridOptions.api.sizeColumnsToFit();
          }, 300);
        })
        .catch(function (err) {
          if (err.status === 403) {
            $scope.complianceGridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
              "general.NO_ROWS"
            )}</span>`;
          } else {
            $scope.complianceGridOptions.overlayNoRowsTemplate =
              Utils.getOverlayTemplateMsg(err);
          }
          setTimeout(function () {
            $scope.complianceGridOptions.api.setRowData();
          }, 300);
        });
    };
  }
})();
