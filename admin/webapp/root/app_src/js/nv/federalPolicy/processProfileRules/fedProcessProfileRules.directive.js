(function () {
    'use strict';
    angular
        .module('app.dashboard')
        .directive('federalPolicyProcessProfileRules', federalPolicyProcessProfileRules);

    function federalPolicyProcessProfileRules() {
        return {
            restrict: "E",
            templateUrl: "/app/views/components/federalPolicy/federal-policy-process-profile-rules.html"
        }
    }

})();
