(function () {
    'use strict';
    angular
        .module('app.login')
        .directive('passwordProfile', passwordProfile);

    function passwordProfile() {
        return {
            restrict: "E",
            templateUrl: "app/views/password-profile.html"
        }
    }

})();
