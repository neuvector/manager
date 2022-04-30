// noinspection JSPotentiallyInvalidConstructorUsage
(function() {
  "use strict";

  /**
   *  Type: module
   *  Name: app.nodeChart
   *  Description: Draw node chart according to network information.
   */

  angular.module("app.graph").controller("GraphController", GraphController);

  /**
   *  Dependencies Injector
   */
  GraphController.$inject = [
    "$rootScope",
    "$scope",
    "$sce",
    "$http",
    "$state",
    "$location",
    "$translate",
    "$window",
    "$filter",
    "Alertify",
    "Utils",
    "$timeout",
    "NetworkFactory",
    "GraphFactory",
    "$controller",
    "$sanitize",
    "AuthorizationFactory",
    "GroupFactory",
    "responseRulesService",
    "ScanFactory"
  ];
  function GraphController(
    $rootScope,
    $scope,
    $sce,
    $http,
    $state,
    $location,
    $translate,
    $window,
    $filter,
    Alertify,
    Utils,
    $timeout,
    NetworkFactory,
    GraphFactory,
    $controller,
    $sanitize,
    AuthorizationFactory,
    GroupFactory,
    responseRulesService,
    ScanFactory
  ) {
    let data = {};
    let serverData = {};

    let hiddenItemIds = [];
    let inComingNodes = [];
    let outGoingNodes = [];
    const nodeToClusterEdgesMap = new Map();
    const collapsedDomains = new Map();

    let lastRevealedNodeIds = [];
    // let cachePositions = {};

    const DELTA = 0.05;
    const zoomSensitivity = 2;
    const UNMANAGED_NODE = ["workloadIp", "nodeIp"];

    let sessionPromise;

    const GROUP_TO_ICON = {
      discover: "cluster-d",
      monitor: "cluster-m",
      protect: "cluster-p"
    };

    const CONTAINER_TO_ICON = {
      discover: "container-d",
      monitor: "container-m",
      protect: "container-p"
    };

    const SERVICEMESH_TO_ICON = {
      discover: "serviceMesh-d",
      monitor: "serviceMesh-m",
      protect: "serviceMesh-p"
    };

    const HOST_TO_ICON = {
      discover: "host-d",
      monitor: "host-m",
      protect: "host-p"
    };

    const user = $rootScope.user.token.username;

    const TOP_LEFT_FLOAT_TOP = 72 + "px";
    const TOP_LEFT_FLOAT_LEFT = 30 + "px";

    const ELEM_DOMAIN_INFO = document.getElementById("domainInfo");
    Utils.dragElement(ELEM_DOMAIN_INFO);

    const ELEM_GROUP_NODE_INFO = document.getElementById("groupNodeInfo");
    Utils.dragElement(ELEM_GROUP_NODE_INFO);

    const ELEM_HOST_INFO = document.getElementById("hostInfo");
    Utils.dragElement(ELEM_HOST_INFO);

    const ELEM_CONV_HISTORY = document.getElementById("conversationHistory");
    Utils.dragElement(ELEM_CONV_HISTORY);

    const ELEM_ACTIVE_SESSIONS = document.getElementById("activeSessions");
    Utils.dragElement(ELEM_ACTIVE_SESSIONS);

    const ELEM_SNIFFER = document.getElementById("sniffer");
    Utils.dragElement(ELEM_SNIFFER);

    const ELEM_LEGEND = document.getElementById("legend");
    Utils.dragElement(ELEM_LEGEND);

    const ELEM_FILTER = document.getElementById("filter");
    Utils.dragElement(ELEM_FILTER);

    const ELEM_BLACKLIST = document.getElementById("blacklist");
    Utils.dragElement(ELEM_BLACKLIST);

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    GroupFactory.setGrid();
    $scope.memberGridOptions = GroupFactory.memberGridOptions;
    $scope.gridRules = GroupFactory.gridRules;
    $scope.gridResponseRules = GroupFactory.gridResponseRules;

    $scope.isWriteNetworkAuthorized = AuthorizationFactory.getDisplayFlag(
      "write_network_rule"
    );
    $scope.isClearSessionAuthorized = AuthorizationFactory.getDisplayFlag(
      "write_network_rule"
    );
    $scope.isPacketCapAuthorized = AuthorizationFactory.getDisplayFlag(
      "write_network_rule"
    );
    $scope.isQuarantineAuthorized = AuthorizationFactory.getDisplayFlag(
      "write_network_rule"
    );

    $scope.isScanStarted4Pod = false;
    $scope.isScanStarted4Host = false;
    $scope.isAdvFilterTextInit = true;

    const useGpu = () => {
      let gpuEnabled;
      if ($window.localStorage.getItem("_gpuEnabled") !== "undefined") {
        gpuEnabled = JSON.parse($window.localStorage.getItem("_gpuEnabled"));
        if (gpuEnabled !== null) return gpuEnabled;
      }
      else
        return false;
    };

    $scope.gpuEnabled = useGpu();

    const initSettings = () => {
      $scope.settings = {
        showSysNode:
          JSON.parse($window.localStorage.getItem(user + "-showSysNode")) ||
          false,
        showSysApp:
          JSON.parse($window.localStorage.getItem(user + "-showSysApp")) ||
          false,
        showLegend:
          JSON.parse($window.localStorage.getItem(user + "-showLegend")) ||
          false,
        hiddenDomains: [],
        hiddenGroups: [],
        persistent:
          JSON.parse($window.localStorage.getItem(user + "-persistent")) ||
          false,
        gpuEnabled: useGpu() || $scope.gpuEnabled
      };
    };

    initSettings();

    const loadAdvFilters = () => {
      $scope.advFilters = JSON.parse(
        $window.localStorage.getItem(user + "-advFilters")
      );
      if ($scope.advFilters) GraphFactory.setAdvFilter($scope.advFilter);
      else {
        GraphFactory.initAdvFilter();
        $scope.advFilter = GraphFactory.getAdvFilter();
      }
    };

    GraphFactory.registerG6Components();

    loadAdvFilters();

    const loadBlacklist = () => {
      $scope.blacklist = JSON.parse(
        $window.localStorage.getItem(user + "-blacklist")
      );
      if ($scope.blacklist) {
        GraphFactory.setBlacklist($scope.blacklist);
      } else $scope.blacklist = GraphFactory.getBlacklist();
    };

    loadBlacklist();

    GraphFactory.setDomainGrid();
    $scope.getGridOptions4Domain = GraphFactory.getGridOptions4Domain();

    const TOP_BAR = 65;
    const SIDE_BAR = 220;
    const PADDING = 26 * 2 + 5 * 2;
    const height = $window.innerHeight - TOP_BAR - PADDING;
    const width = $window.innerWidth - SIDE_BAR - PADDING;
    const container = document.getElementById("mountNode");

    let tooltipEl = null;

    NetworkFactory.setGrids();

    const resizeEvent = "resize.ag-grid";
    let $win = $($window); // cache reference for resize

    //region Conversation Histories
    const dynamicColumns = [
      {
        headerName: $translate.instant("network.gridHeader.CLIENT_IP"),
        field: "client_ip",
        cellRenderer: function(params) {
          if ($scope.conversationDetail.from.id === "external") {
            return (
              '<a href="https://www.whois.com/whois/' +
              $sanitize(params.data.client_ip) +
              '" target="_blank">' +
              "<countryflag ng-if=\"data.client_ip_location.country_code!=='-'\" " +
              'country="{{data.client_ip_location.country_code.toLowerCase()}}" ' +
              'uib-tooltip="{{data.client_ip_location.country_name}}" ' +
              "tooltip-enable=\"{{data.client_ip_location.country_code !== '-'}}\" >" +
              "</countryflag>" +
              "&nbsp;&nbsp;" +
              $sanitize(params.data.client_ip) +
              "</a>"
            );
          } else return "<span>" + params.data.client_ip + "</span>";
        },
        width: 250
      },
      {
        headerName: $translate.instant("network.gridHeader.SERVER_IP"),
        field: "server_ip",
        cellRenderer: function(params) {
          if ($scope.conversationDetail.to.id === "external") {
            return (
              '<a href="https://www.whois.com/whois/' +
              $sanitize(params.data.server_ip) +
              '" target="_blank">' +
              "<countryflag ng-if=\"data.server_ip_location.country_code!=='-'\" " +
              'country="{{data.server_ip_location.country_code.toLowerCase()}}" ' +
              'uib-tooltip="{{data.server_ip_location.country_name}}" ' +
              "tooltip-enable=\"{{data.server_ip_location.country_code !== '-'}}\" >" +
              "</countryflag>" +
              "&nbsp;&nbsp;" +
              $sanitize(params.data.server_ip) +
              "</a>"
            );
          } else return "<span>" + params.data.server_ip + "</span>";
        },
        width: 250
      }
    ];

    const conversationHistoryColumns = NetworkFactory.conHistoryColumnsPre
      .concat(dynamicColumns)
      .concat(NetworkFactory.conHistoryColumnsPost);

    const onTrafficChanged = () => {
      const selectedRows = $scope.convHisGridOptions.api.getSelectedRows();
      $scope.traffic = selectedRows[0];
      $scope.showRuleId = true;
      /** @namespace $scope.traffic.policy_id */
      $scope.ruleId = $scope.traffic.policy_id;
      /** @namespace $scope.traffic.sessions */
      $scope.sessionCount =
        $scope.traffic.sessions + "/" + $scope.conversationDetail.sessions;
      $scope.onThreat = !!$scope.traffic.severity;
      $scope.onViolation =
        $scope.traffic.policy_action === "violate" ||
        $scope.traffic.policy_action === "deny";
      GraphFactory.keepLive();
      $scope.$apply();
    };


    ELEM_CONV_HISTORY.addEventListener("mouseup", function(event) {
      $scope.entriesGridHeight = ELEM_CONV_HISTORY.clientHeight - 130;
      $scope.convHisGridOptions.api.resetRowHeights();
      $scope.convHisGridOptions.api.sizeColumnsToFit();
    });

    $scope.convHisGridOptions = {
      enableSorting: true,
      animateRows: true,
      enableColResize: true,
      angularCompileRows: true,
      suppressDragLeaveHidesColumns: true,
      columnDefs: conversationHistoryColumns,
      rowData: null,
      rowSelection: "single",
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
      },
      onSelectionChanged: onTrafficChanged,
      onGridReady: params => {
        $timeout(() => {
          params.api.sizeColumnsToFit();
        }, 500);
        $win.on(resizeEvent, () => {
          $timeout(() => {
            params.api.sizeColumnsToFit();
          }, 500);
        });
      },
      overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
    };

    $scope.onConvHisFilterChanged = value => {
      GraphFactory.keepLive();
      $scope.convHisGridOptions.api.setQuickFilter(value);
    };

    const switchModeOnMenu = (policyMode, item, graph) => {
      let { model, nodeType, groupName } = getNodeTypeToSwitch(item);
      const callback = () => {
        updatePolicyModeOnNode(policyMode, item, nodeType, graph);
      };
      if (groupName)
        NetworkFactory.switchServiceMode(policyMode, groupName, callback);
    };

    const showRule = id => {
      $http
        .get(POLICY_RULE_URL, { params: { id: id } })
        .then(response => {
          $scope.rule = response.data.rule;
          $scope.onRule = true;
          $scope.rule.allowed = $scope.rule.action === "allow";
        })
        .catch(err => {
          console.warn(err);
        });
    };

    /*
      function: verifyAndParseHostGroup
      description: It only serves for propose rule
    */
    const verifyAndParseHostGroup = function(group) {
      if (group.indexOf(securityEventLocation.HOST) > -1) {
        return "nodes";
      } else {
        return group;
      }
    };

    const proposeRule = (traffic, edgeDetails) => {
      $scope.rule = {};

      $scope.rule.id = 0;
      if (
        edgeDetails.fromGroup &&
        UNMANAGED_NODE.indexOf(edgeDetails.fromGroup) > -1
      )
        $scope.rule.from = edgeDetails.source;
      else $scope.rule.from = edgeDetails.fromGroup;
      if (
        edgeDetails.toGroup &&
        UNMANAGED_NODE.indexOf(edgeDetails.toGroup) > -1
      )
        $scope.rule.to = edgeDetails.target;
      else $scope.rule.to = edgeDetails.toGroup;
      $scope.rule.from = verifyAndParseHostGroup($scope.rule.from);
      $scope.rule.to = verifyAndParseHostGroup($scope.rule.to);
      $scope.rule.ports = traffic.port;
      /** @namespace traffic.application */
      if (traffic.application)
        $scope.rule.applications = traffic.application.split(",");
      else $scope.rule.applications = ["any"];
      $scope.rule.learned = false;
      $scope.rule.comment = "";
      $scope.onRule = true;
      // $scope.onEdge = false;
      $scope.rule.action = traffic.policy_action;
      $scope.rule.allowed = traffic.policy_action === "allow";
      $scope.rule.disable = false;
      GraphFactory.keepLive();
    };

    $scope.overrideRule = (traffic, edgeItem) => {
      let edgeDetail = edgeItem.getModel();
      if (traffic.policy_id !== 0) showRule(traffic.policy_id);
      else proposeRule(traffic, edgeDetail);
    };

    $scope.clearSessions = (from, to) => {
      $http
        .delete(CONVERSATION_SNAPSHOT_URL, {
          params: {
            from: encodeURIComponent(from),
            to: encodeURIComponent(to)
          }
        })
        .then(() => {
          //Remove displayed edge without data reloading
          graph.removeItem($scope.selectedEdge, false);

          //Remove original edge in group without data reloading
          let removedEdgeIndex = serverData.edges.findIndex(edge => {
            return edge.source === from && edge.target === to;
          });
          if (removedEdgeIndex > -1) {
            serverData.edges.splice(removedEdgeIndex, 1);
          }

          clearPopup();
        })
        .catch(err => {
          console.warn(err);
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(
              err,
              $translate.instant("network.popup.SESSION_CLEAR_FAILURE"),
              false
            )
          );
        });
    };

    $scope.closeRuleDetail = () => {
      $scope.onRule = false;
      GraphFactory.keepLive();
    };

    $scope.updateRule = rule => {
      Alertify.confirm($translate.instant("policy.RULE_DEPLOY_CONFIRM")).then(
        function onOk() {
          if (rule.id === 0) {
            let action = "deny";
            if (rule.allowed) action = "allow";

            $scope.rule.action = action;
            $http
              .post(POLICY_RULE_URL, $scope.rule)
              .then(() => {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success($translate.instant("network.RULE_DEPLOY_OK"));
                $scope.onRule = false;
                $scope.onEdge = true;
              })
              .catch(err => {
                console.warn(err);
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      err,
                      $translate.instant("network.RULE_DEPLOY_FAILED"),
                      false
                    )
                  );
                }
              });
          } else {
            let action = "deny";
            if (rule.allowed) action = "allow";

            $http
              .patch(POLICY_RULE_URL, { id: rule.id, action: action })
              .then(() => {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success($translate.instant("network.RULE_DEPLOY_OK"));
                $scope.onRule = false;
                $scope.onEdge = true;
              })
              .catch(err => {
                console.warn(err);
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      err,
                      $translate.instant("network.RULE_DEPLOY_FAILED"),
                      false
                    )
                  );
                }
              });
          }
        },
        function onCancel() {}
      );
    };
    //endregion

    //region Active Sessions
    $scope.autoRefresh = false;

    const activeColumns = NetworkFactory.activeColumns;

    ELEM_ACTIVE_SESSIONS.addEventListener("mouseup", function(event) {
      $scope.activeSessionGridHeight = ELEM_ACTIVE_SESSIONS.clientHeight - 90;
      $scope.activeGridOptions.api.resetRowHeights();
      $scope.activeGridOptions.api.sizeColumnsToFit();
    });

    $scope.activeGridOptions = {
      deltaRowDataMode: true,
      animateRows: true,
      enableSorting: true,
      enableColResize: true,
      angularCompileRows: true,
      getRowNodeId: data => data.id,
      suppressDragLeaveHidesColumns: true,
      columnDefs: activeColumns,
      rowData: null,
      rowSelection: "single",
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
      },
      onGridReady: params => {
        $timeout(() => {
          params.api.sizeColumnsToFit();
        }, 100);
        $win.on(resizeEvent, () => {
          $timeout(() => {
            params.api.sizeColumnsToFit();
          }, 500);
        });
      },
      overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
    };

    $scope.onActiveSessionFilterChanged = value => {
      GraphFactory.keepLive();
      $scope.activeGridOptions.api.setQuickFilter(value);
    };

    const getActiveSessions = response => {
      $scope.conversations = response.data.sessions;
      if ($scope.conversations && $scope.conversations.length > 0) {
        if ($scope.conversations.length < 5)
          $scope.activeSessionGridHeight =
            30 + 25 * $scope.conversations.length;
        else $scope.activeSessionGridHeight = 30 + 25 * 5;
        $timeout(function() {
          $scope.activeSessionGridHeight = Math.max($scope.activeSessionGridHeight, ELEM_ACTIVE_SESSIONS.clientHeight - 90);
          $scope.activeGridOptions.api.resetRowHeights();
          $scope.activeGridOptions.api.setRowData($scope.conversations);
        }, 100);
      }
      $scope.onSniffer = false;
      $scope.onActiveSession = true;
    };

    $scope.makePopupBackToOriginalLocation = () => {
      $timeout(() => {
        ELEM_ACTIVE_SESSIONS.style.top = TOP_LEFT_FLOAT_TOP;
        ELEM_ACTIVE_SESSIONS.style.left = TOP_LEFT_FLOAT_LEFT;
      }, 2000);
    };

    const getLiveSession = () => {
      $http
        .get(SESSION_URL, { params: { id: $scope.containerId } })
        .then(response => {
          getActiveSessions(response);
          sessionPromise = setTimeout(getLiveSession, 5000);
        })
        .catch(err => {
          console.warn(err);
        });
    };

    const getCurrentSession = () => {
      $http
        .get(SESSION_URL, { params: { id: $scope.containerId } })
        .then(response => {
          getActiveSessions(response);
        })
        .catch(err => {
          console.warn(err);
        });
    };

    $scope.refreshSession = () => {
      if ($scope.autoRefresh) {
        getLiveSession();
      } else {
        getCurrentSession();
      }
    };

    $scope.stopRefreshSession = () => {
      if (sessionPromise) {
        clearTimeout(sessionPromise);
        sessionPromise = 0;
      }
    };

    $scope.toggleRefresh = autoUpdate => {
      if (autoUpdate) $scope.refreshSession();
      else $scope.stopRefreshSession();
    };

    const showSessions = container => {
      $scope.containerId = container.id;
      $scope.currentName =
        container.label.length > container.oriLabel.length
          ? container.label
          : container.oriLabel;
      $scope.conversations = [];
      clearPopup();
      $scope.stopRefreshSession();
      $scope.refreshSession();
    };
    //endregion

    //region Sniffer
    let snifferPromise;
    const sniffColumnDefs = NetworkFactory.sniffColumns;
    const onSnifferChanged = () => {
      let selectedRows = $scope.sniffGridOptions.api.getSelectedRows();
      $scope.sniffer = selectedRows[0];
      GraphFactory.keepLive();
      $scope.$apply();
    };

    ELEM_SNIFFER.addEventListener("mouseup", function(event) {
      $scope.snifferGridHeight = ELEM_SNIFFER.clientHeight - 160;
      $scope.sniffGridOptions.api.resetRowHeights();
      $scope.sniffGridOptions.api.sizeColumnsToFit();
    }, true);

    $scope.sniffGridOptions = {
      deltaRowDataMode: true,
      animateRows: true,
      enableSorting: true,
      enableColResize: true,
      getRowNodeId: data => data.id,
      angularCompileRows: true,
      suppressDragLeaveHidesColumns: true,
      columnDefs: sniffColumnDefs,
      rowData: null,
      rowSelection: "single",
      icons: {
        sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
        sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
      },
      onSelectionChanged: onSnifferChanged,
      onGridReady: params => {
        $timeout(() => {
          params.api.sizeColumnsToFit();
        }, 100);
        $win.on(resizeEvent, () => {
          $timeout(() => {
            params.api.sizeColumnsToFit();
          }, 500);
        });
      },
      overlayNoRowsTemplate: `<div class="text-info text-bold mt-lg">${$translate.instant(
        "general.NO_ROWS"
      )}</div>`
    };

    const MINUTES = $translate.instant("setting.MINUTES");
    const SECONDS = $translate.instant("setting.SECONDS");
    const convertMinutes = value => {
      if (!value) return "";
      let minutes = Math.floor(value / 60);
      let seconds = Math.round(value % 60);

      let sec = seconds === 0 ? "" : `${seconds}${SECONDS}`;
      if (seconds === 1) sec = sec.replace("s", "");
      let min = minutes === 0 ? "" : `${minutes}${MINUTES}`;
      if (minutes === 1) min = min.replace("s", "");
      if (!minutes) return `${sec}`;
      return seconds > 0 ? `${min}, ${sec}` : `${min}`;
    };

    $scope.pcap = {
      seconds: 0,
      options: {
        floor: 0,
        minValue: 5,
        minRange: 5,
        ceil: 600,
        step: 5,
        showSelectionBar: true,
        disabled: true,
        showTicks: 60,
        translate: convertMinutes
      }
    };

    $scope.$on("stop-pulling", function() {
      $scope.stopRefreshSniffer();
    });

    const refreshSniffer = () => {
      $scope.isSnifferErr = false;
      $http
        .get(SNIFF_URL, { params: { id: $scope.sniffOnId } })
        .then(response => {
          getSniffers(response);
        })
        .catch(err => {
          console.warn(err);
          $scope.isSnifferErr = true;
          $scope.snifferErrMsg = Utils.getErrorMessage(err);
        });
    };

    $scope.toggleSchedule = () => {
      $scope.pcap.options.disabled = !$scope.pcap.options.disabled;
      if ($scope.pcap.options.disabled) $scope.pcap.seconds = 0;
      GraphFactory.keepLive();
    };

    const pullSniffers = () => {
      refreshSniffer();
      snifferPromise = setTimeout(pullSniffers, 5000);
    };

    const getSniffers = response => {
      $scope.sniffers = response.data.sniffers;
      $scope.snifferGridHeight = 40 + 25;
      if ($scope.sniffers && $scope.sniffers.length > 0) {
        if ($scope.sniffers.length < 5)
          $scope.snifferGridHeight = 40 + 25 * $scope.sniffers.length;
        else $scope.snifferGridHeight = 40 + 25 * 5;
        $timeout(() => {
          $scope.snifferGridHeight = Math.max($scope.snifferGridHeight, ELEM_SNIFFER.clientHeight - 130);
          $scope.sniffGridOptions.api.resetRowHeights();
          $scope.sniffGridOptions.api.setRowData($scope.sniffers);
          if ($scope.sniffers && $scope.sniffers.length > 0) {
            let runningSniffer = $scope.sniffers.find(
              item => item.status === "running"
            );
            if (!!runningSniffer) {
              $scope.sniffGridOptions.api.forEachNode(node => {
                if (node.data.status === "running") {
                  node.setSelected(true);
                  $scope.sniffGridOptions.api.ensureNodeVisible(node);
                }
              });
              if (!snifferPromise) {
                if (!$scope.sniffOnId) $scope.sniffOnId = $scope.containerId;
                pullSniffers();
              }
            } else {
              $scope.$broadcast("stop-pulling");
              console.log($scope.sniffer);
              $scope.sniffGridOptions.api.forEachNode((node, index) => {
                if ($scope.sniffer !== null) {
                  if (node.data.id === $scope.sniffer.id) {
                    node.setSelected(true);
                    $scope.sniffGridOptions.api.ensureNodeVisible(node);
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  $scope.sniffGridOptions.api.ensureNodeVisible(node);
                }
              });
              $scope.sniffer.status = "stopped";
            }

            let selectedRows = $scope.sniffGridOptions.api.getSelectedRows();
            $scope.sniffer = selectedRows[0];
          }
        }, 100);
      } else {
        $timeout(() => {
          $scope.sniffGridOptions.api.setRowData([]);
        });
      }

      ELEM_SNIFFER.style.top = TOP_LEFT_FLOAT_TOP;
      ELEM_SNIFFER.style.left = TOP_LEFT_FLOAT_LEFT;
      $scope.onSniffer = true;
      $scope.isSnifferErr = false;
      $scope.snifferErrMsg = "";
      $timeout(() => {
        $scope.$broadcast("rzSliderForceRender");
        $scope.sniffGridOptions.api.sizeColumnsToFit();
      }, 500);
    };

    const showSniffer = container => {
      if(container && container.cap_sniff) {
        $scope.containerId = container.id;
        $scope.containerName =
            container.label.length > container.oriLabel.length
                ? container.label
                : container.oriLabel;
        clearPopup();

        $http
            .get(SNIFF_URL, {params: {id: container.id}})
            .then(function (response) {
              getSniffers(response);
              $scope.sniffer = null;
            })
            .catch(function (err) {
              console.warn(err);
            });
      }
    };

    $scope.startSniff = containerId => {
      $scope.isSnifferErr = false;
      let snifferParam = {};
      if (!$scope.pcap.options.disabled && $scope.pcap.seconds)
        snifferParam.duration = $scope.pcap.seconds;
      $http
        .post(SNIFF_URL, {
          workloadId: containerId,
          snifferParamWarp: {
            sniffer: snifferParam
          }
        })
        .then(() => {
          $scope.sniffOnId = containerId;
          pullSniffers();
        })
        .catch(err => {
          console.warn(err);
          $scope.isSnifferErr = true;
          $scope.snifferErrMsg = Utils.getErrorMessage(err);
        });
    };

    $scope.disableStart = () => {
      if (!$scope.sniffers) return false;
      let startedJob = $scope.sniffers.filter(v => v.status === "running")[0];
      return !!startedJob;
    };

    $scope.stopSniff = jobId => {
      $http
        .patch(SNIFF_URL, jobId)
        .then(() => {
          /** @namespace $scope.sniffer.container_id */
          refreshSniffer();
        })
        .catch(err => {
          console.warn(err);
        });
    };

    $scope.deleteSniff = jobId => {
      $http
        .delete(SNIFF_URL, { params: { id: jobId } })
        .then(() =>
          $http
            .get(SNIFF_URL, { params: { id: $scope.containerId } })
            .then(response => {
              getSniffers(response);
              $scope.sniffer = null;
            })
        )
        .catch(err => {
          console.warn(err);
        });
    };

    $scope.stopRefreshSniffer = () => {
      if (snifferPromise) {
        clearTimeout(snifferPromise);
        snifferPromise = 0;
      }
    };

    const multiPart_parse = (body, contentType) => {
      let m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

      if (!m) {
        throw new Error("Bad content-type header, no multipart boundary");
      }

      let boundary = m[1] || m[2];

      const Header_parse = header => {
        let headerFields = {};
        let matchResult = header.match(/^.*name="([^"]*)"$/);
        if (matchResult) headerFields.name = matchResult[1];
        return headerFields;
      };

      const rawStringToBuffer = str => {
        let idx,
          len = str.length,
          arr = new Array(len);
        for (idx = 0; idx < len; ++idx) {
          arr[idx] = str.charCodeAt(idx) & 0xff;
        }
        return new Uint8Array(arr).buffer;
      };

      boundary = "\r\n--" + boundary;
      let isRaw = typeof body !== "string";
      let s;
      if (isRaw) {
        let view = new Uint8Array(body);
        s = view.reduce((data, byte) => data + String.fromCharCode(byte), "");
      } else {
        s = body;
      }

      s = "\r\n" + s;

      let parts = s.split(new RegExp(boundary)),
        partsByName = {};

      let fieldName;

      for (let i = 1; i < parts.length - 1; i++) {
        let subparts = parts[i].split("\r\n\r\n");
        let headers = subparts[0].split("\r\n");
        for (let j = 1; j < headers.length; j++) {
          let headerFields = Header_parse(headers[j]);
          if (headerFields.name) {
            fieldName = headerFields.name;
          }
        }

        partsByName[fieldName] = isRaw
          ? rawStringToBuffer(subparts.slice(1).join("\r\n\r\n"))
          : subparts.slice(1).join("\r\n\r\n");
        $scope.exportFilename = fieldName;
      }
      return partsByName;
    };

    $scope.downloadPacket = jobId => {
      $http
        .get(SNIFF_PCAP_URL, {
          params: { id: jobId },
          responseType: "arraybuffer",
          cache: false,
          headers: { "Cache-Control": "no-store" }
        })
        .then(response => {
          let raw = response.headers("Content-Type");
          let map = multiPart_parse(response.data, raw);
          $scope.exportUrl = URL.createObjectURL(
            new Blob([map[$scope.exportFilename]])
          );
          $scope.downloadId = jobId;
        })
        .catch(err => {
          console.warn(err);
        });
    };
    //endregion

    const clearPopup = () => {
      $scope.onAdvFilter = false;
      $scope.onDomain = false;
      $scope.onGroupNode = false;
      $scope.onQuickSearch = false;
      $scope.onBlacklist = false;
      $scope.onHost = false;
      $scope.onEdge = false;
      $scope.onSniffer = false;
      $scope.onRule = false;
      $scope.onActiveSession = false;
      $scope.stopRefreshSession();
      $scope.makePopupBackToOriginalLocation();
    };

    const getNodeName = node => {
      if (node.label && !node.label.endsWith("...")) return node.label;
      else return node.oriLabel;
    };

    const showCve = (message, position) => {
      if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.setAttribute("class", "drop drop1");
        container.appendChild(tooltipEl);
      }
      tooltipEl.textContent = message;
      tooltipEl.style.left = position.x + "px";
      tooltipEl.style.top = position.y + "px";
      tooltipEl.style.display = "block";
    };

    const hideCve = () => {
      if (!tooltipEl) {
        return;
      }
      tooltipEl.style.display = "none";
    };

    const showItems = graph => {
      if (hiddenItemIds.length > 0) {
        hiddenItemIds.forEach(id => {
          const item = graph.findById(id);
          graph.showItem(item);
        });
      }
      hiddenItemIds = [];
    };

    const zoomOut = graph => {
      const currentZoom = graph.getZoom();
      const ratioOut = 1 / (1 - DELTA * zoomSensitivity);
      const maxZoom = graph.get("maxZoom");
      if (ratioOut * currentZoom > maxZoom) {
        return;
      }
      graph.zoomTo(currentZoom * ratioOut);
    };

    const quarantine = (item, toQuarantine) => {
      const message = toQuarantine
        ? $translate.instant("policy.QUARANTINE_CONFIRM")
        : $translate.instant("policy.UNQUARANTINE_CONFIRM");
      Alertify.confirm(message).then(
        function onOk() {
          $http
            .post(CONTAINER_URL, {
              id: item.getModel().id,
              quarantine: toQuarantine
            })
            .then(() => {
              setTimeout(() => {
                const model = item.getModel();
                if (toQuarantine) {
                  model.state = "quarantined";
                  const theNode =
                    serverData.nodes[
                      GraphFactory.getNodeIdIndexMap().get(model.id)
                    ];
                  if (theNode) theNode.state = model.state;
                  const group = item.get("group");
                  const stroke = group.find(
                    e => e.get("name") === "stroke-shape"
                  );
                  stroke && stroke.show();

                  const clusterNode = graph.findById(model.clusterId);
                  if (clusterNode) {
                    clusterNode.getModel().quarantines += 1;
                  }
                } else {
                  const group = item.get("group");
                  const stroke = group.find(
                    e => e.get("name") === "stroke-shape"
                  );
                  stroke && stroke.hide();

                  model.state = model.group
                    ? item.getModel().group.substring("container".length)
                    : "";
                  const theNode =
                    serverData.nodes[
                      GraphFactory.getNodeIdIndexMap().get(model.id)
                    ];
                  if (theNode) theNode.state = model.state;

                  const clusterNode = graph.findById(model.clusterId);
                  if (clusterNode) {
                    clusterNode.getModel().quarantines -= 1;
                  }
                }
              }, 0);
            })
            .catch(err => {
              console.warn(err);
              if (USER_TIMEOUT.indexOf(err.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(
                    err,
                    $translate.instant("policy.message.QUARANTINE_FAILED"),
                    false
                  )
                );
              }
            });
        },
        function onCancel() {}
      );
    };

    const DETAILS = $translate.instant("network.nodeDetails.DETAILS");
    const EXPAND = $translate.instant("network.popup.EXPAND");
    const COLLAPSE = $translate.instant("network.popup.COLLAPSE_GROUP");
    const COLLAPSE_DOMAIN = $translate.instant("network.popup.COLLAPSE_DOMAIN");
    const ACTIVE_SESSIONS = $translate.instant(
      "network.nodeDetails.ACTIVE_SESSIONS"
    );
    const PACKET_CAPTURE = $translate.instant("network.nodeDetails.SNIFF");
    const HIDE_NODE = $translate.instant("network.nodeDetails.HIDE_NODE");
    const HIDE_INCOMING = $translate.instant(
      "network.nodeDetails.HIDE_INCOMING"
    );
    const SHOW_INCOMING = $translate.instant(
      "network.nodeDetails.SHOW_INCOMING"
    );
    const HIDE_OUTGOING = $translate.instant(
      "network.nodeDetails.HIDE_OUTGOING"
    );
    const SHOW_OUTGOING = $translate.instant(
      "network.nodeDetails.SHOW_OUTGOING"
    );
    const HIDE_EDGE = $translate.instant("network.nodeDetails.HIDE_EDGE");
    const SHOW_ALL = $translate.instant("network.nodeDetails.SHOW_ALL");
    const FIT_VIEW = $translate.instant("network.FIT_VIEW");
    const DISCOVER = $translate.instant("enum.DISCOVER");
    const MONITOR = $translate.instant("enum.MONITOR");
    const PROTECT = $translate.instant("enum.PROTECT");
    const QUARANTINE = $translate.instant("network.nodeDetails.QUARANTINE");
    const UN_QUARANTINE = $translate.instant(
      "network.nodeDetails.UN_QUARANTINE"
    );

    const contextMenu = new G6.Menu({
      getContent(evt) {
        const getMenuVisibility = (visibilityMap, menuName) => {
          return visibilityMap[menuName] ? "block" : "none";
        };
        const item = evt.item;
        if (evt.target && evt.target.isCanvas && evt.target.isCanvas()) {
          return `<ul class="right-menu">
                    <li id='fitView'>
                      <em class="fa fa-arrows-h text-info mr-sm"></em>${FIT_VIEW}</li>
                </ul>`;
        } else if (item) {
          const itemType = item.getType();
          const model = item.getModel();
          if (itemType && model) {
            console.log(model);
            const NO_DETAIL_NODE = [
              "nvUnmanagedNode",
              "nvUnmanagedWorkload",
              "external"
              // "_namespace",
            ];
            const MENU_VISIBILITY_MAP = {
              info:
                NO_DETAIL_NODE.indexOf(model.cluster) === -1 &&
                NO_DETAIL_NODE.indexOf(model.domain) === -1 &&
                !(model.id && model.id === "nodes") &&
                !(model.group && model.group === "ip_service"),
              expand: ["group", "domain"].includes(model.kind),
              discover:
                ((model.kind === "group" &&
                  model.group !== "ip_service" &&
                  model.policyMode &&
                  model.policyMode.toLowerCase() !== "discover") ||
                  (model.group &&
                    (model.group.startsWith("container") ||
                      model.group.startsWith("mesh")) &&
                    model.policyMode &&
                    model.policyMode.toLowerCase() !== "discover")) &&
                $scope.isWriteNetworkAuthorized,
              monitor:
                ((model.kind === "group" &&
                  model.group !== "ip_service" &&
                  model.policyMode &&
                  model.policyMode.toLowerCase() !== "monitor") ||
                  (model.group &&
                    (model.group.startsWith("container") ||
                      model.group.startsWith("mesh")) &&
                    model.policyMode &&
                    model.policyMode.toLowerCase() !== "monitor")) &&
                $scope.isWriteNetworkAuthorized,
              protect:
                ((model.kind === "group" &&
                  model.group !== "ip_service" &&
                  model.policyMode &&
                  model.policyMode.toLowerCase() !== "protect") ||
                  (model.group &&
                    (model.group.startsWith("container") ||
                      model.group.startsWith("mesh")) &&
                    model.policyMode &&
                    model.policyMode.toLowerCase() !== "protect")) &&
                $scope.isWriteNetworkAuthorized,
              collapse: false,
              collapseDomain:
                model.id !== "external" &&
                model.id !== "nodes" &&
                model.kind !== "domain" &&
                !(model.group && model.group === "host") &&
                $scope.summary.platform.toLowerCase().indexOf(KUBE) !== -1,
              activeSessions:
                model.group && model.group.startsWith("container"),
              sniff:
                model.group && model.cap_sniff &&
                (model.group.startsWith("container") ||
                  model.group.startsWith("mesh")),
              quarantine:
                model.cap_quarantine &&
                model.state !== "quarantined" &&
                $scope.isWriteNetworkAuthorized,
              unQuarantine:
                model.cap_quarantine &&
                model.state === "quarantined" &&
                $scope.isWriteNetworkAuthorized,
              hide: true,
              hideInComing: !inComingNodes.includes(model.id),
              showInComing: inComingNodes.includes(model.id),
              hideOutGoing: !outGoingNodes.includes(model.id),
              showOutGoing: outGoingNodes.includes(model.id)
            };
            if (itemType === "node") {
              return `<ul class="right-menu">
                        <li id='info' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "info"
                        )};">
                          <em class="fa fa-info-circle text-info" style="margin-right: 10px;"></em>${DETAILS}
                        </li>
                        <li id='expand' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "expand"
                        )};">
                          <em class="fa fa-expand text-info" style="margin-right: 10px;"></em>${EXPAND}
                        </li>
                        <li id='collapse' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "collapse"
                        )};">
                          <em class="fa fa-compress text-info" style="margin-right: 10px;"></em>${COLLAPSE}
                        </li>
                        <li id='collapseDomain' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "collapseDomain"
                        )};">
                          <em class="fa fa-compress text-info" style="margin-right: 10px;"></em>${COLLAPSE_DOMAIN}
                        </li>
                        <li id='activeSessions' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "activeSessions"
                        )};">
                          <em class="fa fa-list-alt text-info" style="margin-right: 9px;"></em>${ACTIVE_SESSIONS}
                        </li>
                        <li id='sniff' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "sniff"
                        )};">
                          <em class="fa fa-video-camera text-info" style="margin-right: 8px;"></em>${PACKET_CAPTURE}
                        </li>
                        <li id='discover' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "discover"
                        )};">
                          <em class="fa fa-binoculars fa-fw text-info mr-sm"></em>${DISCOVER}
                        </li>
                        <li id='monitor' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "monitor"
                        )};">
                          <em class="fa fa-bell fa-fw text-info mr-sm"></em>${MONITOR}
                        </li>
                        <li id='protect' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "protect"
                        )};">
                          <em class="fa fa-shield fa-fw text-info mr-sm"></em>${PROTECT}
                        </li>
                        <li id='quarantine' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "quarantine"
                        )};">
                          <em class="fa fa-ban fa-fw text-pink mr-sm"></em>${QUARANTINE}
                        </li>
                        <li id='unQuarantine' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "unQuarantine"
                        )};">
                          <em class="fa fa-ban fa-fw text-pink mr-sm"></em>${UN_QUARANTINE}
                        </li>
                        <li id='hide' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "hide"
                        )};">
                          <em class="fa fa-eye-slash text-info" style="margin-right: 8px;"></em>${HIDE_NODE}
                        </li>
                        <li id='hideInComing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "hideInComing"
                        )};">
                          <em class="fa fa-eye-slash text-info" style="margin-right: 8px;"></em>${HIDE_INCOMING}
                        </li>
                        <li id='showInComing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "showInComing"
                        )};">
                          <em class="fa fa-eye text-info" style="margin-right: 8px;"></em>${SHOW_INCOMING}
                        </li>
                        <li id='hideOutGoing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "hideOutGoing"
                        )};">
                          <em class="fa fa-eye-slash text-info" style="margin-right: 8px;"></em>${HIDE_OUTGOING}
                        </li>
                        <li id='showOutGoing' style="display: ${getMenuVisibility(
                          MENU_VISIBILITY_MAP,
                          "showOutGoing"
                        )};">
                          <em class="fa fa-eye text-info" style="margin-right: 8px;"></em>${SHOW_OUTGOING}
                        </li>
                      </ul>`;
            } else if (itemType === "edge") {
              return `<ul class="right-menu">
                        <li id='hide'>${HIDE_EDGE}</li>
                      </ul>`;
            } else if (itemType === "combo") {
              return `<ul class="right-menu">
                        <li id='collapse'>
                          <em class="fa fa-compress text-info mr-sm"></em>${COLLAPSE}
                        </li>
                        <li id='hide'>
                          <em class="fa fa-eye-slash text-info mr-sm"></em>${HIDE_NODE}
                        </li>
                      </ul>`;
            }
          }
        }
      },
      handleMenuClick: (target, item) => {
        console.log(target, item);
        const model = item && item.getModel();
        const liIdStrs = target.id.split("-");
        switch (liIdStrs[0]) {
          case "info":
            showNodeInfo(model, item);
            break;
          case "hide":
            hideNode(item);
            break;
          case "hideInComing":
            hideInComing(item);
            break;
          case "showInComing":
            showInComing(item);
            break;
          case "hideOutGoing":
            hideOutGoing(item);
            break;
          case "showOutGoing":
            showOutGoing(item);
            break;
          case "expand":
            expand(item);
            break;
          case "collapse":
            collapseCluster(item);
            break;
          case "collapseDomain":
            collapseDomain(item);
            break;
          case "show":
            showItems(graph);
            break;
          case "fitView":
            autoZoom(graph);
            break;
          case "activeSessions":
            showSessions(model);
            break;
          case "sniff":
            showSniffer(model);
            break;
          case "discover":
            switchModeOnMenu("Discover", item, graph);
            break;
          case "monitor":
            switchModeOnMenu("Monitor", item, graph);
            break;
          case "protect":
            switchModeOnMenu("Protect", item, graph);
            break;
          case "quarantine":
            quarantine(item, true);
            break;
          case "unQuarantine":
            quarantine(item, false);
            break;
          default:
            break;
        }
      },
      // offsetX and offsetY include the padding of the parent container
      offsetX: 16 + 10,
      offsetY: 0,
      // the types of items that allow the menu show up
      itemTypes: ["node", "edge", "combo", "canvas"]
    });

    const zoomIn = graph => {
      const currentZoom = graph.getZoom();
      const ratioIn = 1 - DELTA * zoomSensitivity;
      const minZoom = graph.get("minZoom");
      if (ratioIn * currentZoom < minZoom) {
        return;
      }
      graph.zoomTo(currentZoom * ratioIn);
    };

    const autoZoom = graph => {
      graph.fitView([20, 20]);
    };

    const destructConditions = rules => {
      rules.forEach(function(rule) {
        rule.conditions = responseRulesService.conditionObjToString(
          rule.conditions
        );
      });
      return rules;
    };

    const showDomainInfo = item => {
      $scope.domain = item.getModel();
      console.log($scope.domain);
      ELEM_DOMAIN_INFO.style.top = TOP_LEFT_FLOAT_TOP;
      ELEM_DOMAIN_INFO.style.left = TOP_LEFT_FLOAT_LEFT;
      $scope.getGridOptions4Domain.api.setRowData($scope.domain.children);
      $scope.onDomain = true;
      $timeout(() => {
        $scope.getGridOptions4Domain.api.sizeColumnsToFit();
      }, 200);
      $scope.$apply();
    };

    const showGroupInfo = (item, node = null) => {
      let groupId = item.getModel().clusterId || item.getModel().id;
      if (groupId && !systemGroups[groupId]) {
        $http
          .get(GROUP_URL, { params: { name: groupId } })
          .then(function(response) {
            $scope.group = response.data.group;

            clearPopup();
            $scope.typeHtml = "";
            if ($scope.group.cfg_type === CFG_TYPE.LEARNED) {
              $scope.typeHtml = `<span class="action-label nv-label ${
                colourMap["LEARNED"]
              }">${$translate.instant("group.LEARNED")}</span>`;
            } else if ($scope.group.cfg_type === CFG_TYPE.CUSTOMER) {
              $scope.typeHtml = `<span class="action-label nv-label ${
                colourMap["CUSTOM"]
              }">${$translate.instant("group.CUSTOM")}</span>`;
            } else if ($scope.group.cfg_type === CFG_TYPE.GROUND) {
              $scope.typeHtml = `<span class="action-label nv-label ${
                colourMap["GROUND"]
              }">${$translate.instant("group.GROUND")}</span>`;
            } else if ($scope.group.cfg_type === CFG_TYPE.FED) {
              $scope.typeHtml = `<span class="action-label nv-label ${
                colourMap["FED"]
              }">${$translate.instant("group.FED")}</span>`;
            }
            $scope.modeHtml = "";
            let mode = $scope.group.policy_mode
              ? Utils.getI18Name($scope.group.policy_mode)
              : "";
            let labelCode = colourMap[$scope.group.policy_mode];
            $scope.modeHtml = `<span class="hand label label-fs label-${labelCode}">${$sanitize(
              mode
            )}<em class="ml-sm fa fa-angle-down" aria-hidden="true"></em></span>`;
            ELEM_GROUP_NODE_INFO.style.top = TOP_LEFT_FLOAT_TOP;
            ELEM_GROUP_NODE_INFO.style.left = TOP_LEFT_FLOAT_LEFT;
            $scope.onGroupNode = true;
            $scope.container = {};
            $scope.isPodNode = false;
            if (node) {
              $scope.isPodNode = true;
              if (node.meshId) showPodInfo(node.meshId);
              else showPodInfo(node.id);
            } else {
              $scope.active = 1;
            }

            $scope.memberGridOptions.api.setRowData($scope.group.members);
            $scope.gridRules.api.setRowData($scope.group.policy_rules);
            $scope.gridResponseRules.api.setRowData(
              destructConditions($scope.group.response_rules)
            );
            $timeout(() => {
              $scope.memberGridOptions.api.sizeColumnsToFit();
              $scope.gridRules.api.sizeColumnsToFit();
              $scope.gridResponseRules.api.sizeColumnsToFit();
            }, 200);
            $scope.group.cve = GraphFactory.getGroupVulnerabilities(
              $scope.group
            );
            $scope.item = item;
          })
          .catch(function(err) {
            console.warn(err);
          });
      } else {
        clearPopup();
        $scope.$apply();
      }
    };

    const updatePoliceModeOnPopup = selectedMode => {
      $scope.group.policy_mode = selectedMode;
      $scope.modeHtml = "";
      let mode = $scope.group.policy_mode
        ? Utils.getI18Name($scope.group.policy_mode)
        : "";
      let labelCode = colourMap[$scope.group.policy_mode];
      $scope.modeHtml = `<span class="hand label label-fs label-${labelCode}">${$sanitize(
        mode
      )}<em class="ml-sm fa fa-angle-down" aria-hidden="true"></em></span>`;
    };

    const updatePolicyModeOnNode = (selectedMode, item, nodeType, graph) => {
      if (nodeType === "group") {
        graph.updateItem(item, {
          policyMode: selectedMode,
          icon: {
            img: `app/img/icons/graph/${
              GROUP_TO_ICON[selectedMode.toLowerCase()]
            }.svg`
          },
          style: {
            stroke: GraphFactory.strokeColor[selectedMode],
            fill: GraphFactory.fillColor[selectedMode]
          }
        });
      }

      const switchItemMode = item => {
        graph.updateItem(item, {
          policyMode: selectedMode,
          icon: {
            img:
              nodeType === "container"
                ? `app/img/icons/graph/${
                    CONTAINER_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`
                : `app/img/icons/graph/${
                    SERVICEMESH_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`
          },
          style: {
            stroke: GraphFactory.strokeColor[selectedMode],
            fill: GraphFactory.fillColor[selectedMode]
          }
        });
      };

      if (["container", "mesh"].includes(nodeType)) {
        const combo = item.getModel().comboId
          ? graph.findById(item.getModel().comboId)
          : null;

        const members = combo ? combo.getNodes() : [];

        if (members.length > 0) {
          //The item is combo, update policy mode of all pods in group
          members.forEach(item => {
            switchItemMode(item);
          });
          const group = item.getModel().clusterId
            ? graph.findById(item.getModel().clusterId)
            : null;
          if (group) {
            graph.updateItem(group, {
              policyMode: selectedMode,
              icon: {
                img: `app/img/icons/graph/${
                  GROUP_TO_ICON[selectedMode.toLowerCase()]
                }.svg`
              },
              style: {
                stroke: GraphFactory.strokeColor[selectedMode],
                fill: GraphFactory.fillColor[selectedMode]
              }
            });
          }
        } else {
          switchItemMode(item);
        }
      }
    };

    const softUpdateMembersData = policyMode => {
      // Refresh state in members grid
      $scope.group.members = $scope.group.members.map(member => {
        if (member.children) {
          member.children = member.children.map(child => {
            if (
              ["discover", "monitor", "protect"].includes(
                child.state.toLowerCase()
              )
            ) {
              child.state = policyMode.toLowerCase();
            }
            return child;
          });
        }
        if (
          ["discover", "monitor", "protect"].includes(
            member.state.toLowerCase()
          )
        ) {
          member.state = policyMode.toLowerCase();
        }
        return member;
      });
      $scope.memberGridOptions.api.setRowData($scope.group.members);

      // Refresh state in pod details
      if ($scope.isPodNode) {
        if (
          ["discover", "monitor", "protect"].includes(
            $scope.container.state.toLowerCase()
          )
        ) {
          $scope.container.state = policyMode.toLowerCase();
          $scope.stateHtml = "";
          let displayState = Utils.getI18Name($scope.container.state);
          let labelCode = colourMap[$scope.container.state];
          $scope.stateHtml = `<span class="label label-fs label-${labelCode}">${$sanitize(
            displayState
          )}</span>`;
        }
      }
    };

    function getNodeTypeToSwitch(item) {
      let model = item.getModel();
      let groupName = "";
      let nodeType = "";
      if (model.group && model.group.startsWith("container")) {
        groupName = model.clusterId;
        nodeType = "container";
      }
      if (model.group && model.group.startsWith("mesh")) {
        groupName = model.clusterId;
        nodeType = "mesh";
      }
      if (model.kind && model.kind === "group") {
        groupName = model.id;
        nodeType = "group";
      }
      return { model, nodeType, groupName };
    }

    $scope.switchServiceModeOnPopup = (selectedMode, item) => {
      let { model, nodeType, groupName } = getNodeTypeToSwitch(item);
      const callback = () => {
        updatePolicyModeOnNode(selectedMode, item, nodeType, graph);
        updatePoliceModeOnPopup(selectedMode);
        softUpdateMembersData(selectedMode);
      };
      if (groupName)
        NetworkFactory.switchServiceMode(
          selectedMode,
          model.clusterId || model.id,
          callback
        );
    };

    $scope.clickTabOnGroupPop = function() {
      $scope.memberGridOptions.api.sizeColumnsToFit();
      $scope.gridRules.api.sizeColumnsToFit();
      $scope.gridResponseRules.api.sizeColumnsToFit();
    };

    const showPodInfo = nodeId => {
      $http
        .get(PLAIN_CONTAINER_URL, { params: { id: nodeId } })
        .then(function(response) {
          $scope.container = response.data.workload;
          let theNode =
            serverData.nodes[GraphFactory.getNodeIdIndexMap().get(nodeId)];
          theNode.cve = GraphFactory.getCveLevel(theNode);
          if (
            response.data.workload.labels &&
            response.data.workload.labels["io.kubernetes.container.name"] ===
              "POD"
          ) {
            $scope.container.images = [];
          } else {
            $scope.container.images = [response.data.workload.image];
          }
          if (
            $scope.container.children &&
            $scope.container.children.length > 0
          ) {
            $scope.container.images = [];
            $scope.container.children.forEach(function(child) {
              $scope.container.images.push(child.image);
            });
          }
          $scope.hasApps =
            $scope.container.app_ports &&
            Object.entries($scope.container.app_ports).length > 0;
          if ($scope.hasApps) {
            $scope.apps = Object.entries($scope.container.app_ports)
              .map(([k, v]) => {
                return `${k}/${v}`;
              })
              .join(", ");
          }
          $scope.hasInterfaces =
            $scope.container.interfaces &&
            Object.entries($scope.container.interfaces).length > 0;
          $scope.hasLabels =
            $scope.container.labels &&
            Object.entries($scope.container.labels).length > 0;
          let displayState = Utils.getI18Name($scope.container.state);
          let labelCode = colourMap[$scope.container.state];
          $scope.stateHtml = `<span class="label label-fs label-${labelCode}">${$sanitize(
            displayState
          )}</span>`;
          $scope.container.risk = theNode.cve;
          $scope.isScanStarted4Pod = false;
          $scope.active = 0;
        })
        .catch(function(err) {
          console.warn(err);
          clearPopup();
          $scope.container = {};
        });
    };

    $scope.scanPod = function(id) {
      ScanFactory.startScan(SCAN_CONTAINER_URL, id)
        .then(function(res) {
          $scope.isScanStarted4Pod = true;
        })
        .catch(function(err) {
          console.error(err);
        });
    };

    $scope.scanHost = function(id) {
      ScanFactory.startScan(SCAN_HOST_URL, id)
        .then(function() {
          $scope.isScanStarted4Host = true;
        })
        .catch(function(err) {
          console.error(err);
        });
    };

    const showHostInfo = nodeId => {
      const startIndex = nodeId.indexOf("Host:");
      const hostId = nodeId.slice(startIndex + 5);
      if (startIndex > -1) {
        $http
          .get(NODES_URL, { params: { id: hostId } })
          .then(function(response) {
            $scope.host = response.data.host;

            clearPopup();
            let displayMode = Utils.getI18Name($scope.host.policy_mode);
            let labelCode = colourMap[$scope.host.policy_mode];
            $scope.hasInterfaces =
              Object.entries($scope.host.interfaces).length > 0;

            ELEM_HOST_INFO.style.top = TOP_LEFT_FLOAT_TOP;
            ELEM_HOST_INFO.style.left = TOP_LEFT_FLOAT_LEFT;
            $scope.onHost = true;
            $scope.isScanStarted4Host = false;
          })
          .catch(function(err) {
            console.warn(err);
            $scope.host = {};
            clearPopup();
          });
      }
    };

    const quickSearch = graph => {
      clearPopup();
      $scope.$digest();
      setTimeout(() => {
        $scope.onQuickSearch = true;
        $scope.$digest();
      }, 300);
    };

    const showFilter = graph => {
      clearPopup();
      ELEM_FILTER.style.top = TOP_LEFT_FLOAT_TOP;
      ELEM_FILTER.style.left = TOP_LEFT_FLOAT_LEFT;
      $scope.$digest();
      setTimeout(() => {
        $scope.isAdvFilterTextInit = true;
        $scope.onAdvFilter = true;
        $scope.$digest();
      }, 300);
    };

    const showBlacklist = graph => {
      clearPopup();
      ELEM_BLACKLIST.style.top = TOP_LEFT_FLOAT_TOP;
      ELEM_BLACKLIST.style.left = TOP_LEFT_FLOAT_LEFT;
      $scope.$digest();
      setTimeout(() => {
        $scope.onBlacklist = true;
        $scope.$digest();
      }, 300);
    };

    $scope.toggleLegend = () => {
      if (!ELEM_LEGEND.style.top) {
        ELEM_LEGEND.style.top = window.innerHeight - 720 + "px";
        ELEM_LEGEND.style.left = window.innerWidth - 560 + "px";
      }
    };

    const shot = graph => {
      const today = new Date().toLocaleDateString();
      graph.downloadImage(`Graph_${today}`, "image/png", "white");
      setTimeout(() => {
        autoZoom(graph);
      }, 300);
    };

    const showLegend = () => {
      $scope.settings.showLegend = !$scope.settings.showLegend;
      $scope.$digest();
      $scope.toggleLegend();
    };

    const refresh = graph => {
      $scope.refresh();
    };

    $scope.doFocus = name => {
      const highlightNode = node => {
        graph.focusItem(node);
        graph.setItemState(node, "selected", true);
        setTimeout(() => {
          // graph.zoom(1.5);
          graph.setItemState(node, "selected", false);
        }, 4000);
      };

      //Search service by id, like nv.frontend.default
      const serviceNode = graph.findById(name);
      if (serviceNode) {
        highlightNode(serviceNode);
      }

      //Search pod by name/label
      else {
        const maybeNode = serverData.nodes.find(
          node => node.label === name || node.oriLabel === name
        );
        if (!maybeNode) return;

        const node = graph.findById(maybeNode.id);

        if (node) {
          highlightNode(node);
        } else {
          const groupNode = graph.findById(maybeNode.clusterId);
          if (groupNode) {
            expandCluster(groupNode);
            const insider = graph.findById(maybeNode.id);
            highlightNode(insider);
          }
        }
      }
    };

    const codeActionMap = {
      zoomOut: zoomOut,
      zoomIn: zoomIn,
      autoZoom: autoZoom,
      quickSearch: quickSearch,
      filter: showFilter,
      blacklist: showBlacklist,
      shot: shot,
      info: showLegend,
      refresh: refresh
    };

    const toolbar = new G6.ToolBar({
      className: "g6-component-toolbar",
      getContent: () => {
        return `
          <ul class='g6-component-toolbar'>
            <li  code='zoomOut'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                 <path d="M474 152m8 0l60 0q8 0 8 8l0 704q0 8-8 8l-60 0q-8 0-8-8l0-704q0-8 8-8Z" ></path><path d="M168 474m8 0l672 0q8 0 8 8l0 60q0 8-8 8l-672 0q-8 0-8-8l0-60q0-8 8-8Z">
                 </path>
              </svg>
            </li>
            <li code='zoomIn'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"  width="24" height="24">
              <path d="M853.333333 554.666667H170.666667c-23.466667 0-42.666667-19.2-42.666667-42.666667s19.2-42.666667 42.666667-42.666667h682.666666c23.466667 0 42.666667 19.2 42.666667 42.666667s-19.2 42.666667-42.666667 42.666667z">
                </path>
              </svg>
            </li>
            <li code='autoZoom'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M335.104 411.562667a21.333333 21.333333 0 0 1 0 30.208L286.165333 490.666667h161.493334a21.333333 21.333333 0 1 1 0 42.666666H286.165333l48.938667 48.896a21.333333 21.333333 0 0 1-30.208 30.208l-85.333333-85.333333a21.333333 21.333333 0 0 1 0-30.208l85.333333-85.333333a21.333333 21.333333 0 0 1 30.208 0zM737.834667 533.333333l-48.938667 48.896a21.333333 21.333333 0 0 0 30.208 30.208l85.333333-85.333333a21.333333 21.333333 0 0 0 0-30.208l-85.333333-85.333333a21.333333 21.333333 0 0 0-30.208 30.208l48.938667 48.896h-161.493334a21.333333 21.333333 0 1 0 0 42.666666h161.493334z" ></path><path d="M85.333333 288A117.333333 117.333333 0 0 1 202.666667 170.666667h618.666666A117.333333 117.333333 0 0 1 938.666667 288v448A117.333333 117.333333 0 0 1 821.333333 853.333333H202.666667A117.333333 117.333333 0 0 1 85.333333 736V288zM202.666667 234.666667c-29.44 0-53.333333 23.893333-53.333334 53.333333v448c0 29.44 23.893333 53.333333 53.333334 53.333333h618.666666c29.44 0 53.333333-23.893333 53.333334-53.333333V288c0-29.44-23.893333-53.333333-53.333334-53.333333H202.666667z" >
                </path>
              </svg>
            </li>
            <li code='quickSearch'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M416 192C537.6 192 640 294.4 640 416S537.6 640 416 640 192 537.6 192 416 294.4 192 416 192M416 128C256 128 128 256 128 416S256 704 416 704 704 576 704 416 576 128 416 128L416 128z">
                </path>
                <path d="M832 864c-6.4 0-19.2 0-25.6-6.4l-192-192c-12.8-12.8-12.8-32 0-44.8s32-12.8 44.8 0l192 192c12.8 12.8 12.8 32 0 44.8C851.2 864 838.4 864 832 864z">
                </path>
              </svg>
            </li>
            <li code='filter'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M867.392 874.666667a128.042667 128.042667 0 0 1-241.450667 0H106.666667a42.666667 42.666667 0 1 1 0-85.333334h519.274666a128.042667 128.042667 0 0 1 241.450667 0H917.333333a42.666667 42.666667 0 1 1 0 85.333334h-49.941333zM704 832a42.666667 42.666667 0 1 0 85.333333 0 42.666667 42.666667 0 0 0-85.333333 0z m-71.274667-597.333333a128.042667 128.042667 0 0 1-241.450666 0H106.666667a42.666667 42.666667 0 1 1 0-85.333334h284.608A128.042667 128.042667 0 0 1 632.746667 149.333333H917.333333a42.666667 42.666667 0 1 1 0 85.333334H632.725333zM469.333333 192a42.666667 42.666667 0 1 0 85.333334 0 42.666667 42.666667 0 0 0-85.333334 0z m448 362.666667H398.058667A128.042667 128.042667 0 0 1 156.586667 554.666667H106.666667a42.666667 42.666667 0 1 1 0-85.333334h49.941333a128.042667 128.042667 0 0 1 241.450667 0H917.333333a42.666667 42.666667 0 1 1 0 85.333334z m-682.666666-42.666667a42.666667 42.666667 0 1 0 85.333333 0 42.666667 42.666667 0 0 0-85.333333 0z" >
                </path>
              </svg>
            </li>
            <li code="blacklist">
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M956.8 496c-41.6-70.4-99.2-147.2-176-204.8l105.6-105.6c12.8-12.8 12.8-32 0-44.8s-32-12.8-44.8 0l-115.2 115.2C665.6 214.4 592 192 512 192 297.6 192 153.6 358.4 67.2 496c-6.4 9.6-6.4 22.4 0 32 41.6 70.4 102.4 147.2 176 204.8l-108.8 108.8c-12.8 12.8-12.8 32 0 44.8C144 892.8 150.4 896 160 896s16-3.2 22.4-9.6l115.2-115.2c60.8 38.4 134.4 60.8 214.4 60.8 185.6 0 374.4-128 444.8-307.2C960 515.2 960 505.6 956.8 496zM134.4 512c76.8-121.6 201.6-256 377.6-256 60.8 0 118.4 16 166.4 44.8l-80 80C576 361.6 544 352 512 352c-89.6 0-160 70.4-160 160 0 32 9.6 64 25.6 89.6l-89.6 89.6C224 640 172.8 572.8 134.4 512zM608 512c0 54.4-41.6 96-96 96-16 0-28.8-3.2-41.6-9.6l128-128C604.8 483.2 608 496 608 512zM416 512c0-54.4 41.6-96 96-96 16 0 28.8 3.2 41.6 9.6l-128 128C419.2 540.8 416 528 416 512zM512 768c-60.8 0-118.4-16-166.4-44.8l80-80C448 662.4 480 672 512 672c89.6 0 160-70.4 160-160 0-32-9.6-64-25.6-89.6l89.6-89.6c67.2 51.2 118.4 118.4 156.8 179.2C825.6 659.2 665.6 768 512 768z">
                </path>
              </svg>
            </li>
            <li code='shot'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M429.653333 170.666667a42.666667 42.666667 0 0 0-35.498666 18.986666l-59.989334 90.026667A42.666667 42.666667 0 0 1 298.666667 298.666667H170.666667a42.666667 42.666667 0 0 0-42.666667 42.666666v469.333334a42.666667 42.666667 0 0 0 42.666667 42.666666h682.666666a42.666667 42.666667 0 0 0 42.666667-42.666666V341.333333a42.666667 42.666667 0 0 0-42.666667-42.666666h-21.333333a42.666667 42.666667 0 1 1 0-85.333334h21.333333a128 128 0 0 1 128 128v469.333334a128 128 0 0 1-128 128H170.666667a128 128 0 0 1-128-128V341.333333a128 128 0 0 1 128-128h105.173333l47.36-70.997333A128 128 0 0 1 429.653333 85.333333h164.693334a128 128 0 0 1 106.496 57.002667l45.781333 68.693333a42.666667 42.666667 0 1 1-70.997333 47.317334l-45.781334-68.693334A42.666667 42.666667 0 0 0 594.346667 170.666667h-164.693334z" ></path><path d="M512 426.666667a128 128 0 1 0 0 256 128 128 0 0 0 0-256z m-213.333333 128a213.333333 213.333333 0 1 1 426.666666 0 213.333333 213.333333 0 0 1-426.666666 0zM192 405.333333a42.666667 42.666667 0 0 1 42.666667-42.666666H256a42.666667 42.666667 0 0 1 0 85.333333h-21.333333a42.666667 42.666667 0 0 1-42.666667-42.666667z" >
                </path>
              </svg>
            </li>
            <li code="info">
               <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"  width="20" height="24">
                <path d="M334.016 727.04a32 32 0 1 0 0-64 32 32 0 0 0 0 64z m0-183.04a32 32 0 1 0 0-64 32 32 0 0 0 0 64z m0-182.016a32 32 0 1 0 0-64 32 32 0 0 0 0 64z m478.976-279.04H211.008c-37.568 0.064-67.968 30.528-68.032 68.032v722.048c0.064 37.504 30.464 67.968 68.032 67.968h601.984c37.568 0 67.968-30.464 68.032-67.968V150.976c-0.064-37.504-30.464-67.968-68.032-67.968z m-3.968 786.048H214.976V155.008h594.048v713.984zM414.016 296h307.968c5.376 0 8 2.688 8 8v48c0 5.312-2.624 8-8 8H414.08c-5.376 0-8-2.688-8-8v-48c0-5.312 2.624-8 8-8z m0 184h307.968c5.376 0 8 2.688 8 8v48c0 5.312-2.624 8-8 8H414.08c-5.376 0-8-2.688-8-8v-48c0-5.312 2.624-8 8-8z m0 184h307.968c5.376 0 8 2.688 8 8v48c0 5.312-2.624 8-8 8H414.08c-5.376 0-8-2.688-8-8v-48c0-5.312 2.624-8 8-8z">
                </path>
               </svg>
            </li>
            <li code='refresh'>
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="24">
                <path d="M852 678.4c-5.6 0-16.8-5.6-22.4-5.6L696 539.2c-11.2-11.2-11.2-28 0-39.2s28-11.2 39.2 0l116.8 116.8 116.8-116.8c11.2-11.2 28-11.2 39.2 0s11.2 28 0 39.2l-133.6 133.6c-11.2 0.8-16.8 5.6-22.4 5.6zM305.6 539.2c-5.6 0-16.8-5.6-22.4-5.6L172 416.8 55.2 533.6c-11.2 11.2-28 11.2-39.2 0s-11.2-28 0-39.2l133.6-139.2c11.2-11.2 28-11.2 39.2 0l133.6 139.2c11.2 11.2 11.2 28 0 39.2 0 5.6-5.6 5.6-16.8 5.6z m178.4 340c-94.4 0-189.6-39.2-256-105.6C128 673.6 94.4 523.2 144.8 388.8c0-11.2 16.8-22.4 33.6-16.8 11.2 5.6 22.4 22.4 16.8 39.2-39.2 111.2-11.2 239.2 72 323.2 94.4 100 244.8 122.4 367.2 56 11.2-5.6 28 0 39.2 11.2 5.6 11.2 0 28-11.2 39.2-61.6 27.2-116.8 38.4-178.4 38.4z m373.6-222.4h-11.2c-16.8-5.6-22.4-22.4-16.8-33.6 39.2-111.2 11.2-239.2-72-323.2-94.4-94.4-244.8-122.4-367.2-56-11.2 5.6-28 0-39.2-11.2 0-22.4 5.6-39.2 16.8-44.8 139.2-77.6 317.6-50.4 434.4 67.2 100 100 128 250.4 83.2 384-6.4 6.4-16.8 17.6-28 17.6z" >
                </path>
              </svg>
            </li>
          </ul>
        `;
      },
      handleClick: (code, graph) => {
        codeActionMap[code](graph);
      },
      position: { x: 30, y: 30 }
    });

    // const cacheNodePositions = (nodes) => {
    //   const positionMap = {};
    //   const nodeLength = nodes.length;
    //   for (let i = 0; i < nodeLength; i++) {
    //     const node = nodes[i].getModel();
    //     positionMap[node.id] = {
    //       x: node.x,
    //       y: node.y,
    //     };
    //   }
    //   return positionMap;
    // };

    //region Graph and events handlers
    const graph = new G6.Graph({
      container: "mountNode",
      width,
      height,
      plugins: [contextMenu, toolbar],
      groupByTypes: false,
      modes: {
        default: [
          {
            type: "drag-combo",
            onlyChangeComboSize: true
          },
          "drag-node",
          {
            type: "drag-canvas",
            enableOptimize: true,
            onlyChangeComboSize: true
          },
          {
            type: "zoom-canvas",
            enableOptimize: true
          }
        ]
      },

      layout: {
        type: "fruchterman",
        // workerEnabled: true,
        gpuEnabled: useGpu(),
        gravity: 6,
        clusterGravity: 4,
        clustering: true,
        maxIteration: 1000
      },
      animate: false,
      defaultCombo: {
        type: "circle",
        labelCfg: {
          position: "bottom",
          refX: 5,
          refY: 10,
          style: {
            fontSize: 9
            // fill: "#ccc",
          }
        }
      },
      defaultNode: {
        type: "markedNode",
        size: 30,
        style: {
          stroke: "#65B2FF"
        },
        labelCfg: {
          position: "bottom",
          style: {
            fontSize: 8,
            // fill: '#ccc',
            opacity: 0.85
          }
        },
        icon: {
          show: true,
          img: "app/img/icons/graph/container.svg"
        }
      },
      defaultEdge: {
        type: "quadratic",
        labelCfg: {
          autoRotate: true,
          style: {
            fontSize: 8
          }
        }
      },
      nodeStateStyles: {
        selected: {
          lineWidth: 3
        },
        muted: { opacity: 0.2 },
        unMuted: { opacity: 0.3 }
      },
      edgeStateStyles: {
        active: {
          opacity: 1.0
        },
        muted: { opacity: 0.1 },
        unMuted: { opacity: 0.3 }
      }
    });

    const toggleLabel = evt => {
      const { item } = evt;
      const model = item.getModel();
      const currentLabel = model.label;
      if (model.oriLabel !== currentLabel) {
        item.update({
          label: model.oriLabel
        });
        model.oriLabel = currentLabel;
      }
      return item;
    };

    graph.on("node:mouseenter", evt => {
      const item = toggleLabel(evt);
      graph.setItemState(item, "active", true);
      item.toFront();
    });

    graph.on("node:mouseleave", evt => {
      const item = toggleLabel(evt);
      graph.setItemState(item, "active", false);
    });

    const addOrUpdateLink = (sourceId, targetId, edge, result) => {
      let theLink = graph.findById(`${sourceId}${targetId}`);
      if (!theLink) {
        addEdge(sourceId, targetId, edge);
        result.push(`${sourceId}${targetId}`);
      } else {
        let model = theLink.getModel();
        GraphFactory.aggregateLinks(model, edge);
        theLink.update(model);
      }
    };

    const toggleNodeLinks = (item, comboId) => {
      const nodeId = item.getModel().id;
      let nodeLinks = nodeToClusterEdgesMap.get(nodeId);

      const findLinks = (edge, result, linkId, endName) => {
        const endpoint = graph.findById(edge[endName]);
        console.log(endpoint);
        //target is inside combo, just add the link
        if (endpoint && endpoint.isVisible()) {
          graph.addItem("edge", edge);
          result.push(linkId);
        }
        // target is aggregated as group node
        else {
          const targetNode =
            serverData.nodes[
              GraphFactory.getNodeIdIndexMap().get(edge[endName])
            ];
          if (targetNode) {
            const clusterId = targetNode.clusterId;
            if (
              graph.findById(clusterId) &&
              graph.findById(clusterId).isVisible()
            ) {
              if (endName === "target")
                addOrUpdateLink(nodeId, clusterId, edge, result);
              else addOrUpdateLink(clusterId, nodeId, edge, result);
            } else {
              const domainId = targetNode.domain;
              if (
                graph.findById(domainId) &&
                graph.findById(domainId).isVisible()
              ) {
                if (endName === "target")
                  addOrUpdateLink(nodeId, domainId, edge, result);
                else addOrUpdateLink(domainId, nodeId, edge, result);
              }
            }
          }
        }
      };

      if (!nodeLinks) {
        const nodeEdges = serverData.edges
          .filter(
            edge =>
              !(
                edge.fromGroup === item.getModel().clusterId &&
                edge.fromGroup === edge.toGroup
              ) &&
              (edge.source === nodeId || edge.target === nodeId)
          )
          .reduce((result, edge) => {
            let linkId = edge.id;
            GraphFactory.formatEdge(edge);
            if (edge.source === nodeId) {
              findLinks(edge, result, linkId, "target");
            } else if (edge.target === nodeId) {
              findLinks(edge, result, linkId, "source");
            }
            return result;
          }, []);
        console.log(nodeEdges);
        nodeToClusterEdgesMap.set(nodeId, nodeEdges);
        muteComboEdges(comboId);
        lastRevealedNodeIds.push(nodeId);
      } else {
        nodeLinks.forEach(linkId => {
          let link = graph.findById(linkId);
          if (link) {
            graph.removeItem(link, false);
          }
        });
        unmMuteComboEdges(comboId);
        lastRevealedNodeIds = [];
        nodeToClusterEdgesMap.delete(nodeId);
      }

      item.toFront();
    };

    const muteComboEdges = comboId => {
      const combo = graph.findById(comboId);
      if (combo) {
        let edges = combo.getEdges();
        edges.forEach(edge => {
          graph.setItemState(edge, "unMuted", false);
          graph.setItemState(edge, "muted", true);
        });
      }
    };

    const unmMuteComboEdges = comboId => {
      const combo = graph.findById(comboId);
      if (combo) {
        let edges = combo.getEdges();
        edges.forEach(edge => {
          graph.setItemState(edge.getModel().id, "muted", false);
          graph.setItemState(edge.getModel().id, "unMuted", true);
          // const edgeMode = edge.getModel();
          // edgeMode.style.opcity = 0.6;
          // edge.update(edgeMode);
        });
      }
    };

    const showNodeInfo = (node, item) => {
      if (node.kind === "group") {
        showGroupInfo(item);
      } else if (node.group.startsWith("host")) showHostInfo(node.id);
      else if (
        node.group.startsWith("container") ||
        node.group.startsWith("mesh")
      ) {
        showGroupInfo(item, node);
      } else if (node.kind === "domain") {
        showDomainInfo(item);
      } else {
        clearPopup();
        $scope.$apply();
      }
    };

    const hideNode = item => {
      const node = item.getModel();
      if (node.kind === "group") {
        graph.hideItem(item);
        $scope.blacklist.groups.push({ name: node.id });
      } else if (node.kind === "domain") {
        graph.hideItem(item);
        $scope.blacklist.domains.push({ name: node.id });
        if (collapsedDomains.has(node.id)) collapsedDomains.delete(node.id);
      } else {
        graph.hideItem(item);
        $scope.blacklist.endpoints.push({
          name: getNodeName(node),
          id: node.id
        });
      }

      $scope.$apply();
      saveBlacklist();
      // graph.layout();
    };

    const hideInComing = item => {
      const edges = item.getInEdges();
      edges.forEach(edge => {
        edge.hide();
        hiddenItemIds.push(edge.getModel().id);
      });
      inComingNodes.push(item.getModel().id);
    };

    const showInComing = item => {
      const edges = item.getInEdges();
      edges.forEach(edge => {
        edge.show();
        hiddenItemIds = hiddenItemIds.filter(
          edgeId => edgeId !== edge.getModel().id
        );
      });
      inComingNodes = inComingNodes.filter(
        nodeId => nodeId !== item.getModel().id
      );
    };

    const hideOutGoing = item => {
      const edges = item.getOutEdges();
      edges.forEach(edge => {
        edge.hide();
        hiddenItemIds.push(edge.getModel().id);
      });
      outGoingNodes.push(item.getModel().id);
    };

    const showOutGoing = item => {
      const edges = item.getOutEdges();
      edges.forEach(edge => {
        edge.show();
        hiddenItemIds = hiddenItemIds.filter(
          edgeId => edgeId !== edge.getModel().id
        );
      });
      outGoingNodes = outGoingNodes.filter(
        nodeId => nodeId !== item.getModel().id
      );
    };

    const isGroupEdge = edge =>
      edge.getSource().getModel().kind === "group" ||
      edge.getSource().getType() === "combo" ||
      edge.getTarget().getModel().kind === "group" ||
      edge.getTarget().getType() === "combo";

    const showEdgeDetail = edgeItem => {
      $scope.selectedEdge = edgeItem;
      let edge = edgeItem.getModel();
      if (edge.kind === "group" || isGroupEdge(edgeItem)) {
        GraphFactory.keepLive();
        return;
      }

      let from = edge.source,
        to = edge.target;
      $http
        .get(CONVERSATION_HISTORY_URL, {
          params: {
            from: encodeURIComponent(from),
            to: encodeURIComponent(to)
          }
        })
        .then(response => {
          // $scope.stopRefreshSession();
          /** @namespace response.data.conversation */
          $scope.conversationDetail = response.data.conversation;
          clearPopup();
          ELEM_CONV_HISTORY.style.top = TOP_LEFT_FLOAT_TOP;
          ELEM_CONV_HISTORY.style.left = TOP_LEFT_FLOAT_LEFT;
          $scope.onEdge = true;
          $scope.onThreat = false;
          $scope.onViolation = false;
          $scope.showRuleId = false;
          $scope.ruleId = "-";
          $scope.entries = $scope.conversationDetail.entries;
          /** @namespace $scope.conversationDetail.sessions */
          $scope.sessionCount = $scope.conversationDetail.sessions;
          if ($scope.entries.length < 5) {
            if ($scope.entries.length < 2)
              $scope.entriesGridHeight = 40 + 25 * 2;
            else $scope.entriesGridHeight = 40 + 25 * $scope.entries.length;
          } else $scope.entriesGridHeight = 40 + 25 * 5;
          $timeout(() => {
            $scope.entriesGridHeight = Math.max($scope.entriesGridHeight, ELEM_CONV_HISTORY.clientHeight - 130);
            $scope.convHisGridOptions.api.resetRowHeights();
            let ipList = $scope.entries.flatMap(entry => {
              let ips = [];
              if (entry.client_ip) {
                ips.push(entry.client_ip);
              }
              if (entry.server_ip) {
                ips.push(entry.server_ip);
              }
              return ips;
            });
            $http.patch(IP_GEO_URL, ipList).then(response => {
              let ipMap = response.data.ip_map;
              $scope.entries = $scope.entries.map(entry => {
                if (entry.client_ip) {
                  entry.client_ip_location = ipMap[entry.client_ip];
                }
                if (entry.server_ip) {
                  entry.server_ip_location = ipMap[entry.server_ip];
                }
                return entry;
              });
              $scope.convHisGridOptions.api.setRowData($scope.entries);
            });
          }, 100);
        })
        .catch(err => {
          $scope.onEdge = false;
          console.warn(err);
        });
    };

    graph.on("node:click", evt => {
      const { item } = evt;
      // graph.setItemState(item, "selected", true);

      //Show CVE count
      let node = evt.item;
      let nodeMode = node.get("model");
      let shape = evt.target;
      if (shape.get("name") === "tag-circle") {
        showCve(
          "High: " + nodeMode.cve.high + " Medium: " + nodeMode.cve.medium,
          {
            x: evt.canvasX,
            y: evt.canvasY
          }
        );
      } else {
        hideCve();
      }

      //Reveal links for the selected node
      if (nodeMode.comboId) {
        if (nodeMode.meshId) return;
        if (
          lastRevealedNodeIds.length &&
          lastRevealedNodeIds[0] !== nodeMode.id
        ) {
          let lastItem = graph.findById(lastRevealedNodeIds[0]);
          if (lastItem) {
            toggleNodeLinks(lastItem, lastItem.getModel().comboId);
          }
        }
        toggleNodeLinks(item, nodeMode.comboId);
      }
      GraphFactory.keepLive();
    });

    const addMissingEdge = (sourceId, targetId, edge) => {
      const newEdge = {
        id: `${sourceId}${targetId}`,
        source: sourceId,
        target: targetId,
        style: edge.getModel().style
        // label: edge.label,
      };
      if (edge.getModel().style.stroke !== EDGE_STATUS_MAP["OK"])
        newEdge.stateStyles = {
          active: {
            stroke: EDGE_STATUS_MAP[edge.getModel().status],
            opacity: 1.0
          }
        };
      if (!graph.findById(`${sourceId}${targetId}`))
        graph.addItem("edge", newEdge);
    };

    const addEdge = (sourceId, targetId, edge) => {
      const newEdge = Object.assign({}, edge);
      newEdge.id = `${sourceId}${targetId}`;
      newEdge.source = sourceId;
      newEdge.target = targetId;
      newEdge.members = [edge.id];
      newEdge.status = edge.status;
      newEdge.style = GraphFactory.getEdgeStyle(
        edge,
        EDGE_STATUS_MAP[edge.status]
      );
      newEdge.label = "";
      newEdge.oriLabel = "";
      newEdge.weight = 1;
      if (edge.style.stroke !== EDGE_STATUS_MAP["OK"])
        newEdge.stateStyles = {
          active: {
            stroke: EDGE_STATUS_MAP[edge.status],
            opacity: 1.0
          }
        };
      graph.addItem("edge", newEdge);
    };

    const toggleLine = edge => {
      if (!edge.getSource().isVisible()) {
        if (edge.getSource().getType() === "combo") {
          addMissingEdge(
            `${edge
              .getSource()
              .getModel()
              .id.substring(2)}`,
            `${edge.getTarget().getModel().id}`,
            edge
          );
        } else {
          addMissingEdge(
            `co${edge.getSource().getModel().id}`,
            `${edge.getTarget().getModel().id}`,
            edge
          );
        }
      }
      if (!edge.getTarget().isVisible()) {
        if (edge.getTarget().getType() === "combo") {
          addMissingEdge(
            `${edge.getSource().getModel().id}`,
            `${edge
              .getTarget()
              .getModel()
              .id.substring(2)}`,
            edge
          );
        } else {
          addMissingEdge(
            `${edge.getSource().getModel().id}`,
            `co${edge.getTarget().getModel().id}`,
            edge
          );
        }
      }
    };

    const revealLinks = item => {
      if (lastRevealedNodeIds.length === 0) return;
      const nodeId = lastRevealedNodeIds[0];
      const node = graph.findById(nodeId);
      const edges = node && node.getEdges();
      if (edges && edges.length > 0) {
        const mergedEdges = edges.filter(
          edge =>
            edge.getSource().getModel().id === item.getModel().id ||
            edge.getTarget().getModel().id === item.getModel().id
        );
        if (mergedEdges && mergedEdges.length > 0) {
          mergedEdges.forEach(edge => {
            const members = edge.getModel().members;
            if (members && members.length > 0) {
              members.forEach(member => {
                const memberEdge =
                  serverData.edges[
                    GraphFactory.getEdgeIdIndexMap().get(member)
                  ];
                const edge = Object.assign({}, memberEdge);
                GraphFactory.formatEdge(edge);

                if (edge.style.stroke !== EDGE_STATUS_MAP["OK"])
                  edge.stateStyles = {
                    active: {
                      stroke: EDGE_STATUS_MAP[edge.status],
                      opacity: 1.0
                    }
                  };

                if (edge) {
                  graph.addItem("edge", edge);
                }
              });
            }
            graph.removeItem(edge, false);
          });
        }
      }
    };

    const aggregateStatus = links => {
      if (!links || links.length === 0) return "OK";
      const status = new Set(links.map(edge => edge.getModel().status));
      if (!status || status.size === 0) return "OK";
      else {
        return [...status].reduce((acc, val) => {
          acc =
            EDGE_STATUS_LEVEL_MAP[val] > EDGE_STATUS_LEVEL_MAP[acc] ? val : acc;
          return acc;
        }, "OK");
      }
    };

    const mergeLinks = (newEdge, links) => {
      newEdge.members = links.map(edge => edge.getModel().id);
      newEdge.status = aggregateStatus(links);
      newEdge.style = GraphFactory.getEdgeStyle(
        newEdge,
        EDGE_STATUS_MAP[newEdge.status]
      );
      newEdge.label = "";
      newEdge.oriLabel = Array.from(newEdge.status).join(", ");
      graph.addItem("edge", newEdge);
      links.forEach(edge => {
        graph.removeItem(edge, false);
      });
    };

    const mergeRevealedLinks = item => {
      if (lastRevealedNodeIds.length === 0) return;
      const nodeId = lastRevealedNodeIds[0];
      const revealedNode = graph.findById(nodeId);
      if (
        !revealedNode ||
        revealedNode.getModel().comboId === item.getModel().id
      )
        return;
      const edges = revealedNode.getEdges();
      if (edges && edges.length > 0) {
        const revealedEdges = edges.filter(
          edge =>
            edge.getSource().getModel().comboId === item.getModel().id ||
            edge.getTarget().getModel().comboId === item.getModel().id
        );
        let sources = [],
          targets = [];
        revealedEdges.forEach(edge => {
          if (edge.getSource().getModel().comboId === item.getModel().id) {
            sources.push(edge);
          } else if (
            edge.getTarget().getModel().comboId === item.getModel().id
          ) {
            targets.push(edge);
          }
        });
        console.log(sources);
        console.log(targets);
        if (sources.length > 0) {
          let newEdge = {};
          newEdge.id = item.getModel().id.substring(2) + nodeId;
          newEdge.source = item.getModel().id.substring(2);
          newEdge.target = nodeId;
          newEdge.weight = sources.length;
          mergeLinks(newEdge, sources);
        }
        if (targets.length > 0) {
          let newEdge = {};
          newEdge.id = nodeId + item.getModel().id.substring(2);
          newEdge.source = nodeId;
          newEdge.target = item.getModel().id.substring(2);
          newEdge.weight = targets.length;
          mergeLinks(newEdge, targets);
        }
      }
    };

    const expand = item => {
      const model = item.getModel();
      if (model.kind === "domain") expandDomain(item);
      else if (model.kind === "group") expandCluster(item);
      // else if (model.kind === "mesh") expandMesh(item);
    };

    const doSubLayout = (clusterNode, clusterNodes) => {
      // noinspection JSPotentiallyInvalidConstructorUsage
      const subLayout = new G6.Layout.concentric({
        center: [clusterNode.x, clusterNode.y],
        preventOverlap: true,
        nodeSize: 15,
        minNodeSpacing: 15,
        maxLevelDiff: 10,
        sortBy: "index",
        tick: () => {
          graph.refreshPositions();
        }
      });
      subLayout.init({
        nodes: clusterNodes,
        edges: []
      });
      subLayout.execute();

      //Lock all the combo members inside combo
      clusterNodes.forEach(item => {
        const node = graph.findById(item.id);
        node.lock();
      });
    };

    const RISKY_STATUSES = [
      "Info",
      "Low",
      "Medium",
      "High",
      "Critical",
      "violate",
      "deny"
    ];

    const getRiskyNodes = clusterId => {
      const riskySourceLinks = serverData.edges.filter(
        edge =>
          edge.fromGroup === clusterId && RISKY_STATUSES.includes(edge.status)
      );
      const riskyTargetLinks = serverData.edges.filter(
        edge =>
          clusterId === edge.toGroup && RISKY_STATUSES.includes(edge.status)
      );
      const sources = riskySourceLinks.map(link => link.source);
      const targets = riskyTargetLinks.map(link => link.target);
      return [...new Set([...sources, ...targets])];
    };

    const expandCluster = item => {
      const clusterNode = item.getModel();

      // const edges = data.edges;
      let clusterNodes = [];
      let clusterEdges = [];

      let selectedMode = clusterNode.policyMode || "discover";

      const riskyNodes = getRiskyNodes(clusterNode.id);

      //add the cluster members
      let cluster = GraphFactory.getClusterMap().get(clusterNode.id);
      if (cluster.comboCreated) {
        //show combo
        const comboNode = graph.findById(`co${clusterNode.id}`);
        const comboEdges = comboNode.getEdges();
        console.log("show comboEdges");
        console.log(comboEdges);
        graph.showItem(comboNode);

        let hiddenEdges = comboEdges.filter(item => !item.isVisible());

        if (hiddenEdges && hiddenEdges.length > 0) {
          console.log("from -> to");
          console.log(hiddenEdges[0].getSource().isVisible());
          console.log(hiddenEdges[0].getTarget().isVisible());
          hiddenEdges.forEach(item => toggleLine(item));
        }
        graph.paint();
        comboNode.toFront();
        const children = comboNode.getNodes();
        children.forEach(child => child.toFront());
      } else {
        const members = cluster.members;
        if (members && members.length > 0) {
          clusterNodes = members.map(member => {
            const memberNode =
              serverData.nodes[GraphFactory.getNodeIdIndexMap().get(member)];
            memberNode.comboId = `co${clusterNode.id}`;
            const theNode = Object.assign({}, memberNode);
            theNode.cve = GraphFactory.getCveLevel(theNode);
            GraphFactory.formatNode(theNode);
            theNode.label = "";
            return theNode;
          });
        }
        console.log(clusterNodes);

        clusterEdges = serverData.edges.filter(
          edge =>
            edge.fromGroup === edge.toGroup && edge.fromGroup === clusterNode.id
        );

        clusterNodes.forEach((item, i) => {
          item.index = i + 1;
          item.size = item.service_mesh ? 40 : 20;
          item.icon.width = item.service_mesh ? 30 : 13;
          item.icon.height = item.service_mesh ? 30 : 13;

          let nodeType = "";
          if (item.group && item.group.startsWith("container")) {
            nodeType = "container";
          }
          if (item.group && item.group.startsWith("mesh")) {
            nodeType = "mesh";
          }
          if (item.group && item.group.startsWith("host")) {
            nodeType = "host";
          }
          if (item.kind && item.kind === "group") {
            nodeType = "group";
          }

          if (nodeType === "container" || nodeType === "mesh") {
            item.icon.img =
              nodeType === "container"
                ? `app/img/icons/graph/${
                    CONTAINER_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`
                : `app/img/icons/graph/${
                    SERVICEMESH_TO_ICON[selectedMode.toLowerCase()]
                  }.svg`;
            item.style.stroke = GraphFactory.strokeColor[selectedMode];
            item.style.fill = GraphFactory.fillColor[selectedMode];
          }

          if (nodeType === "host") {
            item.icon.img = `app/img/icons/graph/${
              HOST_TO_ICON[selectedMode.toLowerCase()]
            }.svg`;
            item.style.stroke = GraphFactory.strokeColor[selectedMode];
            item.style.fill = GraphFactory.fillColor[selectedMode];
          }

          if (riskyNodes && riskyNodes.length > 0) {
            if (riskyNodes.includes(item.id)) {
              item.style.stroke = "#ff9800";
              item.style.fill = "#d9b886";
            }
          }
          graph.addItem("node", item, false);
        });

        clusterEdges.forEach(edge => {
          GraphFactory.formatEdge(edge);
          if (edge.source === edge.target) {
            edge.type = "loop";
            edge.loopCfg = {
              dist: 20
            };
            const loopNode =
              serverData.nodes[
                GraphFactory.getNodeIdIndexMap().get(edge.source)
              ];
            if (loopNode && loopNode.service_mesh) {
              edge.style.stroke = "#9FB8AD";
              edge.style.opacity = 0.8;
            }
          }
          edge.style.endArrow = {
            path: G6.Arrow.triangle(2, 3)
          };
          graph.addItem("edge", edge, false);
        });

        doSubLayout(clusterNode, clusterNodes);

        graph.createCombo(
          {
            id: `co${clusterNode.id}`,
            oriLabel: clusterNode.label,
            label: clusterNode.oriLabel,
            domain: clusterNode.domain,
            padding: 5
          },
          members
        );
        const theCombo = graph.findById(`co${clusterNode.id}`);
        theCombo.toFront();
        members.forEach(member => {
          const theMember = graph.findById(member);
          theMember.toFront();
        });

        let oldEdges = item.getEdges();

        oldEdges.forEach(edge => {
          if (
            edge.getSource().getModel().id === clusterNode.id &&
            edge.getTarget().getModel().id === clusterNode.id
          )
            return;
          if (edge.getSource().getModel().id === clusterNode.id) {
            if (edge.getTarget().isVisible()) {
              addMissingEdge(
                `co${clusterNode.id}`,
                edge.getTarget().getModel().id,
                edge
              );
            }
          }
          if (edge.getTarget().getModel().id === clusterNode.id) {
            if (edge.getSource().isVisible()) {
              addMissingEdge(
                edge.getSource().getModel().id,
                `co${clusterNode.id}`,
                edge
              );
            }
          }
        });
      }
      graph.hideItem(clusterNode.id);

      revealLinks(item);

      console.log(getRiskyNodes(clusterNode.id));

      graph.refreshPositions();
      graph.refresh();
      graph.paint();
    };

    const collapseCluster = item => {
      const clusterNode = graph.findById(item.getModel().id.substring(2));
      if (clusterNode.getModel().quarantines) {
        graph.updateItem(clusterNode, {
          style: {
            fill: "#ffcccb"
          }
        });
      } else {
        graph.updateItem(clusterNode, {
          style: {
            fill:
              GraphFactory.fillColor[clusterNode.getModel().policyMode] ||
              "#EFF4FF"
          }
        });
      }
      const clusterEdges = clusterNode.getEdges();

      graph.showItem(clusterNode);

      let hiddenEdges = clusterEdges.filter(item => !item.isVisible());
      if (hiddenEdges && hiddenEdges.length > 0) {
        hiddenEdges.forEach(item => toggleLine(item));
      }

      mergeRevealedLinks(item);

      graph.removeItem(item, false);
      graph.paint();
    };

    const collapseOnNode = (domainName, domainNode) => {
      const domainData = GraphFactory.collapseDomain(
        data,
        domainName,
        collapsedDomains
      );
      if (domainData.nodes && domainData.nodes.length > 0) {
        let childrenInfo = [];
        domainData.nodes.forEach(node => {
          const item = graph.findById(node.id);
          let model = item.getModel();
          if (model) childrenInfo.push(model);
          if (item) {
            if (item.isVisible()) graph.hideItem(item, false);
            else {
              const combo = graph.findById(`co${node.id}`);
              combo && graph.removeItem(combo, false);
            }
          }
        });
        Object.assign(domainNode, { children: childrenInfo });
      }
      graph.addItem("node", domainNode, false);
      if (domainData.edges && domainData.edges.length > 0)
        domainData.edges.forEach(edge => graph.addItem("edge", edge, false));
    };

    const collapseDomain = item => {
      const domainModel = item.getModel();
      if (!domainModel.domain) return;

      const domainNode = GraphFactory.nodeToDomain(domainModel);
      if (domainModel.x) {
        domainNode.x = domainModel.x + 30;
        domainNode.y = domainModel.y + 30;
      }

      collapseOnNode(domainModel.domain, domainNode);

      collapsedDomains.set(domainModel.domain, domainNode);
    };

    const expandDomain = item => {
      const domainModel = item.getModel();
      if (!domainModel.domain) return;

      graph.removeItem(item);
      data.nodes.forEach(node => {
        if (node.domain === domainModel.domain) {
          const item = graph.findById(node.id);
          item && graph.showItem(item, false);
        }
      });
      if (collapsedDomains.has(domainModel.domain))
        collapsedDomains.delete(domainModel.domain);
    };

    const getMeshLinks = (meshNode, sidecar, inCombo = false) => {
      const selfLink = graph.findById(`${meshNode.id}${meshNode.id}`);
      graph.hideItem(selfLink, false);

      const links = serverData.edges.filter(
        edge => edge.source === sidecar.id || edge.target === sidecar.id
      );

      if (links && links.length > 0) {
        links.forEach(
          link => ([link.source, link.target] = [link.target, link.source])
        );
      }

      if (links && links.length > 0) {
        links.forEach(link => {
          GraphFactory.formatEdge(link);
          if (inCombo)
            link.style.endArrow = {
              path: G6.Arrow.triangle(2, 3)
            };
        });
      }
      return links;
    };

    const refreshDraggedNodePosition = e => {
      const model = e.item.get("model");
      model.fx = e.x;
      model.fy = e.y;
    };

    graph.on("node:dragstart", e => {
      // graph.layout();
      refreshDraggedNodePosition(e);
    });
    graph.on("node:drag", e => {
      refreshDraggedNodePosition(e);
    });

    graph.on("node:dblclick", evt => {
      const { item } = evt;
      console.log(item.getModel());
      hideCve();
      if (item.getModel().kind === "group") expandCluster(item);
      else if (item.getModel().kind === "domain") expandDomain(item);
      GraphFactory.keepLive();
    });

    graph.on("combo:mouseenter", evt => {
      const item = toggleLabel(evt);
      graph.setItemState(item, "active", true);
    });

    graph.on("combo:mouseleave", evt => {
      const item = toggleLabel(evt);
      graph.setItemState(item, "active", false);
    });

    graph.on("edge:mouseenter", evt => {
      const item = toggleLabel(evt);
      graph.setItemState(item, "active", true);
    });

    graph.on("edge:mouseleave", evt => {
      const item = toggleLabel(evt);
      graph.setItemState(item, "active", false);
    });

    graph.on("edge:click", e => {
      const { item } = e;

      graph.setItemState(item, "active", true);

      const model = item.getModel();
      showEdgeDetail(item);
    });

    graph.on("combo:dblclick", e => {
      const { item } = e;
      collapseCluster(e.item);
      graph.refreshPositions();
    });

    graph.on("canvas:click", evt => {
      hideCve();
      clearPopup();
      $scope.$apply();
    });

    graph.on("canvas:dblclick", evt => {
      autoZoom(graph);
    });

    graph.on("afterlayout", () => {
      setTimeout(() => {
        graph.refreshPositions();
        graph.fitView();
      }, 500);
      console.profileEnd();
    });
    //endregion

    $win.on("resize", () => {
      if (!graph || graph.get("destroyed")) return;
      if (!container || !container.scrollWidth || !container.scrollHeight)
        return;
      graph.changeSize(container.scrollWidth, container.scrollHeight);
      graph.fitView();
    });

    const inHiddenDomain = node => {
      if ($scope.blacklist.domains.length > 0) {
        return $scope.blacklist.domains.some(
          domain => domain.name === node.domain
        );
      } else return false;
    };

    const inHiddenGroup = node => {
      if ($scope.blacklist.groups.length > 0) {
        return $scope.blacklist.groups.some(
          group => group.name === node.clusterId
        );
      } else return false;
    };

    const isHiddenEndpoint = node => {
      if ($scope.blacklist.endpoints.length > 0) {
        return $scope.blacklist.endpoints.some(
          endpoint =>
            endpoint.name === node.label || endpoint.name === node.oriLabel
        );
      } else return false;
    };

    const unmanagedEndpoints = ["node_ip", "workload_ip"];

    const filterHiddenNodes = data => {
      return data.nodes.filter(
        node =>
          !inHiddenDomain(node) &&
          !inHiddenGroup(node) &&
          !isHiddenEndpoint(node) &&
          !($scope.blacklist.hideUnmanaged && unmanagedEndpoints.includes(node.group))
      );
    };

    const edgeWithHiddenDomain = edge => {
      if ($scope.blacklist.domains.length > 0) {
        return $scope.blacklist.domains.some(
          domain =>
            domain.name === edge.fromDomain || domain.name === edge.toDomain
        );
      } else return false;
    };

    const edgeWithHiddenGroup = edge => {
      if ($scope.blacklist.groups.length > 0) {
        return $scope.blacklist.groups.some(
          group => group.name === edge.fromGroup || group.name === edge.toGroup
        );
      } else return false;
    };

    const edgeWithHiddenEndpoint = edge => {
      if ($scope.blacklist.endpoints.length > 0) {
        return $scope.blacklist.endpoints.some(
          endpoint => endpoint.id === edge.source || endpoint.id === edge.target
        );
      } else return false;
    };

    const unmanagedDomains = ["nvUnmanagedWorkload", "nvUnmanagedNode"];
    const edgeWithUnmanagedEndpoint = edge => {
      if ($scope.blacklist.hideUnmanaged) {
        return unmanagedDomains.includes(edge.fromDomain) || unmanagedDomains.includes(edge.toDomain);
      } else return false;
    };

    const filterHiddenEdges = data => {
      return data.edges.filter(
        edge =>
          !edgeWithHiddenDomain(edge) &&
          !edgeWithHiddenGroup(edge) &&
          !edgeWithHiddenEndpoint(edge) &&
          !edgeWithUnmanagedEndpoint(edge)
      );
    };

    const getNetworkData = (onRefresh = true, callback) =>
      $http
        .get(NETWORK_INFO_URL, { params: { user: user } })
        .then(response => {``
          console.profile("copying data");

          if(!$scope.blacklist){
            $scope.blacklist = response.data.blacklist;
            if (!$scope.blacklist) {
              $scope.blacklist = GraphFactory.getBlacklist();
            } else {
              GraphFactory.setBlacklist($scope.blacklist);
            }
          }

          $window.localStorage.setItem(
            `${user}-blacklist`,
            JSON.stringify($scope.blacklist)
          );
          response.data.nodes = filterHiddenNodes(response.data);
          response.data.edges = filterHiddenEdges(response.data);
          serverData = JSON.parse(JSON.stringify(response.data));
          console.profileEnd();
          console.profile("processing nodes");
          data.nodes = GraphFactory.processNodes(
            response.data.nodes,
            response.data,
            true,
            $scope.settings
          );
          // data.nodes.forEach((node) => {
          //   const cachePosition = cachePositions
          //     ? cachePositions[node.id]
          //     : undefined;
          //   if (cachePosition) {
          //     node.x = cachePosition.x;
          //     node.y = cachePosition.y;
          //   }
          // });
          console.profileEnd();
          console.profile("processing edges");
          data.edges = GraphFactory.processEdges(
            serverData,
            response.data.edges,
            true,
            $scope.settings
          );
          console.profileEnd();

          if (onRefresh) {
            console.profile("Rendering graph");
            graph.data(data);
            graph.render();

            angular.element($win).bind("resize", function() {
              if (!graph || graph.destroyed) return;
              if (
                !container ||
                !container.scrollWidth ||
                !container.scrollHeight
              )
                return;
              graph.changeSize(
                $window.innerWidth - SIDE_BAR - PADDING,
                $window.innerHeight - TOP_BAR - PADDING
              );
            });
          } else graph.changeData(data);

          if (angular.isFunction(callback)) callback();
        })
        .catch(err => {
          console.warn(err);
        });

    if (GraphFactory.advFilterApplied()) {
      const callback = () => {
        updateGraph(false);
      };
      getNetworkData(true, callback);
    } else getNetworkData();

    $scope.loadDomainTags = query => {
      let list = GraphFactory.getDomains().map(domain => domain.name);
      return query ? list.filter(Utils.createFilter(query)) : [];
    };

    const getServiceName = nvName => {
      const items = nvName.split(".");
      if (items && items.length > 2 && items[0] === "nv")
        return items.slice(1, -1).join(".");
      return nvName;
    };

    $scope.loadGroupTags = query => {
      let list = GraphFactory.getGroups().map(group => {
        return { name: group.name, displayName: getServiceName(group.name) };
      });
      return query
        ? list.filter(
            item => item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
          )
        : [];
    };

    $scope.loadEndpoints = query => {
      let list = serverData.nodes.map(node => {
        return { name: node.label, id: node.id };
      });

      return query
        ? list.filter(
            item => item.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
          )
        : [];
    };

    const insert = (name, index, string) => {
      let ind = index < 0 ? name.length + index : index;
      return name.substring(0, ind) + string + name.substr(ind);
    };

    const updateGraph = onRefresh => {
      const filteredData = GraphFactory.applyAdvFilter(
        serverData,
        $scope.advFilter
      );

      data.nodes = GraphFactory.processNodes(
        [...filteredData.nodes, ...filteredData.firstLevelNodes],
        serverData,
        onRefresh,
        $scope.settings
      );

      data.edges = GraphFactory.processEdges(
        serverData,
        filteredData.edges,
        onRefresh,
        $scope.settings
      );

      // data.nodes.forEach((node) => {
      //   const cachePosition = cachePositions
      //     ? cachePositions[node.id]
      //     : undefined;
      //   if (cachePosition) {
      //     node.x = cachePosition.x;
      //     node.y = cachePosition.y;
      //   }
      // });

      graph.changeData(data);

      const filteredDomains = new Set(
        filteredData.nodes.map(node => node.domain)
      );

      const firstLevelDomains = new Set();

      if (filteredData.firstLevelNodes.length > 0) {
        filteredData.firstLevelNodes.forEach(node => {
          firstLevelDomains.add(node.domain);
          const levelNode = graph.findById(node.id);

          if (levelNode) {
            const imgName = levelNode.getModel().icon.img;

            graph.setItemState(levelNode, "muted", true);
            graph.updateItem(levelNode, {
              icon: {
                img: insert(imgName, -4, "_")
              }
            });
          } else {
            const clusterNode = graph.findById(node.clusterId);
            if (clusterNode) {
              const imgName = clusterNode.getModel().icon.img;

              if (imgName.endsWith("_.svg")) return;
              console.log(clusterNode.getModel().id);
              console.log(imgName);
              // graph.setItemState(clusterNode, "muted", true);
              graph.updateItem(clusterNode, {
                style: {
                  opacity: 0.2
                },
                icon: {
                  img: insert(imgName, -4, "_")
                }
              });
            }
          }
        });
      }

      return {
        filteredDomains: filteredDomains,
        firstLevelDomains: firstLevelDomains
      };
    };

    const saveSettings = () => {
      if ($scope.settings.persistent) {
        $window.localStorage.setItem(
          `${user}-showSysApp`,
          JSON.stringify($scope.settings.showSysApp)
        );

        $window.localStorage.setItem(
          `${user}-showSysNode`,
          JSON.stringify($scope.settings.showSysNode)
        );

        $window.localStorage.setItem(
          `${user}-persistent`,
          JSON.stringify($scope.settings.persistent)
        );

        $window.localStorage.setItem(
          `${user}-advFilter`,
          JSON.stringify($scope.advFilter)
        );
      }
    };

    const clearSettings = () => {
      $window.localStorage.removeItem(`${user}-showSysApp`);

      $window.localStorage.removeItem(`${user}-showSysNode`);

      $window.localStorage.removeItem(`${user}-persistent`);

      $window.localStorage.removeItem(`${user}-advFilter`);
    };

    const saveBlacklist = () => {
      $window.localStorage.setItem(
        `${user}-blacklist`,
        JSON.stringify($scope.blacklist)
      );
      $http
        .post(NETWORK_BLACKLIST_URL, {
          user: user,
          blacklist: $scope.blacklist
        })
        .then(response => {})
        .catch(err => {
          console.warn(err);
        });
    };
    const handleCollapsedDomains = () => {
      const { filteredDomains, firstLevelDomains } = updateGraph(false);
      if (collapsedDomains.size)
        [...collapsedDomains.values()].forEach(domainNode => {
          if (firstLevelDomains.has(domainNode.id)) {
            collapseOnNode(domainNode.id, domainNode);
            const domainItem = graph.findById(domainNode.id);
            if (domainItem) {
              graph.setItemState(domainItem, "muted", true);
            }
          }
          if (filteredDomains.has(domainNode.id))
            collapseOnNode(domainNode.id, domainNode);
        });
    };

    $scope.applyAdvFilter = () => {
      GraphFactory.setAdvFilter($scope.advFilter);
      if ($scope.settings.persistent) saveSettings();
      else clearSettings();
      setTimeout(() => {
        $scope.onAdvFilter = false;
        $scope.$digest();
      }, 50);

      if (
        $scope.settings.gpuEnabled !== null &&
        $scope.settings.gpuEnabled !== $scope.gpuEnabled
      ) {
        $window.localStorage.setItem(
          "_gpuEnabled",
          JSON.stringify($scope.settings.gpuEnabled)
        );
        $scope.gpuEnabled = $scope.settings.gpuEnabled;
        graph.updateLayout({
          gpuEnabled: $scope.gpuEnabled
        });
      }

      if (GraphFactory.advFilterApplied()) {
        handleCollapsedDomains();
      } else $scope.refresh();
    };

    $scope.resetAdvFilter = () => {
      GraphFactory.initAdvFilter();
      $scope.advFilter = GraphFactory.getAdvFilter();
      $scope.settings = {
        showSysNode: false,
        showSysApp: false,
        showLegend: false,
        hiddenDomains: [],
        hiddenGroups: [],
        persistent: false
      };
      clearSettings();
      $scope.refresh();
      clearPopup();
      $scope.isAdvFilterTextInit = false;
    };

    $scope.applyBlacklist = () => {
      GraphFactory.setBlacklist($scope.blacklist);
      saveBlacklist();

      setTimeout(() => {
        $scope.onBlacklist = false;
        $scope.$digest();
      }, 50);
      $scope.refresh();
    };

    $scope.resetBlacklist = () => {
      GraphFactory.initBlacklist();
      $scope.blacklist = GraphFactory.getBlacklist();
      saveBlacklist();
      $scope.refresh();
    };

    $scope.tagAdding = (tag, type) => {
      let autocompleteDataSet = [];
      switch (type) {
        case "domain":
          autocompleteDataSet = GraphFactory.getDomains().map(
            domain => domain.name
          );
          break;
        case "group":
          autocompleteDataSet = GraphFactory.getGroups().map(
            group => group.name
          );
          break;
      }
      return autocompleteDataSet.indexOf(tag.name) > -1;
    };

    $scope.refresh = () => {
      // cachePositions = cacheNodePositions(graph.getNodes());
      if($scope.onActiveSession){
        $scope.stopRefreshSession();
        $scope.onActiveSession = false;
        $scope.makePopupBackToOriginalLocation();
      }

      if (graph) {
        graph.clear();
      }
      const callback = () => {
        if (GraphFactory.advFilterApplied()) {
          handleCollapsedDomains();
        } else {
          if (collapsedDomains.size)
            [...collapsedDomains.values()].forEach(domainNode =>
              collapseOnNode(domainNode.id, domainNode)
            );
        }
      };
      getNetworkData(false, callback);
    };

    $scope.$on("$destroy", () => {
      if (graph) {
        graph.clear();
        graph.destroy();
      }
      saveBlacklist();
      $scope.stopRefreshSession();
      $scope.stopRefreshSniffer();
    });
  }
})();
