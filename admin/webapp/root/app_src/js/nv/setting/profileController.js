(function () {
  "use strict";

  angular
    .module("app.login")
    .controller("ProfileController", ProfileController);

  ProfileController.$inject = [
    "$scope",
    "$http",
    "$rootScope",
    "$window",
    "$translate",
    "$stateParams",
    "Alertify",
    "Utils",
    "UserFactory",
    "PasswordProfileFactory"
  ];
  function ProfileController(
    $scope,
    $http,
    $rootScope,
    $window,
    $translate,
    $stateParams,
    Alertify,
    Utils,
    UserFactory,
    PasswordProfileFactory
  ) {
    $scope.editMode = $stateParams.isChangingPassword;
    activate();
    function activate() {
      function init() {
        $scope.user = angular.copy($rootScope.user.token);
        if ($scope.user.role === "") {
          $scope.displayRole = "namespace_user";
          $scope.user.role = "None";
        } else {
          $scope.displayRole = UserFactory.parseRole($scope.user.role);
        }
        $scope.emailHash = $rootScope.user.emailHash;
        $scope.isLocalUser = $rootScope.user.token.server === "";
        $scope.newPassword = {};
        $rootScope.toastWarnings();
      }

      const preparePasswordCheckList = function() {
        $scope.minLengthTxt = $translate.instant("user.passwordRequirement.MIN_LENGTH", {minLength: $scope.passwordProfile.min_len});
        $scope.minUpperTxt = $translate.instant("user.passwordRequirement.MIN_UPPER", {minUpper: $scope.passwordProfile.min_uppercase_count});
        $scope.minLowerTxt = $translate.instant("user.passwordRequirement.MIN_LOWER", {minLower: $scope.passwordProfile.min_lowercase_count});
        $scope.minDigitTxt = $translate.instant("user.passwordRequirement.MIN_DIGIT", {minDigit: $scope.passwordProfile.min_digit_count});
        $scope.minSpCharTxt = $translate.instant("user.passwordRequirement.MIN_SP_CHAR", {minSpChar: $scope.passwordProfile.min_special_count});
      };

      const initPasswordProfile = function() {
        $scope.isPasswordValid = true;

        $scope.isReachingMinLength = false;
        $scope.isReachingMinUpper = false;
        $scope.isReachingMinLower = false;
        $scope.isReachingMinDigit = false;
        $scope.isReachingMinSpChar = false;

        PasswordProfileFactory.getPublicPasswordProfileData()
        .then((res) => {
          $scope.passwordProfile = res.data.pwd_profile;
          preparePasswordCheckList();
          $scope.checkPassword();
        })
        .catch((err) => {
          $scope.passwordProfile = {
            min_len: 0,
            min_uppercase_count: 0,
            min_lowercase_count: 0,
            min_digit_count: 0,
            min_special_count: 0
          };
        });
      };

      if ($scope.editMode) {
        initPasswordProfile();
      }
      init();

      $scope.checkPassword = function(password) {
        $scope.isReachingMinLength = password && password.length >= $scope.passwordProfile.min_len;
        $scope.isCharReqValid = PasswordProfileFactory.checkPassword(password, $scope.passwordProfile);
        $scope.isPasswordValid =
          $scope.isReachingMinLength &&
          $scope.isCharReqValid.isReachingMinUpper &&
          $scope.isCharReqValid.isReachingMinLower &&
          $scope.isCharReqValid.isReachingMinDigit &&
          $scope.isCharReqValid.isReachingMinSpChar;
      };

      $scope.getAvatar = function () {
        return (
          "https://secure.gravatar.com/avatar/" +
          $scope.emailHash +
          "?s=80&d=https%3A%2F%2Fui-avatars.com%2Fapi%2F/" +
          $scope.user.username +
          "/80/" +
          Utils.stringToColour($scope.user.username) +
          "/fff"
        );
      };

      $scope.openEdit = function () {
        $scope.editMode = !$scope.editMode;
        $scope.newPassword = {};
        if ($scope.editMode === false) {
          init();
          $scope.profileForm.$setPristine();
        } else {
          initPasswordProfile();
        }
      };

      $scope.updateProfile = function (user) {
        if (user.role === "None") user.role = "";
        user.timeout = parseInt(user.timeout, 10);

        let payload = user;
        if (user.server && user.role === "reader") {
          payload = {
            fullname: user.fullname,
            username: user.username,
            timeout: user.timeout,
            locale: user.locale,
            modify_password: user.modify_password,
            server: user.server,
            default_password: user.default_password,
          };
        }

        $http
          .patch(USERS_URL, payload)
          .then(function (response) {
            $rootScope.language.set(user.locale);
            if (user.locale !== "zh_cn") moment.locale("en");
            else moment.locale("zh-cn");
            let profile = response.data;
            //a little hack here
            if (profile.token.role === "none") profile.token.role = user.role;
            $window.sessionStorage.setItem("token", JSON.stringify(profile));
            $rootScope.user = profile;
            $scope.emailHash = profile.emailHash;
            $scope.profileForm.$setPristine();
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("profile.SUBMIT_OK"));
            $rootScope.logout();
          })
          .catch(function (error) {
            console.warn(error);
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  error,
                  $translate.instant("profile.SUBMIT_FAILED"),
                  false
                )
              );
              $scope.passwordProfile = error.data.password_profile_basic || $scope.passwordProfile;
              preparePasswordCheckList();
              $scope.checkPassword();
              
              // reset password form on failure
              $scope.user.password = "";
              $scope.user.new_password = "";
              $scope.newPassword.match = "";
              $scope.profileForm.$setPristine();
              $scope.profileForm.$setUntouched();
            }
          });
      };

      $scope.cancel = function () {
        $scope.user = angular.copy($rootScope.user.token);
        if ($scope.user.role === "") {
          $scope.user.role = "None";
        }
        $scope.emailHash = $rootScope.user.emailHash;
        $scope.profileForm.$setPristine();
        $scope.profileForm.$setUntouched();
        $scope.editMode = false;
      };

      $scope.$on("$destroy", function () {
        if ($scope.user) $scope.user = {};
      });
    }
  }
})();
