(function () {
    'use strict';
    angular
        .module('app.dashboard')
        .directive('federalConfig', federalConfig);

    function federalConfig() {
        return {
            restrict: "E",
            templateUrl: "app/views/components/federalPolicy/federal-config.html"
        }
    }

})();
