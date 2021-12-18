(function () {
  "use strict";

  angular
    .module("app.assets")
    .controller("ComplianceAssetController", ComplianceAssetController);

  ComplianceAssetController.$inject = [
    "$scope",
    "$filter",
    "$http",
    "$translate",
    "$window",
    "$timeout",
    "Utils",
    "FileSaver",
    "Blob",
    "$controller",
    "$state",
    "ContainerFactory",
    "NodeFactory",
    "PlatformFactory",
    "ComplianceAssetFactory",
    "$sanitize",
    "$interval",
  ];
  function ComplianceAssetController(
    $scope,
    $filter,
    $http,
    $translate,
    $window,
    $timeout,
    Utils,
    FileSaver,
    Blob,
    $controller,
    $state,
    ContainerFactory,
    NodeFactory,
    PlatformFactory,
    ComplianceAssetFactory,
    $sanitize,
    $interval
  ) {
    //=======For preloading English translation file only=====
    $translate.instant("general.VERSION", {}, "", "en");
    //=======For preloading English translation file only=====
    let filter = "";
    let timer4Filter = null;
    let timer = null;
    let timer2 = null;
    let filteredCis = [];

    $scope.matchTypes = [
      { id: "equal", name: "=" },
      {
        id: "contains",
        name: $translate.instant("admissionControl.operators.CONTAINS"),
      },
    ];

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      $scope.onAdvFilter = false;
      $scope.onContainer = false;
      $scope.entities = [];
      $scope.scores = "";
      $scope.showLegend = false;
      $scope.progress = 0;
      $scope.filteredCis = [];

      $scope.toggleLegend = () => ($scope.showLegend = !$scope.showLegend);

      $scope.labelType = (mode) => {
        if (mode) {
          if (mode === "Discover") return "label-danger";
          else return "label-success";
        } else return "label-inverse";
      };

      function initAdvFilter() {
        return {
          category: {
            docker: true,
            kubernetes: true,
            custom: true,
            image: true,
          },
          tags: {
            gdpr: false,
            hipaa: false,
            nist: false,
            pci: false,
          },
          scoredType: "all",
          profileType: "all",
          matchType: $scope.matchTypes[0],
          matchType4Ns: $scope.matchTypes[0],
          matchTypes: {
            Service: $scope.matchTypes[0],
            Image: $scope.matchTypes[0],
            Node: $scope.matchTypes[0],
            Container: $scope.matchTypes[0],
          },
          entities: ["Service", "Image", "Node", "Container"],
          entityType: "Service",
          selectedDomains: [],
          serviceName: "",
          imageName: "",
          nodeName: "",
          containerName: "",
        };
      }

      const getRegulationTitlePostfix = () => {
        const regs = Object.keys($scope.advFilter.tags).filter(
          (key) => $scope.advFilter.tags[key]
        );
        if (regs.length > 0)
          return ` - ${Object.keys($scope.advFilter.tags)
            .filter((key) => $scope.advFilter.tags[key])
            .map(_ => _.toUpperCase())
            .join(" ")}`;
        else return "";
      };
      $scope.advFilter = initAdvFilter();

      $scope.setMatchType = function (matchType) {
        $scope.advFilter.matchType = matchType;
        $scope.advFilter.matchTypes[$scope.advFilter.entityType] = matchType;
      };

      $scope.setMatchType4Ns = function(matchType) {
        $scope.advFilter.matchType4Ns = matchType;
        $scope.advFilter.matchTypes[$scope.advFilter.entityType] = matchType;
      };

      $scope.setEntity = function (entity) {
        $scope.advFilter.entityType = entity;
        $scope.advFilter.matchType = $scope.advFilter.matchTypes[entity];
      };

      $scope.namespaceFilter = function (workload) {
        if ($scope.advFilter.selectedDomains.length) {
          const container = $scope.workloadMap.get(workload.id);
          const nsNames = $scope.advFilter.selectedDomains.map(selectedDomain => selectedDomain.name);
          if (container && container.domain) {
            if ($scope.advFilter.matchType4Ns.id === "contains")
              return new RegExp(nsNames.join("|")).test(container.domain);
            else return nsNames.some((item) => container.domain === item);
          } else return false;
        } else return true;
      };

      $scope.serviceFilter = function(workload) {
        if ($scope.advFilter.serviceName) {
          const container = $scope.workloadMap.get(workload.id);
          if (container && container.service_group) {
            if ($scope.advFilter.matchTypes.Service.id === "contains")
              return new RegExp($scope.advFilter.serviceName).test(container.service_group.substring(3));
            else return $scope.advFilter.serviceName === container.service_group.substring(3);
          } else return false;
        } else return true;
      };

      $scope.workloadFilter = function(workload) {
        if ($scope.advFilter.containerName) {
          const container = $scope.workloadMap.get(workload.id);
          if (container && container.display_name) {
            if ($scope.advFilter.matchTypes.Container.id === "contains")
              return new RegExp($scope.advFilter.containerName).test(container.display_name);
            else return $scope.advFilter.containerName === container.display_name;
          } else return false;
        } else return true;
      };

      $scope.setEntityName = function () {
        $scope.entities = [];

        let symbol = (entityType) =>
          $scope.advFilter.matchTypes[entityType].id === "contains" ? "~" : "=";
        if ($scope.advFilter.serviceName)
          $scope.entities.push({
            id: "svc",
            name: `Service ${symbol("Service")} ${
              $scope.advFilter.serviceName
            }`,
          });
        if ($scope.advFilter.imageName)
          $scope.entities.push({
            id: "image",
            name: `Image ${symbol("Image")} ${$scope.advFilter.imageName}`,
          });
        if ($scope.advFilter.nodeName)
          $scope.entities.push({
            id: "node",
            name: `Node ${symbol("Node")} ${$scope.advFilter.nodeName}`,
          });
        if ($scope.advFilter.containerName)
          $scope.entities.push({
            id: "container",
            name: `Container ${symbol("Container")} ${
              $scope.advFilter.containerName
            }`,
          });
      };

      $scope.removeEntity = (entity) => {
        if (entity.id === "ns") {
          $scope.advFilter.nsName = "";
        } else if (entity.id === "svc") {
          $scope.advFilter.serviceName = "";
        } else if (entity.id === "image") {
          $scope.advFilter.imageName = "";
        } else if (entity.id === "node") {
          $scope.advFilter.nodeName = "";
        } else if (entity.id === "container") {
          $scope.advFilter.containerName = "";
        }
      };

      $scope.isAdvFilterOn = () => {
        return (
          $scope.advFilter.scoredType !== "all" ||
          $scope.advFilter.profileType !== "all" ||
          !$scope.advFilter.category.custom ||
          !$scope.advFilter.category.docker ||
          !$scope.advFilter.category.kubernetes ||
          !$scope.advFilter.category.image ||
          $scope.advFilter.tags.gdpr ||
          $scope.advFilter.tags.hipaa ||
          $scope.advFilter.tags.nist ||
          $scope.advFilter.tags.pci ||
          $scope.advFilter.selectedDomains.length > 0 ||
          $scope.advFilter.serviceName ||
          $scope.advFilter.imageName ||
          $scope.advFilter.nodeName ||
          $scope.advFilter.containerName
        );
      };

      $scope.loadTags = function(query) {
        let list = $scope.namespaces;
        return query
          ? list.filter(Utils.createFilter(query))
          : [];
      };

      function isExternalFilterPresent() {
        return $scope.isAdvFilterOn();
      }

      function checkEntity(matchType, entities, pattern, result) {
        const patterns = pattern.split(",").map(item => item.trim());
        const theEntity = entities.find((entity) => {
          if (entity && entity.display_name) {
            if (matchType === "equal")
              return patterns.some((item) => item === entity.display_name);
            else
              return new RegExp(patterns.join("|")).test(entity.display_name);
          } else {
            if (matchType === "equal")
              return patterns.some((item) => item === entity);
            else return new RegExp(patterns.join("|")).test(entity);
          }
        });
        result = result && !!theEntity;
        return result;
      }

      function doesExternalFilterPass(node) {
        if (!$scope.isAdvFilterOn()) return true;
        else {
          let result = true;
          if (
            !$scope.advFilter.category.custom ||
            !$scope.advFilter.category.docker ||
            !$scope.advFilter.category.kubernetes ||
            !$scope.advFilter.category.image
          ) {
            if (!$scope.advFilter.category.docker)
              result = result && node.data.catalog !== "docker";
            if (!$scope.advFilter.category.custom)
              result = result && node.data.catalog !== "custom";
            if (!$scope.advFilter.category.kubernetes)
              result = result && node.data.catalog !== "kubernetes";
            if (!$scope.advFilter.category.image)
              result = result && node.data.catalog !== "image";
          }
          if (
            $scope.advFilter.tags.gdpr ||
            $scope.advFilter.tags.hipaa ||
            $scope.advFilter.tags.nist ||
            $scope.advFilter.tags.pci
          ) {
            if (node.data.tags && node.data.tags.length > 0) {
              if ($scope.advFilter.tags.gdpr)
                result = result && node.data.tags.includes("GDPR");
              if ($scope.advFilter.tags.hipaa)
                result = result && node.data.tags.includes("HIPAA");
              if ($scope.advFilter.tags.nist)
                result = result && node.data.tags.includes("NIST");
              if ($scope.advFilter.tags.pci)
                result = result && node.data.tags.includes("PCI");
            } else return false;
          }
          if ($scope.advFilter.scoredType !== "all") {
            result =
              result &&
              node.data.scored.toString() === $scope.advFilter.scoredType;
          }
          if ($scope.advFilter.profileType !== "all") {
            result =
              result && node.data.profile === $scope.advFilter.profileType;
          }
          if ($scope.advFilter.containerName) {
            if (node.data.workloads.length) {
              result = checkEntity(
                $scope.advFilter.matchTypes["Container"].id,
                node.data.workloads,
                $scope.advFilter.containerName,
                result
              );
            } else return false;
          }
          if ($scope.advFilter.nodeName) {
            if (node.data.nodes.length) {
              result = checkEntity(
                $scope.advFilter.matchTypes["Node"].id,
                node.data.nodes,
                $scope.advFilter.nodeName,
                result
              );
            } else return false;
          }
          if ($scope.advFilter.imageName) {
            if (node.data.images.length) {
              result = checkEntity(
                $scope.advFilter.matchTypes["Image"].id,
                node.data.images,
                $scope.advFilter.imageName,
                result
              );
            } else return false;
          }
          if ($scope.advFilter.selectedDomains.length) {
            result = checkEntity(
              $scope.advFilter.matchType4Ns.id,
              node.data.domains,
              $scope.advFilter.selectedDomains.map(selectedDomain => selectedDomain.name).join(","),
              result
            );
          }
          if ($scope.advFilter.serviceName) {
            if (node.data.services.length) {
              result = checkEntity(
                $scope.advFilter.matchTypes["Service"].id,
                node.data.services,
                $scope.advFilter.serviceName,
                result
              );
            } else return false;
          }

          return result;
        }
      }

      $scope.showFilter = function () {
        $scope.onAdvFilter = true;
      };

      $scope.applyAdvFilter = function () {
        $scope.progress = 0;
        $scope.filteredCis = [];
        $scope.gridOptions.api.onFilterChanged();
        drawPeity();
        $scope.gridOptions.api.forEachNodeAfterFilterAndSort((node) => {
          $scope.filteredCis.push(angular.copy(node.data));
        });
        sendData2Worker($scope.filteredCis);
        if (
          $scope.advFilter.containerName ||
          $scope.advFilter.nodeName ||
          $scope.advFilter.imageName ||
          $scope.advFilter.selectedDomains.length > 0 ||
          $scope.advFilter.serviceName
        ) {
          sendServiceViewData2Worker(
            {
              workloadMap4Pdf: $scope.workloadMap4Pdf,
              hostMap4Pdf: $scope.hostMap4Pdf,
              platformMap4Pdf: $scope.platformMap4Pdf,
              imageMap4Pdf: $scope.imageMap4Pdf
            },
            $scope.filteredCis,
            true,
            $scope.advFilter
          );
        } else {
          sendServiceViewData2Worker(
            {
              workloadMap4Pdf: $scope.workloadMap4Pdf,
              hostMap4Pdf: $scope.hostMap4Pdf,
              platformMap4Pdf: $scope.platformMap4Pdf,
              imageMap4Pdf: $scope.imageMap4Pdf
            },
            $scope.filteredCis,
            false,
            $scope.advFilter
          );
        }


        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count = `${found} ${filteredCount} / ${
          $scope.complianceList.length
        } ${getEntityName($scope.complianceList.length)}`;
        $scope.onAdvFilter = false;
        $scope.clearSelection();
      };

      $scope.resetAdvFilter = function () {
        $scope.progress = 0;
        $scope.filteredCis = [];
        $scope.advFilter = initAdvFilter();
        $scope.entities = [];
        $scope.gridOptions.api.onFilterChanged();
        drawPeity();
        $scope.gridOptions.api.forEachNodeAfterFilterAndSort((node) => {
          $scope.filteredCis.push(angular.copy(node.data));
        });
        sendData2Worker($scope.filteredCis);
        sendServiceViewData2Worker(
          {
            workloadMap4Pdf: $scope.workloadMap4Pdf,
            hostMap4Pdf: $scope.hostMap4Pdf,
            platformMap4Pdf: $scope.platformMap4Pdf,
            imageMap4Pdf: $scope.imageMap4Pdf
          },
          $scope.compliance4Pdf,
          false
        );
        $scope.count = `${$scope.complianceList.length} ${getEntityName(
          $scope.complianceList.length
        )}`;
        $scope.onAdvFilter = false;
        $scope.clearSelection();
      };

      ComplianceAssetFactory.prepareGrids();
      $scope.gridOptions = ComplianceAssetFactory.getGridOptions();
      $scope.gridOptions.onSelectionChanged = onRowChanged;
      $scope.REPORT_TABLE_ROW_LIMIT = REPORT_TABLE_ROW_LIMIT;

      $scope.gridOptions.isExternalFilterPresent = isExternalFilterPresent;
      $scope.gridOptions.doesExternalFilterPass = doesExternalFilterPass;

      function drawPeity() {
        setTimeout(function () {
          $("span.pie").peity("pie");
        }, 0);
      }
      let $win = angular.element($window);
      $scope.gridOptions.onGridReady = (params) => {
        setTimeout(function () {
          params.api.sizeColumnsToFit();
          drawPeity();
        }, 500);
        $win.on("resize.#agGrid", function () {
          setTimeout(function () {
            params.api.sizeColumnsToFit();
            drawPeity();
          }, 300);
        });
      };
      $scope.gridOptions.onSortChanged = (params) => {
        drawPeity();
      };

      $scope.onHover = (points, evt) => Utils.onHover(points, evt);

      let getEntityName = function (count) {
        return Utils.getEntityName(
          count,
          $translate.instant("cis.COUNT_POSTFIX")
        );
      };

      const found = $translate.instant("enum.FOUND");

      $scope.graphHeight = $window.innerHeight - 235;

      angular.element($window).bind("resize", function () {
        $scope.graphHeight = $window.innerHeight - 235;
        $scope.$digest();
      });

      function onRowChanged() {
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.compliance = selectedRows[0];
        if ($scope.onCompliance) {
          $scope.complianceName = selectedRows[0].name;
          $scope.complianceMessage =
            selectedRows[0].message === null
              ? ""
              : selectedRows[0].message.join(", ");
          $scope.complianceGroup = selectedRows[0].group;
          $scope.complianceDescription = selectedRows[0].description;
        }
        $scope.$apply();
      }

      $scope.onFilterChanged = function (value) {
        $scope.progress = 0;
        filter = value;
        if (value.toLowerCase() === "level 1")
          $scope.gridOptions.api.setQuickFilter("level1");
        else if (value.toLowerCase() === "level 2")
          $scope.gridOptions.api.setQuickFilter("level2");
        else $scope.gridOptions.api.setQuickFilter(value);
        if(!value)
          $scope.applyAdvFilter();
        drawPeity();
        $scope.filteredCis = [];
        $scope.gridOptions.api.forEachNodeAfterFilterAndSort((node) => {
          $scope.filteredCis.push(angular.copy(node.data));
        });
        if (timer4Filter) {
          $timeout.cancel(timer4Filter);
        }
        timer4Filter = $timeout(function () {
          sendData2Worker($scope.filteredCis);
        }, 2000);
        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.complianceList.length || filteredCount === 0
            ? `${$scope.complianceList.length} ${getEntityName(
                $scope.complianceList.length
              )}`
            : `${found} ${filteredCount} / ${
                $scope.complianceList.length
              } ${getEntityName($scope.complianceList.length)}`;
      };

      $scope.clearSelection = () => {
        $scope.gridOptions.api.deselectAll();
        $scope.compliance = null;
      };

      const onCompliance = (name) => {
        $scope.gridOptions.api.forEachNode(function (node, index) {
          if (node.data.name === name) {
            node.setSelected(true);
            $scope.gridOptions.api.ensureNodeVisible(node, "middle");
            $scope.onContainer = false;
          }
        });
      };

      $scope.showWorkload = (id) => {
        ContainerFactory.getContainer(id).then((container) => {
          $scope.container = container;
          $scope.onContainer = true;
          $scope.onCompliance = false;
          $scope.onHost = false;
        });
      };

      $scope.showHost = (id) => {
        NodeFactory.getHost(id).then((host) => {
          $scope.host = host;
          $scope.onHost = true;
          $scope.onContainer = false;
          $scope.onCompliance = false;
        });
      };

      $scope.refresh = function () {
        $scope.complianceErr = false;
        $scope.onContainer = false;
        $scope.onHost = false;
        $scope.compliance = null;

        Promise.all([
          ContainerFactory.getWorkloadMap(),
          NodeFactory.getHostMap(),
          PlatformFactory.getPlatformMap(),
          ComplianceAssetFactory.getReport(),
        ])
          .then(([workloadMaps, nodeMap, platformMap, report]) => {
            $scope.complianceList = report.complianceList;
            $scope.workloadMap4Pdf = workloadMaps.workloadMap4Pdf;
            $scope.imageMap4Pdf = workloadMaps.imageMap4Pdf;
            $scope.hostMap4Pdf = nodeMap;
            $scope.platformMap4Pdf = platformMap;
            $scope.compliance4Pdf = angular.copy(report.complianceList);
            console.log("Maps4Pdf:", $scope.workloadMap4Pdf, $scope.hostMap4Pdf, $scope.platformMap4Pdf, $scope.imageMap4Pdf);
            $scope.progress2 = 0;
            sendServiceViewData2Worker(
              {
                workloadMap4Pdf: $scope.workloadMap4Pdf,
                hostMap4Pdf: $scope.hostMap4Pdf,
                platformMap4Pdf: $scope.platformMap4Pdf,
                imageMap4Pdf: $scope.imageMap4Pdf
              },
              $scope.compliance4Pdf,
              false
            );
            $scope.workloadMap = workloadMaps.workloadMap;
            $scope.complianceList = Utils.setRisks(
              $scope.complianceList,
              $scope.workloadMap
            );
            $scope.count = `${$scope.complianceList.length} ${getEntityName(
              $scope.complianceList.length
            )}`;
            if($scope.complianceList.length)
              $scope.complianceList.sort((a, b) => {
                if (a.name < b.name)
                  return -1;
                if (a.name > b.name)
                  return 1;
                return 0;
              });
            console.log("$scope.complianceList:", $scope.complianceList.filter(comp => comp.services.length>0));
            $scope.gridOptions.api.setRowData($scope.complianceList);
            $scope.gridOptions.api.sizeColumnsToFit();
            $timeout(() => {
              $scope.gridOptions.api.getRowNode(0).setSelected(true);
            }, 200);
            $scope.onFilterChanged(filter);
            $scope.gridOptions.onBodyScroll = function (params) {
              drawPeity();
            };
            drawPeity();
            const countDis = report.counts;
            $scope.sdColors = [
              "#f22d3a",
              "#ef5350",
              "#ff9800",
              "#ffb661",
              "#36A2EB",
              "#6A8E6D",
            ];
            $scope.sdData = [
              countDis.error,
              countDis.high,
              countDis.warning,
              countDis.node,
              countDis.info,
              countDis.pass,
            ];
            $scope.sdName = [
              "Error",
              "High",
              "Warning",
              "Note",
              "Info",
              "Pass",
            ];
            $scope.sdLegend = {
              maintainAspectRatio: false,
              title: {
                display: true,
                text: $translate.instant("cis.report.others.SEVERITY_DIS"),
              },
              legend: {
                display: true,
                labels: {
                  boxWidth: 12,
                },
              },
              cutoutPercentage: 60,
              elements: {
                arc: {
                  borderWidth: 0,
                },
              },
            };
            $scope.sdOverride = [{}];

            $scope.entData = [
              countDis.platform,
              countDis.image,
              countDis.node,
              countDis.container,
            ];
            $scope.entLegend = {
              maintainAspectRatio: false,
              title: {
                display: true,
                text: $translate.instant("cis.report.others.TARGET_DIS"),
              },
              legend: {
                display: true,
                labels: {
                  boxWidth: 12,
                },
              },
              cutoutPercentage: 60,
              elements: {
                arc: {
                  borderWidth: 0,
                },
              },
            };
            $scope.entOverride = [{}];

            $scope.labels = report.topCompliance.map(
              (compliance) => compliance.name
            );
            const platforms = report.topCompliance.map(
              (compliance) => compliance.platforms.length
            );
            const images = report.topCompliance.map(
              (compliance) => compliance.images.length
            );
            const nodes = report.topCompliance.map(
              (compliance) => compliance.nodes.length
            );
            const containers = report.topCompliance.map(
              (compliance) => compliance.workloads.length
            );
            $scope.series = ["Platform", "Image", "Node", "Container"];
            $scope.colors = ["#f22d3a", "#86aec2", "#4D5360", "#36A2EB"];
            $scope.options = {
              onClick: function (e) {
                const element = this.getElementAtEvent(e);
                if (element.length) {
                  onCompliance(element[0]._model.label);
                }
              },
              maintainAspectRatio: false,
              title: {
                display: true,
                text: $translate.instant(
                  "cis.report.others.TOP_IMPACTFUL_COMP"
                ),
              },
              legend: {
                display: true,
                labels: {
                  boxWidth: 12,
                },
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true,
                    },
                  },
                ],
                xAxes: [
                  {
                    barPercentage: 0.4,
                    ticks: {
                      display: false,
                    },
                  },
                ],
              },
            };
            $scope.options4Pdf = {
              maintainAspectRatio: false,
              title: {
                display: true,
                text: "Top Impactful Compliance",
              },
              legend: {
                display: true,
                labels: {
                  boxWidth: 12,
                },
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true,
                    },
                  },
                ],
                xAxes: [
                  {
                    barPercentage: 0.4,
                    ticks: {
                      display: true,
                    },
                  },
                ],
              },
            };
            $scope.data = [platforms, images, nodes, containers];

            $scope.complianceLabels = report.topWorkloadCompliance.map(
              (compliance) => compliance.name
            );
            $scope.complianceSeries = [
              $translate.instant("cis.report.others.TOP_COMP_CONTAINER"),
            ];
            $scope.complianceColors = ["#ef5350"];
            $scope.complianceOptions = {
              onClick: function (e) {
                const element = this.getElementAtEvent(e);
                if (element.length) {
                  onCompliance(element[0]._model.label);
                }
              },
              maintainAspectRatio: false,
              legend: {
                display: true,
                labels: {
                  boxWidth: 12,
                },
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true,
                    },
                  },
                ],
                xAxes: [
                  {
                    barPercentage: 0.4,
                    ticks: {
                      display: false,
                    },
                  },
                ],
              },
            };
            $scope.complianceOptions4Pdf = {
              maintainAspectRatio: false,
              legend: {
                display: true,
                labels: {
                  boxWidth: 12,
                },
              },
              scales: {
                yAxes: [
                  {
                    ticks: {
                      beginAtZero: true,
                    },
                  },
                ],
                xAxes: [
                  {
                    barPercentage: 0.4,
                    ticks: {
                      display: true,
                    },
                  },
                ],
              },
            };
            $scope.complianceData = [
              report.topWorkloadCompliance.map(
                (compliance) => compliance.workloads.length
              ),
            ];
          })
          .catch(function (err) {
            $scope.complianceList = [];
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(
              err
            );
            $scope.gridOptions.api.setRowData();
          });

        ComplianceAssetFactory.getDomains()
          .then(res => {
            const resourceList = ["_images", "_nodes", "_containers"];
            $scope.namespaces = res.data.domains.filter(
              (domain) => !resourceList.includes(domain.name)
            ).map(domain => domain.name);
          })
          .catch(err => {
            $scope.namespaces = [];
          });
      };

      $scope.refresh();

      $scope.exportCsv = function () {
        let compliance4Csv = [];
        const prepareEntryData = function(compliance) {
          compliance.description = `${compliance.description.replace(
            /\"/g,
            "'"
          )}`;
          compliance.platforms = compliance.platforms.reduce(
            (acc, curr) => acc + curr.display_name + " ",
            ""
          );
          compliance.images = compliance.images.reduce(
            (acc, curr) => acc + curr.display_name + " ",
            ""
          );
          compliance.nodes = compliance.nodes.reduce(
            (acc, curr) => acc + curr.display_name + " ",
            ""
          );

          if (compliance.workloads && Array.isArray(compliance.workloads)) {
            let filteredWorkload = compliance.workloads
            .filter(workload => $scope.namespaceFilter(workload));

            filteredWorkload = filteredWorkload
            .filter(workload => $scope.serviceFilter(workload));

            filteredWorkload = filteredWorkload
            .filter(workload => $scope.workloadFilter(workload));

            compliance.workloads = Array.from(filteredWorkload
            .reduce(
              (acc, curr) => acc.add(curr.display_name),
              new Set()
            )).join(" ");

            compliance.services = Array.from(filteredWorkload
            .reduce(
              (acc, curr) => acc.add(curr.service),
              new Set()
            )).join(" ");

            compliance.domains = Array.from(filteredWorkload
            .reduce(
              (acc, curr) => acc.add(curr.domain),
              new Set()
            )).join(" ");

            compliance.images = Array.from(filteredWorkload
            .reduce(
              (acc, curr) => acc.add(curr.image),
              new Set()
            )).join(" ");
            console.log("compliance.workloads: ", compliance.workloads, "compliance.services", compliance.services, "compliance.domains:", compliance.domains, "compliance.images:", compliance.images);
          }
          return compliance;
        };

        const resolveExcelCellLimit = function(entryData) {
          let maxLen = Math.max(entryData.images.length, entryData.workloads.length, entryData.services.length, entryData.domains.length);
          let maxRow4Entry = Math.ceil(maxLen / EXCEL_CELL_LIMIT);
          let row = {};
          for (let i = 0; i < maxRow4Entry; i++) {
            row = {
              name: i === 0 ? entryData.name : "",
              description: i === 0 ? entryData.description : "",
              catalog: i === 0 ? entryData.catalog : "",
              level: i === 0 ? entryData.level : "",
              message: i === 0 ? entryData.message : "",
              profile: i === 0 ? entryData.profile : "",
              remediation: i === 0 ? entryData.remediation : "",
              scored: i === 0 ? entryData.scored : "",
              tags: i === 0 ? entryData.tags : "",
              type: i === 0 ? entryData.type : "",
              platforms: i === 0 ? entryData.platforms : "",
              nodes: i === 0 ? entryData.nodes : "",
              domains: entryData.domains.length > EXCEL_CELL_LIMIT * (i + 1) ?
                entryData.domains.substring(EXCEL_CELL_LIMIT * i, EXCEL_CELL_LIMIT * (i + 1)) :
                entryData.domains.substring(EXCEL_CELL_LIMIT * i),
              services: entryData.services.length > EXCEL_CELL_LIMIT * (i + 1) ?
                entryData.services.substring(EXCEL_CELL_LIMIT * i, EXCEL_CELL_LIMIT * (i + 1)) :
                entryData.services.substring(EXCEL_CELL_LIMIT * i),
              workloads: entryData.workloads.length > EXCEL_CELL_LIMIT * (i + 1) ?
                entryData.workloads.substring(EXCEL_CELL_LIMIT * i, EXCEL_CELL_LIMIT * (i + 1)) :
                entryData.workloads.substring(EXCEL_CELL_LIMIT * i),
              images: entryData.images.length > EXCEL_CELL_LIMIT * (i + 1) ?
                entryData.images.substring(EXCEL_CELL_LIMIT * i, EXCEL_CELL_LIMIT * (i + 1)) :
                entryData.images.substring(EXCEL_CELL_LIMIT * i),
            };
          }
          return row;
        };

        if ($scope.filteredCis && $scope.filteredCis.length > 0) {
          const complianceList = $scope.filteredCis
            .forEach(compliance => {
              let entryData = prepareEntryData(angular.copy(compliance));
              compliance4Csv.push(resolveExcelCellLimit(entryData));;
            });
          let csv = Utils.arrayToCsv(compliance4Csv);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          let filename = `compliance_${Utils.parseDatetimeStr(new Date())}.csv`;
          FileSaver.saveAs(blob, filename);
        }
      };

      /*==============================================================================
      PDF(Service View) code start
      ================================================================================*/

      const _webWorkerJob2 = function() {

        const prepareData4Filtered = function(masterData, complianceList, advFilter, isAdvFilterOn) {
          let grids = [[], [], [], []];
          let workloadMap4FilteredPdf = {};
          let hostMap4FilteredPdf = {};
          let imageMap4FilteredPdf = {};
          complianceList.forEach(compliance => {
            if (
              compliance.workloads &&
              Array.isArray(compliance.workloads) &&
              compliance.workloads.length > 0 &&
              (advFilter.containerName || advFilter.serviceName || advFilter.selectedDomains.length > 0)
            ) {
              let compWorkloadInit = {
                pod_name: "",
                domain: "",
                applications: [],
                policy_mode: "",
                service_group: "",
                scanned_at: "",
                complianceCnt: 0,
                evaluation: 0,
                complianceList: []
              };
              let patterns = advFilter.containerName.split(",").map(item => item.trim()).filter(item => item.length > 0);
              let servicePatterns = advFilter.serviceName.split(",").map(item => item.trim()).filter(item => item.length > 0);
              let domainPatterns = advFilter.selectedDomains.map(item => item.name.trim()).filter(item => item.length > 0);

              compliance.workloads.forEach(workload => {
                if (
                  (
                    patterns.length > 0 &&
                    new RegExp(patterns.join("|")).test(workload.display_name) || patterns.length === 0
                  ) &&
                  (
                    servicePatterns.length > 0 &&
                    masterData.workloadMap4Pdf[workload.id] &&
                    new RegExp(servicePatterns.join("|")).test(masterData.workloadMap4Pdf[workload.id].service_group.substring(3)) || servicePatterns.length === 0
                  ) &&
                  (
                    domainPatterns.length > 0 &&
                    masterData.workloadMap4Pdf[workload.id] &&
                    new RegExp(domainPatterns.join("|")).test(masterData.workloadMap4Pdf[workload.id].domain) || domainPatterns.length === 0
                  )
                ) {
                  let compWorkload = workloadMap4FilteredPdf[workload.id];
                  if (compWorkload) {
                    compWorkload.complianceCnt++;
                    compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
                    compWorkload.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  } else {
                    compWorkload = JSON.parse(JSON.stringify(compWorkloadInit));
                    let workloadInfo = masterData.workloadMap4Pdf[workload.id];
                    compWorkload.pod_name = workload.display_name;
                    compWorkload.domain = workloadInfo.domain;
                    compWorkload.applications = workloadInfo.applications;
                    compWorkload.policy_mode = workload.policy_mode;
                    compWorkload.service_group = workloadInfo.service_group;
                    compWorkload.scanned_at = workloadInfo.scanned_at;
                    compWorkload.complianceCnt++;
                    compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
                    compWorkload.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  }
                  workloadMap4FilteredPdf[workload.id] = compWorkload;
                }
              });
            }
            if (compliance.nodes && Array.isArray(compliance.nodes) && compliance.nodes.length > 0 && advFilter.nodeName) {
              let compHostInit = {
                name: "",
                os: "",
                kernel: "",
                cpus: 0,
                memory: 0,
                containers: 0,
                policy_mode: "",
                scanned_at: "",
                complianceCnt: 0,
                evaluation: 0,
                complianceList: []
              };
              let patterns = advFilter.nodeName.split(",").map(item => item.trim());
              compliance.nodes.forEach(host => {
                if (new RegExp(patterns.join("|")).test(host.display_name)) {
                  let compHost = hostMap4FilteredPdf[host.id];
                  if (compHost) {
                    compHost.complianceCnt++;
                    compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
                    compHost.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  } else {
                    compHost = JSON.parse(JSON.stringify(compHostInit));
                    let hostInfo = masterData.hostMap4Pdf[host.id];
                    compHost.name = host.display_name;
                    compHost.os = hostInfo.os;
                    compHost.kernel = hostInfo.kernel;
                    compHost.cpus = hostInfo.cpus;
                    compHost.memory = hostInfo.memory;
                    compHost.containers = hostInfo.containers;
                    compHost.policy_mode = host.policy_mode;
                    compHost.scanned_at = host.scanned_at;
                    compHost.complianceCnt++;
                    compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
                    compHost.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  }
                  hostMap4FilteredPdf[host.id] = compHost;
                }
              });
            }
            if (compliance.images && Array.isArray(compliance.images) && compliance.images.length > 0 && advFilter.imageName) {
              let compImageInit = {
                image_name: "",
                complianceCnt: 0,
                evaluation: 0,
                complianceList: []
              };
              let patterns = advFilter.imageName.split(",").map(item => item.trim());
              compliance.images.forEach(image => {
                if (new RegExp(patterns.join("|")).test(image.display_name)) {
                  let compImage = imageMap4FilteredPdf[image.id];
                  if (compImage) {
                    compImage.complianceCnt++;
                    compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
                    compImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  } else {
                    compImage = JSON.parse(JSON.stringify(compImageInit));
                    compImage.image_name = image.display_name;
                    compImage.complianceCnt++;
                    compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
                    compImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  }
                  imageMap4FilteredPdf[image.id] = compImage;
                }
              });
            }
          });
          grids[0] = Object.values(workloadMap4FilteredPdf);
          grids[1] = Object.values(hostMap4FilteredPdf);
          grids[3] = Object.values(imageMap4FilteredPdf);
          return grids;
        };

        const mergeData4NonFiltered = function(masterData, complianceList, isAdvFilterOn) {
          let grids = [[], [], [], []]; //workloads, hosts, platforms, images
          complianceList.forEach(compliance => {
            if (compliance.workloads && Array.isArray(compliance.workloads) && compliance.workloads.length > 0) {
              compliance.workloads.forEach(workload => {
                let compWorkload = masterData.workloadMap4Pdf[workload.id];
                if (compWorkload) {
                  compWorkload.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  compWorkload.complianceCnt++;
                  compWorkload.evaluation = compWorkload.complianceCnt > 0 ? 1 : 0;
                  masterData.workloadMap4Pdf[workload.id] = compWorkload;
                }
              });
            }
            if (compliance.nodes && Array.isArray(compliance.nodes) && compliance.nodes.length > 0) {
              compliance.nodes.forEach(host => {
                let compHost = masterData.hostMap4Pdf[host.id];
                if (compHost) {
                  compHost.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  compHost.complianceCnt++;
                  compHost.evaluation = compHost.complianceCnt > 0 ? 1 : 0;
                  masterData.hostMap4Pdf[host.id] = compHost;
                }
              });
            }
            if (compliance.platforms && Array.isArray(compliance.platforms) && compliance.platforms.length > 0) {
              compliance.platforms.forEach(platform => {
                let compPlatform = masterData.platformMap4Pdf[platform.id];
                if (compPlatform) {
                  compPlatform.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  compPlatform.complianceCnt++;
                  masterData.hostMap4Pdf[platform.id] = compPlatform;
                }
              });
            }
            if (compliance.images && Array.isArray(compliance.images) && compliance.images.length > 0) {
              let otherCompImageInit = {
                image_id: "",
                image_name: "",
                complianceCnt: 0,
                evaluation: 0,
                complianceList: []
              };
              compliance.images.forEach(image => {
                let compImage = masterData.imageMap4Pdf[image.id];
                if (compImage) {
                  compImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  compImage.complianceCnt++;
                  compImage.evaluation = compImage.complianceCnt > 0 ? 1 : 0;
                  masterData.imageMap4Pdf[image.id] = compImage;
                } else {
                  let otherCompImage = JSON.parse(JSON.stringify(otherCompImageInit));
                  otherCompImage.image_id = image.id;
                  otherCompImage.image_name = image.display_name;
                  otherCompImage.complianceList.push({text: compliance.name.padEnd(12), style: compliance.level.toLowerCase()});
                  otherCompImage.complianceCnt++;
                  otherCompImage.evaluation = otherCompImage.complianceCnt > 0 ? 1 : 0;
                  masterData.imageMap4Pdf[image.id] = otherCompImage;
                }
              });
            }
          });
          grids[0] = Object.values(masterData.workloadMap4Pdf);
          grids[1] = Object.values(masterData.hostMap4Pdf);
          grids[2] = Object.values(masterData.platformMap4Pdf);
          grids[3] = Object.values(masterData.imageMap4Pdf);

          console.log("grids: ", grids);
          return grids;
        };

        const prepareDetails = function(masterData, complianceList, isFiltered, advFilter) {
          console.log("Input: ", masterData, complianceList, isFiltered, advFilter);
          if (isFiltered) {
            return prepareData4Filtered(masterData, complianceList, advFilter);
          } else {
            return mergeData4NonFiltered(masterData, complianceList);
          }
        };

        const _getLevelInfo = function (item) {
          let level = {};
          level.text = item.level;
          level.style = item.level.toLowerCase();

          return level;
        };

        const _getRowData2 = function (item, id, metadata) {
          let category = item.catalog;
          let name = item.name;
          let description = item.description;
          let level = _getLevelInfo(item);
          let scored = item.scored;
          let profile = item.profile;
          let remediation = item.remediation ? item.remediation : "N/A";
          return [
            category,
            name,
            description,
            level,
            scored,
            profile,
            remediation,
          ];
        };

        const getTitleText = function(isFiltered) {
          if (isFiltered) {
            return "Filtered Compliance Report (Assets View)";
          } else {
            return "Full Compliance Report (Assets View)";
          }
        };

        const _formatContent2 = function(docData) {
          let metadata = docData.metadata;
          let images = docData.images;
          let charts = docData.charts;

          let titleText = getTitleText(docData.data.isAdvFilterOn);

          let docDefinition = {
            info: {
              title: metadata.title,
              author: "NeuVector",
              subject: "Compliance report (Service View)",
              keywords: "compliance report service group pods container workload host node platform image"
            },
            headerData: {
              text: metadata.others.headerText,
              alignment: "center",
              italics: true,
              style: "pageHeader"
            },
            footerData: {
              line: {
                image: images.FOOTER_LINE,
                width: 650,
                height: 1,
                margin: [50, 5, 0, 10]
              },
              text: metadata.others.footerText
            },
            header: function(currentPage) {
              if (currentPage === 2 || currentPage === 3) {
                return {
                  text: metadata.others.headerText,
                  alignment: "center",
                  italics: true,
                  style: "pageHeader"
                };
              }
            },
            footer: function(currentPage) {
              if (currentPage > 1) {
                return {
                  stack: [
                    {
                      image: images.FOOTER_LINE,
                      width: 650,
                      height: 1,
                      margin: [50, 5, 0, 10]
                    },
                    {
                      text: [
                        { text: metadata.others.footerText, italics: true },
                        { text: " |   " + currentPage }
                      ],
                      alignment: "right",
                      style: "pageFooter"
                    }
                  ]
                };
              }
            },
            pageSize: "LETTER",
            pageOrientation: "landscape",
            pageMargins: [50, 50, 50, 45],
            defaultStyle: {
              fontSize: 7,
              columnGap: 10
            },
            content: [
              {
                image: images.BACKGROUND,
                width: 1000,
                absolutePosition: { x: 0, y: 300 }
              },
              {
                image: images.ABSTRACT,
                width: 450
              },
              {
                image: images[metadata.others.logoName],
                width: 400,
                absolutePosition: { x: 350, y: 180 }
              },
              {
                text: metadata.title2,
                fontSize: 34,
                color: "#777",
                bold: true,
                absolutePosition: { x: 150, y: 450 },
                pageBreak: "after"
              },
              {
                toc: {
                  title: {
                    text: titleText,
                    style: "tocTitle",
                  },
                  numberStyle: "tocNumber",
                },
                margin: [60, 35, 20, 60],
                pageBreak: "after",
              },
              {
                text: [
                  {
                    text: metadata.others.subTitleDetails,
                    style: "contentHeader",
                    tocItem: true,
                    tocStyle: {
                      fontSize: 16,
                      bold: true,
                      color: "#4863A0",
                      margin: [80, 15, 0, 60],
                    },
                  },
                  {
                    text: "    (Please refer appendix for details of compliance)",
                    color: "#4863A0",
                    fontSize: 10
                  }
                ],
              },
              {
                text: "Containers",
                color: "#4863A0",
                fontSize: 10
              },
              {
                style: "tableExample",
                table: {
                  headerRows: 1,
                  dontBreakRows: false,
                  widths: ["15%", "10%", "15%", "8%", "12%", "9%", "25%", "6%"],
                  body: [
                    [
                      { text: metadata.wlHeader.name, style: "tableHeader" },
                      { text: metadata.wlHeader.domain, style: "tableHeader" },
                      { text: metadata.wlHeader.apps, style: "tableHeader" },
                      { text: metadata.wlHeader.policyMode, style: "tableHeader" },
                      { text: metadata.wlHeader.group, style: "tableHeader" },
                      { text: metadata.header.complianceCnt, style: "tableHeader" },
                      { text: metadata.header.complianceList, style: "tableHeader" },
                      { text: metadata.wlHeader.scanned_at, style: "tableHeader" }
                    ]
                  ]
                },
                pageBreak: "after"
              },
              {
                text: [
                  {
                    text: "Hosts",
                    color: "#4863A0",
                    fontSize: 10
                  }
                ]
              },
              {
                style: "tableExample",
                table: {
                  headerRows: 1,
                  dontBreakRows: false,
                  widths: ["11%", "6%", "11%", "7%", "7%", "9%", "10%", "9%", "23%", "7%"],
                  body: [
                    [
                      { text: metadata.htHeader.name, style: "tableHeader" },
                      { text: metadata.htHeader.os, style: "tableHeader" },
                      { text: metadata.htHeader.kernel, style: "tableHeader" },
                      { text: metadata.htHeader.cpus, style: "tableHeader" },
                      { text: metadata.htHeader.memory, style: "tableHeader" },
                      { text: metadata.htHeader.containers, style: "tableHeader" },
                      { text: metadata.htHeader.policyMode, style: "tableHeader" },
                      { text: metadata.header.complianceCnt, style: "tableHeader" },
                      { text: metadata.header.complianceList, style: "tableHeader" },
                      { text: metadata.wlHeader.scanned_at, style: "tableHeader" }
                    ]
                  ]
                },
                pageBreak: "after"
              },
              {
                text: [
                  {
                    text: "Platforms",
                    color: "#4863A0",
                    fontSize: 10
                  }
                ]
              },
              {
                style: "tableExample",
                table: {
                  headerRows: 1,
                  dontBreakRows: false,
                  widths: ["10%", "10%", "10%", "10%", "60%"],
                  body: [
                    [
                      { text: metadata.pfHeader.name, style: "tableHeader" },
                      { text: metadata.pfHeader.version, style: "tableHeader" },
                      { text: metadata.pfHeader.baseOs, style: "tableHeader" },
                      { text: metadata.header.complianceCnt, style: "tableHeader" },
                      { text: metadata.header.complianceList, style: "tableHeader" }
                    ]
                  ]
                },
                pageBreak: "after"
              },
              {
                text: [
                  {
                    text: "Images",
                    color: "#4863A0",
                    fontSize: 10
                  }
                ]
              },
              {
                style: "tableExample",
                table: {
                  headerRows: 1,
                  dontBreakRows: false,
                  widths: ["20%", "10%", "70%"],
                  body: [
                    [
                      { text: metadata.mgHeader.name, style: "tableHeader" },
                      { text: metadata.header.complianceCnt, style: "tableHeader" },
                      { text: metadata.header.complianceList, style: "tableHeader" }
                    ]
                  ]
                },
                pageBreak: "after"
              },
              {
                text: [
                  {
                    text: metadata.others.appendixText2,
                    style: "contentHeader",
                    tocItem: true,
                    tocStyle: {
                      fontSize: 16,
                      bold: true,
                      color: "#4863A0",
                      margin: [80, 15, 0, 60]
                    }
                  },
                  {
                    text: `    (${metadata.others.appendixDesc2})`,
                    color: "#3090C7",
                    fontSize: 10
                  }
                ]
              },
              {
                text: "\n\n"
              },
              {
                style: "tableExample",
                table: {
                  headerRows: 1,
                  dontBreakRows: false,
                  widths: ["10%", "6%", "26%", "6%", "7%", "5%", "40%"],
                  body: [
                    [
                      { text: metadata.header.category, style: "tableHeader" },
                      { text: metadata.header.name, style: "tableHeader" },
                      { text: metadata.header.desc, style: "tableHeader" },
                      { text: metadata.header.level, style: "tableHeader" },
                      { text: metadata.header.scored, style: "tableHeader" },
                      { text: metadata.header.profile, style: "tableHeader" },
                      { text: metadata.header.remediation, style: "tableHeader" },
                    ],
                  ],
                }
              },
            ],
            styles: {
              pageHeader: {
                fontSize: 14,
                italic: true,
                bold: true,
                color: "grey",
                margin: [0, 10, 5, 5]
              },
              pageFooter: {
                fontSize: 12,
                color: "grey",
                margin: [0, 5, 55, 5]
              },
              pageFooterImage: {
                width: 750,
                height: 1,
                margin: [50, 5, 10, 10]
              },
              tocTitle: {
                fontSize: 22,
                color: "#566D7E",
                lineHeight: 2
              },
              tocNumber: {
                italics: true,
                fontSize: 15
              },
              tableHeader: {
                bold: true,
                fontSize: 10,
                alignment: "center"
              },
              contentHeader: {
                fontSize: 16,
                bold: true,
                color: "#3090C7",
                margin: [0, 10, 0, 10]
              },
              contentSubHeader: {
                fontSize: 14,
                bold: true,
                color: "black",
                margin: [0, 10, 0, 10]
              },
              content: {
                fontSize: 10,
                margin: [5, 5, 5, 5]
              },
              title: {
                bold: true,
                fontSize: 8
              },
              subTitle: {
                bold: true,
                fontSize: 7
              },
              appendixTitle: {
                fontSize: 10,
                bold: true,
                margin: [0, 2, 0, 2]
              },
              appendixText: {
                fontSize: 8,
                margin: [0, 2, 0, 2]
              },
              danger: {
                bold: true,
                color: "#dc4034",
                fontSize: 8
              },
              note: {
                bold: true,
                color: "#9aaabc",
                fontSize: 8
              },
              warn: {
                bold: true,
                color: "#ff9800",
                fontSize: 8
              },
              pass: {
                bold: true,
                color: "#64a150",
                fontSize: 8
              },
              info: {
                bold: true,
                color: "#2196f3",
                fontSize: 8
              },
              discover: {
                bold: true,
                color: "#2196f3",
                fontSize: 8
              },
              monitor: {
                bold: true,
                color: "#4e39c1",
                fontSize: 8
              },
              protect: {
                bold: true,
                color: "#64a150",
                fontSize: 8
              },
              success: {
                bold: true,
                color: "#64a150",
                fontSize: 8
              },
              error: {
                bold: true,
                color: "#e91e63",
                fontSize: 8
              }
            }
          };

          let detailGrids = prepareDetails(
            docData.data.masterData,
            docData.data.complianceList,
            docData.data.isFiltered,
            docData.data.advFilter
          );

          const _getPlatformVerssion = function(name, kubeVersion, ocVersion) {
            if (name.toLowerCase().includes(metadata.others.KUBE)) {
              if (name.toLowerCase().includes(metadata.others.OC)) {
                return ocVersion;
              } else {
                return kubeVersion;
              }
            } else {
              return "";
            }
          };

          const _getStyledComplianceList = function (complianceList) {
            return JSON.parse(
              `{"text":[${complianceList.slice(0, 160).map(compliance => {
                return JSON.stringify(compliance);
              }).join(',{"text": "     "},')}${complianceList.length > 160 ? `,{"text": "......(Total: ${complianceList.length})"}` : ""}]}`
            );
          };

          const _getRowData4Workloads = function(item) {
            let name = item.pod_name;
            let domain = item.domain;
            let apps = item.applications.join(", ");
            let policyMode = {text: item.policy_mode, style: item.policy_mode.toLowerCase()};
            let group = `${item.service_group}`;
            let cnt = item.complianceCnt;
            let complianceList = _getStyledComplianceList(item.complianceList);
            let scanned_at = item.scanned_at;

            return [name, domain, apps, policyMode, group, cnt, complianceList, scanned_at];
          };

          const _getRowData4Hosts = function(item) {
            let name = item.name;
            let os = item.os;
            let kernel = item.kernel;
            let cpus = item.cpus;
            let memory = item.memory;
            let containers = item.containers;
            let policyMode = {text: item.policy_mode, style: item.policy_mode.toLowerCase()};
            let cnt = item.complianceCnt;
            let complianceList = _getStyledComplianceList(item.complianceList);
            let scanned_at = item.scanned_at;

            return [name, os, kernel, cpus, memory, containers, policyMode, cnt, complianceList, scanned_at];
          };

          const _getRowData4Platforms = function(item) {
            let name = item.platform;
            let version = _getPlatformVerssion(item.platform, item.kube_version,item.openshift_version);
            let baseOs = item.base_os;
            let cnt = item.complianceCnt;
            let complianceList = _getStyledComplianceList(item.complianceList);

            return [name, version, baseOs, cnt, complianceList];
          };

          const _getRowData4Images = function(item) {
            let name = item.image_name;
            let cnt = item.complianceCnt;
            let complianceList = _getStyledComplianceList(item.complianceList);

            return [name, cnt, complianceList];
          };

          detailGrids[0].sort((a, b) => {
            return b.complianceCnt - a.complianceCnt;
          });

          detailGrids[1].sort((a, b) => {
            return b.complianceCnt - a.complianceCnt;
          });

          detailGrids[2].sort((a, b) => {
            return b.complianceCnt - a.complianceCnt;
          });

          detailGrids[3].sort((a, b) => {
            return b.complianceCnt - a.complianceCnt;
          });

          if (detailGrids[0].length > 0) {
            let compliantWorkloads = 0;
            for (let item of detailGrids[0]) {
              compliantWorkloads += item.evaluation === 0 ? 1 : 0;
              docDefinition.content[7].table.body.push(
                _getRowData4Workloads(item)
              );
            }
            docDefinition.content[6].text =
              `${docDefinition.content[6].text} (Compliant Workloads (No Compliance Violations): ${Math.round(compliantWorkloads / detailGrids[0].length * 100)}% (${compliantWorkloads} Workload(s)))`;
          } else {
            docDefinition.content[6] = {};
            docDefinition.content[7] = {};
          }

          if (detailGrids[1].length > 0) {
            let compliantHosts = 0;
            for (let item of detailGrids[1]) {
              compliantHosts += item.evaluation === 0 ? 1 : 0;
              docDefinition.content[9].table.body.push(
                _getRowData4Hosts(item)
              );
            }
            docDefinition.content[8].text[0].text =
              `${docDefinition.content[8].text[0].text} (Compliant Hosts (No Compliance Violations): ${Math.round(compliantHosts / detailGrids[1].length * 100)}% (${compliantHosts} Host(s)))`;
          } else {
            docDefinition.content[8] = {};
            docDefinition.content[9] = {};
          }

          if (detailGrids[2].length > 0) {
            for (let item of detailGrids[2]) {
              docDefinition.content[11].table.body.push(
                _getRowData4Platforms(item)
              );
            }
          } else {
            docDefinition.content[10] = {};
            docDefinition.content[11] = {};
          }

          if (detailGrids[3].length > 0) {
            let compliantImages = 0;
            for (let item of detailGrids[3]) {
              compliantImages += item.evaluation === 0 ? 1 : 0;
              docDefinition.content[13].table.body.push(
                _getRowData4Images(item)
              );
            }
            docDefinition.content[12].text[0].text =
              `${docDefinition.content[12].text[0].text} (Compliant Images (No Compliance Violations): ${Math.round(compliantImages / detailGrids[3].length * 100)}% (${compliantImages} Image(s)))`;
          } else {
            docDefinition.content[12] = {};
            docDefinition.content[13] = {};
          }

          let index4Appendix = 1;
          for (let item of docData.data.complianceList) {
            docDefinition.content[16].table.body.push(
              _getRowData2(item, index4Appendix, metadata)
            );
            index4Appendix++;
          }

          return docDefinition;
        };

        let dateStart = new Date();
        console.log("Worker2 is starting...", dateStart.toTimeString());
        const showProgress = (function(self) {
          return function(progress) {
            if (Math.floor(progress * 100000) % 1000 === 0) {
              self.postMessage({ progress: progress });
            }
          };
        })(self);
        self.onmessage = event => {
          let docDefinition = _formatContent2(JSON.parse(event.data));

          docDefinition.header = function(currentPage) {
            if (currentPage === 2 || currentPage === 3) {
              return docDefinition.headerData;
            }
          };

          docDefinition.footer = function(currentPage) {
            if (currentPage > 1) {
              return {
                stack: [
                  docDefinition.footerData.line,
                  {
                    text: [
                      { text: docDefinition.footerData.text, italics: true },
                      { text: " |   " + currentPage }
                    ],
                    alignment: "right",
                    style: "pageFooter"
                  }
                ]
              };
            }
          };

          const drawReportInWebWorker2 = function(docDefinition) {
            let baseURL = event.srcElement.origin;
            self.importScripts(
              baseURL + "/vendor/pdfmake/build/pdfmake.js",
              baseURL + "/vendor/pdfmake/build/vfs_fonts.js"
            );

            let report = pdfMake.createPdf(docDefinition);

            report.getBlob(
              function(blob) {
                let dateEnd = new Date();
                console.log("Worker2 is end...", dateEnd.toTimeString());
                self.postMessage({ blob: blob, progress: 1 });
                self.close();
              },
              { progressCallback: showProgress }
            );
          };
          drawReportInWebWorker2(docDefinition);
        };
        return _formatContent2;
      };

      const sendServiceViewData2Worker = function(masterData, complianceList, isFiltered, advFilter) {
        $scope.pdfBlob2 = null;
        if ($scope.worker2) {
          $scope.worker2.terminate();
          console.info("killed an existing running worker2...");
        }
        $scope.worker2 = run(_webWorkerJob2);
        if ($scope.worker2) {
          let docData = Object.assign(
            {},
            {
              data: {
                masterData: masterData,
                complianceList: complianceList,
                isFiltered: isFiltered,
                advFilter: advFilter,
                isAdvFilterOn: $scope.isAdvFilterOn()
              }
            },
            { images: imageMap }, //Picture URI code which is used in PDF
            {
              metadata: _getI18NMessages({
                filteredCount: complianceList.length,
                rangedCount: $scope.count4Pdf
              })
            }
          );
          console.log("Post message to worker2...");
          $scope.worker2.postMessage(
            JSON.stringify(docData)
          );
          $scope.worker2.onmessage = event => {
            $scope.pdfBlob2 = event.data.blob;
            $scope.progress2 = Math.floor(event.data.progress * 100);
            $scope.$apply();
          };
        } else {
          $scope.progress2 = 100;
        }
      };

      const drawReport2 = function (docDefinition) {
        let report = pdfMake.createPdf(docDefinition);

        report.getBlob(function (blob) {
          $scope.isPdfPreparing2 = false;
          FileSaver.saveAs(
            blob,
            `${$translate.instant("cis.report.TITLE2")}_${Utils.parseDatetimeStr(new Date())}.pdf`
          );
        });
      };


      $scope.downloadPdf2 = function() {
        let masterData = {
          workloadMap4Pdf: $scope.workloadMap4Pdf,
          hostMap4Pdf: $scope.hostMap4Pdf,
          platformMap4Pdf: $scope.platformMap4Pdf,
          imageMap4Pdf: $scope.imageMap4Pdf
        };
        let compliance4Pdf = $scope.filteredCis;
        let isFiltered = false;
        let filteredItems = {};
        if ($scope.advFilter.containerName || $scope.advFilter.nodeName || $scope.advFilter.imageName) {
          isFiltered = true;
        }
        $scope.isPdfPreparing2 = true;
        let docData = Object.assign(
          {},
          {
            data: {
              masterData: masterData,
              complianceList: compliance4Pdf,
              isFiltered: isFiltered,
              advFilter: $scope.advFilter,
              isAdvFilterOn: $scope.isAdvFilterOn()
            }
          },
          { images: imageMap }, //Picture URI code which is used in PDF
          {
            metadata: _getI18NMessages({
              filteredCount: compliance4Pdf.length,
              rangedCount: $scope.count4Pdf
            })
          }
        );
        if ($scope.worker2) {
          $interval.cancel(timer2);
          timer2 = $interval(function() {
            if ($scope.pdfBlob2) {
              $scope.isPdfPreparing2 = false;
              FileSaver.saveAs(
                $scope.pdfBlob2,
                `${$translate.instant("cis.report.TITLE2")}_${Utils.parseDatetimeStr(new Date())}.pdf`
              );
              $interval.cancel(timer2);
            }
          }, 1000);
        } else {
          let docDefinition = _webWorkerJob2()(docData);
          drawReport2(docDefinition);
        }
      };

      /*==============================================================================
      PDF(Compliance View) code start
      ================================================================================*/
      const getChartsForPDF = function () {
        let topImpactfulCompliance = document
          .getElementById("bar12PDF")
          .toDataURL();
        let topImpactfulComplianceOnContainers = document
          .getElementById("bar22PDF")
          .toDataURL();

        return {
          canvas: {
            topImpactfulCompliance,
            topImpactfulComplianceOnContainers,
          },
        };
      };

      $scope.downloadPdf = function () {
        $scope.isPdfPreparing = true;
        let complianceList4Pdf = $scope.complianceList.map((compliance) => {
          compliance.workloads = compliance.workloads.filter((workload) =>
            $scope.namespaceFilter(workload)
          );
          return compliance;
        });
        let docData = Object.assign(
          {},
          {
            data:
              complianceList4Pdf.length >= $scope.REPORT_TABLE_ROW_LIMIT
                ? complianceList4Pdf.slice(0, $scope.REPORT_TABLE_ROW_LIMIT)
                : complianceList4Pdf,
          },
          {
            metadata: _getI18NMessages({
              filteredCount: $scope.complianceList.length,
              rangedCount: $scope.count4Pdf,
            }),
          },
          { images: imageMap },
          { charts: getChartsForPDF() },
          { distByLevel: $scope.distByLevel },
          { distByName: $scope.distByName },
          { rowLimit: $scope.REPORT_TABLE_ROW_LIMIT }
        );
        if ($scope.worker) {
          $interval.cancel(timer);
          timer = $interval(function () {
            if ($scope.pdfBlob) {
              $scope.isPdfPreparing = false;
              console.log($scope.advFilter.tags);
              FileSaver.saveAs(
                $scope.pdfBlob,
                `${$translate.instant("cis.report.TITLE")}${getRegulationTitlePostfix()}_${Utils.parseDatetimeStr(new Date())}.pdf`
              );
              $interval.cancel(timer);
            }
          }, 1000);
        } else {
          let docDefinition = _formatContent(docData);
          drawReport(docDefinition);
        }
      };

      const prepareNamesWith3Columns = function (names, type) {
        let namesMatrix = [];
        let rowData = [];
        for (let i = 0; i < names.length; i++) {
          if (i % 3 === 0) {
            if (Math.floor(i / 3) > 0)
              namesMatrix.push({ columns: angular.copy(rowData) });
            rowData = [{ text: "" }, { text: "" }, { text: "" }];
          }
          rowData[i % 3] = {
            text: names[i].display_name,
            color: PDF_TEXT_COLOR[type.toUpperCase()],
            style: "appendixText",
          };
        }
        namesMatrix.push({ columns: angular.copy(rowData) });
        return namesMatrix;
      };

      const prepareAppendix = function (docData) {
        let appendix = [];
        console.log("docData.data: ", docData.data);
        docData.data.forEach((item) => {
          let cve = {
            text: item.name,
            style: "appendixTitle",
          };
          let image = {
            text: `${docData.metadata.data.images}: ${item.images.length}`,
            color: PDF_TEXT_COLOR.IMAGE,
            style: "appendixTitle",
          };
          let imageList = prepareNamesWith3Columns(item.images, "image");
          let container = {
            text: `${docData.metadata.data.containers}: ${item.workloads.length}`,
            color: PDF_TEXT_COLOR.CONTAINER,
            style: "appendixTitle",
          };
          let containerList = prepareNamesWith3Columns(
            item.workloads,
            "container"
          );
          let node = {
            text: `${docData.metadata.data.nodes}: ${item.nodes.length}`,
            color: PDF_TEXT_COLOR.NODE,
            style: "appendixTitle",
          };
          let nodeList = prepareNamesWith3Columns(item.nodes, "node");
          let platform = {
            text: `${docData.metadata.data.platforms}: ${item.platforms.length}`,
            color: PDF_TEXT_COLOR.PLATFORM,
            style: "appendixTitle",
          };
          let platformList = prepareNamesWith3Columns(
            item.platforms,
            "platform"
          );
          let lineBreak = {
            text: "\n\n",
          };
          appendix.push(cve);
          if (item.images.length > 0) {
            appendix.push(image);
            appendix = appendix.concat(imageList);
          }
          if (item.workloads.length > 0) {
            appendix.push(container);
            appendix = appendix.concat(containerList);
          }
          if (item.nodes.length > 0) {
            appendix.push(node);
            appendix = appendix.concat(nodeList);
          }
          if (item.platforms.length > 0) {
            appendix.push(platform);
            appendix = appendix.concat(platformList);
          }
          appendix.push(lineBreak);
        });
        console.log("appendix: ", appendix);
        return appendix;
      };

      const _formatContent = function (docData) {
        let metadata = docData.metadata;
        let images = docData.images;
        let charts = docData.charts;

        let docDefinition = {
          info: {
            title: metadata.title,
            author: "NeuVector",
            subject: "Compliance report",
            keywords: "Compliance report",
          },
          headerData: {
            text: metadata.others.headerText,
            alignment: "center",
            italics: true,
            style: "pageHeader",
          },
          footerData: {
            line: {
              image: images.FOOTER_LINE,
              width: 650,
              height: 1,
              margin: [50, 5, 0, 10],
            },
            text: metadata.others.footerText,
          },
          header: function (currentPage) {
            if (currentPage === 2 || currentPage === 3) {
              return {
                text: metadata.others.headerText,
                alignment: "center",
                italics: true,
                style: "pageHeader",
              };
            }
          },
          footer: function (currentPage) {
            if (currentPage > 1) {
              return {
                stack: [
                  {
                    image: images.FOOTER_LINE,
                    width: 650,
                    height: 1,
                    margin: [50, 5, 0, 10],
                  },
                  {
                    text: [
                      { text: metadata.others.footerText, italics: true },
                      { text: " |   " + currentPage },
                    ],
                    alignment: "right",
                    style: "pageFooter",
                  },
                ],
              };
            }
          },
          pageSize: "LETTER",
          pageOrientation: "landscape",
          pageMargins: [50, 50, 50, 45],
          defaultStyle: {
            fontSize: 7,
            columnGap: 10,
          },
          content: [
            {
              image: images.BACKGROUND,
              width: 1000,
              absolutePosition: { x: 0, y: 300 },
            },
            {
              image: images.ABSTRACT,
              width: 450,
            },
            {
              image: images[metadata.others.logoName],
              width: 400,
              absolutePosition: { x: 350, y: 180 },
            },
            {
              text: metadata.title,
              fontSize: 40,
              color: "#777",
              bold: true,
              absolutePosition: { x: 150, y: 450 },
              pageBreak: "after",
            },

            {
              toc: {
                title: {
                  text: " In this complianceList Report",
                  style: "tocTitle",
                },
                numberStyle: "tocNumber",
              },
              margin: [60, 35, 20, 60],
              pageBreak: "after",
            },

            {
              text: [
                {
                  text: metadata.others.reportSummary,
                  style: "contentHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 16,
                    bold: true,
                    color: "#4863A0",
                    margin: [80, 15, 0, 60],
                  },
                },
                {
                  text: `    ${metadata.others.summaryRange}`,
                  color: "#3090C7",
                  fontSize: 10,
                },
              ],
            },

            {
              text: metadata.others.topImpactfulcomplianceList,
              style: "contentSubHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 12,
                italic: true,
                color: "black",
                margin: [95, 10, 0, 60],
              },
            },

            {
              columns: [
                {
                  image: charts.canvas.topImpactfulCompliance,
                  width: 700,
                },
              ],
            },

            {
              text: metadata.others.topImpactfulComplianceOnContainers,
              style: "contentSubHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 12,
                italic: true,
                color: "black",
                margin: [95, 10, 0, 60],
              },
            },

            {
              columns: [
                {
                  image: charts.canvas.topImpactfulComplianceOnContainers,
                  width: 700,
                },
              ],

              pageBreak: "after",
            },

            {
              text: [
                {
                  text: metadata.others.subTitleDetails,
                  style: "contentHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 16,
                    bold: true,
                    color: "#4863A0",
                    margin: [80, 15, 0, 60],
                  },
                },
                {
                  text: `    ${metadata.others.detailsLimit}`,
                  color: "#fe6e6b",
                  fontSize: 10,
                },
              ],
            },

            {
              style: "tableExample",
              table: {
                headerRows: 1,
                dontBreakRows: true,
                widths: ["10%", "6%", "18%", "6%", "7%", "5%", "23%", "25%"],
                body: [
                  [
                    { text: metadata.header.category, style: "tableHeader" },
                    { text: metadata.header.name, style: "tableHeader" },
                    { text: metadata.header.desc, style: "tableHeader" },
                    { text: metadata.header.level, style: "tableHeader" },
                    { text: metadata.header.scored, style: "tableHeader" },
                    { text: metadata.header.profile, style: "tableHeader" },
                    { text: metadata.header.impact, style: "tableHeader" },
                    { text: metadata.header.remediation, style: "tableHeader" },
                  ],
                ],
              },
              pageBreak: "after",
            },
            {
              text: [
                {
                  text: metadata.others.appendixText,
                  style: "contentHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 16,
                    bold: true,
                    color: "#4863A0",
                    margin: [80, 15, 0, 60],
                  },
                },
                {
                  text: `    (${metadata.others.appendixDesc})`,
                  color: "#3090C7",
                  fontSize: 10,
                },
              ],
            },
            {
              text: "\n\n",
            },
          ],
          styles: {
            pageHeader: {
              fontSize: 14,
              italic: true,
              bold: true,
              color: "grey",
              margin: [0, 10, 5, 5],
            },
            pageFooter: {
              fontSize: 12,
              color: "grey",
              margin: [0, 5, 55, 5],
            },
            pageFooterImage: {
              width: 750,
              height: 1,
              margin: [50, 5, 10, 10],
            },
            tocTitle: {
              fontSize: 22,
              color: "#566D7E",
              lineHeight: 2,
            },
            tocNumber: {
              italics: true,
              fontSize: 15,
            },
            tableHeader: {
              bold: true,
              fontSize: 10,
              alignment: "center",
            },
            contentHeader: {
              fontSize: 16,
              bold: true,
              color: "#3090C7",
              margin: [0, 10, 0, 10],
            },
            contentSubHeader: {
              fontSize: 14,
              bold: true,
              color: "black",
              margin: [0, 10, 0, 10],
            },
            content: {
              fontSize: 10,
              margin: [5, 5, 5, 5],
            },
            title: {
              bold: true,
              fontSize: 8,
            },
            subTitle: {
              bold: true,
              fontSize: 7,
            },
            appendixTitle: {
              fontSize: 10,
              bold: true,
              margin: [0, 2, 0, 2],
            },
            appendixText: {
              fontSize: 8,
              margin: [0, 2, 0, 2],
            },
            error: {
              bold: true,
              color: "#dc4034",
              fontSize: 8,
            },
            high: {
              bold: true,
              color: "#ef5350",
              fontSize: 8,
            },
            warn: {
              bold: true,
              color: "#ff9800",
              fontSize: 8,
            },
            note: {
              bold: true,
              color: "#ffb661",
              fontSize: 8,
            },
            info: {
              bold: true,
              color: "#2196f3",
              fontSize: 8,
            },
            pass: {
              bold: true,
              color: "#6A8E6D",
              fontSize: 8,
            },
          },
        };

        let index = 1;

        for (let item of docData.data) {
          docDefinition.content[11].table.body.push(
            _getRowData(item, index, metadata)
          );
          index++;
        }
        docDefinition.content = docDefinition.content.concat(
          prepareAppendix(docData)
        );
        console.log(docDefinition);
        return docDefinition;
      };

      const drawReport = function (docDefinition) {
        let report = pdfMake.createPdf(docDefinition);

        report.getBlob(function (blob) {
          $scope.isPdfPreparing = false;
          FileSaver.saveAs(
            blob,
            `${$translate.instant("cis.report.TITLE")}${getRegulationTitlePostfix()}_${Utils.parseDatetimeStr(new Date())}.pdf`
          );
        });
      };

      const _getI18NMessages = function (options) {
        return {
          title: $translate.instant("cis.report.TITLE", {}, "", "en"),
          title2: $translate.instant("cis.report.TITLE2", {}, "", "en"),
          wlHeader: {
            name: $translate.instant(
              "containers.detail.NAME",
              {},
              "",
              "en"
            ),
            domain: $translate.instant(
              "audit.gridHeader.DOMAIN",
              {},
              "",
              "en"
            ),
            apps: $translate.instant(
              "containers.detail.APPLICATIONS",
              {},
              "",
              "en"
            ),
            policyMode: $translate.instant(
              "containers.detail.POLICY_MODE",
              {},
              "",
              "en"
            ),
            group: $translate.instant(
              "group.GROUP",
              {},
              "",
              "en"
            ),
            scanned_at: $translate.instant(
              "scan.gridHeader.TIME",
              {},
              "",
              "en"
            )
          },
          htHeader: {
            name: $translate.instant(
              "nodes.detail.NAME",
              {},
              "",
              "en"
            ),
            os: $translate.instant(
              "nodes.detail.OS",
              {},
              "",
              "en"
            ),
            kernel: $translate.instant(
              "nodes.detail.KERNEL_VERSION",
              {},
              "",
              "en"
            ),
            cpus: $translate.instant(
              "nodes.detail.NUM_OF_CPUS",
              {},
              "",
              "en"
            ),
            memory: $translate.instant(
              "nodes.detail.MEMORY",
              {},
              "",
              "en"
            ),
            containers: $translate.instant(
              "nodes.detail.NUM_OF_CONTAINERS",
              {},
              "",
              "en"
            ),
            policyMode: $translate.instant(
              "containers.detail.POLICY_MODE",
              {},
              "",
              "en"
            ),
            scanned_at: $translate.instant(
              "scan.gridHeader.TIME",
              {},
              "",
              "en"
            )
          },
          pfHeader: {
            name: $translate.instant(
              "nodes.detail.NAME",
              {},
              "",
              "en"
            ),
            version: $translate.instant(
              "scan.gridHeader.VERSION",
              {},
              "",
              "en"
            ),
            baseOs: $translate.instant(
              "audit.gridHeader.BASE_OS",
              {},
              "",
              "en"
            )
          },
          mgHeader: {
            name: $translate.instant(
              "nodes.detail.NAME",
              {},
              "",
              "en"
            )
          },
          header: {
            complianceCnt: $translate.instant(
              "cis.report.gridHeader.COMPLIANCE_CNT",
              {},
              "",
              "en"
            ),
            complianceList: $translate.instant(
              "cis.report.gridHeader.COMPLIANCE_LIST",
              {},
              "",
              "en"
            ),
            category: $translate.instant(
              "cis.report.gridHeader.CATEGORY",
              {},
              "",
              "en"
            ),
            name: $translate.instant(
              "cis.report.gridHeader.NAME",
              {},
              "",
              "en"
            ),
            desc: $translate.instant(
              "cis.report.gridHeader.DESC",
              {},
              "",
              "en"
            ),
            level: $translate.instant(
              "cis.report.gridHeader.LEVEL",
              {},
              "",
              "en"
            ),
            scored: $translate.instant(
              "cis.report.gridHeader.SCORED",
              {},
              "",
              "en"
            ),
            profile: $translate.instant(
              "cis.report.gridHeader.PROFILE",
              {},
              "",
              "en"
            ),
            impact: $translate.instant(
              "cis.report.gridHeader.IMPACT",
              {},
              "",
              "en"
            ),
            remediation: $translate.instant(
              "cis.report.gridHeader.REMEDIATION",
              {},
              "",
              "en"
            ),
          },
          data: {
            platforms: $translate.instant(
              "cis.report.data.PLATFORMS",
              {},
              "",
              "en"
            ),
            images: $translate.instant("cis.report.data.IMAGES", {}, "", "en"),
            nodes: $translate.instant("cis.report.data.NODES", {}, "", "en"),
            containers: $translate.instant(
              "cis.report.data.CONTAINERS",
              {},
              "",
              "en"
            ),
          },
          others: {
            topImpactfulcomplianceList: $translate.instant(
              "cis.report.others.TOP_IMPACTFUL_COMP",
              {},
              "",
              "en"
            ),
            reportSummary: $translate.instant(
              "audit.report.summaryHeader",
              {},
              "",
              "en"
            ),
            logoName: $translate.instant("partner.general.LOGO_NAME", {}, "", "en"),
            topImpactfulComplianceOnContainers: $translate.instant(
              "cis.report.others.TOP_COMP_CONTAINER",
              {},
              "",
              "en"
            ),
            footerText: $translate.instant(
              "containers.report.footer",
              {},
              "",
              "en"
            ),
            headerText: $translate.instant(
              "partner.containers.report.header",
              {},
              "",
              "en"
            ),
            appendixText: $translate.instant(
              "cis.report.others.APPENDIX",
              {},
              "",
              "en"
            ),
            appendixDesc: $translate.instant(
              "cis.report.others.APPENDIX_DESC",
              {},
              "",
              "en"
            ),
            subTitleDetails: $translate.instant(
              "cis.report.others.DETAILS",
              {},
              "",
              "en"
            ),

            appendixText2: $translate.instant(
              "cis.report.others.APPENDIX2",
              {},
              "",
              "en"
            ),
            appendixDesc2: $translate.instant(
              "cis.report.others.APPENDIX_DESC2",
              {},
              "",
              "en"
            ),
            summaryRange: $translate.instant(
              "general.PDF_SUMMARY_RANGE_2",
              {
                rangedCount: options.filteredCount,
              },
              "",
              "en"
            ),
            detailsLimit:
              options.filteredCount > $scope.REPORT_TABLE_ROW_LIMIT
                ? $translate.instant(
                    "general.PDF_TBL_ROW_LIMIT",
                    { max: $scope.REPORT_TABLE_ROW_LIMIT },
                    "",
                    "en"
                  )
                : "",
            KUBE: KUBE,
            OC: OC
          },
        };
      };

      const _getRowData = function (item, id, metadata) {
        let category = item.catalog;
        let name = item.name;
        let description = item.description;
        let level = _getLevelInfo(item);
        let scored = item.scored;
        let profile = item.profile;
        let impact = _getImpact(item, metadata);
        let remediation = item.remediation ? item.remediation : "N/A";
        return [
          category,
          name,
          description,
          level,
          scored,
          profile,
          impact,
          remediation,
        ];
      };

      const _getLevelInfo = function (item) {
        let level = {};
        level.text = item.level;
        level.style = item.level.toLowerCase();

        return level;
      };

      const _getImpact = function (item, metadata) {
        let impactList = [];
        let imageList = {};
        imageList.ul = [];
        let nodeList = {};
        nodeList.ul = [];
        let containerList = {};
        containerList.ul = [];
        if (item.images && item.images.length > 0) {
          imageList.ul = item.images.map((image) => image.display_name);
          impactList.push({ text: `${metadata.data.images}`, bold: true });
          if (imageList.ul.length > 5) {
            let omitedList = imageList.ul.slice(0, 5);
            omitedList.push(`......(${imageList.ul.length} images)`);
            impactList.push({ ul: omitedList });
          } else {
            impactList.push(imageList);
          }
        }
        if (item.nodes && item.nodes.length > 0) {
          nodeList.ul = item.nodes.map((node) => node.display_name);
          impactList.push({ text: `${metadata.data.nodes}`, bold: true });
          if (nodeList.ul.length > 5) {
            let omitedList = nodeList.ul.slice(0, 5);
            omitedList.push(`......(${nodeList.ul.length} nodes)`);
            impactList.push({ ul: omitedList });
          } else {
            impactList.push(nodeList);
          }
        }
        if (item.workloads && item.workloads.length > 0) {
          containerList.ul = item.workloads.map(
            (workload) => workload.display_name
          );
          impactList.push({ text: `${metadata.data.containers}`, bold: true });
          if (containerList.ul.length > 5) {
            let omitedList = containerList.ul.slice(0, 5);
            omitedList.push(`......(${containerList.ul.length} containers)`);
            impactList.push({ ul: omitedList });
          } else {
            impactList.push(containerList);
          }
        }
        return impactList;
      };

      function run(fn) {
        try {
          return new Worker(URL.createObjectURL(new Blob(["(" + fn + ")()"])));
        } catch (err) {
          console.log(err);
        }
      }

      const _webWorkerJob = function () {
        console.log("Worker is starting...");
        const showProgress = (function (self) {
          return function (progress) {
            if (Math.floor(progress * 100000) % 1000 === 0) {
              self.postMessage({ progress: progress });
            }
          };
        })(self);
        self.onmessage = (event) => {
          let docDefinition = JSON.parse(event.data);

          let drawReportInWebWorker = function (docDefinition) {
            docDefinition.header = function (currentPage) {
              if (currentPage === 2 || currentPage === 3) {
                return docDefinition.headerData;
              }
            };

            docDefinition.footer = function (currentPage) {
              if (currentPage > 1) {
                return {
                  stack: [
                    docDefinition.footerData.line,
                    {
                      text: [
                        { text: docDefinition.footerData.text, italics: true },
                        { text: " |   " + currentPage },
                      ],
                      alignment: "right",
                      style: "pageFooter",
                    },
                  ],
                };
              }
            };
            let baseURL = event.srcElement.origin;
            self.importScripts(
              baseURL + "/vendor/pdfmake/build/pdfmake.js",
              baseURL + "/vendor/pdfmake/build/vfs_fonts.js"
            );

            let report = pdfMake.createPdf(docDefinition);

            report.getBlob(
              function (blob) {
                console.log("Worker is end...");
                self.postMessage({ blob: blob, progress: 1 });
                self.close();
              },
              { progressCallback: showProgress }
            );
          };
          drawReportInWebWorker(docDefinition);
        };
      };

      const sendData2Worker = function (complianceList) {
        // $interval.cancel(timer);
        $scope.pdfBlob = null;
        //start - generate a pdf
        if ($scope.worker) {
          $scope.worker.terminate();
          console.info("killed an existing running worker...");
        }
        $scope.worker = run(_webWorkerJob);
        if ($scope.worker) {
          if (complianceList) {
            setTimeout(function () {
              let complianceList4Pdf = complianceList.map((compliance) => {
                compliance.workloads = compliance.workloads.filter((workload) =>
                  $scope.namespaceFilter(workload)
                );
                return compliance;
              });
              let docData = Object.assign(
                {},
                {
                  data:
                    complianceList4Pdf.length >= $scope.REPORT_TABLE_ROW_LIMIT
                      ? complianceList4Pdf.slice(
                          0,
                          $scope.REPORT_TABLE_ROW_LIMIT
                        )
                      : complianceList4Pdf,
                },
                {
                  metadata: _getI18NMessages({
                    filteredCount: complianceList.length,
                    rangedCount: $scope.count4Pdf,
                  }),
                },
                { images: imageMap },
                { charts: getChartsForPDF() },
                { distByLevel: $scope.distByLevel },
                { distByName: $scope.distByName },
                { rowLimit: $scope.REPORT_TABLE_ROW_LIMIT }
              );
              console.log("Post message to worker...");
              $scope.worker.postMessage(
                JSON.stringify(_formatContent(docData))
              );
            }, 2000);
          } else {
            console.warn("no data in audit.");
          }
          $scope.worker.onmessage = (event) => {
            $scope.pdfBlob = event.data.blob;
            $scope.progress = Math.floor(event.data.progress * 100);
            $scope.$apply();
          };
        } else {
          $scope.progress = 100;
        }
      };

      $scope.$on("$destroy", function () {
        $interval.cancel(timer);
        $interval.cancel(timer2);
        $scope.pdfBlob = null;
        $scope.pdfBlob2 = null;
        if ($scope.worker) {
          $scope.worker.terminate();
        }
        if ($scope.worker2) {
          $scope.worker2.terminate();
        }
      });

      /*==============================================================================
      PDF code end
      ================================================================================*/
    }
  }
})();
