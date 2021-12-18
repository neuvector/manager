(function() {
    'use strict';

    angular
        .module('app.routes')
        .provider('RouteHelpers', RouteHelpersProvider)
        ;

    RouteHelpersProvider.$inject = ['APP_REQUIRES'];
    function RouteHelpersProvider(APP_REQUIRES) {
      let version = 'revisionHash';
      window.localStorage.setItem("version", version);

      return {
        basePath: basePath,
        pagePath: pagePath,
        resolveFor: resolveFor,
        $get: function() {
          return {
            basePath: basePath,
            pagePath: pagePath,
            resolveFor: resolveFor
          };
        }
      };

      function basePath(uri) {
        return 'app/views/' + uri + '?v=' + version;
      }

      function pagePath(uri) {
        return 'app/pages/' + uri + '?v=' + version;
      }

      function resolveFor() {
        var _args = arguments;
        return {
          deps: ['$ocLazyLoad','$q', function ($ocLL, $q) {
            var promise = $q.when(1);
            for(var i=0, len=_args.length; i < len; i ++){
              promise = andThen(_args[i]);
            }
            return promise;

            function andThen(_arg) {
              if(typeof _arg === 'function')
                  return promise.then(_arg);
              else
                  return promise.then(function() {
                    var whatToLoad = getRequired(_arg);
                    if(!whatToLoad) return $.error('Route resolve: Bad resource name [' + _arg + ']');
                    return $ocLL.load( whatToLoad );
                  });
            }
            function getRequired(name) {
              if (APP_REQUIRES.modules)
                  for(var m in APP_REQUIRES.modules)
                      if(APP_REQUIRES.modules[m].name && APP_REQUIRES.modules[m].name === name)
                          return APP_REQUIRES.modules[m];
              return APP_REQUIRES.scripts && APP_REQUIRES.scripts[name];
            }

          }]};
      } // resolveFor

    }


})();
