(function () {
    'use strict';
    angular
        .module('app.dashboard')
        .directive('federalPolicyResponseRules', federalPolicyResponseRules);

    function federalPolicyResponseRules() {
        return {
            restrict: "E",
            templateUrl: "/app/views/components/federalPolicy/federal-policy-response-rules.html"
        }
    }

})();
