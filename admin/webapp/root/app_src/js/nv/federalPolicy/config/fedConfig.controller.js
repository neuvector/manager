(function() {
    "use strict";
    angular
        .module("app.assets")
        .controller("FederalConfigController", FederalConfigController);
    FederalConfigController.$inject = [
      "$rootScope",
      "$scope",
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
      "AuthorizationFactory",
      "editableOptions",
      "editableThemes"
    ];
    function FederalConfigController(
      $rootScope,
      $scope,
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
      AuthorizationFactory,
      editableOptions,
      editableThemes
    ) {
      const vm = this;
      let isFed = AuthorizationFactory.getDisplayFlag("multi_cluster");
      $scope.isWebhookAuthorized = AuthorizationFactory.getDisplayFlag("write_config") && isFed;
      const OTHER_TYPE = $translate.instant("setting.webhook.OTHER_TYPE");
      $scope.webhookTypes = [
        {id: 0, text: "Slack"},
        {id: 1, text: "JSON"},
        {id: 2, text: "Teams"},
        {id: 3, text: OTHER_TYPE}
      ];
      $scope.webhookEntry = {
        name: "",
        url: "",
        type: "Slack",
        enable: false
      }

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

      activate();

      ////////////////

      function activate() {
        $scope.refresh = function () {
          vm.groupAgeHourChanged = false;
          $http
            .get(CONFIG_URL, {params: {scope: "fed"}})
            .then(function (response) {
              vm.webhooks = angular.copy(response.data.fed_config.webhooks);
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
        };
      }

      $scope.refresh();

      vm.changeStatus = function(index) {
        $timeout(() => {
          vm.saveWebhook(null, index);
        }, 200);
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
        } else if (!namePattern.test(data)) {
          return $translate.instant("setting.webhook.NAME_PATTERN_NG");
        }
      };

      vm.checkUrl = function(data, index) {
        if (!Utils.validateUrl(data)) {
          return $translate.instant("setting.webhook.URL_NG");
        }
      };

      vm.saveWebhook = function(data, index) {
        console.log(data, vm.webhooks[index]);
        let type = "";
        if (data && data.type !== undefined && data.type !== null) {
          type = $scope.webhookTypes[data.type].text;
        } else {
          type = $scope.webhookTypes[vm.webhooks[index].type].text;
        }

        let payload = {
          name: data && data.name ? data.name : vm.webhooks[index].name,
          url: data && data.url? data.url : vm.webhooks[index].url,
          type: type === OTHER_TYPE ? "" : type,
          enable: vm.webhooks[index].enable !== null ? vm.webhooks[index].enable : true,
          cfg_type: "federal"
        }
        let httpMethod = vm.webhooks[index].isNew ? "post" : "patch";
        console.log("payload:", payload);
        $http[httpMethod](WEBHOOK, payload, {params: {scope: "fed"}})
          .then((response) => {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("setting.SUBMIT_OK"));
            vm.hasNewRow = false;
            $timeout(() => {
              $scope.refresh();
            }, 1000);
          })
          .catch((error) => {
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
              $timeout(() => {
                $scope.refresh();
                vm.hasNewRow = false;
              }, 1000);
            }
          });
      };

      vm.removeWebhook = function(index) {
        Alertify.confirm($translate.instant("setting.webhook.DELETE_CONFIRM", {name: vm.webhooks[index].name})).then(
          function toOK() {
            $http
              .delete(WEBHOOK, {params: {name: vm.webhooks[index].name, scope: "fed"}})
              .then((response) => {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success($translate.instant("setting.SUBMIT_OK"));
                $timeout(() => {
                  $scope.refresh();
                }, 1000);
              })
              .catch((error) => {
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
          },
          function toCancel() {
          }
        );
      };

      vm.addRow = function() {
        vm.inserted = {
          id: vm.webhooks.length + 1,
          name: "fed.",
          url: "",
          type: 0,
          enable: true,
          isNew: true
        };
        vm.webhooks.push(vm.inserted);
        $timeout(() => {
          let el = document.getElementById(`webhook_name_${vm.webhooks.length - 1}`);
          if (el) el.focus();
          adjustWebhookTextBox();
        }, 200);
        vm.hasNewRow = true;
      };

      vm.showEdit = function() {
        adjustWebhookTextBox();
      };

      vm.cancel = function(index) {
        if (vm.webhooks[index].isNew) {
          vm.webhooks.splice(index, 1);
          vm.hasNewRow = false;
        }
      };

      vm.updateConfig = function () {
        let configBody = {
          webhooks: vm.webhooks.map(webhook => {
            let type = typeof webhook.type === "string" ? webhook.type : $scope.webhookTypes[webhook.type].text;
            return {
              name: webhook.name,
              url: webhook.url,
              type: type === OTHER_TYPE ? "" : type,
              enable: webhook.enable,
              cfg_type: "federal"
            };
          })
        };

        console.log(configBody);

        let payload = {
          fed_config: configBody
        }

        $http
          .patch(CONFIG_URL, payload, {params: {scope: "fed"}})
          .then(function () {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("setting.SUBMIT_OK"));
            $scope.isWebhookFormDirty = false;
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

      $scope.$on("$locationChangeStart", function($event, next, current) {
        if (
          $scope.isWebhookFormDirty &&
          !confirm($translate.instant("setting.webhook.LEAVE_PAGE"))
        ) {
          $event.preventDefault();
        }
      });
    }
})();
