(function() {
  "use strict";

  angular.module("app.assets").controller("BenchController", BenchController);

  BenchController.$inject = [
    "$rootScope",
    "$scope",
    "$translate",
    "$http",
    "$window",
    "$timeout",
    "Utils",
    "FileSaver",
    "Blob",
    "$interval",
    "Alertify",
    "$controller",
    "$state"
  ];
  function BenchController(
    $rootScope,
    $scope,
    $translate,
    $http,
    $window,
    $timeout,
    Utils,
    FileSaver,
    Blob,
    $interval,
    Alertify,
    $controller,
    $state
  ) {
    let nodeFilter = "";
    let dockerBMFilter = "";
    let k8sBMFilter = "";
    activate();
    let vm = this;
    const resource = {
      scanBenchmark: {
        global: 2
      }
    };

    $scope.isScanBenchmarkAuthorized = Utils.isAuthorized(
      $scope.user.roles,
      resource.scanBenchmark
    );

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window);
      let timerD, timerK;

      let columnDefs = [
        {
          headerName: $translate.instant("nodes.detail.NAME"),
          field: "name",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
          }
        },
        {
          headerName: $translate.instant("nodes.detail.OS"),
          field: "os",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
          }
        },
        {
          headerName: $translate.instant("nodes.detail.PLATFORM"),
          field: "platform",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
          }
        },
        {
          headerName: $translate.instant("cis.DOCKER_STATUS"),
          field: "docker_bench_status",
          cellRenderer: function(params) {
            const labelCode = colourMap[params.value];
            if (!params.value) return null;
            if (!labelCode)
              return `<span class="label label-fs label-info">${params.value}</span>`;
            else
              return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
                params.value
              )}</span>`;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
          }
        },
        {
          headerName: $translate.instant("cis.KUBERNETES_STATUS"),
          field: "kube_bench_status",
          cellRenderer: function(params) {
            const labelCode = colourMap[params.value];
            if (!params.value) return null;
            if (!labelCode)
              return `<span class="label label-fs label-info">${params.value}</span>`;
            else
              return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
                params.value
              )}</span>`;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
          },
          hide: $rootScope.isOpenShift
        },
        {
          headerName: $translate.instant("nodes.containers.TAB_TITLE"),
          field: "containers",
          icons: {
            sortAscending: '<em class="fa fa-sort-amount-asc"/>',
            sortDescending: '<em class="fa fa-sort-amount-desc"/>'
          }
        }
      ];

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
        nodeFilter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasNode = true;
          node.setSelected(true);
        } else {
          $scope.hasNode = false;
        }
      };

      $scope.onKubernetes = true;
      $scope.onContainer = true;

      function getGridHeight() {
        return Math.max(180, $window.innerHeight - $scope.hostGridHeight - 390);
      }

      $scope.refresh = function() {
        $scope.nodesErr = false;
        $http
          .get(NODES_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            if (
              response.data.hosts.length === 0 &&
              $scope.contGridOptions &&
              $scope.contGridOptions.api
            ) {
              $scope.contGridOptions.api.setRowData([]);
            }
            let hostNum = response.data.hosts.length;
            if (hostNum > 0) $scope.hasNode = true;
            if (hostNum < 2) $scope.hostGridHeight = 37 + 30 * 2;
            else if (hostNum < 8) $scope.hostGridHeight = 37 + 30 * hostNum;
            else $scope.hostGridHeight = 37 + 30 * 8;
            $scope.gridHeight = getGridHeight();
            if ($scope.gridOptions && $scope.gridOptions.api) {
              $scope.gridOptions.api.setRowData(response.data.hosts);
            }
            let currHostId = "";
            if ($scope.host) {
              currHostId = $scope.host.id;
            }
            setTimeout(function() {
              if ($scope.gridOptions && $scope.gridOptions.api) {
                $scope.gridOptions.api.sizeColumnsToFit();
                $scope.gridOptions.api.forEachNode(function(node, index) {
                  if ($scope.host) {
                    if (node.data.id === currHostId) {
                      node.setSelected(true);
                      $scope.gridOptions.api.ensureNodeVisible(node);
                      currHostId = $scope.host.id;
                    }
                  } else if (index === 0) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node);
                  }
                });
              }
            }, 100);
            $scope.onFilterChanged(nodeFilter);
            if (vm.selectedIndex === 0) {
              $scope.onDockerBenchFilterChanged(dockerBMFilter);
            } else {
              $scope.onK8sBenchFilterChanged(k8sBMFilter);
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.hostGridHeight = 37 + 30 * 8;
            $scope.nodesErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            if ($scope.gridOptions && $scope.gridOptions.api) {
              $scope.gridOptions.api.setRowData();
            }
          });
      };

      function getNodesInfo() {
        $scope.nodesErr = false;
        $http
          .get(NODES_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            if (
              response.data.hosts.length === 0 &&
              $scope.contGridOptions &&
              $scope.contGridOptions.api
            ) {
              $scope.contGridOptions.api.setRowData([]);
            }
            if ($scope.gridOptions && $scope.gridOptions.api) {
              $scope.gridOptions.api.setRowData(response.data.hosts);
            }
            setTimeout(function() {
              $scope.gridOptions.api.forEachNode(function(node, index) {
                if ($scope.host) {
                  if (node.data.id === $scope.host.id) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node);
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node);
                }
              });
            }, 100);
          })
          .catch(function(err) {
            console.warn(err);
          });
      }

      $scope.refresh();
      $scope.onTabSelectionChanged = function() {
        onSelectionChanged(true);
      };
      function onSelectionChanged(isOnFilter) {
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.gridOptions.api.sizeColumnsToFit();
        $scope.host = selectedRows[0];
        if (!$scope.host) return;
        $scope.onKubernetes = $scope.host.cap_kube_bench;
        $scope.onContainer = $scope.host.cap_docker_bench;
        $scope.$broadcast("k8s-auto-stopping");
        $scope.$broadcast("docker-auto-stopping");
        if (vm.selectedIndex === 1 && $scope.onKubernetes) {
          if ($scope.host.kube_bench_status !== "finished") {
            $scope.getK8sBenchmark($scope.host.id);
            $scope.reloadK8sBench($scope.host.id);
          } else {
            $scope.getK8sBenchmark($scope.host.id);
          }
        } else {
          if ($scope.host.docker_bench_status !== "finished") {
            $scope.getDockerBenchmark($scope.host.id);
            $scope.reloadDockerBench($scope.host.id);
          } else {
            $scope.getDockerBenchmark($scope.host.id);
          }
        }
        if (!isOnFilter) {
          $scope.$apply();
        }
      }

      let contColumnDefs = [
        {
          headerName: $translate.instant("nodes.gridHeader.TEST_NUM"),
          field: "test_number",
          width: 80,
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: {
            suppressCount: true,
            padding: 20,
            innerRenderer: innerCellRenderer
          }
        },
        {
          headerName: $translate.instant("nodes.gridHeader.LEVEL"),
          field: "level",
          cellRenderer: function(params) {
            if (params.value) {
              let className = colourMap[params.value];
              if (className)
                return `<span class="label label-fs label-${className}">${params.value}</span>`;
              else return null;
            } else return null;
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("nodes.gridHeader.MESSAGE"),
          field: "message"
        }
      ];

      function innerCellRenderer(params) {
        /** @namespace params.data.test_number */
        return $sanitize(params.data.test_number);
      }

      const overLay = $translate.instant("general.NO_ROWS");

      $scope.contGridOptions = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: false,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: contColumnDefs,
        rowData: null,
        getNodeChildDetails: getNodeChildDetails,
        animateRows: true,
        rowSelection: "single",
        overlayNoRowsTemplate: `<span class="overlay">${overLay}</span>`,
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 200);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 100);
          });
        }
      };

      let k8sColumnDefs = [
        {
          headerName: $translate.instant("nodes.gridHeader.TEST_NUM"),
          field: "test_number",
          width: 50,
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: {
            suppressCount: true,
            padding: 20,
            innerRenderer: innerCellRenderer
          }
        },
        {
          headerName: $translate.instant("nodes.gridHeader.LEVEL"),
          field: "level",
          cellRenderer: function(params) {
            if (params.value) {
              let className = colourMap[params.value];
              if (className)
                return `<span class="label label-fs label-${className}">${params.value}</span>`;
              else return null;
            } else return null;
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("nodes.gridHeader.MESSAGE"),
          field: "message"
        },
        {
          headerName: $translate.instant("cis.REMEDIATION"),
          field: "remediation",
          cellStyle: { "white-space": "normal" }
        }
      ];

      $scope.k8sGridOptions = {
        headerHeight: 30,
        getRowHeight: function(params) {
          /** @namespace params.data.remediation */
          return 30 * (Math.floor(params.data.remediation.length / 85) + 1);
        },
        enableSorting: false,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: k8sColumnDefs,
        rowData: null,
        getNodeChildDetails: getNodeChildDetails,
        animateRows: true,
        rowSelection: "single",
        overlayNoRowsTemplate: `<span class="overlay">${overLay}</span>`,
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 200);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 100);
          });
        }
      };

      $scope.onDockerBenchFilterChanged = function(value) {
        dockerBMFilter = value;
        if(value.toLowerCase() === "level 1")
          $scope.contGridOptions.api.setQuickFilter("level1");
        else if(value.toLowerCase() === "level 2")
          $scope.contGridOptions.api.setQuickFilter("level2");
        else
          $scope.contGridOptions.api.setQuickFilter(value);
      };

      $scope.onK8sBenchFilterChanged = function(value) {
        k8sBMFilter = value;
        if(value.toLowerCase() === "level 1")
          $scope.k8sGridOptions.api.setQuickFilter("level1");
        else if(value.toLowerCase() === "level 2")
          $scope.k8sGridOptions.api.setQuickFilter("level2");
        else
          $scope.k8sGridOptions.api.setQuickFilter(value);
      };

      function getNodeChildDetails(rowItem) {
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

      function getBenchItems(response, prefixLength) {
        if (response.data.items) {
          let roots = response.data.items.filter(function(item) {
            return item.test_number && item.test_number.length === prefixLength;
          });

          let i = 0;
          return roots.map(function(x) {
            let children = [];
            x.children = children;
            let lastChild = {};
            lastChild.children = [];

            for (i; i < response.data.items.length; i++) {
              if (
                response.data.items[i].test_number &&
                response.data.items[i].test_number !== x.test_number &&
                response.data.items[i].test_number.startsWith(x.test_number)
              ) {
                lastChild = response.data.items[i];
                lastChild.children = [];
                children.push(lastChild);
              }
              if (response.data.items[i].test_number === "") {
                lastChild.children.push(response.data.items[i]);
              }
              if (
                response.data.items[i].test_number &&
                response.data.items[i].test_number !== x.test_number &&
                response.data.items[i].test_number.length === prefixLength
              ) {
                break;
              }
            }
            return x;
          });
        }
      }

      $scope.getDockerBenchmark = function(id) {
        if (!id || !$scope.host.cap_docker_bench) return;
        $http
          .get(BENCH_URL, { params: { id: id } })
          .then(function(response) {
            $scope.contGridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            $scope.benches = angular.copy(response.data.items);
            let nodes = getBenchItems(response, 1);

            if ($scope.contGridOptions && $scope.contGridOptions.api) {
              $scope.contGridOptions.api.setRowData(nodes);
              $scope.contGridOptions.api.sizeColumnsToFit();
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.contGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            if ($scope.contGridOptions && $scope.contGridOptions.api) {
              $scope.contGridOptions.api.setRowData();
            }
          });
      };

      $scope.getK8sBenchmark = function(id) {
        if (!id || !$scope.host.cap_kube_bench) return;
        $http
          .get(K8S_BENCH_URL, { params: { id: id } })
          .then(function(response) {
            $scope.k8sGridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            $scope.k8sBenches = angular.copy(response.data.items);
            let nodes = getBenchItems(response, 3);
            if ($scope.k8sGridOptions && $scope.k8sGridOptions.api) {
              $scope.k8sGridOptions.api.setRowData(nodes);
              $scope.k8sGridOptions.api.sizeColumnsToFit();
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.errMsgOnK8s = Utils.getErrorMessage(err);
            $scope.k8sGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            if ($scope.k8sGridOptions && $scope.k8sGridOptions.api) {
              $scope.k8sGridOptions.api.setRowData();
            }
          });
      };

      $scope.exportDockerBenchmarkCsv = function() {
        if ($scope.benches && $scope.benches.length > 0) {
          let benches4Csv = JSON.parse(JSON.stringify($scope.benches));
          benches4Csv = benches4Csv.map(function(bench) {
            bench.message = `"${bench.message.replace(/\"/g, "'")}"`;
            return bench;
          });
          let csv = Utils.arrayToCsv(benches4Csv);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          let filename = "docker-benchmark-" + $scope.host.name + ".csv";
          FileSaver.saveAs(blob, filename);
        }
      };

      $scope.exportK8sBenchmarkCsv = function() {
        if ($scope.k8sBenches && $scope.k8sBenches.length > 0) {
          const benchList = angular
            .copy($scope.k8sBenches)
            .forEach(bench => renameKey(bench, "test_number", "name"));
          let k8sBenches4Csv = JSON.parse(JSON.stringify(benchList));
          k8sBenches4Csv = k8sBenches4Csv.map(function(k8sBench) {
            k8sBench.message = `"${k8sBench.message.replace(/\"/g, "'")}"`;
            k8sBench.remediation = `"${k8sBench.remediation.replace(
              /\"/g,
              "'"
            )}"`;
            return k8sBench;
          });
          let csv = Utils.arrayToCsv(k8sBenches4Csv);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          let filename = "kubernetes-benchmark-" + $scope.host.name + ".csv";
          FileSaver.saveAs(blob, filename);
        }
      };

      $scope.reloadDockerBench = function(id) {
        timerD = $interval(function() {
          getNodesInfo();
          if (
            ($scope.benches && $scope.benches.length > 0) ||
            $scope.errMsgOnDocker
          )
            $scope.$broadcast("docker-auto-stopping");
        }, 5000);
      };

      $scope.scanDocker = function(id) {
        $scope.errMsgOnDocker = null;
        $http
          .post(BENCH_URL, id)
          .then(function() {
            getNodesInfo();
            $scope.getDockerBenchmark(id);
            $scope.reloadDockerBench(id);
          })
          .catch(function(err) {
            if (angular.isDefined(timerD)) {
              $interval.cancel(timerD);
              timerD = undefined;
            }
            console.warn(err);
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("scan.FAILED_SCAN"), false)
              );
            }
          });
      };

      $scope.$on("docker-auto-stopping", function() {
        if (angular.isDefined(timerD)) {
          $interval.cancel(timerD);
          timerD = undefined;
        }
      });

      $scope.$on("k8s-auto-stopping", function() {
        if (angular.isDefined(timerK)) {
          $interval.cancel(timerK);
          timerK = undefined;
        }
      });

      $scope.reloadK8sBench = function(id) {
        timerK = $interval(function() {
          getNodesInfo();
          if (
            ($scope.k8sBenches && $scope.k8sBenches.length > 0) ||
            $scope.errMsgOnK8s
          )
            $scope.$broadcast("k8s-auto-stopping");
        }, 5000);
      };

      $scope.scanK8s = function(id) {
        $scope.errMsgOnK8s = null;
        $http
          .post(K8S_BENCH_URL, id)
          .then(function() {
            getNodesInfo();
            $scope.getK8sBenchmark(id);
            $scope.reloadK8sBench(id);
          })
          .catch(function(err) {
            if (angular.isDefined(timerK)) {
              $interval.cancel(timerK);
              timerK = undefined;
            }
            console.warn(err);
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("scan.FAILED_SCAN"), false)
              );
            }
          });
      };

      angular.element($window).bind("resize", function() {
        $scope.gridHeight = getGridHeight();
        $scope.$digest();
      });

      $scope.$on("$destroy", function() {
        if (angular.isDefined(timerD)) {
          $interval.cancel(timerD);
          timerD = undefined;
        }
        if (angular.isDefined(timerK)) {
          $interval.cancel(timerK);
          timerK = undefined;
        }
      });
    }
  }
})();
