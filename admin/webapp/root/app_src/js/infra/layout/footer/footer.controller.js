(function() {
  'use restict';
  angular
      .module('app.footer')
      .controller('FooterController', FooterController);
      FooterController.$inject = ['$rootScope', '$scope'];
      function FooterController($rootScope, $scope) {

        activate();

        function activate() {
          $rootScope.isFooterReady = true;
        }

      }
})();
