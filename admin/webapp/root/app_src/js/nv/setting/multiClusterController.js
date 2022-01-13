(function() {
  "use strict";
  angular
    .module("app.login")
    .controller("MultiClusterController", MultiClusterController);

  MultiClusterController.$inject = [
    "$rootScope",
    "$scope",
    "$state",
    "$location",
    "$timeout",
    "$translate",
    "$http",
    "$localStorage",
    "$mdDialog",
    "$filter",
    "Alertify",
    "$window",
    "Utils",
    "filterFilter",
    "multiClusterService",
    "$controller",
    "$sanitize"
  ];

  function MultiClusterController(
    $rootScope,
    $scope,
    $state,
    $location,
    $timeout,
    $translate,
    $http,
    $localStorage,
    $mdDialog,
    $filter,
    Alertify,
    $window,
    Utils,
    filterFilter,
    multiClusterService,
    $controller,
    $sanitize
  ) {
    $scope.graphHeight = $window.innerHeight - 280;
    angular.element($window).bind("resize", function() {
      $scope.graphHeight = $window.innerHeight - 280;
      $scope.$digest();
    });
    $rootScope.toastWarnings();

    let MAX_WEB_WORKER_CNT = 10;
    let usingWorkerCnt = 0;
    let worker = new Array(MAX_WEB_WORKER_CNT);
    worker.fill(null);
    let timer = null;
    $scope.demoteWaiting = false;
    $scope.leaveWaiting = false;

    $scope.isOperateAuthorized = $scope.user.roles.global === '2' || $scope.user.roles.global === '4';

    let redirectBackToDashboard = function(){
      $state.go("app.dashboard");
    };

    $scope.$on("clusterRedirected", function() {
      let baseCtl = $controller('BaseMultiClusterController', {$scope: $scope});
      baseCtl.doOnClusterRedirectedWithoutReload(redirectBackToDashboard);
    });

    let taskCursor = -1;

    const getNext = function() {
      console.log("Finished cluster index: ", taskCursor);
      return ++taskCursor;
    };

    // -----------------------------------------------------------------------------
    // ---------------------- Util functions ---------------------------------------
    // -----------------------------------------------------------------------------

    $scope.logout = function() {
      $http
        .delete("/auth")
        .then(function() {
          $window.localStorage.clear();
          $window.sessionStorage.clear();
          $window.sessionStorage.setItem(
            "from",
            JSON.stringify($location.url())
          );
          $rootScope.user = null;
          $rootScope.sidebarDone = false;
          $rootScope.versionDone = false;
          $rootScope.isFooterReady = false;
          $state.go("page.login");
        })
        .catch(function() {
          $state.go("page.login");
        });
    };

    function popupMsg(msg, err = null, name = "") {
      if (err) {
        if (USER_TIMEOUT.indexOf(err.status) < 0) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(err, $translate.instant(msg, { name: name ? $filter("shortenName")(name, 20) : "" }), false)
          );
        }
      } else {
        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
        Alertify.success($translate.instant(msg, { name: name ? $filter("shortenName")(name, 20) : "" }));
      }
    }

    // -----------------------------------------------------------------------------
    // ---------------------- Grid Settings ----------------------------------------
    // -----------------------------------------------------------------------------

    const setGrid = function(isMaster, isMember) {
      $scope.detailViewHeight = $window.innerHeight - 184 - 65 - 38 - 212;

      let columnDefs = [
        {
          headerName: $translate.instant("multiCluster.grid.name"),
          field: "name",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          width: 110
        },
        {
          headerName: $translate.instant("multiCluster.grid.type"),
          field: "clusterType",
          cellRenderer: function(params) {
            let displayName = "";
            if (params.value) {
              if (params.value == FED_ROLES.MASTER) {
                displayName = $translate.instant("multiCluster.master");
              } else {
                displayName = $translate.instant("multiCluster.joint");
              }
              return $sanitize(displayName);
            }
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          width: 70,
          minWidth: 60
        },
        {
          headerName: $translate.instant("multiCluster.grid.server"),
          field: "api_server",
          width: 100
        },
        {
          headerName: $translate.instant("multiCluster.grid.port"),
          field: "api_port",
          width: 80
        }
      ];

      const majorSummaryColumn = [
        {
          headerName: $translate.instant("dashboard.summary.HOST"),
          field: "hosts",
          cellRenderer: (params) => {
            if (params && params.value) {
              if (params.value === $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE")) {
                return `<span class="label label-idle">${params.value}</span>`;
              } else {
                return params.value;
              }
            }
          },
          width: 60
        },
        {
          headerName: $translate.instant("multiCluster.summary.RUNNING_POD"),
          field: "running_pods",
          cellRenderer: (params) => {
            if (params && params.value) {
              if (params.value === $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE")) {
                return `<span class="label label-idle">${params.value}</span>`;
              } else {
                return params.value;
              }
            }
          },
          width: 100
        },
        {
          headerName: $translate.instant("audit.gridHeader.CVE_DB_VERSION"),
          field: "cvedb_version",
          cellRenderer: (params) => {
            if (params && params.value) {
              if (params.value === $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE")) {
                return `<span class="label label-idle">${params.value}</span>`;
              } else {
                return params.value;
              }
            }
          },
          width: 100
        },
        {
          headerName: $translate.instant("multiCluster.grid.score"),
          field: "score",
          cellRenderer: (params) => {
            if (params && params.value) {
              let score = params.value.valueOf();
              if (isNaN(score)) {
                return `<span class="label label-idle">${params.value}</span>`;
              } else {
                let scoreColor = "success";
                let scoreText = $translate.instant("dashboard.heading.guideline.MAIN_SCORE_GOOD2");
                console.log("score: ", score);
                if (score > 20 && score <= 50) {
                  scoreColor = "warning";
                  scoreText = $translate.instant("dashboard.heading.guideline.MAIN_SCORE_FAIR");
                }
                if (score > 50) {
                  scoreColor = "danger";
                  scoreText = $translate.instant("dashboard.heading.guideline.MAIN_SCORE_POOR");
                }
                return `<span class="text-${scoreColor} text-bold">${score}<span style="display: inline-block; width: 45px;" class="ml-sm label label-${scoreColor}">${scoreText}</span></span>`;
              }
            } else {
              return "<span><em class='fa fa-spin fa-spinner text-primary' aria-hidden='true'></em></span>";
            }
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          width: 80,
          minWidth: 80,
          maxWidth: 80
        },
        {
          headerName: $translate.instant("multiCluster.grid.status"),
          field: "status",
          cellRenderer: function(params) {
            let status = params.value || "active";
            let labelCode = colourMap["mc_" + status];
            return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
              "cluster.status." + $sanitize(status)
            )}</span`;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          width: 90,
          minWidth: 90,
          maxWidth: 90
        }
      ];

      const statusColumn = [
        {
          headerName: $translate.instant("multiCluster.grid.status"),
          field: "status",
          cellRenderer: function(params) {
            let status = params.value || "active";
            let labelCode = colourMap["mc_" + status];
            return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
              "cluster.status." + $sanitize(status)
            )}</span`;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          width: 70,
          minWidth: 60
        }
      ]

      if (isMaster) {
        columnDefs = columnDefs.concat(majorSummaryColumn);
      }
      if (isMember) {
        columnDefs = columnDefs.concat(statusColumn);
      }

      function actionsRenderFunc(params) {
        let renderHTML = "";

        if (isMaster) {
          if (params.data && params.data.clusterType === FED_ROLES.MASTER) {
            if ($scope.clusters.length > 1) {
              renderHTML =
                "     <div ng-show='!demoteWaiting'>" +
                '       <em class="fa fa-gavel fa-lg mr-sm text-action"' +
                '         ng-click="manageFedPolicy()" uib-tooltip="{{\'multiCluster.tips.policy\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-recycle fa-lg mr-sm text-action" ' +
                '         ng-click="demote(data)" uib-tooltip="{{\'multiCluster.tips.demote\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-key fa-lg text-action" ' +
                '         ng-click="showGetTokenDialog()" uib-tooltip="{{\'multiCluster.tips.token\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-edit fa-lg text-action" ' +
                '         ng-click="showEditClusterDialog($event, data, false)" uib-tooltip="{{\'multiCluster.tips.edit\' | translate}}">' +
                "       </em>" +
                "     </div>" +
                "     <div ng-show='demoteWaiting'>" +
                '       <em class="fa fa-gavel fa-lg mr-sm text-action"' +
                '         ng-click="manageFedPolicy()" uib-tooltip="{{\'multiCluster.tips.policy\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-spinner fa-spin fa-lg mr-sm text-action" ' +
                "         uib-tooltip=\"{{'multiCluster.tips.demote' | translate}}\">" +
                "       </em>" +
                '       <em class="fa fa-key fa-lg text-action" ' +
                '         ng-click="showGetTokenDialog()" uib-tooltip="{{\'multiCluster.tips.token\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-edit fa-lg text-action" ' +
                '         ng-click="showEditClusterDialog($event, data, false)" uib-tooltip="{{\'multiCluster.tips.edit\' | translate}}">' +
                "       </em>" +
                "     </div>";
            } else {
              renderHTML =
                "     <div ng-show='!demoteWaiting' >" +
                '       <em class="fa fa-gavel fa-lg mr-sm text-action"' +
                '         ng-click="manageFedPolicy()" uib-tooltip="{{\'multiCluster.tips.policy\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-recycle fa-lg mr-sm text-action" ' +
                '         ng-click="demote(data)" uib-tooltip="{{\'multiCluster.tips.demote\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-key fa-lg mr-sm text-action" ' +
                '         ng-click="showGetTokenDialog()" uib-tooltip="{{\'multiCluster.tips.token\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-edit fa-lg text-action" ' +
                '         ng-click="showEditClusterDialog($event, data, true)" uib-tooltip="{{\'multiCluster.tips.edit\' | translate}}">' +
                "       </em>" +
                "     </div>" +
                "     <div ng-show='demoteWaiting'>" +
                '       <em class="fa fa-gavel fa-lg mr-sm text-action"' +
                '         ng-click="manageFedPolicy()" uib-tooltip="{{\'multiCluster.tips.policy\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-spinner fa-spin fa-lg mr-sm text-action" ' +
                "         uib-tooltip=\"{{'multiCluster.tips.demote' | translate}}\">" +
                "       </em>" +
                '       <em class="fa fa-key fa-lg mr-sm text-action" ' +
                '         ng-click="showGetTokenDialog()" uib-tooltip="{{\'multiCluster.tips.token\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-edit fa-lg text-action" ' +
                '         ng-click="showEditClusterDialog($event, data, true)" uib-tooltip="{{\'multiCluster.tips.edit\' | translate}}">' +
                "       </em>" +
                "     </div>";
            }
          } else {
            if (
              params.data &&
              (params.data.status === FED_STATUS.DISCONNECTED ||
                params.data.status === FED_STATUS.UPGADE_REQUIRED ||
                params.data.status === FED_STATUS.LEFT ||
                params.data.status === FED_STATUS.IMPROPERLICENSE)
            ) {
              renderHTML =
                "     <div>" +
                '       <em class="fa fa-refresh fa-lg mr-sm text-disabled-label" ' +
                "          uib-tooltip=\"{{'multiCluster.tips.notAvailable' | translate}}\">" +
                "       </em>" +
                '       <em class="fa fa-user-times fa-lg mr-sm text-action" ' +
                '         ng-click="remove(data)" uib-tooltip="{{\'multiCluster.tips.remove\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-laptop fa-lg text-disabled-label" ' +
                "          uib-tooltip=\"{{'multiCluster.tips.notAvailable' | translate}}\">" +
                "       </em>" +
                "     </div>";
            } else {
              renderHTML =
                "     <div>" +
                '       <em class="fa fa-refresh fa-lg mr-sm text-action" ' +
                '         ng-click="syncPolicy($event,data); $event.stopPropagation();" uib-tooltip="{{\'multiCluster.tips.syncPolicy\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-user-times fa-lg mr-sm text-action" ' +
                '         ng-click="remove(data); $event.stopPropagation();" uib-tooltip="{{\'multiCluster.tips.remove\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-laptop fa-lg text-action" ' +
                '         ng-click="redirectCluster(data); $event.stopPropagation();" uib-tooltip="{{\'multiCluster.tips.manage\' | translate}}">' +
                "       </em>" +
                "     </div>";
            }
          }
        }

        if (isMember) {
          if (params.data && params.data.clusterType === FED_ROLES.MEMBER)
            renderHTML =
              `<div>
                <em class="fa fa-edit fa-lg mr-sm text-action"
                  ng-click="showEditClusterDialog($event, data, false)" uib-tooltip="{{'multiCluster.tips.edit' | translate}}">
                </em>
                <em ng-if="!leaveWaiting" class="fa fa-user-times fa-lg mr-sm text-action"
                  ng-click="leave()" uib-tooltip="{{'multiCluster.tips.leave' | translate}}">
                </em>
                <em  ng-if="leaveWaiting" class="fa fa-spinner fa-spin fa-lg text-action"
                  ng-click="leave()" uib-tooltip="{{'multiCluster.tips.leave' | translate}}">
                </em>
              </div>`;
        }

        return renderHTML;
      }

      let actionColumn = {
        headerName: $translate.instant("multiCluster.grid.action"),
        cellRenderer: actionsRenderFunc,
        cellClass: "grid-space-evenly",
        suppressSorting: true,
        width: 120,
        maxWidth: 120,
        minWidth: 120
      };

      if ($scope.isOperateAuthorized) {
        columnDefs.push(actionColumn);
      }

      $scope.gridOptions = Utils.createGridOptions(columnDefs);
    };

    const onSelectionChanged = function() {
      let selectedRows = $scope.gridOptions.api.getSelectedRows();
      let selectedNode = $scope.gridOptions.api.getSelectedNodes()[0];
      $scope.selectedCluster = selectedRows[0];
      $scope.getSummary($scope.selectedCluster, selectedNode);
    }

    // -----------------------------------------------------------------------------
    // ---------------------- Actions functions ------------------------------------
    // -----------------------------------------------------------------------------

    const run = function (fn) {
      try {
        return new Worker(URL.createObjectURL(new Blob(["(" + fn + ")()"])));
      } catch (err) {
        console.log(err);
        return null;
      }
    };

    const updateMajorSummaryCells = function(index, rowNode, summary) {
      $scope.clusters[index].hosts = summary.hosts;
      $scope.clusters[index].running_pods = summary.running_pods;
      $scope.clusters[index].cvedb_version = summary.cvedb_version;
      rowNode.data.hosts = summary.hosts;
      rowNode.data.running_pods = summary.running_pods;
      rowNode.data.cvedb_version = summary.cvedb_version;
    };

    const updateClustersGridRow4Success = function(index, rowNode, rowData) {
      let summarySuccess = rowData.summaryJson && rowData.summaryJson !== "error";
      let scoreSuccess = !rowData.score.hasError;
      if (summarySuccess) {
        let summary = JSON.parse(rowData.summaryJson).summary;
        updateMajorSummaryCells(index, rowNode, summary);
      } else {
        if (isNaN($scope.clusters[index].hosts) || isNaN($scope.clusters[index].running_pods)) {
          $scope.clusters[index].hosts = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
          $scope.clusters[index].running_pods = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
          $scope.clusters[index].cvedb_version = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
          rowNode.data.hosts = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
          rowNode.data.running_pods = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
          rowNode.data.cvedb_version = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
        }
      }
      if (scoreSuccess) {
        $scope.clusters[index].score = rowData.score.securityRiskScore.toString();
        rowNode.data.score = rowData.score.securityRiskScore.toString();
      } else {
        $scope.clusters[index].score = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
        rowNode.data.score = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
      }
      $scope.gridOptions.api.redrawRows({ rowNodes: [rowNode] });
    };

    const updateClustersGridRow4Error = function(index, rowNode) {
      if (isNaN($scope.clusters[index].hosts) || isNaN($scope.clusters[index].running_pods)) {
        $scope.clusters[index].hosts = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
        $scope.clusters[index].running_pods = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
        $scope.clusters[index].cvedb_version = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
        rowNode.data.hosts = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
        rowNode.data.running_pods = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
        rowNode.data.cvedb_version = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
      }
      $scope.clusters[index].score = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
      rowNode.data.score = $translate.instant("multiCluster.messages.SCORE_UNAVAILIBlE");
      $scope.gridOptions.api.redrawRows({ rowNodes: [rowNode] });
    }

    const getClusterScore = function(index) {
      let params = {};
      let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index);
      if ($scope.clusters[index].clusterType === FED_ROLES.MASTER) {
        params = {isGlobalUser: true};
      } else {
        params = {isGlobalUser: true, clusterId: $scope.clusters[index].id};
      }
      $http
        .get(MULTI_CLUSTER_SUMMARY, {params: params})
        .then((response) => {
          updateClustersGridRow4Success(index, rowNode, response.data);
        })
        .catch((err) => {
          console.warn(err);
          updateClustersGridRow4Error(index, rowNode);
        });
    };


    const testBrowserSupportWebWorker = function(clusters) {
      const workerTester = function() {};
      if (worker[0]) {
        worker[0].terminate();
      }
      worker[0] = run(workerTester());
      if (!worker[0]) {
        updateClustersScoreBySnyc(clusters);
        return false;
      } else {
        worker[0].terminate();
        return true;
      }
    };

    const getClusterScoreWebWorkerServer = function() {
      self.onmessage = (event) => {
        let baseUrl = event.srcElement.origin;
        let inputObj = JSON.parse(event.data);
        let apiUrl = `${baseUrl}/${inputObj.apiUrl}`;
        let isGlobalUser = inputObj.isGlobalUser;
        let isMaster = inputObj.isMaster;
        let clusterId = inputObj.clusterId;
        let query1 = isGlobalUser ? `?isGlobalUser=${isGlobalUser.toString()}` : "isGlobalUser=false";
        let query2 = isMaster ? "" : `&clusterId=${clusterId}`;
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
          if (this.readyState == 4) {
            if (this.status == 200) {
              self.postMessage(JSON.parse(xhttp.responseText));
            } else {
              self.postMessage({error: {status: this.status, data: this.responseText}});
            }
          }
        };
        console.log("URL: ", apiUrl + query1 + query2);
        xhttp.open("GET", apiUrl + query1 + query2, true);
        xhttp.setRequestHeader("token", inputObj.token);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.setRequestHeader("Cache-Control", "no-cache");
        xhttp.setRequestHeader("Pragma", "no-cache");
        xhttp.send();
      };
    };

    const getClusterScoreWebWorkerClient = function(worker, workerId, index) {
      console.log("worker: ", workerId, "index: ", index)
      if (index >= $scope.clusters.length) {
        worker.terminate();
        return;
      }
      if (worker) {
        let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index);
        worker.postMessage(
          JSON.stringify({
            apiUrl: MULTI_CLUSTER_SUMMARY,
            token: $scope.user.token.token,
            isGlobalUser: true,
            isMaster: $scope.clusters[index].clusterType === FED_ROLES.MASTER,
            clusterId: $scope.clusters[index].id
          })
        );

        worker.onmessage = (event) => {
          console.log(event.data);
          if (event.data.error) {
            updateClustersGridRow4Error(index, rowNode);
            worker.terminate();
            worker = run(getClusterScoreWebWorkerServer);
            getClusterScoreWebWorkerClient(worker, workerId, getNext());
            $scope.$apply();
          } else {
            console.log("event.data.score.hasError: ", event.data.score.hasError);
            updateClustersGridRow4Success(index, rowNode, event.data);
            worker.terminate();
            worker = run(getClusterScoreWebWorkerServer);
            getClusterScoreWebWorkerClient(worker, workerId, getNext());
            $scope.$apply();
          }
        };
      }
    };

    const updateClustersScoreByAsync = function(clusters) {
      if(!testBrowserSupportWebWorker(clusters)) {
        return;
      };
      console.log("Web workers start...");
      let clusterCnt = clusters.length;
      for (let i = 0; i < usingWorkerCnt; i++) {
        if (worker[i]) {
          worker[i].terminate();
        }
        worker[i] = run(getClusterScoreWebWorkerServer);
        getClusterScoreWebWorkerClient(worker[i], i, getNext());
      }
    };

    const updateClustersScoreBySnyc = function(clusters) {
      clusters.forEach((cluster, index) => {
        getClusterScore(index);
      });
    };

    const determineMaxWorkerCnt = function(clusterCnt) {
      usingWorkerCnt = clusterCnt < MAX_WEB_WORKER_CNT ? clusterCnt : MAX_WEB_WORKER_CNT;
    }

    function initialize(fedData) {
      $scope.isMaster = fedData.fed_role === FED_ROLES.MASTER;
      $scope.isMember = fedData.fed_role === FED_ROLES.MEMBER;
      $scope.isOrdinary = fedData.fed_role.length === 0;
      $scope.isFederal = !$scope.isOrdinary;
      $scope.clusters = fedData.clusters || [];
      $scope.local = fedData.local_rest_info;
      $scope.useProxy = fedData.use_proxy || "";
      if (!($scope.gridOptions && $scope.gridOptions.api)) {
        setGrid($scope.isMaster, $scope.isMember);
      }
      if ($scope.isFederal) {
        $timeout(function() {
          if ($scope.gridOptions && $scope.gridOptions.api) {
            $scope.gridOptions.api.setRowData($scope.clusters);
            //to initial the summary panel for Master Cluster only
            if ($scope.isMaster) {
              $scope.gridOptions.onSelectionChanged = onSelectionChanged;
              let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
              if (node) {
                $scope.selectedCluster = node;
                node.setSelected(true);
              }
              determineMaxWorkerCnt($scope.clusters.length);
              updateClustersScoreByAsync($scope.clusters);
            }
            $timeout(() => {
              $scope.gridOptions.api.sizeColumnsToFit();
            }, 200);
          }
        });
      }
    }

    $scope.pageInit = function() {
      taskCursor = -1;
      multiClusterService
        .getClusters()
        .then(function(payload) {
          if(payload.data.hasOwnProperty('fed_role')){
            initialize(payload.data);
          }else{
            $scope.clusterError = true;
          }
          if(payload.data.clusters){
            $rootScope.$broadcast("reloadClusters",payload.data.clusters);
          }
        })
        .catch(function(err) {
          if (USER_TIMEOUT.indexOf(err.status) >= 0 ) {
            $scope.clusterError = true;
          } else {
            popupMsg("multiCluster.messages.query_failure", err);
          }
        });
    };

    $scope.refreshGrid = function(seletedRow = null) {
      taskCursor = -1;
      multiClusterService
        .getClusters()
        .then(function(payload) {
          $scope.clusters = payload.data.clusters || [];
          $scope.isMaster = payload.data.fed_role === FED_ROLES.MASTER;
          $scope.isMember = payload.data.fed_role === FED_ROLES.MEMBER;
          $scope.useProxy = payload.data.use_proxy || "";
          $rootScope.$broadcast("reloadClusters",$scope.clusters);
          if ($scope.gridOptions && $scope.gridOptions.api) {
            $scope.gridOptions.api.setRowData($scope.clusters);
            determineMaxWorkerCnt($scope.clusters.length);
            updateClustersScoreByAsync($scope.clusters);
            if (seletedRow) {
              $scope.gridOptions.api.forEachNode(node => {
                if (node.data.id === seletedRow.id) {
                  node.setSelected(true);
                }
              });
            }
          }
        })
        .catch(function(err) {
          if (USER_TIMEOUT.indexOf(err.status) >= 0) {
            $scope.clusterError = true;
          } else {
            popupMsg("multiCluster.messages.query_failure", err);
          }
        });
    };

    $scope.getSummary = function(cluster, rowNode) {
      console.log(rowNode);
      let index = rowNode.rowIndex;
      if (
        cluster.status === FED_STATUS.DISCONNECTED ||
        cluster.status === FED_STATUS.LEFT ||
        cluster.status === FED_STATUS.IMPROPERLICENSE
      ) {
        $scope.summary = cluster;
        $scope.$apply();
      } else {
        if (cluster.clusterType === FED_ROLES.MEMBER) {
          multiClusterService
            .getRemoteSummary(cluster.id)
            .then(function(payload) {
              $scope.summary = payload.data.summary;
              if ($scope.isMaster) {
                updateMajorSummaryCells(index, rowNode, $scope.summary);
                $scope.gridOptions.api.redrawRows({ rowNodes: [rowNode] });
              }
            })
            .catch(function(err) {
              $scope.summary = cluster;
              popupMsg("multiCluster.messages.query_failure", err);
            });
        } else {
          multiClusterService
            .getLocalSummary()
            .then(function(payload) {
              $scope.summary = payload.data.summary;
              if ($scope.isMaster) {
                updateMajorSummaryCells(index, rowNode, $scope.summary);
                $scope.gridOptions.api.redrawRows({ rowNodes: [rowNode] });
              }
            })
            .catch(function(err) {
              $scope.summary = cluster;
              popupMsg("multiCluster.messages.query_failure", err);
            });
        }
      }
    };

    $scope.manageFedPolicy = function() {
      $state.go("app.fedPolicy");
    };

    $scope.syncPolicy = function(event, cluster) {
      angular.element(event.target).addClass("fa-spin clickDisabled");

      multiClusterService
        .syncPolicy(cluster.id)
        .then(function() {
          popupMsg("multiCluster.messages.deploy_ok", null, cluster.name);
        })
        .catch(function(err) {
          popupMsg("multiCluster.messages.deploy_failure", err);
        })
        .finally(function(){
          $timeout(function() {
            $state.reload();
          }, 2000);
        });
    };

    $scope.demote = function(data) {
      Alertify.confirm(
        $translate.instant("multiCluster.prompt.demote", { name: $sanitize($filter("shortenName")(data.name, 20))})
      ).then(function() {
        $scope.demoteWaiting = true;
        multiClusterService
          .demote()
          .then(function() {
            $scope.demoteWaiting = false;
            popupMsg("multiCluster.messages.demote_ok");
            $timeout(function() {
              $scope.logout();
            }, 1000);
          })
          .catch(function(err) {
            $scope.loading = false;
            popupMsg("multiCluster.messages.demote_failure", err);
          });
      });
    };

    $scope.remove = function(data) {
      Alertify.confirm(
        $translate.instant("multiCluster.prompt.remove", { name: $sanitize($filter("shortenName")(data.name, 20))})
      ).then(function() {
        multiClusterService
          .remove(data.id)
          .then(function() {
            $scope.reload();
            popupMsg("multiCluster.messages.remove_ok");
          })
          .catch(function(err) {
            popupMsg("multiCluster.messages.remove_failure", err);
          });
      });
    };

    $scope.redirectCluster = function(data) {
      if (timer) {
        $timeout.cancel(timer);
      }

      timer = $timeout(function() {
        console.log("cluster id:", data.id);
        multiClusterService
          .redirect(data.id, "")
          .then(function() {
            //update the platform info after redirecting
            $http.get(DASHBOARD_SUMMARY_URL).then(function(response) {
              $rootScope.isOpenShift =
                response.data.summary.platform === OPENSHIFT;
              $rootScope.summary = response.data.summary;
              $rootScope.hasInitializedSummary = true;
            });

            $rootScope.$broadcast("manageRemoteCluster", { cluster: data });
            $rootScope.$broadcast("clusterRedirected");
            const cluster = {
              isRemote: $rootScope.isRemote,
              id: data.id,
              name: data.name
            };
            $window.sessionStorage.setItem("cluster", JSON.stringify(cluster));
            popupMsg("multiCluster.messages.redirect_ok", null, data.name);
          })
          .catch(function(err) {
            if (err.status === "custom") {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                $translate.instant("multiCluster.messages.redirect_failure", {
                  name: $sanitize(data.name)
                }) + err.message
              );
            } else if (USER_TIMEOUT.indexOf(err.status) < 0) {
              popupMsg(
                "multiCluster.messages.redirect_failure",
                err,
                $sanitize(data.name)
              );
            }
          });
      });
    };

    $scope.leave = function() {
      Alertify.confirm($translate.instant("multiCluster.prompt.leave")).then(
        function() {
          $scope.leaveWaiting = true;
          multiClusterService
            .leave()
            .then(function() {
              $scope.leaveWaiting = false;
              popupMsg("multiCluster.messages.leave_ok");
              $timeout(function() {
                $state.reload();
              }, 1500);
            })
            .catch(function(err) {
              $scope.leaveWaiting = false;
              popupMsg("multiCluster.messages.leave_failure", err);
            });
        }
      );
    };

    // -----------------------------------------------------------------------------
    // ---------------------- Dialog Activations -----------------------------------
    // -----------------------------------------------------------------------------

    $scope.showPromotionDialog = function() {
      $mdDialog.show({
        controller: PromoteDialogController,
        controllerAs: "promoteCtl",
        templateUrl: "dialog.promote.html",
        locals: {
          useProxy: $scope.useProxy
        }
      });
    };

    $scope.showJoiningDialog = function(event) {
      $mdDialog
        .show({
          controller: JoinDialogController,
          controllerAs: "joinCtrl",
          templateUrl: "dialog.join.html",
          targetEvent: event,
          locals: {
            useProxy: $scope.useProxy
          }
        })
        .finally(function() {
          $timeout(function() {
            $state.reload();
          }, 1500);
        });
    };

    $scope.showGetTokenDialog = function(event) {
      $mdDialog.show({
        controller: GetTokenDialogController,
        templateUrl: "dialog.token.html",
        targetEvent: event
      });
    };

    $scope.showEditClusterDialog = function(event, data, isEditable) {
      multiClusterService.cluster4Edit = data;
      $mdDialog
        .show({
          controller: EditClusterDialogController,
          templateUrl: "dialog.edit.html",
          targetEvent: event,
          locals: {
            isEditable: isEditable,
            useProxy: $scope.useProxy
          }
        })
        .then(function() {
          $timeout(function() {
            $scope.refreshGrid(data);
          }, 1000);
        });
    };

    $scope.onFilterChanged = function(value) {
      $scope.gridOptions.api.setQuickFilter(value);
    };

    $scope.reload = function() {
      $scope.pageInit();
    };

    // -----------------------------------------------------------------------------
    // ---------------------- initialize and activate ------------------------------
    // -----------------------------------------------------------------------------

    $scope.clusterError = false;
    $scope.pageInit();

    $scope.$on("$destroy", function () {
      for (let i = 0; i < usingWorkerCnt; i++) {
        if (worker[i]) {
          worker[i].terminate();
        }
      }
    });

    // -----------------------------------------------------------------------------
    // ---------------------- dialog definitions -----------------------------------
    // -----------------------------------------------------------------------------

    // ---------------------- Promotion Dialog -------------------------------------

    PromoteDialogController.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "multiClusterService",
      "$window",
      "$location",
      "$state",
      "$rootScope",
      "$http",
      "useProxy"
    ];

    function PromoteDialogController(
      $scope,
      $mdDialog,
      $translate,
      multiClusterService,
      $window,
      $location,
      $state,
      $rootScope,
      $http,
      useProxy
    ) {
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.cluster = {
        name: "",
        server: "",
        port: FED_PORT.MASTER
      };

      $scope.useProxy = useProxy;

      $scope.getName = function() {
        $http
          .get(CONFIG_URL)
          .then(function(response) {
            $scope.cluster.name = response.data.config.cluster_name;
          })
          .catch(function(error) {
            popupMsg("setting.message.GET_SYS_LOG_ERR", error);
          });
      };

      $scope.promote = function(cluster) {
        $scope.promotionProcessing = true;

        multiClusterService
          .promote(cluster, $scope.useProxy)
          .then(function() {
            popupMsg("multiCluster.messages.promotion_ok");
            setTimeout(function() {
              $scope.logout();
            }, 1000);
            $mdDialog.cancel();
          })
          .catch(function(error) {
            popupMsg("multiCluster.messages.promotion_failure", error);
          })
          .finally(function() {
            $scope.promotionProcessing = false;
          });
      };

      $scope.logout = function() {
        $http
          .delete("/auth")
          .then(function() {
            $window.sessionStorage.removeItem("token");
            $window.sessionStorage.removeItem("cluster");
            $window.sessionStorage.setItem(
              "from",
              JSON.stringify($location.url())
            );
            $rootScope.user = null;
            $rootScope.sidebarDone = false;
            $rootScope.versionDone = false;
            $rootScope.isFooterReady = false;
            $state.go("page.login");
          })
          .catch(function() {
            $state.go("page.login");
          });
      };

      //activate & initiate
      $scope.getName();
    }

    // ---------------------- Joining Dialog -------------------------------------

    JoinDialogController.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "multiClusterService",
      "useProxy"
    ];

    function JoinDialogController(
      $scope,
      $mdDialog,
      $translate,
      multiClusterService,
      useProxy
    ) {
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.invalidToken = false;

      $scope.cluster = {
        name: "",
        server: "",
        port: FED_PORT.JOINT,
        token: "",
        master_server: "",
        master_port: ""
      };

      $scope.useProxy = useProxy;

      $scope.getName = function() {
        $http
          .get(CONFIG_URL)
          .then(function(response) {
            $scope.cluster.name = response.data.config.cluster_name;
          })
          .catch(function(error) {
            popupMsg("setting.message.GET_SYS_LOG_ERR");
          });
      };

      $scope.parseToken = function() {
        setTimeout(() => {
          try {
            if ($scope.cluster.token) {
              if ($scope.cluster.token.length % 4 != 0) {
                throw "invalid token format";
              }
              let decodedStr = JSON.parse(atob($scope.cluster.token));
              $scope.cluster.master_server = decodedStr["s"];
              $scope.cluster.master_port = decodedStr["p"];
            }
            $scope.invalidToken = false;
            $scope.joinForm.token.$setValidity("invalidFormat", true);
            $scope.$apply();
          } catch (e) {
            $scope.invalidToken = true;
            $scope.joinForm.token.$setValidity("invalidFormat", false);
            $scope.$apply();
          }
        }, 200);
      };

      $scope.join = function(cluster) {
        $scope.joiningProcessing = true;
        multiClusterService
          .join(cluster, $scope.useProxy)
          .then(function() {
            popupMsg("multiCluster.messages.joining_ok");
            $mdDialog.cancel();
          })
          .catch(function(err) {
            popupMsg("multiCluster.messages.joining_failure", err);
          })
          .finally(function() {
            $scope.joiningProcessing = false;
          });
      };

      //activate & initiate
      $scope.getName();
    }

    // ---------------------- Token Dialog ---------------------------------------

    GetTokenDialogController.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "multiClusterService"
    ];

    function GetTokenDialogController(
      $scope,
      $mdDialog,
      $translate,
      multiClusterService
    ) {
      $scope.copiedToken = false;

      $scope.hide = function() {
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.success = function() {
        $scope.copiedToken = true;
      };

      $scope.generateToken = (function() {
        multiClusterService
          .generateToken()
          .then(function(payload) {
            $scope.token = payload.data.join_token;
          })
          .catch(function(error) {
            popupMsg("multiCluster.messages.token_failure", error);
          });
      })();
    }

    // ---------------------- Edit Cluster Dialog --------------------------------

    EditClusterDialogController.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "multiClusterService",
      "isEditable",
      "useProxy"
    ];

    function EditClusterDialogController(
      $scope,
      $mdDialog,
      $translate,
      multiClusterService,
      isEditable,
      useProxy
    ) {
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.closeDialog = function() {
        $mdDialog.cancel();
      };

      $scope.isEditable = isEditable;

      $scope.cluster = multiClusterService.cluster4Edit;
      $scope.useProxy = useProxy;

      $scope.update = function(data, isEditable) {
        multiClusterService
          .updateCluster(data, isEditable, $scope.useProxy)
          .then(function() {
            popupMsg("multiCluster.messages.update_ok");
            $mdDialog.hide();
          })
          .catch(function(error) {
            popupMsg("multiCluster.messages.update_failure", error);
          });
      };
    }
  }
})();
