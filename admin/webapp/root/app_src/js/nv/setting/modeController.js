(function () {
  'use strict';

  angular
    .module('app.login')
    .controller('ModeController', ModeController);

  ModeController.$inject = ['$scope', '$translate', '$http', 'Alertify'];
  function ModeController($scope, $translate, $http, Alertify) {
    var vm = this;
    activate();

    function activate() {

      vm.modes = {
        "Discover": $translate.instant('topbar.mode.LEARNING'),
        "Monitor": $translate.instant('topbar.mode.EVALUATION'),
        "Protect": $translate.instant('topbar.mode.ENFORCE')
      };

      $http.get('/config').then(function (response) {
        if(response)
          vm.selectedMode = vm.modes[response.data.config.policy_mode];
      }).catch(function (error) {
        console.log(error)
      });

      vm.modes.set = function (id, event) {
        event.stopPropagation();
        if(vm.selectedMode === vm.modes['Discover'] && id === 'Discover' ||
          vm.selectedMode === vm.modes['Monitor'] && id === 'Monitor' ||
          vm.selectedMode === vm.modes['Protect'] && id === 'Protect')
          return;
        else {
          Alertify.confirm(getMessage(id))
            .then(function onOk() {
                $http.patch('/config', {policy_mode: id}).then(function () {
                  vm.selectedMode = vm.modes[id];
                }).catch(function (error) {
                  console.log(error);
                });
              },
              function onCancel() {
              });
        }
      };
    }

    function getMessage(id) {
      if(vm.selectedMode === vm.modes['Discover'] && id === 'Monitor')
        return $translate.instant('topbar.mode.LEARN_EVALUATE');
      else if(vm.selectedMode === vm.modes['Discover'] && id === 'Protect')
        return $translate.instant('topbar.mode.LEARN_ENFORCE');
      else if(vm.selectedMode === vm.modes['Monitor'] && id === 'Protect')
        return $translate.instant('topbar.mode.EVALUATE_ENFORCE');
      else
        return $translate.instant('topbar.mode.SWITCH') + vm.modes[id] + $translate.instant('topbar.mode.MODE');
    }
  }
})();
