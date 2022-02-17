(function() {
  "use strict";

  angular.module("app.core").config(coreConfig);
  angular.module("app.core").config(sceConfig);

  coreConfig.$inject = [
    "$controllerProvider",
    "$compileProvider",
    "$filterProvider",
    "$provide",
    "$httpProvider",
    "$animateProvider",
    "$uibTooltipProvider"
  ];
  function coreConfig(
    $controllerProvider,
    $compileProvider,
    $filterProvider,
    $provide,
    $httpProvider,
    $animateProvider,
    $uibTooltipProvider
  ) {
    let core = angular.module("app.core");
    $compileProvider.directive('compile', function($compile) {
      return function(scope, element, attrs) {
        scope.$watch(
          function(scope) {
            return scope.$eval(attrs.compile);
          },
          function(value) {
            element.html(value);
            $compile(element.contents())(scope);
          }
        );
      };
    });
    core.controller = $controllerProvider.register;
    core.directive = $compileProvider.directive;
    core.filter = $filterProvider.register;
    core.factory = $provide.factory;
    core.service = $provide.service;
    core.constant = $provide.constant;
    core.value = $provide.value;

    $uibTooltipProvider.options({
      appendToBody: true
    });

    $animateProvider.classNameFilter(/^((?!(ng-no-animation)).)*$/);

    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|blob):/);

    $provide.factory("NVHttpInterceptor", function(
      $injector,
      $q,
      $location,
      $window,
      $rootScope
    ) {
      return {
        response: function(response) {
          return response || $q.when(response);
        },

        responseError: function(rejection) {
          console.log(rejection);
          if (
            (rejection.status === 408 || rejection.status === 401) &&
            rejection.config.url !== "/login" &&
            rejection.config.url !== "/auth"
          ) {
            let $state = $injector.get("$state");
            let origin = $location.url();
            if (origin !== "/page/login" && origin !== "/page/logout" ) {
              $window.sessionStorage.setItem(
                "from",
                JSON.stringify($location.url())
              );
              $window.sessionStorage.removeItem("token");
              $window.sessionStorage.removeItem("cluster");
            }
            $rootScope.sidebarDone = false;
            $rootScope.versionDone = false;
            $rootScope.isFooterReady = false;
            if ($rootScope.logout) {
              $rootScope.logout(true);
            } else {
              $state.go($rootScope.isSUSESSO ? "page.logout" : "page.login");
            }
            console.log("reject back");
            if(rejection.status === 408){
              $rootScope.sessionTimeout = true;
            }
            return $q.reject(rejection);
          } else return $q.reject(rejection);
        }
      };
    });

    $httpProvider.interceptors.push("NVHttpInterceptor");
  }

  sceConfig.$inject = [
    "$sceDelegateProvider"
  ];
  function sceConfig(
    $sceDelegateProvider
  ) {
    console.log("Config sce delegate for domain whitelist");
    $sceDelegateProvider.resourceUrlWhitelist([
      'self'
    ]);
  }
})();
