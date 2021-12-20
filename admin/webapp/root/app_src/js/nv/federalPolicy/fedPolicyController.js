(function(){
  "use strict";

  angular
    .module("app.assets")
    .controller("FedPolicyController", FedPolicyController);

  FedPolicyController.$inject = [
    "$scope",
    "$state",
    "$controller",
    "$rootScope"
  ];

  function FedPolicyController(
    $scope,
    $state,
    $controller,
    $rootScope
  ){
    $rootScope.toastWarnings();
    let redirectBackToDashboard = function(){
      $state.go("app.dashboard");
    };
    $scope.$on("clusterRedirected", function() {
      let baseCtl = $controller('BaseMultiClusterController', {$scope: $scope});
      baseCtl.doOnClusterRedirectedWithoutReload(redirectBackToDashboard);
    });
  }

})();
