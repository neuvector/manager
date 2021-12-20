(function() {
    'use strict';

    angular
        .module('app.sidebar')
        .service('SidebarService', SidebarService);

    SidebarService.$inject = ['$http','$rootScope', '$window', "$translate"];
    function SidebarService($http, $rootScope, $window, $translate) {
        this.getMenu = getMenu;

        ////////////////

        function getMenu(isAdmin, onSuccess, onError) {
          let token = JSON.parse($window.sessionStorage.getItem("token"));
          let menuJson = isAdmin ? SIDE_BAR_ADMIN : SIDE_BAR_USER;

          let cachedVersion = $window.localStorage.getItem("version");
          if (cachedVersion && $rootScope.js_version !== cachedVersion) {
            console.log("Got new menu!", $rootScope.js_version, $window.localStorage.getItem("version"));
            $translate.refresh();
            $window.localStorage.setItem("version", $rootScope.js_version);
          }

          onError = onError || function() { alert('Error happens when loading menu'); };

          $http
            .get(menuJson)
            .success(onSuccess)
            .error(onError);
        }
    }
})();
