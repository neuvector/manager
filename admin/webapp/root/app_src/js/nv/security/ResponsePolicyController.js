(function() {
  "use strict";
  angular
    .module("app.assets")
    .controller("ResponsePolicyController", ResponsePolicyController);
  ResponsePolicyController.$inject = [
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
    "responseRulesService",
    "$controller",
    "$sanitize",
    "AuthorizationFactory"
  ];
  function ResponsePolicyController(
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
    responseRulesService,
    $controller,
    $sanitize,
    AuthorizationFactory
  ) {
    $scope.rules = [];
    responseRulesService.groupList = [];
    responseRulesService.actions = ["quarantine", "webhook", "suppress-log"];
    responseRulesService.actions4Event = ["webhook", "suppress-log"];
    responseRulesService.conditionPatternSample = {
      "security-event": "level:Critical, name:Container.Suspicious.Process",
      "cve-report":
        "name:Container.Scan.Report, cve-name:cve-2018-12345, cve-high:1, cve-medium:1",
      event: "name:Container.Stop, level:Emergency",
      compliance: "level:Warning, name:D.5.4, name:Compliance.Image.Violation",
      "admission-control":
        "name:Admission.Control.Allowed, name:Admission.Control.Denied"
    };
    $scope.graphHeight = $window.innerHeight - 240;
    angular.element($window).bind("resize", function() {
      $scope.graphHeight = $window.innerHeight - 240;
      $scope.$digest();
    });
    $scope.isWriteResponseRuleAuthorized = AuthorizationFactory.getDisplayFlag("write_response_rule");
    responseRulesService.categories =
      $scope.summary.platform.toLowerCase().indexOf(KUBE) >= 0
        ? [
            "security-event",
            "event",
            "cve-report",
            "compliance",
            "admission-control"
          ]
        : ["security-event", "event", "cve-report", "compliance"];
    let filter = "";
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
          headerName: $translate.instant("responsePolicy.gridHeader.ID"),
          field: "id",
          width: 60,
          minWidth: 60,
          maxWidth: 60
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.TYPE"),
          field: "event",
          cellRenderer: eventRenderFunc,
          width: 105,
          minWidth: 105,
          maxWidth: 105
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.GROUP"),
          field: "group",
          cellRenderer: function(params) {
            if (params.value) {
              return `<div style="word-wrap: break-word;">${$sanitize(
                params.value
              )}</div>`;
            }
          },
          cellClass: ["wrap-word-in-cell"],
          width: 200
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.CRITERIA"),
          field: "conditions",
          cellRenderer: function(params) {
            if (params.value) {
              return `<div style="word-wrap: break-word;">${$sanitize(
                params.value
              )}</div>`;
            }
          },
          cellClass: ["wrap-word-in-cell"],
          width: 430
        },
        {
          headerName: $translate.instant("responsePolicy.gridHeader.ACTION"),
          field: "actions",
          cellRenderer: actionRenderFunc,
          width: 220
        },
        {
          headerName: $translate.instant("policy.gridHeader.TYPE"),
          field: "cfg_type",
          cellRenderer: typeRenderFunc,
          cellClass: "grid-center-align",
          width: 90,
          minWidth: 90,
          maxWidth: 90
        },
        {
          cellRenderer: actionsRenderFunc,
          cellClass: "grid-right-align",
          suppressSorting: true,
          width: 123,
          maxWidth: 123,
          minWidth: 123
        }
      ];

      function typeRenderFunc(params) {
        if (params && params.value) {
          let type = params.data.disable
            ? colourMap["disabled-rule"]
            : colourMap[params.value.toUpperCase()];
          return `<div class="action-label nv-label ${type}">${$sanitize(
            $translate.instant(`group.${params.value.toUpperCase()}`)
          )}</div>`;
        }
      }
      function eventRenderFunc(params) {
        return (
          '<div class="type-label type-label-lg ' +
          (params.data.disable
            ? colourMap["disabled_background"]
            : colourMap[params.data.event.toLowerCase()]) +
          '">' +
          $sanitize(
            $translate.instant(
              "responsePolicy.categories." + params.data.event.toUpperCase()
            )
          ) +
          "</div>"
        );
      }
      function actionRenderFunc(params) {
        let actions = "";
        params.data.actions.forEach(action => {
          actions +=
            '<div style="display: table; margin: 2px 2px; float: left"><div class="resp-rule-action-label ' +
            (params.data.disable
              ? colourMap["disabled_color"]
              : colourMap[action.toLowerCase()]) +
            '">' +
            $sanitize(
              $translate.instant(
                "responsePolicy.actions." + action.toUpperCase()
              )
            ) +
            "</div></div>";
        });
        return actions;
      }
      function actionsRenderFunc(params) {
        if (params && params.data.cfg_type !== CFG_TYPE.FED &&
            params.data.cfg_type !== CFG_TYPE.GROUND &&
            $scope.isWriteResponseRuleAuthorized
          ) {
          return (
            '<div class="rule-actions-expand fade-in-right">' +
            '       <em class="fa fa-edit fa-lg mr-sm text-action"' +
            '         ng-click="editPolicy($event, data.id)" uib-tooltip="{{\'policy.TIP.EDIT\' | translate}}">' +
            "       </em>" +
            '       <em class="fa fa-plus-circle fa-lg mr-sm text-action" ' +
            '         ng-click="addPolicy($event, data.id)" uib-tooltip="{{\'policy.TIP.ADD\' | translate}}">' +
            "       </em>" +
            '       <em class="fa fa-times fa-lg mr-sm text-action" ng-if="!data.disable"' +
            '         ng-click="toggleRuleItem($event, data)" uib-tooltip="{{\'policy.TIP.DISABLE\' | translate}}">' +
            "       </em>" +
            '       <em class="fa fa-check fa-lg mr-sm text-action" ng-if="data.disable"' +
            '         ng-click="toggleRuleItem($event, data)" uib-tooltip="{{\'policy.TIP.ENABLE\' | translate}}">' +
            "       </em>" +
            '       <em class="fa fa-trash fa-lg mr-sm text-action" ' +
            '         ng-click="deleteRuleItem($event, data.id)" uib-tooltip="{{\'policy.TIP.DELETE\' | translate}}">' +
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
            '       <em class="fa fa-newspaper-o fa-lg mr-sm text-action"' +
            '         ng-click="editPolicy($event, data.id, true)" uib-tooltip="{{\'policy.editPolicy.VIEW\' | translate}}">' +
            "       </em>" +
            "     </div>" +
            '     <div class="rule-actions-collapse">' +
            '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
            "       </em>" +
            "     </div>"
          );
        }
      }
      $scope.gridOptions = {
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
      function requestResponsePolicy() {
        $http
          .get(RESPONSE_POLICY_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            responseRulesService.rules = response.data.rules;
            $scope.rules = destructConditions(responseRulesService.rules);
            $scope.gridOptions.api.setRowData($scope.rules);
            $scope.count = `${$scope.rules.length} ${getEntityName(
              $scope.rules.length
            )}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function(error) {
            console.log(error);
            $scope.responsePolicyErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(error);
            $scope.gridOptions.api.setRowData();
          });
      }
      function requestConditionOption() {
        responseRulesService.conditionOptionErr = false;
        $http
          .get(CONDITION_OPTION_URL)
          .then(function(response) {
            $scope.conditionOptions = response.data.response_rule_options;
            $scope.webhookList = response.data.webhooks || [];
            responseRulesService.conditionOptions = angular.copy($scope.conditionOptions);
            requestResponsePolicy();
          })
          .catch(function(err) {
            console.warn(err);
            requestResponsePolicy();
            responseRulesService.conditionOptionErr = true;
            responseRulesService.conditionOptionErrMSG = Utils.getErrorMessage(
              err
            );
          });
      }
      function requestContainerGroup() {
        responseRulesService.containerGroupErr = false;
        $http
          .get(GROUP_LIST_URL, {
            params: { scope: "local", f_kind: "in,container|node" }
          })
          .then(function(response) {
            responseRulesService.groupList = response.data.groups.map(group => group.name);
            requestConditionOption();
          })
          .catch(function(err) {
            console.warn(err);
            requestConditionOption();
            responseRulesService.containerGroupErr = true;
            responseRulesService.containerGroupErrMSG = Utils.getErrorMessage(
              err
            );
          });
      }
      $scope.reload = function() {
        requestContainerGroup();
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
          filteredCount === $scope.rules.length || value === ""
            ? `${$scope.rules.length} ${getEntityName($scope.rules.length)}`
            : `${found} ${filteredCount} / ${$scope.rules.length} ${getEntityName(
                $scope.rules.length
              )}`;
      };
    }
    $scope.reload();
    $scope.addPolicy = function(ev, id) {
      let success = function() {
        $scope.index4Add = id === 0 ? 0 : getIndex(id) + 1;
        let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
          getIndex(id)
        );
        if (id !== 0) rowNode.setSelected(true);
        responseRulesService.id = id;
        $mdDialog
          .show({
            controller: DialogController4AddPolicy,
            templateUrl: "dialog.addPolicy.html",
            targetEvent: ev,
            locals: {
              originalConditionOption: $scope.conditionOptions,
              webhookList: $scope.webhookList
            }
          })
          .then(
            function() {
              $timeout(() => {
                $scope.reload();
              }, 1000);
            },
            function() {
              if (rowNode) {
                rowNode.setSelected(false);
              }
            }
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };
    function getIndex(id) {
      for (let i = 0; i < $scope.rules.length; i++) {
        if ($scope.rules[i].id === id) return i;
      }
    }
    function destructConditions(rules) {
      rules.forEach(function(rule) {
        rule.conditions = responseRulesService.conditionObjToString(
          rule.conditions
        );
      });
      return rules;
    }
    $scope.editPolicy = function(ev, id, isReadonly = false) {
      let success = function() {
        $scope.index4edit = getIndex(id);
        let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
          $scope.index4edit
        );
        rowNode.setSelected(true);
        responseRulesService.id = id;
        $mdDialog
          .show({
            controller: DialogController4EditPolicy,
            templateUrl: "dialog.editPolicy.html",
            targetEvent: ev,
            locals: {
              originalConditionOption: $scope.conditionOptions,
              webhookList: $scope.webhookList,
              isReadonly: isReadonly
            }
          })
          .then(
            function() {
              $timeout(() => {
                $scope.reload();
              }, 1000);
              rowNode.setSelected(false);
            },
            function() {
              rowNode.setSelected(false);
            }
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.deleteRuleItem = function(event, id) {
      $scope.index4delete = getIndex(id);
      let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
        $scope.index4delete
      );
      rowNode.setSelected(true);
      let confirmBox =
        $translate.instant("responsePolicy.dialog.content.REMOVE_CONFIRM") + id;
      console.log(
        $scope.rules[$scope.index4delete].actions.includes("quarantine")
      );
      if ($scope.rules[$scope.index4delete].actions.includes("quarantine")) {
        confirmBox =
          $translate.instant("responsePolicy.dialog.content.REMOVE_CONFIRM") +
          $sanitize(id) +
          '<div><input id="unquarantineRule" type="checkbox">&nbsp;&nbsp;' +
          $translate.instant("responsePolicy.dialog.UNQUARANTINE_CHECK") +
          "</div>";
      }
      Alertify.confirm(confirmBox).then(
        function toOK() {
          let el = document.getElementById("unquarantineRule");
          if (el && el.checked) {
            let payload = {
              request: {
                unquarantine: {
                  response_rule: id
                }
              }
            };
            $http
              .post(UNQUARANTINE_URL, payload)
              .then(function(response) {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success(
                  $translate.instant(
                    "responsePolicy.dialog.content.UNQUARANTINE_OK"
                  )
                );
              })
              .catch(function(e) {
                if (USER_TIMEOUT.indexOf(e.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(e, $translate.instant(
                      "responsePolicy.dialog.content.UNQUARANTINE_NG"
                    ), false)
                  );
                }
              });
          }
          $http
            .delete(`${RESPONSE_POLICY_URL}?scope=local&id=${id}`)
            .then(function(response) {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success(
                $translate.instant("responsePolicy.dialog.content.REMOVE_OK")
              );
              rowNode.setSelected(false);
              responseRulesService.rules.splice($scope.index4delete, 1);
              console.log("removed: ", responseRulesService.rules);
              $scope.rules = responseRulesService.rules;
              $scope.gridOptions.api.setRowData($scope.rules);
            })
            .catch(function(e) {
              rowNode.setSelected(false);
              if (USER_TIMEOUT.indexOf(e.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(e, $translate.instant(
                    "responsePolicy.dialog.content.REMOVE_NG"
                  ), false)
                );
              }
            });
        },
        function toCancel() {
          rowNode.setSelected(false);
        }
      );
    };
    $scope.toggleRuleItem = function(event, rule) {
      let payload = {
        config: {}
      };
      payload.config.disable = !rule.disable;
      payload.config.id = rule.id;
      payload.config.cfg_type = CFG_TYPE.CUSTOMER;
      console.log("toggle: ", rule);
      let index = getIndex(rule.id);
      responseRulesService.rules.splice(index, 1, rule);
      let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index);
      let rowNodes = [];
      rowNodes.push(rowNode);
      $scope.gridOptions.api.redrawRows({ rowNodes: rowNodes });
      console.log("toggle: ", payload);
      $http
        .patch(RESPONSE_POLICY_URL, payload)
        .then(function(response) {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          if (rule.disable) {
            rule.disable = false;
            Alertify.success(
              $translate.instant("responsePolicy.dialog.content.ENABLE_OK") +
                " - ID=" +
                $sanitize(payload.config.id)
            );
          } else {
            rule.disable = true;
            Alertify.success(
              $translate.instant("responsePolicy.dialog.content.DISABLE_OK") +
                " - ID=" +
                $sanitize(payload.config.id)
            );
          }
          $timeout(() => {
            $scope.reload();
          }, 4000);
        })
        .catch(function(e) {
          if (USER_TIMEOUT.indexOf(e.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            if (rule.disable) {
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("responsePolicy.dialog.content.DISABLE_NG"), false)
              );
            } else {
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("responsePolicy.dialog.content.ENABLE_NG"), false)
              );
            }
          }
        });
    };
    $scope.reset = function() {
      $scope.gridOptions.api.stopEditing();
      $scope.reload();
      $scope.removable = false;
    };

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    DialogController4AddPolicy.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "$sanitize",
      "responseRulesService",
      "originalConditionOption",
      "webhookList"
    ];
    function DialogController4AddPolicy(
      $scope,
      $mdDialog,
      $translate,
      $sanitize,
      responseRulesService,
      originalConditionOption,
      webhookList
    ) {
      $scope.webhookList = webhookList;
      $scope.conditionOptionErr = responseRulesService.conditionOptionErr;
      $scope.containerGroupErr = responseRulesService.containerGroupErr;
      $scope.conditionOptionErrMSG = responseRulesService.conditionOptionErrMSG;
      $scope.containerGroupErrMSG = responseRulesService.containerGroupErrMSG;
      $scope.enable = false;
      $scope.newRule = {
        group: "",
        conditions: [],
        actions: [],
        event: "security-event",
        webhooks: [],
        disable: false
      };
      $scope.needGroup = EVENT_WITHOUT_GROUP.indexOf($scope.newRule.event) === -1;
      $scope.canQuarantine = EVENT_WITHOUT_QUARANTINE.indexOf($scope.newRule.event) === -1;
      $scope.conditionHint = $translate.instant(
        "responsePolicy.dialog.content.HINT"
      );
      $scope.conditionPatternSample =
        responseRulesService.conditionPatternSample[$scope.newRule.event];
      $scope.id = responseRulesService.id;
      activate();
      function activate() {
        $scope.singleCriterion = {
          value: "",
          index: -1
        };
        $scope.conditions = [];
        makeAutoCompleteList();
        makeTypeAheadList4Editor();
        $scope.categories = responseRulesService.categories;
        $scope.actions = responseRulesService.actions;
        $scope.actions4Event = responseRulesService.actions4Event;
        $scope.hide = function() {
          $mdDialog.hide();
        };
        $scope.cancel = function() {
          $mdDialog.cancel();
        };
        $scope.cutStringByMaxLength = function(str, itemName) {
          let cuttedStr = Utils.restrictLength4Autocomplete(
            str,
            parseInt($translate.instant("general.FILTER_MAX_LEN"), 10)
          );
          if (itemName === "searchTextGroup") {
            $scope.searchTextGroup = cuttedStr;
          }
        };
      }
      $scope.changeCategory = function() {
        $scope.newRule.conditions.length = 0;
        $scope.conditionPatternSample =
          responseRulesService.conditionPatternSample[$scope.newRule.event];
        responseRulesService.conditionOptions = angular.copy(originalConditionOption);
        if ($scope.newRule.event === "compliance") {
          responseRulesService.conditionOptions[$scope.newRule.event].name.push("name:<Compliance-test-name>");
        }
        $scope.conditions = [];
        $scope.isShowingEditCriterion = false;
        initializeTagStyle();
        makeTypeAheadList4Editor();
        $scope.needGroup = EVENT_WITHOUT_GROUP.indexOf($scope.newRule.event) === -1;
        $scope.canQuarantine = EVENT_WITHOUT_QUARANTINE.indexOf($scope.newRule.event) === -1;
      };
      $scope.loadTags = function(query) {
        let name = responseRulesService.conditionOptions[$scope.newRule.event]
          .name
          ? responseRulesService.conditionOptions[$scope.newRule.event].name
          : [];
        let level = responseRulesService.conditionOptions[$scope.newRule.event]
          .level
          ? responseRulesService.conditionOptions[$scope.newRule.event].level
          : [];
        let list = name.concat(level);
        return query
          ? list.filter(responseRulesService.createFilter(query))
          : [];
      };

      const initializeTagStyle = function() {
        let allTagsElem = angular.element("ul.tag-list > li");
        for (let i = 0; i < allTagsElem.length; i++) {
          allTagsElem[i].classList.remove("selected-tag");
          allTagsElem[i].classList.add("tag-item");
        }
      };

      const initializeSpecificTagStyle = function(insertIndex) {
        let elem = angular.element("ul.tag-list > li")[insertIndex];
        elem.classList.remove("selected-tag");
        elem.classList.add("tag-item");
      };

      const setFocusedTagStyle = function(focusedIndex) {
        let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
        tagElem.classList.remove("tag-item");
        tagElem.classList.add("selected-tag");
      };

      $scope.checkDuplicated = function() {
        let elem = angular.element("#tagEditor");
        if ($scope.conditions) {
          for (let i = 0; i < $scope.conditions.length; i++) {
            if (
              $scope.singleCriterion.value === $scope.conditions[i].name &&
              $scope.singleCriterion.index !== $scope.conditions[i].index
            ) {
              elem[0].classList.remove("ng-valid");
              elem[0].classList.add("ng-invalid");
              $scope.isInvalidTag = true;
              return;
            }
          }
        }
        elem[0].classList.remove("ng-invalid");
        elem[0].classList.add("ng-valid");
        $scope.isInvalidTag = false;
      };

      $scope.preventFormSubmit = function(event) {
        if (event.which === 13) {
          event.preventDefault();
          $scope.editCriterion($scope.singleCriterion);
        }
      };

      $scope.editCriterion = function(singleCriterion) {
        if (!$scope.conditions)  $scope.conditions = [];
        let insertIndex = singleCriterion.index === -1 ? $scope.conditions.length : singleCriterion.index;
        let insertOrReplace = singleCriterion.index === -1 ? 0 : 1;
        console.log("singleCriterion.value: ", singleCriterion.value);
        $scope.conditions.splice(insertIndex, insertOrReplace, {
          name: singleCriterion.value,
          index: insertIndex
        });
        $scope.singleCriterion = {
          value: "",
          index: -1
        };
        $scope.isShowingEditCriterion = false;
        initializeSpecificTagStyle(insertIndex);
      };

      $scope.tagAdding = function(tag) {
        console.log(
          "Pattern: " +
            responseRulesService.getPattern($scope.newRule.event, originalConditionOption) +
            "\n",
          "Tag name: " + tag.name + "\n",
          "Test result: " +
            responseRulesService.getPattern($scope.newRule.event, originalConditionOption).test(tag.name)
        );
        let insertIndex = $scope.conditions.length;
        tag.index = insertIndex;
        $scope.isShowingEditCriterion = false;
        initializeTagStyle();
        return responseRulesService
          .getPattern($scope.newRule.event, originalConditionOption)
          .test(tag.name);
      };

      $scope.showTagDetail = function(tag) {
        initializeTagStyle();
        setFocusedTagStyle(tag.index);
        $scope.singleCriterion.value = tag.name;
        $scope.singleCriterion.index = tag.index;
        $scope.isShowingEditCriterion = true;
        $scope.isInvalidTag = false;
        $timeout(() => {
          let tagEditorElem = angular.element("#tagEditor");
          tagEditorElem.focus();
        }, 200);
      };

      $scope.tagRemoving = function(tag) {
        $scope.conditions.forEach(filter => {
          if (tag.index < filter.index) {
            filter.index -= 1;
          }
        });
        $timeout(() => {
          if (!$scope.conditions)  $scope.conditions = [];
          $scope.isShowingEditCriterion = false;
          initializeTagStyle();
        }, 200);
      };

      $scope.exists = function(item, list) {
        if (list && item) return list.indexOf(item) > -1;
      };
      $scope.toggle = function(item, list, source) {
        let idx = list.indexOf(item);
        if (idx > -1) {
          list.splice(idx, 1);
        } else {
          list.push(item);
        }
        if (source === "action") {
          $scope.isWebhookSelected = list.includes("webhook");
        }
      };
      function makeTypeAheadList4Editor() {
        let name = responseRulesService.conditionOptions[$scope.newRule.event]
          .name
          ? responseRulesService.conditionOptions[$scope.newRule.event].name
          : [];
        let level = responseRulesService.conditionOptions[$scope.newRule.event]
          .level
          ? responseRulesService.conditionOptions[$scope.newRule.event].level
          : [];
        $scope.conditionOptions4SingleConditionEditor = name.concat(level);
      }
      function makeAutoCompleteList() {
        let self = this;
        $scope.groups = loadAll();
        $scope.selectedItemGroup = null;
        $scope.searchTextGroup = null;
        function loadAll() {
          let allGroup = responseRulesService.groupList
            ? Utils.removeGroupExceptions(
                responseRulesService.groupList,
                "response"
              )
            : [];
          return allGroup.map(function(group) {
            return {
              value: group,
              display: group
            };
          });
        }
      }
      //
      $scope.addNewRule = function(ev, id) {
        if ($scope.enable) {
          $scope.newRule.disable = false;
        } else {
          $scope.newRule.disable = true;
        }
        if ($scope.selectedItemGroup === null) {
          $scope.newRule.group = $scope.searchTextGroup;
        } else {
          $scope.newRule.group = $scope.selectedItemGroup.value;
        }
        if ($scope.conditions && $scope.conditions.length > 0) {
          $scope.newRule.conditions = $scope.conditions.map(function(item) {
            let conditionMap = item.name.split(":");
            return {
              type: conditionMap[0].trim(),
              value: conditionMap
                .slice(1)
                .join(":")
                .trim()
            };
          });
        } else {
          $scope.newRule.conditions = [];
        }
        let payload = {
          insert: {
            after: $scope.id ? $scope.id : 0,
            rules: [$scope.newRule]
          }
        };
        $http
          .post(RESPONSE_POLICY_URL, payload)
          .then(function(response) {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success(
              $translate.instant("responsePolicy.dialog.content.INSERT_OK")
            );
          })
          .catch(function(e) {
            console.warn(e);
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("responsePolicy.dialog.content.INSERT_NG"), false)
              );
            }
          });
        $mdDialog.hide();
      };
    }
    DialogController4EditPolicy.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "responseRulesService",
      "$sanitize",
      "originalConditionOption",
      "webhookList",
      "isReadonly"
    ];
    function DialogController4EditPolicy(
      $scope,
      $mdDialog,
      $translate,
      responseRulesService,
      $sanitize,
      originalConditionOption,
      webhookList,
      isReadonly
    ) {
      $scope.isReadonly = isReadonly;
      $scope.CFG_TYPE = CFG_TYPE;
      $scope.conditionOptionErr = responseRulesService.conditionOptionErr;
      $scope.containerGroupErr = responseRulesService.containerGroupErr;
      $scope.conditionOptionErrMSG = responseRulesService.conditionOptionErrMSG;
      $scope.containerGroupErrMSG = responseRulesService.containerGroupErrMSG;
      $scope.webhookList = webhookList;
      activate();
      function activate() {
        $scope.singleCriterion = {
          value: "",
          index: -1
        };
        $scope.categories = responseRulesService.categories;
        $scope.actions = responseRulesService.actions;
        $scope.actions4Event = responseRulesService.actions4Event;
        $scope.rule = JSON.parse(
          JSON.stringify(
            responseRulesService.rules[
              responseRulesService.getIndex(
                responseRulesService.rules,
                responseRulesService.id
              )
            ]
          )
        );
        $scope.rule.webhooks = $scope.rule.webhooks || [];
        makeAutoCompleteList();
        makeTypeAheadList4Editor();
        responseRulesService.conditionOptions = angular.copy(originalConditionOption);
        if ($scope.rule.event === "compliance") {
          responseRulesService.conditionOptions[$scope.rule.event].name.push("name:<Compliance-test-name>");
        }
        $scope.searchTextGroup = $scope.rule.group ? $scope.rule.group : "";
        $scope.rule.enable = $scope.rule.disable ? !$scope.rule.disable : true;
        $scope.conditionHint = $translate.instant(
          "responsePolicy.dialog.content.HINT"
        );
        $scope.conditionPatternSample =
          responseRulesService.conditionPatternSample[$scope.rule.event];
        if (typeof $scope.rule.conditions === "string") {
          console.log(
            responseRulesService.conditionStringToTag($scope.rule.conditions)
          );
          $scope.rule.conditions = responseRulesService.conditionStringToTag(
            $scope.rule.conditions
          );
        }
        console.log($scope.rule);
        $scope.needGroup = EVENT_WITHOUT_GROUP.indexOf($scope.rule.event) === -1;
        $scope.canQuarantine = EVENT_WITHOUT_QUARANTINE.indexOf($scope.rule.event) === -1;
        if (!$scope.needGroup) {
          $scope.searchTextGroup = "";
          $scope.selectedItemGroup = null;
        }
        if (!$scope.canQuarantine) {
            if ($scope.rule.actions.includes("quarantine")) {
                $scope.rule.actions.splice(
                    $scope.rule.actions.indexOf("quarantine"),
                    1
                );
            }
            console.log($scope.rule.actions);
        }
        $scope.isWebhookSelected = $scope.rule.actions.includes("webhook");
        $scope.hide = function() {
          $mdDialog.hide();
        };
        $scope.cancel = function() {
          $mdDialog.cancel();
        };
        $scope.cutStringByMaxLength = function(str, itemName) {
          let cuttedStr = Utils.restrictLength4Autocomplete(
            str,
            parseInt($translate.instant("general.FILTER_MAX_LEN"), 10)
          );
          if (itemName === "searchTextGroup") {
            $scope.searchTextGroup = cuttedStr;
          }
        };
      }
      $scope.changeCategory = function() {
        $scope.rule.conditions.length = 0;
        $scope.conditionPatternSample =
          responseRulesService.conditionPatternSample[$scope.rule.event];
        responseRulesService.conditionOptions = angular.copy(originalConditionOption);
        if ($scope.rule.event === "compliance") {
          responseRulesService.conditionOptions[$scope.rule.event].name.push("name:<Compliance-test-name>");
        }
        $scope.isShowingEditCriterion = false;
        initializeTagStyle();
        makeTypeAheadList4Editor();
        console.log("conditionOptions4SingleConditionEditor:", conditionOptions4SingleConditionEditor);
        $scope.needGroup = EVENT_WITHOUT_GROUP.indexOf($scope.rule.event) === -1;
        $scope.canQuarantine = EVENT_WITHOUT_QUARANTINE.indexOf($scope.rule.event) === -1;
        if (!$scope.needGroup) {
          $scope.searchTextGroup = "";
          $scope.selectedItemGroup = null;
        }
        if (!$scope.canQuarantine) {
            if ($scope.rule.actions.includes("quarantine")) {
                $scope.rule.actions.splice(
                    $scope.rule.actions.indexOf("quarantine"),
                    1
                );
            }
            console.log($scope.rule.actions);
        }
      };
      $scope.loadTags = function(query) {
        let name = responseRulesService.conditionOptions[$scope.rule.event]
          .name
          ? responseRulesService.conditionOptions[$scope.rule.event].name
          : [];
        let level = responseRulesService.conditionOptions[$scope.rule.event]
          .level
          ? responseRulesService.conditionOptions[$scope.rule.event].level
          : [];
        let list = name.concat(level);
        return query
          ? list.filter(responseRulesService.createFilter(query))
          : [];
      };

      const initializeTagStyle = function() {
        let allTagsElem = angular.element("ul.tag-list > li");
        for (let i = 0; i < allTagsElem.length; i++) {
          allTagsElem[i].classList.remove("selected-tag");
          allTagsElem[i].classList.add("tag-item");
        }
      };

      const initializeSpecificTagStyle = function(insertIndex) {
        let elem = angular.element("ul.tag-list > li")[insertIndex];
        elem.classList.remove("selected-tag");
        elem.classList.add("tag-item");
      };

      const setFocusedTagStyle = function(focusedIndex) {
        let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
        tagElem.classList.remove("tag-item");
        tagElem.classList.add("selected-tag");
      };

      $scope.checkDuplicated = function() {
        let elem = angular.element("#tagEditor");
        if ($scope.rule.conditions) {
          for (let i = 0; i < $scope.rule.conditions.length; i++) {
            if (
              $scope.singleCriterion.value === $scope.rule.conditions[i].name &&
              $scope.singleCriterion.index !== $scope.rule.conditions[i].index
            ) {
              elem[0].classList.remove("ng-valid");
              elem[0].classList.add("ng-invalid");
              $scope.isInvalidTag = true;
              return;
            }
          }
        }
        elem[0].classList.remove("ng-invalid");
        elem[0].classList.add("ng-valid");
        $scope.isInvalidTag = false;
      };

      $scope.preventFormSubmit = function(event) {
        if (event.which === 13) {
          event.preventDefault();
          $scope.editCriterion($scope.singleCriterion);
        }
      };

      $scope.editCriterion = function(singleCriterion) {
        if (!$scope.rule.conditions)  $scope.rule.conditions = [];
        let insertIndex = singleCriterion.index === -1 ? $scope.rule.conditions.length : singleCriterion.index;
        let insertOrReplace = singleCriterion.index === -1 ? 0 : 1;
        console.log("singleCriterion.value: ", singleCriterion.value);
        $scope.rule.conditions.splice(insertIndex, insertOrReplace, {
          name: singleCriterion.value,
          index: insertIndex
        });
        $scope.singleCriterion = {
          value: "",
          index: -1
        };
        $scope.isShowingEditCriterion = false;
        initializeSpecificTagStyle(insertIndex);
      };

      $scope.tagAdding = function(tag) {
        console.log(
          "Pattern: " +
            responseRulesService.getPattern($scope.rule.event, originalConditionOption) +
            "\n",
          "Tag name: " + tag.name + "\n",
          "Test result: " +
            responseRulesService.getPattern($scope.rule.event, originalConditionOption).test(tag.name)
        );
        let insertIndex = $scope.rule.conditions.length;
        tag.index = insertIndex;
        $scope.isShowingEditCriterion = false;
        initializeTagStyle();
        return responseRulesService
          .getPattern($scope.rule.event, originalConditionOption)
          .test(tag.name);
      };

      $scope.showTagDetail = function(tag) {
        initializeTagStyle();
        setFocusedTagStyle(tag.index);
        $scope.singleCriterion.value = tag.name;
        $scope.singleCriterion.index = tag.index;
        if (!$scope.isReadonly) {
          $scope.isShowingEditCriterion = true;
        }
        $scope.isInvalidTag = false;
        $timeout(() => {
          let tagEditorElem = angular.element("#tagEditor");
          tagEditorElem.focus();
        }, 200);
      };

      $scope.tagRemoving = function(tag) {
        $scope.rule.conditions.forEach(filter => {
          if (tag.index < filter.index) {
            filter.index -= 1;
          }
        });
        $timeout(() => {
          if (!$scope.rule.conditions)  $scope.rule.conditions = [];
          $scope.isShowingEditCriterion = false;
          initializeTagStyle();
        }, 200);
      };

      $scope.exists = function(item, list) {
        if (list && item) return list.indexOf(item) > -1;
      };
      $scope.toggle = function(item, list, source) {
        let idx = list.indexOf(item);
        if (idx > -1) {
          list.splice(idx, 1);
        } else {
          list.push(item);
        }
        if (source === "action") {
          $scope.isWebhookSelected = list.includes("webhook");
        }
      };
      $scope.editRule = function(ev) {
        let payload = {
          config: {}
        };
        let convertedConditions = null;
        if (
          $scope.rule.conditions !== null &&
          $scope.rule.conditions !== "" &&
          typeof $scope.rule.conditions !== "undefined"
        ) {
          convertedConditions = $scope.rule.conditions.map(function(condition) {
            let conditionMap = condition.name.split(":");
            return {
              type: conditionMap[0].trim(),
              value: conditionMap
                .slice(1)
                .join(":")
                .trim()
            };
          });
        }
        payload.config.disable = !$scope.rule.enable;
        payload.config.id = $scope.rule.id;
        payload.config.event = $scope.rule.event;
        payload.config.actions = $scope.rule.actions;
        if ($scope.selectedItemGroup === null) {
          payload.config.group = $scope.searchTextGroup;
        } else {
          payload.config.group = $scope.selectedItemGroup.value;
        }
        payload.config.conditions = convertedConditions;
        payload.config.webhooks = $scope.rule.webhooks;
        payload.config.cfg_type = CFG_TYPE.CUSTOMER;
        $http
          .patch(RESPONSE_POLICY_URL, payload)
          .then(function(response) {
            let index = responseRulesService.getIndex(
              responseRulesService.rules,
              responseRulesService.id
            );
            responseRulesService.rules[index].id = payload.config.id;
            responseRulesService.rules[index].group = payload.config.group;
            responseRulesService.rules[index].event = payload.config.event;
            responseRulesService.rules[
              index
            ].conditions = responseRulesService.conditionObjToTag(
              payload.config.conditions
            );
            responseRulesService.rules[index].actions = payload.config.actions;
            responseRulesService.rules[index].webhooks = payload.config.webhooks;
            responseRulesService.rules[index].disable = payload.config.disable;
            console.log("updated: ", responseRulesService.rules[index]);
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success(
              $translate.instant("responsePolicy.dialog.content.UPDATE_OK") +
                " - ID=" +
                $sanitize(payload.config.id)
            );
          })
          .catch(function(e) {
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              console.log(e.data);
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("responsePolicy.dialog.content.UPDATE_NG"), false)
              );
            }
          });
        $mdDialog.hide();
      };

      function makeTypeAheadList4Editor() {
        let name = responseRulesService.conditionOptions[$scope.rule.event]
          .name
          ? responseRulesService.conditionOptions[$scope.rule.event].name
          : [];
        let level = responseRulesService.conditionOptions[$scope.rule.event]
          .level
          ? responseRulesService.conditionOptions[$scope.rule.event].level
          : [];
        $scope.conditionOptions4SingleConditionEditor = name.concat(level);
      }

      function makeAutoCompleteList() {
        $scope.groups = loadAll();
        $scope.selectedItemGroup = null;
        $scope.selectedItemTo = null;
        $scope.searchTextGroup = null;
        $scope.searchTextTo = null;
        $scope.isDisabled = false;
        function loadAll() {
          let allGroup = responseRulesService.groupList
            ? Utils.removeGroupExceptions(
                responseRulesService.groupList,
                "response"
              )
            : [];
          return allGroup.map(function(group) {
            return {
              value: group,
              display: group
            };
          });
        }
      }
    }
  }
})();
