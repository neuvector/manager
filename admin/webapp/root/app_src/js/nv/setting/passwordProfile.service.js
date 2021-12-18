(function() {
  "use strict";
  angular
    .module("app.login")
    .factory("PasswordProfileFactory", function(
      $http
    ) {
      const PasswordProfileFactory = {};
      PasswordProfileFactory.getPasswordProfileData = function() {
        return $http.get(PASSWORD_PROFILE);
      };

      PasswordProfileFactory.getPublicPasswordProfileData = function() {
        return $http.get(PUBLIC_PASSWORD_PROFILE);
      };

      PasswordProfileFactory.updatePasswordProfileData = function(config) {
        return $http.patch(PASSWORD_PROFILE, config);
      };

      PasswordProfileFactory.getSelfProfile = function() {
        return $http.get(SELF_URL, {params: {isOnNV: "true"}});
      };

      PasswordProfileFactory.clearUserBlock = function(username) {
        let config = {
          config: {
              fullname: username,
              clear_failed_login: true
          }
        }
        return $http.post(USER_BLOCK_URL, config);
      };

      PasswordProfileFactory.resetExpiredPassword = function(username, password) {
        let config = {
          config: {
              fullname: username,
              new_password: password
          }
        }
        return $http.post(USER_BLOCK_URL, config);
      };

      PasswordProfileFactory.checkPassword = function(password, profile) {
        const PATTERNS = {
          UPPER: new RegExp(/[A-Z]/),
          LOWER: new RegExp(/[a-z]/),
          DIGIT: new RegExp(/[0-9]/),
          SP_CHAR: new RegExp(/[\!|\"|\#|\$|\%|\&|\'|\(|\)|\*|\+|\,|\-|\.|\/|\:|\;|\<|\=|\>|\?|\@|\[|\\|\]|\^|\_|\`|\{|\||\}|\~]/)
        };
        let count = {
          upper: 0,
          lower: 0,
          digit: 0,
          spChar: 0
        };

        if (password && password.length > 0) {
          password.split("").forEach(ch => {
            if (PATTERNS.UPPER.test(ch)) count.upper++;
            if (PATTERNS.LOWER.test(ch)) count.lower++;
            if (PATTERNS.DIGIT.test(ch)) count.digit++;
            if (PATTERNS.SP_CHAR.test(ch)) count.spChar++;
          });
        }
        console.log(count.digit, profile.min_digit_count)

        return {
          isReachingMinUpper: count.upper >= profile.min_uppercase_count,
          isReachingMinLower: count.lower >= profile.min_lowercase_count,
          isReachingMinDigit: count.digit >= profile.min_digit_count,
          isReachingMinSpChar: count.spChar >= profile.min_special_count
        }
      };

      return PasswordProfileFactory;
    });
})();
