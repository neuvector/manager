(function() {
  "use strict";

  angular
    .module("app.login")
    .controller("LicenseController", LicenseController);

  LicenseController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$rootScope",
    "Utils",
    "Alertify",
    "$translate",
    "$controller",
    "$state",
    "AuthorizationFactory"
  ];
  function LicenseController(
    $scope,
    $http,
    $mdDialog,
    $rootScope,
    Utils,
    Alertify,
    $translate,
    $controller,
    $state,
    AuthorizationFactory
  ) {
    $scope.copied = false;
    $scope.loadFailed = false;
    $scope.isRenewLicenseAuthorized = AuthorizationFactory.getDisplayFlag(
      "write_config"
    );

    const getLicense = () => {
      $scope.licenseErr = false;
      $http
        .get(LICENSE_URL)
        .then(response => {
          if (response) {
            loadLicenseToScope(response);
          }
        })
        .catch(err => {
          console.warn(err);
          $scope.licenseErr = true;
          if (
            USER_TIMEOUT.indexOf(err.status) < 0 &&
            err.status !== UNAUTHORIZED
          ) {
            Alertify.alert(
              Utils.getAlertifyMsg(
                err,
                $translate.instant("license.message.GET_LICENSE_ERR"),
                true
              )
            );
          }
        });
    };

    const activate = () => {
      getLicense();
    };

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    const loadLicenseToScope = response => {
      $scope.license = response.data.license;
      $scope.needLicense = !$scope.license;
      if ($scope.license) {
        $rootScope.expiredDays = $scope.license.day_to_expire;
        $rootScope.licenseModel = $scope.license.info.license_model;
        $rootScope.scanEnabled = $scope.license.info.scan;
        $scope.isMetered =
          $scope.license.info.license_model.toLowerCase().indexOf("metered") >=
          0;
        $scope.licenseType = $translate.instant(
          `license.${$scope.license.info.license_model
            .replace(/\-/g, "_")
            .toUpperCase() || "STANDARD"}`
        );
      }
      $rootScope.invalidLicense = $scope.needLicense;
    };

    $scope.success = () => {
      $scope.copied = true;
      setTimeout(() => {
        $scope.copied = false;
        $scope.$apply();
      }, 3000);
    };

    $scope.renew = () => {
      $scope.needLicense = true;
    };

    $scope.requestCode = ev => {
      $mdDialog
        .show({
          controller: DialogController,
          templateUrl: "dialog.codeRequest.html",
          targetEvent: ev,
          scope: $scope,
          preserveScope: true,
          clickOutsideToClose: true,
          openFrom: "#reqCode",
          closeTo: "#reqCode"
        })
        .then(
          () => {},
          () => {}
        );
    };

    $scope.loadLicense = key => {
      $http
        .post(LICENSE_LOAD_URL, { license_key: key })
        .then(response => {
          loadLicenseToScope(response);
        })
        .catch(err => {
          console.log(err);
          let message = Utils.getAlertifyMsg(
            err,
            $translate.instant("license.LOAD_ERR")
          );
          $scope.loadFailed = true;
          $scope.errorMessage = message;
        });
    };
  }
})();
