(function () {
  "use strict";

  angular
    .module('app.common')
    .directive('displayControl', DisplayControl)
    .directive('disabledControl', DisabledControl);

  DisplayControl.$inject = [
    "$rootScope",
    "$sanitize",
    "$timeout",
    "AuthorizationFactory"
  ];
  function DisplayControl(
    $rootScope,
    $sanitize,
    $timeout,
    AuthorizationFactory
  ) {
    return {
      restrict: 'A',
      scope: {
        displayControl: '@'
      },

      link: function (scope, elem, attrs) {
        if (AuthorizationFactory.getDisplayFlag(scope.displayControl)) {
          elem.show();
        } else {
          elem.hide();
        }
      }
    };
  }

  DisabledControl.$inject = [
    "$sanitize",
    "$timeout",
    "AuthorizationFactory"
  ];
  function DisabledControl(
    $sanitize,
    $timeout,
    AuthorizationFactory
  ) {
    return {
      restrict: 'A',
      scope: {
        disabledControl: '@'
      },

      link: function (scope, elem, attrs) {
        if (AuthorizationFactory.getDisplayFlag(scope.disabledControl)) {
          elem.removeAttr('disabled');
        } else {
          elem.attr('disabled', 'disabled');
        }
      }
    };
  }
})();
