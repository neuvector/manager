(function () {
    'use strict';
    angular
        .module('app.dashboard')
        .directive('federalPolicyFileAccessRules', federalPolicyFileAccessRules);

    function federalPolicyFileAccessRules() {
        return {
            restrict: "E",
            templateUrl: "app/views/components/federalPolicy/federal-policy-file-access-rules.html"
        }
    }

})();
