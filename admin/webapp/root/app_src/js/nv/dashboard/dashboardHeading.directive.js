(function () {
  'use strict';

  angular
    .module('app.dashboard')
    .directive('dashboardHeading', dashboardHeading);

  angular
    .module('app.dashboard')
    .directive('newDashboardHeading', newDashboardHeading);

    function dashboardHeading() {
      return {
        restrict: "E",
        scope: {
          category: "=category"
        },
        templateUrl: "/app/views/components/dashboard-heading.html"
      }
    }

    function newDashboardHeading() {
      return {
        restrict: "E",
        scope: {
          category: "=category"
        },
        templateUrl: "/app/views/components/new-dashboard-heading.html"
      }
    }
})();
