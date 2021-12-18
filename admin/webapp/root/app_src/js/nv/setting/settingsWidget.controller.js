(function() {
  'use strict';
  angular
    .module('app.settingsWidget')
    .controller('settingsWidgetContoller', ['$scope', function($scope) {
      $scope.goSettingDetails = function(url) {
        document.location.href = url;
      }
    }]);
})();
