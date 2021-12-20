(function () {
    'use strict';
    angular
        .module('app.dashboard')
        .directive('federalPolicyGroup', federalPolicyGroup);

    function federalPolicyGroup() {
        return {
            restrict: "E",
            templateUrl: "/app/views/components/federalPolicy/federal-policy-group.html"
        }
    }

})();
