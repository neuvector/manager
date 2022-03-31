(function () {
  "use strict";

  angular
    .module("app.login")
    .controller("SystemSettingController", SystemSettingController);

  SystemSettingController.$inject = [
    "$rootScope",
    "$scope",
    "FileUploader",
    "$translate",
    "$window",
    "$http",
    "$sanitize",
    "$state",
    "$timeout",
    "$location",
    "$filter",
    "Alertify",
    "Utils",
    "FileSaver",
    "Blob",
    "$controller",
    "multiClusterService",
    "AuthorizationFactory",
    "SystemSettingFactory",
    "editableOptions",
    "editableThemes"
  ];
  function SystemSettingController(
    $rootScope,
    $scope,
    FileUploader,
    $translate,
    $window,
    $http,
    $sanitize,
    $state,
    $timeout,
    $location,
    $filter,
    Alertify,
    Utils,
    FileSaver,
    Blob,
    $controller,
    multiClusterService,
    AuthorizationFactory,
    SystemSettingFactory,
    editableOptions,
    editableThemes
  ) {
    let vm = this;
    let originalEnablement4IbmSA = false;
    let dashboardUrl = `${$location.protocol()}://${$location.host()}:${$location.port()}/`;
    let selectedNodesIndice = [];
    const HOURS = $translate.instant("setting.HOURS");
    const DAYS = $translate.instant("setting.DAYS");
    const ENABLED = $sanitize(
      `<span class='text-success'>${$translate.instant(
        "setting.ENABLED"
      )}</span>`
    );
    const DISABLED = $sanitize(
      `<span class='text-muted'>${$translate.instant(
        "setting.DISABLED"
      )}</span>`
    );
    const MAX_SELECTED_ENFORCER = 10;
    $scope.enforcerHint = $translate.instant("setting.ENFORCERS_HINT", {maxSlectedEnforcer: MAX_SELECTED_ENFORCER});
    const OTHER_TYPE = $translate.instant("setting.webhook.OTHER_TYPE");
    $scope.CFG_TYPE = CFG_TYPE;
    $scope.webhookTypes = [
      {id: 0, text: "Slack"},
      {id: 1, text: "JSON"},
      {id: 2, text: "Teams"},
      {id: 3, text: OTHER_TYPE}
    ];
    $rootScope.isSettingFormDirty = false;
    $scope.inputMaskDisabledClass = "";
    $scope.copied = {
      dashboard_url: false,
      ibmsa_setup_url: false,
    };

    let isSettingAuth = AuthorizationFactory.getDisplayFlag("write_config");

    const getImportAuthorization = function() {
      return $scope.user.token.role === FED_ROLES.FEDADMIN ||
        $scope.user.token.role === FED_ROLES.ADMIN && ($rootScope.isStandAlone || $rootScope.isMember);
    };

    $scope.isAuthenticateRBACAuthorized = isSettingAuth;
    $scope.isNewServiceModeAuthorized = isSettingAuth;
    $scope.isClusterAuthorized = isSettingAuth;
    $scope.isWebhookAuthorized = isSettingAuth;
    $scope.isSyslogAuthorized = isSettingAuth;
    $scope.isExportAuthorized = isSettingAuth;
    $scope.isImportAuthorized = getImportAuthorization();
    $scope.isDebugLogAuthorized = isSettingAuth;
    $scope.isRegHttpProxyAuthorized = isSettingAuth;
    $scope.isRegHttpsProxyAuthorized = isSettingAuth;
    $scope.isConfigAuthorized = isSettingAuth;
    $scope.isIbmSaAuthorized = isSettingAuth;

    $scope.webhookEntry = {
      name: "",
      url: "",
      type: "Slack",
      enable: false
    };

    const adjustWebhookTextBox = function() {
      if (Array.isArray(document.getElementsByClassName("webhook-text-box-1")) && document.getElementsByClassName("webhook-text-box-1").length > 0) {
        $scope.widthOfUrlBox1 = document.getElementsByClassName("webhook-text-box-1")[0].clientWidth - 20;
      }
      if (Array.isArray(document.getElementsByClassName("webhook-text-box-2")) && document.getElementsByClassName("webhook-text-box-2").length > 0) {
        $scope.widthOfUrlBox1 = document.getElementsByClassName("webhook-text-box-2")[0].clientWidth - 20;
      }
    };

    angular.element($window).bind("resize", function () {
      adjustWebhookTextBox();
      $scope.$digest();
    });

    $scope.gridOptions4Enforcer = SystemSettingFactory.setGrid();
    $scope.gridOptions4Enforcer.onSelectionChanged = (event) => {
      let oldSelectedNodesIndice = selectedNodesIndice;
      let selectedNodes = $scope.gridOptions4Enforcer.api.getSelectedNodes();
      selectedNodesIndice = selectedNodes.map(node => node.rowIndex);
      let lastSelectedNodeIndex = selectedNodesIndice.filter(x => oldSelectedNodesIndice.indexOf(x) === -1);
      if (selectedNodes.length > MAX_SELECTED_ENFORCER && selectedNodes.length !== vm.enforcers.length) {
        let lastSelectedNode = $scope.gridOptions4Enforcer.api.getRowNode(lastSelectedNodeIndex);
        if (lastSelectedNode) lastSelectedNode.setSelected(false);
        Alertify.alert($translate.instant("setting.MAX_SELECTED_ENFORCER_HINT", {maxSlectedEnforcer: MAX_SELECTED_ENFORCER}));
      }
      vm.selectedRows = $scope.gridOptions4Enforcer.api.getSelectedRows();
      vm.isUpdatingConfig = false;
    };

    activate();

    ////////////////

    function activate() {
      // ----------------------- either the ordinary cluster or a master cluster without a member can edit the cluster name ---------
      $timeout(function () {
        if ($scope.isRemote) {
          $scope.isClusterAuthorized =
            $scope.isClusterAuthorized && !$scope.isRemote;
        } else {
          multiClusterService.getClusters().then(function (payload) {
            if (payload.data.clusters && payload.data.clusters.length > 1) {
              $scope.isClusterAuthorized = false;
            }
          });
        }
      }, 200);

      let token = JSON.parse($window.sessionStorage.getItem("token"));

      if ($rootScope.user.token.role !== "admin") {
        $scope.inputMaskDisabledClass = "input-mask-disabled";
      }

      const finishImport = function(res) {
        $scope.percentage = res.data.percentage;
        $scope.status = res.data.status;

        if ($scope.status === "done") {
          Alertify.set({ delay: 8000 });
          Alertify.success(
            '<div class="server-error" style="padding: 0">' +
              '<div><span class="error-text">' +
              $translate.instant("setting.message.UPLOAD_FINISH") +
              "</span></div></div>"
          );
          $timeout(function () {
            $window.sessionStorage.setItem(
              "from",
              JSON.stringify($location.url())
            );
            $window.sessionStorage.removeItem("token");
            $window.sessionStorage.removeItem("cluster");
            $state.go("page.login");
          }, 8000);
        } else {
          $scope.status = Utils.getAlertifyMsg($scope.status, $translate.instant("setting.IMPORT_FAILED"), false);
          $scope.status4Tooltip = $scope.status.replace(/&#34;/g, "\"");
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            $scope.status
          );
        }
      };

      const getImportProgressInfo = function(params) {
          console.log("getImportProgressInfo");
          let tempToken = params.tempToken;
          if (params.transactionId) {
            $http
            .post(
              SYSTEM_CONFIG_URL,
              tempToken,
              {
                headers: {
                  Token: token.token.token,
                  "X-Transaction-Id": params.transactionId,
                  "X-As-Standalone": params.asStandalone
                }
              }
            )
            .then((res) => {
              $scope.hasImportError = false;
              if (res.status === 200) {
                finishImport(res.data);
                $scope.isContinuelyImporting = false;
              } else if (res.status === 206) {
                let transactionId = res.data.data.tid;
                $scope.percentage = res.data.data.percentage;
                $scope.status = res.data.data.status;
                $scope.isContinuelyImporting = true;
                getImportProgressInfo(
                  {
                    transactionId,
                    tempToken,
                    asStandalone: params.asStandalone,
                    percentage: $scope.percentage
                  }
                );
              }
            })
            .catch((err) => {
              console.warn(err);
              $scope.status = Utils.getAlertifyMsg(err, $translate.instant("setting.IMPORT_FAILED"), false);
              $scope.status4Tooltip = $scope.status.replace(/&#34;/g, "\"");
              $scope.hasImportError = true;
              $scope.isContinuelyImporting = false;
              if (status !== USER_TIMEOUT) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  $scope.status
                );
              }
            });
          }
      };

      $scope.asStandalone = false;
      $scope.hasImportError = false;
      $scope.isContinuelyImporting = false;
      $scope.checkAsStandalone = function() {
        $timeout(() => {
          $scope.asStandalone = !$scope.asStandalone;
          uploader.headers["X-As-Standalone"] = $scope.asStandalone.toString();
        }, 100);
      };

      let uploader = (vm.uploader = new FileUploader({
        url: "/file/config",
        alias: "configuration",
        headers: {
          Token: token.token.token,
          Accept: "application/octet-stream",
          "X-As-Standalone": $scope.asStandalone.toString()
        }
      }));

      // FILTERS
      uploader.filters.push({
        name: "customFilter",
        fn: function (/*item, options*/) {
          return this.queue.length < 1;
        },
      });

      // CALLBACKS
      uploader.onWhenAddingFileFailed = function (
        item /*{File|FileLikeObject}*/,
        filter,
        options
      ) {};
      uploader.onAfterAddingFile = function (fileItem) {};
      uploader.onAfterAddingAll = function (addedFileItems) {};
      uploader.onBeforeUploadItem = function (item) {
        $scope.isContinuelyImporting = true;
      };
      uploader.onProgressItem = function (fileItem, progress) {};
      uploader.onProgressAll = function (progress) {};
      uploader.onSuccessItem = function (fileItem, response, status, headers) {
        $scope.hasImportError = false;
        if (status === 200) {
          finishImport(response);
          $scope.isContinuelyImporting = false;
        } else if (status === 206) {
          let transactionId = response.data.tid;
          let tempToken = response.data.temp_token;
          $scope.percentage = response.data.percentage;
          $scope.status = response.data.status;
          $scope.isContinuelyImporting = true;

          getImportProgressInfo(
            {
              transactionId,
              tempToken,
              asStandalone: $scope.asStandalone.toString(),
              percentage: $scope.percentage
            }
          );
        }
      };
      uploader.onErrorItem = function (fileItem, response, status, headers) {
        $scope.status = Utils.getAlertifyMsg(response.message, $translate.instant("setting.IMPORT_FAILED"), false);
        $scope.status4Tooltip = $scope.status.replace(/&#34;/g, "\"");
        $scope.hasImportError = true;
        $scope.isContinuelyImporting = false;
        $scope.percentage = 0;
        if (status !== USER_TIMEOUT) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            $scope.status
          );
        }
      };
      uploader.onCancelItem = function (fileItem, response, status, headers) {};
      uploader.onCompleteItem = function (
        fileItem,
        response,
        status,
        headers
      ) {};
      uploader.onCompleteAll = function () {};
      $scope.removeFile = function () {
        $scope.status = "";
        $scope.asStandalone = false;
        $scope.hasImportError = false;
        $scope.isContinuelyImporting = false;
        $scope.percentage = 0;
      };

      const eventName = $translate.instant("enum.EVENT");
      const securityEventName = $translate.instant("enum.SECURITY_EVENT");
      const auditName = $translate.instant("enum.AUDIT");
      const protocalMap = {
        "6": "TCP",
        "17": "UDP",
        default: "UDP",
      };
      const protocalCodeMap = {
        TCP: 6,
        UDP: 17,
      };

      vm.levels = ["Critical", "Error", "Warning", "Notice", "Info"];
      vm.protocols = ["UDP", "TCP"];

      vm.selectedLevel = vm.levels["NOTICE"];

      vm.syslogCategories = [
        { id: "event", name: eventName },
        { id: "security-event", name: securityEventName },
        { id: "audit", name: auditName },
      ];

      vm.catDirty = false;
      vm.hookCatDirty = false;
      vm.ibmsaEpEnabledDirty = false;

      vm.toggle = function (item, list) {
        $rootScope.isSettingFormDirty = true;
        let idx = list.indexOf(item);
        if (idx > -1) {
          list.splice(idx, 1);
        } else {
          list.push(item);
        }
      };

      vm.exists = function (item, list) {
        if (list && item) return list.indexOf(item) > -1;
      };

      vm.syslog = {};
      vm.webhook = {};
      vm.config = {};
      vm.authByOpenshift = {};
      vm.config.authByOpenshift = {};
      vm.config.local = {
        regHttpProxy: { password: "" },
        regHttpsProxy: { password: "" },
      };

      const convertHours = (value) => {
        if (!value) return "";
        let d = Math.floor(value / 24);
        let h = Math.round(value % 24);

        let hours = h === 0 ? "" : `${h}${HOURS}`;
        if (h === 1) hours = hours.replace("s", "");
        let days = d === 0 ? "" : `${d}${DAYS}`;
        if (d === 1) days = days.replace("s", "");
        if (!d) return `${hours}`;
        return h > 0 ? `${days}, ${hours}` : `${days}`;
      };

      vm.groupAge = {
        hours: 0,
        enabled: true,
        options: {
          floor: 0,
          minValue: 1,
          ceil: 168,
          disabled: !isSettingAuth,
          showSelectionBar: true,
          showTicks: 24,
          minRange: 1,
          onChange: function () {
            console.log("hours changed ");
            vm.groupAgeHourChanged = true;
            vm.groupAge.enabled = !!vm.groupAge.hours;
            $rootScope.isSettingFormDirty = true;
          },
          translate: convertHours,
        },
      };

      vm.toggleGroupAge = (state) => {
        vm.groupAge.options.disabled = !state;
        $rootScope.isSettingFormDirty = true;
      };

      $scope.showHttpsPasswordFn = function () {
        if (vm.config.regHttpsProxy.isEdit) {
          vm.config.local.regHttpsProxy.password = "********";
        }
      };

      $scope.showHttpPasswordFn = function () {
        if (vm.config.regHttpProxy.isEdit) {
          vm.config.local.regHttpProxy.password = "********";
        }
      };

      $scope.onFilterChanged = function(value) {
        $scope.gridOptions4Enforcer.api.setQuickFilter(value);
      };

      $scope.refresh = function () {
        vm.groupAgeHourChanged = false;
        $http
          .get(CONFIG_URL)
          .then(function (response) {
            vm.config.syslogEnabled = response.data.config.syslog_status;
            vm.groupAge.hours = response.data.config.unused_group_aging;
            vm.groupAge.enabled = !!vm.groupAge.hours;
            vm.config.syslogLevel = response.data.config.syslog_level;
            vm.config.syslogIp = $sanitize(response.data.config.syslog_ip);
            vm.config.syslog_in_json = response.data.config.syslog_in_json;
            vm.syslogIpProto = response.data.config.syslog_ip_proto
              ? protocalMap[response.data.config.syslog_ip_proto.toString()]
              : protocalMap["default"];
            vm.config.syslogPort = response.data.config.syslog_port;
            vm.config.syslogCategories = response.data.config.syslog_categories;
            vm.config.authByOpenshift.enabled =
              response.data.config.auth_by_platform;
            vm.openShiftStatus = vm.config.authByOpenshift.enabled
              ? ENABLED
              : DISABLED;
            vm.webhooks = angular.copy(response.data.config.webhooks);
            vm.webhooks = vm.webhooks.map((webhook, index) => {
              webhook.id = index;
              webhook.isNew = false;
              webhook.type = $scope.webhookTypes.findIndex(type => {
                let currentType = webhook.type === "" ? OTHER_TYPE : webhook.type;
                return type.text === currentType;
              });
              webhook.displayType = $translate.instant(`group.${webhook.cfg_type.toUpperCase()}`);
              webhook.typeClass = colourMap[webhook.cfg_type.toUpperCase()];
              return webhook;
            });
            vm.config.clusterName = $sanitize(
              response.data.config.cluster_name
            );
            $rootScope.clusterName = vm.config.clusterName;
            vm.config.newServiceMode =
              response.data.config.new_service_policy_mode;
            vm.config.newServiceProfileBaseline =
              response.data.config.new_service_profile_baseline;
            let emptyProxy = { url: "", username: "", password: "" };
            vm.config.regHttpProxy = response.data.config.registry_http_proxy
              ? {
                  url:
                    $sanitize(response.data.config.registry_http_proxy.url) ||
                    "",
                  username:
                    $sanitize(
                      response.data.config.registry_http_proxy.username
                    ) || "",
                }
              : angular.copy(emptyProxy);
            vm.config.regHttpsProxy = response.data.config.registry_https_proxy
              ? {
                  url:
                    $sanitize(response.data.config.registry_https_proxy.url) ||
                    "",
                  username:
                    $sanitize(
                      response.data.config.registry_https_proxy.username
                    ) || "",
                }
              : angular.copy(emptyProxy);
            vm.config.registry_http_proxy_status =
              response.data.config.registry_http_proxy_status || false;
            vm.config.registry_https_proxy_status =
              response.data.config.registry_https_proxy_status || false;
            vm.config.xff_enabled = response.data.config.xff_enabled || false;
            vm.config.single_cve_per_syslog =
              response.data.config.single_cve_per_syslog || false;
            vm.currentNewServiceMode = vm.config.newServiceMode;

            vm.config.regHttpProxy.isEdit = !!vm.config.regHttpProxy.url;
            vm.config.regHttpsProxy.isEdit = !!vm.config.regHttpsProxy.url;
            vm.ibmsa_ep_dashboard_url = $sanitize(
              response.data.config.ibmsa_ep_dashboard_url
            );
            vm.config.ibmsa_ep_dashboard_url =
              $sanitize(response.data.config.ibmsa_ep_dashboard_url) ||
              $sanitize(dashboardUrl);
            vm.config.ibmsa_ep_enabled =
              response.data.config.ibmsa_ep_enabled || false;
            vm.ibmsa_ep_connected_at =
              response.data.config.ibmsa_ep_connected_at || "";
            vm.ibmsa_ep_enabled =
              response.data.config.ibmsa_ep_enabled || false;
            originalEnablement4IbmSA = vm.config.ibmsa_ep_enabled;
            vm.config.ibmsa_ep_start = response.data.config.ibmsa_ep_start || 0;
            if (vm.config.ibmsa_ep_start === 1) {
              if (vm.ibmsa_ep_connected_at)
                vm.connectionState = $translate.instant("setting.SETUP_DONE", {
                  time: $filter("date")(
                    vm.ibmsa_ep_connected_at,
                    "MMM dd, y HH:mm:ss"
                  ),
                });
              else
                vm.connectionState = $translate.instant(
                  "setting.SETUP_DONE_NO_TIME"
                );
            }
            vm.config.controller_debug = response.data.config.controller_debug;
            vm.config.netServiceStatus = response.data.config.net_service_status;
            vm.config.netServicePolicyMode = response.data.config.net_service_policy_mode;
            vm.controllerDebugEnabled =
              vm.config.controller_debug.length > 0 &&
              vm.config.controller_debug[0] === "cpath";
            vm.isUpdatingConfig = false;
          })
          .catch(function (error) {
            console.warn(error);
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.alert(
                Utils.getAlertifyMsg(
                  error,
                  $translate.instant("setting.message.GET_SYS_LOG_ERR"),
                  true
                )
              );
            }
          });
        $http
          .get(ENFORCER_URL)
          .then((res) => {
            vm.enforcers = res.data.enforcers;
            vm.hasEnforcer = true;
            if (vm.enforcers.length > MAX_SELECTED_ENFORCER) {
              let el = $("#enforcerGrid .ag-header-select-all");
              el.hide();
            }
            $scope.gridOptions4Enforcer.api.setRowData(vm.enforcers);
          })
          .catch((err) => {
            vm.hasEnforcer = false;
          });
      };

      $scope.refresh();

      vm.changeStatus = function() {
        $rootScope.isSettingFormDirty = true;
      }

      vm.loadTypes = function() {
        return $scope.webhookTypes;
      };

      vm.showType = function(webhook) {
        if (typeof webhook.type === "string") {
          return webhook.type || "";
        } else {
          return $scope.webhookTypes[webhook.type].text;
        }
      };

      vm.checkName = function(data, index) {
        const namePattern = new RegExp(/^(fed\.)/);
        if (!data) {
          return $translate.instant("setting.webhook.NAME_EMPTY")
        } else if (!Utils.validateObjName(data)) {
          return $translate.instant("setting.webhook.NAME_NG");
        } else if (namePattern.test(data)) {
          return $translate.instant("setting.webhook.LOCAL_NAME_PATTERN_NG");
        }
      };

      vm.checkUrl = function(data, index) {
        if (!Utils.validateUrl(data)) {
          return $translate.instant("setting.webhook.URL_NG");
        }
      };

      vm.saveWebhook = function(data, id, type) {
        angular.extend(data, {id: id, type: type});
        $rootScope.isSettingFormDirty = true;
      };

      vm.removeWebhook = function(index) {
        vm.webhooks.splice(index, 1);
        $rootScope.isSettingFormDirty = true;
      };

      vm.addRow = function() {
        vm.inserted = {
          id: vm.webhooks.length + 1,
          name: "",
          url: "",
          type: 0,
          enable: true,
          isNew: true
        };
        vm.webhooks.push(vm.inserted);
        $timeout(() => {
          adjustWebhookTextBox();
        },200);
      };

      vm.enableEditWebhook = function() {
        adjustWebhookTextBox();
      };

      vm.cancel = function(index) {
        if (vm.webhooks[index].isNew) {
          vm.removeWebhook(index);
        }
      };

      vm.updateConfig = function () {
        resetEyeIcon();
        let configBody = {
          auth_by_platform: vm.config.authByOpenshift.enabled,
          unused_group_aging: vm.groupAge.enabled ? vm.groupAge.hours : 0,
          new_service_policy_mode: vm.config.newServiceMode,
          new_service_profile_baseline: vm.config.newServiceProfileBaseline,
          cluster_name: vm.config.clusterName,
          webhooks: vm.webhooks
                      .filter(webhook => webhook.cfg_type === CFG_TYPE.CUSTOMER || !webhook.cfg_type)
                      .map(webhook => {
                        let type = typeof webhook.type === "string" ? webhook.type : $scope.webhookTypes[webhook.type].text;
                        return {
                          name: webhook.name,
                          url: webhook.url,
                          type: type === OTHER_TYPE ? "" : type,
                          enable: webhook.enable,
                          cfg_type: CFG_TYPE.CUSTOMER
                        };
                      }),
          syslog_ip: vm.config.syslogIp,
          syslog_in_json: vm.config.syslog_in_json,
          syslog_ip_proto: protocalCodeMap[vm.syslogIpProto],
          syslog_port: parseInt(vm.config.syslogPort, 10),
          syslog_level: vm.config.syslogLevel,
          syslog_status: vm.config.syslogEnabled,
          syslog_categories: vm.config.syslogCategories,
          single_cve_per_syslog: vm.config.single_cve_per_syslog,
          ibmsa_ep_dashboard_url:
            vm.config.ibmsa_ep_dashboard_url || dashboardUrl,
          ibmsa_ep_enabled: vm.ibmsa_ep_enabled,
          xff_enabled: vm.config.xff_enabled
        };

        let regHttpProxy = {
          url: vm.config.regHttpProxy.url,
          username: vm.config.regHttpProxy.username,
          password: vm.configForm.regHttpProxyPassword.$dirty
            ? vm.config.local.regHttpProxy.password
            : null,
        };

        let regHttpsProxy = {
          url: vm.config.regHttpsProxy.url,
          username: vm.config.regHttpsProxy.username,
          password: vm.configForm.regHttpsProxyPassword.$dirty
            ? vm.config.local.regHttpsProxy.password
            : null,
        };
        configBody = Object.assign(configBody, {
          registry_http_proxy_status: vm.config.registry_http_proxy_status,
          registry_https_proxy_status: vm.config.registry_https_proxy_status,
          registry_http_proxy: regHttpProxy,
          registry_https_proxy: regHttpsProxy,
        });

        console.log(configBody);

        let payload = {
          config: configBody,
          net_config: {
            net_service_status: vm.config.netServiceStatus,
            net_service_policy_mode: vm.config.netServicePolicyMode
          }
        }

        $http
          .patch(CONFIG_URL, payload)
          .then(function () {
            vm.catDirty = false;
            vm.hookCatDirty = false;
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("setting.SUBMIT_OK"));
            $rootScope.$broadcast("updateClusterName", {
              name: vm.config.clusterName,
            });
            vm.configForm.$setPristine();
            vm.configForm.$setUntouched();
            vm.configForm2.$setPristine();
            vm.configForm2.$setUntouched();
            $rootScope.isSettingFormDirty = false;
            $timeout(() => {
              $scope.refresh();
            }, 1000);
          })
          .catch(function (error) {
            console.warn(error);
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  error,
                  $translate.instant("setting.SUBMIT_FAILED"),
                  false
                )
              );
            }
          });
      };

      vm.showOpenShiftStatus = function () {
        vm.openShiftStatus = vm.config.authByOpenshift.enabled
          ? ENABLED
          : DISABLED;
      };

      vm.changeFieldValue = function () {
        $rootScope.isSettingFormDirty = true;
      };

      vm.export = function (exportMode) {
        $scope.exportErr = false;
        $http
          .get(SYSTEM_CONFIG_URL, {
            params: { id: exportMode },
            responseType: "arraybuffer",
            cache: false,
            headers: { "Cache-Control": "no-store" },
          })
          .then(function (response) {
            let exportUrl = new Blob([response.data], {
              type: "application/zip",
            });
            let fileName =
              exportMode && exportMode.toLowerCase() === 'all' ?
              `NV${Utils.parseDatetimeStr(new Date())}.conf.gz` :
              `NV${Utils.parseDatetimeStr(new Date())}_policy.conf.gz`
            FileSaver.saveAs(exportUrl, fileName);
          })
          .catch(function (err) {
            console.warn(err);
            $scope.exportErr = true;
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error($translate.instant("setting.SUBMIT_FAILED"));
            }
          });
      };
    }

    function MultiPart_parse(body, contentType) {
      let m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

      if (!m) {
        throw new Error("Bad content-type header, no multipart boundary");
      }

      let boundary = m[1] || m[2];

      function Header_parse(header) {
        let headerFields = {};
        let matchResult = header.match(/^.*name="([^"]*)"$/);
        if (matchResult) headerFields.name = matchResult[1];
        return headerFields;
      }

      function rawStringToBuffer(str) {
        let idx,
          len = str.length,
          arr = new Array(len);
        for (idx = 0; idx < len; ++idx) {
          arr[idx] = str.charCodeAt(idx) & 0xff;
        }
        return new Uint8Array(arr).buffer;
      }

      boundary = "\r\n--" + boundary;
      let isRaw = typeof body !== "string";
      let s;
      if (isRaw) {
        let view = new Uint8Array(body);
        s = view.reduce(function (data, byte) {
          return data + String.fromCharCode(byte);
        }, "");
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
          ? rawStringToBuffer(subparts[1])
          : subparts[1];
        vm.exportFilename = fieldName;
      }
      return partsByName;
    }

    function keepLive() {
      $http
        .patch(HEART_BEAT_URL)
        .then(function (response) {})
        .catch(function (err) {
          console.warn(err);
        });
    }

    vm.submitCpath = function() {
      $timeout(() => {
        vm.isUpdatingConfig = true;
        let configBody = {
          controller_debug: vm.controllerDebugEnabled ? ["cpath"] : []
        }
        $http
          .patch(CONFIG_URL, configBody)
          .then(function () {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            if (vm.controllerDebugEnabled) Alertify.success($translate.instant("setting.ENABLED_CPATH_OK"));
            else Alertify.success($translate.instant("setting.DISABLED_CPATH_OK"));
            $timeout(() => {
              $scope.refresh();
            }, 1000);
          })
          .catch(function (error) {
            console.warn(error);
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  error,
                  vm.controllerDebugEnabled ? $translate.instant("setting.ENABLED_CPATH_NG") : $translate.instant("setting.DISABLED_CPATH_NG"),
                  false
                )
              );
            }
          });
      }, 200);
    };

    vm.collectLog = function () {
      let enforcerParam = [];
      if (vm.selectedRows) {
        console.log(vm.selectedRows);
        enforcerParam = vm.selectedRows.length === vm.enforcers.length ? "ALL" : vm.selectedRows.map(enforcer => {
          return $filter("shorten")(enforcer.id, 12);
        }).join(",");
      }
      $http
        .post(
          SYSTEM_DEBUG_URL,
          enforcerParam
        )
        .then(function () {
          checkDebugLog();
          keepLive();
        })
        .catch(function (err) {
          console.warn(err);
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(
              err,
              $translate.instant("service.SUBMIT_FAILED"),
              false
            )
          );
        });
    };

    let sessionPromise;
    let debugInProgress = JSON.parse(
      $window.localStorage.getItem("debugInProgress")
    );

    if (debugInProgress === true) {
      checkDebugLog();
    }

    function checkDebugLog() {
      $http
        .patch(DEBUG_CHECK_URL)
        .then(function (response) {
          if (response.status === 200) {
            vm.debugInProgress = false;
            $window.localStorage.setItem(
              "debugInProgress",
              JSON.stringify(false)
            );
            vm.logIsReady = true;
            if (sessionPromise) {
              clearTimeout(sessionPromise);
              sessionPromise = 0;
            }
          } else {
            vm.debugInProgress = true;
            $window.localStorage.setItem(
              "debugInProgress",
              JSON.stringify(true)
            );
            sessionPromise = setTimeout(checkDebugLog, 5000);
          }
        })
        .catch(function (err) {
          console.warn(err);
        });
    }

    vm.cancelCollect = function () {
      if (sessionPromise) {
        clearTimeout(sessionPromise);
        sessionPromise = 0;
      }
      vm.debugInProgress = false;
      vm.logIsReady = false;
    };

    vm.download = function () {
      $http
        .get(SYSTEM_DEBUG_URL, { responseType: "arraybuffer" })
        .then(function (response) {
          let filename = `nvsupport_${Utils.parseDatetimeStr(new Date())}.gz`;
          if (typeof window.navigator.msSaveBlob !== "undefined") {
            // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were
            // created. These URLs will no longer resolve as the data backing the URL has been freed."
            let blobObject = new Blob([response.data]);
            window.navigator.msSaveBlob(blobObject, filename);
          } else {
            let blob =
              typeof File === "function"
                ? new File([response.data], filename, {
                    type: "application/x-gzip",
                  })
                : new Blob([response.data], { type: "application/x-gzip" });
            let URL = window.URL || window.webkitURL;
            let downloadUrl = URL.createObjectURL(blob);

            // use HTML5 a[download] attribute to specify filename
            let a = document.createElement("a");
            // safari doesn't support this yet
            if (typeof a.download === "undefined") {
              window.location = downloadUrl;
            } else {
              a.href = downloadUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
            }
            setTimeout(function () {
              URL.revokeObjectURL(downloadUrl);
            }, 200); // cleanup
          }
        })
        .catch(function (err) {
          console.warn(err);
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              $translate.instant("setting.SUBMIT_FAILED") +
                " " +
                error.data.message
            );
          }
        });
    };

    vm.usageReport = function() {
      $http
        .get(USAGE_REPORT_URL)
        .then((res) => {
          console.log(res.data.usage);
          let usageJson = JSON.stringify(res.data.usage, null, "\t");
          let exportUrl = new Blob([usageJson], {
            type: "application/json",
          });
          FileSaver.saveAs(exportUrl, `Usage report_${Utils.parseDatetimeStr(new Date())}`);
        })
        .catch((err) => {
          console.warn(err);
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              $translate.instant("setting.EXPORT_FAILED") +
                " " +
                error.data.message
            );
          }
        });
    };

    vm.toggleIbmSA = function () {
      $rootScope.isSettingFormDirty = true;
      vm.ibmsaEpEnabledDirty =
        originalEnablement4IbmSA !== vm.config.ibmsa_ep_enabled;
    };

    vm.getIbmSetupUrl = function () {
      $http
        .get(IBM_SETUP_URL)
        .then(function (res) {
          let now = new Date();
          vm.ibmsa_setup_url = res.data.url;
          vm.expiringTime = $translate.instant("setting.URL_EXPIRE", {
            time: Utils.getDateByInterval(
              Utils.parseDatetimeStr(now),
              30,
              Utils.CALENDAR.MINUTES,
              "yyyy-MM-dd HH:mm:ss"
            ),
          });
        })
        .catch(function (error) {
          vm.ibmsa_setup_url = "";
          vm.expiringTime = Utils.getAlertifyMsg(
            error,
            $translate.instant("setting.IBM_SA_ERR"),
            false
          );
        });
    };

    vm.success = function (urlName) {
      $scope.copied[urlName] = true;
      setTimeout(function () {
        $scope.copied[urlName] = false;
        $scope.$apply();
      }, 3000);
    };

    function resetEyeIcon() {
      $scope.showHttpPassword = false;
      $scope.showHttpsPassword = false;
    }

    $scope.$on("$destroy", function () {
      if (sessionPromise) {
        clearTimeout(sessionPromise);
        sessionPromise = 0;
      }
    });

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    $scope.$on("$locationChangeStart", function($event, next, current) {
      if (
        $rootScope.isSettingFormDirty &&
        !confirm($translate.instant("setting.webhook.LEAVE_PAGE"))
      ) {
        $event.preventDefault();
      }
    });
  }
})();
