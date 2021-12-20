(function () {
  "use strict";

  angular
    .module("app.assets")
    .controller("PlatformController", PlatformController);

  PlatformController.$inject = [
    "$scope",
    "$rootScope",
    "$translate",
    "$http",
    "$window",
    "$document",
    "$timeout",
    "$interval",
    "$stateParams",
    "ScanFactory",
    "PlatformFactory",
    "Utils",
    "$controller",
    "$state",
    "$filter",
    "FileSaver",
    "Alertify",
    "AuthorizationFactory",
    "CveProfileFactory"
  ];
  function PlatformController(
    $scope,
    $rootScope,
    $translate,
    $http,
    $window,
    $document,
    $timeout,
    $interval,
    $stateParams,
    ScanFactory,
    PlatformFactory,
    Utils,
    $controller,
    $state,
    $filter,
    FileSaver,
    Alertify,
    AuthorizationFactory,
    CveProfileFactory
  ) {
    let filter = "";

    $scope.isAutoScanAuthorized = AuthorizationFactory.getDisplayFlag("runtime_scan");
    $scope.isVulsAuthorized = AuthorizationFactory.getDisplayFlag("vuls_profile");
    $scope.isWriteVulsAuthorized = AuthorizationFactory.getDisplayFlag("write_vuls_profile");
    PlatformFactory.isAutoScanAuthorized = $scope.isAutoScanAuthorized;
    $scope.isNamespaceUser = AuthorizationFactory.userPermission.isNamespaceUser;
    $scope.onCVE = false;
    $scope.isShowingAccepted = false;
    $scope.isAccepted = true;
    $scope.cve = [];
    $scope.isSimpleButton = false;

    $scope.enablePlatformScan =
      $rootScope.summary.platform &&
      $rootScope.summary.platform.includes("Kubernetes");

    let onScanInterval = undefined;

    const stopInterval = () => {
      if (angular.isDefined(onScanInterval)) {
        $interval.cancel(onScanInterval);
        onScanInterval = undefined;
      }
    };

    const getScanConfig = () => {
      if ($scope.isAutoScanAuthorized && !$scope.isNamespaceUser) {
        ScanFactory.getScanConfig()
          .then(function (scanConfig) {
            $scope.scanConfig = scanConfig;
          })
          .catch(function (err) {
            console.warn(err);
          });
      }
    };

    $scope.pageY = $window.innerHeight / 2 + 41;

    $scope.gridHeight = Utils.getMasterGridHeight();
    $scope.detailViewHeight = Utils.getDetailViewHeight() + 30;
    $scope.isSimpleButton = $window.innerWidth < 1080;

    angular.element($window).bind("resize", function() {
      $scope.gridHeight = $scope.pageY - 208;
      $scope.detailViewHeight = $window.innerHeight -  $scope.pageY - 79;
      $scope.isSimpleButton = $window.innerWidth < 1080;
      $scope.$digest();
    });

    const mousemove = function(event) {
      $scope.pageY = event.pageY;
      if (event.pageY >= 208 && event.pageY <= $window.innerHeight - 115) {
        $scope.gridHeight = event.pageY - 208;
        $scope.detailViewHeight = $window.innerHeight -  event.pageY - 78;
        setTimeout(function () {
          $scope.gridOptions.api.sizeColumnsToFit();
          $scope.gridOptions.api.forEachNode(function (node, index) {
            if (
              $scope.selectedPlatform &&
              $scope.selectedPlatform.platform
            ) {
              if (node.data.platform === $scope.selectedPlatform.platform) {
                node.setSelected(true);
                $scope.gridOptions.api.ensureNodeVisible(node, "middle");
              }
            } else if (index === 0) {
              node.setSelected(true);
              $scope.gridOptions.api.ensureNodeVisible(node, "middle");
            }
          });
        }, 200);
      }
    };

    const mouseup = function() {
      $document.unbind('mousemove', mousemove);
      $document.unbind('mouseup', mouseup);
    };

    $scope.grabResizeBar = function(event) {
      event.preventDefault();
      $document.on('mousemove', mousemove);
      $document.on('mouseup', mouseup);
    };

    const onPlatformChanged = () => {
      let selectedRows = $scope.gridOptions.api.getSelectedRows();
      $scope.selectedPlatform = selectedRows[0];
      $scope.isShowingAccepted = false;

      if ($scope.selectedPlatform.status === "scanning") {
        $scope.disableScan = true;
      } else {
        $scope.disableScan = false;
        $scope.getScanReport($scope.selectedPlatform.platform);
      }
      setTimeout(function () {
        $scope.gridOptions.api.sizeColumnsToFit();
      }, 300);
      $scope.$apply();
    };

    const onCVESelectionChanged = () => {
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
    };

    $scope.refresh = () => {
      $scope.isAccepted = true;
      $scope.cve = [];
      $scope.platformsErr = false;
      $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
        "general.NO_ROWS"
      );
      PlatformFactory.getPlatforms()
        .then((response) => {
          $scope.platforms = response.data.platforms.map(function (item) {
            item.name = $rootScope.summary.platform || item.platform;
            return item;
          });
          if ($scope.platforms && $scope.platforms.length === 0) {
            $scope.gridOptions.api.setRowData([]);
            $scope.cveGridOptions.api.setRowData([]);
          } else {
            setTimeout(function () {
              $scope.gridOptions.api.setRowData($scope.platforms);
              $scope.gridOptions.api.sizeColumnsToFit();
              $scope.gridOptions.api.forEachNode(function (node, index) {
                if (
                  $scope.selectedPlatform &&
                  $scope.selectedPlatform.platform
                ) {
                  if (node.data.platform === $scope.selectedPlatform.platform) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                }
              });
            }, 500);
            $scope.onFilterChanged(filter);
          }
        })
        .catch(function (err) {
          console.warn(err);
          if (err.status >= 400 && err.status < 500) {
            $scope.gridOptions.api.setRowData([]);
            $scope.cveGridOptions.api.setRowData([]);
          } else {
            $scope.platformsErr = true;
          }
        });
    };

    $scope.getScanReport = (id, isShowingAccepted = false) => {
      PlatformFactory.getScanReport(id, isShowingAccepted)
        .then(function (vulnerabilities) {
          $scope.vulnerabilities = vulnerabilities;
          setTimeout(function () {
            $scope.cveGridOptions.api.setRowData($scope.vulnerabilities);
            $scope.cveGridOptions.api.sizeColumnsToFit();
            $scope.onCVE = false;
          }, 300);
        })
        .catch(function (err) {
          $scope.vulnerabilities = [];
          console.warn(err);
          $scope.cveGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(
            err
          );
          $scope.cveGridOptions.api.setRowData([]);
        });
    };

    $scope.refreshReport = () => {
      let selectedRows = $scope.gridOptions.api.getSelectedRows();
      $scope.selectedPlatform = selectedRows[0];
      if ($scope.selectedPlatform && $scope.selectedPlatform.platform) {
        $scope.getScanReport($scope.selectedPlatform.platform);
      }
      $scope.onCVE = false;
    };

    $scope.toggleShowingAcceptedVuls = (isShowingAccepted) => {
      $scope.isShowingAccepted = !isShowingAccepted;
      $scope.getScanReport($scope.selectedPlatform.platform, $scope.isShowingAccepted);
    };

    $scope.exportCvs = () => {
      let cveList = $scope.cveGridOptions.api.getModel().rootNode
        .childrenAfterFilter.map(node => node.data);
      if (cveList.length > 0) {
        let vulnerabilities4Csv = JSON.parse(
          JSON.stringify(cveList)
        );
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
          `vulnerabilities-${$rootScope.summary.platform}_${Utils.parseDatetimeStr(new Date())}.csv`;
        FileSaver.saveAs(blob, filename);
      }
    };

    $scope.onFilterChanged = (value) => {
      filter = value;
      $scope.gridOptions.api.setQuickFilter(value);
    };

    $scope.onCveFilterChanged = (value) =>
      $scope.cveGridOptions.api.setQuickFilter(value);

    const activate = () => {
      PlatformFactory.prepareGrids();
      ScanFactory.setGrids();
      $scope.cveGridOptions = ScanFactory.cveGridOptions;
      $scope.cveGridOptions.onSelectionChanged = onCVESelectionChanged;
      $scope.domainGridOptions = PlatformFactory.getDomainGridOptions();
      $scope.gridOptions = PlatformFactory.getGridOptions();
      $scope.gridOptions.onSelectionChanged = onPlatformChanged;
      getScanConfig();
      $scope.refresh();
    };

    $scope.scan = () => {
      if (!$scope.selectedPlatform) return;
      ScanFactory.startScan(SCAN_PLATFORM_URL, $scope.selectedPlatform.platform)
        .then(function () {
          onScanInterval = $interval(function () {
            if (
              $scope.selectedPlatform.status === "finished" ||
              $scope.selectedPlatform.status === "failed"
            )
              $scope.$broadcast("stop-manual-loading");

            $scope.refresh(true);
          }, 5000);
        })
        .catch(function (err) {
          console.error(err);
        });
    };

    $scope.acceptVulnerability = function(event, data) {
      let payload = {
        config: {
          entries: [
            {
              name: data.name,
              days: 0,
              comment: `Vulnerability was accepted on ${$scope.selectedPlatform.name} at ${$filter("date")(new Date(), "MMM dd, y HH:mm:ss")} from Platforms page.`,
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

    $scope.$on("stop-manual-loading", function () {
      stopInterval();
    });

    $scope.$on("$destroy", function () {
      stopInterval();
    });

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });
    baseCtl.doOnClusterRedirected($state.reload);

    activate();
  }
})();
