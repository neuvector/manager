(function () {
  "use strict";

  angular
    .module("app.dashboard")
    .controller("DashboardController", DashboardController);

  DashboardController.$inject = [
    "$rootScope",
    "$filter",
    "$window",
    "$scope",
    "$http",
    "$translate",
    "$state",
    "$timeout",
    "Utils",
    "Alertify",
    "FileSaver",
    "DashboardFactory",
    "$interval",
    "$sce",
    "$sanitize",
    "$mdDialog",
    "ImproveScoreFactory",
    "AuthorizationFactory",
    "$controller",
  ];
  function DashboardController(
    $rootScope,
    $filter,
    $window,
    $scope,
    $http,
    $translate,
    $state,
    $timeout,
    Utils,
    Alertify,
    FileSaver,
    DashboardFactory,
    $interval,
    $sce,
    $sanitize,
    $mdDialog,
    ImproveScoreFactory,
    AuthorizationFactory,
    $controller
  ) {
    //=======For preloading English translation file only=====
    $translate.instant("general.VERSION", {}, "", "en");
    //=======For preloading English translation file only=====
    $scope.worker = null;
    $scope.isKube = $scope.summary.platform.toLowerCase().indexOf(KUBE) !== -1;
    $scope.onPDFDownload = false;
    $scope.isScanAuthorized = AuthorizationFactory.getDisplayFlag(
      "runtime_scan"
    );
    $scope.isNamespaceUser =
      AuthorizationFactory.userPermission.isNamespaceUser;

    $scope.namespaceName = {
      text: $translate.instant("dashboard.ALL_NAMESPACE"),
      value: "all",
    };

    const resource = {
      seeScore: {
        global: 1,
        namespace: 1,
      },
    };

    let isSUSESSO = $rootScope.isSUSESSO;

    $scope.isShowingScore = Utils.isAuthorized(
      $scope.user.roles,
      resource.seeScore
    );

    $scope.showDownloadModal = function () {
      $scope.onPDFDownload = true;
    };

    $scope.hideDownloadModal = function () {
      $scope.onPDFDownload = false;
    };

    const ELEM_RBAC_ERROR_BOX = document.getElementById("rbacErrorBox");
    Utils.dragElement(ELEM_RBAC_ERROR_BOX);

    function preparePdfData() {
      let criticalSecurityEventCanvas = document
        .getElementById("critical-security-event-combined-chart-pdf")
        .toDataURL();
      let topSecurityEventSourceCanvas = document
        .getElementById("top-sec-event-source-pdf")
        .toDataURL();
      let topSecurityEventDestinationCanvas = document
        .getElementById("top-sec-event-destination-pdf")
        .toDataURL();
      let policyMode4ServicesCanvas = document
        .getElementById("service-policy-mode-chart-pdf")
        .toDataURL();
      let policyMode4PodsCanvas = document
        .getElementById("container-mode-chart-pdf")
        .toDataURL();
      let protocolAppCoverageCanvas = document
        .getElementById("policy-apps2-chart-pdf")
        .toDataURL();
      let protocolAppVolumeCanvas = document
        .getElementById("policy-apps3-chart-pdf")
        .toDataURL();
      let ingressEgressConnCanvas2 = document
        .getElementById("containers-sec-chart-pdf2")
        .toDataURL();
      let ingressEgressConnCanvas = document
        .getElementById("containers-sec-chart-pdf2")
        .toDataURL();
      let topVulsContainerCanvas = document
        .getElementById("top-vuls-container-pdf")
        .toDataURL();
      let topVulsNodeCanvas = document
        .getElementById("top-vuls-node-pdf")
        .toDataURL();
      let topSecurityEventsSource = [];
      let topSecurityEventsDestination = [];
      // let unlearntServices4Grid = [
      //   [
      //     $translate.instant(
      //       "dashboard.panelItems.servicesHeader.NAMESPACE",
      //       {},
      //       "",
      //       "en"
      //     ),
      //     $translate.instant(
      //       "dashboard.panelItems.servicesHeader.SERVICE",
      //       {},
      //       "",
      //       "en"
      //     ),
      //     $translate.instant(
      //       "dashboard.panelItems.servicesHeader.POLICY_MODE",
      //       {},
      //       "",
      //       "en"
      //     ),
      //     $translate.instant(
      //       "dashboard.panelItems.servicesHeader.MEMBERS",
      //       {},
      //       "",
      //       "en"
      //     ),
      //   ],
      // ];
      // unlearntServices4Grid = unlearntServices4Grid.concat(
      //   angular.copy($scope.policyCoverage["others"]).map(function (row) {
      //     row.members = row.members.length;
      //     return Object.values(row);
      //   })
      // );
      let ingressPdfGridData = $scope.ingressPdfGridData4Pdf;
      let egressPdfGridData = $scope.egressPdfGridData4Pdf;
      let criticalSecurityEvent = $scope.criticalSecurityEvent4Pdf;

      let noCriticalSecurityEvent = "";
      let noManagedServices = "";
      let noManagedContainers = "";
      let noPolicyApplication = "";
      let noExposedContainers = "";
      let noTopVulnerabileContainers = "";
      let noTopVulnerabileNodes = "";

      $scope.topSecurityEventsSourceLabels4Pdf.forEach(function (label, index) {
        if (label) {
          topSecurityEventsSource.push(
            `${index + 1} - ${Utils.shortenString(label, 50)}: ${
              $scope.topSecurityEventsSourceData4Pdf[index]
            }`
          );
        } else {
          topSecurityEventsSource.push(" ");
        }
      });
      topSecurityEventsSource = topSecurityEventsSource.join("\n");
      $scope.topSecurityEventsDestinationLabels4Pdf.forEach(function (label, index) {
        if (label) {
          topSecurityEventsDestination.push(
            `${index + 1} - ${Utils.shortenString(label, 50)}: ${
              $scope.topSecurityEventsDestinationData4Pdf[index]
            }`
          );
        } else {
          topSecurityEventsDestination.push(" ");
        }
      });
      topSecurityEventsDestination = topSecurityEventsDestination.join("\n");

      if ($scope.noCriticalSecurityEventsCombined4Pdf) {
        noCriticalSecurityEvent = $translate.instant(
          "dashboard.body.message.NO_CRITICAL_SECURITY_EVENT",
          {},
          "",
          "en"
        );
      }

      if ($scope.noManagedServices4Pdf) {
        noManagedServices = $translate.instant(
          "dashboard.body.message.NO_MANAGED_SERVICES",
          {},
          "",
          "en"
        );
      }
      if ($scope.noManagedContainers4Pdf) {
        noManagedContainers = $translate.instant(
          "dashboard.body.message.NO_MANAGED_CONTAINERS",
          {},
          "",
          "en"
        );
      }
      if ($scope.noPolicyApplication24Pdf) {
        noPolicyApplication = $translate.instant(
          "dashboard.body.message.NO_POLICY_APPLICATION",
          {},
          "",
          "en"
        );
      }
      if ($scope.noExposedContainers4Pdf) {
        noExposedContainers = $translate.instant(
          "dashboard.body.message.NO_EXPOSURE",
          {},
          "",
          "en"
        );
      }
      if ($scope.noTopVulnerabileContainers4Pdf) {
        noTopVulnerabileContainers = $translate.instant(
          "dashboard.body.message.NO_VULNERABLE_CONTAINER",
          {},
          "",
          "en"
        );
      }
      if ($scope.noTopVulnerabileNodes4Pdf) {
        noTopVulnerabileNodes = $translate.instant(
          "dashboard.body.message.NO_VULNERABLE_NODE",
          {},
          "",
          "en"
        );
      }

      console.log(
        "criticalSecurityEventsData4Pdf: ",
        $scope.criticalSecurityEventsData4Pdf
      );

      return {
        canvas: {
          criticalSecurityEventCanvas,
          topSecurityEventSourceCanvas,
          topSecurityEventDestinationCanvas,
          ingressEgressConnCanvas2,
          policyMode4ServicesCanvas,
          policyMode4PodsCanvas,
          protocolAppCoverageCanvas,
          protocolAppVolumeCanvas,
          ingressEgressConnCanvas,
          topVulsContainerCanvas,
          topVulsNodeCanvas
        },
        details: {
          topSecurityEventsSource,
          topSecurityEventsDestination,
          criticalSecurityEvent,
          noCriticalSecurityEvent,
          noManagedServices,
          noManagedContainers,
          noPolicyApplication,
          noTopVulnerabileContainers,
          noTopVulnerabileNodes,
          // unlearntServices4Grid,
          ingressPdfGridData,
          egressPdfGridData,
          noExposedContainers
        },
      };
    }

    const _downloadPdf = function (domain, $index) {
      let pdfData = preparePdfData();
      let docDefinition = DashboardFactory.defineDoc(pdfData);

      let pdf = pdfMake.createPdf(docDefinition);
      pdf.getBlob(function (blob) {
        $scope.isPdfPreparing = false;
        if (domain === "no-namespace") {
          FileSaver.saveAs(blob, `Security Event and Risk Report_${Utils.parseDatetimeStr(new Date())}.pdf`);
        } else {
          FileSaver.saveAs(
            blob,
            `Security Event and Risk Report_${$scope.namespaceName.text}_${Utils.parseDatetimeStr(new Date())}.pdf`
          );
          if (domain === "all") $scope.isPdfPreparing4AllNamespace = false;
          else $scope.isPdfPreparing4Namespace[$index] = false;
          $scope.isPdfPreparing4Namespaces = false;
        }
        $scope.$apply();
      });
    };

    const getDashboardNotificationsBySync = function () {
      $scope.isSecEventReady = false;
      $http
        .get(DASHBOARD_NOTIFICATIONS_URL)
        .then(function (response) {
          let criticalSecurityEvent = response.data.criticalSecurityEvents;
          criticalSecurityEventsCombinedPreprocess(criticalSecurityEvent);
          renderCriticalSecurityEnvetsCombinedLineChart(
            criticalSecurityEvent.summary
          );
          $scope.isSecEventReady = true;
        })
        .catch(function (err) {
          $scope.securityEventError = true;
          $scope.isSecEventReady = true;
          $scope.securityEventErrorMessage = Utils.getErrorMessage(err);
        });
    };

    const getDashboardNotificationsBySync4Pdf = function (domain, $index) {
      let _domain = domain === "all" || domain === "no-namespace" ? "" : domain;
      $http
        .get(DASHBOARD_NOTIFICATIONS_URL, { params: { domain: _domain } })
        .then(function (response) {
          let criticalSecurityEvent = response.data.criticalSecurityEvents;
          renderCriticalSecurityEnvetsCombinedLineChart4Pdf(
            criticalSecurityEvent.summary
          );
          renderTopSecurityEventsBarChart4Pdf(criticalSecurityEvent.top_security_events);
          $timeout(() => {
            _downloadPdf(domain, $index);
          }, 2000);
        })
        .catch(function (err) {});
    };

    const renderTopVulnerabileContainersBarChart = function(vuls) {
      $scope.topVulnerabileContainersError = typeof vuls.message === "string";
      if ($scope.topVulnerabileContainersError) {
        $scope.topVulnerabileContainersErrorMessage = Utils.getMessageFromItemError(
          vuls.message
        );
        return;
      }
      let containers = vuls.top5Containers;
      $scope.topVulnerabileContainersData = [];
      $scope.topVulnerabileContainersLabels = [];
      $scope.noTopVulnerabileContainers = false;
      let highVulnerabileContainers = [];
      let mediumVulnerabileContainers = [];

      containers.forEach(function (container) {
        highVulnerabileContainers.push(container.high4Dashboard);
        mediumVulnerabileContainers.push(container.medium4Dashboard);
        $scope.topVulnerabileContainersLabels.push(
          $sanitize(container.display_name)
        );
      });

      $scope.topVulnerabileContainersData = [
        highVulnerabileContainers,
        mediumVulnerabileContainers,
      ];

      if ($scope.topVulnerabileContainersLabels.length < 5) {
        if ($scope.topVulnerabileContainersLabels.length === 0) {
          $scope.noTopVulnerabileContainers = true;
          $scope.topVulnerabileContainersData = [];
        } else {
          for (
            let i = $scope.topVulnerabileContainersLabels.length;
            i < 5;
            i++
          ) {
            $scope.topVulnerabileContainersLabels.push("");
            $scope.topVulnerabileContainersData[0].push(0);
            $scope.topVulnerabileContainersData[1].push(0);
          }
        }
      }

      // let maxHigh = $scope.topVulnerabileContainersData[0].slice().sort((a,b) => b - a)[0];
      // let maxMedium = $scope.topVulnerabileContainersData[1].slice().sort((a,b) => b - a)[0];
      // let maxValue = Math.max(
      //   maxHigh + Math.ceil(maxHigh * 0.1),
      //   maxMedium + Math.ceil(maxMedium * 0.1)
      // );

      $scope.topVulnerabileContainersOptions = {
        maintainAspectRatio: false,
        legend: {
          display: true,
          labels: {
            boxWidth: 12,
          },
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: true,
              },
              ticks: {
                callback: function (value) {
                  if (value % 1 === 0) {
                    return value;
                  }
                },
                beginAtZero: true,
                // suggestedMax: maxValue
              },
            },
          ],
          yAxes: [
            {
              barThickness: 12,
            },
          ],
        },
      };
      $scope.topVulnerabileContainersColors = ["#ef5350", "#ff9800"];
      $scope.topVulnerabileContainersSerials = [
        $translate.instant("enum.HIGH"),
        $translate.instant("enum.MEDIUM"),
      ];
    };

    const renderTopVulnerabileNodesBarChart = function(vuls) {
      $scope.topVulnerabileNodesError = typeof vuls.message === "string";
      if ($scope.topVulnerabileNodesError) {
        $scope.topVulnerabileNodesErrorMessage = Utils.getMessageFromItemError(
          vuls.message
        );
        return;
      }
      let nodes = vuls.top5Nodes;
      $scope.topVulnerabileNodesData = [];
      $scope.topVulnerabileNodesLabels = [];
      $scope.noTopVulnerabileNodes = false;
      let highVulnerabileNodes = [];
      let mediumVulnerabileNodes = [];

      nodes.forEach(function (node) {
        highVulnerabileNodes.push(
          node.scan_summary ? node.scan_summary.high : 0
        );
        mediumVulnerabileNodes.push(
          node.scan_summary ? node.scan_summary.medium : 0
        );
        $scope.topVulnerabileNodesLabels.push($sanitize(node.name));
      });

      $scope.topVulnerabileNodesData = [
        highVulnerabileNodes,
        mediumVulnerabileNodes,
      ];

      if ($scope.topVulnerabileNodesLabels.length < 5) {
        if ($scope.topVulnerabileNodesLabels.length === 0) {
          $scope.noTopVulnerabileNodes = true;
          $scope.topVulnerabileNodesData = [];
        } else {
          for (let i = $scope.topVulnerabileNodesLabels.length; i < 5; i++) {
            $scope.topVulnerabileNodesLabels.push("");
            $scope.topVulnerabileNodesData[0].push(0);
            $scope.topVulnerabileNodesData[1].push(0);
          }
        }
      }

      // let maxHigh = $scope.topVulnerabileNodesData[0].slice().sort((a,b) => b - a)[0];
      // let maxMedium = $scope.topVulnerabileNodesData[1].slice().sort((a,b) => b - a)[0];
      // let maxValue = Math.max(
      //   maxHigh + Math.ceil(maxHigh * 0.1),
      //   maxMedium + Math.ceil(maxMedium * 0.1)
      // );

      $scope.topVulnerabileNodesOptions = {
        maintainAspectRatio: false,
        legend: {
          display: true,
          labels: {
            boxWidth: 12,
          },
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: true,
              },
              ticks: {
                callback: function (value) {
                  if (value % 1 === 0) {
                    return value;
                  }
                },
                beginAtZero: true,
                // suggestedMax: maxValue
              },
            },
          ],
          yAxes: [
            {
              barThickness: 12,
            },
          ],
        },
      };
      $scope.topVulnerabileNodesColors = ["#ef5350", "#ff9800"];
      $scope.topVulnerabileNodesSerials = [
        $translate.instant("enum.HIGH"),
        $translate.instant("enum.MEDIUM"),
      ];
    };

    const renderHighPriorityVulnerabilities = function(highPriorityVulnerabilities) {
      $scope.highPriorityVulnerabilities.total =
        highPriorityVulnerabilities.containers.vulnerabilitiesTotal;
      $scope.highPriorityVulnerabilities.details[0].amount =
        highPriorityVulnerabilities.nodes.vulnerabilitiesTotal;
    };

    const renderServicePolicyModePieChart = function(headerData) {
      $scope.servicePolicyModeData = [
        headerData.protect_groups,
        headerData.monitor_groups,
        headerData.discover_groups
      ];
      $scope.servicePolicyModeColors = [
        protectColor, //Protect
        monitorColor, //Monitor
        "#2196F3", //Discover
      ];
      const modes = ["protect", "monitor", "discover"];
      $scope.servicePolicyModeLabels = modes.map(function (mode) {
        return $translate.instant(`enum.${mode.toUpperCase()}`);
      });
      $scope.servicePolicyModeOptions = {
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: "right",
          labels: {
            boxWidth: 12,
          },
        },
      };
    };

    const getPolicyCoverageEvaluation = function(protect, monitor) {
      let evaluation = "POOR";
      if (protect + monitor >= 90) {
        evaluation = "EXCELLENT";
      } else if (protect + monitor >= 80) {
        evaluation = "VERYGOOD";
      } else if (protect + monitor >= 70) {
        evaluation = "GOOD";
      } else if (protect + monitor >= 60) {
        evaluation = "FAIR";
      }
      return evaluation;
    };

    const renderContainerModePieChart = function(containers) {
      $scope.containerModeError = typeof containers.message === "string";
      if ($scope.containerModeError) {
        $scope.containerModeErrorMessage = Utils.getMessageFromItemError(
          containers.message
        );
        return;
      }

      $scope.containerModesData = [];
      $scope.containerModesLabels = [];
      $scope.noManagedContainers = false;
      $scope.containerModesColors = [
        protectColor, //Protect
        monitorColor, //Monitor
        "#2196F3", //Discover
        "#E91E63", //Quarantined
      ];
      let count = {
        discover: 0,
        monitor: 0,
        protect: 0,
        quarantined: 0,
      };
      let workloadCount = 0;
      let states = ["protect", "monitor", "discover", "quarantined"];
      containers.forEach(function (container) {
        if (count[container.state.toLowerCase()] !== undefined) {
          count[container.state.toLowerCase()]++;
          workloadCount++;
        }
      });
      $scope.containerModesData = [
        count.protect,
        count.monitor,
        count.discover,
        count.quarantined,
      ];

      let containerModeEvaluation = getPolicyCoverageEvaluation(
        Math.round((count.protect / workloadCount) * 100),
        Math.round((count.monitor / workloadCount) * 100)
      );
      // $scope.containerModeEvaluationDisplay = $translate.instant(
      //   `dashboard.body.policy_evaluation.${containerModeEvaluation.toUpperCase()}`
      // );
      $scope.containerModeComment = $translate.instant(
        `dashboard.body.comments.${containerModeEvaluation.toUpperCase()}`
      );
      $scope.containerModesLabels = states.map(function (state) {
        return $translate.instant(`enum.${state.toUpperCase()}`);
      });
      // $scope.containerModesLabels4Pdf = states.map(function(state, index) {
      //   return `${$translate.instant(
      //     `enum.${state.toUpperCase()}`
      //   )}: ${$scope.containerModesData[index]}`;
      // });
      $scope.containerModeevaluationStyle = {
        backgroundColor:
          evaluationColorsSet[containerModeEvaluation.toLowerCase()],
      };
      $scope.noManagedContainers = workloadCount === 0;
      $scope.containerModesOptions = {
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: "right",
          labels: {
            boxWidth: 12,
          },
        },
      };
    };

    const renderPolicyApps2BarChart = function(apps) {
      $scope.application2Error = typeof apps.message === "string";
      if ($scope.application2Error) {
        $scope.application2ErrorMessage = Utils.getMessageFromItemError(
          apps.message
        );
        return;
      }
      $scope.noPolicyApplication2 = false;
      $scope.policyApps2Labels = [];
      $scope.policyApps2Data = [];
      $scope.policyApps2Colors = [];
      $scope.policyApps3Labels = [];
      $scope.policyApps3Data = [];
      $scope.policyApps3Colors = [];
      let apps4Count = angular
        .copy(apps)
        .sort((a, b) => b[1].count - a[1].count);
      let apps4TotalBytes = angular
        .copy(apps)
        .sort((a, b) => b[1].totalBytes - a[1].totalBytes);
      if (apps.length > 0) {
        apps4Count.forEach(function (app) {
          $scope.policyApps2Labels.push($sanitize(app[0]));
          $scope.policyApps2Data.push(app[1].count);
        });
        $scope.policyApps2Colors = new Array($scope.policyApps2Data.length);
        $scope.policyApps2Colors.fill(protectColor);

        apps4TotalBytes.forEach(function (app) {
          $scope.policyApps3Labels.push($sanitize(app[0]));
          $scope.policyApps3Data.push(app[1].totalBytes);
        });
        $scope.policyApps3Colors = new Array($scope.policyApps3Data.length);
        $scope.policyApps3Colors.fill(protectColor);

        $scope.policyApps2Options = {
          maintainAspectRatio: false,
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                },
              },
            ],
          },
        };
        $scope.policyApps3Options = {
          maintainAspectRatio: false,
          tooltips: {
            enabled: true,
            mode: "label",
            callbacks: {
              title: function (tooltipItems, data) {
                let idx = tooltipItems[0].index;
                return $filter("bytes")(data.datasets[0].data[idx]);
              },
              label: function (tooltipItems, data) {
                return tooltipItems.xLabel;
              },
            },
          },
          scales: {
            yAxes: [
              {
                type: "logarithmic",
                ticks: {
                  min: 0,
                  max: $scope.policyApps3Data[0],
                  callback: function (value, index, values) {
                    return $filter("bytes")(value);
                  },
                },
                afterBuildTicks: function (pckBarChart) {
                  pckBarChart.ticks = [];
                  pckBarChart.ticks.push(0);
                  pckBarChart.ticks.push(
                    Math.round($scope.policyApps3Data[0] / 1000)
                  );
                  pckBarChart.ticks.push(
                    Math.round($scope.policyApps3Data[0] / 100)
                  );
                  pckBarChart.ticks.push(
                    Math.round($scope.policyApps3Data[0] / 10)
                  );
                  pckBarChart.ticks.push(
                    Math.round($scope.policyApps3Data[0])
                  );
                },
              },
            ],
          },
        };
      } else {
        $scope.noPolicyApplication2 = true;
      }
    };

    const renderContainersSecurityBarChart = function(exposedConversations) {
      $scope.ExposureConversationsError =
        typeof exposedConversations.message === "string";
      if ($scope.ExposureConversationsError) {
        $scope.ExposureConversationsErrorMessage = Utils.getMessageFromItemError(
          exposedConversations.message
        );
        return;
      }
      let egressConstains = exposedConversations.egress.flatMap(function (
        service
      ) {
        return service.children;
      });
      let ingressContainers = exposedConversations.ingress.flatMap(function (
        service
      ) {
        return service.children;
      });
      let numberByCategory = {
        allow: 0,
        deny: 0,
        violate: 0,
        threat: 0,
      };
      let chartNumbers = {
        ingress: angular.copy(numberByCategory),
        egress: angular.copy(numberByCategory),
      };

      const accumulateData = function (exposedContainers, direction) {
        exposedContainers.forEach(function (exposedContainer) {
          if (exposedContainer.severity) {
            chartNumbers[direction]["threat"]++;
          } else {
            chartNumbers[direction][
              exposedContainer.policy_action.toLowerCase()
            ]++;
          }
        });
      };

      accumulateData(ingressContainers, "ingress");
      accumulateData(egressConstains, "egress");
      $scope.containersSecData2 = [
        Object.values(chartNumbers.ingress),
        Object.values(chartNumbers.egress),
      ];
      console.log($scope.containersSecData2);

      $scope.noExposedContainers = false;
      if (
        exposedConversations.ingress.length > 0 ||
        exposedConversations.egress.length > 0
      ) {
        if (exposedConversations.ingress.length === 0) {
          $scope.dashboard.containerSecIndex = 1;
        }

        $scope.containersSecLabels2 = ["ALLOW", "DENY", "ALERT", "THREAT"];
        $scope.containersSecColors2 = ["#ff0d81", "#ff7101"];
        $scope.containersSecSerie2 = [
          `${$translate.instant(
            "dashboard.body.panel_title.INGRESS_CONTAINERS"
          )}`,
          `${$translate.instant(
            "dashboard.body.panel_title.EGRESS_CONTAINERS"
          )}`,
        ];
        $scope.containersSecOptions2 = {
          maintainAspectRatio: false,
          // onClick: toExposedContainers,
          legend: {
            display: true,
            position: "top",
            labels: {
              boxWidth: 12,
            },
          },
          scales: {
            xAxes: [
              {
                stacked: true,
                ticks: {
                  beginAtZero: true,
                  callback: function (value) {
                    return $translate.instant(
                      `dashboard.body.panel_title.${value}`
                    );
                  },
                },
              },
            ],
            yAxes: [
              {
                stacked: true,
                ticks: {
                  beginAtZero: true,
                  callback: function (value) {
                    if (value % 1 === 0) return value;
                  },
                },
              },
            ],
          },
        };
        $scope.gridIngressContainer.api.setRowData(
          exposedConversations.ingress.map(function (service, index) {
            return Object.assign(service, { seq: index });
          })
        );
        $scope.gridEgressContainer.api.setRowData(
          exposedConversations.egress.map(function (service, index) {
            return Object.assign(service, { seq: index });
          })
        );
      } else {
        $scope.noExposedContainers = true;
        $scope.containersSecData2 = [];
      }
    };

    const buildExposureServiceHierarchy = function(exposure) {
      const policyActionMap = {
        deny: 0,
        violate: 1,
        allow: 2
      };
      let hierarchicalExposures = [];
      if (exposure.length === 0) return hierarchicalExposures;
      let groupedExposure = Utils.groupBy(exposure, "service");

      Object.entries(groupedExposure).forEach(([k, v]) => {
        console.log(k, v);
        let applicationSet = new Set();
        v.forEach(child => {
          if (child.applications) {
            child.applications.forEach(app => {
              applicationSet.add(app);
            });
          }
          if (child.ports) {
            child.ports.forEach(port => {
              applicationSet.add(port);
            });
          }
        });
        let hierarchicalExposure = {
          workload_id: "",
          peerEndpoint: "",
          service: k,
          policy_mode: v[0].policy_mode,
          workload: "",
          bytes: 0,
          sessions: 0,
          severity: "",
          policy_action: "",
          event_type: "",
          protocols: "",
          applications: Array.from(applicationSet),
          ports: [],
          children: v.map(child => {
              child.service = "";
              return child;
            })
        }
        hierarchicalExposures.push(angular.copy(hierarchicalExposure));
      });
      return hierarchicalExposures;
    };


    const prepareExposureData = function(scoreData) {
      let ingress = scoreData.ingress;
      let egress = scoreData.egress;
      let hierarchicalIngress = buildExposureServiceHierarchy(ingress);
      let hierarchicalEgress = buildExposureServiceHierarchy(egress);
      console.log("hierarchicalEgress: ", hierarchicalEgress);
      return {
        ingress: hierarchicalIngress,
        egress: hierarchicalEgress
      }
    };

    const getAutoScan = function (isAutoConfig) {
      $scope.isAutoConfigError = typeof isAutoConfig.message === "string";
      if ($scope.isAutoConfigError) {
        $scope.isAutoConfigErrorMessage = Utils.getMessageFromItemError(
          isAutoConfig.message
        );
        return;
      } else {
        return isAutoConfig;
      }
    };

    const updateHeaderSlide = function(autoScanConfig) {
      const autoScanOff = $scope.isAutoConfigError
        ? `<div class="server-error-sm details">
          <div>
            <em class="fa fa-times-circle error-signal" aria-hidden="true"></em>
          </div>
          <div>
            <span class="error-text">
              ${$scope.isAutoConfigErrorMessage}
            </span>
          </div>
        </div>`
        : `<div class="instruction-content">
          <em class="fa fa-exclamation-triangle text-caution" style="font-size: 20px;" aria-hidden="true"></em>
          ${$translate.instant("dashboard.heading.guideline.AUTO_SCAN_OFF")}
          <div class="md-switch2 text-center mt-sm" display-control="runtime_scan">
            <label class="text-gray-label">
              <input  id="switch-autoscan"
                      type="checkbox" ng-model="vulnerabilityExploitRisk.isAutoScan"
                      ng-change="vulnerabilityExploitRisk.configAutoScan(vulnerabilityExploitRisk.isAutoScan)"
              >
              <span class="toggle mr-sm"></span>
              {{'scan.AUTO' | translate}}
            </label>
            <a>
              <em
                class="icon-info text-gray-label" uib-tooltip-template="'tooltipTemplate.html'"
                tooltip-placement="bottom"
              ></em>
            </a>
          </div>
         </div>`;
      if (!autoScanConfig || $scope.isAutoConfigError) {
        $scope.securityGuideline.slides[3] = {
          title: $translate.instant(
            "dashboard.heading.guideline.titles.AUTO_SCAN_OFF"
          ),
          description: autoScanOff
        };
      } else {
        $timeout(() => {
          $scope.securityGuideline.slides[3] = {
            title: $translate.instant(
              "dashboard.heading.guideline.titles.VUL_EXPLOIT"
            ),
            description: `<div class="instruction-content">
              ${$translate.instant("dashboard.heading.guideline.VUL_EXPLOIT")}
             </div>`
          };
        }, 1000);
      }
    };

    const getDashboardData = function (response) {
      let startTime = new Date();
      console.log(startTime);

      let highPriorityVulnerabilities =
        response.data.highPriorityVulnerabilities;
      renderTopVulnerabileContainersBarChart(
        highPriorityVulnerabilities.containers
      );

      renderTopVulnerabileNodesBarChart(highPriorityVulnerabilities.nodes);

      renderHighPriorityVulnerabilities(highPriorityVulnerabilities);

      renderContainerModePieChart(response.data.containers);

      renderPolicyApps2BarChart(response.data.applications2);

      $scope.vulnerabilityExploitRisk.isAutoScan = getAutoScan(
        response.data.autoScanConfig
      );
      $scope.isAutoScan = $scope.vulnerabilityExploitRisk.isAutoScan;
      if ($scope.isScanAuthorized && !$scope.isNamespaceUser && !response.data.autoScanConfig.message) {
        updateHeaderSlide($scope.vulnerabilityExploitRisk.isAutoScan);
      }

      let endTime = new Date();
      console.log(endTime);
      console.log("Dashboard rendering time: ", endTime - startTime);
    };

    const getDomains = function() {
      const success = function(response) {
        const resourceList = ["_images", "_nodes", "_containers"];
        $scope.namesapces = response.data.domains.filter(
          (domain) => !resourceList.includes(domain.name)
        ).map(domain => domain.name);
        $scope.isPdfPreparing4Namespace = new Array($scope.namesapces.length);
        $scope.isPdfPreparing4Namespace.fill(false);
        $scope.isPdfPreparing4AllSpace = false;
      };
      const error = function(err) {
        console.warn(err);
      };
      $http
      .get(DOMAIN_URL)
      .then((response) => {
        success(response);
      })
      .catch((err) => {
        error(err);
      });
    }

    const getDashboardDetailsBySync = function(scoreData) {
      $scope.isDashboardDetailsReady = false;
      $http
        .get(DASHBOARD_DETAILS_URL, {params: {isGlobalUser: $scope.isGlobalUser}})
        .then((response) => {
          getDomains();
          getDashboardData(response);
          $scope.isDashboardDetailsReady = true;
        })
        .catch((err) => {
          $scope.dashboardErr = true;
          $scope.dashboardErrMSG = Utils.getErrorMessage(err);
          $scope.isDashboardDetailsReady = true;
        });
    }

    const getDashboardDetailsBySync4Pdf = function(scoreData, options) {
      $http
        .get(DASHBOARD_DETAILS_URL, {params: {isGlobalUser: $scope.isGlobalUser, domain: options.domain}})
        .then((response) => {
          options.successFn(response, scoreData);
        })
        .catch((err) => {
          options.errorFn(err);
        });
    }

    const getExposureDetailsBySync = function(scoreData, options) {
      $scope.isExposureReportErr = false;
      $scope.isExposureReportReady = false;
      $scope.exposureList = [];
      let accExposureCnt = 0;
      const getConversationHistory = function(queryParams, total, type) {
        $http
          .get(CONVERSATION_HISTORY_URL, {params: queryParams})
          .then((response) => {
            $scope.exposureList.push(response.data.conversation);
            if (accExposureCnt === total - 1) {
              $scope.isExposureReportReady = true;
            }
            accExposureCnt++;
          })
          .catch((err) => {
            $scope.isExposureReportErr = true;
            accExposureCnt++;
          });
      };
      scoreData.ingress.forEach(ingress => {
        let queryParams = {from: "external", to: ingress.id};
        getConversationHistory(queryParams, scoreData.ingress.length + scoreData.egress.length, "ingress");
      });

      scoreData.egress.forEach(egress => {
        let queryParams = {to: "external", from: egress.id};
        getConversationHistory(queryParams, scoreData.ingress.length + scoreData.egress.length, "egress");
      });

    };

    const run = function (fn, functionName, scoreData) {
      try {
        return new Worker(URL.createObjectURL(new Blob(["(" + fn + ")()"])));
      } catch (err) {
        console.log(err);
        switch (functionName) {
          case "getDashboardNotifications":
            getDashboardNotificationsBySync();
            break;
          case "getDashboardDetails":
            getDashboardDetailsBySync(scoreData);
            break;
          case "getExposureDetails":
            getExposureDetailsBySync(scoreData)
        }
      }
    };

    const evaluationColorsSet = {
      excellent: ["#059059", "#d6e1ea"],
      verygood: ["#1ec008", "#d6e1ea"],
      good: ["#b6b105", "#d6e1ea"],
      fair: ["#ff8607", "#d6e1ea"],
      poor: ["#ff0515", "#d6e1ea"],
    };

    const protectColor = "#186d33";
    const monitorColor = "#4E39C1";

    const RISK_CATEGORY = {
      SRV_CONN: "serviceConnectionRisk",
      INGR_EGR: "ingressEgressRisk2",
      VUL_EXPLOIT: "vulnerabilityExploitRisk",
    };
    const LEVEL = {
      FAIR: 21,
      POOR: 51,
      MAX: 100,
    };
    const WEIGHT = {
      INGR_EGR: {
        PROTECTED: 0.5,
        DISCOVER: 1,
        VIOLATION: 2,
        THREAT: 5,
      },
      VULS_EXPLOIT: {
        DISCOVER: 1,
        MONITOR: 0.2,
        PROTECT: 0.1,
        QUARANTINED: 0.1,
      },
    };
    const SHOW_SUMMARY_DELAY = 4000;
    $scope.isGlobalUser = $rootScope.user.global_permissions.length > 0;
    let vm = this;
    let realtimeScoreBackup = null;
    let timer = [null, null, null, null];
    $scope.isPdfPreparing = false;
    $scope.isShowingSummary = true;

    $scope.score1 = { height: "100%" };
    $scope.score2 = { height: "100%" };
    $scope.score3 = { height: "100%" };
    $scope.securityGuideline = {
      slides: [],
    };

    function criticalSecurityEventsPreprocess(data) {
      $scope.securityEventError =
        typeof data.top_threats.message === "string" ||
        typeof data.top_violations.message === "string";
      if ($scope.securityEventError) {
        //$scope.securityEventErrorMessage = typeof data.top_threats.message === "string"?  Utils.getMessageFromItemError(data.top_threats.message) : Utils.getMessageFromItemError(data.top_violations.message);
        return;
      }

      $scope.topThreats = [[], []];
      $scope.topViolations = [[], []];
      let threatsClient = [];
      let threatsServer = [];
      let violationsClient = [];
      let violationsServer = [];
      data.top_threats.source.forEach((threat) => {
        $scope.topThreats[0][
          Utils.getDisplayName(threat[0].source_workload_name)
        ] = threat;
      });
      data.top_threats.destination.forEach((threat) => {
        $scope.topThreats[1][
          Utils.getDisplayName(threat[0].destination_workload_name)
        ] = threat;
      });
      data.top_violations.client.forEach((violation) => {
        violationsClient[
          Utils.getDisplayName(violation[0].client_name)
        ] = violation;
      });
      data.top_violations.server.forEach((violation) => {
        violationsServer[
          Utils.getDisplayName(violation[0].server_name)
        ] = violation;
      });
      $scope.topViolations = [violationsClient, violationsServer];
    }

    function criticalSecurityEventsCombinedPreprocess(data) {
      $scope.securityEventError =
        data.top_security_events.message &&
        typeof data.top_security_events.message === "string";
      if ($scope.securityEventError) {
        //$scope.securityEventErrorMessage = typeof data.top_threats.message === "string"?  Utils.getMessageFromItemError(data.top_threats.message) : Utils.getMessageFromItemError(data.top_violations.message);
        return;
      }

      $scope.topSecurityEvents = [[], []];
      let switchecurityEventsSource = [];
      let securityEventsDestination = [];
      data.top_security_events.source.forEach((securityEvent) => {
        $scope.topSecurityEvents[0][
          Utils.getDisplayName(securityEvent[0].source_workload_name)
        ] = securityEvent;
      });
      data.top_security_events.destination.forEach((securityEvent) => {
        $scope.topSecurityEvents[1][
          Utils.getDisplayName(securityEvent[0].destination_workload_name)
        ] = securityEvent;
      });
    }

    function renderCriticalSecurityEnvetsCombinedLineChart(criticalSecurityEvents) {
      console.log("criticalSecurityEvents2: ", angular.copy(criticalSecurityEvents));
      $scope.securityEventCombinedError =
        criticalSecurityEvents.message &&
        typeof criticalSecurityEvents.message === "string";
      if ($scope.securityEventCombinedError) {
        $scope.securityEventErrorCombinedMessage = Utils.getMessageFromItemError(
          criticalSecurityEvents.message
        );
        return;
      }

      let criticals = [];
      let warnings = [];
      $scope.criticalSecurityEventsCombinedLabels = [];
      $scope.criticalSecurityEventsCombinedData = [];
      let criticalsTotal = 0;
      let warningsTotal = 0;
      $scope.noCriticalSecurityEventsCombined = false;

      if (
        criticalSecurityEvents.critical.length === 0 &&
        criticalSecurityEvents.warning.length === 0
      ) {
        $scope.noCriticalSecurityEventsCombined = true;
      } else {
        $scope.criticalSecurityEventsCombinedLabels = Utils.threeWayMerge(
          criticalSecurityEvents.critical,
          criticalSecurityEvents.warning,
          [],
          0,
          0
        );

        let startIndex = $scope.criticalSecurityEventsCombinedLabels.length;

        for (let i = 0; i < $scope.criticalSecurityEventsCombinedLabels.length; i++) {
          criticals.push(0);
          warnings.push(0);
        }

        criticalSecurityEvents.critical.forEach((critical) => {
          let index = $scope.criticalSecurityEventsCombinedLabels.indexOf(critical[0]);
          criticals[index] = critical[1];
          criticalsTotal += critical[1];
          if (index >= 0) {
            startIndex = Math.min(startIndex, index);
          }
        });

        console.log("criticalSecurityEvents.warning: ", angular.copy(criticalSecurityEvents.warning));

        criticalSecurityEvents.warning.forEach((warning) => {
          let index = $scope.criticalSecurityEventsCombinedLabels.indexOf(warning[0]);
          warnings[index] = warning[1];
          warningsTotal += warning[1];
          if (index >= 0) {
            startIndex = Math.min(startIndex, index);
          }
        });

        console.log("criticals: ", criticals, "warnings: ", warnings);

        criticals = criticals.slice(startIndex);
        warnings = warnings.slice(startIndex);
        $scope.criticalSecurityEventsCombinedLabels = $scope.criticalSecurityEventsCombinedLabels.slice(
          startIndex
        );
        $scope.criticalSecurityEventsCombinedData = [criticals, warnings];
        console.log("$scope.criticalSecurityEventsCombinedData: ",$scope.criticalSecurityEventsCombinedData);

        $scope.criticalSecurityEventsCombinedOptions = {
          maintainAspectRatio: false,
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 12,
            },
          },
          scales: {
            xAxes: [
              {
                gridLines: {
                  display: true,
                },
                ticks: {
                  callback: function (value) {
                    return value;
                  },
                },
                maxBarThickness: 25,
              },
            ],
            yAxes: [
              {
                type: "linear",
                gridLines: {
                  display: true,
                },
                ticks: {
                  beginAtZero: true,
                  callback: function (value) {
                    if (value % 1 === 0) return value;
                  },
                },
              },
            ],
          },
        };
        $scope.criticalSecurityEventsCombinedDatasetOverride = [
          {
            fill: false,
            borderWidth: 2,
            pointRadius: 3,
            lineTension: 0.2,
          },
          {
            fill: false,
            borderWidth: 2,
            pointRadius: 3,
            lineTension: 0.2,
          }
        ];
        $scope.criticalSecurityEventsCombinedSeries = [
          `${$translate.instant(
            "enum.CRITICAL"
          )}: ${criticalsTotal}`,
          `${$translate.instant(
            "enum.WARNING"
          )}: ${warningsTotal}`
        ];
        $scope.criticalSecurityEventsCombinedColors = ["#ef5350", "#ff9800"];
      }
    }

    function renderCriticalSecurityEnvetsCombinedLineChart4Pdf(criticalSecurityEvents) {
      console.log("criticalSecurityEvents2: ", angular.copy(criticalSecurityEvents));
      $scope.securityEventCombinedError4Pdf =
        criticalSecurityEvents.message &&
        typeof criticalSecurityEvents.message === "string";
      if ($scope.securityEventCombinedError4Pdf) {
        $scope.securityEventErrorCombinedMessage4Pdf = Utils.getMessageFromItemError(
          criticalSecurityEvents.message
        );
        return;
      }

      let criticals = [];
      let warnings = [];
      $scope.criticalSecurityEventsCombinedLabels4Pdf = [];
      $scope.criticalSecurityEventsCombinedData4Pdf = [];
      let criticalsTotal = 0;
      let warningsTotal = 0;
      $scope.noCriticalSecurityEventsCombined4Pdf = false;

      if (
        criticalSecurityEvents.critical.length === 0 &&
        criticalSecurityEvents.warning.length === 0
      ) {
        $scope.noCriticalSecurityEventsCombined4Pdf = true;
      } else {
        $scope.criticalSecurityEventsCombinedLabels4Pdf = Utils.threeWayMerge(
          criticalSecurityEvents.critical,
          criticalSecurityEvents.warning,
          [],
          0,
          0
        );

        let startIndex = $scope.criticalSecurityEventsCombinedLabels4Pdf.length;

        for (let i = 0; i < $scope.criticalSecurityEventsCombinedLabels4Pdf.length; i++) {
          criticals.push(0);
          warnings.push(0);
        }

        criticalSecurityEvents.critical.forEach((critical) => {
          let index = $scope.criticalSecurityEventsCombinedLabels4Pdf.indexOf(critical[0]);
          criticals[index] = critical[1];
          criticalsTotal += critical[1];
          if (index >= 0) {
            startIndex = Math.min(startIndex, index);
          }
        });

        console.log("criticalSecurityEvents.warning: ", angular.copy(criticalSecurityEvents.warning));

        criticalSecurityEvents.warning.forEach((warning) => {
          let index = $scope.criticalSecurityEventsCombinedLabels4Pdf.indexOf(warning[0]);
          warnings[index] = warning[1];
          warningsTotal += warning[1];
          if (index >= 0) {
            startIndex = Math.min(startIndex, index);
          }
        });

        console.log("criticals: ", criticals, "warnings: ", warnings);

        criticals = criticals.slice(startIndex);
        warnings = warnings.slice(startIndex);
        $scope.criticalSecurityEventsCombinedLabels4Pdf = $scope.criticalSecurityEventsCombinedLabels4Pdf.slice(
          startIndex
        );
        $scope.criticalSecurityEventsCombinedData4Pdf = [criticals, warnings];
        console.log("$scope.criticalSecurityEventsCombinedData4Pdf: ",$scope.criticalSecurityEventsCombinedData4Pdf);

        $scope.criticalSecurityEventsCombinedOptions4Pdf = {
          maintainAspectRatio: false,
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 12,
            },
          },
          scales: {
            xAxes: [
              {
                gridLines: {
                  display: true,
                },
                ticks: {
                  callback: function (value) {
                    return value;
                  },
                },
                maxBarThickness: 25,
              },
            ],
            yAxes: [
              {
                type: "linear",
                gridLines: {
                  display: true,
                },
                ticks: {
                  beginAtZero: true,
                  callback: function (value) {
                    if (value % 1 === 0) return value;
                  },
                },
              },
            ],
          },
        };
        $scope.criticalSecurityEventsCombinedDatasetOverride4Pdf = [
          {
            fill: false,
            borderWidth: 2,
            pointRadius: 3,
            lineTension: 0.2,
          },
          {
            fill: false,
            borderWidth: 2,
            pointRadius: 3,
            lineTension: 0.2,
          }
        ];
        $scope.criticalSecurityEventsCombinedSeries4Pdf = [
          `${$translate.instant(
            "enum.CRITICAL"
          )}: ${criticalsTotal}`,
          `${$translate.instant(
            "enum.WARNING"
          )}: ${warningsTotal}`
        ];
        $scope.criticalSecurityEventsCombinedColors4Pdf = ["#ef5350", "#ff9800"];
      }
    }

    function renderTopSecurityEventsBarChart(securityEvents) {
      $scope.topSecurityEventsError = typeof securityEvents.message === "string";
      if ($scope.topSecurityEventsError) {
        $scope.topSecurityEventsErrorMessage = Utils.getMessageFromItemError(
          threats.message
        );
        return;
      }
      $scope.topSecurityEventsSourceLabels = [];
      $scope.topSecurityEventsSourceData = [];
      $scope.noTopSecurityEventsSource = false;
      $scope.topSecurityEventsDestinationLabels = [];
      $scope.topSecurityEventsDestinationData = [];
      $scope.noTopSecurityEventsDestination = false;

      securityEvents.source.forEach(function (securityEventSourceContainer) {
        $scope.topSecurityEventsSourceLabels.push(
          $sanitize(
            Utils.getDisplayName(securityEventSourceContainer[0].source_workload_name)
          )
        );
        $scope.topSecurityEventsSourceData.push(securityEventSourceContainer.length);
      });
      if ($scope.topSecurityEventsSourceLabels.length < 5) {
        if ($scope.topSecurityEventsSourceLabels.length === 0) {
          $scope.noTopSecurityEventsSource = true;
        } else {
          for (let i = $scope.topSecurityEventsSourceLabels.length; i < 5; i++) {
            $scope.topSecurityEventsSourceLabels.push("");
            $scope.topSecurityEventsSourceData.push(0);
          }
        }
      }

      securityEvents.destination.forEach(function (securityEventSourceContainer) {
        $scope.topSecurityEventsDestinationLabels.push(
          Utils.getDisplayName(
            securityEventSourceContainer[0].destination_workload_name
          )
        );
        $scope.topSecurityEventsDestinationData.push(securityEventSourceContainer.length);
      });
      if ($scope.topSecurityEventsDestinationLabels.length < 5) {
        if ($scope.topSecurityEventsDestinationLabels.length === 0) {
          $scope.noTopSecurityEventsDestination = true;
        } else {
          for (let i = $scope.topSecurityEventsDestinationLabels.length; i < 5; i++) {
            $scope.topSecurityEventsDestinationLabels.push("");
            $scope.topSecurityEventsDestinationData.push(0);
          }
        }
      }

      let maxValue =
        $scope.topSecurityEventsSourceData[0] +
        Math.ceil($scope.topSecurityEventsSourceData[0] * 0.1);
      let maxServerValue =
        $scope.topSecurityEventsDestinationData[0] +
        Math.ceil($scope.topSecurityEventsDestinationData[0] * 0.1);
      const topSecurityEventsOptions = {
        maintainAspectRatio: false,
        onClick: toSecurityEventSource,
        scales: {
          xAxes: [
            {
              gridLines: {
                display: true,
              },
              ticks: {
                callback: function (value) {
                  if (value % 1 === 0) {
                    return value;
                  }
                },
                beginAtZero: true,
                suggestedMax: maxValue,
              },
            },
          ],
          yAxes: [
            {
              barThickness: 20,
              ticks: {
                callback: function (value) {
                  if (value.length > 20) return value.substr(0, 20) + "...";
                  else return value;
                },
              },
            },
          ],
        },
        tooltips: {
          enabled: true,
          mode: "label",
          callbacks: {
            title: function (tooltipItems, data) {
              let idx = tooltipItems[0].index;
              if (data.labels[idx].length > 70)
                return data.labels[idx].substr(0, 70) + "...";
              else return data.labels[idx];
            },
            label: function (tooltipItems, data) {
              return tooltipItems.xLabel;
            },
          },
        },
      };

      $scope.topSecurityEventsOptions = topSecurityEventsOptions;
      $scope.topDestinationSecurityEventsOptions = angular.copy(topSecurityEventsOptions);
      $scope.topDestinationSecurityEventsOptions.scales.xAxes[0].ticks.suggestedMax = maxServerValue;
      $scope.topDestinationSecurityEventsOptions.onClick = toSecurityEventDestination;
      $scope.topSecurityEventsColors = [
        "#ef5350",
        "#ef5350",
        "#ef5350",
        "#ef5350",
        "#ef5350",
      ];
      $scope.topSecurityEventsDatasetOverride = [
        {
          label: "Bar chart",
          borderWidth: 1,
          type: "bar",
        },
      ];
    }

    function renderTopSecurityEventsBarChart4Pdf(securityEvents) {
      $scope.topSecurityEventsError4Pdf = securityEvents.message && typeof securityEvents.message === "string";
      if ($scope.topSecurityEventsError4Pdf) {
        $scope.topSecurityEventsErrorMessage4Pdf = Utils.getMessageFromItemError(
          threats.message
        );
        return;
      }
      $scope.topSecurityEventsSourceLabels4Pdf = [];
      $scope.topSecurityEventsSourceData4Pdf = [];
      $scope.noTopSecurityEventsSource4Pdf = false;
      $scope.topSecurityEventsDestinationLabels4Pdf = [];
      $scope.topSecurityEventsDestinationData4Pdf = [];
      $scope.noTopSecurityEventsDestination4Pdf = false;

      securityEvents.source.forEach(function (securityEventSourceContainer) {
        $scope.topSecurityEventsSourceLabels4Pdf.push(
          $sanitize(
            Utils.getDisplayName(securityEventSourceContainer[0].source_workload_name)
          )
        );
        $scope.topSecurityEventsSourceData4Pdf.push(securityEventSourceContainer.length);
      });
      if ($scope.topSecurityEventsSourceLabels4Pdf.length < 5) {
        if ($scope.topSecurityEventsSourceLabels4Pdf.length === 0) {
          $scope.noTopSecurityEventsSource4Pdf = true;
        } else {
          for (let i = $scope.topSecurityEventsSourceLabels4Pdf.length; i < 5; i++) {
            $scope.topSecurityEventsSourceLabels4Pdf.push("");
            $scope.topSecurityEventsSourceData4Pdf.push(0);
          }
        }
      }

      securityEvents.destination.forEach(function (securityEventSourceContainer) {
        $scope.topSecurityEventsDestinationLabels4Pdf.push(
          Utils.getDisplayName(
            securityEventSourceContainer[0].destination_workload_name
          )
        );
        $scope.topSecurityEventsDestinationData4Pdf.push(securityEventSourceContainer.length);
      });
      if ($scope.topSecurityEventsDestinationLabels4Pdf.length < 5) {
        if ($scope.topSecurityEventsDestinationLabels4Pdf.length === 0) {
          $scope.noTopSecurityEventsDestination4Pdf = true;
        } else {
          for (let i = $scope.topSecurityEventsDestinationLabels4Pdf.length; i < 5; i++) {
            $scope.topSecurityEventsDestinationLabels4Pdf.push("");
            $scope.topSecurityEventsDestinationData4Pdf.push(0);
          }
        }
      }

      let maxValue =
        $scope.topSecurityEventsSourceData4Pdf[0] +
        Math.ceil($scope.topSecurityEventsSourceData4Pdf[0] * 0.1);
      let maxServerValue =
        $scope.topSecurityEventsDestinationData4Pdf[0] +
        Math.ceil($scope.topSecurityEventsDestinationData4Pdf[0] * 0.1);
      const topSecurityEventsOptions4Pdf = {
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              gridLines: {
                display: true,
              },
              ticks: {
                callback: function (value) {
                  if (value % 1 === 0) {
                    return value;
                  }
                },
                beginAtZero: true,
                suggestedMax: maxValue,
              },
            },
          ],
          yAxes: [
            {
              barThickness: 20,
              ticks: {
                callback: function (value) {
                  if (value.length > 20) return value.substr(0, 20) + "...";
                  else return value;
                },
              },
            },
          ],
        },
        tooltips: {
          enabled: true,
          mode: "label",
          callbacks: {
            title: function (tooltipItems, data) {
              let idx = tooltipItems[0].index;
              if (data.labels[idx].length > 70)
                return data.labels[idx].substr(0, 70) + "...";
              else return data.labels[idx];
            },
            label: function (tooltipItems, data) {
              return tooltipItems.xLabel;
            },
          },
        },
      };

      $scope.topSecurityEventsOptions4Pdf = topSecurityEventsOptions4Pdf;
      $scope.topDestinationSecurityEventsOptions4Pdf = angular.copy(topSecurityEventsOptions4Pdf);
      $scope.topDestinationSecurityEventsOptions4Pdf.scales.xAxes[0].ticks.suggestedMax = maxServerValue;
      $scope.topSecurityEventsColors4Pdf = [
        "#ef5350",
        "#ef5350",
        "#ef5350",
        "#ef5350",
        "#ef5350",
      ];
      $scope.topSecurityEventsDatasetOverride4Pdf = [
        {
          label: "Bar chart",
          borderWidth: 1,
          type: "bar",
        },
      ];
    }

    function toSecurityEventSource(event, array) {
      if (array[0]) {
        $scope.flipping(0);
        let workloadName = Utils.getDisplayName(array[0]._model.label);
        let selectedWorkload =
          $scope.topSecurityEvents[0][
            array[0]._model.label
          ];
        $scope.securityEventsWorkloadSource =
          workloadName.length > 60
            ? workloadName.substr(0, 60) + "..."
            : workloadName;
        console.log("BackData: ", selectedWorkload);
        $scope.gridSecurityEventsSource.api.setRowData(selectedWorkload);
        $timeout(() => {
          $scope.gridSecurityEventsSource.api.sizeColumnsToFit();
        }, 800);
      }
      $scope.$apply();
    }

    function toSecurityEventDestination(event, array) {
      if (array[0]) {
        $scope.flipping(1);
        let workloadName = Utils.getDisplayName(array[0]._model.label);
        let selectedWorkload =
          $scope.topSecurityEvents[1][
            array[0]._model.label
          ];
        $scope.securityEventsWorkloadDestination =
          workloadName.length > 60
            ? workloadName.substr(0, 60) + "..."
            : workloadName;
        console.log("BackData: ", selectedWorkload);
        $scope.gridSecurityEventsDestination.api.setRowData(selectedWorkload);
        $timeout(() => {
          $scope.gridSecurityEventsDestination.api.sizeColumnsToFit();
        }, 800);
      }
      $scope.$apply();
    }

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });
    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      const CRITICAL_SECURITY_EVENT_DURATION = 7;
      const FLIPPING_TIMEOUT = 1000;
      let $win = $($window);
      let resizeEvent = "resize.ag-grid";
      $timeout(function () {
        $scope.isShowingSummary = false;
      }, SHOW_SUMMARY_DELAY);

      $scope.toggleSummary = function (ev, trigger) {
        ev.stopPropagation();
        $scope.isShowingSummary = !$scope.isShowingSummary;
      };

      //nv-tab
      $scope.switchTab = function (tabId, tabContentId) {
        let currentTabNode = document.getElementById(tabId);
        let currentTabContentNode = document.getElementById(tabContentId);
        currentTabNode.classList.add("current");
        currentTabContentNode.classList.remove("hide");
        let siblingsTabNodes = siblings(
          currentTabNode,
          currentTabNode.parentNode.childNodes
        );
        let siblingsTabContentNodes = siblings(
          currentTabContentNode,
          currentTabContentNode.parentNode.childNodes
        );
        for (let i = 0; i < siblingsTabNodes.length; i++) {
          siblingsTabNodes[i].classList.remove("current");
          siblingsTabContentNodes[i].classList.add("hide");
        }
      };

      function siblings(node, children) {
        let siblingList = [];
        for (let n = children.length - 1; n >= 0; n--) {
          if (
            children[n].nodeName !== "#text" &&
            children[n].nodeName !== "#comment" &&
            children[n] !== node
          ) {
            siblingList.push(children[n]);
          }
        }
        return siblingList;
      }

      function renderUI4Heading() {
        $scope.criticalSecurityEvent = {
          title: $translate.instant(
            "dashboard.heading.CRITICAL_SECURITY_EVENT"
          ),
          // subtitle: $translate.instant('dashboard.heading.LAST_7_DAYS'),
          total: 0,
          details: [
            {
              title: $translate.instant("THREATS"),
              amount: 0,
            },
            {
              title: $translate.instant("VIOLATIONS"),
              amount: 0,
            },
            {
              title: $translate.instant("INCIDENTS"),
              amount: 0,
            },
          ],
        };

        $scope.criticalSecurityEvent4Pdf = {
          title: $translate.instant(
            "dashboard.heading.CRITICAL_SECURITY_EVENT"
          ),
          // subtitle: $translate.instant('dashboard.heading.LAST_7_DAYS'),
          total: 0,
          details: [
            {
              title: $translate.instant("THREATS"),
              amount: 0,
            },
            {
              title: $translate.instant("VIOLATIONS"),
              amount: 0,
            },
            {
              title: $translate.instant("INCIDENTS"),
              amount: 0,
            },
          ],
        };

        $scope.highPriorityVulnerabilities = {
          title: $translate.instant(
            "dashboard.heading.HIGH_PRIORITY_VULNERABILITIES"
          ),
          subtitle: "",
          total: 0,
          details: [
            {
              title: $translate.instant("NODES"),
              amount: 0,
            },
          ],
        };

        $scope.containers = {
          title: $translate.instant("dashboard.heading.PODS"),
          subtitle: $translate.instant("dashboard.heading.SECURED"),
          total: 0,
          details: [
            {
              title: $translate.instant("NODES"),
              amount: 0,
            },
            {
              title: $translate.instant("CONTROLLERS"),
              amount: 0,
            },
            {
              title: $translate.instant("ENFORCERS"),
              amount: 0,
            },
          ],
        };

        $scope.systemHealth = {
          title: $translate.instant("dashboard.heading.SYSTEM_HEALTH"),
          subtitle: $translate.instant("dashboard.heading.STATUS_OF_RESOURCES"),
          total: 0 + "%",
          details: "",
        };

        $scope.serviceConnectionRisk = {
          title: $translate.instant("dashboard.heading.SERVICE_CONN_RISK"),
          score: 0,
          eval: "",
          thresholds: {},
          details: [
            {
              title: $translate.instant("dashboard.body.panel_title.DISCOVER"),
              amount: 0,
            },
            {
              title: $translate.instant("dashboard.body.panel_title.MONITOR"),
              amount: 0,
            },
            {
              title: $translate.instant("dashboard.body.panel_title.PROTECT"),
              amount: 0,
            },
          ],
        };

        $scope.ingressEgressRisk = {
          title: $translate.instant("dashboard.heading.INGRESS_EGRESS_RISK"),
          score: 0,
          eval: "",
          thresholds: {},
          details: [
            {
              title: $translate.instant("dashboard.body.panel_title.DISCOVER"),
              amount: 0,
            },
            {
              title: $translate.instant("dashboard.heading.THREATS"),
              amount: 0,
            },
            {
              title: $translate.instant("dashboard.heading.VIOLATIONS"),
              amount: 0,
            },
          ],
        };

        $scope.vulnerabilityExploitRisk = {
          title: $translate.instant("dashboard.heading.VUL_EXPLOIT_RISK"),
          subtitle: "",
          score: 0,
          eval: "",
          thresholds: {},
          isInit: false,
          configAutoScan: configAutoScan,
          isAutoScan: false,
          // detailColTitle: {
          //   title1: `${$translate.instant("enum.HIGH")}/${$translate.instant(
          //     "enum.MEDIUM"
          //   )}`,
          // },
          details: [
            {
              title: $translate.instant("dashboard.body.panel_title.DISCOVER"),
              amount: "0/0",
              amountHi: 0,
              amountMed: 0,
            },
            {
              title: $translate.instant("dashboard.body.panel_title.MONITOR"),
              amount: "0/0",
              amountHi: 0,
              amountMed: 0,
            },
            {
              title: $translate.instant("dashboard.body.panel_title.PROTECT"),
              amount: "0/0",
              amountHi: 0,
              amountMed: 0,
            },
          ],
        };
      }

      $scope.card = [
        {
          flip: "flip-0",
          backAspect: "hide",
          frontAspect: "show",
        },
        {
          flip: "flip-0",
          backAspect: "hide",
          frontAspect: "show",
        },
        {
          flip: "flip-0",
          backAspect: "hide",
          frontAspect: "show",
        },
      ];

      let isFlippingEnabled = true;

      $scope.flipping = function (index) {
        if (isFlippingEnabled) {
          isFlippingEnabled = false;
          if ($scope.card[index].flip === "flip-0") {
            $scope.card[index].flip = "flip-1";
            $timeout(() => {
              $scope.card[index].backAspect = "show";
            }, 500);
            $timeout(() => {
              $scope.card[index].frontAspect = "hide";
            }, 600);
          } else {
            $scope.card[index].flip = "flip-0";
            $timeout(() => {
              $scope.card[index].frontAspect = "show";
            }, 500);
            $timeout(() => {
              $scope.card[index].backAspect = "hide";
            }, 600);
          }
        }
        $timeout(() => {
          isFlippingEnabled = true;
        }, FLIPPING_TIMEOUT);
      };

      renderUI4Heading();

      function configAutoScan(isAutoScan) {
        const reqAutoScanSwitching = function (isAutoScan) {
          let alert = "";
          $http
            .post(SCAN_CONFIG_URL, { config: { auto_scan: isAutoScan } })
            .then(function () {
              if (isAutoScan) {
                alert = $translate.instant(
                  "dashboard.body.message.AUTO_SCAN_ENABLE_OK"
                );
              } else {
                alert = $translate.instant(
                  "dashboard.body.message.AUTO_SCAN_DISABLE_OK"
                );
              }
              updateHeaderSlide(isAutoScan);
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success(alert);
            })
            .catch(function (err) {
              if (USER_TIMEOUT.indexOf(err.status) < 0) {
                if (isAutoScan) {
                  alert = $translate.instant(
                    "dashboard.body.message.AUTO_SCAN_ENABLE_NG"
                  );
                } else {
                  alert = $translate.instant(
                    "dashboard.body.message.AUTO_SCAN_DISABLE_NG"
                  );
                }
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                console.log(err.data);
                Alertify.error(Utils.getAlertifyMsg(err, alert, false));
                $timeout(function () {
                  document.getElementById(
                    "switch-autoscan"
                  ).checked = !isAutoScan;
                  $scope.$apply();
                }, 4000);
              }
            });
        };

        if (!isAutoScan) {
          let confirmBox = $translate.instant(
            "dashboard.body.message.DISABLE_AUTOSCAN_CONFIRM"
          );
          Alertify.confirm(confirmBox).then(
            function toOK() {
              reqAutoScanSwitching(isAutoScan);
            },
            function toCancel() {
              document.getElementById("switch-autoscan").checked = !isAutoScan;
              $scope.vulnerabilityExploitRisk.isAutoScan = !isAutoScan;
              $scope.$apply();
            }
          );
        } else {
          reqAutoScanSwitching(isAutoScan);
        }
      }

      function portGetter(params) {
        let protocol = params.data.ip_proto;
        if (protocol === 1) return "icmp/" + params.data.server_port;
        else if (protocol === 6) return "tcp/" + params.data.server_port;
        else if (protocol === 17) return "udp/" + params.data.server_port;
        else return params.data.server_port;
      }

      let securityEventsSourceColumnDefs = [
        {
          headerName: $translate.instant("threat.gridHeader.NAME"),
          cellRenderer: function (params) {
            if (params.data) {
              if (params.data.name) {
                return params.data.name;
              }
              else if (params.data.policy_id !== null && params.data.policy_id !== undefined) {
                let policyId = params.data.policy_id;
                if (policyId > 0) {
                  return `Violated network rule: ${policyId}`;
                } else {
                  return "Violated implicit network rule";
                }
              }
            }
            return "";
          },
          width: 80
        },
        {
          headerName: $translate.instant("event.gridHeader.LEVEL"),
          field: "level",
          cellRenderer: function (params) {
            let labelClass = colourMap[params.value];
            console.log(labelClass)
            return (
              '<span class="label label-fs label-' +
              labelClass +
              '">' +
              $sanitize(getDisplayname(params.value.toLowerCase())) +
              "</span>"
            );
          },
          width: 80,
          maxWidth: 80,
          minWidth: 80
        },
        {
          headerName: $translate.instant("threat.gridHeader.DESTINATION"),
          field: "destination_workload_name",
          cellRenderer: function (params) {
            return renderSecurityEventEndpointName(
              params.data.host_name,
              params.value,
              params.data.destination_ip,
              params.data.destination_workload_id,
              params.data.destination_port,
              params.data.server_conn_port,
              params.data.target
            );
          },
          width: 100
        },
        // {
        //   headerName: $translate.instant("threat.gridHeader.APPLICATION"),
        //   field: "application",
        //   cellRenderer: function (params) {
        //     if (params.value) {
        //       return params.value;
        //     }
        //     return "";
        //   },
        //   width: 80
        // },
        {
          headerName: $translate.instant("threat.gridHeader.TIME"),
          field: "reported_at",
          cellRenderer: function (params) {
            return $sanitize(
              $filter("date")(params.value, "MMM dd, yy HH:mm:ss")
            );
          },
          comparator: dateComparator,
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>',
          },
          width: 130,
          minWidth: 130,
          maxWidth: 140
        },
      ];

      let securityEventsDestinationColumnDefs = [
        {
          headerName: $translate.instant("threat.gridHeader.NAME"),
          cellRenderer: function (params) {
            if (params.data) {
              if (params.data.name) {
                return params.data.name;
              }
              else if (params.data.policy_id !== null && params.data.policy_id !== undefined) {
                let policyId = params.data.policy_id;
                if (policyId > 0) {
                  return `Violated network rule: ${policyId}`;
                } else {
                  return "Violated implicit network rule";
                }
              }
            }
            return "";
          },
          width: 80
        },
        {
          headerName: $translate.instant("event.gridHeader.LEVEL"),
          field: "level",
          cellRenderer: function (params) {
            let labelClass = colourMap[params.value];
            console.log(labelClass)
            return (
              '<span class="label label-fs label-' +
              labelClass +
              '">' +
              $sanitize(getDisplayname(params.value.toLowerCase())) +
              "</span>"
            );
          },
          width: 80,
          maxWidth: 80,
          minWidth: 80
        },
        {
          headerName: $translate.instant("threat.gridHeader.SOURCE"),
          field: "source_workload_name",
          cellRenderer: function (params) {
            return renderSecurityEventEndpointName(
              params.data.host_name,
              params.value,
              params.data.source_ip,
              params.data.source_workload_id,
              params.data.source_port,
              params.data.source_conn_port,
              params.data.target
            );
          },
          width: 100
        },
        // {
        //   headerName: $translate.instant("threat.gridHeader.APPLICATION"),
        //   field: "application",
        //   cellRenderer: function (params) {
        //     if (params.value) {
        //       return params.value;
        //     }
        //     return "";
        //   },
        //   width: 80
        // },
        {
          headerName: $translate.instant("threat.gridHeader.TIME"),
          field: "reported_at",
          cellRenderer: function (params) {
            return $sanitize(
              $filter("date")(params.value, "MMM dd, yy HH:mm:ss")
            );
          },
          comparator: dateComparator,
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>',
          },
          width: 130,
          minWidth: 130,
          maxWidth: 140
        },
      ];

      const renderSecurityEventEndpointName = function (
        hostName,
        name,
        ip,
        id,
        port,
        conn_port,
        target
      ) {
        console.log(
          hostName,
          name,
          ip,
          id,
          port,
          conn_port,
          target
        )
        let displayName =
          Utils.getEndPointType(name) + Utils.getDisplayName(name);
        if (name !== ip) {
          if (displayName) {
            if (ip) {
              displayName = displayName + " (" + ip + ")";
            }
          } else {
            displayName = ip;
          }
        }

        if (id === "external") {
          return (
            '<a href="https://www.whois.com/whois/' +
            ip +
            '" target="_blank">' +
            $sanitize(displayName) +
            "</a>"
          );
        } else {
          if (target === "server") {
            return "<div>" + displayName + "</div>";
          } else {
            if (port) {
              if (port === conn_port) {
                if (displayName) {
                  return (
                    "<div>" + $sanitize(displayName + ":" + port) + " </div>"
                  );
                } else {
                  return "<div>" + port + " </div>";
                }
              } else {
                if (displayName) {
                  if (conn_port) {
                    return (
                      "<div>" +
                      $sanitize(displayName + ":" + port + "(" + conn_port + ")") +
                      " </div>"
                    );
                  } else {
                    return (
                      "<div>" +
                      $sanitize(displayName + ":" + port) +
                      " </div>"
                    );
                  }
                } else {
                  return (
                    "<div>" + $sanitize(port + "(" + conn_port + ")") + " </div>"
                  );
                }
              }
            }
            if (displayName) {
              return (
                "<div>" +
                $sanitize(displayName) +
                " </div>"
              );
            } else {
              return (
                "<div>" +
                "Host: " + $sanitize(hostName) +
                " </div>"
              );
            }

          }
        }
      };

      const redirectToSecurityEventSource = function() {
        let selectedRow = $scope.gridSecurityEventsSource.api.getSelectedRows()[0];
        console.log("selectedRow: ", selectedRow);
        $state.go('app.securityEvent', {selectedRow: selectedRow});
      };

      const redirectToSecurityEventDestination = function() {
        let selectedRow = $scope.gridSecurityEventsDestination.api.getSelectedRows()[0];
        $state.go('app.securityEvent', {selectedRow: selectedRow});
      };

      $scope.gridSecurityEventsSource = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: securityEventsSourceColumnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        onSelectionChanged: redirectToSecurityEventSource,
        onGridReady: function (params) {
          setTimeout(function () {
            params.api.sizeColumnsToFit();
          }, 1000);
          $win.on(resizeEvent, function () {
            setTimeout(function () {
              params.api.sizeColumnsToFit();
            }, 2000);
          });
        },
      };

      $scope.gridSecurityEventsDestination = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: securityEventsDestinationColumnDefs,
        rowData: null,
        animateRows: true,
        rowSelection: "single",
        onSelectionChanged: redirectToSecurityEventDestination,
        onGridReady: function (params) {
          setTimeout(function () {
            params.api.sizeColumnsToFit();
          }, 1000);
          $win.on(resizeEvent, function () {
            setTimeout(function () {
              params.api.sizeColumnsToFit();
            }, 2000);
          });
        },
      };

      $scope.getColorCode = function (severity) {
        return colourMap[severity];
      };

      function getDisplayname(name) {
        return $translate.instant("enum." + name.toUpperCase());
      }

      function dateComparator(value1, value2, node1, node2) {
        return node1.data.reported_timestamp - node2.data.reported_timestamp;
      }


      function renderTopVulnerabileContainersBarChart4Pdf(vuls) {
        $scope.topVulnerabileContainersError4Pdf =
          typeof vuls.message === "string";
        let containers = vuls.top5Containers;
        $scope.topVulnerabileContainersData4Pdf = [];
        $scope.topVulnerabileContainersLabels4Pdf = [];
        $scope.noTopVulnerabileContainers4Pdf = false;
        let highVulnerabileContainers = [];
        let mediumVulnerabileContainers = [];

        containers.forEach(function (container) {
          highVulnerabileContainers.push(container.high4Dashboard);
          mediumVulnerabileContainers.push(container.medium4Dashboard);
          $scope.topVulnerabileContainersLabels4Pdf.push(
            $sanitize(container.display_name)
          );
        });

        $scope.topVulnerabileContainersData4Pdf = [
          highVulnerabileContainers,
          mediumVulnerabileContainers,
        ];

        if ($scope.topVulnerabileContainersLabels4Pdf.length < 5) {
          if ($scope.topVulnerabileContainersLabels4Pdf.length === 0) {
            $scope.noTopVulnerabileContainers4Pdf = true;
            $scope.topVulnerabileContainersData4Pdf = [];
          } else {
            for (
              let i = $scope.topVulnerabileContainersLabels4Pdf.length;
              i < 5;
              i++
            ) {
              $scope.topVulnerabileContainersLabels4Pdf.push("");
              $scope.topVulnerabileContainersData4Pdf[0].push(0);
              $scope.topVulnerabileContainersData4Pdf[1].push(0);
            }
          }
        }

        $scope.topVulnerabileContainersOptions4Pdf = {
          maintainAspectRatio: false,
          legend: {
            display: true,
            labels: {
              boxWidth: 12,
            },
          },
          scales: {
            xAxes: [
              {
                gridLines: {
                  display: true,
                },
                ticks: {
                  callback: function (value) {
                    if (value % 1 === 0) {
                      return value;
                    }
                  },
                  beginAtZero: true,
                  // suggestedMax: maxValue
                },
              },
            ],
            yAxes: [
              {
                barThickness: 12,
              },
            ],
          },
        };
        $scope.topVulnerabileContainersColors4Pdf = ["#ef5350", "#ff9800"];
        $scope.topVulnerabileContainersSerials4Pdf = [
          $translate.instant("enum.HIGH"),
          $translate.instant("enum.MEDIUM"),
        ];
      }

      function renderTopVulnerabileNodesBarChart4Pdf(vuls) {
        $scope.topVulnerabileNodesError4Pdf = typeof vuls.message === "string";
        let nodes = vuls.top5Nodes;
        $scope.topVulnerabileNodesData4Pdf = [];
        $scope.topVulnerabileNodesLabels4Pdf = [];
        $scope.noTopVulnerabileNodes4Pdf = false;
        let highVulnerabileNodes = [];
        let mediumVulnerabileNodes = [];

        nodes.forEach(function (node) {
          highVulnerabileNodes.push(
            node.scan_summary ? node.scan_summary.high : 0
          );
          mediumVulnerabileNodes.push(
            node.scan_summary ? node.scan_summary.medium : 0
          );
          $scope.topVulnerabileNodesLabels4Pdf.push($sanitize(node.name));
        });

        $scope.topVulnerabileNodesData4Pdf = [
          highVulnerabileNodes,
          mediumVulnerabileNodes,
        ];

        if ($scope.topVulnerabileNodesLabels4Pdf.length < 5) {
          if ($scope.topVulnerabileNodesLabels4Pdf.length === 0) {
            $scope.noTopVulnerabileNodes4Pdf = true;
            $scope.topVulnerabileNodesData4Pdf = [];
          } else {
            for (
              let i = $scope.topVulnerabileNodesLabels4Pdf.length;
              i < 5;
              i++
            ) {
              $scope.topVulnerabileNodesLabels4Pdf.push("");
              $scope.topVulnerabileNodesData4Pdf[0].push(0);
              $scope.topVulnerabileNodesData4Pdf[1].push(0);
            }
          }
        }

        $scope.topVulnerabileNodesOptions4Pdf = {
          maintainAspectRatio: false,
          legend: {
            display: true,
            labels: {
              boxWidth: 12,
            },
          },
          scales: {
            xAxes: [
              {
                gridLines: {
                  display: true,
                },
                ticks: {
                  callback: function (value) {
                    if (value % 1 === 0) {
                      return value;
                    }
                  },
                  beginAtZero: true,
                  // suggestedMax: maxValue
                },
              },
            ],
            yAxes: [
              {
                barThickness: 12,
              },
            ],
          },
        };
        $scope.topVulnerabileNodesColors4Pdf = ["#ef5350", "#ff9800"];
        $scope.topVulnerabileNodesSerials4Pdf = [
          $translate.instant("enum.HIGH"),
          $translate.instant("enum.MEDIUM"),
        ];
      }

      $scope.onHover = function (points, evt) {
        if (points.length === 0) {
          evt.toElement.attributes.style.nodeValue = evt.toElement.attributes.style.nodeValue.replace(
            "cursor: pointer;",
            ""
          );
          return;
        }
        let res = evt.toElement.attributes.style.nodeValue.match(
          /cursor: pointer;/
        );
        if (res === null) {
          evt.toElement.attributes.style.nodeValue += "cursor: pointer;";
        }
      };

      $scope.serviceCoverageComment = $translate.instant(
        "dashboard.body.comments.CAUTION_SERVICE"
      );
      $scope.podCoverageComment = $translate.instant(
        "dashboard.body.comments.CAUTION_POD"
      );
      $scope.commentLabel = "label-caution";
      $scope.commentLabelText = $translate.instant("enum.CAUTION");

      function renderServicePolicyModePieChart4Pdf2(score) {
        $scope.servicePolicyModeData = [
          score.discover_groups,
          score.monitor_groups,
          score.protect_groups
        ];
        $scope.servicePolicyModeColors = [
          protectColor, //Protect
          monitorColor, //Monitor
          "#2196F3", //Discover
        ];
        const modes = ["protect", "monitor", "discover"];
        $scope.servicePolicyModeLabels = modes.map(function (mode) {
          return $translate.instant(`enum.${mode.toUpperCase()}`);
        });
        $scope.servicePolicyModeOptions = {
          maintainAspectRatio: false,
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 12,
            },
          },
        };
      }

      function renderServicePolicyModePieChart4Pdf(services, policyCoverage) {
        $scope.servicePolicyModeError4Pdf =
          typeof policyCoverage.message === "string" ||
          typeof services.message === "string";
        $scope.servicePolicyModeData4Pdf = [];
        $scope.serviceManagementLabels4Pdf = [];
        $scope.policyCoverage4Pdf = policyCoverage;
        $scope.noManagedServices4Pdf = false;

        $scope.servicePolicyModeColors4Pdf = [
          protectColor, //Protect
          monitorColor, //Monitor
          "#2196F3", //Discover
        ];

        let count = {
          total: 0,
          exit: 0,
          discover: 0,
          monitor: 0,
          protect: 0,
        };
        let modes = ["protect", "monitor", "discover"];
        let evaluations = {
          excellent: 90,
          verygood: 75,
          good: 60,
          fair: 40,
          bad: 0,
        };

        services.forEach(function (service) {
          if (
            service.members.length > 0 &&
            count[(service.policy_mode || "").toLowerCase()] !== undefined
          ) {
            count[(service.policy_mode || "").toLowerCase()]++;
          }
        });

        $scope.servicePolicyModeData4Pdf = [
          count.protect,
          count.monitor,
          count.discover,
          count.exit,
        ];

        count.total =
          policyCoverage.learnt.length + policyCoverage.others.length;
        $scope.servicePolicyModeLabels4Pdf = modes.map(function (mode) {
          return $translate.instant(`enum.${mode.toUpperCase()}`);
        });
        let coverage = Math.round(
          (policyCoverage.learnt.length / count.total) * 100
        );
        $scope.displayCoverage4Pdf = `${$translate.instant(
          "dashboard.body.panel_title.PROGRESS"
        )}: ${coverage}%`;
        let protect = Math.round((count.protect / count.total) * 100);
        let monitor = Math.round((count.monitor / count.total) * 100);
        $scope.displayProtect4Pdf = `${$translate.instant(
          "dashboard.body.panel_title.PROTECT"
        )}: ${protect}%`;
        $scope.displayMonitor4Pdf = `${$translate.instant(
          "dashboard.body.panel_title.MONITOR"
        )}: ${monitor}%`;
        // let evaluationValue = getLearntCoverageEvaluation(
        //   evaluations,
        //   coverage
        // );
        // $scope.evaluationValueDisplay4Pdf = $translate.instant(
        //   `dashboard.body.policy_evaluation.${evaluationValue}`
        // );
        // let coverageValue = getPolicyCoverageEvaluation(protect, monitor);
        // $scope.coverageValueDisplay4Pdf = $translate.instant(
        //   `dashboard.body.policy_evaluation.${coverageValue}`
        // );
        // $scope.servicePolicyCoverageColors4Pdf =
        //   evaluationColorsSet[coverageValue.toLowerCase()];
        // $scope.coverageStyle4Pdf = {
        //   color: $scope.servicePolicyCoverageColors4Pdf[0]
        // };

        $scope.noManagedServices4Pdf = count.total === 0;
        $scope.servicePolicyModeOptions4Pdf = {
          maintainAspectRatio: false,
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 12,
            },
          },
        };
        if (coverage === 100) {
          $scope.policyCoverageComment4Pdf = $translate.instant(
            "dashboard.body.comments.SAFE"
          );
          $scope.commentLabel4Pdf = "label-safe";
          $scope.commentLabelText4Pdf = $translate.instant("enum.SAFE");
          $scope.style4Pdf = {
            backgroundColor: "#059059",
            color: "#ffffff",
          };
        } else {
          $scope.policyCoverageComment4Pdf = $translate.instant(
            "dashboard.body.comments.CAUTION"
          );
          $scope.commentLabel4Pdf = "label-caution";
          $scope.commentLabelText4Pdf = $translate.instant("enum.CAUTION");
          $scope.style4Pdf = {
            backgroundColor: "#ffcb02",
            color: "#545454",
          };
        }
      }

      const serviceColumns = [
        {
          headerName: $translate.instant(
            "dashboard.panelItems.servicesHeader.NAMESPACE"
          ),
          field: "domain",
          width: 70,
        },
        {
          headerName: $translate.instant(
            "dashboard.panelItems.servicesHeader.SERVICE"
          ),
          field: "name",
          width: 120,
        },
        {
          headerName: $translate.instant(
            "dashboard.panelItems.servicesHeader.POLICY_MODE"
          ),
          field: "policy_mode",
          cellRenderer: function (params) {
            let mode = "";
            if (params.value) {
              mode = Utils.getI18Name(params.value);
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else
                return `<span class="label label-fs label-${labelCode}">${$sanitize(
                  mode
                )}</span>`;
            } else return null;
          },
          width: 95,
          maxWidth: 95,
          minWidth: 95,
        },
        {
          headerName: $translate.instant(
            "dashboard.panelItems.servicesHeader.MEMBERS"
          ),
          field: "members",
          cellRenderer: function (params) {
            return params.value.length;
          },
          width: 40,
        },
      ];

      $scope.gridServiceOption = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        animateRows: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: serviceColumns,
        rowData: null,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>',
        },
        onGridReady: function (params) {
          $timeout(function () {
            params.api.sizeColumnsToFit();
          }, 2000);
          $win.on(resizeEvent, function () {
            $timeout(function () {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
      };

      function toServicesDetails(event, array) {
        if (array[0]) {
          $scope.flipping(2);
          $scope.category = Utils.getDisplayName(
            array[0]._model.label
          ).toUpperCase();
          let selectedWorkload =
            $scope.policyCoverage[$scope.category.toLowerCase()];
          $scope.gridServiceOption.api.setRowData(selectedWorkload);
          $timeout(() => {
            $scope.gridServiceOption.api.sizeColumnsToFit();
          }, 800);
        }
        $scope.$apply();
      }

      function getLearntCoverageEvaluation(evaluations, coverage) {
        return coverage >= evaluations.excellent
          ? "EXCELLENT"
          : coverage >= evaluations.verygood
          ? "VERYGOOD"
          : coverage >= evaluations.good
          ? "GOOD"
          : coverage >= evaluations.fair
          ? "FAIR"
          : "POOR";
      }

      function renderContainerModePieChart4Pdf(containers) {
        $scope.containerModeError4Pdf = typeof containers.message === "string";

        $scope.containerModesData4Pdf = [];
        $scope.containerModesLabels4Pdf = [];
        $scope.noManagedContainers4Pdf = false;
        $scope.containerModesColors4Pdf = [
          protectColor, //Protect
          monitorColor, //Monitor
          "#2196F3", //Discover
          "#E91E63", //Quarantined
        ];
        let count = {
          discover: 0,
          monitor: 0,
          protect: 0,
          quarantined: 0,
        };
        let workloadCount = 0;
        let states = ["protect", "monitor", "discover", "quarantined"];
        containers.forEach(function (container) {
          if (count[container.state.toLowerCase()] !== undefined) {
            count[container.state.toLowerCase()]++;
            workloadCount++;
          }
        });
        $scope.containerModesData4Pdf = [
          count.protect,
          count.monitor,
          count.discover,
          count.quarantined,
        ];

        let containerModeEvaluation = getPolicyCoverageEvaluation(
          Math.round((count.protect / workloadCount) * 100),
          Math.round((count.monitor / workloadCount) * 100)
        );
        // $scope.containerModeEvaluationDisplay4Pdf = $translate.instant(
        //   `dashboard.body.policy_evaluation.${containerModeEvaluation.toUpperCase()}`
        // );
        $scope.containerModeComment4Pdf = $translate.instant(
          `dashboard.body.comments.${containerModeEvaluation.toUpperCase()}`
        );
        $scope.containerModesLabels4Pdf = states.map(function (state) {
          return $translate.instant(`enum.${state.toUpperCase()}`);
        });
        // $scope.containerModesLabels4Pdf = states.map(function(state, index) {
        //   return `${$translate.instant(
        //     `enum.${state.toUpperCase()}`
        //   )}: ${$scope.containerModesData[index]}`;
        // });
        $scope.containerModeevaluationStyle4Pdf = {
          backgroundColor:
            evaluationColorsSet[containerModeEvaluation.toLowerCase()],
        };
        $scope.noManagedContainers4Pdf = workloadCount === 0;
        $scope.containerModesOptions4Pdf = {
          maintainAspectRatio: false,
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 12,
            },
          },
        };
      }

      function renderPolicyApps2BarChart4Pdf(apps) {
        $scope.application2Error4Pdf = typeof apps.message === "string";
        $scope.noPolicyApplication24Pdf = false;
        $scope.policyApps2Labels4Pdf = [];
        $scope.policyApps2Data4Pdf = [];
        $scope.policyApps2Colors4Pdf = [];
        $scope.policyApps3Labels4Pdf = [];
        $scope.policyApps3Data4Pdf = [];
        $scope.policyApps3Colors4Pdf = [];
        let apps4Count = angular
          .copy(apps)
          .sort((a, b) => b[1].count - a[1].count);
        let apps4TotalBytes = angular
          .copy(apps)
          .sort((a, b) => b[1].totalBytes - a[1].totalBytes);
        if (apps.length > 0) {
          apps4Count.forEach(function (app) {
            $scope.policyApps2Labels4Pdf.push($sanitize(app[0]));
            $scope.policyApps2Data4Pdf.push(app[1].count);
          });
          $scope.policyApps2Colors4Pdf = new Array(
            $scope.policyApps2Data4Pdf.length
          );
          $scope.policyApps2Colors4Pdf.fill(protectColor);

          apps4TotalBytes.forEach(function (app) {
            $scope.policyApps3Labels4Pdf.push($sanitize(app[0]));
            $scope.policyApps3Data4Pdf.push(app[1].totalBytes);
          });
          $scope.policyApps3Colors4Pdf = new Array(
            $scope.policyApps3Data4Pdf.length
          );
          $scope.policyApps3Colors4Pdf.fill(protectColor);

          $scope.policyApps2Options4Pdf = {
            maintainAspectRatio: false,
            scales: {
              yAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
            },
          };
          $scope.policyApps3Options4Pdf = {
            maintainAspectRatio: false,
            tooltips: {
              enabled: true,
              mode: "label",
              callbacks: {
                title: function (tooltipItems, data) {
                  let idx = tooltipItems[0].index;
                  return $filter("bytes")(data.datasets[0].data[idx]);
                },
                label: function (tooltipItems, data) {
                  return tooltipItems.xLabel;
                },
              },
            },
            scales: {
              yAxes: [
                {
                  type: "logarithmic",
                  ticks: {
                    min: 0,
                    max: $scope.policyApps3Data4Pdf[0],
                    callback: function (value, index, values) {
                      return $filter("bytes")(value);
                    },
                  },
                  afterBuildTicks: function (pckBarChart) {
                    pckBarChart.ticks = [];
                    pckBarChart.ticks.push(0);
                    pckBarChart.ticks.push(
                      Math.round($scope.policyApps3Data4Pdf[0] / 1000)
                    );
                    pckBarChart.ticks.push(
                      Math.round($scope.policyApps3Data4Pdf[0] / 100)
                    );
                    pckBarChart.ticks.push(
                      Math.round($scope.policyApps3Data4Pdf[0] / 10)
                    );
                    pckBarChart.ticks.push(
                      Math.round($scope.policyApps3Data4Pdf[0])
                    );
                  },
                },
              ],
            },
          };
        } else {
          $scope.noPolicyApplication24Pdf = true;
        }
      }

      function innerCellRenderer(params) {
        const serviceColorArray = [
          "text-danger",
          "text-warning",
          "text-caution",
          "text-monitor",
          "text-protect",
        ];
        const levelMap = {
          protect: 4,
          monitor: 3,
          discover: 2,
          violate: 1,
          warning: 1,
          deny: 0,
          critical: 0,
        };

        let level = [];
        if (params.data.children) {
          params.data.children.forEach(function (child) {
            if (child.severity) {
              level.push(levelMap[child.severity.toLowerCase()]);
            } else if (
              child.policy_action &&
              (child.policy_action.toLowerCase() === "deny" ||
                child.policy_action.toLowerCase() === "violate")
            ) {
              level.push(levelMap[child.policy_action.toLowerCase()]);
            } else {
              if (!child.policy_mode) child.policy_mode = "discover";
              level.push(levelMap[child.policy_mode.toLowerCase()]);
            }
          });
          let serviceColor = serviceColorArray[Math.min(...level)];
          return `<span class="${serviceColor}"></em>${$sanitize(
            params.data.service
          )}</span>`;
        } else {
          const podColorArray = [
            "text-danger",
            "text-warning",
            "text-caution",
            "text-monitor",
            "text-protect",
          ];
          const levelMap = {
            protect: 4,
            monitor: 3,
            discover: 2,
            violate: 1,
            warning: 1,
            deny: 0,
            critical: 0,
          };
          const actionTypeIconMap = {
            discover: "fa icon-size-2 fa-exclamation-triangle",
            violate: "fa icon-size-2 fa-ban",
            protect: "fa icon-size-2 fa-shield",
            monitor: "fa icon-size-2 fa-bell",
            deny: "fa icon-size-2 fa-minus-circle",
            threat: "fa icon-size-2 fa-bug",
          };
          let actionType = "";
          let level = 0;
          if (params.data.severity) {
            level = levelMap[params.data.severity.toLowerCase()];
            actionType = actionTypeIconMap["threat"];
          } else if (
            params.data.policy_action &&
            (params.data.policy_action.toLowerCase() === "deny" ||
              params.data.policy_action.toLowerCase() === "violate")
          ) {
            level = levelMap[params.data.policy_action.toLowerCase()];
            actionType =
              actionTypeIconMap[params.data.policy_action.toLowerCase()];
          } else {
            if (!params.data.policy_mode) params.data.policy_mode = "discover";
            level = levelMap[params.data.policy_mode.toLowerCase()];
            actionType =
              actionTypeIconMap[params.data.policy_mode.toLowerCase()];
          }
          return `<span class="${
            podColorArray[level]
          }">&nbsp;&nbsp;&nbsp;&nbsp;<em class="${actionType}"></em>&nbsp;&nbsp;${$sanitize(
            params.data.display_name
          )}</span>`;
        }
      }

      let exposedContainerColumnDefs = [
        {
          headerName: $translate.instant("dashboard.body.panel_title.SERVICE"),
          field: "service",
          width: 180,
          cellRendererParams: { innerRenderer: innerCellRenderer },
          cellRenderer: "agGroupCellRenderer",
        },
        {
          headerName: $translate.instant(
            "dashboard.body.panel_title.APPLICATIONS"
          ),
          field: "applications",
          cellRenderer: function (params) {
            if (params.value) {
              return $sanitize(
                params.data.ports
                  ? params.value.concat(params.data.ports).join(", ")
                  : params.value.join(", ")
              );
            }
          },
          width: 100,
          suppressSorting: true,
        },
        {
          headerName: $translate.instant(
            "dashboard.body.panel_title.POLICY_MODE"
          ),
          field: "policy_mode",
          cellRenderer: function (params) {
            let mode = "";
            if (params.value) {
              mode = Utils.getI18Name(params.value);
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else
                return `<span class="label label-fs label-${labelCode}">${$sanitize(
                  mode
                )}</span>`;
            } else return null;
          },
          width: 95,
          maxWidth: 95,
          minWidth: 95,
          suppressSorting: true,
        },
        {
          headerName: $translate.instant(
            "dashboard.body.panel_title.POLICY_ACTION"
          ),
          field: "policy_action",
          cellRenderer: function (params) {
            if (params.value) {
              return `<span ng-class="{\'policy-remove\': data.remove}"
                    class="action-label ${
                      colourMap[params.value.toLowerCase()]
                    }">
                    ${$sanitize(
                      $translate.instant(
                        "policy.action." + params.value.toUpperCase()
                      )
                    )}
                  </span>`;
            }
          },
          width: 80,
          maxWidth: 80,
          minWidth: 80,
          suppressSorting: true,
        },
      ];

      function getWorkloadChildDetails(rowItem) {
        if (rowItem.children && rowItem.children.length > 0) {
          return {
            group: true,
            children: rowItem.children,
            expanded: false, //rowItem.seq === 0
          };
        } else {
          return null;
        }
      }

      $scope.gridIngressContainer = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        animateRows: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: exposedContainerColumnDefs,
        getNodeChildDetails: getWorkloadChildDetails,
        rowData: null,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>',
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS"),
        onGridReady: function (params) {
          $timeout(function () {
            params.api.sizeColumnsToFit();
          }, 2000);
          $win.on(resizeEvent, function () {
            $timeout(function () {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
      };

      $scope.gridEgressContainer = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        animateRows: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: exposedContainerColumnDefs,
        getNodeChildDetails: getWorkloadChildDetails,
        rowData: null,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>',
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS"),
        onGridReady: function (params) {
          $timeout(function () {
            params.api.sizeColumnsToFit();
          }, 2000);
          $win.on(resizeEvent, function () {
            $timeout(function () {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
      };

      function renderContainersSecurityBarChart4Pdf(exposedConversations) {
        $scope.ExposureConversationsError4Pdf =
          typeof exposedConversations.message === "string";
        let egressConstains = exposedConversations.egress.flatMap(function (
          service
        ) {
          return service.children;
        });
        let ingressContainers = exposedConversations.ingress.flatMap(function (
          service
        ) {
          return service.children;
        });
        let numberByCategory = {
          allow: 0,
          deny: 0,
          violate: 0,
          threat: 0,
        };
        let chartNumbers = {
          ingress: angular.copy(numberByCategory),
          egress: angular.copy(numberByCategory),
        };

        const accumulateData = function (exposedContainers, direction) {
          exposedContainers.forEach(function (exposedContainer) {
            if (exposedContainer.severity) {
              chartNumbers[direction]["threat"]++;
            } else {
              chartNumbers[direction][
                exposedContainer.policy_action.toLowerCase()
              ]++;
            }
          });
        };

        accumulateData(ingressContainers, "ingress");
        accumulateData(egressConstains, "egress");
        $scope.containersSecData24Pdf = [
          Object.values(chartNumbers.ingress),
          Object.values(chartNumbers.egress),
        ];
        console.log($scope.containersSecData24Pdf);

        $scope.noExposedContainers4Pdf = false;
        if (
          exposedConversations.ingress.length > 0 ||
          exposedConversations.egress.length > 0
        ) {
          if (exposedConversations.ingress.length === 0) {
            $scope.dashboard.containerSecIndex = 1;
          }

          $scope.containersSecLabels24Pdf = [
            "ALLOW",
            "DENY",
            "ALERT",
            "THREAT",
          ];
          $scope.containersSecColors24Pdf = ["#ff0d81", "#ff7101"];
          $scope.containersSecSerie24Pdf = [
            `${$translate.instant(
              "dashboard.body.panel_title.INGRESS_CONTAINERS"
            )}`,
            `${$translate.instant(
              "dashboard.body.panel_title.EGRESS_CONTAINERS"
            )}`,
          ];
          $scope.containersSecOptions24Pdf = {
            maintainAspectRatio: false,
            // onClick: toExposedContainers,
            legend: {
              display: true,
              position: "top",
              labels: {
                boxWidth: 12,
              },
            },
            scales: {
              xAxes: [
                {
                  stacked: true,
                  ticks: {
                    beginAtZero: true,
                    callback: function (value) {
                      return $translate.instant(
                        `dashboard.body.panel_title.${value}`
                      );
                    },
                  },
                },
              ],
              yAxes: [
                {
                  stacked: true,
                  ticks: {
                    beginAtZero: true,
                    callback: function (value) {
                      if (value % 1 === 0) return value;
                    },
                  },
                },
              ],
            },
          };
          $scope.ingressPdfGridData4Pdf = preparePdfGridData4IngressEgressConn(
            exposedConversations.ingress,
            "ingress"
          );
          $scope.egressPdfGridData4Pdf = preparePdfGridData4IngressEgressConn(
            exposedConversations.egress,
            "egress"
          );
        } else {
          $scope.noExposedContainers4Pdf = true;
          $scope.containersSecData24Pdf = [];
          $scope.ingressPdfGridData4Pdf = preparePdfGridData4IngressEgressConn(
            exposedConversations.ingress,
            "ingress"
          );
          $scope.egressPdfGridData4Pdf = preparePdfGridData4IngressEgressConn(
            exposedConversations.egress,
            "egress"
          );
        }
      }

      function toExposedContainers(event, array) {
        if (array[0]) {
          let selectedCatefory = array[0]._model.datasetLabel;
          console.log(selectedCatefory, array);
          if (
            selectedCatefory ===
            $translate.instant("dashboard.body.panel_title.INGRESS_CONTAINERS")
          ) {
            console.log("here1");
            $scope.dashboard.containerSecIndex = 0;
          } else if (
            selectedCatefory ===
            $translate.instant("dashboard.body.panel_title.EGRESS_CONTAINERS")
          ) {
            console.log("here2");
            $scope.dashboard.containerSecIndex = 1;
          }
        }
        $scope.$apply();
      }

      function preparePdfGridData4IngressEgressConn(data, type) {
        if (data.length === 0)
          return [
            [
              {
                text: $translate.instant(
                  "dashboard.body.panel_title.SERVICE",
                  {},
                  "",
                  "en"
                ),
                bold: true,
              },
              {
                text: $translate.instant(
                  "dashboard.body.panel_title.CONTAINER_NAME",
                  {},
                  "",
                  "en"
                ),
                bold: true,
              },
              {
                text: $translate.instant(
                  "dashboard.body.panel_title.APPLICATIONS",
                  {},
                  "",
                  "en"
                ),
                bold: true,
              },
              {
                text: $translate.instant(
                  "dashboard.body.panel_title.POLICY_MODE",
                  {},
                  "",
                  "en"
                ),
                bold: true,
              },
              {
                text: $translate.instant(
                  "dashboard.body.panel_title.POLICY_ACTION",
                  {},
                  "",
                  "en"
                ),
                bold: true,
              },
            ],
            [
              {
                colSpan: 5,
                alignment: "center",
                text: `No ${type} connection existing`,
              },
              {},
              {},
              {},
              {},
            ],
          ];

        let row = [
          [
            {
              text: $translate.instant(
                "dashboard.body.panel_title.SERVICE",
                {},
                "",
                "en"
              ),
              bold: true,
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.CONTAINER_NAME",
                {},
                "",
                "en"
              ),
              bold: true,
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.APPLICATIONS",
                {},
                "",
                "en"
              ),
              bold: true,
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.POLICY_MODE",
                {},
                "",
                "en"
              ),
              bold: true,
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.POLICY_ACTION",
                {},
                "",
                "en"
              ),
              bold: true,
            },
          ],
        ];
        data.forEach(function (service) {
          service.children.forEach(function (container, index) {
            let applications = [];
            if (container.applications) {
              applications = angular.copy(container.applications);
            }
            if (container.ports) {
              applications = applications.concat(container.ports);
            }
            if (index === 0) {
              row.push([
                { rowSpan: service.children.length, text: service.service },
                container.display_name,
                applications.join(" ,"),
                container.policy_mode,
                container.policy_action,
              ]);
            } else {
              row.push([
                "",
                container.display_name,
                applications.join(" ,"),
                container.policy_mode,
                container.policy_action,
              ]);
            }
          });
        });
        return row;
      }

      const getScore = function (value) {
        if (typeof value.message === "string") {
          return {
            error: Utils.getMessageFromItemError(value.message),
          };
        }
        let text = $translate.instant("dashboard.body.policy_evaluation.GOOD");
        if (value > LEVEL.FAIR - 1)
          text = $translate.instant("dashboard.body.policy_evaluation.FAIR");
        if (value > LEVEL.POOR - 1)
          text = $translate.instant("dashboard.body.policy_evaluation.POOR");
        return {
          value,
          text,
        };
      };

      const renderGauge = function(scoreInput, scoreOutput) {
        let targetScore1 = getScore(scoreOutput.serviceModeScoreBy100);
        $scope.targetScore1Error = typeof targetScore1.error === "string";
        if ($scope.targetScore1Error) {
          $scope.targetScore1ErrorMessage = targetScore1.error;
        } else {
          $scope.serviceConnectionRisk.score = 0;
          if (timer[0]) {
            $interval.cancel(timer[0]);
            timer[0] = null;
          }
          timer[0] = $interval(function () {
            if ($scope.serviceConnectionRisk.score === targetScore1.value) {
              $scope.serviceConnectionRisk.eval = targetScore1.text;
              $scope.score1 = {
                height: `${100 - $scope.serviceConnectionRisk.score - 5}%`,
              };
              $interval.cancel(timer[0]);
            } else {
              $scope.serviceConnectionRisk.score++;
              $scope.score1 = {
                height: `${100 - $scope.serviceConnectionRisk.score - 5}%`,
              };
            }
          }, 10);

          $scope.serviceConnectionRisk.details[0].amount =
            scoreInput.discover_groups;
          $scope.serviceConnectionRisk.details[1].amount =
            scoreInput.monitor_groups;
          $scope.serviceConnectionRisk.details[2].amount =
            scoreInput.protect_groups;
        }

        let targetScore2 = getScore(scoreOutput.exposureScoreBy100);
        $scope.targetScore2Error = typeof targetScore2.error === "string";
        if ($scope.targetScore2Error) {
          $scope.targetScore2ErrorMessage = targetScore2.error;
        } else {
          $scope.ingressEgressRisk.score = 0;
          if (timer[1]) {
            $interval.cancel(timer[1]);
            timer[1] = null;
          }
          timer[1] = $interval(function () {
            if ($scope.ingressEgressRisk.score === targetScore2.value) {
              $scope.ingressEgressRisk.eval = targetScore2.text;
              $scope.score2 = {
                height: `${100 - $scope.ingressEgressRisk.score - 5}%`,
              };
              $interval.cancel(timer[1]);
            } else {
              $scope.ingressEgressRisk.score++;
              $scope.score2 = {
                height: `${100 - $scope.ingressEgressRisk.score - 5}%`,
              };
            }
          }, 10);

          $scope.ingressEgressRisk.details[0].amount =
            scoreInput.discover_ext_eps;
          $scope.ingressEgressRisk.details[1].amount =
            scoreInput.threat_ext_eps;
          $scope.ingressEgressRisk.details[2].amount =
            scoreInput.violate_ext_eps;
        }

        let targetScore3 = getScore(scoreOutput.vulnerabilityScoreBy100);
        $scope.targetScore3Error = typeof targetScore3.error === "string";
        if ($scope.targetScore3Error) {
          $scope.targetScore3ErrorMessage = targetScore3.error;
        } else {
          $scope.vulnerabilityExploitRisk.score = 0;
          if (timer[2]) {
            $interval.cancel(timer[2]);
            timer[2] = null;
          }
          timer[2] = $interval(function () {
            if ($scope.vulnerabilityExploitRisk.score === targetScore3.value) {
              $scope.vulnerabilityExploitRisk.eval = targetScore3.text;
              $scope.score3 = {
                height: `${100 - $scope.vulnerabilityExploitRisk.score - 5}%`,
              };
              $interval.cancel(timer[2]);
            } else {
              $scope.vulnerabilityExploitRisk.score++;
              $scope.score3 = {
                height: `${100 - $scope.vulnerabilityExploitRisk.score - 5}%`,
              };
            }
          }, 10);

          $scope.vulnerabilityExploitRisk.details[0].amount = scoreInput.discover_cves;
          $scope.vulnerabilityExploitRisk.details[1].amount = scoreInput.monitor_cves;
          $scope.vulnerabilityExploitRisk.details[2].amount = scoreInput.protect_cves;
        }

        $scope.securityRiskScoreError =
          typeof scoreOutput.securityRiskScore.message === "string";
        let securityScore = null;
        if ($scope.securityRiskScoreError) {
          $scope.securityRiskScoreErrorMessage = Utils.getMessageFromItemError(
            scoreOutput.securityRiskScore.message
          );
        } else {
          securityScore = scoreOutput.securityRiskScore;

          $scope.securityScoreText = getScore(securityScore).text;
          $scope.securityScoreValue = 0;
          $scope.isGaugeReady = false;
          if (timer[3]) {
            $interval.cancel(timer[3]);
            timer[3] = null;
          }
          timer[3] = $interval(function () {
            if ($scope.securityScoreValue >= securityScore) {
              $scope.isGaugeReady = true;
              $interval.cancel(timer[3]);
            } else {
              $scope.securityScoreValue++;
            }
          }, 10);
        }

        const mainScoreHtmlNotGood =
          typeof securityScore !== "undefined"
            ? `<div class="instruction-content"><div>
            ${$translate.instant(
              "dashboard.heading.guideline.MAIN_SCORE_NOT_GOOD1"
            )}<span class="text-bold text-${
                securityScore >= LEVEL.POOR ? "danger" : "warning"
              }">${
                securityScore >= LEVEL.POOR
                  ? $translate.instant(
                      "dashboard.heading.guideline.MAIN_SCORE_POOR"
                    )
                  : $translate.instant(
                      "dashboard.heading.guideline.MAIN_SCORE_FAIR"
                    )
              }</span>${$translate.instant(
                "dashboard.heading.guideline.MAIN_SCORE_NOT_GOOD2"
              )}</div>
              <div style="width: 100%;" class="text-center policy-top-button mt-sm">
                <button class="button" ng-click="openConsole($event)">${$translate.instant("dashboard.heading.IMPROVE_SCORE")}</button>
              </div>
            </div>`
            : `<div class="instruction-content-center">
                      <div><em class="fa fa-times-circle error-signal fa-2x text-danger" aria-hidden="true"></em></div>
                      ${$translate.instant(
                        "dashboard.heading.guideline.MAIN_SCORE_ERR"
                      )}
                  </div>`;
        const mainScoreHtmlGood =
          typeof securityScore !== "undefined"
            ? `<div class="instruction-content">
            ${$translate.instant(
              "dashboard.heading.guideline.MAIN_SCORE_GOOD1"
            )}
            <span class="text-bold text-success">${$translate.instant(
              "dashboard.heading.guideline.MAIN_SCORE_GOOD2"
            )}</span>
            ${$translate.instant(
              "dashboard.heading.guideline.MAIN_SCORE_GOOD3"
            )}</div>`
            : `<div class="instruction-content-center">
                <div><em class="fa fa-times-circle error-signal fa-2x text-danger" aria-hidden="true"></em></div>
                ${$translate.instant(
                  "dashboard.heading.guideline.MAIN_SCORE_ERR"
                )}
            </div>`;
        const serviceExposure = `<div class="instruction-content">
            ${$translate.instant(
              "dashboard.heading.guideline.SERVICE_EXPOSURE"
            )}
           </div>`;
        const ingressEgress = `<div class="instruction-content">
            ${$translate.instant("dashboard.heading.guideline.INGRESS_EGRESS")}
           </div>`;
        const vulExploit = `<div class="instruction-content">
            ${$translate.instant("dashboard.heading.guideline.VUL_EXPLOIT")}
           </div>`;

        $scope.securityGuideline.slides = [
          {
            title: $translate.instant(
              "dashboard.heading.guideline.titles.SERVICE_EXPOSURE"
            ),
            description: serviceExposure,
          },
          {
            title: $translate.instant(
              "dashboard.heading.guideline.titles.INGRESS_EGRESS"
            ),
            description: ingressEgress,
          },
          {
            title: $translate.instant(
              "dashboard.heading.guideline.titles.VUL_EXPLOIT"
            ),
            description: vulExploit,
          },
        ];
        if (securityScore < LEVEL.FAIR) {
          $scope.securityGuideline.slides.unshift({
            title: $translate.instant(
              "dashboard.heading.guideline.titles.MAIN_SCORE_GOOD"
            ),
            description: mainScoreHtmlGood,
          });
        } else {
          $scope.securityGuideline.slides.unshift({
            title: $translate.instant(
              "dashboard.heading.guideline.titles.MAIN_SCORE_NOT_GOOD"
            ),
            description: mainScoreHtmlNotGood,
          });
        }
        $timeout(function () {
          angular
            .element(`.carousel-indicators li:nth-child(4)`)
            .triggerHandler("click");
        }, 500);

        let gaugeThresholds = {
          "0": {
            color: "green",
          },
        };
        gaugeThresholds[LEVEL.FAIR] = {
          color: "orange",
        };
        gaugeThresholds[LEVEL.POOR] = {
          color: "red",
        };
        $scope.serviceConnectionRisk.thresholds = gaugeThresholds;
        $scope.ingressEgressRisk.thresholds = gaugeThresholds;
        $scope.vulnerabilityExploitRisk.thresholds = gaugeThresholds;
        $scope.securityRiskThresholds = gaugeThresholds;
      }

      $scope.hoverHeading = function (index) {
        $timeout(function () {
          angular
            .element(`.carousel-indicators li:nth-child(${index})`)
            .triggerHandler("click");
        });
      };

      ImproveScoreFactory.isDashboardRespondingNormal = [];

      const getDashboardNotifications = function () {
        self.onmessage = (event) => {
          let baseUrl = event.srcElement.origin;
          let inputObj = JSON.parse(event.data);
          console.log("inputObj.isSUSESSO: ", inputObj.isSUSESSO);
          if (inputObj.isSUSESSO) {
            baseUrl = `${inputObj.currUrl.split(inputObj.neuvectorProxy)[0]}${inputObj.neuvectorProxy}`;
            console.log("Rewritten base url:", baseUrl);
          }
          let apiUrl = `${baseUrl}/${inputObj.apiUrl}`;
          console.log("Notification API Url:", apiUrl);
          let domain = inputObj.domain;
          let query = domain ? `?domain=${encodeURIComponent(domain)}` : "";
          let xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
              if (this.status == 200) {
                self.postMessage(JSON.parse(xhttp.responseText));
              } else {
                self.postMessage({error: {status: this.status, data: this.responseText}});
              }
            }
          };
          xhttp.open("GET", apiUrl + query, true);
          xhttp.setRequestHeader("token", inputObj.token);
          xhttp.setRequestHeader("Content-Type", "application/json");
          xhttp.setRequestHeader("Cache-Control", "no-cache");
          xhttp.setRequestHeader("Pragma", "no-cache");
          xhttp.send();
        };
      };

      const getDashboardDetails = function () {
        self.onmessage = (event) => {
          let baseUrl = event.srcElement.origin;
          let inputObj = JSON.parse(event.data);
          if (inputObj.isSUSESSO) {
            baseUrl = `${inputObj.currUrl.split(inputObj.neuvectorProxy)[0]}${inputObj.neuvectorProxy}`;
          }
          let apiUrl = `${baseUrl}/${inputObj.apiUrl}`;
          let isGlobalUser = inputObj.isGlobalUser;
          let query = isGlobalUser ? `?isGlobalUser=${isGlobalUser.toString()}` : "?isGlobalUser=false";
          let xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
              if (this.status == 200) {
                self.postMessage(JSON.parse(xhttp.responseText));
              } else {
                self.postMessage({error: {status: this.status, data: this.responseText}});
              }
            }
          };
          xhttp.open("GET", apiUrl + query, true);
          xhttp.setRequestHeader("token", inputObj.token);
          xhttp.setRequestHeader("Content-Type", "application/json");
          xhttp.setRequestHeader("Cache-Control", "no-cache");
          xhttp.setRequestHeader("Pragma", "no-cache");
          xhttp.send();
        };
      };

      const getExposureDetails = function () {
        self.onmessage = (event) => {
          let baseUrl = event.srcElement.origin;
          let inputObj = JSON.parse(event.data);
          if (inputObj.isSUSESSO) {
            baseUrl = `${inputObj.currUrl.split(inputObj.neuvectorProxy)[0]}${inputObj.neuvectorProxy}`;
          }
          let apiUrl = `${baseUrl}/${inputObj.apiUrl}`;
          let isGlobalUser = inputObj.isGlobalUser;
          let exposures = inputObj.exposures;
          let exposureList = [];
          let accExposureCnt = 0;

          const getConversationHistory = function(query, total, type) {
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
              if (this.readyState == 4) {
                if (this.status == 200) {
                  exposureList.push(Object.assign({
                    type: type
                  }, JSON.parse(xhttp.responseText).conversation));
                  if (accExposureCnt === total - 1) {
                    self.postMessage(exposureList);
                  }
                } else {
                  self.postMessage({error: {status: this.status, data: this.responseText}});
                }
                accExposureCnt++;
              }
            };
            xhttp.open("GET", apiUrl + query, true);
            xhttp.setRequestHeader("token", inputObj.token);
            xhttp.setRequestHeader("Content-Type", "application/json");
            xhttp.setRequestHeader("Cache-Control", "no-cache");
            xhttp.setRequestHeader("Pragma", "no-cache");
            xhttp.send();
          };

          exposures.ingress.forEach(ingress => {
            let query = `?from=external&to=${ingress.id}`;
            getConversationHistory(query, exposures.ingress.length + exposures.egress.length, "ingress");
          });

          exposures.egress.forEach(egress => {
            let query = `?from=${egress.id}&to=external`;
            getConversationHistory(query, exposures.ingress.length + exposures.egress.length, "egress");
          });
        };
      };

      const initialWebWorker1 = function() {
        if ($scope.worker) {
          $scope.worker.terminate();
        }
        $scope.worker = run(getDashboardNotifications, "getDashboardNotifications");
      };

      const initialWebWorker2 = function(scoreInfo) {
        if ($scope.worker2) {
          $scope.worker2.terminate();
        }
        $scope.worker2 = run(getDashboardDetails, "getDashboardDetails", scoreInfo);
      };

      const initialWebWorker3 = function(scoreInfo) {
        if ($scope.worker3) {
          $scope.worker3.terminate();
        }
        $scope.worker3 = run(getExposureDetails, "getExposureDetails", scoreInfo);
      };

      const talkWithWebWorker = function() {
        if ($scope.worker) {
          $scope.worker.postMessage(
            JSON.stringify({
              apiUrl: DASHBOARD_NOTIFICATIONS_URL,
              token: $scope.user.token.token,
              currUrl: window.location.href,
              isSUSESSO: isSUSESSO ? isSUSESSO : "",
              neuvectorProxy: PROXY_VALUE
            })
          );
          $scope.worker.onmessage = (event) => {
            console.log(event.data);
            if (event.data.error) {
              $scope.securityEventError = true;
              $scope.isSecEventReady = true;
              $scope.securityEventErrorMessage = Utils.getErrorMessage(event.data.error);
            } else {
              let criticalSecurityEvent = event.data.criticalSecurityEvents;
              criticalSecurityEventsCombinedPreprocess(criticalSecurityEvent);
              renderCriticalSecurityEnvetsCombinedLineChart(criticalSecurityEvent.summary);
              renderTopSecurityEventsBarChart(criticalSecurityEvent.top_security_events);
              $scope.isSecEventReady = true;
              $scope.securityEventError = false;
              $scope.$apply();
            }
          };
        }
      };

      const renderScoreData = function(scoreInfo) {
        $scope.score = {
          input: scoreInfo.header_data,
          output: scoreInfo.score,
        };

        realtimeScoreBackup = angular.copy($scope.score);
        ImproveScoreFactory.realtimeScore = angular.copy($scope.score);
        ImproveScoreFactory.isDashboardRespondingNormal[0] = true;
        renderGauge($scope.score.input, $scope.score.output);
      };

      const talkWithWebWorker2 = function(scoreData) {
        if ($scope.worker2) {
          $scope.worker2.postMessage(
            JSON.stringify({
              apiUrl: DASHBOARD_DETAILS_URL,
              token: $scope.user.token.token,
              isGlobalUser: $scope.isGlobalUser,
              currUrl: window.location.href,
              isSUSESSO: isSUSESSO ? isSUSESSO : "",
              neuvectorProxy: PROXY_VALUE
            })
          );
          $scope.worker2.onmessage = (event) => {
            console.log("Dashboard details: ", event.data);
            if (event.data.error) {
              $scope.dashboardErr = true;
              $scope.dashboardErrMSG = Utils.getErrorMessage(event.data.error);
              $scope.isDashboardDetailsReady = true;
            } else {
              getDomains();
              getDashboardData(event);
              $scope.isDashboardDetailsReady = true;
              $scope.$apply();
            }
          };
        }
      };

      const talkWithWebWorker3 = function(scoreData) {
        if ($scope.worker3) {
          $scope.isExposureReportReady =  false;
          $scope.isExposureReportErr =  false;
          $scope.worker3.postMessage(
            JSON.stringify({
              exposures: {
                ingress: scoreData.ingress,
                egress: scoreData.egress
              },
              apiUrl: CONVERSATION_HISTORY_URL,
              currUrl: window.location.href,
              token: $scope.user.token.token,
              isGlobalUser: $scope.isGlobalUser,
              isSUSESSO: isSUSESSO ? isSUSESSO : "",
              neuvectorProxy: PROXY_VALUE
            })
          );
          $scope.worker3.onmessage = (event) => {
            console.log("Exposure details: ", event.data);
            $scope.isExposureReportReady =  true;
            if (event.data.error) {
              $scope.isExposureReportErr =  true;
            } else {
              $scope.exposureList = event.data;
            }
          };
        }
      };

      $scope.downloadExpousreReport = function() {
        let exposureList = [];
        $scope.exposureList.forEach(exposure => {
          let entryList = exposure.entries.map((entry, index) => {
            let _entry = {};
            if (index === 0) {
              _entry = Object.assign({
                direction: exposure.type,
                node: exposure.type === "ingress" ? exposure.to.host_name : exposure.from.host_name,
                namespace: exposure.type === "ingress" ? exposure.to.domain : exposure.from.domain,
                image: exposure.type === "ingress" ? exposure.to.image : exposure.from.image,
                service: exposure.type === "ingress" ? exposure.to.service : exposure.from.service,
                pod: exposure.type === "ingress" ? exposure.to.display_name : exposure.from.display_name,
                applications: exposure.applications.concat(exposure.ports).join(";"),
                policy_mode: exposure.type === "ingress" ? exposure.to.policy_mode : exposure.from.policy_mode,
                action: exposure.policy_action,
                entry_count: exposure.entries.length
              }, _entry);
            } else {
              _entry = Object.assign({
                direction: "",
                node: "",
                namespace: "",
                image: "",
                service: "",
                pod: "",
                applications: "",
                policy_mode: "",
                action: "",
                entry_count: ""
              }, _entry);
            }
            _entry = Object.assign(_entry, {
              entry_ip: exposure.type === "ingress" ? entry.client_ip : entry.server_ip,
              entry_application: entry.application,
              entry_port: entry.port,
              entry_bytes: entry.bytes,
              entry_sessions: entry.sessions,
              entry_action: entry.policy_action
            });
            exposureList.push(_entry);
          });
        });
        console.log("exposureList: ",exposureList);
        let csv = Utils.arrayToCsv(exposureList);
        let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        let filename = `exposure_report_${Utils.parseDatetimeStr(new Date())}.csv`;
        FileSaver.saveAs(blob, filename);
      };

      const getScoreInfo = function(is4Pdf, options) {
        $scope.dashboardErr = false;
        ImproveScoreFactory.isDashboardRespondingNormal[0] = false;
        $http
        .get(DASHBOARD_SCORES_URL, {params: {isGlobalUser: $scope.isGlobalUser, totalRunningPods: $scope.podCnt, domain: options ? options.domain : null}})
        .then((response) => {
          console.log("Score: ", response.data);
          if (is4Pdf) {
            getDashboardDetailsBySync4Pdf(response.data, options);
          } else {
            renderScoreData(response.data);
            $scope.exposedConversations = prepareExposureData(response.data);
            renderContainersSecurityBarChart($scope.exposedConversations);
            renderServicePolicyModePieChart(response.data.header_data);
            initialWebWorker2(response.data);
            talkWithWebWorker2(response.data);
            initialWebWorker3(response.data);
            talkWithWebWorker3(response.data);
          }
        })
        .catch((err) => {
          $scope.dashboardErr = true;
          $scope.dashboardErrMSG = Utils.getErrorMessage(err);
        });
      };

      $scope.downloadPdfByDomain = function (domain, $index) {
        if (domain === "all") {
          $scope.namespaceName = {
            text: $translate.instant("dashboard.ALL_NAMESPACE"),
            value: "all",
          };
          $scope.isPdfPreparing4AllNamespace = true;
          $scope.isPdfPreparing4Namespaces = true;
        } else if (domain === "no-namespace") {
          /*Do nothing*/
        } else {
          $scope.namespaceName = {
            text: domain,
            value: domain,
          };
          $scope.isPdfPreparing4Namespace[$index] = true;
          $scope.isPdfPreparing4Namespaces = true;
        }

        $scope.isPdfPreparing = true;
        let _domain =
          domain === "all" || domain === "no-namespace" ? "" : domain;
        $scope.dashboardErr = false;
        ImproveScoreFactory.isDashboardRespondingNormal[0] = false;
        const success = function (response, scoreData) {
          let startTime = new Date();
          console.log(startTime);
          //criticalSecurityEvent
          ImproveScoreFactory.isDashboardRespondingNormal[0] = true;
          let highPriorityVulnerabilities =
            response.data.highPriorityVulnerabilities;
          renderTopVulnerabileContainersBarChart4Pdf(
            highPriorityVulnerabilities.containers
          );

          renderTopVulnerabileNodesBarChart4Pdf(
            highPriorityVulnerabilities.nodes
          );

          renderServicePolicyModePieChart4Pdf(
            response.data.services,
            response.data.policyCoverage
          );

          renderContainerModePieChart4Pdf(response.data.containers);

          renderPolicyApps2BarChart4Pdf(response.data.applications2);

          $scope.exposedConversations = prepareExposureData(scoreData);

          renderContainersSecurityBarChart4Pdf(
            $scope.exposedConversations
          );

          let endTime = new Date();
          console.log(endTime);
          console.log("Dashboard rendering time: ", endTime - startTime);
          getDashboardNotificationsBySync4Pdf(domain, $index);
        };
        const error = function (err) {
          console.warn(err);
          $scope.dashboardErrMSG = Utils.getErrorMessage(err);
          $scope.dashboardErr = true;
          ImproveScoreFactory.realtimeScore = realtimeScoreBackup;
        };
        getScoreInfo(true, {domain: _domain, successFn: success, errorFn: error});
        // getDashboardDetailsBySync4Pdf
        // $http
        //   .get(DASHBOARD_URL, {
        //     params: { isGlobalUser: $scope.isGlobalUser, domain: _domain },
        //   })
        //   .then(function (response) {
        //     success(response);
        //   })
        //   .catch(function (err) {
        //     error(err);
        //   });
      };

      function editSummary(summary) {
        if (summary) {
          $scope.containers.total = $scope.containersCount4Summary;
          $scope.containers.details[0].amount = summary.hosts;
          $scope.containers.details[1].amount = summary.controllers;
          $scope.containers.details[2].amount = summary.enforcers;
          $scope.hostCnt = summary.hosts;
          if (summary.cvedb_version && summary.cvedb_version.length > 0) {
            $scope.highPriorityVulnerabilities.subtitle1 = `${$translate.instant(
              "dashboard.heading.CVE_DB_VERSION"
            )}:
               ${summary.cvedb_version}`;

            $scope.highPriorityVulnerabilities.subtitle2 = `(${$filter("date")(
              summary.cvedb_create_time,
              "MMM dd, y"
            )})`;
          }
        } else {
          $scope.systemSummaryError = true;
        }
      }

      function editSummary2(summary) {
        if (summary) {
          $scope.containers.total = summary.running_pods;
          $scope.podCnt = summary.running_pods;
          $scope.containers.details[0].amount = summary.hosts;
          $scope.containers.details[1].amount = summary.controllers;
          $scope.containers.details[2].amount = summary.enforcers;
          $scope.hostCnt = summary.hosts;
          if (summary.cvedb_version && summary.cvedb_version.length > 0) {
            $scope.highPriorityVulnerabilities.subtitle1 = `${$translate.instant(
              "dashboard.heading.CVE_DB_VERSION"
            )}:
               ${summary.cvedb_version}`;

            $scope.highPriorityVulnerabilities.subtitle2 = `(${$filter("date")(
              summary.cvedb_create_time,
              "MMM dd, y"
            )})`;
          }
        } else {
          $scope.systemSummaryError = true;
        }
      }

      function getSystemSummary() {
        $scope.systemSummaryError = false;
        if ($rootScope.hasInitializedSummary) {
          $rootScope.hasInitializedSummary = false;
          editSummary2($rootScope.summary);
          getScoreInfo(false);
        } else {
          $http
            .get(DASHBOARD_SUMMARY_URL)
            .then(function (response) {
              $rootScope.summary = response.data.summary;
              editSummary2($rootScope.summary);
              getScoreInfo(false);
            })
            .catch(function (err) {
              console.warn(err);
              if (err.status !== 408 && err.status !== 401) {
                Alertify.alert(
                  Utils.getAlertifyMsg(
                    err,
                    $translate.instant("dashboard.heading.message.SUMMARY_ERR"),
                    true
                  )
                );
              }
            });
        }
      }

      function getRBACErrors() {
        DashboardFactory.setGrid();
        $scope.rbacErrorGridOptions = DashboardFactory.rbacErrorGridOptions();
        $scope.hasRBACError = false;
        $http
          .get(SYSTEM_RBAC_URL)
          .then((res) => {
            $scope.RBACErrorMap = res.data;

            let rbacErrorsRowData = [];

            for (let errorkey in $scope.RBACErrorMap) {
              let hasErrorLength = $scope.RBACErrorMap[errorkey].length;
              $scope.hasRBACError = hasErrorLength > 0 || $scope.hasRBACError;
              $scope.RBACErrorMap[errorkey].forEach((errorItem, index) => {
                rbacErrorsRowData.push({
                  "errorType": index === 0 ? errorkey : "",
                  "errorDetail": $scope.RBACErrorMap[errorkey][index]
                });
              });
            }

            if ($scope.hasRBACError) {
              $scope.rbacErrorGridOptions.api.setRowData(rbacErrorsRowData);
            }
          })
          .catch((err) => {
            console.warn(err);
          });
      }

      $scope.isGoodLevel = $scope.securityScoreValue < LEVEL.FAIR;
      $scope.openConsole = function (event) {
        Utils.keepAlive();
        $mdDialog
          .show({
            locals: {
              scoreInfo: {
                securityScoreText: $scope.securityScoreText,
                securityScoreValue: $scope.securityScoreValue,
                securityRiskThresholds: $scope.securityRiskThresholds,
                scoreInput: $scope.score.input,
                scoreOutput: $scope.score.output,
                getScore: getScore,
              },
              exposedConversations: $scope.exposedConversations,
              refreshDashboard: getSystemSummary,
              isGlobalUser: $scope.isGlobalUser
            },
            controller: ImproveScoreController,
            templateUrl: "app/views/components/improve-score-modal.html",
            controllerAs: "ImpvCtrl",
            targetEvent: event,
          })
          .then(
            function () {},
            function () {}
          );
      };

      const initHtmlInfo = function() {
        const htmlDivBegin = `
          <div class = "dashboard-html-info " >
            <i class="fa fa-lg fa-lightbulb-o help-bulb-color" aria-hidden="true"></i>
            <div class="pl-lg" >
        `;

        const htmlDivEnd = `
            </div>
          </div>
        `;

        $scope.htmlInfoExposure = `
          ${htmlDivBegin}
              <p>${$translate.instant("dashboard.help.exposure.txt1")}</p>
              <p>${$translate.instant("dashboard.help.exposure.txt2")}</p>
          ${htmlDivEnd}
          `;

        $scope.htmlInfoCriticalEvents = `
          ${htmlDivBegin}
          <p>${$translate.instant("dashboard.help.criticalEvent.txt1")}</p>
          <p>${$translate.instant("dashboard.help.criticalEvent.txt2")}</p>
          ${htmlDivEnd}
          `;

        $scope.htmlInfoTopSecurityEventsSource = `
          ${htmlDivBegin}
            <p>${$translate.instant("dashboard.help.top_security_events.txt1")}</p>
            <p>${$translate.instant("dashboard.help.top_security_events.txt2")}</p>
            <p>${$translate.instant("dashboard.help.top_security_events.txt2_1")}</p>
            <p>${$translate.instant("dashboard.help.top_security_events.txt2_2")}</p>
            <p>${$translate.instant("partner.top_security_events.txt2_3")}</p>
          ${htmlDivEnd}
          `;

        $scope.htmlInfoTopSecurityEventsDestination = `
          ${htmlDivBegin}
            <p>${$translate.instant("dashboard.help.top_security_events.txt3")}</p>
            <p>${$translate.instant("dashboard.help.top_security_events.txt4")}</p>
            <p>${$translate.instant("dashboard.help.top_security_events.txt4_1")}</p>
            <p>${$translate.instant("dashboard.help.top_security_events.txt4_2")}</p>
            <p>${$translate.instant("partner.top_security_events.txt4_3")}</p>
          ${htmlDivEnd}
          `;

        $scope.htmlInfoTopVulPod = `
          ${htmlDivBegin}
          <p>${$translate.instant("dashboard.help.top_vulnerable_pod.txt1")}</p>
          <p>${$translate.instant("dashboard.help.top_vulnerable_pod.txt2")}</p>
          ${htmlDivEnd}
          `;

        $scope.htmlInfoTopVulNode = `
          ${htmlDivBegin}
          <p>${$translate.instant("dashboard.help.top_vulnerable_node.txt1")}</p>
          <p>${$translate.instant("dashboard.help.top_vulnerable_node.txt2")}</p>
          ${htmlDivEnd}
          `;

        $scope.htmlInfoPolModePod = `
          ${htmlDivBegin}
          <p>${$translate.instant("dashboard.help.policy_mode_pod.txt1")}</p>
          <p>${$translate.instant("dashboard.help.policy_mode_pod.txt2")}</p>
          ${htmlDivEnd}
          `;

        $scope.htmlInfoApp = `
          ${htmlDivBegin}
          <p>${$translate.instant("dashboard.help.application.txt1")}</p>
          <p>${$translate.instant("dashboard.help.application.txt2")}</p>
          <p>${$translate.instant("dashboard.help.application.txt3")}</p>
          <p>${$translate.instant("dashboard.help.application.txt4")}</p>
          ${htmlDivEnd}
          `;
      };


      $scope.isDashboardDetailsReady = false;
      $scope.isSecEventReady = false;

      initialWebWorker1();
      talkWithWebWorker();

      initHtmlInfo();
      getSystemSummary();
      getRBACErrors();
    }

    $scope.$on("$destroy", function () {
      if ($scope.worker1) {
        $scope.worker1.terminate();
      }
      if ($scope.worker2) {
        $scope.worker2.terminate();
      }
      if ($scope.worker3) {
        $scope.worker3.terminate();
      }
    });
  }

  //====================================================================================================================
  //
  //Improve score modal controller
  //
  //====================================================================================================================

  ImproveScoreController.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$mdDialog",
    "$timeout",
    "ImproveScoreFactory",
    "ServiceModeFactory",
    "ExposureFactory",
    "PrivilegeFactory",
    "RunAsRootFactory",
    "AdmissionFactory",
    "VulnerabilityFactory",
    "scoreInfo",
    "exposedConversations",
    "refreshDashboard",
    "isGlobalUser",
    "Utils",
    "FileSaver"
  ];
  function ImproveScoreController(
    $rootScope,
    $scope,
    $http,
    $mdDialog,
    $timeout,
    ImproveScoreFactory,
    ServiceModeFactory,
    ExposureFactory,
    PrivilegeFactory,
    RunAsRootFactory,
    AdmissionFactory,
    VulnerabilityFactory,
    scoreInfo,
    exposedConversations,
    refreshDashboard,
    isGlobalUser,
    Utils,
    FileSaver
  ) {
    $scope.cancel = function () {
      $mdDialog.cancel();
    };

    $scope.STEP = ImproveScoreFactory.STEP;
    $scope.view = $scope.STEP[0];
    $scope.securityRiskThresholds = scoreInfo.securityRiskThresholds;
    $scope.isGlobalUser = isGlobalUser;

    ImproveScoreFactory.init(isGlobalUser, scoreInfo.scoreOutput);
    ServiceModeFactory.init();
    ExposureFactory.init();
    PrivilegeFactory.init();
    RunAsRootFactory.init();
    AdmissionFactory.init();
    VulnerabilityFactory.init();

    $scope.summary = ImproveScoreFactory.summary;
    $scope.serviceMode = ServiceModeFactory.serviceMode;
    $scope.exposure = ExposureFactory.exposure;
    $scope.privilege = PrivilegeFactory.privilege;
    $scope.runAsRoot = RunAsRootFactory.runAsRoot;
    $scope.admission = AdmissionFactory.admission;
    $scope.vulnerability = VulnerabilityFactory.vulnerability;
    $scope.openAdvice = ImproveScoreFactory.openAdvice;
    $scope.closeAdvice = ImproveScoreFactory.closeAdvice;
    $scope.toggleAdvice = ImproveScoreFactory.toggleAdvice;

    let exposureFilter = ["threat", "violation", "normal"];

    activate();
    function activate() {
      $scope.summary.currScore.text = scoreInfo.securityScoreText;
      $scope.summary.currScore.value = scoreInfo.securityScoreValue;
      $scope.progress = 0;
      $scope.selectedIndex4Exposure = {};
      $scope.improvementEffected =
        ImproveScoreFactory.isDashboardRespondingNormal;

      $scope.goTo = function (step) {
        $scope.view = $scope.STEP[step];
        switch (step) {
          case 1:
            renderServiceMode();
            break;
          case 2:
            renderExposure();
            break;
          case 3:
            renderPrivilege();
            break;
          case 4:
            renderRunAsRoot();
            break;
          case 5:
            renderAdmission();
            break;
          case 6:
            renderVulnerability();
            break;
        }
      };

      $scope.goFinish = function () {
        $scope.view = $scope.STEP[7];
        renderConclusion();
      };

      $scope.backToSummary = function (isRefreashNeeded) {
        if (isRefreashNeeded) refreshDashboard();
        $scope.view = $scope.STEP[0];
        $scope.progress = 0;
        $scope.improvementEffected =
          ImproveScoreFactory.isDashboardRespondingNormal;
        let unwatch = $scope.$watch("improvementEffected[0]", function (
          newVal,
          oldVal
        ) {
          if (newVal) {
            $scope.summary.currScore.value =
              ImproveScoreFactory.realtimeScore.output.securityRiskScore;
            $scope.summary.currScore.text = scoreInfo.getScore(
              $scope.summary.currScore.value
            ).text;
            unwatch();
          }
        });
      };

      $scope.toNext = function () {
        $scope.progress++;

        $scope.gridIngressContainer = ExposureFactory.gridIngressContainer;
        $scope.gridEgressContainer = ExposureFactory.gridEgressContainer;
        $timeout(function () {
          ExposureFactory.generateGrid(
            ExposureFactory.exposedConversations,
            exposureFilter[$scope.progress - 1],
            $scope.selectedIndex4Exposure
          );
          $scope.$apply();
        });
        $scope.clearConversation = function (workloadId) {
          ExposureFactory.clearSessions(
            exposureFilter[$scope.progress - 1],
            $scope.selectedIndex4Exposure,
            workloadId,
            "external"
          );
        };
      };

      const onSelectionChanged4Service = function() {
        if (ServiceModeFactory.gridService.api) {
          let selectedRows = ServiceModeFactory.gridService.api.getSelectedRows();
          let selectedNodes = ServiceModeFactory.gridService.api.getSelectedNodes();
          if (selectedRows.length > 0) {
            ServiceModeFactory.isMultipleSelecting = selectedRows.length > 1;
            ServiceModeFactory.hasSelectedService[0] = true;
            ServiceModeFactory.gridService.api.sizeColumnsToFit();
            ServiceModeFactory.service = angular.copy(selectedRows[0]);
            let firstSelectedNode = selectedNodes[0].rowIndex;
            ServiceModeFactory.gridService.getRowClass = function(params) {
              if (params.node.rowIndex === firstSelectedNode) {
                return "first-row-in-selection";
              } else {
                return "other-rows-in-selection";
              }
            };
            ServiceModeFactory.gridService.api.redrawRows();
            ServiceModeFactory.rules = ServiceModeFactory.service.policy_rules;
            ServiceModeFactory.forAll = selectedRows.length === ServiceModeFactory.services.length;
            if (ServiceModeFactory.service.name !== ServiceModeFactory.prevSelectedName) {
              if (ServiceModeFactory.selectedIndex === 0) {
                ServiceModeFactory.getProcessProfile(ServiceModeFactory.service.name, ServiceModeFactory.selectedIndex);
              } else if (ServiceModeFactory.selectedIndex === 1) {
                ServiceModeFactory.getFileProfile(ServiceModeFactory.service.name, ServiceModeFactory.selectedIndex);
              } else {
                ServiceModeFactory.getServiceRules(ServiceModeFactory.service.name, ServiceModeFactory.selectedIndex);
                if (ServiceModeFactory.service.kind && ServiceModeFactory.service.kind !== GROUP_KIND.CONTAINER)
                  ServiceModeFactory.selectedIndex = 1;
              }
              ServiceModeFactory.prevSelectedName = ServiceModeFactory.service.name;
            }
          }
          $scope.serviceKind = ServiceModeFactory.service.kind;
          $scope.$apply();
        }
      };

      const renderServiceMode = function () {
        $scope.serviceMode.currScore.text = scoreInfo.securityScoreText;
        $scope.serviceMode.currScore.value = scoreInfo.securityScoreValue;
        $scope.selectedIndex = 0;
        ServiceModeFactory.hasSelectedService = [true];
        ServiceModeFactory.isAllProtectMode = [false];
        ServiceModeFactory.selectedIndex = $scope.selectedIndex;
        ServiceModeFactory.currentNewServiceMode = [];
        ServiceModeFactory.isSwitchingMode = [false];

        ServiceModeFactory.constructGrids();
        $scope.gridService = ServiceModeFactory.gridService;
        $scope.gridService.onSelectionChanged = onSelectionChanged4Service;
        $scope.onFilterChanged = ServiceModeFactory.onFilterChanged;
        $scope.gridProfile = ServiceModeFactory.gridProfile;
        $scope.gridFile = ServiceModeFactory.gridFile;
        $scope.gridRules = ServiceModeFactory.gridRules;
        $scope.hasSelectedService = ServiceModeFactory.hasSelectedService;
        $scope.isAllProtectMode = ServiceModeFactory.isAllProtectMode;
        $scope.isSwitchModeAuthorized =
          ServiceModeFactory.isSwitchModeAuthorized;
        $scope.switchServiceMode = ServiceModeFactory.switchServiceMode;
        $scope.isSwitchingMode = ServiceModeFactory.isSwitchingMode;
        $scope.currentNewServiceMode = ServiceModeFactory.currentNewServiceMode;
        $scope.switchNewServiceMode = ServiceModeFactory.switchNewServiceMode;
        const getExstimateScore = function (scoreInput) {
          scoreInput.new_service_policy_mode = "Protect";
          scoreInput.protect_groups +=
            scoreInput.discover_groups +
            scoreInput.monitor_groups;
          scoreInput.monitor_groups = 0;
          scoreInput.discover_groups = 0;
          scoreInput.protect_ext_eps +=
            scoreInput.discover_ext_eps +
            scoreInput.monitor_ext_eps;
          scoreInput.monitor_ext_eps = 0;
          scoreInput.discover_ext_eps = 0;
          const success = function (response) {
            $scope.serviceMode.currScore.value =
              ImproveScoreFactory.realtimeScore.output.securityRiskScore;
            $scope.serviceMode.currScore.text = scoreInfo.getScore(
              $scope.serviceMode.currScore.value
            ).text;
            $scope.serviceMode.futureScore.value =
              response.data.securityRiskScore;
            $scope.serviceMode.futureScore.text = scoreInfo.getScore(
              $scope.serviceMode.futureScore.value
            ).text;
          };
          const error = function (error) {
            console.warn(error);
          };
          ImproveScoreFactory.calulateScoreData(
            scoreInput,
            success,
            error,
            isGlobalUser,
            scoreInput.running_pods
          );
        };

        getExstimateScore(ImproveScoreFactory.realtimeScore.input);

        $scope.refresh = function () {
          $scope.serviceErr = false;

          const success = function (services) {
            $scope.serviceGridHeight = 37 + 30 * 3;
            $scope.ruleGridHeight = 250 - $scope.serviceGridHeight;
            $scope.hasService = services.length > 0;
          };

          const error = function () {
            $scope.serviceErr = true;
            $scope.serviceGridHeight = 30 + 30 * 4;
            $scope.hasService = false;
            $scope.servicesErr = true;
          };

          ServiceModeFactory.getServicesData(success, error);
        };

        $scope.refresh();
        if ($scope.isGlobalUser) ServiceModeFactory.getConfig();
        ServiceModeFactory.refresh = $scope.refresh;

        $scope.getProcessProfile = function(serviceName, selectedIndex) {
          ServiceModeFactory.getProcessProfile(serviceName, selectedIndex);
        };
        $scope.getFileProfile = function(serviceName, selectedIndex) {
          ServiceModeFactory.getFileProfile(serviceName, selectedIndex);
        };
        $scope.getServiceRules = function(serviceName, selectedIndex) {
          ServiceModeFactory.getServiceRules(serviceName, selectedIndex);
          if (ServiceModeFactory.service.kind && ServiceModeFactory.service.kind !== GROUP_KIND.CONTAINER)
            ServiceModeFactory.selectedIndex = 1;
        };
      };

      const renderExposure = function () {
        $scope.selectedIndex4Exposure = {
          threat: 0,
          violation: 0,
          normal: 0,
        };
        $scope.exposure.currScore.text = scoreInfo.securityScoreText;
        $scope.exposure.currScore.value = scoreInfo.securityScoreValue;
        $scope.selectedIndex = 0;
        ServiceModeFactory.hasSelectedService = [true];
        ServiceModeFactory.isAllProtectMode = [false];
        ServiceModeFactory.selectedIndex = $scope.selectedIndex;
        ServiceModeFactory.currentNewServiceMode = [];
        ServiceModeFactory.isSwitchingMode = [false];

        ExposureFactory.exposedConversations = exposedConversations;

        ServiceModeFactory.constructGrids();

        $scope.gridService = ServiceModeFactory.gridService;
        $scope.gridService.onSelectionChanged = onSelectionChanged4Service;
        $scope.onFilterChanged = ServiceModeFactory.onFilterChanged;
        $scope.gridProfile = ServiceModeFactory.gridProfile;
        $scope.gridFile = ServiceModeFactory.gridFile;
        $scope.gridRules = ServiceModeFactory.gridRules;
        $scope.hasSelectedService = ServiceModeFactory.hasSelectedService;
        $scope.isAllProtectMode = ServiceModeFactory.isAllProtectMode;
        $scope.isSwitchModeAuthorized =
          ServiceModeFactory.isSwitchModeAuthorized;
        $scope.switchServiceMode = ServiceModeFactory.switchServiceMode;
        $scope.isSwitchingMode = ServiceModeFactory.isSwitchingMode;
        $scope.currentNewServiceMode = ServiceModeFactory.currentNewServiceMode;
        $scope.switchNewServiceMode = ServiceModeFactory.switchNewServiceMode;

        const getExstimateScore = function (scoreInput) {
          scoreInput.protect_ext_eps +=
            scoreInput.discover_ext_eps +
            scoreInput.monitor_ext_eps;
          scoreInput.monitor_ext_eps = 0;
          scoreInput.discover_ext_eps = 0;
          scoreInput.threat_ext_eps = 0;
          scoreInput.violation_ext_eps = 0;

          const success = function (response) {
            $scope.exposure.currScore.value =
              ImproveScoreFactory.realtimeScore.output.securityRiskScore;
            $scope.exposure.currScore.text = scoreInfo.getScore(
              $scope.exposure.currScore.value
            ).text;
            $scope.exposure.futureScore.value = response.data.securityRiskScore;
            $scope.exposure.futureScore.text = scoreInfo.getScore(
              $scope.exposure.futureScore.value
            ).text;
          };
          const error = function (error) {
            console.warn(error);
          };
          ImproveScoreFactory.calulateScoreData(
            scoreInput,
            success,
            error,
            isGlobalUser,
            scoreInput.running_pods
          );
        };

        getExstimateScore(ImproveScoreFactory.realtimeScore.input);

        $scope.refresh = function (isExposure) {
          $scope.serviceErr = false;

          const success = function (services) {
            $scope.serviceGridHeight = 37 + 30 * 3;
            $scope.ruleGridHeight = 250 - $scope.serviceGridHeight;
            $scope.hasService = services.length > 0;
          };

          const error = function () {
            $scope.serviceErr = true;
            $scope.serviceGridHeight = 30 + 30 * 4;
            $scope.hasService = false;
            $scope.servicesErr = true;
          };

          ServiceModeFactory.getServicesData(success, error, isExposure);
        };

        $scope.refresh(true);
        ServiceModeFactory.getConfig();
        ServiceModeFactory.refresh = $scope.refresh;

        $scope.getProcessProfile = ServiceModeFactory.getProcessProfile;
        $scope.getFileProfile = ServiceModeFactory.getFileProfile;
        $scope.getServiceRules = ServiceModeFactory.getServiceRules;
      };

      const renderPrivilege = function () {
        $scope.privilege.currScore.text = scoreInfo.securityScoreText;
        $scope.privilege.currScore.value = scoreInfo.securityScoreValue;
        $scope.workload = null;
        $scope.hasWorkloads = false;

        $scope.exportPrivilegeCsv = function() {
          let csv = Utils.arrayToCsv($scope.privilegedWorkloads4Csv);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          let filename = "Workloads_Privileged.csv";
          FileSaver.saveAs(blob, filename);
        };

        PrivilegeFactory.generateGrid();
        $scope.gridOptions = PrivilegeFactory.gridOptions;
        $scope.onFilterChanged = PrivilegeFactory.onFilterChanged;
        const rowClicked = function (params) {
          let node = params.node;
          node.setSelected(true);
          $scope.gridOptions.api.sizeColumnsToFit();
          $scope.workload = node.data;
          $scope.$apply();
        };
        $scope.gridOptions.onRowClicked = rowClicked;
        const getScopeMembers = function (workload, hasWorkloads, workloads4Csv) {
          $scope.workload = workload;
          $scope.hasWorkloads = hasWorkloads;
          $scope.privilegedWorkloads4Csv = workloads4Csv;
        };
        $scope.isNotEmptyObj = function (obj) {
          return obj && Object.keys(obj).length > 0;
        };

        const getExstimateScore = function (scoreInput) {
          scoreInput.privileged_wls = 0;
          const success = function (response) {
            $scope.privilege.currScore.value =
              ImproveScoreFactory.realtimeScore.output.securityRiskScore;
            $scope.privilege.currScore.text = scoreInfo.getScore(
              $scope.privilege.currScore.value
            ).text;
            $scope.privilege.futureScore.value =
              response.data.securityRiskScore;
            $scope.privilege.futureScore.text = scoreInfo.getScore(
              $scope.privilege.futureScore.value
            ).text;
          };
          const error = function (error) {
            console.warn(error);
          };
          ImproveScoreFactory.calulateScoreData(
            scoreInput,
            success,
            error,
            isGlobalUser,
            scoreInput.running_pods
          );
        };
        getExstimateScore(ImproveScoreFactory.realtimeScore.input);

        PrivilegeFactory.getContainers(getScopeMembers);
      };

      const renderRunAsRoot = function () {
        $scope.runAsRoot.currScore.text = scoreInfo.securityScoreText;
        $scope.runAsRoot.currScore.value = scoreInfo.securityScoreValue;
        $scope.workload = null;
        $scope.hasWorkloads = false;

        RunAsRootFactory.generateGrid();
        $scope.gridOptions = RunAsRootFactory.gridOptions;
        $scope.onFilterChanged = RunAsRootFactory.onFilterChanged;
        const rowClicked = function (params) {
          let node = params.node;
          node.setSelected(true);
          $scope.gridOptions.api.sizeColumnsToFit();
          $scope.workload = node.data;
          $scope.$apply();
        };
        $scope.gridOptions.onRowClicked = rowClicked;

        $scope.exportRunAsRootCsv = function() {
          let csv = Utils.arrayToCsv($scope.runAsRootWorkloads4Csv);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          let filename = "Workloads_Run_as_root.csv";
          FileSaver.saveAs(blob, filename);
        };

        const getScopeMembers = function (workload, hasWorkloads, workloads4Csv) {
          $scope.workload = workload;
          $scope.hasWorkloads = hasWorkloads;
          $scope.runAsRootWorkloads4Csv = workloads4Csv;
        };
        $scope.isNotEmptyObj = function (obj) {
          return obj && Object.keys(obj).length > 0;
        };

        const getExstimateScore = function (scoreInput) {
          scoreInput.root_wls = 0;
          const success = function (response) {
            $scope.runAsRoot.currScore.value =
              ImproveScoreFactory.realtimeScore.output.securityRiskScore;
            $scope.runAsRoot.currScore.text = scoreInfo.getScore(
              $scope.runAsRoot.currScore.value
            ).text;
            $scope.runAsRoot.futureScore.value =
              response.data.securityRiskScore;
            $scope.runAsRoot.futureScore.text = scoreInfo.getScore(
              $scope.runAsRoot.futureScore.value
            ).text;
          };
          const error = function (error) {
            console.warn(error);
          };
          ImproveScoreFactory.calulateScoreData(
            scoreInput,
            success,
            error,
            isGlobalUser,
            scoreInput.running_pods
          );
        };
        getExstimateScore(ImproveScoreFactory.realtimeScore.input);

        RunAsRootFactory.getContainers(getScopeMembers);
      };

      const renderAdmission = function () {
        $scope.admission.currScore.text = scoreInfo.securityScoreText;
        $scope.admission.currScore.value = scoreInfo.securityScoreValue;

        const getExstimateScore = function (scoreInput) {
          scoreInput.hasAdmissionRuls = true;
          const success = function (response) {
            $scope.admission.currScore.value =
              ImproveScoreFactory.realtimeScore.output.securityRiskScore;
            $scope.admission.currScore.text = scoreInfo.getScore(
              $scope.admission.currScore.value
            ).text;
            $scope.admission.futureScore.value =
              response.data.securityRiskScore;
            $scope.admission.futureScore.text = scoreInfo.getScore(
              $scope.admission.futureScore.value
            ).text;
          };
          const error = function (error) {
            console.warn(error);
          };
          ImproveScoreFactory.calulateScoreData(
            scoreInput,
            success,
            error,
            isGlobalUser,
            scoreInput.running_pods
          );
        };
        getExstimateScore(ImproveScoreFactory.realtimeScore.input);
      };

      const renderVulnerability = function () {
        $scope.vulnerability.currScore.text = scoreInfo.securityScoreText;
        $scope.vulnerability.currScore.value = scoreInfo.securityScoreValue;

        const getExstimateScore = function (scoreInput) {
          scoreInput.vulnerabilityExploitRisk.discover.highVul = 0;
          scoreInput.vulnerabilityExploitRisk.discover.mediumVul = 0;
          scoreInput.vulnerabilityExploitRisk.monitor.highVul = 0;
          scoreInput.vulnerabilityExploitRisk.monitor.mediumVul = 0;
          scoreInput.vulnerabilityExploitRisk.protect.highVul = 0;
          scoreInput.vulnerabilityExploitRisk.protect.mediumVul = 0;
          scoreInput.vulnerabilityExploitRisk.quarantined.highVul = 0;
          scoreInput.vulnerabilityExploitRisk.quarantined.mediumVul = 0;
          scoreInput.vulnerabilityExploitRisk.host.highVul = 0;
          scoreInput.vulnerabilityExploitRisk.host.mediumVul = 0;
          scoreInput.vulnerabilityExploitRisk.platform.highVul = 0;
          scoreInput.vulnerabilityExploitRisk.platform.mediumVul = 0;
          const success = function (response) {
            $scope.vulnerability.currScore.value =
              ImproveScoreFactory.realtimeScore.output.securityRiskScore;
            $scope.vulnerability.currScore.text = scoreInfo.getScore(
              $scope.vulnerability.currScore.value
            ).text;
            $scope.vulnerability.futureScore.value =
              response.data.securityRiskScore;
            $scope.vulnerability.futureScore.text = scoreInfo.getScore(
              $scope.vulnerability.futureScore.value
            ).text;
          };
          const error = function (error) {
            console.warn(error);
          };
          ImproveScoreFactory.calulateScoreData(
            scoreInput,
            success,
            error,
            isGlobalUser,
            scoreInput.running_pods
          );
        };
        getExstimateScore(ImproveScoreFactory.realtimeScore.input);
      };

      const renderConclusion = function () {
        $scope.summary.currScore.text = scoreInfo.securityScoreText;
        $scope.summary.currScore.value = scoreInfo.securityScoreValue;
        const getExstimateScore = function (scoreInput) {
          const success = function (response) {
            $scope.summary.fixedScore.value = response.data.securityRiskScore;
            $scope.summary.fixedScore.text = scoreInfo.getScore(
              $scope.summary.fixedScore.value
            ).text;
            $scope.conclusionType =
              $scope.summary.fixedScore.value > 20 ? 1 : 0;
          };
          const error = function (error) {
            console.warn(error);
          };
          ImproveScoreFactory.calulateScoreData(
            scoreInput,
            success,
            error,
            isGlobalUser,
            scoreInput.running_pods
          );
        };
        getExstimateScore(ImproveScoreFactory.realtimeScore.input);
      };
    }
  }
})();
