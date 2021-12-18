(function() {
  "use strict";

  angular
    .module("app.login")
    .controller("ConsoleController", ConsoleController);

  ConsoleController.$inject = ["$scope", "$http", "$timeout", "$translate"];
  function ConsoleController($scope, $http, $timeout, $translate) {
    // send output to terminal
    setTimeout(function() {
      $scope.$broadcast("terminal-output", {
        output: true,
        text: [
          "Welcome to the NeuVector command line.",
          "Type help or ? to list commands."
        ],
        breakLine: true
      });

      $scope.$broadcast("terminal-command", {
        command: "change-prompt",
        prompt: { user: "admin", path: "127.0.0.1" }
      });
      $scope.$apply();
    }, 100);

    //get input from terminal
    $scope.$on("terminal-input", function(e, consoleInput) {
      console.log(consoleInput);
      let cmd = consoleInput[0];
      console.log(cmd);
      // do stuff
    });
  }
})();
