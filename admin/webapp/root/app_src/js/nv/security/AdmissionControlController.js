(function() {
  "use strict";
  angular
    .module("app.assets")
    .controller("AdmissionControlController", AdmissionControlController);
  AdmissionControlController.$inject = [
    "$rootScope",
    "$scope",
    "$state",
    "$location",
    "$timeout",
    "$translate",
    "$http",
    "$localStorage",
    "$mdDialog",
    "Alertify",
    "$window",
    "Utils",
    "filterFilter",
    "admissionControlService",
    "$controller",
    "$sanitize",
    "$filter",
    "AuthorizationFactory"
  ];
  function AdmissionControlController(
    $rootScope,
    $scope,
    $state,
    $location,
    $timeout,
    $translate,
    $http,
    $localStorage,
    $mdDialog,
    Alertify,
    $window,
    Utils,
    filterFilter,
    admissionControlService,
    $controller,
    $sanitize,
    $filter,
    AuthorizationFactory
  ) {
    $scope.isSupported = false;
    $scope.graphHeight = $window.innerHeight - 240;
    $scope.selectedRows = [];
    angular.element($window).bind("resize", function() {
      $scope.graphHeight = $window.innerHeight - 240;
      $scope.$digest();
    });

    const INTERNAL_ERR_CODE = {
      UNSUPPORTED: 30,
      CLUSTER_ROLE_NOT_CONFIG: 31,
      WEBHOOK_NOT_CONFIG: 32,
      NO_UPD_PROMISSION: 33,
      ERR_SRV2WEBHOOK: 34,
      CONFIG_K8S_FAIL: 28
    };

    const KUBE = "Kubernetes";
    const GLOBAL = "Global action";
    $scope.RULE_TYPE = {
      DENY: "deny",
      EXCEPTION: "exception"
    };
    const SINGLE_VALUE_CRITERIA = [
      "user",
      "image",
      "imageRegistry",
      "namespace"
    ];
    $scope.showedRuleType = $scope.RULE_TYPE.DENY;
    $scope.isWriteAdmissionRuleAuthorized = AuthorizationFactory.getDisplayFlag("write_admission");
    $scope.isAdmissionRuleAuthorized = AuthorizationFactory.getDisplayFlag("admission");
    let filter = "";
    let exceptionRulesCount = 0;
    let denyRulesCount = 0;
    let vm = this;

    const isSingleValueCriterion = function(name) {
      for (let i = 0; i < SINGLE_VALUE_CRITERIA.length; i++) {
        if (SINGLE_VALUE_CRITERIA[i].toLowerCase() === name.toLowerCase()) {
          return true;
        }
      }
      return false;
    };

    activate();

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window);
      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("policy.COUNT_POSTFIX")
        );
      };
      const found = $translate.instant("enum.FOUND");
      let columnDefs = [
        {
          headerName: $translate.instant("policy.gridHeader.ID"),
          field: "id",
          headerCheckboxSelection: $scope.isWriteAdmissionRuleAuthorized,
          headerCheckboxSelectionFilteredOnly: $scope.isWriteAdmissionRuleAuthorized,
          checkboxSelection: idSelectionFunc,
          cellRenderer: idRendererFunc,
          width: 100,
          minWidth: 100,
          maxWidth: 100
        },
        {
          headerName: $translate.instant("admissionControl.COMMENT"),
          field: "comment",
          width: 240,
          minWidth: 150,
          cellRenderer: function(params) {
            if (params && params.value) {
              return $sanitize(
                params.value.length > 60
                  ? `${params.value.substring(0, 60)}...`
                  : params.value
              );
            }
          }
        },
        {
          headerName: $translate.instant("admissionControl.CRITERIA"),
          field: "criteria",
          cellRenderer: criteriaRenderFunc,
          width: 550
        },
        {
          headerName: $translate.instant("admissionControl.RULE_TYPE"),
          field: "rule_type",
          cellRenderer: typeRenderFunc,
          width: 85,
          minWidth: 85,
          maxWidth: 85
        },
        {
          headerName: $translate.instant("admissionControl.TYPE"),
          field: "cfg_type",
          cellRenderer: cfgTypeRenderFunc,
          width: 85,
          minWidth: 85,
          maxWidth: 85
        },
        {
          cellRenderer: actionsRenderFunc,
          cellClass: "grid-right-align",
          suppressSorting: true,
          width: 100,
          maxWidth: 100,
          minWidth: 100
        }
      ];

      function idSelectionFunc(params) {
        if (params.data) {
          return (
            $scope.isWriteAdmissionRuleAuthorized &&
            params.data.category !== GLOBAL
          );
        }
        return false;
      }
      function idRendererFunc(params) {
        let id = "";
        if (params && params.value) {
          if (
            $scope.isWriteAdmissionRuleAuthorized &&
            params.data.category !== GLOBAL ||
            !$scope.isWriteAdmissionRuleAuthorized
          ) {
            id = params.value;
          } else {
            id = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${params.value}`;
          }
          return $sanitize(id);
        }
      }
      function cfgTypeRenderFunc(params) {
        if (params && params.value) {
          let type = params.data.disable
            ? colourMap["disabled-rule"]
            : colourMap[params.value.toUpperCase()];
          return `<div class="action-label nv-label ${type}">${$sanitize(
            $translate.instant(`group.${params.value.toUpperCase()}`)
          )}</div>`;
        }
      }
      function typeRenderFunc(params) {
        if (params.value && params.data) {
          let type = params.value === "exception" ? "Allow" : params.value;
          return `<span ng-class="{\'policy-remove\': data.remove}" class="action-label ${
            params.data.disable
              ? colourMap["disabled_background"]
              : colourMap[type.toLowerCase()]
          }">${$sanitize(
            $translate.instant("admissionControl." + type.toUpperCase())
          )}</span>`;
        }
      }
      function actionsRenderFunc(params) {
        if (params.data.category !== GLOBAL) {
          if (
            $scope.isWriteAdmissionRuleAuthorized &&
            params.data.cfg_type !== CFG_TYPE.FED &&
            params.data.cfg_type !== CFG_TYPE.GROUND
          ) {
            if (params.data && params.data.critical) {
              return (
                '<div class="rule-actions-expand fade-in-right">' +
                '       <em class="fa fa-newspaper-o fa-lg mr-sm text-action"' +
                '         ng-click="editPolicy($event, data, true)" uib-tooltip="{{\'admissionControl.TIP.VIEW_RULE\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-times fa-lg mr-sm text-action" ng-if="!data.disable"' +
                '         ng-click="toggleRuleItem($event, data, true)" uib-tooltip="{{\'policy.TIP.DISABLE\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-check fa-lg mr-sm text-action" ng-if="data.disable"' +
                '         ng-click="toggleRuleItem($event, data, true)" uib-tooltip="{{\'policy.TIP.ENABLE\' | translate}}">' +
                "       </em>" +
                "     </div>" +
                '     <div class="rule-actions-collapse">' +
                '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                "       </em>" +
                "     </div>"
              );
            } else {
              return (
                '<div class="rule-actions-expand fade-in-right">' +
                '       <em class="fa fa-edit fa-lg mr-sm text-action"' +
                '         ng-click="editPolicy($event, data)" uib-tooltip="{{\'policy.TIP.EDIT\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-times fa-lg mr-sm text-action" ng-if="!data.disable"' +
                '         ng-click="toggleRuleItem($event, data, false)" uib-tooltip="{{\'policy.TIP.DISABLE\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-check fa-lg mr-sm text-action" ng-if="data.disable"' +
                '         ng-click="toggleRuleItem($event, data, false)" uib-tooltip="{{\'policy.TIP.ENABLE\' | translate}}">' +
                "       </em>" +
                '       <em class="fa fa-trash fa-lg mr-sm text-action" ' +
                '         ng-click="deleteRuleItem($event, data)" uib-tooltip="{{\'policy.TIP.DELETE\' | translate}}">' +
                "       </em>" +
                "     </div>" +
                '     <div class="rule-actions-collapse">' +
                '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                "       </em>" +
                "     </div>"
              );
            }
          } else {
            return (
              '     <div class="rule-actions-expand">' +
              '       <em class="fa fa-newspaper-o fa-lg mr-sm text-action"' +
              '         ng-click="editPolicy($event, data, true)" uib-tooltip="{{\'admissionControl.TIP.VIEW_RULE\' | translate}}">' +
              "       </em>" +
              "     </div>" +
              '     <div class="rule-actions-collapse">' +
              '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
              "       </em>" +
              "     </div>"
            );
          }
        }
      }

      function criteriaRenderFunc(params) {
        let criteriaArray = [];
        params.value.forEach(function(criteria) {
          if (typeof criteria === "string") {
            criteriaArray.push(criteria);
          } else {
            if (
              criteria.name === "imageSigned" ||
              criteria.name === "runAsRoot" ||
              criteria.name === "runAsPrivileged" ||
              criteria.name === "allowPrivEscalation" ||
              criteria.name === "pspCompliance"
            ) {
              criteriaArray.push(
                $translate.instant(
                  `admissionControl.names.${Utils.parseDivideStyle(
                    criteria.name
                  ).toUpperCase()}`
                )
              );
            } else if (
              (
                (
                  criteria.name === "cveHighCount" ||
                  criteria.name === "cveHighWithFixCount" ||
                  criteria.name === "cveMediumCount"
                ) && criteria.sub_criteria
              )
            ) {
              criteriaArray.push(
                $translate.instant(
                  `admissionControl.display.${Utils.parseDivideStyle(
                    criteria.name
                  ).toUpperCase()}_WITH_REPORT_DAYS`,
                  {
                    comparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${criteria.op}`)),
                    count: criteria.value
                  }
                ) + " " +
                $translate.instant(
                  `admissionControl.display.${Utils.parseDivideStyle(
                    criteria.op)}`,
                  {
                    days: criteria.sub_criteria[0].value
                  }
                )
              );
            } else if (criteria.name === "cveScoreCount" && criteria.sub_criteria) {
              criteriaArray.push(
                $translate.instant(
                  `admissionControl.display.${Utils.parseDivideStyle(
                    criteria.name
                  ).toUpperCase()}_WITH_COUNT`,
                  {
                    score: criteria.value,
                    count: criteria.sub_criteria[0].value,
                    countComparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${criteria.op}`)),
                    scoreComparison: $translate.instant(`admissionControl.display.cveScore.${criteria.sub_criteria[0].op}`)
                  }
                )
              );
            } else if (criteria.name === "resourceLimit") {
              criteriaArray.push($translate.instant(
                `admissionControl.display.${Utils.parseDivideStyle(
                  criteria.name
                ).toUpperCase()}`,
                {
                  details: criteria.sub_criteria.map(subCriterion => {
                    return `${$translate.instant(`admissionControl.names.${Utils.parseDivideStyle(subCriterion.name).toUpperCase()}_S`)}${subCriterion.op}${$filter("bytes")(subCriterion.value, 2)}`
                  }).join(", ")
                }
              ).replace(/\&gt\;/g, ">").replace(/\&lt\;/g, "<"));
            } else {
              let value =
                criteria.value.length > 30
                  ? `${criteria.value.substring(0, 30)}...`
                  : criteria.value;
              value =
                criteria.op.toLowerCase().indexOf("contains") >= 0
                  ? `[${value}]`
                  : value;
              criteriaArray.push(
                `${$translate.instant(
                  `admissionControl.names.${Utils.parseDivideStyle(
                    criteria.name
                  ).toUpperCase()}`
                )} ${
                  isSingleValueCriterion(criteria.name)
                    ? $translate.instant(
                        `admissionControl.operators.${criteria.op.toUpperCase()}_SINGLE`
                      )
                    : $translate.instant(
                        `admissionControl.operators.${criteria.op.toUpperCase()}`
                      )
                } ${value}`
              );
            }
          }
        });
        return $sanitize(criteriaArray.join(", "));
      }

      const onAdmissionRuleSelected = function() {
        $scope.selectedRows = $scope.gridOptions.api.getSelectedRows();
        console.log("$scope.selectedRows", $scope.selectedRows);
        $scope.hasSelectedDefaultRule = $scope.selectedRows.some(rule => rule.critical || rule.cfg_type === CFG_TYPE.FED);
        $scope.$apply();
      };

      $scope.gridOptions = {
        headerHeight: 56,
        rowHeight: 56,
        animateRows: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs,
        rowData: null,
        onSelectionChanged: onAdmissionRuleSelected,
        rowSelection: "multiple",
        isRowSelectable: idSelectionFunc,
        rowClassRules: {
          "disabled-row": function(params) {
            if (!params.data) return;
            if (params.data.disable) {
              return true;
            }
            return false;
          },
          "critical-row": function(params) {
            if (!params.data) return;
            return params.data.id === "" && params.data.critical;
          }
        },
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 100);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
      };

      $scope.exceptionGridOptions = {
        headerHeight: 56,
        rowHeight: 56,
        animateRows: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs,
        rowData: null,
        rowClassRules: {
          "disabled-row": function(params) {
            if (!params.data) return;
            if (params.data.disable) {
              return true;
            }
            return false;
          },
          "critical-row": function(params) {
            if (!params.data) return;
            return params.data.id === "" && params.data.critical;
          }
        },
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 2000);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
      };

      $scope.requestAdmissionRules = function(index) {
        requestAdmissionRules(index);
      };
      function requestAdmissionRules(index) {
        $http
          .get(ADMISSION_URL)
          .then(function(response) {
            $scope.isSupported = true;
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            admissionControlService.admissionRules = response.data.rules;
            $scope.admissionRules = admissionControlService.admissionRules;
            let globalActionRule = {
              id: "",
              comment:
                $scope.default_action === "allow"
                  ? "Allow deployments that don't match any of above rules."
                  : "Deny deployments that don't match any of above rules.",
              criteria: [],
              critical: true,
              category: GLOBAL,
              rule_type: $scope.default_action,
              disable: false
            };
            $scope.admissionRules.push(globalActionRule);
            if ($scope.gridOptions && $scope.gridOptions.api) {
              $scope.gridOptions.api.setRowData($scope.admissionRules);
            }
            $scope.count = `${$scope.admissionRules.length} ${getEntityName(
              $scope.admissionRules.length
            )}`;
            $scope.onFilterChanged(filter);
            if (index) {
              $scope.gridOptions.api.ensureIndexVisible(index, "middle");
            }
          })
          .catch(function(error) {
            console.log(error);
            $scope.admissionRuleErr = true;
            $scope.isSupported = false;
            if (error.status === 404) {
              switch (error.data.code) {
                case INTERNAL_ERR_CODE.UNSUPPORTED:
                  $scope.gridOptions.overlayNoRowsTemplate =
                    '<div class="server-error">' +
                    '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                    '<div><span class="error-text">' +
                    $translate.instant("admissionControl.msg.UNSUPPORTED") +
                    "</span></div></div>";
                  break;
                case INTERNAL_ERR_CODE.CLUSTER_ROLE_NOT_CONFIG:
                  $scope.gridOptions.overlayNoRowsTemplate =
                    '<div class="server-error">' +
                    '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                    '<div><span class="error-text">' +
                    $translate.instant(
                      "partner.admissionControl.msg.CLUSTER_ROLE_NOT_CONFIG"
                    ) +
                    "</span></div></div>";
                  break;
                case INTERNAL_ERR_CODE.WEBHOOK_NOT_CONFIG:
                  $scope.gridOptions.overlayNoRowsTemplate =
                    '<div class="server-error">' +
                    '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                    '<div><span class="error-text">' +
                    $translate.instant(
                      "partner.admissionControl.msg.WEBHOOK_NOT_CONFIG"
                    ) +
                    "</span></div></div>";
                  break;
                default:
                  $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(error);
              }
            } else if (error.status === 403) {
              $scope.gridOptions.overlayNoRowsTemplate = $translate.instant("general.NO_ROWS")
            } else {
              $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(error);
            }
            if ($scope.gridOptions && $scope.gridOptions.api) {
              $scope.gridOptions.api.setRowData();
            }
          });
      }
      function requestConditionOption() {
        admissionControlService.conditionOptionErr = false;
        $http
          .get(ADMCTL_CONDITION_OPTION_URL)
          .then(function(response) {
            admissionControlService.conditionDenyOptions =
              response.data.admission_options.deny_options.k8s_options.rule_options;
            admissionControlService.conditionExceptionOptions =
              response.data.admission_options.exception_options.k8s_options.rule_options;
            admissionControlService.psp_collection = response.data.admission_options.psp_collection;
          })
          .catch(function(err) {
            console.warn(err);
            admissionControlService.conditionOptionErr = true;
            admissionControlService.conditionOptionErrMSG = Utils.getErrorMessage(
              err
            );
          });
        $http
          .get(ADMCTL_STATE_URL)
          .then(function(response) {
            admissionControlService.state = response.data.state.enable;
            admissionControlService.mode = response.data.state.mode;
            vm.state = admissionControlService.state;
            $scope.mode = admissionControlService.mode
              ? admissionControlService.mode
              : "monitor";
            $scope.isProtect = admissionControlService.mode === "protect";
            $scope.default_action = response.data.state.default_action;
            $scope.adm_client_mode_options =
              response.data.state.adm_client_mode_options;
            $scope.adm_client_mode = response.data.state.adm_client_mode;
            $scope.canConfig = response.data.state.cfg_type !== CFG_TYPE.GROUND;
            $scope.isK8s = response.data.k8s_env;
            requestAdmissionRules();
          })
          .catch(function(error) {
            console.log(error);
            $scope.admissionRuleErr = true;
            if (
              error.status === 404 &&
              error.data.code === INTERNAL_ERR_CODE.UNSUPPORTED
            ) {
              $scope.isSupported = false;
              $scope.gridOptions.overlayNoRowsTemplate =
                '<div class="server-error">' +
                '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                '<div><span class="error-text">' +
                $translate.instant("admissionControl.msg.UNSUPPORTED") +
                "</span></div></div>";
              $scope.gridOptions.api.setRowData();
            } else if (error.status === 403) {
              $scope.gridOptions.overlayNoRowsTemplate = $translate.instant("general.NO_ROWS")
              if ($scope.gridOptions && $scope.gridOptions.api) {
                $scope.gridOptions.api.setRowData();
              }
            } else {
              $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(error);
              if ($scope.gridOptions && $scope.gridOptions.api) {
                $scope.gridOptions.api.setRowData();
              }
            }
          });
      }
      $scope.reload = function() {
        requestConditionOption();
      };
      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        $scope.filteredServices = filterFilter($scope.services, {
          name: value
        });
        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.admissionRules.length || value === ""
            ? `${$scope.admissionRules.length} ${getEntityName(
                $scope.admissionRules.length
              )}`
            : `${found} ${filteredCount} / ${$scope.admissionRules.length} ${getEntityName(
                $scope.admissionRules.length
              )}`;
      };
    }
    $scope.reload();

    $scope.switchState = function(state) {
      let payload = {
        state: {
          enable: state,
          mode: $scope.mode,
          default_action: $scope.default_action,
          adm_client_mode: $scope.adm_client_mode,
          adm_client_mode_options: $scope.adm_client_mode_options
        }
      };
      vm.state = state;
      $http
        .patch(ADMCTL_STATE_URL, payload)
        .then(function(response) {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          if (state) {
            Alertify.success(
              $translate.instant("admissionControl.msg.G_ENABLE_OK")
            );
          } else {
            Alertify.success(
              $translate.instant("admissionControl.msg.G_DISABLE_OK")
            );
          }
        })
        .catch(function(err) {
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            if (
              err.status === 500 &&
              err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
            ) {
              err = $translate.instant(
                "admissionControl.msg.CONFIG_K8S_FAIL"
              );
            }
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            if (!state) {
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.G_DISABLE_NG"), false)
              );
            } else {
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.G_ENABLE_NG"), false)
              );
            }
            $timeout(function() {
              document.getElementById("adm-state").checked = !state;
              vm.state = !state;
              $scope.$apply();
            }, 4000);
          }
        });
    };

    $scope.switchMode = function(isProtect) {
      if (!$scope.canConfig) return;
      let payload = {
        state: {
          enable: vm.state,
          mode: isProtect ? "protect" : "monitor",
          default_action: $scope.default_action,
          adm_client_mode: $scope.adm_client_mode,
          adm_client_mode_options: $scope.adm_client_mode_options
        }
      };

      $scope.mode = isProtect ? "protect" : "monitor";
      let sendReq4TogglingMode = function(payload, isProtect) {
        $http
          .patch(ADMCTL_STATE_URL, payload)
          .then(function(response) {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success(
              $translate.instant("admissionControl.msg.MODE_SWITCH_OK")
            );
            $scope.isProtect = isProtect;
          })
          .catch(function(err) {
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              if (
                err.status === 500 &&
                err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
              ) {
                err = $translate.instant(
                  "admissionControl.msg.CONFIG_K8S_FAIL"
                );
              }
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.MODE_SWITCH_NG"), false)
              );
              $timeout(function() {
                $scope.isProtect = !isProtect;
                $scope.$apply();
              }, 4000);
            }
          });
      };
      if ($scope.isProtect !== isProtect) {
        if (isProtect) {
          let confirmBox = $translate.instant(
            "admissionControl.msg.PROTECT_CONFIRM"
          );
          Alertify.confirm(confirmBox).then(
            function toOK() {
              sendReq4TogglingMode(payload, isProtect);
            },
            function toCancel() {}
          );
        } else {
          sendReq4TogglingMode(payload, isProtect);
        }
      }
    };

    $scope.addPolicy = function(ev, id) {
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4AddEditPolicy,
            controllerAs: "addEditAdmCtrl",
            templateUrl: "dialog.addEditPolicy.html",
            targetEvent: ev,
            locals: {
              ruleType: $scope.showedRuleType,
              RULE_TYPE: $scope.RULE_TYPE,
              SINGLE_VALUE_CRITERIA: SINGLE_VALUE_CRITERIA,
              isSingleValueCriterion: isSingleValueCriterion,
              isEdit: false,
              isViewOnly: false,
            }
          })
          .then(
            function() {
              $timeout(() => {
                $scope.index4Add = $scope.admissionRules.length;
                $scope.requestAdmissionRules();
              }, 3000);
            },
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.editPolicy = function(ev, data, isViewOnly) {
      $scope.isViewOnly = isViewOnly;
      let success = function() {
        let rowNode = null;
        $scope.index4edit = admissionControlService.getIndex(
          $scope.admissionRules,
          data.id
        );
        rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
          $scope.index4edit
        );

        rowNode.setSelected(true);
        admissionControlService.admissionRule4Edit = angular.copy(data);
        $mdDialog
          .show({
            controller: DialogController4AddEditPolicy,
            controllerAs: "addEditAdmCtrl",
            templateUrl: "dialog.addEditPolicy.html",
            targetEvent: ev,
            locals: {
              ruleType: $scope.showedRuleType,
              isViewOnly: $scope.isViewOnly,
              SINGLE_VALUE_CRITERIA: SINGLE_VALUE_CRITERIA,
              isSingleValueCriterion: isSingleValueCriterion,
              isEdit: true
            }
          })
          .then(
            function() {
              $timeout(() => {
                $scope.requestAdmissionRules($scope.index4edit);
              }, 1000);
            },
            function() {
              admissionControlService.admissionRule4Edit = angular.copy(data);
            }
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.promoteRule = function() {
      let payload = {
        request: {
          ids: $scope.selectedRows.map(rule => rule.id)
        }
      }

      $http
        .post(PROMOTE_ADMISSION_RULE, payload)
        .then((res) => {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          Alertify.success(
            $translate.instant("policy.message.PROMOTE_OK")
          );
          $timeout(() => {
            $scope.reset();
          }, 1000);
        })
        .catch((err) => {
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("policy.message.PROMOTE_NG"), false)
            );
          }
        });
    };

    $scope.showGlobalActions = function(ev) {
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4GlobalActions,
            controllerAs: "gblActCtrl",
            templateUrl: "dialog.globalActions.html",
            targetEvent: ev,
            locals: {
              enable: vm.state,
              isProtectMode: $scope.isProtect,
              default_action: $scope.default_action,
              adm_client_mode_options: $scope.adm_client_mode_options,
              adm_client_mode: $scope.adm_client_mode,
              INTERNAL_ERR_CODE,
              reload: $scope.reload
            }
          })
          .then(
            function() {},
            function() {
              $timeout(function() {
                $scope.reload();
              }, 2000);
            }
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.openAdmissionTestDialog = function() {
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4MatchingTest,
            templateUrl: "dialog.admTest.html"
          })
          .then(
            function() {},
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.openExportPopup = function() {
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4Export,
            locals: {
              selectedAdmissionRules: $scope.selectedRows,
              GLOBAL: GLOBAL
            },
            templateUrl: "dialog.admExport.html"
          })
          .then(
            function() {},
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.openImportPopup = function() {
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4Import,
            locals: {
              reload: $scope.reload
            },
            templateUrl: "dialog.admImport.html"
          })
          .then(
            function() {},
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.deleteRuleItem = function(event, data) {
      let rowNode = null;
      $scope.index4delete = admissionControlService.getIndex(
        $scope.admissionRules,
        data.id
      );
      rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
        $scope.index4delete
      );
      rowNode.setSelected(true);
      let confirmBox =
        $translate.instant("admissionControl.msg.REMOVE_CONFIRM") +
        $sanitize(data.id);
      Alertify.confirm(confirmBox).then(
        function toOK() {
          $http
            .delete(
              `${ADMISSION_SINGLE_URL}?scope=local&id=${data.id}&ruleType=${
                data.type === "deny" ? "deny" : "exception"
              }`
            )
            .then(function(response) {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success(
                $translate.instant("admissionControl.msg.REMOVE_OK")
              );
              $timeout(() => {
                if ($scope.index4delete === $scope.admissionRules.length)
                  $scope.index4delete--;
                $scope.requestAdmissionRules($scope.index4delete);
              }, 1000);
            })
            .catch(function(e) {
              rowNode.setSelected(false);
              if (USER_TIMEOUT.indexOf(e.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.REMOVE_NG"), false)
                );
              }
            });
        },
        function toCancel() {
          rowNode.setSelected(false);
        }
      );
    };

    $scope.toggleRuleItem = function(event, rule, isCritical) {
      let index4Toggle = admissionControlService.getIndex(
        $scope.admissionRules,
        rule.id
      );
      let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4Toggle);
      if (isCritical) {
        let namespace = "";
        let criteriaStr = JSON.stringify(rule.criteria).toLowerCase();
        if (
          criteriaStr.indexOf("system") >= 0 ||
          criteriaStr.indexOf("kube") >= 0
        ) {
          namespace = "system";
        } else if (criteriaStr.indexOf("neuvector") >= 0) {
          namespace = "NeuVector";
        }
        let confirmBox = rule.disable
          ? $translate.instant("admissionControl.msg.ENABLE_CONFIRM_DEFAULT", {
              namespace: $sanitize(namespace)
            })
          : $translate.instant("admissionControl.msg.DISABLE_CONFIRM_DEFAULT", {
              namespace: $sanitize(namespace)
            });
        Alertify.confirm(confirmBox).then(
          function toOK() {
            sentToggleEnablementReq(event, rule, rowNode);
          },
          function toCancel() {}
        );
      } else {
        sentToggleEnablementReq(event, rule, rowNode);
      }
    };

    $scope.toggleAction = function(action) {
      if (action) {
        let payload = {
          state: {
            enable: vm.state,
            mode: $scope.mode,
            default_action: action
          }
        };
        $http
          .patch(ADMCTL_STATE_URL, payload)
          .then(function(response) {
            $timeout(function() {
              $scope.reload($scope.admissionRules.length - 1);
            }, 2000);
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success(
              $translate.instant("admissionControl.msg.ACTION_SWITCH_OK")
            );
          })
          .catch(function(err) {
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              if (
                err.status === 500 &&
                err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
              ) {
                err = $translate.instant(
                  "admissionControl.msg.CONFIG_K8S_FAIL"
                );
              }
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.ACTION_SWITCH_NG"), false)
              );
            }
          });
      }
    };

    function sentToggleEnablementReq(event, rule, rowNode) {
      let payload = {
        config: {
          id: rule.id,
          category: KUBE,
          disable: !rule.disable,
          comment: rule.comment,
          criteria: rule.criteria,
          rule_type: rule.rule_type === "deny" ? "deny" : "exception",
          cfg_type: "user_created"
        }
      };
      let index = admissionControlService.getIndex(
        admissionControlService.admissionRules,
        rule.id
      );
      $http
        .patch(ADMISSION_SINGLE_URL, payload)
        .then(function(response) {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          if (rule.disable) {
            rule.disable = false;
            Alertify.success(
              $translate.instant("admissionControl.msg.ENABLE_OK") +
                " - ID=" +
                $sanitize(payload.config.id)
            );
          } else {
            rule.disable = true;
            Alertify.success(
              $translate.instant("admissionControl.msg.DISABLE_OK") +
                " - ID=" +
                $sanitize(payload.config.id)
            );
          }
          $timeout(() => {
            $scope.requestAdmissionRules(index);
          }, 2000);
        })
        .catch(function(e) {
          if (USER_TIMEOUT.indexOf(e.status) < 0) {
            rowNode.setSelected(true);
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            if (rule.disable) {
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.DISABLE_NG"), false)
              );
            } else {
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.ENABLE_NG"), false)
              );
            }
          }
        });
    }

    $scope.reset = function() {
      $scope.gridOptions.api.stopEditing();
      $scope.reload();
      $scope.removable = false;
    };

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    DialogController4AddEditPolicy.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "$sanitize",
      "admissionControlService",
      "ruleType",
      "SINGLE_VALUE_CRITERIA",
      "isSingleValueCriterion",
      "isEdit",
      "isViewOnly",
      "Utils"
    ];
    function DialogController4AddEditPolicy(
      $scope,
      $mdDialog,
      $translate,
      $sanitize,
      admissionControlService,
      ruleType,
      SINGLE_VALUE_CRITERIA,
      isSingleValueCriterion,
      isEdit,
      isViewOnly,
      Utils
    ) {
      let vm = this;
      const KUBE = "Kubernetes";
      const initializeCriteriaName = function() {
        $scope.names = getCriteriaName($scope.isAllowed ?
            admissionControlService.conditionExceptionOptions :
            admissionControlService.conditionDenyOptions);
      };

      $scope.isEdit = isEdit;
      $scope.isViewOnly = isViewOnly;
      $scope.hasMultiValue = false;
      $scope.isValueSetValid = true;
      $scope.conditionOptionErr = admissionControlService.conditionOptionErr;
      $scope.conditionOptionErrMSG =
        admissionControlService.conditionOptionErrMSG;
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };
      if (!$scope.conditionOptionErr) {
        activate();
      }

      if ($scope.isEdit) {
        $scope.newRule = admissionControlService.admissionRule4Edit;
        $scope.enable = !$scope.newRule.disable;
        $scope.newRule.conditions = $scope.newRule.criteria.map(
          function(criteria) {
            let isBooleanCriteria =
              criteria.name === "imageSigned" ||
              criteria.name === "runAsRoot" ||
              criteria.name === "runAsPrivileged" ||
              criteria.name === "allowPrivEscalation" ||
              criteria.name === "pspCompliance";
            let hasSubOptions =
              (
                criteria.name === "cveScoreCount" ||
                criteria.name === "cveHighCount" ||
                criteria.name === "cveHighWithFixCount" ||
                criteria.name === "cveMediumCount" ||
                criteria.name === "resourceLimit"
              ) && criteria.sub_criteria;
            if (criteria.name === "pspCompliance") {
              $scope.isPspInstructionVisible = true;
            }
            return {
              criteria: criteria,
              name: admissionControlService.admissionConditionObjToString(
                criteria,
                isBooleanCriteria,
                hasSubOptions,
                isSingleValueCriterion(criteria.name)
              )
            };
          }
        );
        console.log("$scope.newRule.conditions", $scope.newRule.conditions)
      } else {
        $scope.enable = true;
        $scope.newRule = {
          comment: "",
          conditions: [],
          actions: [],
          disable: false
        };
      }

      function getCriteriaName(options) {
        return Object.entries(options).map(
              ([name, obj]) => {
                return {
                  originalName: name,
                  displayName: Utils.parseDivideStyle(name),
                  matchSrc: obj.match_src || "",
                  hasMatchSrc: obj.match_src && obj.match_src.length > 0
                };
              }
            );
      }

      $scope.validateValueSet = function(valueSet) {
        let res = true;
        if (
          $scope.newRule.name.originalName.toLowerCase() === "imageregistry"
        ) {
          valueSet.split(",").forEach(curr => {
            let currValid = /localhost|.+\..+/gm.test(curr.trim());
            res = res && currValid;
          });
        }
        $scope.isValueSetValid = res;
      };

      function activate() {
        makeAutoCompleteList();
        $scope.isAllowed = false;
        initializeCriteriaName();
        $scope.operators = [];
        $scope.values = [];
        $scope.subNames = [];
        $scope.subOperators = [];
        $scope.subValues = [];
        $scope.pspCriteria = `${$translate.instant("admissionControl.PSP_CRITERIA")} ${admissionControlService.psp_collection.map(pspCriterion => {
          return $translate.instant(`admissionControl.names.${Utils.parseDivideStyle(pspCriterion.name).toUpperCase()}`);
        }).join(", ")}`;

        $scope.cutStringByMaxLength = function(str, itemName) {
          let cutStr = Utils.restrictLength4Autocomplete(
            str,
            parseInt($translate.instant("general.FILTER_MAX_LEN"), 10)
          );
          if (itemName === "searchTextValue") {
            vm.searchTextValue = cutStr;
          }
        };
      }

      $scope.tagRemoving = function(tag) {
        if (tag.criteria.name === "pspCompliance") {
          $scope.isPspInstructionVisible = false;
        }
      };

      $scope.showTagDetail = function(tag) {
        if (
          !$scope.newRule.name ||
          tag.criteria.name !== $scope.newRule.name.originalName
        ) {
          $scope.newRule.name = {
            originalName: tag.criteria.name,
            displayName: Utils.parseDivideStyle(tag.criteria.name)
          };
        }

        $timeout(function() {
          if (tag.criteria.sub_criteria && Array.isArray(tag.criteria.sub_criteria) && tag.criteria.sub_criteria.length > 0) {
            let tagDetails = tag.criteria.sub_criteria.map(subCriterion => {
              return {
                name: {
                  originalName: subCriterion.name,
                  displayName: Utils.parseDivideStyle(subCriterion.name)
                },
                op: subCriterion.op,
                value: subCriterion.value
              };
            });
            $scope.newRule.subNames = $scope.subNames;
            let tagDetailIndex = 0;
            $scope.newRule.subOperators = $scope.newRule.subNames.map((entryName) => {
              if (tagDetails[tagDetailIndex] && entryName.originalName === tagDetails[tagDetailIndex].name.originalName) {
                let operator = tagDetails[tagDetailIndex].op;
                tagDetailIndex++;
                return operator;
              } else {
                return undefined;
              }
            });
            tagDetailIndex = 0;
            $scope.newRule.memoryUnits = ["", "", "MB", "MB"];
            $scope.newRule.subValues = $scope.newRule.subNames.map((entryName, index) => {
              if (tagDetails[tagDetailIndex]) console.log(entryName.originalName, tagDetails[tagDetailIndex].name.originalName)
              if (tagDetails[tagDetailIndex] && entryName.originalName === tagDetails[tagDetailIndex].name.originalName) {
                tagDetailIndex++;
                if (tagDetails[tagDetailIndex - 1].name.originalName.toLowerCase().includes("memory")) {
                  let memoryString = $filter("bytes")(tagDetails[tagDetailIndex - 1].value, 2);
                  $scope.newRule.memoryUnits[index] = memoryString.substring(memoryString.length - 2, memoryString.length);
                  return memoryString.substring(0, memoryString.length - 3);
                } else {
                  return tagDetails[tagDetailIndex - 1].value;
                }
              } else {
                return undefined;
              }
            });
          }
          if (isSingleValueCriterion(tag.criteria.name)) {
            $scope.newRule.operator = `${tag.criteria.op}_SINGLE`;
          } else {
            $scope.newRule.operator = tag.criteria.op;
          }
          if ($scope.newRule.operator) {
            $scope.hasMultiValue =
              $scope.newRule.operator.toLowerCase().indexOf("contains") >= 0;
          }
          $timeout(function() {
            $scope.newRule.value = tag.criteria.value;
          }, 200);
        }, 200);
      };

      $scope.toggleType = function(isAllowed) {
        vm.searchTextValue = "";
        vm.selectedItemValue = null;
        $scope.newRule.value = null;
        $scope.newRule.name = null;
        $scope.newRule.subNames = [];
        $scope.newRule.operator = null;
        $scope.newRule.subOperators = [];
        $scope.newRule.subValues = [];
        $scope.newRule.memoryUnits = ["", "", "MB", "MB"];
        initializeCriteriaName();
        $scope.newRule.conditions = [];
        $scope.subNames = [];
        $scope.operators = [];
        $scope.subOperators = [];
        $scope.values = [];
        $scope.subValues = [];
      };

      $scope.changeName = function(name) {
        vm.searchTextValue = "";
        vm.selectedItemValue = null;
        $scope.newRule.value = null;
        $scope.newRule.operator = null;
        $scope.newRule.subNames = [];
        $scope.newRule.subOperators = [];
        $scope.newRule.subValues = [];
        $scope.newRule.memoryUnits = ["", "", "MB", "MB"];
        $scope.subNames.length = 0;
        $scope.operators = $scope.isAllowed
          ? admissionControlService.conditionExceptionOptions[
              name.originalName
            ].ops
          : admissionControlService.conditionDenyOptions[name.originalName]
              .ops;

        if ($scope.isAllowed) {
          if (admissionControlService.conditionExceptionOptions[name.originalName] &&
            admissionControlService.conditionExceptionOptions[name.originalName].sub_options) {
            $scope.subNames = getCriteriaName(
              admissionControlService
              .conditionExceptionOptions[name.originalName]
              .sub_options
            );
          }
        } else {
          if (admissionControlService.conditionDenyOptions[name.originalName] &&
            admissionControlService.conditionDenyOptions[name.originalName].sub_options) {
            $scope.subNames = getCriteriaName(
              admissionControlService
              .conditionDenyOptions[name.originalName]
              .sub_options
            );
          }
        }
        $scope.values =
          $scope.isAllowed
          ? admissionControlService.conditionExceptionOptions[
              name.originalName
            ].values || []
          : admissionControlService.conditionDenyOptions[name.originalName]
              .values || [];

        if (isSingleValueCriterion(name.originalName)) {
          $scope.operators = $scope.operators.map(function(op) {
            return `${op}_SINGLE`;
          });
        }

        $scope.hasMultiValue = false;
        if ($scope.operators.length === 1) {
          $scope.newRule.operator = $scope.operators[0];
          if ($scope.newRule.name.originalName === "imageSigned") {
            $scope.newRule.value = "false";
          }
          if (
            $scope.newRule.name.originalName === "runAsRoot" ||
            $scope.newRule.name.originalName === "runAsPrivileged" ||
            $scope.newRule.name.originalName === "allowPrivEscalation" ||
            $scope.newRule.name.originalName === "pspCompliance"
          ) {
            $scope.newRule.value = "true";
          }
        }

        $scope.subNames.forEach((subName, index) => {
          $scope.newRule.subNames[index] = $scope.subNames[index];
          $scope.changeSubNames(name, $scope.newRule.subNames[index], index);
        });

        if (
          $scope.newRule.name.originalName === "imageSigned" ||
          $scope.newRule.name.originalName === "runAsRoot" ||
          $scope.newRule.name.originalName === "runAsPrivileged" ||
          $scope.newRule.name.originalName === "allowPrivEscalation" ||
          $scope.newRule.name.originalName === "pspCompliance"
        ) {
          $scope.isBooleanCriteria = true;
        } else {
          $scope.isBooleanCriteria = false;
        }
      };

      $scope.changeSubNames = function(name, subName, index) {
        if ($scope.isAllowed) {
          if (admissionControlService.conditionExceptionOptions[name.originalName] &&
            admissionControlService.conditionExceptionOptions[name.originalName].sub_options) {
            $scope.subOperators = admissionControlService
                                  .conditionExceptionOptions[name.originalName]
                                  .sub_options[subName.originalName]
                                  .ops;
          }
        } else {
          if (admissionControlService.conditionDenyOptions[name.originalName] &&
            admissionControlService.conditionDenyOptions[name.originalName].sub_options) {
            $scope.subOperators = admissionControlService
                                  .conditionDenyOptions[name.originalName]
                                  .sub_options[subName.originalName]
                                  .ops;
          }
        }
        $scope.newRule.subOperators[index] = $scope.subOperators[index];
      };

      $scope.getSubOperatorText = function(subName, op) {
        if (subName.originalName === "publishDays") {
          return $translate.instant(`admissionControl.operators.text.${op}`);
        } else {
          return $translate.instant(`admissionControl.operators.${op}`);
        }
      };

      $scope.changeOperator = function(op) {
        $scope.hasMultiValue = op.toLowerCase().indexOf("contains") >= 0;
        if (
          $scope.newRule.name.originalName !== "imageSigned" &&
          $scope.newRule.name.originalName !== "runAsRoot" &&
          $scope.newRule.name.originalName !== "runAsPrivileged" &&
          $scope.newRule.name.originalName !== "allowPrivEscalation" &&
          $scope.newRule.name.originalName !== "pspCompliance"
        ) {
          vm.searchTextValue = "";
          vm.selectedItemValue = null;
          $scope.newRule.value = null;
        }
      };

      function makeAutoCompleteList() {
        vm.autoValues = loadAll();
        vm.selectedItemValue = null;
        vm.searchTextValue = null;
        function loadAll() {
          let allGroup = admissionControlService.groupList
            ? admissionControlService.groupList
            : [];
          return allGroup.map(function(group) {
            return {
              value: group,
              display: group
            };
          });
        }
      }

      const checkAndPushCriteria = function(name, newRule) {
        const parseValue = function(value, unit) {
          let numberVal = Number(value);
          if (isNaN(numberVal)) return "";
          switch (unit) {
            case "MB": return (numberVal * (1 << 20)).toString();
            case "GB": return (numberVal * (1 << 30)).toString();
            default: return value;
          }
        };
        let isDuplicated = false;
        $scope.newRule.conditions = $scope.newRule.conditions.filter(function(
          condition
        ) {
          return (
            condition.criteria.name !== newRule.name.originalName ||
            condition.criteria.op !== newRule.operator
          );
        });
        $scope.newRule.conditions.forEach(function(condition) {
          if (name === condition.name) isDuplicated = true;
        });
        let subCriteia = [];
        if (!isDuplicated && (newRule.subValues && newRule.subValues.some(subValue => subValue !== ""))) {
          newRule.subNames.forEach((subName, index) => {
            if (newRule.subValues[index]) {
              subCriteia.push({
                name: subName.originalName,
                op: newRule.subOperators[index],
                value: newRule.name.originalName.toLowerCase() === "resourcelimit" ?
                  parseValue(newRule.subValues[index], newRule.memoryUnits[index]) :
                  newRule.subValues[index]
              });
            }
          });
        }
        $scope.newRule.conditions.push({
          name: name,
          criteria: {
            sub_criteria: subCriteia,
            name: newRule.name.originalName,
            op: newRule.operator,
            value: newRule.value
          }
        });
      };

      vm.addCriteria = function() {
        // if ($scope.values.length === 0) {
        //   if (vm.selectedItemValue === null) {
        //     $scope.newRule.value = vm.searchTextValue;
        //   } else {
        //     $scope.newRule.value = vm.selectedItemValue.value;
        //   }
        // }
        if (isSingleValueCriterion($scope.newRule.name.originalName)) {
          $scope.newRule.operator = $scope.newRule.operator.split("_SINGLE")[0];
        }
        let name = "";
        if (
          $scope.newRule.name.originalName === "imageSigned" ||
          $scope.newRule.name.originalName === "runAsRoot" ||
          $scope.newRule.name.originalName === "runAsPrivileged" ||
          $scope.newRule.name.originalName === "allowPrivEscalation" ||
          $scope.newRule.name.originalName === "pspCompliance"
        ) {
          if ($scope.newRule.name.originalName === "pspCompliance") {
            $scope.isPspInstructionVisible = true;
          }
          name = $translate.instant(
            `admissionControl.names.${$scope.newRule.name.displayName.toUpperCase()}`
          );
          checkAndPushCriteria(name, $scope.newRule);
        } else if (
          (
            $scope.newRule.name.originalName === "cveHighCount" ||
            $scope.newRule.name.originalName === "cveHighWithFixCount" ||
            $scope.newRule.name.originalName === "cveMediumCount"
          ) && ($scope.newRule.subValues && $scope.newRule.subValues[0])
        ) {
          name = $translate.instant(
            `admissionControl.display.${Utils.parseDivideStyle(
              $scope.newRule.name.originalName
            ).toUpperCase()}_WITH_REPORT_DAYS`,
            {
              comparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${$scope.newRule.operator}`)),
              count: $scope.newRule.value
            }
          ) + " " +
          $translate.instant(
            `admissionControl.display.${Utils.parseDivideStyle(
              $scope.newRule.operator)}`,
            {
              days: $scope.newRule.subValues[0]
            }
          );
          checkAndPushCriteria(name, $scope.newRule);
        } else if ($scope.newRule.name.originalName === "cveScoreCount" && ($scope.newRule.subValues && $scope.newRule.subValues[0])) {
          name = $translate.instant(
            `admissionControl.display.${Utils.parseDivideStyle(
              $scope.newRule.name.originalName
            ).toUpperCase()}_WITH_COUNT`,
            {
              score: $scope.newRule.value,
              count: $scope.newRule.subValues[0],
              countComparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${$scope.newRule.operator}`)),
              scoreComparison: $translate.instant(`admissionControl.display.cveScore.${$scope.newRule.subOperators[0]}`)
            }
          );
          checkAndPushCriteria(name, $scope.newRule);
        } else if ($scope.newRule.name.originalName === "resourceLimit") {
          name = $translate.instant(
            `admissionControl.display.${Utils.parseDivideStyle(
              $scope.newRule.name.originalName
            ).toUpperCase()}`,
            {
              details: $scope.newRule.subNames
              .map((subName, index) => {
                console.log(subName.originalName, $scope.newRule.subOperators[index], $scope.newRule.subValues[index], $scope.newRule.memoryUnits[index])
                return `${$translate.instant(`admissionControl.names.${Utils.parseDivideStyle(subName.originalName).toUpperCase()}_S`)}${$scope.newRule.subOperators[index] ? $scope.newRule.subOperators[index] : undefined}${$scope.newRule.subValues[index] ? $scope.newRule.subValues[index] : undefined}${$scope.newRule.memoryUnits[index]}`
              })
              .filter(tag => !tag.includes("undefined"))
              .join(", ")
            }
          ).replace(/\&gt\;/g, ">").replace(/\&lt\;/g, "<");
          checkAndPushCriteria(name, $scope.newRule);
        } else {
          let value =
            $scope.newRule.value.length > 30
              ? `${$scope.newRule.value.substring(0, 30)}...`
              : $scope.newRule.value;
          value =
            $scope.newRule.operator.toLowerCase().indexOf("contains") >= 0
              ? `[${value}]`
              : value;
          name = `${$translate.instant(
            `admissionControl.names.${$scope.newRule.name.displayName.toUpperCase()}`
          )} ${$translate.instant(
            `admissionControl.operators.${
              isSingleValueCriterion($scope.newRule.name.originalName)
                ? `${$scope.newRule.operator.toUpperCase()}_SINGLE`
                : $scope.newRule.operator.toUpperCase()
            }`
          )} ${value}`;
          checkAndPushCriteria(name, $scope.newRule);
        }
        vm.searchTextValue = "";
        vm.selectedItemValue = null;
        $scope.newRule.value = null;
        $scope.newRule.name = null;
        $scope.newRule.operator = null;
        $scope.subNames.length = 0;
        $scope.operators = [];
        $scope.values = [];
        $scope.hasMultiValue = false;
        $scope.isBooleanCriteria = false;
      };

      $scope.decimal = /^([0-9]+\.?[0-9]*|\.[0-9]+)$/;

      //
      $scope.addEditRule = function(ev) {
        $scope.newRule.disable = !$scope.enable;

        let payload = {
          config: {
            id: $scope.isEdit ? $scope.newRule.id : 0,
            category: KUBE,
            comment: $scope.newRule.comment,
            criteria: $scope.newRule.conditions.map(function(condition) {
              return condition.criteria;
            }),
            disable: $scope.newRule.disable,
            rule_type: $scope.isAllowed ? "exception" : "deny",
            cfg_type: CFG_TYPE.CUSTOMER
          }
        };

        if ($scope.isEdit) {
          $http
            .patch(ADMISSION_SINGLE_URL, payload)
            .then(function(response) {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success(
                $translate.instant("admissionControl.msg.UPDATE_OK") +
                  " - ID=" +
                  $sanitize(payload.config.id)
              );
            })
            .catch(function(e) {
              if (USER_TIMEOUT.indexOf(e.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                console.log(e.data);
                Alertify.error(
                  Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.UPDATE_NG"), false)
                );
              }
            });
        } else {
          $http
            .post(ADMISSION_SINGLE_URL, payload)
            .then(function(response) {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success(
                $translate.instant("admissionControl.msg.INSERT_OK")
              );
            })
            .catch(function(e) {
              console.warn(e);
              if (USER_TIMEOUT.indexOf(e.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(e,  $translate.instant("admissionControl.msg.INSERT_NG"), false)
                );
              }
            });
        }
        $mdDialog.hide();
        $scope.isPspInstructionVisible = false;
      };
    }
  }

  DialogController4GlobalActions.$inject = [
    "$scope",
    "$mdDialog",
    "$translate",
    "$http",
    "$timeout",
    "Utils",
    "Alertify",
    "enable",
    "isProtectMode",
    "default_action",
    "adm_client_mode_options",
    "adm_client_mode",
    "INTERNAL_ERR_CODE",
    "reload"
  ];

  function DialogController4GlobalActions(
    $scope,
    $mdDialog,
    $translate,
    $http,
    $timeout,
    Utils,
    Alertify,
    enable,
    isProtectMode,
    default_action,
    adm_client_mode_options,
    adm_client_mode,
    INTERNAL_ERR_CODE,
    reload
  ) {
    let vm = this;
    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    };
    $scope.copied = {
      service: false,
      url: false
    };
    $scope.isTesting = false;
    $scope.submitClientMode = function(form) {
      let payload = {
        state: {
          enable: enable,
          mode: isProtectMode ? "protect" : "monitor",
          default_action: default_action,
          adm_client_mode: vm.adm_client_mode,
          adm_client_mode_options: adm_client_mode_options
        }
      };
      $http
        .patch(ADMCTL_STATE_URL, payload)
        .then(function(response) {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          Alertify.success(
            $translate.instant("admissionControl.msg.CLIENT_MODE_SWITCH_OK")
          );
          reload();
          form.$setPristine(true);
        })
        .catch(function(err) {
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            if (
              err.status === 500 &&
              err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
            ) {
              err = $translate.instant(
                "admissionControl.msg.CONFIG_K8S_FAIL"
              );
            }
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.CLIENT_MODE_SWITCH_NG"), false)
            );
            $timeout(function() {
              $scope.isProtect = !isProtect;
              $scope.$apply();
            }, 4000);
          }
        });
    };

    $scope.success = function(mode) {
      $scope.copied[mode] = true;
      setTimeout(function() {
        $scope.copied[mode] = false;
        $scope.$apply();
      }, 3000);
    };

    $scope.testK8s = function() {
      if (vm.clientModeForm.$dirty || $scope.isTesting) return;
      $scope.isK8sTestErr = false;
      $scope.isK8sTestOK = false;
      $scope.isTesting = true;
      $http
        .get(ADM_CTRL_K8S_TEST)
        .then(function(response) {
          $scope.isK8sTestOK = true;
          $scope.isTesting = false;
        })
        .catch(function(error) {
          console.log(error);
          $scope.isTesting = false;
          $scope.isK8sTestErr = true;
          if (error.status === 404) {
            switch (error.data.code) {
              case INTERNAL_ERR_CODE.CLUSTER_ROLE_NOT_CONFIG:
                $scope.testErrMsg = $translate.instant(
                  "partner.admissionControl.msg.CLUSTER_ROLE_NOT_CONFIG"
                );
                break;
              case INTERNAL_ERR_CODE.WEBHOOK_NOT_CONFIG:
                $scope.testErrMsg = $translate.instant(
                  "partner.admissionControl.msg.WEBHOOK_NOT_CONFIG"
                );
                break;
              case INTERNAL_ERR_CODE.NO_UPD_PROMISSION:
                $scope.testErrMsg = $translate.instant(
                  "partner.admissionControl.msg.NO_UPD_PROMISSION"
                );
                break;
              case INTERNAL_ERR_CODE.ERR_SRV2WEBHOOK:
                $scope.testErrMsg = $translate.instant(
                  "admissionControl.msg.ERR_SRV2WEBHOOK"
                );
                break;
              default:
                $scope.testErrMsg = Utils.getErrorMessage(error);
            }
          } else {
            $scope.testErrMsg = Utils.getErrorMessage(error);
          }
        });
    };

    activate();
    function activate() {
      $scope.isProtect = isProtectMode;
      $scope.adm_client_mode_options = adm_client_mode_options;
      vm.adm_client_mode = adm_client_mode;
    }
  }


  DialogController4MatchingTest.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$mdDialog",
    "$timeout",
    "$sanitize",
    "$interval",
    "Utils",
    "Alertify",
    "$translate",
    "FileUploader",
    "FileSaver",
    "admissionControlService"
  ];
  function DialogController4MatchingTest(
    $rootScope,
    $scope,
    $http,
    $mdDialog,
    $timeout,
    $sanitize,
    $interval,
    Utils,
    Alertify,
    $translate,
    FileUploader,
    FileSaver,
    admissionControlService
  ) {
    $scope.worker = null;
    let testResult = null;
    let timer = null;

    $scope.cancel = function() {
      if (timer) $interval.cancel(timer);
      $scope.pdfBlob = null;
      if ($scope.worker) {
        $scope.worker.terminate();
      }
      $mdDialog.cancel();
    };

    activate();

    const run = function(fn) {
      try {
        return new Worker(URL.createObjectURL(new Blob(["(" + fn + ")()"])));
      } catch (err) {
        console.log(err);
      }
    }

    const drawReport = function(docDefinition) {
      $scope.isPdfPreparing = true;
      const showProgress = (function(self) {
        return function(progress) {
          if (Math.floor(progress * 100000) % 1000 === 0) {
            self.postMessage({ progress: progress });
          }
        };
      })(self);
      let report = pdfMake.createPdf(docDefinition);

      report.getBlob(
        function(blob) {
          $scope.isPdfPreparing = false;
          FileSaver.saveAs(
            blob,
            `${$translate.instant("admissionControl.matchingTestGrid.REPORT_TITLE")}_${Utils.parseDatetimeStr(new Date())}.pdf`
          );
        },
        { progressCallback: showProgress }
      );
    };

    const _formatContent = function(docData) {
      let metadata = docData.metadata;
      let images = docData.images;
      console.log("docData", docData);

      let docDefinition = {
        info: {
          title: metadata.others.reportTitle,
          author: "NeuVector",
          subject: "Admission Control Matching Test Report",
          keywords: "admission test"
        },
        headerData: {
          text: metadata.others.headerText,
          alignment: "center",
          italics: true,
          style: "pageHeader"
        },
        footerData: {
          line: {
            image: images.FOOTER_LINE,
            width: 650,
            height: 1,
            margin: [50, 5, 0, 10]
          },
          text: metadata.others.footerText
        },
        header: function(currentPage) {
          if (currentPage === 2 || currentPage === 3) {
            return {
              text: metadata.others.headerText,
              alignment: "center",
              italics: true,
              style: "pageHeader"
            };
          }
        },
        footer: function(currentPage) {
          if (currentPage > 1) {
            return {
              stack: [
                {
                  image: images.FOOTER_LINE,
                  width: 650,
                  height: 1,
                  margin: [50, 5, 0, 10]
                },
                {
                  text: [
                    { text: metadata.others.footerText, italics: true },
                    { text: " |   " + currentPage }
                  ],
                  alignment: "right",
                  style: "pageFooter"
                }
              ]
            };
          }
        },
        pageSize: "LETTER",
        pageOrientation: "landscape",
        pageMargins: [50, 50, 50, 45],
        defaultStyle: {
          fontSize: 7,
          columnGap: 10
        },
        content: [
          {
            image: images.BACKGROUND,
            width: 1000,
            absolutePosition: { x: 0, y: 300 }
          },
          {
            image: images.ABSTRACT,
            width: 450
          },
          {
            image: images[metadata.others.logoName],
            width: 400,
            absolutePosition: { x: 350, y: 180 }
          },
          {
            text: metadata.others.reportTitle,
            fontSize: 34,
            color: "#777",
            bold: true,
            absolutePosition: { x: 150, y: 450 },
            pageBreak: "after"
          },
          {
            toc: {
              title: {
                text: metadata.others.reportTitle,
                style: "tocTitle"
              },
              numberStyle: "tocNumber"
            },
            margin: [60, 35, 20, 60],
            pageBreak: "after"
          },
          {
            text: [
              {
                text: "Test Result",
                style: "contentHeader",
                tocItem: true,
                tocStyle: {
                  fontSize: 16,
                  bold: true,
                  color: "#4863A0",
                  margin: [80, 15, 0, 60]
                }
              }
            ]
          },
          {
            text: [
              {
                text: `${metadata.unavailableProp}: `,
                style: "content",
              },
              {
                text: docData.data.props_unavailable.join(", "),
                color: "#4863A0",
                fontSize: 10
              }
            ],
            margin: [0, 10, 5, 5]
          },
          {
            style: "tableExample",
            table: {
              headerRows: 1,
              dontBreakRows: false,
              widths: ["6%", "8%", "10%", "6%", "70%"],
              body: [
                [
                  { text: metadata.trHeader.index, style: "tableHeader" },
                  { text: metadata.trHeader.kind, style: "tableHeader" },
                  { text: metadata.trHeader.name, style: "tableHeader" },
                  { text: metadata.trHeader.allowed, style: "tableHeader" },
                  { text: metadata.trHeader.msg, style: "tableHeader" }
                ]
              ]
            }
          }
        ],
        styles: {
          pageHeader: {
            fontSize: 14,
            italic: true,
            bold: true,
            color: "grey",
            margin: [0, 10, 5, 5]
          },
          pageFooter: {
            fontSize: 12,
            color: "grey",
            margin: [0, 5, 55, 5]
          },
          pageFooterImage: {
            width: 750,
            height: 1,
            margin: [50, 5, 10, 10]
          },
          tocTitle: {
            fontSize: 22,
            color: "#566D7E",
            lineHeight: 2
          },
          tocNumber: {
            italics: true,
            fontSize: 15
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            alignment: "center"
          },
          contentHeader: {
            fontSize: 16,
            bold: true,
            color: "#3090C7",
            margin: [0, 10, 0, 10]
          },
          contentSubHeader: {
            fontSize: 14,
            bold: true,
            color: "black",
            margin: [0, 10, 0, 10]
          },
          content: {
            fontSize: 10,
            margin: [5, 5, 5, 5]
          },
          title: {
            bold: true,
            fontSize: 8
          },
          subTitle: {
            bold: true,
            fontSize: 7
          },
          success: {
            bold: true,
            color: "#64a150",
            fontSize: 8
          },
          error: {
            bold: true,
            color: "#e91e63",
            fontSize: 8
          }
        }
      };

      const _getRowData = function(item) {
        let index = item.index;
        let kind = item.kind;
        let name = item.name
        let allowed = item.allowed ? {text: "Allowed", style: "success"} : {text: "Denied", style: "error"};
        let msg = item.message
        return [index, kind, name, allowed, msg];
      };

      if (docData.data.results.length > 0) {
        for (let item of docData.data.results) {
          docDefinition.content[7].table.body.push(
            _getRowData(item)
          );
        }
      }

      console.log("docDefinition: ", docDefinition);

      return docDefinition;
    };

    const _getI18NMessages = function() {
      return {
        title: $translate.instant("admissionControl.matchingTestGrid.TITLE", {}, "", "en"),
        unavailableProp: $translate.instant("admissionControl.matchingTestGrid.UNAVAILABLE_PROP", {}, "", "en"),
        trHeader: {
          index: $translate.instant(
            "admissionControl.matchingTestGrid.INDEX",
            {},
            "",
            "en"
          ),
          kind: $translate.instant(
            "admissionControl.matchingTestGrid.KIND",
            {},
            "",
            "en"
          ),
          name: $translate.instant(
            "admissionControl.matchingTestGrid.NAME",
            {},
            "",
            "en"
          ),
          allowed: $translate.instant(
            "admissionControl.matchingTestGrid.ALLOWED",
            {},
            "",
            "en"
          ),
          msg: $translate.instant(
            "admissionControl.matchingTestGrid.MSG",
            {},
            "",
            "en"
          )
        },
        data: {
          denied: $translate.instant("securityEvent.DENY", {}, "", "en")
        },
        others: {
          logoName: $translate.instant("partner.general.LOGO_NAME", {}, "", "en"),
          reportTitle: $translate.instant("admissionControl.matchingTestGrid.REPORT_TITLE", {}, "", "en"),
          topVulnerableImages: $translate.instant(
            "scan.report.others.TOP_VULNERABLE_IMAGES",
            {},
            "",
            "en"
          ),
          footerText: $translate.instant(
            "containers.report.footer",
            {},
            "",
            "en"
          ),
          headerText: $translate.instant(
            "partner.containers.report.header",
            {},
            "",
            "en"
          )
        }
      };
    };

    const testReportServer = function() {
      let dateStart = new Date();
      console.log("Worker is starting...", dateStart.toTimeString());
      const showProgress = (function(self) {
        return function(progress) {
          if (Math.floor(progress * 100000) % 1000 === 0) {
            self.postMessage({ progress: progress });
          }
        };
      })(self);
      self.onmessage = event => {
        let docDefinition = JSON.parse(event.data);

        docDefinition.header = function(currentPage) {
          if (currentPage === 2 || currentPage === 3) {
            return docDefinition.headerData;
          }
        };

        docDefinition.footer = function(currentPage) {
          if (currentPage > 1) {
            return {
              stack: [
                docDefinition.footerData.line,
                {
                  text: [
                    { text: docDefinition.footerData.text, italics: true },
                    { text: " |   " + currentPage }
                  ],
                  alignment: "right",
                  style: "pageFooter"
                }
              ]
            };
          }
        };

        const drawReportInWebWorker = function(docDefinition) {
          let baseURL = event.srcElement.origin;
          self.importScripts(
            baseURL + "/vendor/pdfmake/build/pdfmake.js",
            baseURL + "/vendor/pdfmake/build/vfs_fonts.js"
          );

          let report = pdfMake.createPdf(docDefinition);

          report.getBlob(
            function(blob) {
              let dateEnd = new Date();
              console.log("Worker is end...", dateEnd.toTimeString());
              self.postMessage({ blob: blob, progress: 1 });
              self.close();
            },
            { progressCallback: showProgress }
          );
        };
        drawReportInWebWorker(docDefinition);
      };
    };

    const testReportClient = function(testResult) {
      $scope.pdfBlob = null;
      $scope.progress = 0;
      if ($scope.worker) {
        $scope.worker.terminate();
        console.info("killed an existing running worker...");
      }
      $scope.worker = run(testReportServer);
      if ($scope.worker) {
        if (testResult) {
          let docData = Object.assign(
            {},
            {data: testResult},
            {metadata: _getI18NMessages()},
            {images: imageMap}
          );
          console.log("Post message to worker...", testResult);
          $scope.worker.postMessage(
            JSON.stringify(_formatContent(docData))
          );
        } else {
          console.warn("no data in admission control matching test.");
        }
        $scope.worker.onmessage = event => {
          $scope.pdfBlob = event.data.blob;
          $scope.progress = Math.floor(event.data.progress * 100);
          $scope.$apply();
        };
      } else {
        $scope.progress = 100;
      }
    };

    function activate() {
      $scope.gridOptions4MatchingTest = admissionControlService.setGrid();
      $scope.status = 0;

      $scope.hideResult = function() {
        $scope.status = 0;
        $scope.yamlFile = "";
      };

      $scope.downloadPdf = function() {
        $scope.isPdfPreparing = true;
        if ($scope.worker) {
          $interval.cancel(timer);
          timer = $interval(function() {
            if ($scope.pdfBlob) {
              $scope.isPdfPreparing = false;
              FileSaver.saveAs(
                $scope.pdfBlob,
                `${$translate.instant("admissionControl.matchingTestGrid.REPORT_TITLE")}_${Utils.parseDatetimeStr(new Date())}.pdf`
              );
              $interval.cancel(timer);
            }
          }, 1000);
        } else {
          let docData = Object.assign(
            {},
            {data: testResult},
            {metadata: _getI18NMessages()},
            {images: imageMap}
          );
          let docDefinition = _formatContent(docData);
          drawReport(docDefinition);
        }
      };

      $scope.exportCsv = function() {
        if (testResult) {
          let csv = Utils.arrayToCsv(testResult.results, `${$translate.instant("admissionControl.matchingTestGrid.UNAVAILABLE_PROP")}: ${testResult.props_unavailable.join(", ")}`);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(blob, `${$translate.instant("admissionControl.matchingTestGrid.REPORT_TITLE")}_${Utils.parseDatetimeStr(new Date())}.csv`);
        }
      };

      let uploader = ($scope.uploader = new FileUploader({
        url: ADMISSION_TEST_URL,
        alias: "matchingTest",
        queueLimit: 1,
        headers: {
          Token: $rootScope.user.token.token,
          Accept: "application/octet-stream"
        }
      }));

      $scope.resetFileInput = function() {
        $scope.isFileInputDestroyed = true;
        $scope.status = "";
        $scope.percentage = 0;
        $timeout(() => {
          $scope.isFileInputDestroyed = false;
        }, 100);
      };

      //FILTERS
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
      ) {
        uploader.clearQueue();
        uploader.addToQueue(item, filter, options);
        $scope.status = "";
        $scope.percentage = 0;
      };
      uploader.onAfterAddingFile = function (fileItem) {};
      uploader.onAfterAddingAll = function (addedFileItems) {};
      uploader.onBeforeUploadItem = function (item) {};
      uploader.onProgressItem = function (fileItem, progress) {};
      uploader.onProgressAll = function (progress) {};
      uploader.onSuccessItem = function (fileItem, response, status, headers) {
          $scope.status = status;
          $scope.percentage = 100;
          $scope.propUnavailable = response.props_unavailable.join(", ");
          $timeout(() => {
            $scope.gridOptions4MatchingTest.api.setRowData(response.results);
            testResult = response;
            testReportClient(response);
          }, 200);
      };
      uploader.onErrorItem = function (fileItem, response, status, headers) {
        $scope.status = status;
        $scope.errMsg = Utils.getAlertifyMsg(response.message, $translate.instant("setting.IMPORT_FAILED"), false);
        $scope.percentage = 0;
        if (status !== USER_TIMEOUT) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            $scope.errMsg
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
    }
    $scope.$on("$destroy", function() {
      $interval.cancel(timer);
      $scope.pdfBlob = null;
      if ($scope.worker) {
        $scope.worker.terminate();
      }
    });
  }

  DialogController4Export.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$mdDialog",
    "$timeout",
    "$sanitize",
    "$interval",
    "Utils",
    "Alertify",
    "$translate",
    "FileUploader",
    "FileSaver",
    "selectedAdmissionRules",
    "GLOBAL"
  ];
  function DialogController4Export(
    $rootScope,
    $scope,
    $http,
    $mdDialog,
    $timeout,
    $sanitize,
    $interval,
    Utils,
    Alertify,
    $translate,
    FileUploader,
    FileSaver,
    selectedAdmissionRules,
    GLOBAL
  ) {
    $scope.isConfigSelected = false;
    $scope.isExcludeDefaultRules = false;
    if (selectedAdmissionRules && Array.isArray(selectedAdmissionRules) && selectedAdmissionRules.length > 0) {
      let defaultRules = selectedAdmissionRules.filter(rule => rule.critical);
      $scope.isDefaultRulesSelected = defaultRules.length > 0;
      $scope.isRegularRulesSelected = selectedAdmissionRules.length - defaultRules.length > 0;
    } else {
      $scope.isRegularRulesSelected = false;
      $scope.isDefaultRulesSelected = false;
    }

    $scope.selectedAdmissionRulesCnt = selectedAdmissionRules ? selectedAdmissionRules.length : 0;

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.downloadAdmCtrl = function() {
      let selectedIds = [];
      let selectedRules = [];

      if (selectedAdmissionRules && Array.isArray(selectedAdmissionRules)) {
        if ($scope.isExcludeDefaultRules) {
          selectedRules = selectedAdmissionRules.filter(rule => !rule.critical && rule.category !== GLOBAL);
        } else {
          selectedRules = selectedAdmissionRules.filter(rule => rule.category !== GLOBAL);
        }
      }

      selectedIds = selectedRules ? selectedRules.map(rule => rule.id) : [];

      let payload = {
        ids: selectedIds.filter(id => id !== ""),
        export_config: $scope.isConfigSelected
      }

      $http
        .post(EXPORT_ADM_CTRL, payload)
        .then((res) => {
          let fileName = res
            .headers("Content-Disposition")
            .split("=")[1]
            .trim()
            .split(".");
          let yamlContent = res.data;
          let exportedFileName = `${fileName[0]}_${Utils.parseDatetimeStr(new Date())}.${fileName[1]}`;
          let blob = new Blob([yamlContent], {
            type: "text/plain;charset=utf-8"
          });
          FileSaver.saveAs(blob, exportedFileName);
          $mdDialog.hide();
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.success($translate.instant("admissionControl.msg.EXPORT_OK"));
        })
        .catch((err) => {
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            console.log(err.data);
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.EXPORT_NG"), false)
            );
          }
        })
    };
  }

  DialogController4Import.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$mdDialog",
    "$timeout",
    "$sanitize",
    "$interval",
    "$window",
    "Utils",
    "Alertify",
    "$translate",
    "FileUploader",
    "reload"
  ];
  function DialogController4Import(
    $rootScope,
    $scope,
    $http,
    $mdDialog,
    $timeout,
    $sanitize,
    $interval,
    $window,
    Utils,
    Alertify,
    $translate,
    FileUploader,
    reload
  ) {
    let token = JSON.parse($window.sessionStorage.getItem("token"));
    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    const finishImport = function(res) {
      $scope.percentage = res.data.percentage;
      $scope.status = res.data.status;

      if ($scope.status === "done") {
        Alertify.set({ delay: 8000 });
        Alertify.success(
          $translate.instant("admissionControl.msg.IMPORT_FINISH")
        );
        $timeout(() => {
          reload();
        }, 1000);
      } else {
        $scope.status = Utils.getAlertifyMsg($scope.status, $translate.instant("admissionControl.msg.IMPORT_FAILED"), false);
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
            IMPORT_ADM_CTRL,
            tempToken,
            {
              headers: {
                Token: token.token.token,
                "X-Transaction-Id": params.transactionId
              }
            }
          )
          .then((res) => {
            if (res.status === 200) {
              finishImport(res.data);
            } else if (res.status === 206) {
              let transactionId = res.data.data.tid;
              $scope.percentage = res.data.data.percentage;
              $scope.status = res.data.data.status;
              getImportProgressInfo(
                {
                  transactionId,
                  tempToken,
                  percentage: $scope.percentage
                }
              );
            }
          })
          .catch((err) => {
            console.warn(err);
            $scope.status = Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.IMPORT_FAILED"), false);
            if (status !== USER_TIMEOUT) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                $scope.status
              );
            }
          });
        }
    };

    let uploader = ($scope.uploader = new FileUploader({
      url: IMPORT_ADM_CTRL,
      alias: "ImportAdmission",
      queueLimit: 1,
      headers: {
        Token: $rootScope.user.token.token,
        Accept: "application/octet-stream"
      }
    }));
    $scope.resetFileInput = function() {
      $scope.isFileInputDestroyed = true;
      $scope.status = "";
      $scope.percentage = 0;
      $timeout(() => {
        $scope.isFileInputDestroyed = false;
      }, 100);
    };

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
    ) {
      uploader.clearQueue();
      uploader.addToQueue(item, filter, options);
      $scope.status = "";
      $scope.percentage = 0;
    };
    uploader.onAfterAddingFile = function (fileItem) {};
    uploader.onAfterAddingAll = function (addedFileItems) {};
    uploader.onBeforeUploadItem = function (item) {};
    uploader.onProgressItem = function (fileItem, progress) {};
    uploader.onProgressAll = function (progress) {};
    uploader.onSuccessItem = function (fileItem, response, status, headers) {
      if (status === 200) {
        finishImport(response);
      } else if (status === 206) {
        let transactionId = response.data.tid;
        let tempToken = response.data.temp_token;
        $scope.percentage = response.data.percentage;
        $scope.status = response.data.status;

        getImportProgressInfo(
          {
            transactionId,
            tempToken,
            percentage: $scope.percentage
          }
        );
      }
    };
    uploader.onErrorItem = function (fileItem, response, status, headers) {
      $scope.status = status;
      $scope.errMsg = Utils.getAlertifyMsg(response.message, $translate.instant("admissionControl.msg.IMPORT_FAILED"), false);
      $scope.percentage = 0;
      if (status !== USER_TIMEOUT) {
        Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
        Alertify.error(
          $scope.errMsg
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
  }
})();
