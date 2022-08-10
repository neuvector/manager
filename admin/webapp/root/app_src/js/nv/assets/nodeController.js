(function () {
  "use strict";

  angular.module("app.assets").controller("NodeController", NodeController);

  NodeController.$inject = [
    "$scope",
    "$rootScope",
    "$translate",
    "$http",
    "$window",
    "$document",
    "$timeout",
    "$interval",
    "$state",
    "$stateParams",
    "ContainerFactory",
    "ScanFactory",
    "NodeFactory",
    "ComplianceFactory",
    "Utils",
    "FileSaver",
    "Blob",
    "$controller",
    "$filter",
    "Alertify",
    "AuthorizationFactory",
    "CveProfileFactory"
  ];
  function NodeController(
    $scope,
    $rootScope,
    $translate,
    $http,
    $window,
    $document,
    $timeout,
    $interval,
    $state,
    $stateParams,
    ContainerFactory,
    ScanFactory,
    NodeFactory,
    ComplianceFactory,
    Utils,
    FileSaver,
    Blob,
    $controller,
    $filter,
    Alertify,
    AuthorizationFactory,
    CveProfileFactory
  ) {
    let filter = "";

    $scope.isAutoScanAuthorized =
      AuthorizationFactory.getDisplayFlag("runtime_scan");
    $scope.isVulsAuthorized = AuthorizationFactory.getDisplayFlag("vuls_profile");
    $scope.isWriteVulsAuthorized = AuthorizationFactory.getDisplayFlag("write_vuls_profile");
    $scope.isNamespaceUser =
      AuthorizationFactory.userPermission.isNamespaceUser;
    $scope.onCVE = false;
    $scope.onAutoScan = false;
    $scope.isAccepted = true;
    $scope.cve = [];
    $scope.isSimpleTab = false;
    $scope.isSimpleButton = false;
    $scope.isShowingAccepted = false;
    $scope.complianceGridOptions = null;

    function getScanConfig() {
      if ($scope.isAutoScanAuthorized && !$scope.isNamespaceUser) {
        ScanFactory.getScanConfig()
          .then(function (scanConfig) {
            $scope.scanConfig = scanConfig;
          })
          .catch(function (err) {
            console.warn(err);
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

    $scope.$on("$destroy", function () {
      stopAutoInterval();
      stopInterval();
    });

    function isScanFinished() {
      if (!$scope.hosts) return true;
      else {
        return (
          $scope.hosts.findIndex(function (item) {
            return (
              item.scan_summary.status !== "finished" &&
              item.scan_summary.status !== "failed"
            );
          }) < 0
        );
      }
    }

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      ContainerFactory.prepareGrids();
      ScanFactory.setGrids();

      getScanConfig();

      let getEntityName = function (count) {
        return Utils.getEntityName(
          count,
          $translate.instant("nodes.COUNT_POSTFIX")
        );
      };

      const found = $translate.instant("enum.FOUND");

      let nodeId = $stateParams.nodeId;
      NodeFactory.prepareGrids();
      $scope.gridOptions = NodeFactory.getGridOptions();
      $scope.gridOptions.onSelectionChanged = onSelectionChanged;

      $scope.onFilterChanged = function (value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasNode = true;
          node.setSelected(true);
        } else {
          $scope.hasNode = false;
        }
        let filteredCount =
          $scope.gridOptions.api.getModel().rootNode.childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.hosts.length || value === ""
            ? `${$scope.hosts.length} ${getEntityName($scope.hosts.length)}`
            : `${found} ${filteredCount} / ${
                $scope.hosts.length
              } ${getEntityName($scope.hosts.length)}`;
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
            $scope.onContainerFilterChanged(searchBottom);
            break;
        }
      };

      $scope.pageY = $window.innerHeight / 2 + 41;

      $scope.gridHeight = Utils.getMasterGridHeight();
      $scope.detailViewHeight = Utils.getDetailViewHeight() - 5;
      $scope.isSimpleTab = $window.innerWidth < 1300;
      $scope.isSimpleButton = ($window.innerWidth < 1540 && $window.innerWidth > 1300) || $window.innerWidth < 1130;

      angular.element($window).bind("resize", function () {
        $scope.gridHeight = $scope.pageY - 208;
        $scope.detailViewHeight = $window.innerHeight - $scope.pageY - 114;
        $scope.isSimpleTab = $window.innerWidth < 1300;
        $scope.isSimpleButton = ($window.innerWidth < 1540 && $window.innerWidth > 1300) || $window.innerWidth < 1130;
        $scope.$digest();
      });

      const mousemove = function (event) {
        $scope.pageY = event.pageY;
        if (event.pageY >= 208 && event.pageY <= $window.innerHeight - 115) {
          $scope.gridHeight = event.pageY - 208;
          $scope.detailViewHeight = $window.innerHeight - event.pageY - 113;
          setTimeout(function () {
            $scope.gridOptions.api.forEachNode(function (node, index) {
              if (nodeId && nodeId !== "null") {
                if (node.data.id === nodeId) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                }
              } else {
                if ($scope.host && $scope.host.id) {
                  if (node.data.id === $scope.host.id) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                }
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

      $scope.showRemediation = function (event, compliance) {
        event.stopPropagation();
        $scope.complianceRemediation = compliance.remediation;
        $scope.complianceMessage =
          compliance.message === null ? "" : compliance.message.join(", ");
        $scope.complianceGroup = compliance.group;
        $scope.onCompliance = true;
        $timeout(function () {
          $scope.onCompliance = false;
        }, 15000);
      };

      $scope.refresh = function (onScan = false) {
        $scope.isAccepted = true;
        $scope.cve = [];
        $scope.nodeErr = false;
        $http
          .get(NODES_URL)
          .then(function (response) {
            $scope.gridOptions.overlayNoRowsTemplate =
              $translate.instant("general.NO_ROWS");
            let currSelectedNode = angular.copy($scope.host);
            $scope.gridOptions.api.setRowData(response.data.hosts);
            $scope.hosts = response.data.hosts;
            if ($scope.hosts.length > 0) {
              $scope.hasNode = true;
            }

            setTimeout(function () {
              $scope.gridOptions.api.forEachNode(function (node, index) {
                if (nodeId && nodeId !== "null") {
                  if (node.data.id === nodeId) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                  }
                } else {
                  if (currSelectedNode) {
                    if (node.data.id === currSelectedNode.id) {
                      node.setSelected(true);
                      $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                    }
                  }
                }
              });
            });
            $scope.count = `${$scope.hosts.length} ${getEntityName(
              $scope.hosts.length
            )}`;
            if (!onScan) $scope.onFilterChanged(filter);
          })
          .catch(function (err) {
            console.warn(err);
            $scope.nodeErr = true;
            $scope.hosts = ["", "", "", "", ""];
            $scope.gridOptions.overlayNoRowsTemplate =
              Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.refresh();

      $scope.isEmpty = function (obj) {
        if (!obj) return true;
        return Object.keys(obj).length === 0;
      };

      function onSelectionChanged() {
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.host = selectedRows[0];
        $scope.isShowingAccepted = false;
        if ($scope.selectedIndex === 3) {
          $scope.gridOptions.api.sizeColumnsToFit();
          $scope.getContainers($scope.host.id);
        } else if ($scope.selectedIndex === 2) {
          if ($scope.host.scan_summary.status) {
            if ($scope.host.scan_summary.status === "scanning") {
              $scope.disableScan = true;
              getHostInfo($scope.host.id);
            } else if (
              $scope.host.scan_summary.status === "finished" ||
              $scope.host.scan_summary.status === "failed"
            ) {
              $scope.disableScan = false;
              $scope.$broadcast("stop-manual-loading");
            }
          }

          if (!$scope.onAutoScan) {
            $scope.getNodeScanReport($scope.host.id);
          }
        } else if ($scope.selectedIndex === 1) {
          $scope.getCompliance($scope.host.id);
        }
        $scope.$apply();
      }

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

      $scope.contGridOptions = ContainerFactory.getGridOptions();

      $scope.onContainerFilterChanged = function (value) {
        $scope.contGridOptions.api.setQuickFilter(value);
      };

      $scope.toggleSystemNode = function (hideNode) {
        $scope.hideSystemNode = hideNode;
        if (hideNode) {
          if ($scope.workloads && $scope.workloads.length > 0) {
            $scope.workloads = $scope.workloads.filter(function (item) {
              return item.state !== "exit" && !item.platform_role;
            });
          }
          $scope.contGridOptions.api.setRowData($scope.workloads);
        } else $scope.getContainers($scope.host.id);
      };

      $scope.getContainers = function (id) {
        $http
          .get(NODE_WORKLOADS_URL, { params: { id: id } })
          .then(function (response) {
            $scope.contGridOptions.overlayNoRowsTemplate =
              $translate.instant("general.NO_ROWS");
            $scope.workloads = response.data.workloads;
            if ($scope.hideSystemNode) {
              if ($scope.workloads && $scope.workloads.length > 0) {
                $scope.workloads = $scope.workloads.filter(function (item) {
                  return item.state !== "exit" && !item.platform_role;
                });
              }
            }
            $scope.contGridOptions.api.setRowData($scope.workloads);
            $scope.contGridOptions.api.sizeColumnsToFit();
          })
          .catch(function (err) {
            console.warn(err);
            $scope.contGridOptions.overlayNoRowsTemplate =
              Utils.getOverlayTemplateMsg(err);
            $scope.contGridOptions.api.setRowData();
          });
      };

      $scope.cveGridOptions = ScanFactory.cveGridOptions;
      $scope.cveGridOptions.onSelectionChanged = onCVESelectionChanged;

      $scope.getNodeScanReport = function (id, isShowingAccepted = false) {
        $scope.cveGridOptions.overlayNoRowsTemplate = null;
        $http
          .get(SCAN_HOST_URL, { params: { id: id, show: isShowingAccepted ? "accepted" : null} })
          .then(function (response) {
            /** @namespace response.data.report */
            $scope.cveGridOptions.overlayNoRowsTemplate =
              $translate.instant("general.NO_ROWS");
            if (response.data.report) {
              $scope.nodeVulnerabilities = response.data.report.vulnerabilities;
              $scope.cveGridOptions.api.setRowData($scope.nodeVulnerabilities);
            } else {
              $scope.nodeVulnerabilities = [];
              $scope.cveGridOptions.api.setRowData([]);
            }
            $scope.cveGridOptions.api.sizeColumnsToFit();
            $scope.onCVE = false;
          })
          .catch(function (err) {
            $scope.nodeVulnerabilities = [];
            console.warn(err);
            $scope.cveGridOptions.overlayNoRowsTemplate =
              Utils.getOverlayTemplateMsg(err);
            $scope.cveGridOptions.api.setRowData([]);
          });
      };

      $scope.toggleShowingAcceptedVuls = function(isShowingAccepted) {
        $scope.isShowingAccepted = !isShowingAccepted;
        $scope.getNodeScanReport($scope.host.id, $scope.isShowingAccepted);
      };

      const getHostInfo = function (id) {
        stopInterval();
        onScanInterval = $interval(function () {
          console.log($scope.host.id, id, $scope.host.id === id);
          console.log($scope.host.scan_summary);
          if ($scope.host.id === id) {
            if (
              $scope.host.scan_summary &&
              ($scope.host.scan_summary.status === "finished" ||
                $scope.host.scan_summary.status === "failed")
            ) {
              $scope.$broadcast("stop-manual-loading");
            }
          }
          $scope.refresh(true);
        }, 5000);
      };

      $scope.scan = function (id) {
        ScanFactory.startScan(SCAN_HOST_URL, id)
          .then(function () {
            $scope.host.scan_summary.status = "scanning";
            getHostInfo(id);
          })
          .catch(function (err) {
            console.error(err);
          });
      };

      $scope.configAutoScan = function (scanConfig) {
        ScanFactory.configAutoScan(scanConfig)
          .then(function () {
            //todo: refresh node grid and cve grid
            if (scanConfig.auto_scan) {
              $scope.onAutoScan = true;
              let runningCount = 0;
              autoScanInterval = $interval(function () {
                if (isScanFinished() && runningCount > 0)
                  $scope.$broadcast("auto-stopping");
                else $scope.refresh(true);
                runningCount++;
              }, 8000);
            } else {
              $scope.onAutoScan = false;
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
        $timeout(() => {
          $scope.onAutoScan = false;
        }, 1000);
      });

      $scope.$on("stop-manual-loading", function () {
        stopInterval();
      });

      $scope.onCveFilterChanged = function (value) {
        $scope.cveGridOptions.api.setQuickFilter(value);
      };

      $scope.exportCsv = function () {
        let benchList = $scope.complianceGridOptions.api
          .getModel()
          .rootNode.childrenAfterFilter.map((node) => node.data);
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
                ? `Kubernetes ${$translate.instant(
                    "containers.CIS_VERSION"
                  )}: ${$scope.compliance.kubernetes_cis_version}`
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
          let filename = `compliance-${$scope.host.name}_${Utils.parseDatetimeStr(new Date())}.csv`;
          FileSaver.saveAs(blob, filename);
        }
      };

      $scope.exportCve = function () {
        let cveList = $scope.cveGridOptions.api
          .getModel()
          .rootNode.childrenAfterFilter.map((node) => node.data);
        if (cveList.length > 0) {
          let vulnerabilities4Csv = JSON.parse(JSON.stringify(cveList));
          vulnerabilities4Csv = vulnerabilities4Csv.map(function (
            vulnerability
          ) {
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
          let filename = `vulnerabilities-${$scope.host.name}_${Utils.parseDatetimeStr(new Date())}.csv`;
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
                comment: `Vulnerability was accepted on ${$scope.host.name} at ${$filter("date")(new Date(), "MMM dd, y HH:mm:ss")} from Hosts page`,
                images: [],
                domains: []
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
            $scope.getNodeScanReport($scope.host.id);
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

      $scope.onComplianceFilterChanged = function (value) {
        if (value.toLowerCase() === "level 1")
          $scope.complianceGridOptions.api.setQuickFilter("level1");
        else if (value.toLowerCase() === "level 2")
          $scope.complianceGridOptions.api.setQuickFilter("level2");
        else $scope.complianceGridOptions.api.setQuickFilter(value);
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
        ComplianceFactory.getNodeCompliance(id)
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
  }
})();
