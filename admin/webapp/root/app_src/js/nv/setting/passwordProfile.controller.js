(function () {
  "use strict";

  angular.module("app.login").controller("PasswordProfileController", PasswordProfileController);

  PasswordProfileController.$inject = [
    "$scope",
    "$http",
    "$rootScope",
    "$window",
    "$timeout",
    "$translate",
    "$sanitize",
    "Alertify",
    "Utils",
    "$controller",
    "$state",
    "PasswordProfileFactory",
    "AuthorizationFactory"
  ];
  function PasswordProfileController(
    $scope,
    $http,
    $rootScope,
    $window,
    $timeout,
    $translate,
    $sanitize,
    Alertify,
    Utils,
    $controller,
    $state,
    PasswordProfileFactory,
    AuthorizationFactory
  ) {
    const ENABLED = $sanitize(
      `<span class='text-success'>${$translate.instant(
        "setting.ENABLED"
      )}</span>`
    );
    const DISABLED = $sanitize(
      `<span class='text-muted'>${$translate.instant(
        "setting.DISABLED"
      )}</span>`
    );

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });
    baseCtl.doOnClusterRedirected($state.reload);
    $scope.isUpdatePasswordProfileAuthorized = AuthorizationFactory.getDisplayFlagByMultiPermission("update_password_profile");
    let vm = this;

    $scope.isNumbersValid = true;

    const getPasswordProfile = function() {
      PasswordProfileFactory.getPasswordProfileData()
      .then((res) => {
        vm.profile = res.data.pwd_profiles.filter(profile => profile.name === "default")[0];
        vm.userBlockStatus = vm.profile.enable_block_after_failed_login
          ? ENABLED
          : DISABLED;
        vm.passwordExpiredStatus = vm.profile.enable_password_expiration
          ? ENABLED
          : DISABLED;
        vm.passwordHistoryStatus = vm.profile.enable_password_history
          ? ENABLED
          : DISABLED;
        console.log("Password Profile: ", vm.profile);
      })
      .catch((err) => {
        console.warn(err);
        vm.profile = {
          min_len: "",
          min_uppercase_count: "",
          min_lowercase_count: "",
          min_digit_count: "",
          min_special_count: "",
          block_after_failed_login_count: "",
          password_expire_after_days: "",
          password_keep_history_count: "",
          block_minutes: "",
          enable_block_after_failed_login: false,
          enable_password_expiration: false,
          enable_password_history: false
        }
        vm.userBlockStatus = vm.profile.enable_block_after_failed_login
          ? ENABLED
          : DISABLED;
        vm.passwordExpiredStatus = vm.profile.enable_password_expiration
          ? ENABLED
          : DISABLED;
        vm.passwordHistoryStatus = vm.profile.enable_password_history
          ? ENABLED
          : DISABLED;
        if (USER_TIMEOUT.indexOf(err.status) < 0) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(
              err,
              $translate.instant("passwordProfile.msg.GET_PROFILE_ERR"),
              false
            )
          );
        }
      });
    };

    const getUpdatedSelfPasswordAge = function() {
      PasswordProfileFactory.getSelfProfile()
      .then((res) => {
        $rootScope.user.token = res.data.token;
        let token = JSON.parse($window.sessionStorage.getItem(
          "token"
        ));
        token.token = $rootScope.user.token;
        $window.sessionStorage.setItem(
          "token",
          JSON.stringify(token)
        );
        if (token.token.password_days_until_expire >= 0 && token.token.password_days_until_expire < 10) {
          $window.localStorage.removeItem(token.token.token);
        }
        $rootScope.toastWarnings();
      })
      .catch((err) => {
        console.warn(err);
      });
    };

    getPasswordProfile();

    vm.suppressNonNumber = function(event, item) {
      Utils.numericTextInputOnly(event);
    };
    vm.checkNumbersSum = function(item) {
      const itemsWithZero = [
        "min_len",
        "min_uppercase_count",
        "min_lowercase_count",
        "min_digit_count",
        "min_special_count"
      ]
      vm.profile[item] =
        itemsWithZero.indexOf(item) > -1 ?
        parseInt(Utils.removeLeadingZero(vm.profile[item])) :
        parseInt(Utils.removeLeadingZero(vm.profile[item], true));

      if (!vm.profileForm.$invalid) {
        $scope.isNumbersValid =
          vm.profile.min_len >=
            vm.profile.min_uppercase_count +
            vm.profile.min_lowercase_count +
            vm.profile.min_digit_count +
            vm.profile.min_special_count;
      }
    };

    vm.showUserBlockStatus = function() {
      vm.userBlockStatus = vm.profile.enable_block_after_failed_login
        ? ENABLED
        : DISABLED;
    };

    vm.showPasswordExpiredStatus = function() {
      vm.passwordExpiredStatus = vm.profile.enable_password_expiration
        ? ENABLED
        : DISABLED;
    };

    vm.showPasswordHistoryStatus = function() {
      vm.passwordHistoryStatus = vm.profile.enable_password_history
        ? ENABLED
        : DISABLED;
    };

    vm.setPwdProfile = function() {
      let config = {
        config: vm.profile
      }
      PasswordProfileFactory.updatePasswordProfileData(config)
      .then((res) => {
        vm.profileForm.$setPristine();
        $timeout(() => {
          getPasswordProfile();
          getUpdatedSelfPasswordAge();
        }, 1000);
        Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
        Alertify.success($translate.instant("passwordProfile.msg.UPDATE_PROFILE_OK"));
      })
      .catch((err) => {
        console.warn(err);
        if (USER_TIMEOUT.indexOf(err.status) < 0) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(
              err,
              $translate.instant("passwordProfile.msg.UPDATE_PROFILE_NG"),
              false
            )
          );
        }
      });
    };
  }
})();
