(function () {
  'use strict';

  angular
    .module('app.eula')
    .controller('EulaController', EulaController);

  EulaController.$inject = ['$window', '$rootScope', '$scope', '$http', '$state', '$translate', 'Alertify', 'Utils'];
  function EulaController($window, $rootScope, $scope, $http, $state, $translate, Alertify, Utils) {
    activate();

    function activate() {

      let cachedVersion = $window.localStorage.getItem("version");
      if (cachedVersion && $rootScope.js_version !== cachedVersion) {
        console.log("Got new menu!", $rootScope.js_version, $window.localStorage.getItem("version"));
        $translate.refresh();
        $window.localStorage.setItem("version", $rootScope.js_version);
      }

      $scope.accept = function () {
        $http.post('/eula', {accepted: true}).then(function () {
          $state.go('app.dashboard');
        }).catch(function(err){
          console.warn(err);
          if (USER_TIMEOUT.indexOf(err.status) < 0 ) {
            let message = Utils.getErrorMessage(err);
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(message);
          }
        });
      };

      $scope.deny = function () {
        $http.post('/eula', {accepted: false}).then(function () {
          $http.delete('/auth').then(function () {
            $window.localStorage.clear();
            $rootScope.user = null;
            $state.go('page.login');
          }).catch(function (err) {
            console.warn(err);
          });
        }).catch(function(err){
          console.warn(err);
          $state.go('page.login');
        });
      };

    }
  }
})();
