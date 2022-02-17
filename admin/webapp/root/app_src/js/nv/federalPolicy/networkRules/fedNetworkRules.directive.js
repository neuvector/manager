(function () {
    'use strict';
    angular
        .module('app.dashboard')
        .directive('federalPolicyNetworkRules', federalPolicyNetworkRules);

    function federalPolicyNetworkRules() {
        return {
            restrict: "E",
            templateUrl: "app/views/components/federalPolicy/federal-policy-network-rules.html"
        }
    }

})();
