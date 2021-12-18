(function() {
    'use strict';

    angular
        .module('app.settings')
        .run(settingsRun);

    settingsRun.$inject = ['$rootScope', '$localStorage', '$window'];

    function settingsRun($rootScope, $localStorage, $window){

      $rootScope.app = {
        name: 'NeuVector',
        description: 'NeuVector Security Console',
        year: ((new Date()).getFullYear()),
        layout: {
          isFixed: true,
          isCollapsed: false,
          isBoxed: false,
          isRTL: false,
          horizontal: false,
          isFloat: false,
          asideHover: false,
          asideScrollbar: false
        },
        useFullLayout: false,
        hiddenFooter: false,
        offsidebarOpen: false,
        asideToggled: false,
        viewAnimation: 'ng-fadeInUp'
      };

    }

})();
