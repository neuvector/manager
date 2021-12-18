(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("AdmissionFactory", function AdmissionFactory(
      $translate
    ) {
      AdmissionFactory.init = function() {
        AdmissionFactory.admission = {
          description: $translate.instant("dashboard.improveScoreModal.admission.DESCRIPTION"),
          currScore: {
            value: 0,
            test: ""
          },
          futureScore: {
            value: 0,
            test: ""
          }
        };
      }

      return AdmissionFactory;
    });
})();
