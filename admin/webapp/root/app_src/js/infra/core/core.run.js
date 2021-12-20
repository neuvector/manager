(function() {
    'use strict';

    angular
        .module('app.core')
        .run(appRun);

    appRun.$inject = ['$rootScope', '$state', '$stateParams',  '$window', '$templateCache', '$sanitize', '$http', '$timeout'];

    function appRun($rootScope, $state, $stateParams, $window, $templateCache, $sanitize, $http, $timeout) {

      let initTimer = new Date();
      let isFirstAction = true;
      let timeout = null;

      const debounced = function(delay, fn) {
        let timerId;
        return function (...args) {
          if (timerId) {
            clearTimeout(timerId);
          }
          timerId = setTimeout(() => {
            fn(...args);
            if ($rootScope.user) {
              if (timeout) $timeout.cancel(timeout);
              timeout = $timeout(() => {
                fn(...args);
              }, $rootScope.user.token.timeout * 1000 + 10000);
            }
            timerId = null;
          }, delay);
        }
      };

      const heartbeat = function() {
        let currTimer = new Date();
        if (currTimer - initTimer > 29000 || isFirstAction) {
          isFirstAction = false;
          initTimer = currTimer;
          if ($state.current.name !== "page.login") {
            $http
              .patch(HEART_BEAT_URL)
              .then((res) => {
                console.log("heartbeat...OK");
              })
              .catch((err) => {
                console.log("heartbeat...NG");
                angular.element("#alertify-cancel").click();
              });
          }
        }
      };

      const heartbeatWithDebounce = debounced(200, heartbeat);

      document.addEventListener("mousedown", heartbeatWithDebounce);
      document.addEventListener("wheel", heartbeatWithDebounce);

      $rootScope.$on("$destroy", function() {
        console.log("destorying heartbeat");
        document.removeEventListener("mousedown", heartbeatWithDebounce);
        document.removeEventListener("wheel", heartbeatWithDebounce);
      });

      var offevent = $rootScope.$on('ocLazyLoad.fileLoaded', function(e, file) {
        if (file.indexOf('ag-grid.min.js') > -1) {
          agGrid.initialiseAgGridWithAngular1(angular);
          offevent();
        }
      });

      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.$storage = $window.localStorage;
      $rootScope.cancel = function($event) {
        $event.stopPropagation();
      };

      $rootScope.$on('$stateNotFound',
        function(event, unfoundState) {
            console.log(unfoundState.to);
            console.log(unfoundState.toParams);
            console.log(unfoundState.options);
        });

      $rootScope.$on('$stateChangeError',
        function(event, toState, toParams, fromState, fromParams, error){
          console.log(error);
        });

      $rootScope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
          $window.scrollTo(0, 0);
          $rootScope.currTitle = $sanitize($state.current.title);
        });

      // Load a title dynamically
      $rootScope.currTitle = $state.current.title;
      $rootScope.pageTitle = function() {
        var title = $rootScope.app.name + ' - ' + ($rootScope.currTitle || $rootScope.app.description);
        document.title = title;
        return $sanitize(title);
      };
      $rootScope.topNav = 'app/views/partials/top-navbar.html?v=revisionHash';
      $rootScope.sideBar = 'app/views/partials/sidebar.html?v=revisionHash';
      $rootScope.footer = 'app/views/partials/footer.html?v=revisionHash';
    }

})();
