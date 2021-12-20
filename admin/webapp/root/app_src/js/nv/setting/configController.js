(function () {
  'use strict';

  angular
    .module('app.login')
    .controller('ConfigController', ConfigController);

  ConfigController.$inject = ['$rootScope', '$scope', '$http'];
  function ConfigController($rootScope, $scope, $http) {
    activate();

    function activate() {
      $scope.versionErr = false;
      $http.get(MGR_VERSION).then(function (response) {
        $rootScope.version = response.data
        $rootScope.versionDone = true;
      }).catch(function(err){
        console.warn(err);
        $scope.versionErr = true;
      });
    }

    $scope.alerts = [
      { type: 'warning', msg: 'You are using default password, please change it.' }
    ];

    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  }
})();
