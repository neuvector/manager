(function() {
    'use strict';

    angular
        .module('app.translate')
        .run(translateRun)
        ;
    translateRun.$inject = ['$rootScope', '$translate'];

    function translateRun($rootScope, $translate){

      $rootScope.language = {
        init: function () {
          var proposedLanguage = $translate.proposedLanguage() || $translate.use();
          var preferredLanguage = $translate.preferredLanguage();
        },
        set: function (localeId) {
          if (localeId.length === 0) {
            $translate.use('en');
          } else {
            $translate.use(localeId);
          }
        },
        languageOptions: {
          'en':       'English',
          'zh_cn':    '中文'
        }
      };

      $rootScope.language.init();
    }
})();
