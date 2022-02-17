(function () {
    'use strict';
    angular
        .module('app.login')
        .directive('roles', roles);

    function roles() {
        return {
            restrict: "E",
            templateUrl: "app/views/customRoles.html"
        }
    }

})();
