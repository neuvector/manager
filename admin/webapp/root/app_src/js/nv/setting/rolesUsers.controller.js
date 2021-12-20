(function(){
  "use strict";

  angular
    .module("app.login")
    .controller("RolesUsersController", RolesUsersController);

  RolesUsersController.$inject = [
    "$scope",
    "$state",
    "$controller",
    "AuthorizationFactory"
  ];

  function RolesUsersController(
    $scope,
    $state,
    $controller,
    AuthorizationFactory
  ){
    let redirectBackToDashboard = function(){
      $state.go("app.dashboard");
    };
    $scope.$on("clusterRedirected", function() {
      let baseCtl = $controller('BaseMultiClusterController', {$scope: $scope});
      baseCtl.doOnClusterRedirectedWithoutReload(redirectBackToDashboard);
    });
    $scope.isUpdatePasswordProfileAuthorized = AuthorizationFactory.getDisplayFlagByMultiPermission("update_password_profile");
    $scope.isReadPasswordProfileAuthorized =
      AuthorizationFactory.getDisplayFlagByMultiPermission("read_password_profile_1") ||
      AuthorizationFactory.getDisplayFlagByMultiPermission("read_password_profile_2") ||
      AuthorizationFactory.getDisplayFlagByMultiPermission("read_password_profile_3");
  }

})();
