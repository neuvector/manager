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
        $http.post(EULA_URL, {accepted: true}).then(function () {
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

      const doAfterDenyEula = function() {
        if ($rootScope.isSUSESSO) {
          $rootScope.isSSODenyEula = true;
        } else {
          $state.go('page.login');
        }
      }

      $scope.deny = function () {
        $http.post(EULA_URL, {accepted: false}).then(function () {
          $http.delete(LOGIN_URL).then(function () {
            $window.localStorage.clear();
            $rootScope.user = null;
            doAfterDenyEula();
          }).catch(function (err) {
            console.warn(err);
            doAfterDenyEula();
          });
        }).catch(function(err){
          console.warn(err);
          doAfterDenyEula();
        });
      };

    }
  }
})();
