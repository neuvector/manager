/**=========================================================
 * Module: logoutController.js
 =========================================================*/
(function () {
  "use strict";

  angular.module("app.logout").controller("LogoutController", LogoutController);
  LogoutController.$inject = [
    "$window",
    "$state",
    "$rootScope",
    "$http",
    "$mdToast",
    "$location",
    "$translate",
    "$timeout"
  ];
  function LogoutController($window, $state, $rootScope, $http, $mdToast, $location, $translate, $timeout) {
    const rejectBack = function() {
      if ($rootScope.isSUSESSO) {
        $rootScope.hideFrame = true;
        $timeout(() => {
          alert(`${$translate.instant("logout.SIGN_OUT")}\n${$translate.instant("logout.SIGN_OUT_DESC")}`);
        }, 500);
      } else {
        $state.go("page.login");
      }
    };
    const doLogoout = function(isTimeout) {
      const user = $rootScope.user ? $rootScope.user.token.username : null;
      $http
        .delete(LOGIN_URL)
        .then(function (response) {
          let version = $window.localStorage.getItem("version");
          let gpuEnabled = $window.localStorage.getItem("_gpuEnabled");
          if (!isTimeout) {
            $window.localStorage.clear();
            $window.sessionStorage.clear();
            $rootScope.user = null;
            $rootScope.sidebarDone = false;
            $rootScope.versionDone = false;
            $rootScope.isFooterReady = false;
            $window.localStorage.setItem("version", version);
            $window.localStorage.setItem("_gpuEnabled", gpuEnabled);
            $mdToast.hide("undo").then(function () {});
            $state.go("page.login");
          } else {
            $mdToast.hide("undo").then(function () {});
            rejectBack();
          }
        })
        .catch(function (err) {
          console.log(err);
          $mdToast.hide("undo").then(function () {});
          rejectBack();
        });
    };
    $rootScope.logout = function (isTimeout) {
      const NEED_CONFIRM_SUBMIT = ["/app/policy", "/app/fed-policy", "/app/configuration"];
      if (!isTimeout && NEED_CONFIRM_SUBMIT.includes($location.path())) {
        if ($rootScope.isSettingFormDirty) {
          if (window.confirm($translate.instant("setting.webhook.LEAVE_PAGE"))) {
            doLogoout(isTimeout);
          }
        } else if ($rootScope.isPolicyDirty) {
          if (!$rootScope.isReset) {
            if (window.confirm($translate.instant("policy.dialog.reminder.MESSAGE"))) {
              doLogoout(isTimeout);
            }
          }
        } else {
          doLogoout(isTimeout);
        }
      } else {
        doLogoout(isTimeout);
      }
    };
  }
})();
