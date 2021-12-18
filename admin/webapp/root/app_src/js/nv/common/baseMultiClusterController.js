(function(){
  "use strict";
  angular
    .module('app.common')
    .controller("BaseMultiClusterController", BaseMultiClusterController)
    .controller("ToastCtrl", ToastCtrl);

  BaseMultiClusterController.$inject = ["$rootScope", "$scope", "$http", "$mdToast", "$translate"];

  function BaseMultiClusterController($rootScope, $scope, $http, $mdToast, $translate){
    $rootScope.toastWarnings();

    let vm = this;

    vm.doOnClusterRedirected = function(callback){
      $scope.$on('clusterRedirected', function(){
        callback();
      });
    };

    vm.doOnClusterRedirected4Setting = function(callback){
      $scope.$on('clusterRedirected', function(){
        getLicense();
        callback();
      });
    };

    vm.doOnClusterRedirectedWithoutReload = function(callback) {
      getLicense();
      callback();
    }

    function getLicense() {
      $scope.licenseErr = false;
      $http
        .get(LICENSE_URL)
        .then(function(response) {
          if (response) {
            $scope.license = response.data.license;
            $scope.needLicense = !$scope.license;
            if ($scope.license) {
              $rootScope.expiredDays = $scope.license.day_to_expire;
              $rootScope.licenseModel = $scope.license.info.license_model;
              $rootScope.scanEnabled = $scope.license.info.scan;
            }
            $rootScope.invalidLicense = $scope.needLicense;
            $rootScope.toastWarnings();
          }
        })
        .catch(function(err) {
          console.warn(err);
          $scope.licenseErr = true;
          if (
            USER_TIMEOUT.indexOf(err.status) < 0&&
            err.status !== UNAUTHORIZED
          ) {
            Alertify.alert(
              Utils.getAlertifyMsg(err, $translate.instant("license.message.GET_LICENSE_ERR"), true)
            );
          }
        });
    }

    return vm;
  }

  function ToastCtrl($mdToast, $translate, $window, $rootScope) {
    let ctrl = this;
    ctrl.undoKey = $translate.instant("setting.CANCEL");

    ctrl.closeToast = function() {
      $mdToast.hide("undo").then(function() {});
      $window.localStorage.setItem($rootScope.user.token.token, (new Date()).getDate());
    };
  }

})();
