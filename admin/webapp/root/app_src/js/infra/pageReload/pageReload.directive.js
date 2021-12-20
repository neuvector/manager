(function() {
    'use strict';

    angular
        .module('app.pageReload')
        .directive('pageReload', pageReload);

    function pageReload () {
      return {
          restrict: 'EAC',
          template: '<div class="page-reload-progress"><em class="fa fa-spin fa-spinner fa-lg" style="color: #dffcd7; position: absolute; left: 40px; top: 5px;"></em></div>',
          link: (scope, el) => {
            angular.element('body').css('overflow', 'hidden');
            el.addClass('page-reload');
            let loadedViewsCount = 0;
            scope.$on('$viewContentLoaded', function () {
              loadedViewsCount ++;
              if ( loadedViewsCount === 2) {
                el.addClass('page-reload-hidden');
              }
            });
          }
      };
    }
})();
