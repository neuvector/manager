(function() {
  "use strict";
  angular
    .module("app.assets")
    .controller("DLPSensorsController", DLPSensorsController);
  DLPSensorsController.$inject = [
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
    "$document",
    "Utils",
    "filterFilter",
    "dlpSensorsService",
    "$controller",
    "$sanitize",
    "AuthorizationFactory",
    "$filter"
  ];
  function DLPSensorsController(
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
    $document,
    Utils,
    filterFilter,
    dlpSensorsService,
    $controller,
    $sanitize,
    AuthorizationFactory,
    $filter
  ) {
    $scope.isSupported = false;

    $scope.pageY = $window.innerHeight / 2 + 11;
    $scope.gridHeight = Utils.getMasterGridHeight() - 30;
    $scope.detailViewHeight = Utils.getDetailViewHeight() - 5;

    angular.element($window).bind("resize", function() {
      $scope.gridHeight = $scope.pageY - 208;
      $scope.detailViewHeight = $window.innerHeight -  $scope.pageY - 143;
      $scope.$digest();
    });

    const mousemove = function(event) {
      $scope.pageY = event.pageY;
      if (event.pageY >= 206 && event.pageY <= $window.innerHeight - 145) {
        $scope.gridHeight = event.pageY - 208;
        $scope.detailViewHeight = $window.innerHeight -  event.pageY - 143;
        setTimeout(function () {
          $scope.gridOptions.api.sizeColumnsToFit();
          $scope.gridOptions.api.forEachNode(function(node, index) {
            if ($scope.registry) {
              if (node.data.name === $scope.registry.name) {
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

    $scope.RULE_TYPE = {
      DENY: "deny",
      EXCEPTION: "exception"
    };
    const resource = {
      writeDLPSensor: {
        global: 2,
        namespace: 2
      }
    };
    $scope.showedRuleType = $scope.RULE_TYPE.DENY;
    $scope.isWriteDLPSensorAuthorized = AuthorizationFactory.getDisplayFlag("write_dlp_rule") && !AuthorizationFactory.userPermission.isNamespaceUser;
    $scope.hasSelectedGroups = false;
    let filter = "";

    activate();

    function activate() {
      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("dlp.COUNT_POSTFIX")
        );
      };
      const found = $translate.instant("enum.FOUND");

      const onSelectionChanged = function() {
        $scope.hasSelectedGroups = true;
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.sensor = angular.copy(selectedRows[0]);
        $scope.gridOptions4Rules.api.setRowData();
        $scope.gridOptions4Patterns.api.setRowData();
        $timeout(function() {
          $scope.isPredefine = $scope.sensor.predefine
          $scope.gridOptions4Rules.api.setRowData($scope.sensor.rules);
          let rowNode = $scope.gridOptions4Rules.api.getDisplayedRowAtIndex(0);
          if (rowNode) rowNode.setSelected(true);
        }, 50);
        $scope.$apply();
      };

      const onSelectionChanged4Rules = function() {
        let selectedRow = $scope.gridOptions4Rules.api.getSelectedRows()[0];
        $scope.rule = selectedRow;
        let patterns = selectedRow.patterns;
        $timeout(function() {
          $scope.gridOptions4Patterns.api.setRowData(patterns);
          let rowNode = $scope.gridOptions4Patterns.api.getDisplayedRowAtIndex(0);
          if (rowNode) rowNode.setSelected(true);
        }, 50);
      };

      let grid = dlpSensorsService.setGrid($scope.isWriteDLPSensorAuthorized);
      $scope.gridOptions = grid.gridOptions;
      $scope.gridOptions.suppressScrollOnNewData = true;
      $scope.gridOptions.onSelectionChanged = onSelectionChanged;
      $scope.gridOptions4Rules = grid.gridOptions4Rules;
      $scope.gridOptions4Rules.onSelectionChanged = onSelectionChanged4Rules;
      $scope.gridOptions4Patterns = grid.gridOptions4Patterns;
      $scope.gridOptions4EditPatterns = grid.gridOptions4EditPatterns;

      const requestDLPSensors = function(index) {
        $scope.dlpSensorsErr = false;
        $http
          .get(DLP_SENSORS_URL)
          .then(function(response) {
            console.log(response.data);
            $scope.sensors = response.data.sensors;
            $scope.gridOptions.api.setRowData(response.data.sensors);
            setTimeout(function() {
              $scope.gridOptions.api.sizeColumnsToFit();
              if (index) {
                let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                  index
                );
                rowNode.setSelected(true);
                $scope.gridOptions.api.ensureNodeVisible(rowNode, "middle");
              } else {
                let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
                rowNode.setSelected(true);
                $scope.gridOptions.api.ensureNodeVisible(rowNode, "middle");
              }
            }, 50);
            $scope.count = `${$scope.sensors.length} ${getEntityName(
              $scope.sensors.length
            )}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function(err) {
            $scope.dlpSensorsErr = true;
            console.warn(err);
            $scope.sensors = [];
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData($scope.sensors);
          });
      };

      $scope.reload = function(index) {
        requestDLPSensors(index);
      };

      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        $scope.filteredsensors = filterFilter($scope.sensors, {
          name: value
        });
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasSelectedSensor = true;
          node.setSelected(true);
        } else {
          $scope.hasSelectedSensor = false;
        }
        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.sensors.length || value === ""
            ? `${$scope.sensors.length} ${getEntityName($scope.sensors.length)}`
            : `${found} ${filteredCount} / ${$scope.sensors.length} ${getEntityName(
                $scope.sensors.length
              )}`;
      };
    }

    $scope.reload();

    $scope.addSensor = function() {
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4AddEditSensor,
            controllerAs: "addEditSensorCtrl",
            templateUrl: "dialog.addEditSensor.html",
            locals: {
              sensor: null,
              type: "add"
            }
          })
          .then(
            function() {
              $timeout(function() {
                $scope.reload($scope.sensors.length);
              }, 3000);
            },
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.editSensor = function() {
      let index4Edit = dlpSensorsService.getIndex(
        $scope.sensors,
        $scope.sensor.name
      );
      let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4Edit);
      rowNode.setSelected(true);
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4AddEditSensor,
            controllerAs: "addEditSensorCtrl",
            templateUrl: "dialog.addEditSensor.html",
            locals: {
              sensor: $scope.sensor,
              type: "edit"
            }
          })
          .then(
            function() {
              $timeout(function() {
                $scope.reload(index4Edit);
              }, 3000);
            },
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.removeSensor = function(sensor) {
      let rowNode = null;
      let index4delete = dlpSensorsService.getIndex(
        $scope.sensors,
        sensor.name
      );
      rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4delete);
      rowNode.setSelected(true);
      let confirmBox =
        $translate.instant("dlp.msg.REMOVE_CFM") + $sanitize($filter("shorten2")(sensor.name, 30));
      Alertify.confirm(confirmBox).then(
        function toOK() {
          $http
            .delete(`${DLP_SENSORS_URL}?name=${sensor.name}`)
            .then(function(response) {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("dlp.msg.REMOVE_OK"));
              $timeout(() => {
                if (index4delete === $scope.sensors.length - 1)
                  index4delete -= 1;
                $scope.reload(index4delete);
              }, 1000);
            })
            .catch(function(e) {
              rowNode.setSelected(false);
              if (USER_TIMEOUT.indexOf(e.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(e, $translate.instant("dlp.msg.REMOVE_NG"), false)
                );
              }
            });
        },
        function toCancel() {
          let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
          if (node) {
            $scope.hasSelectedSensor = true;
            node.setSelected(true);
          } else {
            $scope.hasSelectedSensor = false;
          }
        }
      );
    };

    $scope.addEditRule = function(sensor, rule, type) {
      let success = function() {
        let rowNode = null;
        let index4edit = dlpSensorsService.getIndex(
          $scope.sensors,
          sensor.name
        );
        rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4edit);

        rowNode.setSelected(true);
        $mdDialog
          .show({
            controller: DialogController4AddEditRule,
            controllerAs: "addEditRuleCtrl",
            templateUrl: "dialog.addEditRule.html",
            locals: {
              selectedSensor: sensor,
              selectedRule: rule,
              type: type,
              gridOptions4EditPatterns: $scope.gridOptions4EditPatterns
            }
          })
          .then(
            function() {
              $timeout(() => {
                $scope.reload(index4edit);
              }, 1000);
            },
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.switchContext = function() {
      let success = function() {
        let rowNode = null;
        let index4edit = dlpSensorsService.getIndex(
          $scope.sensors,
          $scope.sensor.name
        );
        rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4edit);

        rowNode.setSelected(true);
        $mdDialog
          .show({
            controller: DialogController4SwitchContext,
            controllerAs: "switchContextCtrl",
            templateUrl: "dialog.switchContext.html",
            locals: {
              selectedSensor: $scope.sensor
            }
          })
          .then(
            function() {
              $timeout(() => {
                $scope.reload(index4edit);
              }, 1000);
            },
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.removeRule = function(sensor, rule) {
      let rowNode = null;
      let index4edit = dlpSensorsService.getIndex(
        $scope.sensors,
        sensor.name
      );
      rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4edit);
      rowNode.setSelected(true);
      let confirmBox =
        $translate.instant("dlp.msg.REMOVE_CFM") + $sanitize($filter("shorten2")(rule.name, 30));
      Alertify.confirm(confirmBox).then(
        function toOK() {
          let payload = {
            config: {
              name: sensor.name,
              comment: sensor.comment,
              rules: sensor.rules.filter(_rule => _rule.id !== rule.id)
            }
          };
          $http
            .patch(DLP_SENSORS_URL, payload, {params: {name: sensor.name}})
            .then(function(response) {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("dlp.msg.REMOVE_RULE_OK"));
              $timeout(() => {
                $scope.reload(index4edit);
              }, 1000);
            })
            .catch(function(e) {
              if (USER_TIMEOUT.indexOf(e.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(e, $translate.instant("dlp.msg.REMOVE_RULE_NG"), false)
                );
              }
            });
        },
        function toCancel() {}
      );
    };

    $scope.reset = function() {
      $scope.gridOptions.api.stopEditing();
      $scope.reload();
    };

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    DialogController4AddEditSensor.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "$sanitize",
      "type",
      "sensor"
    ];

    function DialogController4AddEditSensor(
      $scope,
      $mdDialog,
      $translate,
      $sanitize,
      type,
      sensor
    ) {
      let vm = this;
      $scope.type = type;
      if (type === "add") {
        $scope.sensor = {
          name: "",
          comment: ""
        };
      } else {
        $scope.sensor = sensor;
      }

      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.addNewSensor = function(ev) {
        let payload = {
          config: {
            name: $sanitize($scope.sensor.name),
            comment: $sanitize($scope.sensor.comment)
          }
        };
        $http
          .post(DLP_SENSORS_URL, payload)
          .then(function(response) {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("dlp.msg.INSERT_OK"));
          })
          .catch(function(e) {
            console.warn(e);
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("dlp.msg.INSERT_NG"), false)
              );
            }
          });
        $mdDialog.hide();
      };

      $scope.editSensor = function(ev) {
        let payload = {
          config: {
            name: $sanitize($scope.sensor.name),
            comment: $sanitize($scope.sensor.comment)
          }
        };
        $http
          .patch(DLP_SENSORS_URL, payload)
          .then(function(response) {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("dlp.msg.UPDATE_OK"));
          })
          .catch(function(e) {
            console.warn(e);
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("dlp.msg.UPDATE_NG"), false)
              );
            }
          });
        $mdDialog.hide();
      };
    }

    DialogController4AddEditRule.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "$sanitize",
      "$timeout",
      "dlpSensorsService",
      "selectedSensor",
      "selectedRule",
      "type",
      "gridOptions4EditPatterns"
    ];

    function DialogController4AddEditRule(
      $scope,
      $mdDialog,
      $translate,
      $sanitize,
      $timeout,
      dlpSensorsService,
      selectedSensor,
      selectedRule,
      type,
      gridOptions4EditPatterns
    ) {
      const vm = this;
      $scope.gridOptions4EditPatterns = gridOptions4EditPatterns;

      const onSelectionChanged4Patterns = function() {
        $scope.pattern = {};
        let selectedPattern = $scope.gridOptions4EditPatterns.api.getSelectedRows()[0];
        $scope.pattern.value = selectedPattern.value;
        $scope.pattern.op = selectedPattern.op;
        $scope.pattern.context = selectedPattern.context;
        $scope.$apply();
      };
      $scope.gridOptions4EditPatterns.onSelectionChanged = onSelectionChanged4Patterns;

      $scope.isEdit = type === "edit";
      $scope.isMatched = true;
      $scope.testResult = "";
      $scope.testCase = "";
      $scope.isShowingTestPattern = false;
      $scope.operators = ["regex", "!regex"];
      $scope.contexts = ["packet", "url", "header", "body"];

      const initializePattern = function() {
        $scope.pattern = {
          value: "",
          op: "regex",
          context: "packet"
        };
      };

      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };
      $scope.editingRule = $scope.isEdit ?
        {
          sensorName: selectedSensor.name,
          sensorComment: selectedSensor.comment,
          ruleId: selectedRule.id,
          ruleName: selectedRule.name,
          rulePatterns: selectedRule.patterns
        } :
        {
          sensorName: selectedSensor.name,
          sensorComment: selectedSensor.comment,
          ruleName: "",
          rulePatterns: []
        };

      $timeout(() => {
        $scope.gridOptions4EditPatterns.api.setRowData($scope.editingRule.rulePatterns);
        let rowNode = $scope.gridOptions4EditPatterns.api.getDisplayedRowAtIndex(0);
        if (rowNode) rowNode.setSelected(true);
      }, 200);

      $scope.testRegex = function(pattern, testCase) {
        if (!pattern) return;
        if (!testCase) {
          $scope.testResult = "";
          $scope.isMatched = true;
          return;
        }
        $scope.isMatched = RegExp(`^${pattern}`, "g").test(testCase);
        if ($scope.isMatched && testCase.length > 0) {
          $scope.testResult = $translate.instant("dlp.msg.MATCH");
        }
        if (!$scope.isMatched && testCase.length > 0) {
          $scope.testResult = $translate.instant("dlp.msg.MISMATCH");
        }
      };

      const checkReciprocalPattern = function(patternList, currPattern) {
        return patternList.findIndex(pattern => {
          return pattern.value === currPattern.value &&
                 pattern.op !== currPattern.op &&
                 pattern.context === currPattern.context
        }) > -1
      };

      $scope.initTestArea = function(pattern) {
        vm.testCase = "";
        $scope.testRegex(pattern, "");
      };

      $scope.addPattern = function() {
        if ($scope.editingRule.rulePatterns.length >= 16) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error($translate.instant("dlp.msg.ADD_PATTERN_NG"));
        } else {
          let indexOfExistingPattern = $scope.editingRule.rulePatterns.findIndex(pattern => {
            return pattern.value === $scope.pattern.value &&
              pattern.op === $scope.pattern.op
          });
          $scope.hasReciprocalPattern = checkReciprocalPattern($scope.editingRule.rulePatterns, $scope.pattern);
          if ($scope.hasReciprocalPattern) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error($translate.instant("dlp.msg.RECIPROCAL_PATTERN_NG"));
          } else {
            if (indexOfExistingPattern === -1) {
              $scope.editingRule.rulePatterns.push({
                key: "pattern",
                op: $scope.pattern.op,
                value: $scope.pattern.value,
                context: $scope.pattern.context
              });
            } else {
              $scope.editingRule.rulePatterns.splice(
                indexOfExistingPattern,
                1,
                {
                  key: "pattern",
                  op: $scope.pattern.op,
                  value: $scope.pattern.value,
                  context: $scope.pattern.context
                }
              );
            }
            $scope.gridOptions4EditPatterns.api.setRowData($scope.editingRule.rulePatterns);
          }
        }
        initializePattern();
      };

      $scope.removePattern = function(data) {
        let indexOfDeletingPattern = $scope.editingRule.rulePatterns.findIndex(pattern => {
          return pattern.value === data.value &&
            pattern.op === data.op &&
            pattern.context === data.context
        });
        $scope.editingRule.rulePatterns.splice(indexOfDeletingPattern, 1);
        $scope.gridOptions4EditPatterns.api.setRowData($scope.editingRule.rulePatterns);
        initializePattern();
        $timeout(() => {
          let node = $scope.gridOptions4EditPatterns.api.getDisplayedRowAtIndex(0);
          node.setSelected(true);
        }, 200);
      };

      $scope.addUpdateRule = function() {
        console.log("$scope.editingRule.ruleName", $scope.editingRule.ruleName);
        if ($scope.isEdit) {
          let indexOfRule = selectedSensor.rules.findIndex(rule => rule.id === selectedRule.id);
          console.log("indexOfRule", indexOfRule);
          selectedSensor.rules.splice(indexOfRule, 1, {
            id: selectedRule.id,
            name: $scope.editingRule.ruleName,
            patterns: $scope.editingRule.rulePatterns
          });
        } else {
          selectedSensor.rules.push({
            name: $scope.editingRule.ruleName,
            patterns: $scope.editingRule.rulePatterns
          });
        }

        let payload = {
          config: {
            name: $sanitize(selectedSensor.name),
            comment: $sanitize(selectedSensor.comment),
            rules: selectedSensor.rules
          }
        }
        $http
          .patch(DLP_SENSORS_URL, payload)
          .then(function(response) {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("dlp.msg.UPDATE_RULE_OK"));
            $mdDialog.hide();
          })
          .catch(function(e) {
            console.warn(e);
            if (!$scope.isEdit) selectedSensor.rules.pop();
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("dlp.msg.UPDATE_RULE_NG"), false)
              );
            }
          });
      };
    }

    DialogController4SwitchContext.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "$timeout",
      "selectedSensor",
    ];

    function DialogController4SwitchContext(
      $scope,
      $mdDialog,
      $translate,
      $timeout,
      selectedSensor
    ) {
      console.log("selectedSensor", selectedSensor);
      $scope.contexts = ["packet", "url", "header", "body"];
      //Context value is from pattern and set into rule on predefined sensor (Not a elegant backend data process)
      $scope.currContext = selectedSensor.rules[0].patterns[0].context;
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };
      $scope.switchRule = {
        sensorName: selectedSensor.name,
        sensorComment: selectedSensor.comment
      };

      $scope.updateContext = function() {
        let payload = {
          config: {
            name: $scope.switchRule.sensorName,
            predefine: true,
            prerules: selectedSensor.rules.map(rule => {
              return {
                name: rule.name,
                context: $scope.currContext
              }
            })
          }
        };
        $http
          .patch(DLP_SENSORS_URL, payload)
          .then(function(response) {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("dlp.msg.UPDATE_OK"));
          })
          .catch(function(e) {
            console.warn(e);
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("dlp.msg.UPDATE_NG"), false)
              );
            }
          });
        $mdDialog.hide();
      };
    }
  }
})();
