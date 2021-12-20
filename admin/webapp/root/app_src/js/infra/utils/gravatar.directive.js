(function () {
  'use strict';

  angular
    .module('app.utils').directive('gravatar', gravatar);

  function gravatar() {
    return {
      restrict: 'AE',
      replace: true,
      scope: {
        name: '@',
        height: '@',
        width: '@',
        emailHash: '@'
      },
      link: function (scope, el, attr) {
        scope.defaultImage = 'app/img/user/profile.jpg';
      },
      template: '<img alt="{{ name }}" height="{{ height }}"  width="{{ width }}" src="https://secure.gravatar.com/avatar/{{ emailHash }}.jpg?s={{ width }}&d={{ defaultImage }}">'
    };
  }
})();
