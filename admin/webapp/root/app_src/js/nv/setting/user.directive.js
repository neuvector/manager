(function () {
    'use strict';
    angular
        .module('app.login')
        .directive('users', users);

    function users() {
        return {
            restrict: "E",
            templateUrl: "/app/views/users.html"
        }
    }

})();
