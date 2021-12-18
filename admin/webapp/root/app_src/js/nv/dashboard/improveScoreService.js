(function() {
  "use strict";
  angular
    .module("app.dashboard")
    .factory("ImproveScoreFactory", function ImproveScoreFactory(
      $http,
      $translate,
      AuthorizationFactory
    ) {
      ImproveScoreFactory.STEP = [
        "summary",
        "serviceMode",
        "exposure",
        "privilege",
        "runAsRoot",
        "admission",
        "vulnerability",
        "conclusion"
      ];
      ImproveScoreFactory.init = function (isGlobalUser, scores) {
        const scoreInstructions = {
          serviceMode: {
            type: "serviceMode",
            brief: [
              $translate.instant("dashboard.improveScoreModal.summary.serviceMode.brief_1")
            ],
            advice: [
              $translate.instant("dashboard.improveScoreModal.summary.serviceMode.advice_1"),
              $translate.instant("dashboard.improveScoreModal.summary.serviceMode.advice_2")
            ],
            action: [
              $translate.instant("dashboard.improveScoreModal.summary.IMPROVE_IT"),
              $translate.instant("dashboard.improveScoreModal.summary.COMPLETED")
            ],
            isOpen: false,
            isCompleted: scores.serviceModeScore + scores.newServiceModeScore === 0
          },
          exposure: {
            type: "exposure",
            brief: [
              $translate.instant("dashboard.improveScoreModal.summary.exposure.brief_1")
            ],
            advice: [
              $translate.instant("dashboard.improveScoreModal.summary.exposure.advice_1"),
              $translate.instant("dashboard.improveScoreModal.summary.exposure.advice_2"),
              $translate.instant("dashboard.improveScoreModal.summary.exposure.advice_3"),
              $translate.instant("dashboard.improveScoreModal.summary.exposure.advice_4")
            ],
            action: [
              $translate.instant("dashboard.improveScoreModal.summary.IMPROVE_IT"),
              $translate.instant("dashboard.improveScoreModal.summary.COMPLETED")
            ],
            isOpen: false,
            isCompleted: scores.exposureScore === 0
          },
          privilege: {
            type: "privilege",
            brief: [
              $translate.instant("dashboard.improveScoreModal.summary.privilege.brief_1")
            ],
            advice: [
              $translate.instant("dashboard.improveScoreModal.summary.privilege.advice_1")
            ],
            action: [
              $translate.instant("dashboard.improveScoreModal.summary.VIEW_LIST"),
              $translate.instant("dashboard.improveScoreModal.summary.COMPLETED")
            ],
            isOpen: false,
            isCompleted: scores.privilegedContainerScore === 0
          },
          runAsRoot: {
            type: "runAsRoot",
            brief: [
              $translate.instant("dashboard.improveScoreModal.summary.runAsRoot.brief_1")
            ],
            advice: [
              $translate.instant("dashboard.improveScoreModal.summary.runAsRoot.advice_1")
            ],
            action: [
              $translate.instant("dashboard.improveScoreModal.summary.VIEW_LIST"),
              $translate.instant("dashboard.improveScoreModal.summary.COMPLETED")
            ],
            isOpen: false,
            isCompleted: scores.runAsRoot === 0
          },
          admission: {
            type: "admission",
            brief: [
              $translate.instant("dashboard.improveScoreModal.summary.admission.brief_1")
            ],
            advice: [
              $translate.instant("dashboard.improveScoreModal.summary.admission.advice_1")
            ],
            action: [
              $translate.instant("dashboard.improveScoreModal.summary.LEARN_HOW"),
              $translate.instant("dashboard.improveScoreModal.summary.COMPLETED")
            ],
            isOpen: false,
            isCompleted: scores.admissionRuleScore === 0
          },
          // vulnerability:
          // {
          //   type: "vulnerability",
          //   brief: [
          //     $translate.instant("dashboard.improveScoreModal.summary.vulnerability.brief_1")
          //   ],
          //   advice: [
          //     $translate.instant("dashboard.improveScoreModal.summary.vulnerability.advice_1"),
          //     $translate.instant("dashboard.improveScoreModal.summary.vulnerability.advice_2"),
          //     $translate.instant("dashboard.improveScoreModal.summary.vulnerability.advice_3"),
          //     $translate.instant("dashboard.improveScoreModal.summary.vulnerability.advice_4")
          //   ],
          //   action: [
          //     $translate.instant("dashboard.improveScoreModal.summary.VIEW_LIST"),
          //     $translate.instant("dashboard.improveScoreModal.summary.COMPLETED")
          //   ],
          //   isOpen: false,
          //   isCompleted: scores.vulnerabilityScore === 0
          // }
        };
        ImproveScoreFactory.summary = {
          currScore: {
            value: 0,
            test: ""
          },
          fixedScore: {
            value: 0,
            test: ""
          },
          description: $translate.instant("dashboard.improveScoreModal.summary.INSTRUCTION"),
          scoreInstructions: [],
          conclusion: [
            {
              title: $translate.instant("dashboard.improveScoreModal.summary.conclusion.CONGRATS"),
              statement: $translate.instant("dashboard.improveScoreModal.summary.conclusion.CONGRATS_STATE")
            },
            {
              title: $translate.instant("dashboard.improveScoreModal.summary.conclusion.WARNING"),
              statement: $translate.instant("dashboard.improveScoreModal.summary.conclusion.WARNING_STATE")
            }
          ],
          noChangeRemind: [
            $translate.instant("dashboard.improveScoreModal.summary.noChangeRemind.CONGRATS_STATE"),
            $translate.instant("dashboard.improveScoreModal.summary.noChangeRemind.WARNING_STATE")
          ]
        };
        if (AuthorizationFactory.getDisplayFlag("improve_score_on_service_mode")) {
          ImproveScoreFactory.summary.scoreInstructions.push(scoreInstructions.serviceMode);
        }
        if (AuthorizationFactory.getDisplayFlag("improve_score_on_exposure")) {
          ImproveScoreFactory.summary.scoreInstructions.push(scoreInstructions.exposure);
        }
        if (AuthorizationFactory.getDisplayFlag("improve_score_on_privileged")) {
          ImproveScoreFactory.summary.scoreInstructions.push(scoreInstructions.privilege);
        }
        if (AuthorizationFactory.getDisplayFlag("improve_score_on_runasroot")) {
          ImproveScoreFactory.summary.scoreInstructions.push(scoreInstructions.runAsRoot);
        }
        if (AuthorizationFactory.getDisplayFlag("improve_score_on_admission")) {
          ImproveScoreFactory.summary.scoreInstructions.push(scoreInstructions.admission);
        }
      };


      ImproveScoreFactory.result = {
        prevScore: {
          value: 0,
          text: ""
        },
        currScore: {
          value: 0,
          text: ""
        },
        title: "",
        conclusion: ""
      };

      ImproveScoreFactory.openAdvice = function(index) {
        ImproveScoreFactory.summary.scoreInstructions.forEach(function(instruction, id) {
          if (index === id) {
            instruction.isOpen = true;
          } else {
            instruction.isOpen = false;
          }
        });
      };

      ImproveScoreFactory.closeAdvice = function(index) {
        ImproveScoreFactory.summary.scoreInstructions[index].isOpen = false;
      };

      ImproveScoreFactory.toggleAdvice = function(isOpen, index) {
        if (isOpen) {
          this.closeAdvice(index);
        } else {
          this.openAdvice(index);
        }
      }

      ImproveScoreFactory.calulateScoreData = function(scoreInputs, success, error,isGlobalUser, totalRunningPods) {
        $http
          .patch(DASHBOARD_SCORES_URL, scoreInputs, {params: {isGlobalUser: isGlobalUser, totalRunningPods: totalRunningPods}})
          .then(function(response){
            success(response);
          })
          .catch(function(err) {
            error(err);
          })
      }

      return ImproveScoreFactory;
    });
})();
