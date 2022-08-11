(function() {
  "use strict";

  angular
    .module("app.assets")
    .controller("RegistryScanController", RegistryScanController);

  RegistryScanController.$inject = [
    "$scope",
    "$mdDialog",
    "$translate",
    "$filter",
    "$http",
    "$window",
    "$document",
    "$timeout",
    "Alertify",
    "$interval",
    "$rootScope",
    "Utils",
    "FileSaver",
    "Blob",
    "RegistryScanFactory",
    "AuthorizationFactory",
    "$controller",
    "$state"
  ];
  function RegistryScanController(
    $scope,
    $mdDialog,
    $translate,
    $filter,
    $http,
    $window,
    $document,
    $timeout,
    Alertify,
    $interval,
    $rootScope,
    Utils,
    FileSaver,
    Blob,
    RegistryScanFactory,
    AuthorizationFactory,
    $controller,
    $state
  ) {
    $scope.onDetails = false;
    $scope.registrySample = "";
    $scope.selectedRegistry = {
      name: "",
      registry: ""
    };
    let landingOnImageBrief = false;
    let registryFilter = "";
    let repoFilter = "";
    let loopCounter = 0;
    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      $scope.isWriteRegistryAuthorized = AuthorizationFactory.getDisplayFlag("registry_scan");
      RegistryScanFactory.setGrid($scope.isWriteRegistryAuthorized);

      RegistryScanFactory.registryGridOptions.getRowClass = function(params) {
        if ($scope.registry && params.data.name === $scope.registry.name) {
          return "aggrid-selected-row";
        }
      };

      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("registry.COUNT_POSTFIX")
        );
      };
      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");

      $scope.gridWidth = 100;
      $scope.onBriefView = false;
      $scope.onCVE = false;
      $scope.isScanning = false;
      let timer = null;
      let timer4TestInfo = null;

      $scope.pageY = $window.innerHeight / 2 + 11;

      $scope.gridHeight = Utils.getMasterGridHeight() - 30;
      $scope.detailViewHeight = Utils.getDetailViewHeight() - 28;
      $scope.overviewHeight = Utils.getDetailViewHeight() - 47;

      angular.element($window).bind("resize", function() {
        $scope.gridHeight = $scope.pageY - 243;
        $scope.detailViewHeight = $window.innerHeight -  $scope.pageY - 131;
        $scope.overviewHeight = $window.innerHeight -  $scope.pageY - 150;
        $scope.$digest();
      });

      const mousemove = function(event) {
        $scope.pageY = event.pageY;
        if (event.pageY >= 243 && event.pageY <= $window.innerHeight - 151) {
          $scope.gridHeight = event.pageY - 243;
          $scope.detailViewHeight = $window.innerHeight -  event.pageY - 131;
          $scope.overviewHeight = $window.innerHeight -  event.pageY - 151;
          setTimeout(function () {
            $scope.gridOptions.api.sizeColumnsToFit();
            $scope.gridOptions.api.forEachNode(function(node, index) {
              if ($scope.registry) {
                if (node.data.name === $scope.registry.name) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                }
              } else if (index === 0) {
                node.setSelected(true);
                $scope.gridOptions.api.ensureNodeVisible(node, "middle");
              }
            });
          }, 200);
        }
      };

      const mouseup = function() {
        $document.unbind('mousemove', mousemove);
        $document.unbind('mouseup', mouseup);
      };

      $scope.grabResizeBar = function(event) {
        event.preventDefault();
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      };

      function onRegistryChanged() {
        console.log("$scope.isReset: ", $scope.isReset);
        console.log("$scope.selectedNodes4Registry: ", $scope.selectedNodes4Registry);
        $scope.onBriefView = false;
        $scope.onCVE = false;
        if (angular.isDefined(timer)) {
          $interval.cancel(timer);
          timer = undefined;
        }
        let selectedRows = $scope.gridOptions.api.getSelectedRows();
        $scope.selectedNodes4Registry = $scope.gridOptions.api.getSelectedNodes();
        $scope.registry = selectedRows[0];
        if ($scope.registry && (!$scope.isReset || $scope.isReset && $scope.selectedNodes4Registry && $scope.selectedNodes4Registry[0].rowIndex > 0)) {
          $scope.selectedRegistry.registry = $scope.registry.registry;
          $scope.selectedRegistry.name = $scope.registry.name;
          $scope.isReset = false;
          getRegistrySummary($scope.registry);
          if (selectedRows[0].status === "scanning") {
            reloadSummary(selectedRows[0].name);
            $scope.isScanning = true;
          } else {
            $scope.isScanning = false;
          }
        } else {
          $scope.selectedRegistry.registry = "";
          $scope.selectedRegistry.name = "";
        }
        $scope.gridOptions.api.redrawRows();
        $timeout(function() {
          try {
            $scope.summaryGridOptions.api.sizeColumnsToFit();
          } catch (e) {}
        }, 0);
        $scope.$apply();
      }

      function onImageBriefChanged() {
        let selectedRows = $scope.briefGridOptions.api.getSelectedRows();
        $scope.image = selectedRows[0];
        $scope.onCVE = false;
        if (landingOnImageBrief) {
          if (
            $scope.image &&
            $scope.registry &&
            $scope.registry.name &&
            $scope.image.status === "finished"
          ) {
            $http
              .get(REGISTRY_SCAN_IMAGE_URL, {
                params: {
                  name: $scope.registry.name,
                  imageId: $scope.image.image_id
                }
              })
              .then(function(response) {
                $scope.cves = response.data.report.vulnerabilities;
                $timeout(function() {
                  $scope.cveGridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                    "scan.NO_VULNERABILITIES"
                  )}</span>`;
                  $scope.cveGridOptions.api.setRowData($scope.cves);
                }, 50);
              })
              .catch(function(err) {
                console.warn(err);
                $scope.cveGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(
                  err
                );
                $scope.cveGridOptions.api.setRowData();
                // }
              });
          } else {
            $scope.cveGridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
              "scan.NOT_SCANNED"
            )}</span>`;
            $scope.cveGridOptions.api.setRowData();
          }
        }
        landingOnImageBrief = true;
      }

      $scope.gridOptions = RegistryScanFactory.registryGridOptions;
      $scope.gridOptions.onSelectionChanged = onRegistryChanged;

      $scope.summaryGridOptions =
        RegistryScanFactory.registryImageSummaryGridOptions;
      // $scope.summaryGridOptions.onSelectionChanged = onImageChanged;
      $scope.summaryGridOptions.onRowClicked = onImageChanged;

      $scope.briefGridOptions =
        RegistryScanFactory.registryImageBriefGridOptions;
      $scope.briefGridOptions.onSelectionChanged = onImageBriefChanged;

      $scope.cveGridOptions = RegistryScanFactory.cveGridOptions;
      $scope.cveGridOptions.onRowClicked = onCveChanged;

      let timeoutPromise = null;
      function onCveChanged() {
        let selectedRows = $scope.cveGridOptions.api.getSelectedRows();
        $scope.cveName = selectedRows[0].name;
        $scope.cveLink = selectedRows[0].link;
        $scope.cveDescription = selectedRows[0].description;
        $scope.onCVE = true;
        $scope.$apply();
        $timeout.cancel(timeoutPromise);
        timeoutPromise = $timeout(function() {
          $scope.onCVE = false;
        }, 10000);
      }

      function onImageChanged() {
        let selectedRows = $scope.summaryGridOptions.api.getSelectedRows();
        $scope.image = selectedRows[0];
        if (
          $scope.image &&
          $scope.registry &&
          $scope.registry.name &&
          $scope.image.status === "finished"
        ) {
          $scope.showLayers($scope.registry, $scope.image);
        }

        // landingOnImageBrief = false;
        //
        // if (
        //   $scope.image &&
        //   $scope.registry &&
        //   $scope.registry.name &&
        //   $scope.image.scanned_at !== ""
        // ) {
        //   /** @namespace $scope.image.image_id */
        //   $http
        //     .get(REGISTRY_SCAN_IMAGE_URL, {
        //       params: {
        //         name: $scope.registry.name,
        //         imageId: $scope.image.image_id
        //       }
        //     })
        //     .then(function(response) {
        //       if (angular.isDefined(timer)) {
        //         $interval.cancel(timer);
        //         timer = undefined;
        //       }
        //       $scope.cves = response.data.report.vulnerabilities;
        //       $scope.onBriefView = true;
        //       $timeout(function() {
        //         let totalLayerCount = 0;
        //         $scope.images.forEach(function(image) {
        //           if (image.layers) {
        //             totalLayerCount += image.layers.length;
        //           }
        //         });
        //         console.log(totalLayerCount)
        //         if (totalLayerCount === 0) {
        //           $scope.briefGridOptions.api.setColumnDefs(RegistryScanFactory.registryImageBriefColumns.slice(0, RegistryScanFactory.registryImageBriefColumns.length - 1));
        //         }
        //         $scope.briefGridOptions.api.setRowData($scope.images.map(function(image){return Object.assign(image, {registryName: $scope.registry.name, registry: $scope.registry})}));
        //         $scope.cveGridOptions.api.setRowData($scope.cves);
        //
        //         $scope.briefGridOptions.api.forEachNode(function(node) {
        //           if (node.data.image_id === $scope.image.image_id) {
        //             node.setSelected(true);
        //             $scope.briefGridOptions.api.ensureNodeVisible(node);
        //           }
        //         });
        //
        //         $scope.briefGridOptions.api.sizeColumnsToFit();
        //         $scope.cveGridOptions.api.sizeColumnsToFit();
        //       }, 500);
        //     })
        //     .catch(function(err) {
        //       console.warn(err);
        //       Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
        //       Alertify.error(
        //          Utils.getAlertifyMsg(err, $translate.instant("registry.message.GET_CVE_ERR"), false)
        //       );
        //     });
        // }
      }

      $scope.showLayers = function(registry, image) {
        $http
          .get(REGISTRY_SCAN_IMAGE_URL, {
            params: {
              name: registry.name,
              imageId: image.image_id
            }
          })
          .then(function(response) {
            let imageCVEs = response.data.report.vulnerabilities;
            let imageCompliance = response.data.report.checks;
            let modules = response.data.report.modules;
            $http
              .get(LAYER_URL, {
                params: {
                  name: registry.name,
                  imageId: image.image_id
                }
              })
              .then(function(response) {
                console.log(response.data);
                $mdDialog
                  .show({
                    locals: {
                      layers: response.data.report.layers,
                      parentInfo: {
                        name: registry.name,
                        imageId: image.image_id,
                        registry: registry.registry,
                        repository: image.repository,
                        base_os: image.base_os,
                        imageCVEs: imageCVEs,
                        imageCompliance: imageCompliance,
                        modules: modules,
                        tag: image.tag,
                        digest: image.digest,
                        cveDBVersion: registry.cvedb_version,
                        cveDBCreateTime: registry.cvedb_create_time
                      },
                      layersGridOptions: $scope.layersGridOptions
                    },
                    controller: ShowLayersController,
                    templateUrl: "registry.layers.html"
                  })
                  .then(
                    function() {
                      $scope.refresh();
                    },
                    function() {}
                  );
              })
              .catch(function(err) {
                console.warn(err);
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(
                    err,
                    $translate.instant("registry.message.GET_LAYERS_ERR"),
                    false
                  )
                );
              });
          })
          .catch(function(err) {
            console.warn(err);
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(
                err,
                $translate.instant("registry.message.GET_CVE_ERR"),
                false
              )
            );
          });
      };

      $scope.toSummary = function() {
        $scope.onBriefView = false;
        $scope.searchReport = "";

        $http
          .get(REGISTRY_SCAN_URL)
          .then(function(response) {
            renderRegistryList(response);
            setTimeout(function() {
              $scope.gridOptions.api.sizeColumnsToFit();
              $scope.gridOptions.api.forEachNode(function(node, index) {
                if ($scope.registry) {
                  if (node.data.name === $scope.registry.name) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                }
              });
            }, 50);
            if ($scope.registry && $scope.registry.status === "scanning") {
              reloadSummary($scope.registry.name);
            }
          })
          .catch(function(err) {
            console.warn(err);
          });
        getRegistrySummary($scope.registry);
        $timeout(function() {
          $scope.summaryGridOptions.api.setRowData($scope.images);
          $scope.summaryGridOptions.api.sizeColumnsToFit();
        }, 500);
      };

      function getRegistryTypes() {
        let cachedRegistryType = JSON.parse($window.sessionStorage.getItem("registryType"));
        if (cachedRegistryType && cachedRegistryType.length > 0) {
          $scope.registryTypes = cachedRegistryType;
        } else {
          RegistryScanFactory.getRegistryTypes().then(registryTypes => {
            $scope.registryTypes = registryTypes.data.list.registry_type.sort();
            $window.sessionStorage.setItem(
              "registryType",
              JSON.stringify($scope.registryTypes)
            );
          });
        }
      }

      $scope.toDetails = function() {
        $scope.onDetails = true;
      };

      $scope.toOverview = function() {
        $scope.onDetails = false;
      };

      const renderCveDBInfo = function(registry) {
        $scope.cveDBVersionOnSelectedRegistry = `${$translate.instant(
          "dashboard.heading.CVE_DB_VERSION"
        )}: ${registry.cvedb_version}`;
        $scope.cveDBCreateTimeOnSelectedRegistry = `${$translate.instant(
          "registry.CVE_DB_DATE"
        )}: ${$filter("date")(
          registry.cvedb_create_time,
          "MMM dd, y HH:mm:ss"
        )})`;
        console.log($scope.cveDBVersionOnSelectedRegistry, $scope.cveDBCreateTimeOnSelectedRegistry);
      };

      const makePieChart = function(sortedImages, isShowingTotal = false) {
        $scope.isRepoPieChartReady = false;
        let top5 = sortedImages.length >= 5 ?
          sortedImages.slice(0, 5) :
          sortedImages;
        let others = sortedImages.length >= 5 ?
          sortedImages.slice(5)
          .map(image => isShowingTotal ? image.high + image.medium : image.high)
          .reduce((sum, curr) => sum + curr, 0) :
          0;
        $scope.vulPieData = top5.map(image => isShowingTotal ? image.high + image.medium : image.high);
        $scope.vulPieData.push(others);
        $scope.isRepoPieChartReady = $scope.vulPieData.reduce(((isReady, curr) => {return isReady || curr > 0;}), false);
        console.log("$scope.vulPieData: ", $scope.vulPieData);
        console.log("$scope.isRepoPieChartReady", $scope.isRepoPieChartReady)
        $scope.vulPieLabels = top5.map(image => `${image.repository}:${image.tag}`);
        $scope.vulPieLabels.push($translate.instant("dashboard.body.panel_title.OTHERS"));
        let vulPieColors = [
          "#ef5350",
          "#f77472",
          "#fc8886",
          "#ffc6c4",
          "#ffdddb",
          "#c7c7c7"
        ];
        $scope.vulPieColors = vulPieColors.slice(0, $scope.vulPieData.length - 1);
        $scope.vulPieColors.push(vulPieColors[5]);
        $scope.vulPieOptions = {
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

      const makeDualBarChart = function(sortedImages) {
        let top5 = sortedImages.length >= 5 ?
          sortedImages.slice(0, 5) :
          sortedImages;
        $scope.vulBarData = [top5.map(image => image.high), top5.map(image => image.medium)];
        $scope.vulBarLabels = top5.map(image => Utils.shortenString(`${image.repository}:${image.tag}`, 46));
        $scope.vulBarColors = ["#ef5350", "#ff9800"];
        $scope.vulBarSerials = [
          $translate.instant("enum.HIGH"),
          $translate.instant("enum.MEDIUM"),
        ];
        $scope.vulBarDatasetOverride = [
          {
            borderWidth: 1
          },
          {
            borderWidth: 1
          }
        ];
        $scope.vulBarOptions = {
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
                barThickness: 8,
                borderWidth: 0
              },
            ],
          },
        };
      };

      const renderTopRiskiestRepo = function(sortedImages) {
        makePieChart(sortedImages, true);
        makeDualBarChart(sortedImages);
      };

      const sortByHigh = function(images) {
        return images.sort((image1, image2) => {
          return image2.high - image1.high;
        });
      };

      const sortByTotal = function(images) {
        return images.sort((image1, image2) => {
          return (image2.high + image2.medium) - (image1.high + image1.medium);
        });
      };

      const renderScanProgress = function(images) {
        let total = images.length;
        $scope.progresses = [
          {value: 0, name: $translate.instant("enum.FINISHED"), type: "info"},
          {value: 0, name: $translate.instant("enum.SCANNING"), type: "success"}
        ];
        images.forEach(image => {
          if (image.status === "finished") {
            $scope.progresses[0].value++;
          } else if (image.status === "scanning") {
            $scope.progresses[1].value++;
          }
        });
        $scope.progresses[0].value = Math.floor($scope.progresses[0].value / total * 100);
        $scope.progresses[1].value = Math.floor($scope.progresses[1].value / total * 100);
        console.log("$scope.progresses: ", $scope.progresses);
      };

      const renderOverview = function(registry, images) {
        let imageSortedByHigh = sortByHigh(images);
        console.log("imageSortedByHigh: ", imageSortedByHigh);
        renderCveDBInfo(registry);
        renderTopRiskiestRepo(imageSortedByHigh);
        renderScanProgress(images);
      }

      function getRegistrySummary(registry) {
        if (registry && registry.name) {
          $http
            .get(REGISTRY_SCAN_REPO_URL, { params: { name: registry.name } })
            .then(function(response) {
              if (registry.started_at === "") {
                $scope.summaryGridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                  "scan.NOT_SCANNED"
                )}</span>`;
              } else {
                $scope.summaryGridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                  "scan.NO_IMAGE"
                )}</span>`;
              }
              $scope.images = response.data.images;
              renderOverview(registry, $scope.images);
              $scope.searchReport = "";
              $timeout(function() {
                $scope.summaryGridOptions.api.setRowData($scope.images);
                $scope.onCveFilterChanged(repoFilter);
              }, 500);
            })
            .catch(function(err) {
              console.warn(err);
              $scope.summaryGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(
                err
              );
              $scope.summaryGridOptions.api.setRowData();
            });
        }
      }

      function renderRegistryList(response) {
        $scope.gridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
          "general.NO_ROWS"
        )}</span>`;
        $scope.registries = response.data.summarys;
        $scope.count = `${$scope.registries.length} ${getEntityName(
          $scope.registries.length
        )}`;
        getRegistryTypes();
        $scope.registries = $scope.registries.map(registry => {
          if (registry.error_message.length > 0) {
            registry.status = "err";
            registry.errMsg = `${registry.error_message} <br> ${registry.error_detail}`;
          }
          return registry;
        });
        $scope.hasRegistry = $scope.registries.length > 0;
        if (!$scope.registries || $scope.registries.length === 0) {
          $timeout(function() {
            $scope.gridOptions.api.setRowData([]);
            $scope.summaryGridOptions.api.setRowData([]);
          }, 50);
        }
        $scope.gridOptions.api.setRowData($scope.registries);
        $scope.count = `${$scope.registries.length} ${getEntityName(
          $scope.registries.length
        )}`;
      }

      $scope.reset = function() {
        $scope.isReset = true;
        if (
          Array.isArray($scope.selectedNodes4Registry) &&
          $scope.selectedNodes4Registry[0] &&
          $scope.selectedNodes4Registry[0].rowIndex === 0
        ) {
          $scope.isReset = false;// If reset first row, let is retrieve image info
        }
        $scope.refresh();
      };

      $scope.refresh = function() {
        $scope.registries = [];
        $scope.registryErr = false;
        $http
          .get(REGISTRY_SCAN_URL)
          .then(function(response) {
            /** @namespace response.data.summarys */
            renderRegistryList(response);
            let currRegistryName = "";
            if ($scope.registry) {
              currRegistryName = $scope.registry.name;
            }
            setTimeout(function() {
              $scope.gridOptions.api.sizeColumnsToFit();
              $scope.gridOptions.api.forEachNode(function(node, index) {
                if ($scope.registry) {
                  if (
                    node.data.name === currRegistryName ||
                    node.data.name === RegistryScanFactory.addedRegistryName
                  ) {
                    node.setSelected(true);
                    $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                    currRegistryName = node.data.name;
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node, "middle");
                }
              });
              RegistryScanFactory.addedRegistryName = "";
            });
            $scope.onFilterChanged(registryFilter);
            if ($scope.summaryGridOptions && $scope.summaryGridOptions.api) {
              $scope.onCveFilterChanged(repoFilter);
            }
          })
          .catch(function(err) {
            console.warn(err);
            $scope.hasRegistry = false;
            $scope.registryErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(
              err
            );
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.refresh();

      function run(fn) {
        try {
          return new Worker(URL.createObjectURL(new Blob(["(" + fn + ")()"])));
        } catch (err) {
          console.log(err);
        }
      }

      const getI18NMessages = function () {
        return {
          others: {
            logoName: $translate.instant("partner.general.LOGO_NAME", {}, "", "en")
          }
        };
      }

      const getRowData = function(item) {
        let step = {};
        let content = {};
        switch(item.step_type) {
          case "stop":
            step = {text: "Stopped", style: "error"};
            content = {text: item.step_content, style: "error"};
            break;
          case "stage":
            step = {text: ""};
            content = {text: item.step_content, style: "stage"};
            break;
          case "url":
            step = {text: "Request URL", style: "info"};
            content = {text: item.step_content};
            break;
          case "response":
            step = {text: "Response", style: "success"};
            let trimedResponse = Utils.escapeHtml(item.step_content);
            content = {text: Utils.shortenString(trimedResponse, 10000), style: "grey"}
            break;
          case "comment":
          case "images":
            step = {text: "Images", style: "greyBold"};
            content = {text: item.step_content};
            break;
          case "other-images":
            step = {text: ""};
            content = {text: item.step_content};
            break;
          case "error":
            step = {text: "Error", style: "error"};
            content = {text: item.step_content};
            break;
        };
        return [step, content];
      };

      const formatContent4TestInfo = function (docData) {
        let metadata = docData.metadata;
        let images = docData.images;

        let docDefinition = {
          info: {
            title: "Registry Connection Test Report",
            author: "NeuVector",
            subject: "Registry connection test report",
            keywords: "registry connection test repo",
          },
          headerData: {
            text: "NeuVector Container Security Report",
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
            text: "Container Security Report",
          },
          header: function (currentPage) {
            if (currentPage === 2 || currentPage === 3) {
              return {
                text: "NeuVector Container Security Report",
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
                      { text: "Container Security Report", italics: true },
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
              text: "Registry Connection Test Report",
              fontSize: 40,
              color: "#777",
              bold: true,
              absolutePosition: { x: 150, y: 450 },
              pageBreak: "after",
            },
            {
              style: "tableExample",
              table: {
                headerRows: 0,
                dontBreakRows: false,
                widths: ["8%", "92%"],
                body: []
              }
            }
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
            success: {
              bold: true,
              color: "#64a150",
              fontSize: 8,
            },
            greyBold: {
              bold: true,
              color: "#566D7E",
              fontSize: 8,
            },
            grey: {
              color: "#566D7E",
              fontSize: 8,
            },
            stage: {
              bold: true,
              fontSize: 10
            },
          },
        };

        for (let item of docData.data) {
          docDefinition.content[4].table.body.push(
            getRowData(item)
          );
        }
        console.log(docDefinition);
        return docDefinition;
      };

      const testReportWorkerServer = function () {
        console.log("Test info Worker server is starting...");
        const showProgress = (function (self) {
          return function (progress) {
            if (Math.floor(progress * 100000) % 1000 === 0) {
              self.postMessage({ progress4TestInfo: progress });
            }
          };
        })(self);
        self.onmessage = (event) => {
          let pdfData = JSON.parse(event.data);
          let docDefinition = pdfData.docDefinition;
          let currUrl = pdfData.currUrl;
          let neuvectorProxy = pdfData.neuvectorProxy;
          let isSUSESSO = pdfData.isSUSESSO;
          console.log("Rancher SSO data", currUrl, neuvectorProxy, isSUSESSO);

          const drawReportInWebWorker = function (docDefinition) {
            let baseURL = event.srcElement.origin;
            if (isSUSESSO) {
              baseURL = `${currUrl.split(neuvectorProxy)[0]}${neuvectorProxy}`;
              console.log("Rewritten base url:", baseURL);
            }
            self.importScripts(
              baseURL + "/vendor/pdfmake/build/pdfmake.js",
              baseURL + "/vendor/pdfmake/build/vfs_fonts.js"
            );

            let report = pdfMake.createPdf(docDefinition);

            report.getBlob(
              function (blob) {
                console.log("Test info Worker is end...");
                self.postMessage({ blob: blob, progress4TestInfo: 1 });
                self.close();
              },
              { progressCallback: showProgress }
            );
          };
          drawReportInWebWorker(docDefinition);
        };
      };

      const testReportWorkerClient = function(scope, testInfo) {
        $scope.pdfBlob4TestInfo = null;
        if ($scope.worker4TestInfo) {
          $scope.worker4TestInfo.terminate();
          console.info("killed an existing running test info worker...");
        }
        $scope.worker4TestInfo = run(testReportWorkerServer);
        if ($scope.worker4TestInfo) {
          if (testInfo) {
            let docData = {
              data: testInfo,
              images: imageMap,
              metadata: getI18NMessages()
            };
            console.log("Post message to test info worker...", docData);
            $scope.worker4TestInfo.postMessage(
              JSON.stringify(Object.assign(
                { docDefinition: formatContent4TestInfo(docData) },
                { currUrl: window.location.href },
                { neuvectorProxy: PROXY_VALUE },
                { isSUSESSO: $rootScope.isSUSESSO}
              ))
            );
          } else {
            console.warn("no data in test info.");
          }
          $scope.worker4TestInfo.onmessage = (event) => {
            $scope.pdfBlob4TestInfo = event.data.blob;
            scope.progress4TestInfo = Math.floor(event.data.progress4TestInfo * 100);
            console.log("scope.progress4TestInfo:", scope.progress4TestInfo);
            $scope.$apply();
          };
        } else {
          scope.progress4TestInfo = 100;
          console.log("scope.progress4TestInfo:", scope.progress4TestInfo);
        }
      };

      const downloadTxt4TestInfo = function (scope) {
        let blob = new Blob([JSON.stringify($scope.testInfoData, null, "\t")], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(blob, "Registry connection test report.txt");
      };

      const downloadPdf4TestInfo = function (scope) {
        scope.isPdfPreparing4TestInfo = true;
        console.log("scope.isPdfPreparing4TestInfo:", scope.isPdfPreparing4TestInfo);
        let docData = {
          data: $scope.testInfoData,
          images: imageMap,
          metadata: getI18NMessages()
        };
        if ($scope.worker4TestInfo) {
          $interval.cancel(timer4TestInfo);
          timer4TestInfo = $interval(function () {
            if ($scope.pdfBlob4TestInfo) {
              scope.isPdfPreparing4TestInfo = false;
              console.log("scope.isPdfPreparing4TestInfo:", scope.isPdfPreparing4TestInfo);
              FileSaver.saveAs(
                $scope.pdfBlob4TestInfo,
                "Registry connection test report.pdf"
              );
              $interval.cancel(timer4TestInfo);
              console.log("scope.progress4TestInfo(final):", scope.progress4TestInfo);
            }
          }, 1000);
        } else {
          const drawReport = function (docDefinition) {
            let report = pdfMake.createPdf(docDefinition);

            report.getBlob(function (blob) {
              scope.isPdfPreparing4TestInfo = false;
              console.log("scope.isPdfPreparing4TestInfo:", scope.isPdfPreparing4TestInfo);
              FileSaver.saveAs(
                blob,
                "Registry connection test report.pdf"
              );
            });
          };
          let docDefinition = formatContent4TestInfo(docData);
          drawReport(docDefinition);
        }
      };
      let cachedRowData = [];
      const renderTestInfoList = function(scope, rowData, isTestDone) {
        let start = new Date();
        console.log("cachedRowData: ", cachedRowData);

        if (cachedRowData[cachedRowData.length - 1] && cachedRowData[cachedRowData.length - 1].step_type === "") {
          rowData = rowData.slice(cachedRowData.length - 1, rowData.length);
          cachedRowData = cachedRowData.slice(0, cachedRowData.length - 1).concat(rowData);
        } else {
          rowData = rowData.slice(cachedRowData.length, rowData.length);
          cachedRowData = cachedRowData.slice(0, cachedRowData.length).concat(rowData);
        }

        if (!isTestDone) {
          cachedRowData.push({step_type: "", step_content: ""});
        } else {
          // Comment out Temporarily, enable it in case of needed.
          // testReportWorkerClient(scope, cachedRowData);
        }
        console.log("grid data: ", cachedRowData);
        scope.testInfoGridOptions.api.setRowData(cachedRowData);
        let end = new Date();
        console.log("Time for set row data: ", end - start);
        $scope.testInfoData = cachedRowData;
        $timeout(() => {
          scope.testInfoGridOptions.api.sizeColumnsToFit();
          const fitColumn = function(data, index) {
            let rowNode = scope.testInfoGridOptions.api.getDisplayedRowAtIndex(index);
            console.log("rowNode:", rowNode);
            rowNode.setData(data);
            scope.testInfoGridOptions.api.redrawRows({ rowNodes: [rowNode] });
            $timeout(() => {
              scope.testInfoGridOptions.api.sizeColumnsToFit();
              rowNode.setSelected(true);
              scope.testInfoGridOptions.api.forEachNode(function(node, _index) {
                if (index === _index) {
                  node.setSelected(true);
                  scope.testInfoGridOptions.api.ensureNodeVisible(node, "middle");
                } else if (index === rowData.length - 1) {
                  node.setSelected(true);
                  scope.testInfoGridOptions.api.ensureNodeVisible(node, "bottom");
                }
              });
            }, 200);
          };
          scope.expandRow = function(data, index) {
            data.isExpanded = true;
            fitColumn(data, index);
          };
          scope.collapseRow = function(data, index) {
            data.isExpanded = false;
            fitColumn(data, index);
          };
        }, 200);
      };

      const getTestInfo = function(scope, config, transactionId) {
        if (!transactionId) {
          $http
          .post(REGISTRY_TEST, {config: config})
          .then((res) => {
            $scope.transactionId = res.headers("X-Transaction-Id");
            console.log("transactionId: ", $scope.transactionId);
            if (res.status === 304) {
              getTestInfo(scope, config, $scope.transactionId);
            } else if (res.status === 206) {
              console.log("steps:", res.data.steps.length);
              renderTestInfoList(scope, res.data.steps, false);
              getTestInfo(scope, config, $scope.transactionId);
            } else if (res.status === 200) {
              console.log("steps:", res.data.steps.length);
              renderTestInfoList(scope, res.data.steps, true);
              scope.isTesting = false;
            }
          })
          .catch((err) => {
            console.warn(err);
            let errMessage = Utils.getErrorMessage(err);
            renderTestInfoList(scope, [{step_type: "stop", step_content: errMessage}], true);
          });
        } else {
          $http
          .post(
            REGISTRY_TEST,
            {config: config},
            {
              headers: {
                "X-Transaction-Id": transactionId
              }
            }
          )
          .then((res) => {
            let transactionId = res.headers("X-Transaction-Id");
            if (!$scope.isTestStopped) {
              if (res.status === 304) {
                getTestInfo(scope, config, transactionId);
              } else if (res.status === 206) {
                console.log("steps:", res.data.steps.length);
                renderTestInfoList(scope, res.data.steps, false);
                getTestInfo(scope, config, transactionId);
              } else if (res.status === 200) {
                console.log("steps:", res.data.steps.length);
                renderTestInfoList(scope, res.data.steps, true);
                scope.isTesting = false;
                scope.isTestDone = true;
              }
            }
          })
          .catch((err) => {
            console.warn(err);
            let errMessage = Utils.getErrorMessage(err);
            renderTestInfoList(scope, [{step_type: "stop", step_content: errMessage}], true);
          });
        }
      };

      const deleteTest = function(scope, registryName) {
        console.log("$scope.transactionId(delete): ", $scope.transactionId);
        $http
        .delete(
          REGISTRY_TEST,
          {
            headers: {
              "X-Transaction-Id": $scope.transactionId
            },
            params: {
              name: registryName
            }
          }
        )
        .then((res) => {
          console.log(res);
          $scope.isTestStopped = true;
          $scope.testInfoData[$scope.testInfoData.length - 1] = {
            step_type: "stop", step_content: "Test was stopped."
          };
          scope.testInfoGridOptions.api.setRowData($scope.testInfoData);
          scope.isTestDone = true;
          testReportWorkerClient(scope, $scope.testInfoData);
        })
        .catch((err) => {
          console.warn(err);
          $scope.isTestStopped = true;
          if ($scope.testInfoData) {
            $scope.testInfoData[$scope.testInfoData.length - 1] = {
              step_type: "stop", step_content: "Test was stopped."
            };
          }
          scope.testInfoGridOptions.api.setRowData($scope.testInfoData);
          scope.isTestDone = true;
          testReportWorkerClient(scope, $scope.testInfoData);
        });
      };

      const startTestRegistry = function(scope, config) {
        scope.isOnTestView = true;
        scope.isTesting = true;
        scope.isTestDone = false;
        $scope.isTestStopped = false;
        cachedRowData = [];
        getTestInfo(scope, config);
      };

      const stopTestRegistry = function(scope, registryName) {
        if (scope.isTesting) {
          deleteTest(scope, registryName);
          scope.isTesting = false;
        }
      };

      $scope.addRepo = function(ev) {
        let authMode = "user-pwd";
        let success = function() {
          $mdDialog
            .show({
              locals: {
                registryTypes: $scope.registryTypes,
                authMode: authMode,
                testRegistry: {
                  start: startTestRegistry,
                  stop: stopTestRegistry,
                  export: downloadTxt4TestInfo //downloadPdf4TestInfo
                }
              },
              controller: DialogController,
              templateUrl: "registry.add.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(() => {
                  $scope.refresh();
                }, 1000);
              },
              function() {}
            );
        };

        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.editRepo = function(ev, registry, hasWriteAuth) {
        let success = function() {
          let filters = [];
          if (registry.filters && registry.filters.length > 0) {
            filters = registry.filters.map(function(item) {
              if (typeof item === "string")
                return { name: item };
              else
                return {name: item.name};
            });
          }

          registry.filters = filters;
          registry.isScheduled =
            $scope.registry.schedule.schedule === "auto" ||
            $scope.registry.schedule.schedule === "periodical";
          let authMode = registry.auth_with_token ? "token" : "user-pwd";

          $mdDialog
            .show({
              locals: {
                registry: angular.copy(registry),
                registryTypes: $scope.registryTypes,
                authMode: authMode,
                testRegistry: {
                  start: startTestRegistry,
                  stop: stopTestRegistry,
                  export: downloadTxt4TestInfo //downloadPdf4TestInfo
                },
                hasWriteAuth: hasWriteAuth
              },
              controller: EditDialogController,
              templateUrl: "registry.edit.html",
              targetEvent: ev
            })
            .then(
              function() {
                $timeout(() => {
                  $scope.refresh();
                }, 1000);
              },
              function() {}
            );
        };
        let error = function() {};
        Utils.keepAlive(success, error);
      };

      const REGISTRY_DELETE_CONFIRMATION = $translate.instant(
        "registry.REGISTRY_DELETE_CONFIRMATION"
      );

      $scope.deleteRepo = function(name) {
        Alertify.confirm(REGISTRY_DELETE_CONFIRMATION).then(
          function onOk() {
            $http
              .delete(REGISTRY_SCAN_URL, {
                params: {
                  name: name
                }
              })
              .then(function() {
                $scope.registry = null;
                $timeout(function() {
                  if ($scope.onBriefView) {
                    $scope.images = [];
                    $scope.toSummary();
                  } else {
                    $scope.refresh();
                  }
                }, 1000);
              })
              .catch(function(err) {
                console.warn(err);
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      err,
                      $translate.instant("registry.REGISTRY_DELETE_FAILED"),
                      false
                    )
                  );
                }
              });
          },
          function onCancel() {}
        );
      };

      function reloadSummary(name) {
        if (angular.isDefined(timer)) {
          let resOfTimerCancel = $interval.cancel(timer);
          timer = undefined;
          if (!resOfTimerCancel) {
            console.warn("Timer cancel failed!");
          }
        }
        let registry = $scope.registry;
        $scope.selectedRegistry.registry = $scope.registry.registry;
        let getSummary = function() {
          $http
            .get(REGISTRY_SCAN_URL)
            .then(function(response) {
              renderRegistryList(response);
              let index = $scope.registries.findIndex(function(reg) {
                return registry.name === reg.name;
              });
              $scope.registry = $scope.registries[index];
              if ($scope.registry.status === "scanning" || loopCounter > 3) {
                $scope.startedScan = false;
              }
              loopCounter++;
              $scope.gridOptions.api.ensureIndexVisible(index, "middle");
              if (
                $scope.registry.scanning === 0 &&
                $scope.registry.scheduled === 0 &&
                $scope.registry.status !== "scanning" &&
                !$scope.startedScan
              ) {
                $scope.$broadcast("stop-loading");
                $scope.isScanning = false;
                loopCounter = 0;
                //Refresh image scan summary When the registry scan is done.
                getRegistrySummary(registry);
              }
            })
            .catch(function(err) {
              console.warn(err);
              $interval.cancel(timer);
            });
          //Comment out for user manually refresh image scan summary
          // getRegistrySummary(registry);
        };
        getSummary();
        timer = $interval(getSummary, 10000);
      }

      $scope.onFilterChanged = function(value) {
        registryFilter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
        if (node) {
          $scope.hasRegistry = true;
          node.setSelected(true);
        } else {
          $scope.hasRegistry = false;
          $scope.gridOptions.api.deselectAll();
        }
        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.registries.length || value === ""
            ? `${$scope.registries.length} ${getEntityName(
                $scope.registries.length
              )}`
            : `${found} ${filteredCount} ${getEntityName(
                filteredCount
              )} ${outOf} ${$scope.registries.length} ${getEntityName(
                $scope.registries.length
              )}`;
      };

      $scope.onCveFilterChanged = function(value) {
        repoFilter = value;
        $scope.summaryGridOptions.api.setQuickFilter(value);
      };

      $scope.onReportFilterChanged = function(value) {
        $scope.cveGridOptions.api.setQuickFilter(value);
      };

      $scope.exportCsv = function() {
        console.log("downloading csv");
        if ($scope.cves && $scope.cves.length > 0) {
          let cves4Csv = angular.copy($scope.cves);
          cves4Csv = cves4Csv.map(function(cve) {
            cve.description = `${cve.description.replace(/\"/g, "'")}`;
            cve.tags = cve.tags || "";
            return cve;
          });
          let csv = Utils.arrayToCsv(cves4Csv);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          let filename;
          filename = `vulnerabilities-${$scope.registry.name}_${Utils.parseDatetimeStr(new Date())}.csv`;
          FileSaver.saveAs(blob, filename);
        }
      };

      $scope.$on("stop-loading", function() {
        if (angular.isDefined(timer)) {
          $interval.cancel(timer);
          timer = undefined;
        }
      });

      $scope.scan = function(name) {
        $http
          .post(REGISTRY_SCAN_REPO_URL, name)
          .then(function() {
            $scope.isScanning = true;
            $timeout(function() {
              $http
                .get(REGISTRY_SCAN_URL)
                .then(function(response) {
                  $scope.startedScan = true;
                  $timeout(() => {
                    renderRegistryList(response);
                    reloadSummary(name);
                  }, 5000);
                })
                .catch(function(err) {
                  console.warn(err);
                  if (USER_TIMEOUT.indexOf(err.status) < 0) {
                    Alertify.alert(
                      Utils.getAlertifyMsg(
                        err,
                        $translate.instant("registry.message.GET_ST_ERR"),
                        true
                      )
                    );
                  }
                });
            }, 1000);
          })
          .catch(function(err) {
            console.warn(err);
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  err,
                  $translate.instant("registry.REGISTRY_SCAN_FAILED"),
                  false
                )
              );
            }
          });
      };

      $scope.stopScan = function(registry) {
        $http
          .delete(REGISTRY_SCAN_REPO_URL, { params: { name: registry.name } })
          .then(function() {
            $scope.isScanning = false;
            loopCounter = 0;
            $scope.refresh();
            $timeout($scope.refresh, 5000);
            if (angular.isDefined(timer)) {
              $interval.cancel(timer);
              timer = undefined;
            }
          })
          .catch(function(err) {
            console.warn(err);
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  err,
                  $translate.instant("registry.REGISTRY_STOP_SCAN_FAILED"),
                  false
                )
              );
            }
          });
      };

      $scope.$on("$destroy", function() {
        if (angular.isDefined(timer)) {
          $interval.cancel(timer);
          timer = undefined;
        }
      });
    }

    let accessKeyId = "";
    let secretAccessKey = "";
    let privateToken = "";
    function getRegistryConfig(registry, valueOfMaskedItems) {
      let filter = [];
      if (registry.filters && registry.filters.length > 0) {
        filter = registry.filters.map(function(item) {
          return item.name;
        });
      }

      let config = {
        name: registry.name,
        registry_type: registry.registry_type,
        filters: filter,
        rescan_after_db_update: registry.rescan_after_db_update,
        scan_layers: registry.scan_layers,
        schedule: {
          schedule: registry.isScheduled
            ? registry.registry_type.indexOf("OpenShift") >= 0
              ? "auto"
              : "periodical"
            : "manual",
          interval:
            registry.slideNum !== undefined && registry.isScheduled
              ? registry.interval[registry.slideNum].seconds
              : 0
        }
      };

      if (registry.registry_type.toLowerCase().indexOf("ibm") >= 0) {
        config.ibm_cloud_account = registry.ibm_cloud_account;
      }

      if (registry.registry_type.toLowerCase().indexOf("gitlab") >= 0) {
        config.gitlab_external_url = registry.gitlab_external_url;
        config.gitlab_private_token = valueOfMaskedItems.privateToken;
      }

      if (registry.registry_type.indexOf("JFrog") >= 0) {
        config.jfrog_mode = registry.jfrog_mode;
        // config.jfrog_aql = registry.jfrog_aql;
      }

      config.username = registry.username || "";
      config.password = registry.password;
      config.auth_token = registry.auth_token;
      config.auth_with_token = registry.auth_with_token;

      if (registry.registry_type.indexOf("Amazon") >= 0) {
        (config.aws_key = angular.copy(registry.aws_key)),
          (config.aws_key.access_key_id = valueOfMaskedItems.accessKeyId);
        config.aws_key.secret_access_key = valueOfMaskedItems.secretAccessKey;
      }
      if (registry.registry_type.toLowerCase().indexOf("google") >= 0) {
        config.gcr_key = {};
        config.gcr_key.json_key = registry.jsonKey;
      }
      config.registry = registry.registry;
      return config;
    }

    $scope.$on("$destroy", function () {
      if(timer4TestInfo) $interval.cancel(timer4TestInfo);
      $scope.pdfBlob4TestInfo = null;
      if ($scope.worker4TestInfo) {
        $scope.worker4TestInfo.terminate();
      }
    });

    DialogController.$inject = [
      "$scope",
      "$http",
      "$mdDialog",
      "$sanitize",
      "registryTypes",
      "authMode",
      "testRegistry"
    ];
    function DialogController(
      $scope,
      $http,
      $mdDialog,
      $sanitize,
      registryTypes,
      authMode,
      testRegistry
    ) {
      const initialRegistryData = function() {
        $scope.newRegistry = {
          name: "",
          registry: "",
          jsonKey: "",
          auth_token: "",
          username: "",
          password: "",
          gitlab_external_url: "",
          gitlab_private_token: "",
          rescan_after_db_update: true,
          ibm_cloud_account: "",
          aws_key: {
            id: "",
            region: "",
            access_key_id: "",
            secret_access_key: ""
          },
          gcr_key: {
            json_key: ""
          },
          filters: [],
          auth_with_token: false,
          slideNum: 0,
          interval: intervalMap4ScheduledScan,
          scan_layers: false
        };
      };

      activate();

      function activate() {
        let filtersBak = null;
        $scope.singleFilter = {
          value: "",
          index: -1
        };
        $scope.authMode = authMode;
        $scope.isOnTestView = false;
        $scope.isTesting = false;
        $scope.isPdfPreparing4TestInfo = false;
        $scope.progress4TestInfo = 0;
        initialRegistryData();
        $scope.testInfoGridOptions = RegistryScanFactory.getRegistryTestInfoGridOptions();
        accessKeyId = "";
        secretAccessKey = "";
        privateToken = "";
        $scope.jfrogModes = RegistryScanFactory.jfrogModes;

        $scope.registryTypes = registryTypes;
        $scope.registryType = $scope.registryTypes.find(function(regType) {
          return regType.indexOf("Docker") > -1;
        });
        $scope.registrySample = $translate.instant("registry.DOCKER_URL_HINT");

        if ($scope.registryType.indexOf("Amazon") < 0) {
          $scope.newRegistry.aws_key = undefined;
        } else {
          $scope.newRegistry.aws_key = {
            access_key_id: "",
            secret_access_key: ""
          };
        }

        $scope.setRegistryType = function(regType) {
          initialRegistryData();
          $scope.newRegistry.username = "";
          switch (regType) {
            case "Amazon ECR Registry":
              $scope.registrySample = $translate.instant(
                "registry.AMAZON_URL_HINT"
              );
              break;
            case "Docker Registry":
              $scope.registrySample = $translate.instant(
                "registry.DOCKER_URL_HINT"
              );
              break;
            case "OpenShift Registry":
              $scope.registrySample = $translate.instant(
                "registry.OPENSHIFT_URL_HINT"
              );
              break;
            case "Red Hat Public Registry":
              $scope.registrySample = $translate.instant(
                "registry.REDHAT_URL_HINT"
              );
              break;
            case "Google Container Registry":
              $scope.registrySample = $translate.instant(
                "registry.GOOGLE_URL_HINT"
              );
              break;
            case "Azure Container Registry":
              $scope.registrySample = $translate.instant(
                "registry.AZURE_URL_HINT"
              );
              break;
            case "JFrog Artifactory":
              $scope.registrySample = $translate.instant(
                "registry.JFROG_URL_HINT"
              );
              break;
            case "Sonatype Nexus":
              $scope.registrySample = $translate.instant(
                "registry.SONATYPE_URL_HINT"
              );
              break;
            case "Gitlab":
              $scope.registrySample = $translate.instant(
                "registry.GITLAB_URL_HINT"
              );
              break;
            case "IBM Cloud Container Registry":
              $scope.registrySample = $translate.instant(
                "registry.IBM.URL_HINT"
              );
              $scope.newRegistry.username = "iamapikey";
              break;
            default:
              $scope.registrySample = "";
          }
          $scope.registryType = regType;
          if ($scope.registryType.indexOf("Amazon") < 0) {
            $scope.newRegistry.aws_key = undefined;
          } else {
            $scope.newRegistry.aws_key = {
              access_key_id: "",
              secret_access_key: ""
            };
          }
        };

        $scope.changeJfrogMode = function(jfrogMode) {
          // if (jfrogMode !== "Subdomain") $scope.newRegistry.jfrog_aql = false;
        };

        $scope.unmask = function(model) {
          switch (model) {
            case "access_key_id":
              $scope.newRegistry.aws_key.access_key_id = accessKeyId;
              break;
            case "secret_access_key":
              $scope.newRegistry.aws_key.secret_access_key = secretAccessKey;
              break;
            case "private_token":
              $scope.newRegistry.gitlab_private_token = privateToken;
              break;
          }
        };

        $scope.mask = function(model) {
          switch (model) {
            case "access_key_id":
              if ($scope.newRegistry.aws_key.access_key_id !== "") {
                accessKeyId = $scope.newRegistry.aws_key.access_key_id;
                $scope.newRegistry.aws_key.access_key_id = "****************";
              } else {
                accessKeyId = "";
              }
              break;
            case "secret_access_key":
              if ($scope.newRegistry.aws_key.secret_access_key !== "") {
                secretAccessKey = $scope.newRegistry.aws_key.secret_access_key;
                $scope.newRegistry.aws_key.secret_access_key =
                  "****************";
              } else {
                secretAccessKey = "";
              }
              break;
            case "private_token":
              if ($scope.newRegistry.gitlab_private_token !== "") {
                privateToken = $scope.newRegistry.gitlab_private_token;
                $scope.newRegistry.gitlab_private_token =
                  "****************";
              } else {
                privateToken = "";
              }
              break;
          }
        };

        $scope.move2Test = function() {
          filtersBak = angular.copy($scope.newRegistry.filters);
          $scope.isOnTestView = true;
          $scope.testInfoGridOptions.overlayNoRowsTemplate =
            `<span class="text-muted">${$translate.instant("registry.START_TEST_HINT")}</span>`;
          $scope.testInfoGridOptions.api.setRowData();
        };

        $scope.cancel = function() {
          if ($scope.isOnTestView) {
            $scope.back2Config();
          } else {
            $mdDialog.cancel();
          }
        };

        $scope.checkEmpty = function(str, form) {
          if (typeof str === "undefined" || str.length === 0) {
            form.jsonKey.$setValidity("required", false);
          } else {
            form.jsonKey.$setValidity("required", true);
          }
        };

        $scope.preventFormSubmit = function(event) {
          if (event.which === 13) {
            event.preventDefault();
            $scope.editFilter($scope.singleFilter);
          }
        };

        const initializeTagStyle = function() {
          let allTagsElem = angular.element("ul.tag-list > li");
          for (let i = 0; i < allTagsElem.length; i++) {
            allTagsElem[i].classList.remove("selected-tag");
            allTagsElem[i].classList.add("tag-item");
          }
        };

        const initializeSpecificTagStyle = function(insertIndex) {
          let elem = angular.element("ul.tag-list > li")[insertIndex];
          elem.classList.remove("selected-tag");
          elem.classList.add("tag-item");
        };

        const setFocusedTagStyle = function(focusedIndex) {
          let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
          tagElem.classList.remove("tag-item");
          tagElem.classList.add("selected-tag");
        };

        $scope.checkDuplicated = function() {
          let elem = angular.element("#tagEditor");
          if ($scope.newRegistry.filters) {
            for (let i = 0; i < $scope.newRegistry.filters.length; i++) {
              if (
                $scope.singleFilter.value === $scope.newRegistry.filters[i].name &&
                $scope.singleFilter.index !== $scope.newRegistry.filters[i].index
              ) {
                elem[0].classList.remove("ng-valid");
                elem[0].classList.add("ng-invalid");
                $scope.isInvalidTag = true;
                return;
              }
            }
          }
          elem[0].classList.remove("ng-invalid");
          elem[0].classList.add("ng-valid");
          $scope.isInvalidTag = false;
        };

        $scope.editFilter = function(singleFilter) {
          if (!$scope.newRegistry.filters)  $scope.newRegistry.filters = [];
          let insertIndex = singleFilter.index === -1 ? $scope.newRegistry.filters.length : singleFilter.index;
          let insertOrReplace = singleFilter.index === -1 ? 0 : 1;
          $scope.newRegistry.filters.splice(insertIndex, insertOrReplace, {
            name: singleFilter.value,
            index: insertIndex
          });
          $scope.singleFilter = {
            value: "",
            index: -1
          };
          $scope.isShowingEditFilter = false;
          initializeSpecificTagStyle(insertIndex);
        };

        $scope.tagAdding = function(tag) {
          let insertIndex = $scope.newRegistry.filters.length;
          tag.index = insertIndex;
          $scope.isShowingEditFilter = false;
          initializeTagStyle();
        }

        $scope.showTagDetail = function(tag) {
          initializeTagStyle();
          setFocusedTagStyle(tag.index);
          $scope.singleFilter.value = tag.name;
          $scope.singleFilter.index = tag.index;
          $scope.isShowingEditFilter = true;
          $scope.isInvalidTag = false;
          $timeout(() => {
            let tagEditorElem = angular.element("#tagEditor");
            tagEditorElem.focus();
          }, 200);
        };

        $scope.tagRemoving = function(tag) {
          $scope.newRegistry.filters.forEach(filter => {
            if (tag.index < filter.index) {
              filter.index -= 1;
            }
          });
          $timeout(() => {
            if (!$scope.newRegistry.filters)  $scope.newRegistry.filters = [];
            $scope.isShowingEditFilter = false;
            initializeTagStyle();
          }, 200);
        };

        const startTestRegistry = function(config) {
          testRegistry.start($scope, config);
        };

        const stopTestRegistry = function(registryName) {
          testRegistry.stop($scope, registryName);
        };

        const setRegistryData = function(registry) {
          registry.registry_type = $scope.registryType;
          if (registry.registry_type.indexOf("OpenShift") >= 0) {
            registry.auth_with_token = $scope.authMode === "token";
            if (registry.auth_with_token) {
              registry.auth_token = $scope.newRegistry.auth_token;
              registry.username = "";
              registry.password = "";
            } else {
              registry.auth_token = "";
              registry.username = $scope.newRegistry.username;
              registry.password = $scope.newRegistry.password;
            }
          }
          return registry;
        };

        $scope.testRegistry = function(registry, form, isTesting) {
          if (isTesting) {
            if ($scope.isOnTestView) {
              stopTestRegistry(registry.name);
            } else {
              $scope.isOnTestView = true;
            }
          } else {
            let config = null;
            registry = setRegistryData(registry);
            if (registry.registry_type.indexOf("Amazon") >= 0) {
              config = getRegistryConfig(
                registry,
                {
                  accessKeyId,
                  secretAccessKey
                }
              );
              $scope.newRegistry.aws_key.access_key_id = "****************";
              $scope.newRegistry.aws_key.secret_access_key = "****************";
            } else if (registry.registry_type.indexOf("Gitlab") >= 0) {
              config = getRegistryConfig(
                registry,
                {privateToken}
              );
              $scope.newRegistry.gitlab_private_token = "****************";
            } else {
              config = getRegistryConfig(registry);
            }
            startTestRegistry(config);
          }
        };

        $scope.back2Config = function() {
          $scope.isOnTestView = false;
          $scope.newRegistry.filters = angular.copy(filtersBak);
          if (!$scope.isTestDone) {
            stopTestRegistry($scope.newRegistry.name);
          }
          $scope.isTestDone = false;
        };

        $scope.copyFilters2Config = function() {
          filtersBak = angular.copy($scope.newRegistry.filters);
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.success(
            $translate.instant("registry.COPIED")
          );
        };

        $scope.downloadTestInfoTxt = function() {
        // $scope.downloadTestInfoPdf = function() {
          testRegistry.export($scope);
        };

        $scope.addRegistry = function(registry, form) {
          let config = null;

          registry.registry_type = $scope.registryType;
          if (registry.registry_type.indexOf("OpenShift") >= 0) {
            registry.auth_with_token = $scope.authMode === "token";
            if (registry.auth_with_token) {
              registry.auth_token = $scope.newRegistry.auth_token;
              registry.username = "";
              registry.password = "";
            } else {
              registry.auth_token = "";
              registry.username = $scope.newRegistry.username;
              registry.password = $scope.newRegistry.password;
            }
          }
          if (registry.registry_type.indexOf("Amazon") >= 0) {
            config = getRegistryConfig(
              registry,
              {accessKeyId, secretAccessKey}
            );
            $scope.newRegistry.aws_key.access_key_id = "****************";
            $scope.newRegistry.aws_key.secret_access_key = "****************";
          } else if (registry.registry_type.indexOf("Gitlab") >= 0) {
            config = getRegistryConfig(
              registry,
              {privateToken}
            );
            $scope.newRegistry.gitlab_private_token = "****************";
          } else {
            config = getRegistryConfig(registry);
          }
          if (
            ($scope.newRegistry.registry_type.toLowerCase().indexOf("google") >=
              0 &&
              $scope.newRegistry.jsonKey) ||
            $scope.newRegistry.registry_type.toLowerCase().indexOf("google") < 0
          ) {
            $http
              .post(REGISTRY_SCAN_URL, {
                config: config
              })
              .then(function() {
                RegistryScanFactory.addedRegistryName = $scope.newRegistry.name;
                $mdDialog.hide();
              })
              .catch(function(err) {
                console.warn(err);
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      err,
                      $translate.instant("general.FAILED_TO_ADD"),
                      false
                    )
                  );
                } else {
                  $mdDialog.hide();
                }
              });
          } else {
            form.jsonKey.$setValidity("required", false);
          }
        };
      }
    }

    EditDialogController.$inject = [
      "$scope",
      "$http",
      "$mdDialog",
      "$sanitize",
      "registry",
      "registryTypes",
      "hasWriteAuth",
      "authMode",
      "testRegistry"
    ];
    function EditDialogController(
      $scope,
      $http,
      $mdDialog,
      $sanitize,
      registry,
      registryTypes,
      hasWriteAuth,
      authMode,
      testRegistry
    ) {
      $scope.hasWriteAuth = hasWriteAuth;
      const initialRegistryData = function(registry) {
        registry.name = $sanitize(registry.name) || "";
        registry.filters = registry.filters.map(filter => {
          filter.name = $sanitize(filter.name);
          return filter;
        });
        registry.registry = $sanitize(registry.registry) || "";
        registry.jsonKey = $sanitize(registry.jsonKey) || "";
        registry.auth_token = $sanitize(registry.auth_token) || "";
        registry.username = $sanitize(registry.username) || "";
        registry.password = $sanitize(registry.password) || "";
        // registry.jfrog_aql = registry.jfrog_aql || false;
        registry.gitlab_external_url = $sanitize(registry.gitlab_external_url) || "";
        registry.gitlab_private_token = $sanitize(registry.gitlab_private_token) || "";
        registry.rescan_after_db_update = registry.rescan_after_db_update === null || typeof registry.rescan_after_db_update === "undefined" ? true : registry.rescan_after_db_update;
        registry.ibm_cloud_account = $sanitize(registry.ibm_cloud_account) || "";
        registry.aws_key = {
          id: registry.aws_key && registry.aws_key.id ? $sanitize(registry.aws_key.id) : "",
          region: registry.aws_key && registry.aws_key.region ? $sanitize(registry.aws_key.region) : "",
          access_key_id: registry.aws_key && registry.aws_key.access_key_id ? $sanitize(registry.aws_key.access_key_id) : "",
          secret_access_key: registry.aws_key && registry.aws_key.secret_access_key ? $sanitize(registry.aws_key.secret_access_key) : ""
        };
        registry.gcr_key = {
          json_key: registry.gcr_key && registry.gcr_key.json_key ? $sanitize(registry.gcr_key.json_key) : ""
        };
        registry.auth_with_token = registry.auth_with_token || false;
        registry.slideNum = 0;
        registry.interval = intervalMap4ScheduledScan;
        registry.scan_layers = registry.scan_layers || false;
        registry.filters = registry.filters.map((filter, index) => {
          filter.index = index;
          return filter;
        });
        return registry;
      };

      activate();

      function editRegistrySample(registry) {
        $scope.registrySample = "";
        switch (registry) {
          case "Amazon ECR Registry":
            $scope.registrySample = $translate.instant(
              "registry.AMAZON_URL_HINT"
            );
            break;
          case "Docker Registry":
            $scope.registrySample = $translate.instant(
              "registry.DOCKER_URL_HINT"
            );
            break;
          case "OpenShift Registry":
            $scope.registrySample = $translate.instant(
              "registry.OPENSHIFT_URL_HINT"
            );
            break;
          case "Red Hat Public Registry":
            $scope.registrySample = $translate.instant(
              "registry.REDHAT_URL_HINT"
            );
            break;
          case "Google Container Registry":
            $scope.registrySample = $translate.instant(
              "registry.GOOGLE_URL_HINT"
            );
            break;
          case "Azure Container Registry":
            $scope.registrySample = $translate.instant(
              "registry.AZURE_URL_HINT"
            );
            break;
          case "JFrog Artifactory":
            $scope.registrySample = $translate.instant(
              "registry.JFROG_URL_HINT"
            );
            break;
          case "Sonatype Nexus":
            $scope.registrySample = $translate.instant(
              "registry.SONATYPE_URL_HINT"
            );
            break;
          case "Gitlab":
            $scope.registrySample = $translate.instant(
              "registry.GITLAB_URL_HINT"
            );
            break;
          case "IBM Cloud Container Registry":
            $scope.registrySample = $translate.instant("registry.IBM.URL_HINT");
            break;
          default:
            $scope.registrySample = "";
        }
      }

      function activate() {
        let filtersBak = null;
        $scope.singleFilter = {
          value: "",
          index: -1
        };
        $scope.authMode = authMode;
        $scope.isOnTestView = false;
        $scope.isTesting = false;
        $scope.isPdfPreparing4TestInfo = false;
        $scope.progress4TestInfo = 0;
        $scope.registry = initialRegistryData(registry);
        $scope.testInfoGridOptions = RegistryScanFactory.getRegistryTestInfoGridOptions();
        let slideNum = 0;
        let interval = intervalMap4ScheduledScan;
        let getRoundValByMaxUnit = function(seconds) {
          const DENOMINATOR = {
            DAY: 24 * 60 * 60,
            HOUR: 60 * 60,
            TEN_MINUTE: 10 * 60,
            FIVE_MINUTE: 5 * 60
          };
          let days = Math.round(seconds / DENOMINATOR.DAY);
          let hours = Math.round(seconds / DENOMINATOR.HOUR);
          let tenMinutes = Math.round(seconds / DENOMINATOR.TEN_MINUTE);
          let fiveMinutes = Math.round(seconds / DENOMINATOR.FIVE_MINUTE);
          if (days > 0 && hours >= 24) return days * DENOMINATOR.DAY;
          if (hours > 0 && tenMinutes >= 6) return hours * DENOMINATOR.HOUR;
          if (tenMinutes > 0 && fiveMinutes > 1)
            return tenMinutes * DENOMINATOR.TEN_MINUTE;
          else return DENOMINATOR.FIVE_MINUTE;
        };
        if (
          $scope.registry.schedule &&
          $scope.registry.schedule.schedule === "periodical"
        ) {
          interval.forEach(function(intervalObj, currIndex) {
            if (
              intervalObj.seconds ===
              getRoundValByMaxUnit($scope.registry.schedule.interval)
            ) {
              slideNum = currIndex;
            }
          });
        }
        $scope.registry = Object.assign($scope.registry, {
          slideNum: slideNum,
          interval
        });
        $scope.registryTypes = registryTypes;
        $scope.registryType = registry.registry_type;
        if ($scope.registryType.indexOf("JFrog") >= 0) {
          $scope.jfrogModes = RegistryScanFactory.jfrogModes;
          $scope.registry.jfrog_mode = registry.jfrog_mode;
          console.log(registry.jfrog_mode);
        }

        editRegistrySample($scope.registryType);

        accessKeyId = "";
        secretAccessKey = "";
        privateToken = "";

        if ($scope.registryType.indexOf("Amazon") >= 0) {
          accessKeyId = $scope.registry.aws_key.access_key_id;
          secretAccessKey = $scope.registry.aws_key.secret_access_key;
          $scope.registry.aws_key.access_key_id = "****************";
          $scope.registry.aws_key.secret_access_key = "****************";
        }

        if ($scope.registryType.indexOf("Gitlab") >= 0) {
          privateToken = $scope.registry.gitlab_private_token;
          $scope.registry.gitlab_private_token = "****************";
        }

        if ($scope.registryType.toLowerCase().indexOf("google") >= 0) {
          $scope.registry.jsonKey = "*****************************";
        }

        $scope.cancel = function() {
          if ($scope.isOnTestView) {
            $scope.back2Config();
          } else {
            $mdDialog.cancel();
          }
        };

        $scope.move2Test = function() {
          filtersBak = angular.copy($scope.registry.filters);
          $scope.isOnTestView = true;
          $scope.testInfoGridOptions.overlayNoRowsTemplate =
            `<span class="text-muted">${$translate.instant("registry.START_TEST_HINT")}</span>`;
          $scope.testInfoGridOptions.api.setRowData();
        };

        $scope.setRegistryType = function(regType) {
          editRegistrySample(regType);
          $scope.registryType = regType;
        };

        $scope.changeJfrogMode = function(jfrogMode) {
          // if (jfrogMode !== "Subdomain") $scope.registry.jfrog_aql = false;
        };

        $scope.unmask = function(model) {
          switch (model) {
            case "access_key_id":
              $scope.registry.aws_key.access_key_id = accessKeyId;
              break;
            case "secret_access_key":
              $scope.registry.aws_key.secret_access_key = secretAccessKey;
              break;
            case "private_token":
              $scope.registry.gitlab_private_token = privateToken;
              break;
          }
        };

        $scope.mask = function(model) {
          switch (model) {
            case "access_key_id":
              accessKeyId = $scope.registry.aws_key.access_key_id;
              $scope.registry.aws_key.access_key_id = "****************";
              break;
            case "secret_access_key":
              secretAccessKey = $scope.registry.aws_key.secret_access_key;
              $scope.registry.aws_key.secret_access_key = "****************";
              break;
            case "private_token":
              privateToken = $scope.registry.gitlab_private_token;
              $scope.registry.gitlab_private_token = "****************";
              break;
          }
        };

        $scope.checkEmpty = function(str, form) {
          if (typeof str === "undefined" || str.length === 0) {
            form.jsonKey.$setValidity("required", false);
          } else {
            form.jsonKey.$setValidity("required", true);
          }
        };

        $scope.preventFormSubmit = function(event) {
          if (event.which === 13) {
            event.preventDefault();
            $scope.editFilter($scope.singleFilter);
          }
        };

        const initializeTagStyle = function() {
          let allTagsElem = angular.element("ul.tag-list > li");
          for (let i = 0; i < allTagsElem.length; i++) {
            allTagsElem[i].classList.remove("selected-tag");
            allTagsElem[i].classList.add("tag-item");
          }
        };

        const initializeSpecificTagStyle = function(insertIndex) {
          let elem = angular.element("ul.tag-list > li")[insertIndex];
          elem.classList.remove("selected-tag");
          elem.classList.add("tag-item");
        };

        const setFocusedTagStyle = function(focusedIndex) {
          let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
          tagElem.classList.remove("tag-item");
          tagElem.classList.add("selected-tag");
        };

        $scope.checkDuplicated = function() {
          let elem = angular.element("#tagEditor");
          if ($scope.registry.filters) {
            for (let i = 0; i < $scope.registry.filters.length; i++) {
              if (
                $scope.singleFilter.value === $scope.registry.filters[i].name &&
                $scope.singleFilter.index !== $scope.registry.filters[i].index
              ) {
                elem[0].classList.remove("ng-valid");
                elem[0].classList.add("ng-invalid");
                $scope.isInvalidTag = true;
                return;
              }
            }
          }
          elem[0].classList.remove("ng-invalid");
          elem[0].classList.add("ng-valid");
          $scope.isInvalidTag = false;
        };

        $scope.editFilter = function(singleFilter) {
          if (!$scope.registry.filters)  $scope.registry.filters = [];
          let insertIndex = singleFilter.index === -1 ? $scope.registry.filters.length : singleFilter.index;
          let insertOrReplace = singleFilter.index === -1 ? 0 : 1;
          $scope.registry.filters.splice(insertIndex, insertOrReplace, {
            name: singleFilter.value,
            index: insertIndex
          });
          $scope.singleFilter = {
            value: "",
            index: -1
          };
          $scope.isShowingEditFilter = false;
          initializeSpecificTagStyle(insertIndex);
        };

        $scope.tagAdding = function(tag) {
          let insertIndex = $scope.registry.filters.length;
          tag.index = insertIndex;
          $scope.isShowingEditFilter = false;
          initializeTagStyle();
        }

        $scope.showTagDetail = function(tag) {
          initializeTagStyle();
          setFocusedTagStyle(tag.index);
          $scope.singleFilter.value = tag.name;
          $scope.singleFilter.index = tag.index;
          $scope.isShowingEditFilter = true;
          $scope.isInvalidTag = false;
          $timeout(() => {
            let tagEditorElem = angular.element("#tagEditor");
            tagEditorElem.focus();
          }, 200);
        };

        $scope.tagRemoving = function(tag) {
          $scope.registry.filters.forEach(filter => {
            if (tag.index < filter.index) {
              filter.index -= 1;
            }
          });
          $timeout(() => {
            if (!$scope.registry.filters)  $scope.registry.filters = [];
            $scope.isShowingEditFilter = false;
            initializeTagStyle();
          }, 200);
        };

        $scope.setPasswordFn = function() {
          $scope.registryPassword = "********";
        };

        const startTestRegistry = function(config) {
          testRegistry.start($scope, config);
        };

        const stopTestRegistry = function(registryName) {
          testRegistry.stop($scope, registryName);
        };

        const setRegistryData = function(registryMode, form) {
          if (!(typeof form.registryPassword === "undefined")) {
            if (form.registryPassword.$dirty) {
              registryMode.password = form.registryPassword.$viewValue;
            } else {
              registryMode.password = null;
            }
          }

          registryMode.registry_type = $scope.registryType;
          return registryMode;
        };

        $scope.testRegistry = function(registryMode, form, isTesting) {
          if (isTesting) {
            if ($scope.isOnTestView) {
              stopTestRegistry(registry.name);
            } else {
              $scope.isOnTestView = true;
            }
          } else {
            let config = null;
            registry = setRegistryData(registryMode, form);
            if (registry.registry_type.indexOf("Amazon") >= 0) {
              if (!form.access_key_id.$dirty) {
                accessKeyId = null;
              }

              if (!form.secret_access_key.$dirty) {
                secretAccessKey = null;
              }

              config = getRegistryConfig(
                registryMode,
                {accessKeyId, secretAccessKey}
              );
              $scope.registry.aws_key.access_key_id = "****************";
              $scope.registry.aws_key.secret_access_key = "****************";
            } else if (registry.registry_type.indexOf("Gitlab") >= 0) {
              if (!form.gitPrivateToken.$dirty) {
                privateToken = null;
              }

              config = getRegistryConfig(
                registryMode,
                {privateToken}
              );
              $scope.registry.gitlab_private_token = "****************";
            } else {
              config = getRegistryConfig(registryMode);
            }
            if (
              $scope.registry.registry_type.toLowerCase().indexOf("google") >= 0
            ) {
              config.gcr_key = {};
              config.gcr_key.json_key = form.jsonKey.$dirty
                ? registry.jsonKey
                : null;
            }
            console.log("edit config: ", config);
            startTestRegistry(config);
          }
        };

        $scope.back2Config = function() {
          $scope.isOnTestView = false;
          $scope.registry.filters = angular.copy(filtersBak);
          if (!$scope.isTestDone) {
            stopTestRegistry($scope.registry.name);
          }
          $scope.isTestDone = false;
        };

        $scope.copyFilters2Config = function() {
          filtersBak = angular.copy($scope.registry.filters);
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.success(
            $translate.instant("registry.COPIED")
          );
        };
        $scope.downloadTestInfoTxt = function() {
        // $scope.downloadTestInfoPdf = function() {
          testRegistry.export($scope);
        };

        $scope.updateRegistry = function(registryMode, form) {
          if (!(typeof form.registryPassword === "undefined")) {
            if (form.registryPassword.$dirty) {
              registryMode.password = form.registryPassword.$viewValue;
            } else {
              registryMode.password = null;
            }
          }

          let config = null;
          registryMode.registry_type = $scope.registryType;

          if (registry.registry_type.indexOf("OpenShift") >= 0) {
            registry.auth_with_token = $scope.authMode === "token";
            if (registry.auth_with_token) {
              registry.auth_token = form.ocAuthToken.$dirty
                ? $scope.registry.auth_token
                : null;
              registry.username = "";
              registry.password = "";
            } else {
              registry.auth_token = "";
              registry.username = $scope.registry.username;
              registry.password = form.registryPassword.$dirty
                ? $scope.registry.password
                : null;
            }
          }

          if (registry.registry_type.indexOf("Amazon") >= 0) {
            if (!form.access_key_id.$dirty) {
              accessKeyId = null;
            }

            if (!form.secret_access_key.$dirty) {
              secretAccessKey = null;
            }

            config = getRegistryConfig(
              registryMode,
              {accessKeyId, secretAccessKey}
            );
            $scope.registry.aws_key.access_key_id = "****************";
            $scope.registry.aws_key.secret_access_key = "****************";
          } else if (registry.registry_type.toLowerCase().indexOf("gitlab") >= 0) {
            if (!form.gitPrivateToken.$dirty) {
              privateToken = null;
            }

            config = getRegistryConfig(
              registryMode,
              {privateToken}
            );
            $scope.registry.gitlab_private_token = "****************";
          } else {
            config = getRegistryConfig(registryMode);
          }

          if (
            $scope.registry.registry_type.toLowerCase().indexOf("google") >= 0
          ) {
            config.gcr_key = {};
            config.gcr_key.json_key = form.jsonKey.$dirty
              ? registry.jsonKey
              : null;
          }

          // console.log("config:",config);
          $http
            .patch(REGISTRY_SCAN_URL, {
              wrap: { config: config },
              name: registry.name
            })
            .then(function() {
              $mdDialog.hide();
            })
            .catch(function(err) {
              console.warn(err);
              if (USER_TIMEOUT.indexOf(err.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(
                    err,
                    $translate.instant("general.FAILED_TO_UPDATE"),
                    false
                  )
                );
              } else {
                $mdDialog.hide();
              }
            });
        };
      }
    }

    ShowLayersController.$inject = [
      "$scope",
      "$http",
      "$mdDialog",
      "$timeout",
      "$filter",
      "$window",
      "layers",
      "parentInfo",
      "CveProfileFactory",
      "AuthorizationFactory",
      "ComplianceFactory"
    ];
    function ShowLayersController(
      $scope,
      $http,
      $mdDialog,
      $timeout,
      $filter,
      $window,
      layers,
      parentInfo,
      CveProfileFactory,
      AuthorizationFactory,
      ComplianceFactory
    ) {
      activate();

      function activate() {
        $scope.cancel = function() {
          $mdDialog.cancel();
        };
        $scope.searchImage = "";
        $scope.isVulsAuthorized = AuthorizationFactory.getDisplayFlag("vuls_profile");
        $scope.isWriteVulsAuthorized = AuthorizationFactory.getDisplayFlag("write_vuls_profile");
        $scope.isAccepted = true;
        $scope.cve = [];
        $scope.hideSafeModules = false;
        $scope.isShowingAccepted = false;
        $scope.onCompliance = false;
        $scope.isSimpleButton = $window.innerWidth < 1000;
        $scope.hasLayers = layers.length > 0;
        $scope.layersGridOptions = RegistryScanFactory.layersGridOptions;
        $scope.layersGridOptions.onRowClicked = onLayerChanged;
        $scope.layerVulsGridOptions = RegistryScanFactory.layerVulsGridOptions;
        $scope.layerVulsGridOptions.onRowClicked = onLayerVulChanged;
        ComplianceFactory.prepareGrids();
        $scope.complianceGridOptions = ComplianceFactory.getGridOptions();
        $scope.complianceGridOptions.onSelectionChanged = onComplianceChanged;
        $scope.moduleGridOptions = RegistryScanFactory.getModuleGridOptions();
        $scope.moduleGridOptions.onSelectionChanged = onModuleChanged;
        $scope.moduleCveGridOptions = RegistryScanFactory.getModuleCveGridOptions();
        $scope.madalTitle = `${parentInfo.registry}${parentInfo.repository}`;
        $scope.madelTitleWithTag = `${parentInfo.registry}${parentInfo.repository}:${parentInfo.tag}`;
        $scope.cveDBVersion = `${$translate.instant(
          "dashboard.heading.CVE_DB_VERSION"
        )}: ${parentInfo.cveDBVersion}`;
        $scope.cveDBCreateTime = `${$translate.instant(
          "registry.CVE_DB_DATE"
        )}: ${$filter("date")(
          parentInfo.cveDBCreateTime,
          "MMM dd, y HH:mm:ss"
        )}`;
        $scope.onFilterChangedOnImage = function(tabIndex, searchImage) {
          switch (tabIndex) {
            case 0:
              $scope.layerVulsGridOptions.api.setQuickFilter(searchImage);
              break;
            case 1:
              $scope.complianceGridOptions.api.setQuickFilter(searchImage);
              break;
            case 2:
              $scope.moduleGridOptions.api.setQuickFilter(searchImage);
              break;
          }
        };

        let convertedLayers = layers.map(function(layer, index) {
          layer.digestFull = layer.digest;
          if (index < layers.length - 1) {
            layer.digest = `&#x2523;&#x0020;&#x0020;${Utils.shortenString(
              layer.digest.substring(7),
              15
            )}`;
          } else {
            layer.digest = `&#x2517;&#x0020;&#x0020;${Utils.shortenString(
              layer.digest.substring(7),
              15
            )}`;
          }
          return layer;
        });
        let vulMap = Utils.groupBy(parentInfo.imageCVEs, "name");

        angular.element($window).bind("resize", function () {
          $scope.isSimpleButton = $window.innerWidth < 1000;
          $scope.$digest();
        });

        const prepareLayerCsvData = function(layerCves) {
          return layerCves
            .map(layerCve => {
              if (
                layerCve.vulnerabilities &&
                layerCve.vulnerabilities.length > 0
              ) {
                return layerCve.vulnerabilities.map((vulnerability, index) => {
                  if (index === 0) {
                    return Object.assign(
                      { digest: layerCve.digestFull },
                      vulnerability
                    );
                  } else {
                    return Object.assign({ digest: "" }, vulnerability);
                  }
                });
              }
            })
            .filter(layerCve => !!layerCve)
            .flatMap(x => x);
        };

        const concatCmds = function(layers) {
          let imageCmds = "";
          layers.forEach(function(layer) {
            imageCmds += `${layer.cmds}<br/>`;
          });
          return imageCmds;
        };
        convertedLayers.unshift({
          digestFull: parentInfo.digest,
          digest: Utils.shortenString(parentInfo.digest.substring(7), 15),
          cmds: concatCmds(layers),
          vulnerabilities: parentInfo.imageCVEs
        });
        console.log(convertedLayers);
        $scope.cves = convertedLayers[0].vulnerabilities;
        $scope.cveByLayer = convertedLayers.slice(1);
        $timeout(function() {
          $scope.layersGridOptions.api.setRowData(convertedLayers);
          $scope.layersGridOptions.api.getRowNode(0).setSelected(true);
          $timeout(function() {
            onLayerChanged();
          }, 100);
        }, 200);

        $scope.openComplianceTab = function() {
          let compliancelist = ComplianceFactory.remodelCompliance(parentInfo.imageCompliance);
          $scope.complianceGridOptions.api.setRowData(compliancelist);
          $timeout(function() {
            if (parentInfo.imageCompliance.length > 0) {
              $scope.complianceGridOptions.api.getRowNode(0).setSelected(true);
            }
            $scope.complianceGridOptions.api.sizeColumnsToFit();
            $scope.$apply();
          }, 100);
        };

        function onComplianceChanged() {
          let selectedRow = $scope.complianceGridOptions.api.getSelectedRows()[0];
          $scope.complianceName = selectedRow.test_number;
          $scope.remediation = selectedRow.remediation || "";
          $scope.description = selectedRow.description || "";
          $scope.evidence = selectedRow.evidence || "";
          $scope.messages = Array.isArray(selectedRow.message) ? selectedRow.message.join("\n") : "";
          $scope.$apply();
        }

        function onModuleChanged() {
          let selectedRow = $scope.moduleGridOptions.api.getSelectedRows()[0];
          if (selectedRow.cves) {
            selectedRow.cves = selectedRow.cves.map((cve) => {
              if (vulMap[cve.name]) {
                cve.fixed_version = vulMap[cve.name][0].fixed_version;
                return cve;
              } else {
                return cve;
              }
            });
          }
          $scope.moduleCveGridOptions.api.setRowData(selectedRow.cves);
          $timeout(function() {
            if (selectedRow.cves && selectedRow.cves.length > 0) {
              $scope.moduleCveGridOptions.api.getRowNode(0).setSelected(true);
            }
            $scope.moduleCveGridOptions.api.sizeColumnsToFit();
            $scope.$apply();
          }, 100);
        }

        const renderTopRiskyModulePieChart = function(topModules, others) {
          $scope.moduleVulPieData = topModules.map(module => module.cves ? module.cves.length: 0);
          $scope.moduleVulPieData.push(others);
          console.log("$scope.moduleVulPieData: ", $scope.moduleVulPieData);
          $scope.hasModuleVuls = $scope.moduleVulPieData.reduce(((isReady, curr) => {return isReady || curr > 0;}), false);
          $scope.moduleVulPieLabels = topModules.map(module => module.name);
          $scope.moduleVulPieLabels.push($translate.instant("dashboard.body.panel_title.OTHERS"));
          let moduleVulPieColors = [
            "#ef5350",
            "#f77472",
            "#fc8886",
            "#ffc6c4",
            "#ffdddb",
            "#c7c7c7"
          ];
          $scope.moduleVulPieColors = moduleVulPieColors.slice(0, $scope.moduleVulPieData.length - 1);
          $scope.moduleVulPieColors.push(moduleVulPieColors[5]);
          $scope.moduleVulPieOptions = {
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

        const renderTopRiskyModuleStackedBarChart = function(topModules) {
          $scope.moduleStackedBarData = [
            [], [], []
          ];
          topModules.forEach(module => {
            if (module.cves) {
              $scope.moduleStackedBarData[0].push(
                module.cves.filter(cve => cve.status.toLowerCase() === CVE_ST.FIXABLE.toLowerCase()).length
              );
              $scope.moduleStackedBarData[1].push(
                module.cves.filter(cve => cve.status.toLowerCase() === CVE_ST.UNPATCHED.toLowerCase()).length
              );
              $scope.moduleStackedBarData[2].push(
                module.cves.filter(cve => cve.status.toLowerCase() === CVE_ST.WILL_NOT_FIX.toLowerCase()).length
              );
            } else {
              $scope.moduleStackedBarData[0].push(0);
              $scope.moduleStackedBarData[1].push(0);
              $scope.moduleStackedBarData[2].push(0);
            }
          });

          console.log("chart data: ", $scope.moduleStackedBarData);
          $scope.moduleStackedBarLabels = topModules.map(module => Utils.shortenString(module.name, 46));
          $scope.moduleStackedBarColors = ["#d32f2f", "#ff7101", "#4caf50"];
          $scope.moduleStackedBarSerie = [
            $translate.instant("registry.gridHeader.FIXABLE"),
            $translate.instant("registry.gridHeader.UNPATCHED"),
            $translate.instant("registry.gridHeader.WILL_NOT_FIX")
          ];
          $scope.moduleStackedBarOptions = {
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
                      if (value % 1 === 0) return value;
                    },
                  },
                },
              ],
              yAxes: [
                {
                  stacked: true,
                  barThickness: 8,
                  ticks: {
                    beginAtZero: true
                  },
                },
              ]
            },
          };
          $scope.moduleStackedBarOverride = [
            {
              borderWidth: 1
            },
            {
              borderWidth: 1
            },
            {
              borderWidth: 1
            },
            {
              borderWidth: 1
            }
          ];
        };

        const renderModuleCharts = function(modules) {
          let topModules = angular.copy(modules).sort((m1, m2) => {
            let vul1 = m1.cves ? m1.cves.length : 0;
            let vul2 = m2.cves ? m2.cves.length : 0;
            return vul2 - vul1;
          }).slice(0, 5).filter(module => module.cves && module.cves.length > 0);
          console.log("topModules", topModules);
          let totalTop = topModules && topModules.length > 0 ?
            topModules.map(module => {
              return module.cves ? module.cves.length : 0;
            }).reduce((sum, vul) => {
              return sum + parseInt(vul);
            }) :
            0;
          console.log("totalTop: ", totalTop);
          let totalCvesCnt = modules.map(module => {
            return module.cves ? module.cves.length : 0;
          }).reduce((sum, vul) => {
            return sum + parseInt(vul);
          });
          console.log("totalCvesCnt: ", totalCvesCnt);
          renderTopRiskyModulePieChart(topModules, totalCvesCnt - totalTop);
          renderTopRiskyModuleStackedBarChart(topModules);
        };

        $scope.openModuleTab = function() {
          $scope.moduleGridOptions.api.setRowData(parentInfo.modules);
          renderModuleCharts(parentInfo.modules);
          $timeout(function() {
            if (parentInfo.modules.length > 0) {
              $scope.moduleGridOptions.api.getRowNode(0).setSelected(true);
            }
            $scope.moduleGridOptions.api.sizeColumnsToFit();
            $scope.$apply();
          }, 100);
        };

        $scope.toggleSafeModule = function(hideSafeModules) {
          $scope.hideSafeModules = hideSafeModules;
          if (hideSafeModules) {
            $scope.moduleGridOptions.api.setRowData(
              parentInfo.modules.filter(module => module.cves && module.cves.length > 0)
            );
          } else {
            console.log("all: ", parentInfo.modules);
            $scope.moduleGridOptions.api.setRowData(parentInfo.modules);
          }
        };

        function onLayerChanged() {
          let selectedRows = $scope.layersGridOptions.api.getSelectedRows();
          $scope.cmds = selectedRows[0].cmds;
          let vulsByLayer = selectedRows[0].vulnerabilities;
          $scope.layerVulsGridOptions.api.setRowData(vulsByLayer);
          if (vulsByLayer.length > 0) {
            let node = $scope.layerVulsGridOptions.api.getRowNode(0);
            node.setSelected(true);
            $timeout(function() {
              onLayerVulChanged();
              $scope.layersGridOptions.api.sizeColumnsToFit();
              $scope.layerVulsGridOptions.api.sizeColumnsToFit();
              $scope.$apply();
            }, 100);
          } else {
            $timeout(function() {
              onLayerVulChanged();
              $scope.$apply();
            }, 100);
          }
        }

        function onLayerVulChanged() {
          let selectedRows = $scope.layerVulsGridOptions.api.getSelectedRows();
          $scope.cve = selectedRows[0];
          $scope.isAccepted = $scope.cve.tags && $scope.cve.tags.some(tag => tag === "accepted");
          if (selectedRows.length > 0) {
            $scope.title = selectedRows[0].name;
            $scope.content = selectedRows[0].description;
            $scope.link = selectedRows[0].link;
          } else {
            $scope.title = "";
            $scope.content = "";
            $scope.link = "";
          }
          $scope.$apply();
        }

        $scope.exportCsv = function() {
          console.log("downloading csv");

          if ($scope.cves && $scope.cves.length > 0) {
            const title = `${$scope.madelTitleWithTag} | Image Id: ${parentInfo.imageId} | ${$scope.cveDBVersion} | ${$scope.cveDBCreateTime.replace(/\,/g, " ")} | OS: ${parentInfo.base_os}`;
            let cves4Csv = angular.copy($scope.cves);
            cves4Csv = cves4Csv.map(function(cve) {
              cve.description = `${cve.description.replace(/\"/g, "'")}`;
              cve.tags = cve.tags || "";
              cve.last_modified_timestamp = new Date(
                cve.last_modified_timestamp * 1000
              );
              cve.published_timestamp = new Date(
                cve.published_timestamp * 1000
              );
              return cve;
            });
            let csv = Utils.arrayToCsv(cves4Csv, title);
            let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            let filename;
            filename = `vulnerabilities-${$scope.madelTitleWithTag}_${Utils.parseDatetimeStr(new Date())}.csv`;
            FileSaver.saveAs(blob, filename);
          }
        };

        $scope.exportLayerCsv = function() {
          let cveByLayer = prepareLayerCsvData($scope.cveByLayer);
          if (cveByLayer.length > 0) {
            const title = `${$scope.madelTitleWithTag} | Image Id: ${parentInfo.imageId} | ${$scope.cveDBVersion} | ${$scope.cveDBCreateTime.replace(/\,/g, " ")} | OS: ${parentInfo.base_os}`;
            let cveByLayer4Csv = angular.copy(cveByLayer);
            cveByLayer4Csv = cveByLayer4Csv.map(function(cve) {
              cve.description = `${cve.description.replace(/\"/g, "'")}`;
              cve.tags = cve.tags || "";
              cve.last_modified_timestamp = new Date(
                cve.last_modified_timestamp * 1000
              );
              cve.published_timestamp = new Date(
                cve.published_timestamp * 1000
              );
              return cve;
            });
            let csv = Utils.arrayToCsv(
              cveByLayer4Csv,
              title
            );
            let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            let filename;
            filename = `vulnerabilities-${$scope.madelTitleWithTag}-by layer_${Utils.parseDatetimeStr(new Date())}.csv`;
            FileSaver.saveAs(blob, filename);
          }
        };

        $scope.exportComplianceCsv = function() {
          let compliance4Csv = angular.copy(parentInfo.imageCompliance);
          const title = `${$scope.madelTitleWithTag} | Image Id: ${parentInfo.imageId} | OS: ${parentInfo.base_os}`;
          compliance4Csv = compliance4Csv.map(function(compliance) {
            if (compliance.description) compliance.description = compliance.description.replace(/\"/g, "'");
            if (compliance.remediation) compliance.remediation = compliance.remediation.replace(/\"/g, "'");
            if (compliance.evidence) compliance.evidence = compliance.evidence.replace(/\"/g, "'");
            if (compliance.message) compliance.message = compliance.message.join("\n").replace(/\"/g, "'");
            console.log(compliance)
            return compliance;
          });
          let compliance = Utils.arrayToCsv(compliance4Csv, title);
          let blob = new Blob([compliance], { type: "text/csv;charset=utf-8" });
          let filename;
          filename = `compliance-${$scope.madelTitleWithTag}_${Utils.parseDatetimeStr(new Date())}.csv`;
          FileSaver.saveAs(blob, filename);
        };

        $scope.exportModuleCsv = function() {
          let module4Csv = angular.copy(parentInfo.modules);
          const title = `${$scope.madelTitleWithTag} | Image Id: ${parentInfo.imageId} | OS: ${parentInfo.base_os}`;
          module4Csv = module4Csv.map(module => {
            return {
              name: module.name,
              source: module.source,
              version: module.version,
              count_of_vulnerabilies: module.cves ?
                $translate.instant("registry.gridHeader.FIXABLE") + ": " +
                module.cves.filter(cve => cve.status.toLowerCase() === CVE_ST.FIXABLE.toLowerCase()).length + "/" +
                $translate.instant("registry.gridHeader.TOTAL") + ": " +  module.cves.length :
                "",
              vulnerabilites: module.cves ?
                `'${module.cves.map(cve => {
                  if (vulMap[cve.name]) {
                    let fixed_version = vulMap[cve.name][0].fixed_version;
                    return `${cve.name}(${cve.status}${fixed_version.length > 0 ? `-${fixed_version}` : ""})`;
                  } else {
                    return `${cve.name}(${cve.status})`;
                  }
                }).join(", ")}'`:
                ""
            };
          });
          let modules = Utils.arrayToCsv(module4Csv, title);
          let blob = new Blob([modules], { type: "text/csv;charset=utf-8" });
          let filename;
          filename = `modules-${$scope.madelTitleWithTag}_${Utils.parseDatetimeStr(new Date())}.csv`;
          FileSaver.saveAs(blob, filename);
        };

        const getImageAndLayerInfo =function(isShowingAccepted, registryName, imageId) {
          let selectedNodeIndex = $scope.layersGridOptions.api.getSelectedNodes()[0].childIndex;
          $http
            .get(REGISTRY_SCAN_IMAGE_URL, {
              params: {
                name: registryName,
                imageId: imageId,
                show: isShowingAccepted ? "accepted" : null
              }
            })
            .then(function(response) {
              let imageCVEs = response.data.report.vulnerabilities;
              $scope.cves = imageCVEs;
              $http
                .get(LAYER_URL, {
                  params: {
                    name: registryName,
                    imageId: imageId,
                    show: isShowingAccepted ? "accepted" : null
                  }
                })
                .then(function(response) {
                  console.log(response.data.report.layers);
                  let convertedLayers = response.data.report.layers.map(function(layer, index) {
                    layer.digestFull = layer.digest;
                    if (index < layers.length - 1) {
                      layer.digest = `&#x2523;&#x0020;&#x0020;${Utils.shortenString(
                        layer.digest.substring(7),
                        15
                      )}`;
                    } else {
                      layer.digest = `&#x2517;&#x0020;&#x0020;${Utils.shortenString(
                        layer.digest.substring(7),
                        15
                      )}`;
                    }
                    return layer;
                  });
                  convertedLayers.unshift({
                    digestFull: parentInfo.digest,
                    digest: Utils.shortenString(parentInfo.digest.substring(7), 15),
                    cmds: concatCmds(layers),
                    vulnerabilities: imageCVEs
                  });
                  $scope.cveByLayer = convertedLayers.slice(1);
                  $scope.layersGridOptions.api.setRowData(convertedLayers);
                  $timeout(function() {
                    $scope.layersGridOptions.api.getRowNode(selectedNodeIndex).setSelected(true);
                    $timeout(function() {
                      onLayerChanged();
                    }, 200);
                  }, 200);
                })
                .catch(function(err) {
                  console.warn(err);
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      err,
                      $translate.instant("registry.message.GET_LAYERS_ERR"),
                      false
                    )
                  );
                });
            })
            .catch(function(err) {
              console.warn(err);
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  err,
                  $translate.instant("registry.message.GET_CVE_ERR"),
                  false
                )
              );
            });
        };

        $scope.toggleShowingAcceptedVuls = function(isShowingAccepted) {
          $scope.isShowingAccepted = !isShowingAccepted;
          getImageAndLayerInfo($scope.isShowingAccepted, parentInfo.name, parentInfo.imageId);
        };

        $scope.acceptVulnerability = function(event, data) {
          let payload = {
            config: {
              entries: [
                {
                  name: data.name,
                  days: 0,
                  comment: `Vulnerability was accepted on ${parentInfo.repository} at ${$filter("date")(new Date(), "MMM dd, y HH:mm:ss")} from Registries page`,
                  images: [`${parentInfo.repository}:${parentInfo.tag}`],
                  domains: []
                }
              ],
              name: "default"
            }
          };

          CveProfileFactory.addCveProfile(payload)
          .then((res) => {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("cveProfile.msg.ADD_OK"));
            $timeout(() => {
              getImageAndLayerInfo(false, parentInfo.name, parentInfo.imageId);
            }, 2000);
          })
          .catch((err) => {
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("cveProfile.msg.ADD_NG"), false)
              );
            }
          });
        };

        $scope.showRemediation = function (event, compliance) {
          event.stopPropagation();
          $scope.complianceName = compliance.name;
          $scope.remediation = compliance.remediation;
          $scope.onCompliance = true;
          $timeout(function () {
            $scope.onCompliance = false;
          }, 10000);
        };

        $scope.closeRemediation = function () {
          $scope.onCompliance=false;
        };
      }
    }
  }
})();
