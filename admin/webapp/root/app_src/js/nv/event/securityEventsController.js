(function() {
  "use strict";

  angular
    .module("app.assets")
    .controller("SecurityEventsController", SecurityEventsController)
    .directive("twoWayInfiniteScroll", TwoWayInfiniteScroll);

  SecurityEventsController.$inject = [
    "$rootScope",
    "$scope",
    "$filter",
    "$http",
    "$translate",
    "$timeout",
    "$window",
    "$sce",
    "$compile",
    "Utils",
    "FileSaver",
    "Blob",
    "Alertify",
    "SecurityEventsFactory",
    "ContainerFactory",
    "$interval",
    "$controller",
    "$state",
    "$mdDialog",
    "$stateParams",
    "$sanitize",
    "AuthorizationFactory",
    "NetworkFactory"
  ];

  function SecurityEventsController(
    $rootScope,
    $scope,
    $filter,
    $http,
    $translate,
    $timeout,
    $window,
    $sce,
    $compile,
    Utils,
    FileSaver,
    Blob,
    Alertify,
    SecurityEventsFactory,
    ContainerFactory,
    $interval,
    $controller,
    $state,
    $mdDialog,
    $stateParams,
    $sanitize,
    AuthorizationFactory,
    NetworkFactory
  ) {
    //=======For preloading English translation file only=====
    $translate.instant("general.VERSION", {}, "", "en");
    //=======For preloading English translation file only=====
    let filter = "";
    const run = function(fn) {
      try {
        return new Worker(URL.createObjectURL(new Blob(["(" + fn + ")()"])));
      } catch (err) {
        console.log(err);
      }
    };

    const resource = {
      editRule: {
        global: 2,
        namespace: 2
      }
    };

    $scope.isEditRuleAuthorized = AuthorizationFactory.getDisplayFlag("review_rule");
    SecurityEventsFactory.isUpdateRuleAuthorized = AuthorizationFactory.getDisplayFlag("update_rule");

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let timer = null;
      let timer2 = null;
      $scope.progress = 0;
      $scope.begin = 0;
      $scope.page = 1;
      $scope.openedIndex = -1;
      $scope.openedPage = -1;
      $scope.limit = 30;
      $scope.onAdvFilter = false;
      $scope.levelFilter = {
        isFilteringCritical: false,
        isFilteringWarning: false,
        isFilteringInfo: false
      };
      $scope.unit = {
        isFilteringHost: false,
        isFilteringContainer: false
      };
      $scope.media = {
        isFilteringNetwork: false,
        isFilteringPrivilege: false,
        isFilteringFile: false,
        isFilteringTunnel: false,
        isFilteringProcess: false,
        isFilteringPackage: false
      };
      $scope.others = {
        isFilteringOther: false
      };
      $scope.LABELS = SecurityEventsFactory.LABELS;
      $scope.REPORT_TABLE_ROW_LIMIT = REPORT_TABLE_ROW_LIMIT;
      $scope.isAdvFilterInUse = false;
      $scope.isFullscreen = false;
      $scope.onContainerDetail = false;
      let hosts = new Set();
      let sources = new Set();
      let destinations = new Set();
      $scope.autocompleteHosts = [];
      $scope.autocompleteSources = [];
      $scope.autocompleteDestinations = [];
      $scope.selectedDomains = [];
      $scope.modeHtml = "";

      ContainerFactory.prepareProcessGrids();
      $scope.procGridOptions = ContainerFactory.getProcessGridOptions();

      let $win = $($window);

      const getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("securityEvent.COUNT_POSTFIX")
        );
      };

      let prevFilterObj = {
        isFilteringInfo: false,
        isFilteringWarning: false,
        isFilteringCritical: false,
        isFilteringHost: false,
        isFilteringContainer: false,
        isFilteringNetwork: false,
        isFilteringPrivilege: false,
        isFilteringFile: false,
        isFilteringTunnel: false,
        isFilteringProcess: false,
        isFilteringPackage: false,
        isFilteringOther: false,
        selectedHost: "",
        selectedSource: "",
        selectedDestination: "",
        otherKeyword: "",
        excludedKeyword: "",
        selectedDomains: []
      };

      const found = $translate.instant("enum.FOUND");

      $scope.cancelAdvFilter = function() {
        $timeout(function() {
          _recoverPrevFilter();
        }, 1000);
      };

      $scope.resetAdvFilter = function() {
        _resetFilter();
        $timeout(function() {
          $scope.onFilterChanged('adv', $scope.otherKey, $scope.excludedKey);
        }, 400);
      };

      const _recoverPrevFilter = function() {
        $scope.levelFilter.isFilteringInfo = prevFilterObj.isFilteringInfo;
        $scope.levelFilter.isFilteringWarning =
          prevFilterObj.isFilteringWarning;
        $scope.levelFilter.isFilteringCritical =
          prevFilterObj.isFilteringCritical;
        $scope.unit.isFilteringHost = prevFilterObj.isFilteringHost;
        $scope.unit.isFilteringContainer = prevFilterObj.isFilteringContainer;
        $scope.media.isFilteringNetwork = prevFilterObj.isFilteringNetwork;
        $scope.media.isFilteringPrivilege = prevFilterObj.isFilteringPrivilege;
        $scope.media.isFilteringFile = prevFilterObj.isFilteringFile;
        $scope.media.isFilteringTunnel = prevFilterObj.isFilteringTunnel;
        $scope.media.isFilteringProcess = prevFilterObj.isFilteringProcess;
        $scope.media.isFilteringPackage = prevFilterObj.isFilteringPackage;
        $scope.others.isFilteringOther = prevFilterObj.isFilteringOther;
        $scope.searchTextHost = prevFilterObj.selectedHost;
        $scope.searchTextSource = prevFilterObj.selectedSource;
        $scope.searchTextDestination = prevFilterObj.selectedDestination;
        $scope.otherKey = prevFilterObj.otherKeyword;
        $scope.excludedKey = prevFilterObj.excludedKeyword;
        $scope.selectedDomains = prevFilterObj.selectedDomains;
      };

      const _resetFilter = function() {
        $scope.levelFilter.isFilteringInfo = false;
        $scope.levelFilter.isFilteringWarning = false;
        $scope.levelFilter.isFilteringCritical = false;
        $scope.unit.isFilteringHost = false;
        $scope.unit.isFilteringContainer = false;
        $scope.media.isFilteringNetwork = false;
        $scope.media.isFilteringPrivilege = false;
        $scope.media.isFilteringFile = false;
        $scope.media.isFilteringTunnel = false;
        $scope.media.isFilteringProcess = false;
        $scope.media.isFilteringPackage = false;
        $scope.others.isFilteringOther = false;
        $scope.searchTextHost = "";
        $scope.searchTextSource = "";
        $scope.searchTextDestination = "";
        $scope.selectedDomains = [];
        $scope.otherKey = "";
        $scope.excludedKey = "";
      }

      const generatePdf4SecEvents = function() {
        console.log("Worker is starting...");
        const showProgress = (function(self) {
          return function(progress) {
            if (Math.floor(progress * 100000) % 1000 === 0) {
              self.postMessage({progress: progress});
            }
          };
        })(self);
        self.onmessage = event => {
          let baseUrl = event.srcElement.origin;
          let generateSecEventPdf = function(pdfRawData) {
            let metadata = pdfRawData.metadata;
            let imageMap = pdfRawData.constant;
            let rowLimit = pdfRawData.rowLimit;
            let charts = pdfRawData.charts;
            let distByEvtType = pdfRawData.distByEventType;

            const _organizeSecEventPdfTblRow = function(secEvent, index) {
              // const severityColor = {
              //   warning: [255, 152, 0],
              //   error: [220, 64, 52],
              //   info: [33, 150, 243]
              // };
              let id = (index + 1).toString();
              let title = secEvent.name4Pdf;
              let severity = secEvent.details.level
                ? secEvent.details.level.name
                : "";
              let location = _organizeLocation(secEvent);
              let details = _organizeSecEventDetails(secEvent);
              let action = secEvent.details.action
                ? secEvent.details.action.name4Pdf
                : "";
              let datetime = secEvent.reportedAt;

              return [
                id,
                title,
                { text: severity, style: `severity_${severity.toLowerCase()}` },
                location,
                details,
                action,
                datetime
              ];
            };

            const _organizeLocation = function(secEvent) {
              if (secEvent.endpoint.source && secEvent.endpoint.destination) {
                return {
                  stack: [
                    {
                      ul: [
                        `${metadata.items.source}: ${
                          secEvent.endpoint.source.domain
                            ? `${secEvent.endpoint.source.domain}: `
                            : ""
                        }${
                          secEvent.endpoint.source.service
                            ? `${secEvent.endpoint.source.service}: `
                            : ""
                        }${secEvent.endpoint.source.displayName}`,
                        `${metadata.items.destination}: ${
                          secEvent.endpoint.destination.domain
                            ? `${secEvent.endpoint.destination.domain}: `
                            : ""
                        }${
                          secEvent.endpoint.destination.service
                            ? `${secEvent.endpoint.destination.service}: `
                            : ""
                        }${secEvent.endpoint.destination.displayName}`
                      ]
                    }
                  ]
                };
              } else if (
                secEvent.endpoint.source &&
                !secEvent.details.labels.includes("host")
              ) {
                return {
                  stack: [
                    {
                      ul: [
                        `${metadata.items.host}: ${secEvent.host_name}`,
                        `${metadata.items.container}: ${
                          secEvent.endpoint.source.domain
                            ? `${secEvent.endpoint.source.domain}: `
                            : ""
                        }${
                          secEvent.endpoint.source.service
                            ? `${secEvent.endpoint.source.service}: `
                            : ""
                        }${secEvent.endpoint.source.displayName}`
                      ]
                    }
                  ]
                };
              } else if (
                secEvent.endpoint.destination &&
                !secEvent.details.labels.includes("host")
              ) {
                return {
                  stack: [
                    {
                      ul: [
                        `${metadata.items.host}: ${secEvent.host_name}`,
                        `${metadata.items.container}: ${
                          secEvent.endpoint.destination.domain
                            ? `${secEvent.endpoint.destination.domain}: `
                            : ""
                        }${
                          secEvent.endpoint.destination.service
                            ? `${secEvent.endpoint.destination.service}: `
                            : ""
                        }${secEvent.endpoint.destination.displayName}`
                      ]
                    }
                  ]
                };
              } else {
                return {
                  stack: [
                    {
                      ul: [`${metadata.items.host}: ${secEvent.host_name}`]
                    }
                  ]
                };
              }
            };

            const _organizeSecEventDetails = function(secEvent) {
              let ul = [];

              switch (secEvent.type.name) {
                case "threat":
                  if (secEvent.applications)
                    ul.push(
                      `${metadata.items.applications}: ${secEvent.applications}`
                    );
                  if (secEvent.details.count)
                    ul.push(
                      `${metadata.items.count}: ${secEvent.details.count}`
                    );
                  if (secEvent.details.message.content)
                    ul.push(
                      `${metadata.items.description}: ${
                        secEvent.details.message.content
                      }`
                    );
                  return { stack: [{ ul: ul }] };
                case "violation":
                  if (secEvent.applications)
                    ul.push(
                      `${metadata.items.applications}: ${secEvent.applications}`
                    );
                  if (secEvent.details.serverPort)
                    ul.push(
                      `${
                        secEvent.details.port > 0
                          ? metadata.items.serverPort
                          : metadata.items.protocol
                      }: ${secEvent.details.serverPort}`
                    );
                  if (secEvent.details.serverImage)
                    ul.push(
                      `${metadata.items.serverImage}: ${
                        secEvent.details.serverImage
                      }`
                    );
                  if (secEvent.details.clusterName)
                    ul.push(
                      `${metadata.items.clusterName}: ${
                        secEvent.details.clusterName
                      }`
                    );
                  return { stack: [{ ul: ul }] };
                case "incident":
                  if (secEvent.details.message.group)
                    ul.push(
                      `${metadata.items.group}: ${
                        secEvent.details.message.group
                      }`
                    );
                  if (secEvent.details.message.procName)
                    ul.push(
                      `${metadata.items.procName}: ${
                        secEvent.details.message.procName
                      }`
                    );
                  if (secEvent.details.message.procPath)
                    ul.push(
                      `${metadata.items.procPath}: ${
                        secEvent.details.message.procPath
                      }`
                    );
                  if (secEvent.details.message.procCmd)
                    ul.push(
                      `${metadata.items.procCmd}: ${
                        secEvent.details.message.procCmd
                      }`
                    );
                  if (
                    secEvent.details.message.procCmd &&
                    secEvent.name.toLowerCase().indexOf("process") < 0 &&
                    secEvent.name.toLowerCase().indexOf("escalation") < 0 &&
                    secEvent.name.toLowerCase().indexOf("detected") < 0
                  )
                    ul.push(
                      `${metadata.items.cmd}: ${
                        secEvent.details.message.procCmd
                      }`
                    );
                  if (secEvent.details.message.procEffectiveUid)
                    ul.push(
                      `${metadata.items.procEffectedUid}: ${
                        secEvent.details.message.procEffectiveUid
                      }`
                    );
                  if (secEvent.details.message.procEffectiveUser)
                    ul.push(
                      `${metadata.items.procEffectedUser}: ${
                        secEvent.details.message.procEffectiveUser
                      }`
                    );
                  if (secEvent.details.message.localIP)
                    ul.push(
                      `${metadata.items.localIp}: ${
                        secEvent.details.message.localIP
                      }`
                    );
                  if (secEvent.details.message.remoteIP)
                    ul.push(
                      `${metadata.items.remoteIp}: ${
                        secEvent.details.message.remoteIP
                      }`
                    );
                  if (secEvent.details.message.localPort)
                    ul.push(
                      `${metadata.items.localPort}: ${
                        secEvent.details.message.localPort
                      }`
                    );
                  if (secEvent.details.message.localPort)
                    ul.push(
                      `${metadata.items.remotePort}: ${
                        secEvent.details.message.localPort
                      }`
                    );
                  if (secEvent.details.message.ipProto)
                    ul.push(
                      `${metadata.items.ipProto}: ${
                        secEvent.details.message.ipProto
                      }`
                    );
                  if (secEvent.details.message.filePath)
                    ul.push(
                      `${metadata.items.filePath}: ${
                        secEvent.details.message.filePath
                      }`
                    );
                  if (secEvent.details.message.fileNames)
                    ul.push(
                      `${metadata.items.fileNames}: ${
                        secEvent.details.message.fileNames
                      }`
                    );
                  return {
                    stack: [secEvent.details.message.content, { ul: ul }]
                  };
              }
            };

            const _organizeSecEventCsvTblRow = function(secEvent, index) {
              let resPrototype = {
                ID: "",
                Title: "",
                Severity: "",
                Location: "",
                Details: "",
                Action: "",
                Datetime: ""
              };
              resPrototype.ID = (index + 1).toString();
              resPrototype.Title = `${secEvent.name.replace(/\"/g, "'")}`;
              resPrototype.Severity = secEvent.details.level
                ? secEvent.details.level.name
                : "";
              resPrototype.Location = `${_organizeLocation(
                secEvent
              ).stack[0].ul.join("\n")}`;
              resPrototype.Details = `${_organizeSecEventDetails(secEvent)
                .stack.map(function(elem) {
                  return typeof elem === "string" ? elem : elem.ul.join("\n");
                })
                .join("\n")
                .replace(/\"/g, "'")}`;
              resPrototype.Action = secEvent.details.action
                ? secEvent.details.action.name
                : "";
              resPrototype.Datetime = `${secEvent.reportedAt}`;
              return resPrototype;
            };

            let docDefinition = {
              info: {
                title: "Security events report",
                author: "NeuVector",
                subject: "Security events report",
                keywords: "Security events report"
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
                        image: imageMap.FOOTER_LINE,
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
                fontSize: 6
              },
              styles: {
                tableHeader: {
                  bold: true
                },
                severity_error: {
                  color: "#ff0000"
                },
                severity_critical: {
                  color: "#ff0000"
                },
                severity_warning: {
                  color: "#ff9900"
                },
                severity_info: {
                  color: "#2299ff"
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
                }
              },
              content: [
                {
                  image: imageMap.BACKGROUND,
                  width: 1000,
                  absolutePosition: { x: 0, y: 300 }
                },
                {
                  image: imageMap.ABSTRACT,
                  width: 450
                },
                {
                  image: imageMap[metadata.others.logoName],
                  width: 400,
                  absolutePosition: { x: 350, y: 180 }
                },
                {
                  text: metadata.title,
                  fontSize: 40,
                  color: "#777",
                  bold: true,
                  absolutePosition: { x: 150, y: 450 },
                  pageBreak: "after"
                },
                {
                  toc: {
                    title: {
                      text: metadata.others.tocText,
                      style: "tocTitle"
                    },
                    numberStyle: "tocNumber"
                  },
                  margin: [60, 35, 20, 60],
                  pageBreak: "after"
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
                        margin: [80, 15, 0, 60]
                      }
                    },
                    {
                      text: `    ${metadata.others.summaryRange}`,
                      color: "#3090C7",
                      fontSize: 10
                    }
                  ]
                },
                {
                  text: metadata.others.byEventType,
                  style: "contentSubHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 12,
                    italic: true,
                    color: "black",
                    margin: [95, 10, 0, 60]
                  }
                },
                {
                  columns: [
                    {
                      table: {
                        body: []
                      }
                    },
                    {
                      image: charts.canvas.byEventType,
                      width: 350
                    }
                  ]
                },
                {
                  text: [
                    {
                      text: metadata.others.subTitleDetails,
                      tocItem: true,
                      tocStyle: {
                        fontSize: 16,
                        bold: true,
                        color: "#4863A0",
                        margin: [80, 15, 0, 60]
                      },
                      style: "contentHeader"
                    },
                    {
                      text: `    ${metadata.others.detailsLimit}`,
                      color: "#fe6e6b",
                      fontSize: 10
                    }
                  ],
                  margin: [0, 0, 0, 10]
                },
                {
                  style: "table",
                  table: {
                    headerRows: 1,
                    widths: ["2%", "20%", "4%", "29%", "35%", "4%", "6%"],
                    body: [
                      [
                        { text: metadata.header.id, style: "tableHeader" },
                        { text: metadata.header.title, style: "tableHeader" },
                        {
                          text: metadata.header.severity,
                          style: "tableHeader"
                        },
                        {
                          text: metadata.header.location,
                          style: "tableHeader"
                        },
                        { text: metadata.header.details, style: "tableHeader" },
                        { text: metadata.header.action, style: "tableHeader" },
                        { text: metadata.header.datetime, style: "tableHeader" }
                      ]
                    ]
                  }
                }
              ]
            };

            let distLayout = {
              fillColor: function(i, node) {
                return i % 2 == 0 ? "#CBF8C0" : "#E9FFDE";
              },
              hLineColor: function(i, node) {
                return "white";
              },
              vLineColor: function(i, node) {
                return "white";
              }
            };

            // add distribute data
            docDefinition.content[7].columns[0].layout = distLayout;
            docDefinition.content[7].columns[0].fontSize = 10;
            docDefinition.content[7].columns[0].table.widths = [250, 30];

            if (distByEvtType.length) {
              for (let item of distByEvtType) {
                docDefinition.content[7].columns[0].table.body.push(item);
              }
            } else {
              docDefinition.content[7].columns[0].table.body.push([]);
            }

            let csvTbl = [];
            pdfRawData.data.forEach(function(secEvent, $index) {
              if ($index < rowLimit) {
                docDefinition.content[9].table.body.push(
                  _organizeSecEventPdfTblRow(secEvent, $index)
                );
              }
              csvTbl.push(_organizeSecEventCsvTblRow(secEvent, $index));
            });

            self.postMessage({ type: "csv", data: csvTbl });
            self.importScripts(
              baseUrl + "/vendor/pdfmake/build/pdfmake.js",
              baseUrl + "/vendor/pdfmake/build/vfs_fonts.js"
            );
            let pdf = pdfMake.createPdf(docDefinition);
            pdf.getBlob(function(blob) {
              console.log("Worker is end...");
              self.postMessage({ type: "pdf", blob: blob, progress: 1});
              self.close();
            }, {progressCallback: showProgress});
          };
          let pdfRawData = JSON.parse(event.data);
          generateSecEventPdf(pdfRawData);
        };
      };

      let timer4chart = null;

      $scope.onFilterChanged = function(mode, value, excludedValue = "") {
        console.log("selectedDomains: ", $scope.selectedDomains)
        $scope.progress = 0;
        let listElem = document.getElementById("sec-event-list");
        if (listElem) {
          listElem.scrollTop = 0;
        }
        $scope.begin = 0;

        let filterByText = function(rangedSecEvent, value, isInclude = true) {
          value = !value ? "" : value;
          value = encodeURIComponent(value.toLowerCase());
          let regex = null;
          if (isInclude) {
            console.log("Included", value)
            regex = new RegExp(`^.*${value}.*$`);
          } else {
            if (value) {
              console.log("Excluded", value)
              regex = new RegExp(`^((?!${value}).)*$`);
            } else {
              regex = new RegExp(`^.*$`);
            }
          }

          let otherKeywordMatching = true;
          // *Some browsers don't support lookbehind*
          // let filterableValue = JSON.stringify(rangedSecEvent)
          //   .match(
          //     /(?<!"cssColor"|"icon"):".*?"|:[0-9]{1,10}(?=\}|\,)|(?<="labels":)\[.*?\]|(?<="applications":)\[.*?\]/g
          //   )
          //   .join("")
          //   .replace(/\[|\,/g, ":")
          //   .replace(/\]|\"/g, "");
          let filterableValue = JSON.stringify(rangedSecEvent)
            .match(
              /:".*?"|"icon":".*?"|"cssColor":".*?"|:[0-9]{1,10}(?=\}|\,)|"labels":\[.*?\]|"applications":\[.*?\]/g
            )
            .join("")
            .replace(
              /"icon":".*?"|"cssColor":".*?"|"applications"\:\[|"labels"\:\[|\"\,\"/g,
              ":"
            )
            .replace(/\]|\"/g, "");
          // console.log(filterableValue)
          if (value.length > 0) {
            otherKeywordMatching = regex.test(
              encodeURIComponent(filterableValue.toLowerCase())
            );
          }
          return otherKeywordMatching;
        };

        let filterEvents = function() {
          /** @namespace $scope.selectedItemDestination */
          /** @namespace $scope.selectedItemSource */
          /** @namespace $scope.selectedItemHost */
          if (
            mode === "adv" &&
            ((typeof value !== "undefined" && value.length > 0) ||
              (typeof excludedValue !== "undefined" && excludedValue.length > 0) ||
              (($scope.searchTextDestination &&
                $scope.searchTextDestination.length > 0) ||
                ($scope.selectedDomains &&
                  Array.isArray($scope.selectedDomains) &&
                  $scope.selectedDomains.length > 0) ||
                ($scope.searchTextSource &&
                  $scope.searchTextSource.length > 0) ||
                ($scope.searchTextHost && $scope.searchTextHost.length > 0) ||
                ($scope.selectedItemDestination &&
                  $scope.selectedItemDestination.value) ||
                ($scope.selectedItemSource &&
                  $scope.selectedItemSource.value) ||
                ($scope.selectedItemHost && $scope.selectedItemHost.value) ||
                ($scope.others.isFilteringOther ||
                  $scope.media.isFilteringPackage ||
                  $scope.media.isFilteringProcess ||
                  $scope.media.isFilteringTunnel ||
                  $scope.media.isFilteringFile ||
                  $scope.media.isFilteringPrivilege ||
                  $scope.media.isFilteringNetwork ||
                  $scope.unit.isFilteringContainer ||
                  $scope.unit.isFilteringHost ||
                  $scope.levelFilter.isFilteringCritical ||
                  $scope.levelFilter.isFilteringWarning ||
                  $scope.levelFilter.isFilteringInfo)))
          ) {
            $scope.isOnQuickFilter = false;
            $scope.filteredSecEvents = $scope.rangedSecEvents.filter(function(
              rangedSecEvent
            ) {
              //Included keyword
              let otherKeywordMatching = filterByText(rangedSecEvent, value);
              //Excluded keyword
              console.log("excludedValue: ", excludedValue);
              let excludedKeywordMatching = filterByText(rangedSecEvent, excludedValue, false);
              //Namespace tag input
              let namespaceMatching = false;
              let domainFilter = $scope.selectedDomains.map(domain => domain.name);
              if (($scope.selectedDomains &&
                Array.isArray($scope.selectedDomains) &&
                $scope.selectedDomains.length > 0)) {
                if (rangedSecEvent.endpoint) {
                  if (rangedSecEvent.endpoint.source && rangedSecEvent.endpoint.source.domain) {
                    namespaceMatching = namespaceMatching || domainFilter.indexOf(rangedSecEvent.endpoint.source.domain) >= 0;
                  }
                  if (rangedSecEvent.endpoint.destination && rangedSecEvent.endpoint.destination.domain) {
                    namespaceMatching = namespaceMatching || domainFilter.indexOf(rangedSecEvent.endpoint.destination.domain) >= 0;
                  }
                }
              } else {
                namespaceMatching = true;
              }
              //Destination autocomplete
              let destinationMatching = false;
              if (
                ($scope.selectedItemDestination &&
                  $scope.selectedItemDestination.value) ||
                $scope.searchTextDestination
              ) {
                if (
                  rangedSecEvent.endpoint &&
                  typeof rangedSecEvent.endpoint.destination === "object"
                ) {
                  let destination = `${
                    rangedSecEvent.endpoint.destination.domain
                      ? `${rangedSecEvent.endpoint.destination.domain}: `
                      : ""
                  }${rangedSecEvent.endpoint.destination.displayName}`;
                  if ($scope.selectedItemDestination === null) {
                    destinationMatching =
                      destination === $scope.searchTextDestination;
                  } else {
                    destinationMatching =
                      destination === $scope.selectedItemDestination.value;
                  }
                }
              } else {
                destinationMatching = true;
              }

              //Source autocomplete
              let sourceMatching = false;
              if (
                ($scope.selectedItemSource &&
                  $scope.selectedItemSource.value) ||
                $scope.searchTextSource
              ) {
                if (
                  rangedSecEvent.endpoint &&
                  typeof rangedSecEvent.endpoint.source === "object"
                ) {
                  let source = `${
                    rangedSecEvent.endpoint.source.domain
                      ? `${rangedSecEvent.endpoint.source.domain}: `
                      : ""
                  }${rangedSecEvent.endpoint.source.displayName}`;
                  if ($scope.selectedItemSource === null) {
                    sourceMatching = source === $scope.searchTextSource;
                  } else {
                    sourceMatching = source === $scope.selectedItemSource.value;
                  }
                }
              } else {
                sourceMatching = true;
              }

              //Host autocomplete
              let hostMatching = false;
              if (
                ($scope.selectedItemHost && $scope.selectedItemHost.value) ||
                $scope.searchTextHost
              ) {
                if (rangedSecEvent.host_name) {
                  if ($scope.selectedItemHost === null) {
                    hostMatching =
                      rangedSecEvent.host_name === $scope.searchTextHost;
                  } else {
                    hostMatching =
                      rangedSecEvent.host_name ===
                      $scope.selectedItemHost.value;
                  }
                }
              } else {
                hostMatching = true;
              }

              //Other label
              let isOther = true;
              if ($scope.others.isFilteringOther) {
                isOther = rangedSecEvent.details.labels.length === 0;
              }

              //level
              let isTargetLevel = SecurityEventsFactory.filterByLevels(
                rangedSecEvent.details.level.name,
                {
                  key: "critical",
                  value: $scope.levelFilter.isFilteringCritical
                },
                {
                  key: "warning",
                  value: $scope.levelFilter.isFilteringWarning
                },
                { key: "info", value: $scope.levelFilter.isFilteringInfo }
              );

              //entity
              let isTargetEntity = SecurityEventsFactory.filterByLabels(
                rangedSecEvent.details.labels,
                {
                  key: SecurityEventsFactory.LABELS.HOST,
                  value: $scope.unit.isFilteringHost
                },
                {
                  key: SecurityEventsFactory.LABELS.CONTAINER,
                  value: $scope.unit.isFilteringContainer
                }
              );

              //category
              let isTargetCategory = SecurityEventsFactory.filterByLabels(
                rangedSecEvent.details.labels,
                {
                  key: SecurityEventsFactory.LABELS.NETWORK,
                  value: $scope.media.isFilteringNetwork
                },
                {
                  key: SecurityEventsFactory.LABELS.PRIVILEGE,
                  value: $scope.media.isFilteringPrivilege
                },
                {
                  key: SecurityEventsFactory.LABELS.FILE,
                  value: $scope.media.isFilteringFile
                },
                {
                  key: SecurityEventsFactory.LABELS.TUNNEL,
                  value: $scope.media.isFilteringTunnel
                },
                {
                  key: SecurityEventsFactory.LABELS.PROCESS,
                  value: $scope.media.isFilteringProcess
                },
                {
                  key: SecurityEventsFactory.LABELS.PACKAGE,
                  value: $scope.media.isFilteringPackage
                }
              );

              return (
                otherKeywordMatching &&
                excludedKeywordMatching &&
                namespaceMatching &&
                destinationMatching &&
                sourceMatching &&
                hostMatching &&
                isOther &&
                isTargetLevel &&
                isTargetEntity &&
                isTargetCategory
              );
            });

            //Save current filter
            _saveCurrentFilter();
            $scope.filteredCount = $scope.filteredSecEvents.length;
            $scope.count =
              $scope.filteredCount === $scope.rangedSecEvents.length
                ? `${$scope.rangedSecEvents.length} ${getEntityName(
                    $scope.rangedSecEvents.length
                  )}`
                : `${found} ${$scope.filteredCount} / ${$scope.rangedSecEvents.length} ${getEntityName(
                    $scope.rangedSecEvents.length
                  )}`;
          } else if (
            mode === "quick" &&
            (typeof value !== "undefined" && value.length > 0)
          ) {
            $scope.isOnQuickFilter = true;
            $scope.filteredSecEvents = $scope.rangedSecEvents.filter(function(
              rangedSecEvent
            ) {
              let otherKeywordMatching = filterByText(rangedSecEvent, value);
              return otherKeywordMatching;
            });
            $scope.filteredCount = $scope.filteredSecEvents.length;
            $scope.count =
              $scope.filteredCount === $scope.rangedSecEvents.length
                ? `${$scope.rangedSecEvents.length} ${getEntityName(
                    $scope.rangedSecEvents.length
                  )}`
                : `${found} ${$scope.filteredCount} / ${$scope.rangedSecEvents.length} ${getEntityName(
                    $scope.rangedSecEvents.length
                  )}`;
          } else {
            $scope.isAdvFilterInUse = false;
            $scope.isOnQuickFilter = false;
            $scope.filteredSecEvents = $scope.rangedSecEvents;
            $scope.filteredCount = $scope.rangedSecEvents.length;
            $scope.count = `${$scope.rangedSecEvents.length} ${getEntityName(
              $scope.rangedSecEvents.length
            )}`;
          }
          $scope.onAdvFilter = false;

          $scope.isPdfPreparing = false;
          $interval.cancel(timer);
          $scope.secEventPdfBlob = null;
          if ($scope.worker) {
            $scope.worker.terminate();
          }

          $scope.worker = run(generatePdf4SecEvents);

          const _drawPdfCharts = function(data) {
            const typeNameGroupBy = data.reduce(function(obj, elem) {
              (obj[elem["type"]["name"]] =
                obj[elem["type"]["name"]] || []).push(elem);
              return obj;
            }, {});

            let labels = [];
            let sizes = [];
            let colors = [];
            let typeNameMap = new Map();

            for (let type in typeNameGroupBy) {
              if (typeNameGroupBy.hasOwnProperty(type)) {
                typeNameMap.set(type, typeNameGroupBy[type].length);
                switch (type.toLowerCase()) {
                  case "incident":
                    labels.push(
                      $translate.instant("dashboard.heading.INCIDENTS")
                    );
                    sizes.push(typeNameGroupBy[type].length);
                    colors.push("#9aaabc");
                    break;
                  case "threat":
                    labels.push(
                      $translate.instant("dashboard.heading.THREATS")
                    );
                    sizes.push(typeNameGroupBy[type].length);
                    colors.push("#ef5350");
                    break;
                  case "violation":
                    labels.push(
                      $translate.instant("dashboard.heading.VIOLATIONS")
                    );
                    sizes.push(typeNameGroupBy[type].length);
                    colors.push("#ff9800");
                    break;
                  default:
                }
              }
            }

            const eventTypeArr = [];
            typeNameMap.forEach((v, k) => {
              eventTypeArr.push([k, v]);
            });
            $scope.distByEventType = eventTypeArr;
            $scope.eventTypeChartLabels = labels;
            $scope.eventTypeChartData = sizes;
            $scope.eventTypeChartColors = colors;
            $scope.eventTypeChartOptions = {
              scales: {
                xAxes: [
                  {
                    barPercentage: 0.5,
                    display: true,
                    ticks: {
                      beginAtZero: true,
                      autoSkip: false,
                      fontSize: 24,
                      callback: function(value) {
                        if (value % 1 === 0) return value;
                      }
                    }
                  }
                ],
                yAxes: [
                  {
                    ticks: {
                      fontSize: 32
                    },
                    maxBarThickness: 25
                  }
                ]
              },
              maintainAspectRatio: false
            };
          };

          _drawPdfCharts($scope.filteredSecEvents);

          if (timer4chart) {
            $timeout.cancel(timer4chart);
          }
          if ($scope.worker) {
            timer4chart = $timeout(function() {
              $scope.worker.postMessage(
                JSON.stringify(
                  Object.assign(
                    { data: $scope.filteredSecEvents },
                    { distByEventType: $scope.distByEventType },
                    {
                      metadata: _i18n4Pdf({
                        from:
                          $scope.filteredSecEvents.length > 0
                            ? $scope.filteredSecEvents[
                                $scope.filteredSecEvents.length - 1
                              ].reportedAt
                            : "",
                        to:
                          $scope.filteredSecEvents.length > 0
                            ? $scope.filteredSecEvents[0].reportedAt
                            : "",
                        filteredCount: $scope.filteredSecEvents.length,
                        rangedCount: $scope.rangedSecEvents.length
                      })
                    },
                    { constant: imageMap, rowLimit: REPORT_TABLE_ROW_LIMIT },
                    { charts: _getChartsForPdf() }
                  )
                )
              );
            }, 3000);

            $scope.worker.onmessage = event => {
              if (event.data.type === "pdf") {
                $scope.secEventPdfBlob = event.data.blob;
              }
              if (event.data.type === "csv") {
                $scope.secEventCsvData = event.data.data;
              }
              if (!event.data.progress) $scope.progress = 0;
              else $scope.progress = Math.floor(event.data.progress * 100);
              $scope.$apply();
            };
          } else {
            $scope.progress = 100;
          }
        };

        $timeout(function() {
          filterEvents();
        }, 300);
      };

      const _getChartsForPdf = function() {
        let byEventType = document.getElementById("byEventType").toDataURL();

        return {
          canvas: {
            byEventType: byEventType
          }
        };
      };

      const _i18n4Pdf = function(options) {
        return {
          title: $translate.instant(
            "securityEvent.pdf.REPORT_TITLE",
            {},
            "",
            "en"
          ),
          header: {
            id: $translate.instant("securityEvent.pdf.ID", {}, "", "en"),
            title: $translate.instant("securityEvent.pdf.TITLE", {}, "", "en"),
            severity: $translate.instant(
              "securityEvent.pdf.SEVERITY",
              {},
              "",
              "en"
            ),
            location: $translate.instant(
              "securityEvent.pdf.LOCATION",
              {},
              "",
              "en"
            ),
            details: $translate.instant(
              "securityEvent.pdf.DETAILS",
              {},
              "",
              "en"
            ),
            action: $translate.instant(
              "securityEvent.pdf.ACTION",
              {},
              "",
              "en"
            ),
            datetime: $translate.instant(
              "securityEvent.pdf.DATETIME",
              {},
              "",
              "en"
            )
          },
          items: {
            source: $translate.instant("securityEvent.SOURCE", {}, "", "en"),
            destination: $translate.instant(
              "securityEvent.DESTINATION",
              {},
              "",
              "en"
            ),
            host: $translate.instant("securityEvent.HOST", {}, "", "en"),
            container: $translate.instant(
              "securityEvent.CONTAINER",
              {},
              "",
              "en"
            ),
            applications: $translate.instant(
              "securityEvent.APPLICATIONS",
              {},
              "",
              "en"
            ),
            count: $translate.instant("threat.gridHeader.COUNT", {}, "", "en"),
            description: $translate.instant(
              "securityEvent.DESCRIPTION",
              {},
              "",
              "en"
            ),
            serverPort: $translate.instant(
              "violation.gridHeader.SERVER_PORT",
              {},
              "",
              "en"
            ),
            protocol: $translate.instant(
              "violation.gridHeader.PROTOCOL",
              {},
              "",
              "en"
            ),
            serverImage: $translate.instant(
              "violation.gridHeader.SERVER_IMAGE",
              {},
              "",
              "en"
            ),
            clusterName: $translate.instant(
              "violation.gridHeader.CLUSTER_NAME",
              {},
              "",
              "en"
            ),
            group: $translate.instant("securityEvent.GROUP", {}, "", "en"),
            procName: $translate.instant(
              "securityEvent.PROC_NAME",
              {},
              "",
              "en"
            ),
            procPath: $translate.instant(
              "securityEvent.PROC_PATH",
              {},
              "",
              "en"
            ),
            procCmd: $translate.instant("securityEvent.PROC_CMD", {}, "", "en"),
            cmd: $translate.instant("securityEvent.CMD", {}, "", "en"),
            procEffectedUid: $translate.instant(
              "securityEvent.PROC_EFF_UID",
              {},
              "",
              "en"
            ),
            procEffectedUser: $translate.instant(
              "securityEvent.PROC_EFF_USER",
              {},
              "",
              "en"
            ),
            localIp: $translate.instant("securityEvent.LOCAL_IP", {}, "", "en"),
            remoteIp: $translate.instant(
              "securityEvent.REMOTE_IP",
              {},
              "",
              "en"
            ),
            localPort: $translate.instant(
              "securityEvent.LOCAL_PORT",
              {},
              "",
              "en"
            ),
            remotePort: $translate.instant(
              "securityEvent.REMOTE_PORT",
              {},
              "",
              "en"
            ),
            ipProto: $translate.instant("securityEvent.IP_PROTO", {}, "", "en"),
            fileNames: $translate.instant(
              "securityEvent.FILE_NAME",
              {},
              "",
              "en"
            ),
            filePath: $translate.instant(
              "securityEvent.FILE_PATH",
              {},
              "",
              "en"
            )
          },
          others: {
            tocText: $translate.instant("general.REPORT_TOC", {}, "", "en"),
            headerText: $translate.instant(
              "partner.securityEvent.pdf.header",
              {},
              "",
              "en"
            ),
            footerText: $translate.instant(
              "securityEvent.pdf.FOOTER",
              {},
              "",
              "en"
            ),
            subTitleDetails: $translate.instant(
              "securityEvent.pdf.DETAILS",
              {},
              "",
              "en"
            ),
            reportSummary: $translate.instant("enum.SUMMARY", {}, "", "en"),
            logoName: $translate.instant(
              "partner.general.LOGO_NAME",
              {},
              "",
              "en"
            ),
            byEventType: $translate.instant(
              "securityEvent.pdf.TYPEDIST",
              {},
              "",
              "en"
            ),
            summaryRange:
              options.filteredCount === 0
                ? ""
                : options.filteredCount === options.rangedCount
                ? $translate.instant(
                    "general.PDF_SUMMARY_RANGE",
                    {
                      from: options.from,
                      to: options.to,
                      rangedCount: options.rangedCount
                    },
                    "",
                    "en"
                  )
                : $translate.instant(
                    "general.PDF_SUMMARY_RANGE_FILTERED",
                    {
                      from: options.from,
                      to: options.to,
                      rangedCount: options.rangedCount,
                      filteredCount: options.filteredCount
                    },
                    "",
                    "en"
                  ),
            detailsLimit:
              options.filteredCount > REPORT_TABLE_ROW_LIMIT
                ? $translate.instant("general.PDF_TBL_ROW_LIMIT", {max: $scope.REPORT_TABLE_ROW_LIMIT}, "", "en")
                : ""
          }
        };
      };

      const _saveCurrentFilter = function() {
        $scope.isAdvFilterInUse = false;
        prevFilterObj.isFilteringInfo = $scope.levelFilter.isFilteringInfo;
        prevFilterObj.isFilteringWarning =
          $scope.levelFilter.isFilteringWarning;
        prevFilterObj.isFilteringCritical =
          $scope.levelFilter.isFilteringCritical;
        prevFilterObj.isFilteringHost = $scope.unit.isFilteringHost;
        prevFilterObj.isFilteringContainer = $scope.unit.isFilteringContainer;
        prevFilterObj.isFilteringNetwork = $scope.media.isFilteringNetwork;
        prevFilterObj.isFilteringPrivilege = $scope.media.isFilteringPrivilege;
        prevFilterObj.isFilteringFile = $scope.media.isFilteringFile;
        prevFilterObj.isFilteringTunnel = $scope.media.isFilteringTunnel;
        prevFilterObj.isFilteringProcess = $scope.media.isFilteringProcess;
        prevFilterObj.isFilteringPackage = $scope.media.isFilteringPackage;
        prevFilterObj.isFilteringOther = $scope.others.isFilteringOther;
        prevFilterObj.selectedHost = $scope.searchTextHost;
        prevFilterObj.selectedSource = $scope.searchTextSource;
        prevFilterObj.selectedDestination = $scope.searchTextDestination;
        prevFilterObj.otherKeyword = $scope.otherKey;
        prevFilterObj.excludedKeyword = $scope.excludedKey;
        prevFilterObj.selectedDomains = $scope.selectedDomains;
        for (let filterItem in prevFilterObj) {
          if (prevFilterObj[filterItem]) {
            $scope.isAdvFilterInUse = true;
            break;
          }
        }
      };

      const _setTimeRange = function(now, earliest) {
        let startDateStr = Utils.getDateByInterval(
          earliest,
          $scope.slider.minValue,
          "days"
        ).substring(0, 8);
        let endDateStr = Utils.getDateByInterval(
          now,
          $scope.slider.maxValue - $scope.maxTimeGap,
          "days"
        ).substring(0, 8);
        $scope.startDate = $filter("date")(
          `${startDateStr.substring(0, 4)}-${startDateStr.substring(
            4,
            6
          )}-${startDateStr.substring(6, 8)}`,
          "MMM dd, y"
        );

        $scope.rangedSecEvents = $scope.displayedSecurityEvents.filter(function(
          filteredSecEvent
        ) {
          return (
            Utils.parseLocalDate(filteredSecEvent.orgReportedAt) <=
              endDateStr &&
            Utils.parseLocalDate(filteredSecEvent.orgReportedAt) >= startDateStr
          );
        });

        if (
          $scope.rangedSecEvents.length < $scope.displayedSecurityEvents.length
        ) {
          document.getElementsByName("secEvt").forEach(function(elem) {
            elem.checked = false;
          });
        }

        _prepareAutoComplete();

        if ($scope.isOnQuickFilter) {
          $scope.onFilterChanged(
            "quick",
            document.getElementById("quick-filter-text").value
          );
        } else {
          $scope.onFilterChanged("adv", $scope.otherKey, $scope.excludedKey);
        }
      };

      const _prepareAutoComplete = function() {
        $scope.rangedSecEvents.forEach(function(event) {
          if (event.host_name) {
            hosts.add(event.host_name);
          }
          if (
            event.endpoint &&
            typeof event.endpoint.source === "object" &&
            event.endpoint.source.displayName
          ) {
            sources.add(
              `${
                event.endpoint.source.domain
                  ? `${event.endpoint.source.domain}: `
                  : ""
              }${event.endpoint.source.displayName}`
            );
          }
          if (
            event.endpoint &&
            typeof event.endpoint.destination === "object" &&
            event.endpoint.destination.displayName
          ) {
            destinations.add(
              `${
                event.endpoint.destination.domain
                  ? `${event.endpoint.destination.domain}: `
                  : ""
              }${event.endpoint.destination.displayName}`
            );
          }
        });

        $scope.autocompleteHosts = Array.from(hosts)
          .sort()
          .map(function(host) {
            return {
              value: host,
              display: host
            };
          });
        $scope.autocompleteSources = Array.from(sources)
          .sort()
          .map(function(source) {
            return {
              value: source,
              display: source
            };
          });
        console.log("$scope.autocompleteSources: ", sources, $scope.autocompleteSources);
        $scope.autocompleteDestinations = Array.from(destinations)
          .sort()
          .map(function(destination) {
            return {
              value: destination,
              display: destination
            };
          });
      };

      $scope.$on("slideEnded", function() {
        _setTimeRange($scope.nowDateStr, $scope.earliestDateStr);
        $scope.$apply();
      });

      $scope.refresh = function() {
        $scope.secEventsErr = false;
        $scope.isDataReady = false;
        let dataStartTime = new Date();
        SecurityEventsFactory.getSecurityEvents()
          .then(function(response) {
            let threats = JSON.parse(response.data[0]);
            let violations = JSON.parse(response.data[1]);
            let incidents = JSON.parse(response.data[2]);
            SecurityEventsFactory.displayedSecurityEvents = [];

            console.log("Security Events (raw): ", [
              angular.copy(threats),
              angular.copy(violations),
              angular.copy(incidents)
            ]);
            let ipList = threats.threats
              .flatMap(threat => {
                let ips = [];
                if (
                  threat.client_workload_id === securityEventLocation.EXTERNAL
                ) {
                  ips.push(threat.client_ip);
                }
                if (
                  threat.server_workload_id === securityEventLocation.EXTERNAL
                ) {
                  ips.push(threat.server_ip);
                }
                return ips;
              })
              .concat(
                violations.violations.flatMap(violation => {
                  let ips = [];
                  if (violation.client_id === securityEventLocation.EXTERNAL) {
                    ips.push(violation.client_ip);
                  }
                  if (violation.server_id === securityEventLocation.EXTERNAL) {
                    ips.push(violation.server_ip);
                  }
                  return ips;
                })
              )
              .concat(
                incidents.incidents.flatMap(incident => {
                  let ips = [];
                  if (incident.workload_id === securityEventLocation.EXTERNAL) {
                    ips.push(incident.client_ip);
                  }
                  if (
                    incident.remote_workload_id ===
                    securityEventLocation.EXTERNAL
                  ) {
                    ips.push(incident.server_ip);
                  }
                  return ips;
                })
              );
            console.log("IP list: ", ipList);
            $http.patch(IP_GEO_URL, ipList).then(response => {
              console.log(response.data);
              let ipMap = response.data.ip_map;
              threats = threats.threats.map(function(threat) {
                return SecurityEventsFactory.editDisplayedThreat(threat, ipMap);
              });
              violations = violations.violations.map(function(violation) {
                return SecurityEventsFactory.editDisplayedViolation(
                  violation,
                  ipMap
                );
              });
              incidents = incidents.incidents.map(function(incident) {
                return SecurityEventsFactory.editDisplayedIncident(
                  incident,
                  ipMap
                );
              });
              $scope.displayedSecurityEvents = SecurityEventsFactory.displayedSecurityEvents
                .concat(threats)
                .concat(violations)
                .concat(incidents);
              if ($scope.displayedSecurityEvents.length > 0) {
                let sortingStartTime = new Date();
                $scope.displayedSecurityEvents = $scope.displayedSecurityEvents.sort(
                  (a, b) => {
                    return b.reportedTimestamp - a.reportedTimestamp;
                  }
                );

                console.log(
                  "Security Events (After edited): ",
                  angular.copy($scope.displayedSecurityEvents)
                );

                $scope.domainList = _getDomainList($scope.displayedSecurityEvents);

                _prepareDateSlider();
                _prepareSparkline();
                _setTimeRange($scope.nowDateStr, $scope.earliestDateStr);
              }
              $scope.isDataReady = true;
              console.log("selectedRow=",$stateParams.selectedRow);
              if ($stateParams.selectedRow) {
                $scope.search = $filter("date")($stateParams.selectedRow.reported_at, "MMM dd, yyyy HH:mm:ss");
                $scope.onFilterChanged('quick', $scope.search);
              }
            });
          })
          .catch(function(err) {
            console.warn(err);
            $scope.isDataReady = true;
            $scope.secEventsErr = true;
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              $scope.secEventsMessage = Utils.getErrorMessage(err);
            }
            $scope.search = "";
          });
      };

      $scope.loadTags = function(query) {
        const createFilter = function(query) {
          let lowercaseQuery = angular.lowercase(query);
          return function filterFn(criteria) {
            return (criteria.toLowerCase().indexOf(lowercaseQuery) >= 0);
          };
        }
        let domains = $scope.domainList;
        return query
          ? domains.filter(createFilter(query))
          : [];
      };

      const _getDomainList = function(allSecurityEvents) {
        let domainSet = new Set();
        allSecurityEvents.forEach(event => {
          if (event.endpoint.source && event.endpoint.source.domain) {
            domainSet.add(event.endpoint.source.domain);
          }
          if (event.endpoint.destination && event.endpoint.destination.domain) {
            domainSet.add(event.endpoint.destination.domain);
          }
        });
        console.log("Domain set: ", domainSet);
        return Array.from(domainSet);
      }

      const _prepareSparkline = function() {
        let dateGroupedEvent = Utils.groupBy(
          $scope.displayedSecurityEvents,
          "reportedOn"
        );
        $scope.sparklingLineData = [];
        let date = $scope.earliestDateStr;
        let startDate = date;
        for (
          ;
          date <= $scope.nowDateStr;
          date = Utils.getDateByInterval(date, 1, "days").substring(0, 8)
        ) {
          $scope.sparklingLineData.push(
            dateGroupedEvent.hasOwnProperty(date)
              ? dateGroupedEvent[date].length
              : 0
          );
        }
        //Make fake data for showing chart for single date
        if ($scope.maxTimeGap === 0) {
          $scope.sparklingLineData.push(
            dateGroupedEvent.hasOwnProperty(startDate)
              ? dateGroupedEvent[startDate].length
              : 0
          );
        }
        $scope.sparklingLineLabels = new Array($scope.sparklingLineData.length);
        $scope.sparklingLineColors = ["#93d47d"];
        $scope.sparklingLineOptions = {
          maintainAspectRatio: false,
          legend: {
            display: false
          },
          tooltips: {
            enabled: false
          },
          elements: {
            point:{
              radius: 0
            }
          },
          scales: {
            yAxes: [
              {
                ticks: {
                  display: false,
                  beginAtZero: true
                },
                gridLines: {
                  color: "rgba(0, 0, 0, 0)",
                  tickMarkLength: false,
                  drawBorder: false
                }
              },
            ],
            xAxes: [
              {
                ticks: {
                  display: false
                },
                gridLines: {
                  color: "rgba(0, 0, 0, 0)",
                  tickMarkLength: false,
                  drawBorder: false
                }
              },
            ]
          }
        };
        $scope.sparklingLineDatasetOverride =
          {
            backgroundColor: "rgba(100, 161, 80, 0.2)",
            borderColor: "#93d47d",
            fill: true
          };
      };

      const _prepareDateSlider = function() {
        let nowDateObj = new Date();
        $scope.nowDateStr = Utils.parseDatetimeStr(nowDateObj).substring(0, 8);
        $scope.earliestDateStr = Utils.parseLocalDate(
          $scope.displayedSecurityEvents[
            $scope.displayedSecurityEvents.length - 1
          ].orgReportedAt
        );
        $scope.maxTimeGap = Utils.getDuration(
          $scope.nowDateStr,
          $scope.earliestDateStr
        );
        $scope.slider = {
          minValue: 0,
          maxValue: $scope.maxTimeGap > 0 ? $scope.maxTimeGap : 1, //Make fake date to show date slider for single date
          options: {
            floor: 0,
            ceil: $scope.maxTimeGap > 0 ? $scope.maxTimeGap : 1, //Make fake date to show date slider for single date
            step: 1,
            noSwitching: true,
            showTicks: $scope.maxTimeGap < 30,
            readOnly: $scope.maxTimeGap === 0,
            translate: function(value) {
              let dateStr = Utils.getDateByInterval(
                $scope.earliestDateStr,
                value,
                "days"
              ).substring(0, 8);
              let dateBeforeConvert = `${dateStr.substring(
                0,
                4
              )}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
              if ($scope.maxTimeGap === 0) {
                //Make fake date to show date slider for single date
                return $scope.nowDateStr === dateStr
                  ? $filter("date")(dateBeforeConvert, "MMM dd, y")
                  : $translate.instant("general.NOW");
              } else {
                return $scope.nowDateStr === dateStr
                  ? $translate.instant("general.NOW")
                  : $filter("date")(dateBeforeConvert, "MMM dd, y");
              }
            },
            onStart: function() {
              // $scope.begin = 0;
              let listElem = document.getElementById("sec-event-list");
              if (listElem) {
                listElem.scrollTop = 0;
              }
            }
          }
        };
      };

      $scope.refresh();

      $scope.isInternalGroup = function(group) {
        return INTERNAL_GROUPS.includes(group);
      };

      $scope.reviewRule = function(eventType, secEvent) {
        if (eventType === "threat") {
          //ToDo: Discuss Threat tolerance logic
        } else if (eventType === "violation") {
          openReviewNetworkRuleModal(secEvent);
        } else {
          if (
            secEvent.details.message.messageCategory
              .toLowerCase()
              .indexOf("process") >= 0
          ) {
            openReviewProcessRuleModal(secEvent);
          }
        }
      };

      const getNetworkRule = function(ruleId, success, error) {
        $http
          .get(POLICY_RULE_URL, { params: { id: ruleId } })
          .then(function(response) {
            $scope.networkRule = response.data.rule;
            $scope.networkRule.allowed = $scope.networkRule.action === "allow";
            success();
          })
          .catch(function(err) {
            console.warn(err);
            error(err);
          });
      };

      const getProcessRule = function(incidentMsg, success, error) {
        $http
          .get(PROCESS_PROFILE_URL, { params: { name: incidentMsg.group } })
          .then(function(response) {
            $scope.processRule = response.data.process_profile.process_list.filter(
              rule => {
                return (
                  rule.name === incidentMsg.procName &&
                  rule.path === incidentMsg.procPath
                );
              }
            );
            success();
          })
          .catch(function(err) {
            console.warn(err);
            error(err);
          });
      };

      $scope.canShowReviewRule = function(secEvent) {
        let srcGroup = secEvent.endpoint.source.group4Rule;
        let destGroup = secEvent.endpoint.destination.group4Rule;
        return srcGroup.length > 0 && destGroup.length > 0;
      };

      const openReviewNetworkRuleModal = function(secEvent) {
        $scope.networkRule = {};
        $scope.groupList = [];
        let success = function() {

          $mdDialog
            .show({
              controller: DialogController4ReviewNetworkRule,
              templateUrl: "dialog.review-network-rule.html",
              locals: {
                networkRule: $scope.networkRule,
                secEvent: secEvent,
                groupList: $scope.groupList
              }
            })
            .then(function() {}, function() {});
        };

        let error = function(err) {
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("securityEvent.REVIEW_RULE_ERR"), false)
            );
          }
        };
        if (secEvent.ruleId === 0) {
          success();
        } else {
          getNetworkRule(secEvent.ruleId, success, error);
        }
      };

      const openReviewProcessRuleModal = function(secEvent) {
        $scope.processRule = [];
        let success = function() {
          $mdDialog
            .show({
              controller: DialogController4ReviewProcessRule,
              templateUrl: "dialog.review-process-rule.html",
              locals: {
                processRule: $scope.processRule,
                secEvent: secEvent
              }
            })
            .then(function() {}, function() {});
        };

        let error = function(err) {
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("securityEvent.REVIEW_RULE_ERR"), false)
            );
          }
        };
        if (secEvent.details.message.group) {
          getProcessRule(secEvent.details.message, success, error);
        } else {
          success();
        }
      };

      DialogController4ReviewNetworkRule.$inject = [
        "$scope",
        "$mdDialog",
        "$translate",
        "$http",
        "Utils",
        "Alertify",
        "networkRule",
        "secEvent"
      ];
      function DialogController4ReviewNetworkRule(
        $scope,
        $mdDialog,
        $translate,
        $http,
        Utils,
        Alertify,
        networkRule,
        secEvent
      ) {
        $scope.networkRule = networkRule;
        $scope.secEvent = secEvent;
        $scope.newAction = true;
        $scope.isReadOnlyRule = false;
        $scope.ruleTypeClass = "";

        if (networkRule.id) {
          $scope.violatedRule = `${$translate.instant(
            "securityEvent.VIOLATED_RULE_BRIEF_1",
            {
              id: networkRule.id
            }
          )} ${$translate.instant(
            `securityEvent.${networkRule.action.toUpperCase()}`
          )}\
          ${
            networkRule.applications === "any"
              ? $translate.instant("securityEvent.ON_ANY_APPS")
              : $translate.instant("securityEvent.ON_APPS", {
                  applications: networkRule.applications.join(", ")
                })
          }\
          ${
            networkRule.ports === "any"
              ? $translate.instant("securityEvent.ON_ANY_PORTS")
              : $translate.instant("securityEvent.ON_PORTS", {
                  ports: networkRule.ports
                })
          }\
          ${$translate.instant("securityEvent.VIOLATED_RULE_BRIEF_2", {
            from: networkRule.from,
            to: networkRule.to
          })}`;
          $scope.isReadOnlyRule =
            (networkRule.cfg_type === CFG_TYPE.FED ||
            networkRule.cfg_type === CFG_TYPE.GROUND) ||
            $scope.secEvent.reviewRulePermission === "r";
          $scope.ruleTypeClass = colourMap[networkRule.cfg_type.toUpperCase()];
        } else {
          let srcGroup = secEvent.endpoint.source.group4Rule;
          let destGroup = secEvent.endpoint.destination.group4Rule;
          $scope.violatedImplicitRule = $translate.instant(
            "securityEvent.IMPLICIT_RULE_BRIEF",
            {
              from: srcGroup,
              to: destGroup
            }
          );
          $scope.isReadOnlyRule =
            (networkRule.cfg_type === CFG_TYPE.FED ||
            networkRule.cfg_type === CFG_TYPE.GROUND) ||
            $scope.secEvent.reviewRulePermission === "r";
          $scope.networkRule.from = srcGroup;
          $scope.networkRule.to = destGroup;
          $scope.networkRule.applications = [];
          $scope.networkRule.ports = "";
          $scope.networkRule.cfg_type = CFG_TYPE.CUSTOMER;
          $scope.networkRule.learned = false;
          $scope.networkRule.disable = false;
        }

        $scope.isUpdateRuleAuthorized = SecurityEventsFactory.isUpdateRuleAuthorized;

        $scope.allowed = true;
        $scope.hide = function() {
          $mdDialog.hide();
        };
        $scope.cancel = function() {
          $mdDialog.cancel();
        };

        $scope.comparePortStr = function(str1, str2) {
          return (
            str1
              .split(",")
              .sort()
              .join(",") ===
              str2
                .split(",")
                .sort()
                .join(",") || !$scope.networkRule.id
          );
        };

        $scope.updateNetworkRule = function() {
          $scope.networkRule.action = "allow";
          delete $scope.networkRule.id;
          $scope.networkRule.applications =
            $scope.secEvent.applications.length > 0
              ? $scope.secEvent.applications.split(", ")
              : [];
          $scope.networkRule.ports = $scope.secEvent.details.serverPort;
          $http
            .post(POLICY_RULE_URL, $scope.networkRule)
            .then(function() {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("network.RULE_DEPLOY_OK"));
              $mdDialog.hide();
            })
            .catch(function(err) {
              console.warn(err);
              if (USER_TIMEOUT.indexOf(err.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(
                    err,
                    $translate.instant("network.RULE_DEPLOY_FAILED"),
                    false
                  )
                );
              }
            });
        };
      }

      DialogController4ReviewProcessRule.$inject = [
        "$scope",
        "$mdDialog",
        "$translate",
        "$http",
        "Utils",
        "Alertify",
        "processRule",
        "secEvent"
      ];
      function DialogController4ReviewProcessRule(
        $scope,
        $mdDialog,
        $translate,
        $http,
        Utils,
        Alertify,
        processRule,
        secEvent
      ) {
        $scope.newAction = true;
        $scope.processRule = processRule.length === 1 ? processRule[0] : {};
        console.log($scope.processRule);
        $scope.secEvent = secEvent;
        $scope.isReviewRule =
          !Utils.isEmptyObj($scope.processRule) &&
          $scope.secEvent.details.message.messageCategory ===
            "processProfileViolation";
        $scope.isReadOnlyRule =
          !Utils.isEmptyObj($scope.processRule) &&
          ($scope.processRule.cfg_type === CFG_TYPE.FED ||
            $scope.processRule.cfg_type === CFG_TYPE.GROUND) ||
          $scope.secEvent.reviewRulePermission === "r";
        $scope.isUpdateRuleAuthorized = SecurityEventsFactory.isUpdateRuleAuthorized;
        $scope.CFG_TYPE = CFG_TYPE;
        $scope.processRule.allowed = !Utils.isEmptyObj($scope.processRule)
          ? $scope.processRule.action === "allow"
          : false;
        let originalProcessRule = {
          name: $scope.processRule.name || "",
          path: $scope.processRule.path || "",
          action: $scope.processRule.action || false
        };
        if (!$scope.isReviewRule) {
          $scope.processRule.allowed = !$scope.processRule.allowed;
        }
        $scope.hide = function() {
          $mdDialog.hide();
        };
        $scope.cancel = function() {
          $mdDialog.cancel();
        };

        $scope.updateProcessRule = function() {
          if ($scope.isReviewRule && !Utils.isEmptyObj($scope.processRule)) {
            overwriteProcessRule();
          } else {
            proposeNewProcessRule();
          }
        };

        const overwriteProcessRule = function() {
          let action = "allow";

          let changedProcessRule = {
            name: $scope.processRule.name || "",
            path: $scope.processRule.path || "",
            action: action
          };

          let payload = {
            process_profile_config: {
              group: $scope.secEvent.details.message.group,
              process_change_list: [changedProcessRule],
              process_delete_list: [originalProcessRule]
            }
          };
          sendProcessRuleUpdateRequest(payload);
        };

        const proposeNewProcessRule = function() {
          let action = "allow";

          let payload = {
            process_profile_config: {
              group: $scope.secEvent.details.message.group,
              process_change_list: [
                {
                  name: $scope.secEvent.details.message.procName || "",
                  path: $scope.secEvent.details.message.procPath || "",
                  action: action
                }
              ]
            }
          };
          sendProcessRuleUpdateRequest(payload);
        };

        const sendProcessRuleUpdateRequest = function(payload) {
          $http
            .patch(PROCESS_PROFILE_URL, payload)
            .then(function() {
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("network.RULE_DEPLOY_OK"));
              $mdDialog.hide();
            })
            .catch(function(err) {
              console.warn(err);
              if (USER_TIMEOUT.indexOf(err.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(
                    err,
                    $translate.instant("network.RULE_DEPLOY_FAILED"),
                    false
                  )
                );
              }
            });
        };
      }

      $scope.showAllFiles = function(files, ev) {
        ev.stopPropagation();
        $scope.currFiles = files;
        $timeout(() => {
          $scope.isGradientTopBottomShown =
            document.getElementById("all-files").clientHeight >= 300;
        }, 200);
        $scope.isAllFilesShown = true;
        $scope.panelPosition = {
          bottom: $window.innerHeight - ev.pageY + "px",
          left: ev.pageX - 900 + "px"
        };
      };

      $scope.hideAllFiles = function() {
        $scope.isAllFilesShown = false;
        $scope.onPacketPreview = false;
      };

      $scope.showPacket = function(id, ev) {
        ev.stopPropagation();
        $scope.packetErr = false;
        $scope.packetErrMSG = "";
        $scope.loadingPacket = true;
        $http
          .get(THREAT_URL, { params: { id: id } })
          .then(function(response) {
            $scope.packet = Utils.decode(response.data.threat.packet);
            $scope.rawPacket = response.data.threat.packet;
            $scope.hexItems = [];
            $scope.chars = [];
            $scope.positions = [];
            if ($scope.packet.length > 0) {
              for (let i in $scope.packet) {
                $scope.hexItems.push(_toHex($scope.packet[i], 2));
                $scope.chars.push(_toChar($scope.packet[i]));
              }
              $scope.offset = $scope.current = 0;
              $scope.cols = Math.ceil($scope.packet.length / 16);
              for (let i = 0; i < $scope.cols; i += 1) {
                $scope.positions.push(_toHex($scope.offset + i * 16, 8));
              }
            }
            $scope.onPacketPreview = true;
            $scope.loadingPacket = false;
          })
          .catch(function(err) {
            console.warn(err);
            $scope.packetErr = true;
            $scope.loadingPacket = false;
            $scope.onPacketPreview = true;
            $scope.packetErrMSG = Utils.getErrorMessage(err);
          });
      };

      $scope.exportPcap = function(ev) {
        ev.stopPropagation();
        if ($scope.packet && $scope.packet.length > 0) {
          let pcap = $scope.packet;

          let blockHeader = new Uint32Array(8);
          //Dummy block header
          blockHeader[0] = 0xa1b2c3d4;
          blockHeader[1] = 0x00040002;
          blockHeader[2] = 0x00000000;
          blockHeader[3] = 0x00000000;
          blockHeader[4] = 0x0000ffff;
          blockHeader[5] = 0x00000001;
          blockHeader[6] = 0x4f6ebc6b;
          blockHeader[7] = 0x00069967;

          let lengthHex = Number($scope.packet.length)
            .toString(16)
            .padStart(8, "0");
          let lengthHesSection = lengthHex.match(/.{1,2}/g).reverse();
          let sectionLen = new Uint8Array(4);
          for (let i = 0; i < 4; i++) {
            sectionLen[i] = parseInt(lengthHesSection[i], 16);
          }

          let blob = new Blob([blockHeader, sectionLen, sectionLen, pcap], {
            type: "application/octet-stream"
          });
          FileSaver.saveAs(blob, `pocket_${Utils.parseDatetimeStr(new Date())}.pcap`);
        }
      };

      const _toHex = function(number, length) {
        let s = number.toString(16).toUpperCase();
        while (s.length < length) {
          s = "0" + s;
        }
        return s;
      };

      const _toChar = function(number) {
        return number <= 32 ? " " : String.fromCharCode(number);
      };

      $scope.closeDetails = function(elemId) {
        document.getElementById(elemId).checked = false;
        $scope.openedIndex = -1;
        $scope.openedPage = -1;
      };

      $scope.keepAlive = function() {
        const success = function(res) {};
        const error = function(err) {
          console.warn(err);
        };
        Utils.keepAlive(success, error);
      };

      $scope.getOpenedRec = function(evt, index, page) {
        // console.log("Before: ", $scope.openedIndex, $scope.openedPage)
        if (evt.target.checked) {
          $scope.openedIndex = index;
          $scope.openedPage = page;
        } else {
          $scope.openedIndex = -1;
          $scope.openedPage = -1;
        }
        // console.log("After: ", $scope.openedIndex, $scope.openedPage)
      };

      $scope.clickRadio = function(event, elemGroup, elem) {
        // console.log(elem,$scope[elemGroup][elem])
        if ($scope[elemGroup][elem]) {
          event.target.checked = false;
        }
        $scope[elemGroup][elem] = !$scope[elemGroup][elem];
        for (let _elem in $scope[elemGroup]) {
          if (_elem !== elem) {
            $scope[elemGroup][_elem] = false;
          }
        }
      };

      const renderPolicyMode = function() {
        let mode = $scope.workload.policy_mode
          ? Utils.getI18Name($scope.workload.policy_mode)
          : "";
        let labelCode = colourMap[$scope.workload.policy_mode];
        $scope.modeHtml = `<span class="hand label label-fs label-${labelCode}">${$sanitize(
          mode
        )}<em class="ml-sm fa fa-angle-down" aria-hidden="true"></em></span>`;
      };

      $scope.showContainerDetails = function(ev, endpoint, hostName) {
        if (endpoint.displayName && endpoint.displayName.startsWith(securityEventLocation.HOST)) {
          $scope.showHostDetails(
            ev,
            endpoint.id.substring(5),
            hostName
          );
          return;
        }
        ev.stopPropagation();
        console.log("endpoint: ",endpoint);
        $scope.containerTitle = endpoint.displayName || endpoint.name;
        $scope.containerTitle = $scope.containerTitle.split(":")[0];
        SecurityEventsFactory.getContainer(endpoint.id)
          .then(function(res) {
            $scope.workload = res.data.workload;
            $scope.workload.policy_mode_txt = $scope.workload.policy_mode ?
              $translate.instant(`enum.${$scope.workload.policy_mode.toUpperCase()}`) : "";
            SecurityEventsFactory.getProcess(endpoint.id)
              .then(function(procRes) {
                $scope.procGridOptions.overlayNoRowsTemplate = $translate.instant(
                  "general.NO_ROWS"
                );
                let treeData = ContainerFactory.buildTree(
                  procRes.data.processes,
                  "pid",
                  "parent"
                );
                $scope.procGridOptions.api.setRowData(treeData);
                $scope.procGridOptions.api.sizeColumnsToFit();
              })
              .catch(function(procErr) {
                console.log(procErr);
                if (procErr.data.code === 7) $scope.onLost();
                else {
                  $scope.procGridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(
                    procErr
                  );
                  $scope.procGridOptions.api.setRowData();
                }
              });
            renderPolicyMode();
            $scope.onHostDetail = false;
            $scope.onEnforcerDetail = false;
            $scope.onContainerDetail = true;
          })
          .catch(function(err) {
            console.warn(err);
            $scope.containerErr = true;
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  err,
                  $translate.instant("securityEvent.CONTAINER_ERR"),
                  false
                )
              );
            }
          });
      };

      $scope.switchServiceModeOnPopup = function(policyMode, workload) {
        const callback = function() {
          $scope.workload.policy_mode = policyMode;
          renderPolicyMode();
        };
        NetworkFactory.switchServiceMode(policyMode, workload.service_group, callback);
      }

      $scope.fitGrid = function() {
        $timeout(() => {
          $scope.procGridOptions.api.sizeColumnsToFit();
        }, 200);
      };

      $scope.showHostDetails = function(ev, hostId, hostName) {
        ev.stopPropagation();
        $scope.hostTitle = hostName;
        SecurityEventsFactory.getHost(hostId)
          .then(function(res) {
            $scope.host = res.data.host;
            $scope.onContainerDetail = false;
            $scope.onEnforcerDetail = false;
            $scope.onHostDetail = true;
          })
          .catch(function(err) {
            console.warn(err);
            $scope.hostErr = true;
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  err,
                  $translate.instant("securityEvent.HOST_ERR"),
                  false
                )
              );
            }
          });
      };

      $scope.showEnforcerDetails = function(ev, enforcerId, enforcerName) {
        ev.stopPropagation();
        $scope.enforcerTitle = enforcerName;
        SecurityEventsFactory.getEnforcer(enforcerId)
          .then(function(res) {
            $scope.enforcer = res.data.enforcer;
            $scope.onContainerDetail = false;
            $scope.onHostDetail = false;
            $scope.onEnforcerDetail = true;
            $scope.upTime = moment.duration(moment().diff($scope.enforcer.joined_at)).humanize()
          })
          .catch(function(err) {
            console.warn(err);
            $scope.enforcerErr = true;
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  err,
                  $translate.instant("securityEvent.ENFORCER_ERR"),
                  false
                )
              );
            }
          });
      };

      $scope.downloadPdf = function() {
        $scope.isPdfPreparing = true;
        if ($scope.worker) {
          $interval.cancel(timer);
          timer = $interval(function() {
            // console.log($scope.secEventPdfBlob);
            if ($scope.secEventPdfBlob) {
              $scope.isPdfPreparing = false;
              FileSaver.saveAs(
                $scope.secEventPdfBlob,
                `Security events report_${Utils.parseDatetimeStr(new Date())}.pdf`
              );
              $interval.cancel(timer);
            }
          }, 1000);
        } else {
          let pdfRawData = Object.assign(
            { data: $scope.filteredSecEvents },
            { distByEventType: $scope.distByEventType },
            {
              metadata: _i18n4Pdf({
                from:
                  $scope.filteredSecEvents.length > 0
                    ? $scope.filteredSecEvents[
                        $scope.filteredSecEvents.length - 1
                      ].reportedAt
                    : "",
                to:
                  $scope.filteredSecEvents.length > 0
                    ? $scope.filteredSecEvents[0].reportedAt
                    : "",
                filteredCount: $scope.filteredSecEvents.length,
                rangedCount: $scope.rangedSecEvents.length
              })
            },
            { constant: imageMap, rowLimit: REPORT_TABLE_ROW_LIMIT },
            { charts: _getChartsForPdf() }
          );
          let pdfData = generateSecEventPdf(pdfRawData).pdfData;
          let pdf = pdfMake.createPdf(pdfData);
          pdf.getBlob(function(blob) {
            $scope.isPdfPreparing = false;
            FileSaver.saveAs(blob, `Security events report_${Utils.parseDatetimeStr(new Date())}.pdf`);
          });
        }
      };

      $scope.downloadCsv = function() {
        if ($scope.worker) {
          $interval.cancel(timer2);
          timer2 = $interval(function() {
            if ($scope.secEventCsvData) {
              let csv = Utils.arrayToCsv(angular.copy($scope.secEventCsvData));
              let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              FileSaver.saveAs(blob, `Security_events_${Utils.parseDatetimeStr(new Date())}.csv`);
              $interval.cancel(timer2);
            }
          }, 1000);
        } else {
          let pdfRawData = Object.assign(
            { data: $scope.filteredSecEvents },
            { distByEventType: $scope.distByEventType },
            {
              metadata: _i18n4Pdf({
                from:
                  $scope.filteredSecEvents.length > 0
                    ? $scope.filteredSecEvents[
                        $scope.filteredSecEvents.length - 1
                      ].reportedAt
                    : "",
                to:
                  $scope.filteredSecEvents.length > 0
                    ? $scope.filteredSecEvents[0].reportedAt
                    : "",
                filteredCount: $scope.filteredSecEvents.length,
                rangedCount: $scope.rangedSecEvents.length
              })
            },
            { constant: imageMap, rowLimit: REPORT_TABLE_ROW_LIMIT },
            { charts: _getChartsForPdf() }
          );
          let csvTbl = generateSecEventPdf(pdfRawData).csvData;
          let csv = Utils.arrayToCsv(angular.copy(csvTbl));
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(blob, "Security_events.csv");
        }
      };

      $scope.$on("$destroy", function() {
        $interval.cancel(timer);
        $interval.cancel(timer2);
        if ($scope.worker) {
          $scope.worker.terminate();
        }
      });

      const generateSecEventPdf = function(pdfRawData) {
        let metadata = pdfRawData.metadata;
        let imageMap = pdfRawData.constant;
        let rowLimit = pdfRawData.rowLimit;
        let charts = pdfRawData.charts;
        let distByEvtType = pdfRawData.distByEventType;

        const _organizeSecEventPdfTblRow = function(secEvent, index) {
          // const severityColor = {
          //   warning: [255, 152, 0],
          //   error: [220, 64, 52],
          //   info: [33, 150, 243]
          // };
          let id = (index + 1).toString();
          let title = secEvent.name4Pdf;
          let severity = secEvent.details.level
            ? secEvent.details.level.name
            : "";
          let location = _organizeLocation(secEvent);
          let details = _organizeSecEventDetails(secEvent);
          let action = secEvent.details.action
            ? secEvent.details.action.name4Pdf
            : "";
          let datetime = secEvent.reportedAt;

          return [
            id,
            title,
            { text: severity, style: `severity_${severity.toLowerCase()}` },
            location,
            details,
            action,
            datetime
          ];
        };

        const _organizeLocation = function(secEvent) {
          if (secEvent.endpoint.source && secEvent.endpoint.destination) {
            return {
              stack: [
                {
                  ul: [
                    `${metadata.items.source}: ${
                      secEvent.endpoint.source.domain
                        ? `${secEvent.endpoint.source.domain}: `
                        : ""
                    }${secEvent.endpoint.source.displayName}`,
                    `${metadata.items.destination}: ${
                      secEvent.endpoint.destination.domain
                        ? `${secEvent.endpoint.destination.domain}: `
                        : ""
                    }${secEvent.endpoint.destination.displayName}`
                  ]
                }
              ]
            };
          } else if (
            secEvent.endpoint.source &&
            !secEvent.details.labels.includes("host")
          ) {
            return {
              stack: [
                {
                  ul: [
                    `${metadata.items.host}: ${secEvent.host_name}`,
                    `${metadata.items.container}: ${
                      secEvent.endpoint.source.domain
                        ? `${secEvent.endpoint.source.domain}: `
                        : ""
                    }${secEvent.endpoint.source.displayName}`
                  ]
                }
              ]
            };
          } else if (
            secEvent.endpoint.destination &&
            !secEvent.details.labels.includes("host")
          ) {
            return {
              stack: [
                {
                  ul: [
                    `${metadata.items.host}: ${secEvent.host_name}`,
                    `${metadata.items.container}: ${
                      secEvent.endpoint.destination.domain
                        ? `${secEvent.endpoint.destination.domain}: `
                        : ""
                    }${secEvent.endpoint.destination.displayName}`
                  ]
                }
              ]
            };
          } else {
            return {
              stack: [
                {
                  ul: [`${metadata.items.host}: ${secEvent.host_name}`]
                }
              ]
            };
          }
        };

        const _organizeSecEventDetails = function(secEvent) {
          let ul = [];

          switch (secEvent.type.name) {
            case "threat":
              if (secEvent.details.clusterName)
                ul.push(
                  `${metadata.items.clusterName}: ${
                    secEvent.details.clusterName
                  }`
                );
              if (secEvent.applications)
                ul.push(
                  `${metadata.items.applications}: ${secEvent.applications}`
                );
              if (secEvent.details.count)
                ul.push(`${metadata.items.count}: ${secEvent.details.count}`);
              if (secEvent.details.message.content)
                ul.push(
                  `${metadata.items.description}: ${
                    secEvent.details.message.content
                  }`
                );
              return { stack: [{ ul: ul }] };
            case "violation":
              if (secEvent.details.clusterName)
                ul.push(
                  `${metadata.items.clusterName}: ${
                    secEvent.details.clusterName
                  }`
                );
              if (secEvent.applications)
                ul.push(
                  `${metadata.items.applications}: ${secEvent.applications}`
                );
              if (secEvent.details.serverPort)
                ul.push(
                  `${
                    secEvent.details.port > 0
                      ? metadata.items.serverPort
                      : metadata.items.protocol
                  }: ${secEvent.details.serverPort}`
                );
              if (secEvent.details.serverImage)
                ul.push(
                  `${metadata.items.serverImage}: ${
                    secEvent.details.serverImage
                  }`
                );
              return { stack: [{ ul: ul }] };
            case "incident":
              if (secEvent.details.clusterName)
                ul.push(
                  `${metadata.items.clusterName}: ${
                    secEvent.details.clusterName
                  }`
                );
              if (secEvent.details.message.group)
                ul.push(
                  `${metadata.items.group}: ${secEvent.details.message.group}`
                );
              if (secEvent.details.message.procName)
                ul.push(
                  `${metadata.items.procName}: ${
                    secEvent.details.message.procName
                  }`
                );
              if (secEvent.details.message.procPath)
                ul.push(
                  `${metadata.items.procPath}: ${
                    secEvent.details.message.procPath
                  }`
                );
              if (secEvent.details.message.procCmd)
                ul.push(
                  `${metadata.items.procCmd}: ${
                    secEvent.details.message.procCmd
                  }`
                );
              if (
                secEvent.details.message.procCmd &&
                secEvent.name.toLowerCase().indexOf("process") < 0 &&
                secEvent.name.toLowerCase().indexOf("escalation") < 0 &&
                secEvent.name.toLowerCase().indexOf("detected") < 0
              )
                ul.push(
                  `${metadata.items.cmd}: ${secEvent.details.message.procCmd}`
                );
              if (secEvent.details.message.procEffectiveUid)
                ul.push(
                  `${metadata.items.procEffectedUid}: ${
                    secEvent.details.message.procEffectiveUid
                  }`
                );
              if (secEvent.details.message.procEffectiveUser)
                ul.push(
                  `${metadata.items.procEffectedUser}: ${
                    secEvent.details.message.procEffectiveUser
                  }`
                );
              if (secEvent.details.message.localIP)
                ul.push(
                  `${metadata.items.localIp}: ${
                    secEvent.details.message.localIP
                  }`
                );
              if (secEvent.details.message.remoteIP)
                ul.push(
                  `${metadata.items.remoteIp}: ${
                    secEvent.details.message.remoteIP
                  }`
                );
              if (secEvent.details.message.localPort)
                ul.push(
                  `${metadata.items.localPort}: ${
                    secEvent.details.message.localPort
                  }`
                );
              if (secEvent.details.message.localPort)
                ul.push(
                  `${metadata.items.remotePort}: ${
                    secEvent.details.message.localPort
                  }`
                );
              if (secEvent.details.message.ipProto)
                ul.push(
                  `${metadata.items.ipProto}: ${
                    secEvent.details.message.ipProto
                  }`
                );
              if (secEvent.details.message.filePath)
                ul.push(
                  `${metadata.items.filePath}: ${
                    secEvent.details.message.filePath
                  }`
                );
              if (secEvent.details.message.fileNames)
                ul.push(
                  `${metadata.items.fileNames}: ${
                    secEvent.details.message.fileNames
                  }`
                );
              return {
                stack: [secEvent.details.message.content, { ul: ul }]
              };
          }
        };

        const _organizeSecEventCsvTblRow = function(secEvent, index) {
          let resPrototype = {
            ID: "",
            Title: "",
            Severity: "",
            Location: "",
            Details: "",
            Action: "",
            Datetime: ""
          };
          resPrototype.ID = (index + 1).toString();
          resPrototype.Title = `${secEvent.name.replace(/\"/g, "'")}`;
          resPrototype.Severity = secEvent.details.level
            ? secEvent.details.level.name
            : "";
          resPrototype.Location = `${_organizeLocation(
            secEvent
          ).stack[0].ul.join("\n")}`;
          resPrototype.Details = `${_organizeSecEventDetails(secEvent)
            .stack.map(function(elem) {
              return typeof elem === "string" ? elem : elem.ul.join("\n");
            })
            .join("\n")
            .replace(/\"/g, "'")}`;
          resPrototype.Action = secEvent.details.action
            ? secEvent.details.action.name
            : "";
          resPrototype.Datetime = `${secEvent.reportedAt}`;
          return resPrototype;
        };

        let docDefinition = {
          info: {
            title: "Security events report",
            author: "NeuVector",
            subject: "Security events report",
            keywords: "Security events report"
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
                    image: imageMap.FOOTER_LINE,
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
            fontSize: 6
          },
          styles: {
            tableHeader: {
              bold: true
            },
            severity_error: {
              color: "#ff0000"
            },
            severity_critical: {
              color: "#ff0000"
            },
            severity_warning: {
              color: "#ff9900"
            },
            severity_info: {
              color: "#2299ff"
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
            }
          },
          content: [
            {
              image: imageMap.BACKGROUND,
              width: 1000,
              absolutePosition: { x: 0, y: 300 }
            },
            {
              image: imageMap.ABSTRACT,
              width: 450
            },
            {
              image: imageMap[metadata.others.logoName],
              width: 400,
              absolutePosition: { x: 350, y: 180 }
            },
            {
              text: metadata.title,
              fontSize: 40,
              color: "#777",
              bold: true,
              absolutePosition: { x: 150, y: 450 },
              pageBreak: "after"
            },
            {
              toc: {
                title: {
                  text: metadata.others.tocText,
                  style: "tocTitle"
                },
                numberStyle: "tocNumber"
              },
              margin: [60, 35, 20, 60],
              pageBreak: "after"
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
                    margin: [80, 15, 0, 60]
                  }
                },
                ,
                {
                  text: `    ${metadata.others.summaryRange}`,
                  color: "#3090C7",
                  fontSize: 10
                }
              ]
            },
            {
              text: metadata.others.byEventType,
              style: "contentSubHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 12,
                italic: true,
                color: "black",
                margin: [95, 10, 0, 60]
              }
            },
            {
              columns: [
                {
                  table: {
                    body: []
                  }
                },
                {
                  image: charts.canvas.byEventType,
                  width: 350
                }
              ]
            },
            {
              text: [
                {
                  text: metadata.others.subTitleDetails,
                  tocItem: true,
                  tocStyle: {
                    fontSize: 16,
                    bold: true,
                    color: "#4863A0",
                    margin: [80, 15, 0, 60]
                  },
                  style: "contentHeader"
                },
                {
                  text: `    ${metadata.others.detailsLimit}`,
                  color: "#fe6e6b",
                  fontSize: 10
                }
              ],
              margin: [0, 0, 0, 10]
            },
            {
              style: "table",
              table: {
                headerRows: 1,
                widths: ["2%", "20%", "4%", "29%", "35%", "4%", "6%"],
                body: [
                  [
                    { text: metadata.header.id, style: "tableHeader" },
                    { text: metadata.header.title, style: "tableHeader" },
                    {
                      text: metadata.header.severity,
                      style: "tableHeader"
                    },
                    {
                      text: metadata.header.location,
                      style: "tableHeader"
                    },
                    { text: metadata.header.details, style: "tableHeader" },
                    { text: metadata.header.action, style: "tableHeader" },
                    { text: metadata.header.datetime, style: "tableHeader" }
                  ]
                ]
              }
            }
          ]
        };

        let distLayout = {
          fillColor: function(i, node) {
            return i % 2 == 0 ? "#CBF8C0" : "#E9FFDE";
          },
          hLineColor: function(i, node) {
            return "white";
          },
          vLineColor: function(i, node) {
            return "white";
          }
        };

        // add distribute data
        docDefinition.content[7].columns[0].layout = distLayout;
        docDefinition.content[7].columns[0].fontSize = 10;
        docDefinition.content[7].columns[0].table.widths = [250, 30];

        if (distByEvtType.length) {
          for (let item of distByEvtType) {
            docDefinition.content[7].columns[0].table.body.push(item);
          }
        } else {
          docDefinition.content[7].columns[0].table.body.push([]);
        }

        let csvTbl = [];

        pdfRawData.data.forEach(function(secEvent, $index) {
          if ($index < rowLimit) {
            docDefinition.content[9].table.body.push(
              _organizeSecEventPdfTblRow(secEvent, $index)
            );
          }
          csvTbl.push(_organizeSecEventCsvTblRow(secEvent, $index));
        });

        return {
          pdfData: docDefinition,
          csvData: csvTbl
        };
      };
    }
  }

  function TwoWayInfiniteScroll() {
    return {
      restrict: "A",
      link: function(scope, element, attrs) {
        const closeDetails = function() {
          document.getElementsByName("secEvt").forEach(function(elem) {
            elem.checked = false;
          });
        };

        const scroll = function() {
          let a = element[0].scrollTop;
          let b = element[0].scrollHeight - element[0].clientHeight;

          let percentOfScroll = a / b;

          if (percentOfScroll > 0.9) {
            if (scope.filteredSecEvents.length - scope.begin > scope.limit) {
              scope.begin += 9;
              scope.page++;
              // console.log("page: ", scope.page)
              element[0].scrollTop -= 650;
              closeDetails();
            }
          } else if (percentOfScroll < 0.2 && percentOfScroll > 0) {
            if (scope.begin !== 0) {
              // console.log('scope.begin - 1');
              scope.begin -= 9;
              scope.page--;
              // console.log("page: ", scope.page)
              element[0].scrollTop += 650;
              closeDetails();
            }
          } else if (percentOfScroll == 0) {
            scope.begin = 0;
          }
          let targetIndex =
            scope.openedIndex - 9 * (scope.page - scope.openedPage);
          if (targetIndex < 30 && targetIndex >= 0) {
            document.getElementById(`sec-${targetIndex}`).checked = true;
          }
          scope.$apply();
        };

        const throttled = (function(delay, fn) {
          let lastCall = 0;
          return function(delay, fn, ...args) {
            const now = new Date().getTime();
            if (now - lastCall < delay) {
              return;
            }
            lastCall = now;
            return fn(...args);
          };
        })();

        const debounced = (function(delay, fn) {
          let timerId;
          return function(delay, fn, ...args) {
            if (timerId) {
              clearTimeout(timerId);
            }
            timerId = setTimeout(() => {
              fn(...args);
              timerId = null;
            }, delay);
          };
        })();

        element[0].addEventListener("scroll", function(e) {
          throttled(20, scroll);
          // debounced(1, scroll);
          // scroll();
        });
      }
    };
  }
})();
