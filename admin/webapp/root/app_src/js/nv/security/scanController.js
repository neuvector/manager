(function() {
  "use strict";

  angular.module("app.assets").controller("ScanController", ScanController);

  ScanController.$inject = [
    "$scope",
    "$translate",
    "$filter",
    "$http",
    "$window",
    "$timeout",
    "Alertify",
    "$interval",
    "$rootScope",
    "Utils",
    "FileSaver",
    "Blob",
    "$stateParams",
    "ScanFactory",
    "$controller",
    "$state"
  ];
  function ScanController(
    $scope,
    $translate,
    $filter,
    $http,
    $window,
    $timeout,
    Alertify,
    $interval,
    $rootScope,
    Utils,
    FileSaver,
    Blob,
    $stateParams,
    ScanFactory,
    $controller,
    $state
  ) {
    const resource = {
      scanVulnerability: {
        global: 2
      },
      autoScan: {
        global: 2
      },
      nodeScan: {
        global: 2
      },
      platformScan: {
        global: 2
      }
    };

    $scope.isScanAuthorized = Utils.isAuthorized(
      $scope.user.roles,
      resource.scanVulnerability
    );
    $scope.isAutoScanAuthorized = Utils.isAuthorized(
      $scope.user.roles,
      resource.autoScan
    );
    $scope.isNodeScanAuthorized = Utils.isAuthorized(
      $scope.user.roles,
      resource.nodeScan
    );
    $scope.isPlatformScanAuthorized = Utils.isAuthorized(
      $scope.user.roles,
      resource.platformScan
    );

    $scope.enablePlatformScan =
      $rootScope.summary.platform &&
      $rootScope.summary.platform.includes("Kubernetes");

    let containersFilterStr = "";
    let nodesFilterStr = "";
    let containersCVEFilterStr = "";
    let nodesCVEFilterStr = "";
    let platformFilterStr = "";
    let platformCVEFilterStr = "";
    let manualScanTimer;
    const scanState = {
      IS_ON_SCAN: 0,
      IS_BACK_TO_SCAN: 1
    };

    activate();

    let baseCtl = $controller('BaseMultiClusterController',{ $scope: $scope});

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      ScanFactory.setGrids();

      let getEntityName1 = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("scan.COUNT_NODE_POSTFIX")
        );
      };
      let getEntityName2 = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("scan.COUNT_CONTAINER_POSTFIX")
        );
      };
      let getPlatformCount = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("scan.COUNT_PLATFORM_POSTFIX")
        );
      };
      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");
      /** @namespace $stateParams.imageId */
      let imageId = decodeURIComponent($stateParams.imageId);

      function getGridHeight() {
        return Math.max(180, $window.innerHeight - 53 - 374 - 150);
      }

      $scope.gridHeight = getGridHeight();

      angular.element($window).bind("resize", function() {
        $scope.gridHeight = getGridHeight();
        $scope.$digest();
      });

      /** @namespace $stateParams.tabId */
      $scope.active = $stateParams.tabId ? $stateParams.tabId : 0;

      $scope.onCVE = false;
      let timer;

      $scope.gridOptions = ScanFactory.gridOptions;
      $scope.gridOptions.onRowClicked = onSelectionChanged;

      $scope.hostGridOptions = ScanFactory.hostGridOptions;
      $scope.hostGridOptions.onRowClicked = onNodeChanged;

      $scope.platformGridOptions = ScanFactory.platformGridOptions;
      $scope.platformGridOptions.onRowClicked = onPlatformChanged;

      $scope.onFilterChanged = function(value, state) {
        if ($scope.active === 1) {
          nodesFilterStr = value;
          $scope.hostGridOptions.api.setQuickFilter(value);
          let node = $scope.hostGridOptions.api.getDisplayedRowAtIndex(0);
          if (node) {
            $scope.hasNode = true;
            if (state !== scanState.IS_ON_SCAN) {
              node.setSelected(true);
              onNodeChanged(node, true);
            }
          } else {
            $scope.hasNode = false;
          }
          let filteredCount1 = $scope.hostGridOptions.api.getModel().rootNode
            .childrenAfterFilter.length;
          $scope.count1 =
            filteredCount1 === $scope.hosts.length || value === ""
              ? `${$scope.hosts.length} ${getEntityName1($scope.hosts.length)}`
              : `${found} ${filteredCount1} ${getEntityName1(
                  filteredCount1
                )} ${outOf} ${$scope.hosts.length} ${getEntityName1(
                  $scope.hosts.length
                )}`;
        } else if ($scope.active === 0) {
          containersFilterStr = value;
          $scope.gridOptions.api.setQuickFilter(value);
          let container = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
          if (container) {
            $scope.hasContainer = true;
            if (state !== scanState.IS_ON_SCAN) {
              container.setSelected(true);
              onSelectWorkload(container.data, true);
            }
          } else {
            $scope.hasContainer = false;
          }
          let filteredCount2 = $scope.gridOptions.api.getModel().rootNode
            .childrenAfterFilter.length;
          $scope.count2 =
            filteredCount2 === $scope.containers.length || value === ""
              ? `${$scope.containers.length} ${getEntityName2(
                  $scope.containers.length
                )}`
              : `${found} ${filteredCount2} ${getEntityName2(
                  filteredCount2
                )} ${outOf} ${$scope.containers.length} ${getEntityName2(
                  $scope.containers.length
                )}`;
        } else {
          platformFilterStr = value;
          $scope.platformGridOptions.api.setQuickFilter(value);
          let platform = $scope.platformGridOptions.api.getDisplayedRowAtIndex(
            0
          );
          if (platform) {
            $scope.hasPlatform = true;
            platform.setSelected(true);
            onPlatformChanged(platform, true);
          } else {
            $scope.hasPlatform = false;
          }
          let filteredCount3 = $scope.platformGridOptions.api.getModel()
            .rootNode.childrenAfterFilter.length;
          $scope.count3 =
            filteredCount3 === $scope.platforms.length || value === ""
              ? `${$scope.platforms.length} ${getPlatformCount(
                  $scope.platforms.length
                )}`
              : `${found} ${filteredCount3} ${getPlatformCount(
                  filteredCount3
                )} ${outOf} ${$scope.platforms.length} ${getPlatformCount(
                  $scope.platforms.length
                )}`;
        }
      };

      $scope.onCveFilterChanged = function(value) {
        if ($scope.active === 1) {
          nodesCVEFilterStr = value;
        } else {
          containersCVEFilterStr = value;
        }
        $scope.contGridOptions.api.setQuickFilter(value);
      };

      $scope.onContainers = function(state) {
        $scope.containersErr = false;
        $scope.currentHostName = "";
        $scope.currentPlatformId = "";
        $http
          .get(SCAN_URL)
          .then(function(response) {
            if ($scope.contGridOptions.api && $scope.gridOptions.api) {
              $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
                "general.NO_ROWS"
              );
              $scope.containers = response.data.workloads;

              if (imageId && imageId !== "null") {
                $scope.containers = response.data.workloads.filter(function(
                  item
                ) {
                  return item.id === imageId;
                });
              }

              if ($scope.active === 0) {
                if ($scope.containers.length === 0) {
                  $scope.contGridOptions.api.setRowData([]);
                }
                let currSelection = "";
                if ($scope.container) {
                  currSelection = $scope.container.id;
                }
                $scope.gridOptions.api.setRowData($scope.containers);
                setTimeout(function() {
                  let firstNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                    0
                  );
                  $scope.isScanAuthorized = !!(($scope.active === 0 &&
                    firstNode.data.domain &&
                    $scope.user.roles.hasOwnProperty(
                      firstNode.data.domain
                    )) ||
                    $scope.user.roles.global === "2");
                  $scope.gridOptions.api.forEachNode(function(node, index) {
                    if ($scope.container && $scope.container.id) {
                      if (node.data.id === currSelection) {
                        node.setSelected(true);
                        console.log(
                          "Container status: ",
                          node.data.display_name,
                          node.data.status
                        );
                        $scope.isScanAuthorized = !!(($scope.active === 0 &&
                          node.data.domain &&
                          $scope.user.roles.hasOwnProperty(
                            node.data.domain
                          )) ||
                          $scope.user.roles.global === "2");
                        if (node.data.status === "finished") {
                          $scope.$broadcast("stop-manual-loading");
                        }
                        if (state !== scanState.IS_ON_SCAN) {
                          console.log(
                            "current container: ",
                            node.data.display_name
                          );
                          if (node.data.status === "scanning") {
                            $scope.scan(scanState.IS_BACK_TO_SCAN);
                            $scope.currentWorkloadName = node.data.name;
                          } else {
                            onSelectWorkload(node.data);
                          }
                        }
                        $scope.gridOptions.api.ensureNodeVisible(
                          node,
                          "middle"
                        );
                      }
                    } else if (index === 0) {
                      node.setSelected(true);
                      console.log(
                        "Container status: ",
                        node.data.display_name,
                        node.data.status
                      );
                      $scope.isScanAuthorized = !!(
                        ($scope.active === 0 &&
                          node.data.domain &&
                          $scope.user.roles.hasOwnProperty(node.data.domain)) ||
                        $scope.user.roles.global === "2"
                      );
                      if (node.data.status === "finished") {
                        $scope.$broadcast("stop-manual-loading");
                      }
                      if (state !== scanState.IS_ON_SCAN) {
                        if (node.data.status === "scanning") {
                          $scope.scan(scanState.IS_BACK_TO_SCAN);
                          $scope.currentWorkloadName = node.data.name;
                        } else {
                          onSelectWorkload(node.data);
                        }
                      }
                      $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                    }
                  });
                }, 50);
                $scope.count2 = `${$scope.containers.length} ${getEntityName2(
                  $scope.containers.length
                )}`;
                let failed = function() {
                  let count = 0;
                  angular.forEach(response.data.workloads, function(workload) {
                    count += workload.status === "failed" ? 1 : 0;
                  });
                  return count;
                };

                $scope.scanStatus = getScanStatus(response, failed);

                $scope.size = response.data.workloads.length;
                $scope.search = containersFilterStr;
                $scope.onFilterChanged($scope.search, state);
                $scope.searchCve = containersCVEFilterStr;
                $scope.onCveFilterChanged($scope.searchCve);
                setTimeout(function() {
                  $("span.pie").peity("pie");
                }, 300);
              }
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.containersErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      function getScanStatus(response, failed) {
        /** @namespace response.data.status.cvedb_create_time */
        /** @namespace response.data.status.cvedb_version */
        return {
          scanned: response.data.status.scanned,
          scanning: response.data.status.scanning,
          scheduled: response.data.status.scheduled,
          scanner_version: response.data.status.cvedb_version,
          scanner_created_date: $filter("date")(
            response.data.status.cvedb_create_time,
            "MMM dd, y"
          ),
          failed: failed()
        };
      }

      $scope.onNodes = function(state) {
        $scope.currentWorkloadName = null;
        $scope.currentPlatformId = "";
        $scope.nodesErr = false;
        $http
          .get(SCAN_HOST_URL)
          .then(function(response) {
            if ($scope.contGridOptions.api && $scope.hostGridOptions.api) {
              $scope.hostGridOptions.overlayNoRowsTemplate = $translate.instant(
                "general.NO_ROWS"
              );
              $scope.hosts = response.data.hosts;
              if ($scope.active === 1) {
                if ($scope.hosts.length === 0) {
                  $scope.contGridOptions.api.setRowData([]);
                }
                let currSelection = "";
                if ($scope.selectedNode) {
                  currSelection = $scope.selectedNode.id;
                }
                $scope.hostGridOptions.api.setRowData($scope.hosts);
                setTimeout(function() {
                  $scope.hostGridOptions.api.forEachNode(function(node, index) {
                    if ($scope.selectedNode) {
                      if (node.data.id === currSelection) {
                        node.setSelected(true);
                        console.log(
                          "Node status: ",
                          node.data.display_name,
                          node.data.status
                        );
                        if (node.data.status === "finished") {
                          $scope.$broadcast("stop-manual-loading");
                          $scope.refreshReport();
                        }
                        if (state !== scanState.IS_ON_SCAN) {
                          if (node.data.status === "scanning") {
                            $scope.scan(scanState.IS_BACK_TO_SCAN);
                          }
                        }
                        $scope.hostGridOptions.api.ensureNodeVisible(
                          node,
                          "middle"
                        );
                      }
                    } else if (index === 0) {
                      node.setSelected(true);
                      console.log(
                        "Node status: ",
                        node.data.display_name,
                        node.data.status
                      );
                      if (node.data.status === "finished") {
                        $scope.$broadcast("stop-manual-loading");
                        $scope.refreshReport();
                      }
                      if (state !== scanState.IS_ON_SCAN) {
                        if (node.data.status === "scanning") {
                          $scope.scan(scanState.IS_BACK_TO_SCAN);
                        }
                      }
                      $scope.hostGridOptions.api.ensureNodeVisible(
                        node,
                        "middle"
                      );
                    }
                  });
                }, 50);
                $scope.count1 = `${$scope.hosts.length} ${getEntityName1(
                  $scope.hosts.length
                )}`;
                let failed = function() {
                  let count = 0;
                  angular.forEach(response.data.hosts, function(host) {
                    count += host.status === "failed" ? 1 : 0;
                  });
                  return count;
                };

                $scope.scanStatus = getScanStatus(response, failed);

                $scope.size = response.data.hosts.length;
                $scope.search = nodesFilterStr;
                $scope.onFilterChanged($scope.search, state);
                $scope.searchCve = nodesCVEFilterStr;
                $scope.onCveFilterChanged($scope.searchCve);
                setTimeout(function() {
                  $("span.pie").peity("pie");
                }, 100);
              }
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.nodesErr = true;
            $scope.hostGridOptions.overlayNoRowsTemplate = utils.getOverlayTemplateMsg(err);
            $scope.hostGridOptions.api.setRowData();
          });
      };

      $scope.onPlatforms = function(state) {
        $scope.currentWorkloadName = null;
        $scope.platformsErr = false;
        $scope.currentHostName = "";
        $http
          .get(SCAN_PLATFORM_URL)
          .then(function(response) {
            if ($scope.contGridOptions.api && $scope.platformGridOptions.api) {
              $scope.platformGridOptions.overlayNoRowsTemplate = $translate.instant(
                "general.NO_ROWS"
              );
              $scope.platforms = response.data.platforms.map(function(item) {
                item.name = $rootScope.summary.platform || item.id;
                return item;
              });
              if ($scope.active === 2) {
                if ($scope.platforms.length === 0) {
                  $scope.contGridOptions.api.setRowData([]);
                }
                let currSelection = "";
                if ($scope.selectedPlatform) {
                  currSelection = $scope.selectedPlatform.id;
                }
                $scope.platformGridOptions.api.setRowData($scope.platforms);
                setTimeout(function() {
                  $scope.platformGridOptions.api.forEachNode(function(
                    node,
                    index
                  ) {
                    if ($scope.selectedPlatform) {
                      if (node.data.id === currSelection) {
                        node.setSelected(true);
                        console.log(
                          "Platform status: ",
                          node.data.display_name,
                          node.data.status
                        );
                        if (node.data.status === "finished") {
                          $scope.$broadcast("stop-manual-loading");
                          $scope.refreshReport();
                        }
                        if (state !== scanState.IS_ON_SCAN) {
                          if (node.data.status === "scanning") {
                            $scope.scan(scanState.IS_BACK_TO_SCAN);
                          }
                        }
                        $scope.platformGridOptions.api.ensureNodeVisible(
                          node,
                          "middle"
                        );
                      }
                    } else if (index === 0) {
                      node.setSelected(true);
                      console.log(
                        "Platform status: ",
                        node.data.display_name,
                        node.data.status
                      );
                      if (node.data.status === "finished") {
                        $scope.$broadcast("stop-manual-loading");
                        $scope.refreshReport();
                      }
                      if (state !== scanState.IS_ON_SCAN) {
                        if (node.data.status === "scanning") {
                          $scope.scan(scanState.IS_BACK_TO_SCAN);
                        }
                      }
                      $scope.platformGridOptions.api.ensureNodeVisible(
                        node,
                        "middle"
                      );
                    }
                  });
                }, 50);
                $scope.count3 = `${$scope.platforms.length} ${getPlatformCount(
                  $scope.platforms.length
                )}`;
                let failed = function() {
                  let count = 0;
                  angular.forEach(response.data.platforms, function(platform) {
                    count += platform.status === "failed" ? 1 : 0;
                  });
                  return count;
                };

                $scope.scanStatus = getScanStatus(response, failed);

                $scope.size = response.data.platforms.length;
                $scope.search = platformFilterStr;
                $scope.onFilterChanged($scope.search);
                $scope.searchCve = platformCVEFilterStr;
                $scope.onCveFilterChanged($scope.searchCve);
                setTimeout(function() {
                  $("span.pie").peity("pie");
                }, 100);
              }
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.nodesErr = true;
            $scope.platformGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.platformGridOptions.api.setRowData();
          });
      };

      $scope.init = function() {
        if ($scope.isAutoScanAuthorized) {
          ScanFactory.getScanConfig()
            .then(function(scanConfig) {
              $scope.scanConfig = scanConfig;
            })
            .catch(function(err) {
              console.warn(err);
            });
        }
      };

      $scope.refresh = function() {
        if ($scope.isAutoScanAuthorized) {
          $http
            .get(SCAN_CONFIG_URL)
            .then(function(response) {
              $scope.scanConfig = response.data.config;
              if ($scope.active === 1) {
                $scope.onNodes();
              } else if ($scope.active === 0) {
                $scope.onContainers();
              } else {
                $scope.onPlatforms();
              }
            })
            .catch(function(err) {
              console.warn(err);
              if (
                USER_TIMEOUT.indexOf(err.status) < 0
              ) {
                Alertify.alert(
                  Utils.getAlertifyMsg(err, $translate.instant("scan.message.CONFIG_ERR"), true)
                );
              }
            });
        }
      };

      $scope.refreshReport = function() {
        if ($scope.active === 1) {
          let selectedRows = $scope.hostGridOptions.api.getSelectedRows();
          $scope.selectedNode = selectedRows[0];
          if ($scope.selectedNode && $scope.selectedNode.id) {
            $scope.getNodeScanReport($scope.selectedNode.id, SCAN_HOST_URL);
          }
        } else if ($scope.active === 0) {
          let selectedRows = $scope.gridOptions.api.getSelectedRows();
          $scope.container = selectedRows[0];
          if ($scope.container && $scope.container.id) {
            $scope.getScanReport($scope.container.id, SCAN_URL);
          }
        } else {
          let selectedRows = $scope.platformGridOptions.api.getSelectedRows();
          $scope.selectedPlatform = selectedRows[0];
          if ($scope.selectedPlatform && $scope.selectedPlatform.id) {
            $scope.getPlatformScanReport(
              $scope.selectedPlatform.id,
              SCAN_PLATFORM_URL
            );
          }
        }
        $scope.onCVE = false;
      };

      $scope.init();

      $scope.configAutoScan = function(scanConfig) {
        $http
          .post(SCAN_CONFIG_URL, { config: scanConfig })
          .then(function() {
            if ($scope.active === 1) {
              $scope.onNodes(scanState.IS_ON_SCAN);
            } else if ($scope.active === 0) {
              $scope.onContainers(scanState.IS_ON_SCAN);
            } else if ($scope.active === 2) {
              $scope.onPlatforms(scanState.IS_ON_SCAN);
            }

            /** @namespace scanConfig.auto_scan */
            if (scanConfig.auto_scan) {
              timer = $interval(function() {
                if ($scope.active === 1) {
                  $scope.onNodes(scanState.IS_ON_SCAN);
                } else if ($scope.active === 0) {
                  $scope.onContainers(scanState.IS_ON_SCAN);
                } else if ($scope.active === 2) {
                  $scope.onPlatforms(scanState.IS_ON_SCAN);
                }

                if (
                  $scope.scanStatus.scanning === 0 &&
                  $scope.scanStatus.scheduled === 0
                )
                  $scope.$broadcast("auto-stopping");
              }, 10000);
            } else {
              if (angular.isDefined(timer)) {
                $interval.cancel(timer);
                timer = undefined;
              }
            }
          })
          .catch(function(err) {
            console.warn(err);
          });
      };

      $scope.$on("auto-stopping", function() {
        if (angular.isDefined(timer)) {
          $interval.cancel(timer);
          timer = undefined;
        }
      });

      $scope.currentWorkloadName = null;

      function onSelectWorkload(workload, isOnFilter) {
        $scope.container = workload;
        if (
          $scope.container &&
          $scope.container.name !== $scope.currentWorkloadName
        ) {
          $scope.getScanReport($scope.container.id, SCAN_URL);
          if ($scope.active === 0) {
            $scope.currentWorkloadName = $scope.container.name;
          }
          $scope.onCVE = false;
          if (!isOnFilter) {
            $scope.$apply();
          }
        }
      }

      function onSelectionChanged(params) {
        let node = params.node;
        $scope.isScanAuthorized = !!(($scope.active === 0 &&
          params.data.domain &&
          $scope.user.roles.hasOwnProperty(params.data.domain)) ||
          $scope.user.roles.global === "2");
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.container = selectedRows[0];
        node.setSelected(true);
        if (params.data.status === "scanning") {
          $scope.scan(scanState.IS_BACK_TO_SCAN);
          $scope.currentWorkloadName = node.data.name;
        } else {
          onSelectWorkload(params.node.data);
        }
      }

      $scope.currentHostName = "";
      function onNodeChanged(node, isOnFilter) {
        let selectedRows = $scope.hostGridOptions.api.getSelectedRows();
        $scope.selectedNode = selectedRows[0];
        console.log(node.data.name, $scope.currentHostName);
        if (node.data.name !== $scope.currentHostName) {
          if (node.data.status === "scanning") {
            $scope.scan(scanState.IS_BACK_TO_SCAN);
          } else {
            $scope.getNodeScanReport(node.data.id, SCAN_HOST_URL);
          }
          if ($scope.active === 1) {
            $scope.currentHostName = node.data.name;
          }
          $scope.onCVE = false;
          $timeout(function() {
            $scope.hostGridOptions.api.sizeColumnsToFit();
          }, 1000);
          if (!isOnFilter) {
            $scope.$apply();
          }
        }
      }

      $scope.currentPlatformId = "";
      function onPlatformChanged(platform, isOnFilter) {
        let selectedRows = $scope.platformGridOptions.api.getSelectedRows();
        $scope.selectedPlatform = selectedRows[0];
        if ($scope.selectedPlatform.id !== $scope.currentPlatformId) {
          if (platform.status === "scanning") {
            $scope.scan(scanState.IS_BACK_TO_SCAN);
          } else {
            $scope.getPlatformScanReport(
              $scope.selectedPlatform.id,
              SCAN_PLATFORM_URL
            );
          }
          if ($scope.active === 2) {
            $scope.currentPlatformId = $scope.selectedPlatform.id;
          }
          $scope.onCVE = false;
          $timeout(function() {
            $scope.platformGridOptions.api.sizeColumnsToFit();
          }, 1000);
          if (!isOnFilter) {
            $scope.$apply();
          }
        }
      }

      $scope.openCVE = function(link) {
        $window.open(link);
      };

      function handleScan(url, id, state, callback) {
        // let timeCount = 0;
        if (angular.isDefined(manualScanTimer)) {
          let resOfTimerCancel = $interval.cancel(manualScanTimer);
          manualScanTimer = undefined;
          if (!resOfTimerCancel) {
            console.warn("Timer cancel failed!");
          }
        }
        if (state === scanState.IS_BACK_TO_SCAN) {
          callback();
          manualScanTimer = $interval(function() {
            callback();
          }, 5000);
        } else {
          $http
            .post(url, id)
            .then(function() {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("scan.START_SCAN"));
              callback();
              manualScanTimer = $interval(function() {
                callback();
              }, 5000);
            })
            .catch(function(err) {
              console.warn(err);
              if (
                USER_TIMEOUT.indexOf(err.status) < 0
              ) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(err, $translate.instant("scan.FAILED_SCAN"), false)
                );
              }
            });
        }
      }

      $scope.scan = function(state = scanState.IS_ON_SCAN) {
        if ($scope.active === 0 && $scope.container && $scope.container.id) {
          handleScan(
            SCAN_CONTAINER_URL,
            $scope.container.id,
            state,
            function() {
              $scope.onContainers(scanState.IS_ON_SCAN);
              $scope.refreshReport();
            }
          );
        }
        if ($scope.active === 1 && $scope.selectedNode) {
          handleScan(SCAN_HOST_URL, $scope.selectedNode.id, state, function() {
            $scope.onNodes(scanState.IS_ON_SCAN);
            $scope.refreshReport();
          });
        }
        if ($scope.active === 2 && $scope.selectedPlatform) {
          handleScan(
            SCAN_PLATFORM_URL,
            $scope.selectedPlatform.id,
            state,
            function() {
              $scope.onPlatforms(scanState.IS_ON_SCAN);
              $scope.refreshReport();
            }
          );
        }
      };

      $scope.$on("stop-manual-loading", function() {
        if (angular.isDefined(manualScanTimer)) {
          $interval.cancel(manualScanTimer);
          manualScanTimer = undefined;
        }
      });

      $scope.contGridOptions = ScanFactory.cveGridOptions;
      $scope.contGridOptions.onSelectionChanged = onCVESelectionChanged;

      $scope.getScanReport = function(id, url) {
        $scope.contGridOptions.overlayNoRowsTemplate = null;
        $http
          .get(url, { params: { id: id } })
          .then(function(response) {
            /** @namespace response.data.report */
            $scope.contGridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            if (response.data.report) {
              $scope.vulnerabilities = response.data.report.vulnerabilities;
              if ($scope.active === 0) {
                $scope.contGridOptions.api.setRowData($scope.vulnerabilities);
              }
            } else {
              $scope.vulnerabilities = [];
              $scope.contGridOptions.api.setRowData([]);
            }
            $scope.contGridOptions.api.sizeColumnsToFit();
          })
          .catch(function(err) {
            $scope.vulnerabilities = [];
            console.warn(err);
            $scope.contGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.contGridOptions.api.setRowData();
          });
      };

      $scope.getNodeScanReport = function(id, url) {
        $scope.contGridOptions.overlayNoRowsTemplate = null;
        $http
          .get(url, { params: { id: id } })
          .then(function(response) {
            /** @namespace response.data.report */
            $scope.contGridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            if (response.data.report) {
              $scope.nodeVulnerabilities = response.data.report.vulnerabilities;
              if ($scope.active === 1) {
                $scope.contGridOptions.api.setRowData(
                  $scope.nodeVulnerabilities
                );
              }
            } else {
              $scope.vulnerabilities = [];
              $scope.contGridOptions.api.setRowData([]);
            }
            $scope.contGridOptions.api.sizeColumnsToFit();
          })
          .catch(function(err) {
            $scope.vulnerabilities = [];
            console.warn(err);
            $scope.contGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.contGridOptions.api.setRowData();
          });
      };

      $scope.getPlatformScanReport = function(id, url) {
        $scope.platformGridOptions.overlayNoRowsTemplate = null;
        $http
          .get(url, { params: { id: id } })
          .then(function(response) {
            /** @namespace response.data.report */
            $scope.platformGridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            if (response.data.report) {
              $scope.platformVulnerabilities =
                response.data.report.vulnerabilities;
              if ($scope.active === 2) {
                $scope.contGridOptions.api.setRowData(
                  $scope.platformVulnerabilities
                );
              }
            } else {
              $scope.vulnerabilities = [];
              $scope.contGridOptions.api.setRowData([]);
            }
            $scope.contGridOptions.api.sizeColumnsToFit();
          })
          .catch(function(err) {
            $scope.vulnerabilities = [];
            console.warn(err);
            $scope.contGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.contGridOptions.api.setRowData();
          });
      };

      $scope.exportCsv = function() {
        if ($scope.active === 0) {
          if ($scope.vulnerabilities && $scope.vulnerabilities.length > 0) {
            let vulnerabilities4Csv = JSON.parse(
              JSON.stringify($scope.vulnerabilities)
            );
            vulnerabilities4Csv = vulnerabilities4Csv.map(function(
              vulnerability
            ) {
              // noinspection RegExpRedundantEscape
              vulnerability.description = `"${vulnerability.description.replace(
                /\"/g,
                "'"
              )}"`;
              return vulnerability;
            });
            let csv = Utils.arrayToCsv(vulnerabilities4Csv);
            let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            let filename =
              "vulnerabilities-" + $scope.container.display_name + ".csv";
            FileSaver.saveAs(blob, filename);
          }
        } else if ($scope.active === 1) {
          if (
            $scope.nodeVulnerabilities &&
            $scope.nodeVulnerabilities.length > 0
          ) {
            let nodeVulnerabilities4Csv = JSON.parse(
              JSON.stringify($scope.nodeVulnerabilities)
            );
            nodeVulnerabilities4Csv = nodeVulnerabilities4Csv.map(function(
              nodeVulnerability
            ) {
              // noinspection RegExpRedundantEscape
              nodeVulnerability.description = `"${nodeVulnerability.description.replace(
                /\"/g,
                "'"
              )}"`;
              return nodeVulnerability;
            });
            let csv = Utils.arrayToCsv(nodeVulnerabilities4Csv);
            let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            let filename =
              "vulnerabilities-" + $scope.selectedNode.display_name + ".csv";
            FileSaver.saveAs(blob, filename);
          }
        } else if ($scope.active === 2) {
          if (
            $scope.platformVulnerabilities &&
            $scope.platformVulnerabilities.length > 0
          ) {
            let platformVulnerabilities4Csv = JSON.parse(
              JSON.stringify($scope.platformVulnerabilities)
            );
            platformVulnerabilities4Csv = platformVulnerabilities4Csv.map(
              function(platformVulnerability) {
                // noinspection RegExpRedundantEscape
                platformVulnerability.description = `"${platformVulnerability.description.replace(
                  /\"/g,
                  "'"
                )}"`;
                return platformVulnerability;
              }
            );
            let csv = Utils.arrayToCsv(platformVulnerabilities4Csv);
            let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            let filename =
              "vulnerabilities-" + $scope.selectedPlatform.id + ".csv";
            FileSaver.saveAs(blob, filename);
          }
        }
      };

      function onCVESelectionChanged() {
        let selectedRows = $scope.contGridOptions.api.getSelectedRows();
        $scope.cveName = selectedRows[0].name;
        $scope.cveLink = selectedRows[0].link;
        $scope.cveDescription = selectedRows[0].description;
        $scope.onCVE = true;
        $scope.$apply();
        $timeout(function() {
          $scope.onCVE = false;
        }, 10000);
      }

      $scope.$on("$destroy", function() {
        if (angular.isDefined(timer)) {
          $interval.cancel(timer);
          timer = undefined;
        }
        if (angular.isDefined(manualScanTimer)) {
          $interval.cancel(manualScanTimer);
          manualScanTimer = undefined;
        }
      });
    }
  }
})();
