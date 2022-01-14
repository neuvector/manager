(function () {
    'use strict';
    angular
        .module('app.dashboard')
        .directive('federalPolicyAdmissionRules', federalPolicyAdmissionRules);

    function federalPolicyAdmissionRules() {
        return {
            restrict: "E",
            templateUrl: "app/views/components/federalPolicy/federal-policy-admission-rules.html"
        }
    }

})();
