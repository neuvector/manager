(function() {
  "use strict";

  angular
    .module("app.assets")
    .controller("ConversationController", ConversationController);

  ConversationController.$inject = [
    "$scope",
    "$filter",
    "$http",
    "$translate",
    "$timeout",
    "$window",
    "Utils",
    "FileSaver",
    "Blob",
    "$stateParams",
    "ViolationFactory"
  ];
  function ConversationController(
    $scope,
    $filter,
    $http,
    $translate,
    $timeout,
    $window,
    Utils,
    FileSaver,
    Blob,
    $stateParams,
    ViolationFactory
  ) {

    let filter = "";
    activate();

    function activate() {

      ViolationFactory.setGrids();

      let getEntityName = function(count) {
        return Utils.getEntityName(count, $translate.instant("violation.COUNT_POSTFIX"));
      }
      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");
      let clientId = decodeURIComponent($stateParams.clientId);

      $scope.graphHeight = $window.innerHeight - 225;

      angular.element($window).bind("resize", function() {
        $scope.graphHeight = $window.innerHeight - 225;

        $scope.$digest();
      });

      $scope.onRulePreview = false;

      $scope.gridOptions = ViolationFactory.violationGridOptions;

      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let filteredCount = $scope.gridOptions.api.getModel().rootNode.childrenAfterFilter.length;
        $scope.count = (filteredCount === $scope.conversations.length || value === '')?
          `${$scope.conversations.length} ${getEntityName($scope.conversations.length)}` :
          `${found} ${filteredCount} ${getEntityName(filteredCount)} ${outOf} ${$scope.conversations.length} ${getEntityName($scope.conversations.length)}`;
      };

      $scope.getColorCode = function(level) {
        return colourMap[level];
      };

      $scope.showRule = function(id) {
        $http
          .get(POLICY_RULE_URL, { params: { id: id } })
          .then(function(response) {
            $scope.rule = response.data.rule;
            console.log($scope.rule)
            $scope.rule.applications = Array.isArray($scope.rule.applications) && $scope.rule.applications.length > 0 && $scope.rule.applications[0] === "any" ?
                                       $translate.instant("enum.ANY") : $scope.rule.applications.join(", ");
            $scope.rule.ports = $scope.rule.ports === "any" ? $translate.instant("enum.ANY") : $scope.rule.ports;
            $scope.rule.action = $translate.instant("enum." + $scope.rule.action.toUpperCase());
            $scope.onRulePreview = true;
            $timeout(function() {
              $scope.onRulePreview = false;
            }, 10000);
          })
          .catch(function(err) {
            console.warn(err);
          });
      };

      $scope.refresh = function() {
        $scope.violationsErr = false;
        ViolationFactory.getViolations()
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant("general.NO_ROWS");
            $scope.conversations = response.data.violations;
            $scope.gridOptions.api.setRowData($scope.conversations);
            if (clientId && clientId !== "null") {
              $scope.search = clientId;
              $scope.onFilterChanged(clientId);
            }
            $scope.count = `${$scope.conversations.length} ${getEntityName($scope.conversations.length)}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function(err) {
            console.warn(err);
            $scope.violationsErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.refresh();

      $scope.exportCsv = function() {
        if ($scope.conversations && $scope.conversations.length > 0) {
          let csv = Utils.arrayToCsv(angular.copy($scope.conversations));
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(blob, "violations.csv");
        }
      };
    }
  }
})();
