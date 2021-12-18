(function() {
    'use strict';

    angular
        .module('app.translate')
        .config(translateConfig)
        ;
    translateConfig.$inject = ['$translateProvider'];
    function translateConfig($translateProvider){

      $translateProvider.useStaticFilesLoader({
          prefix : 'app/i18n/',
          suffix : '.json?v=revisionHash'
      });

      $translateProvider.preferredLanguage('en');
      $translateProvider.usePostCompiling(true);
      $translateProvider.useSanitizeValueStrategy('sanitizeParameters');

    }
})();
