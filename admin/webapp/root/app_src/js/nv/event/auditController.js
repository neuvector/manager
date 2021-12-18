(function() {
  "use strict";

  angular.module("app.assets").controller("AuditController", AuditController);

  AuditController.$inject = [
    "$scope",
    "$filter",
    "$http",
    "$translate",
    "$window",
    "$timeout",
    "Utils",
    "FileSaver",
    "Blob",
    "$interval",
    "$controller",
    "$state",
    "$sanitize"
  ];
  function AuditController(
    $scope,
    $filter,
    $http,
    $translate,
    $window,
    $timeout,
    Utils,
    FileSaver,
    Blob,
    $interval,
    $controller,
    $state,
    $sanitize
  ) {
    //=======For preloading English translation file only=====
    $translate.instant("general.VERSION", {}, "", "en");
    //=======For preloading English translation file only=====
    let filter = "";
    const UBUNTO = "http://people.ubuntu.com/~ubuntu-security/cve/";
    const DEBIAN = "https://security-tracker.debian.org/tracker/";
    const CENTOS_REDHAT = "https://access.redhat.com/errata/";
    const OTHER = "https://cve.mitre.org/cgi-bin/cvename.cgi?name=";
    const MAX_ITEMS = 9;
    const PAGE_SIZE = PAGE.AUDIT_LOGS;
    $scope.worker = null;
    $scope.isOnQuickFilter = false;
    $scope.filteredAudits = [];
    $scope.eof = false;
    let timer4Filter = null;
    activate();

    let baseCtl = $controller('BaseMultiClusterController',{ $scope: $scope});

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window); // cache reference for resize
      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("audit.COUNT_POSTFIX")
        );
      };
      let getEntityName4Pdf = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("audit.COUNT_POSTFIX", {}, "", "en")
        );
      };
      const found = $translate.instant("enum.FOUND");

      $scope.graphHeight = $window.innerHeight - 230;

      $scope.isAllFilesShown = false;
      $scope.progress = 0;

      $scope.REPORT_TABLE_ROW_LIMIT = REPORT_TABLE_ROW_LIMIT;

      const _initializeAdvFilter = function() {
        $scope.levelFilter = {
          isFilteringError: false,
          isFilteringCritical: false,
          isFilteringWarning: false,
          isFilteringInfo: false
        };

        $scope.categoryFilter = {
          isFilteringCompliance: false,
          isFilteringScan: false,
          isFilteringAdmission: false
        }

        $scope.selectedItemNode = null;
        $scope.searchTextNode = "";
        $scope.selectedItemContainer = null;
        $scope.searchTextContainer = "";
        $scope.selectedItemImage = null;
        $scope.searchTextImage = "";
        $scope.selectedItemProject = null;
        $scope.searchTextProject = "";
        $scope.selectedItemRegion = null;
        $scope.searchTextRegion = "";
        $scope.selectedItemFunction = null;
        $scope.searchTextFunction = "";
        $scope.selectedDomains = [];
        $scope.popup = { opened: false };
        $scope.otherKey = "";
        $scope.excludedKey = "";

        $scope.reportedFrom = null;
        $scope.reportedTo = null;
      }

      _initializeAdvFilter();

      angular.element($window).bind("resize", function() {
        $scope.graphHeight = $window.innerHeight - 230;
        $scope.$digest();
      });

      const iconMap = {
        "Container.Privilege.Escalation": "fa-cube",
        "Host.Privilege.Escalation": "fa-server"
      };

      let columnDefs = [
        {
          headerName: $translate.instant("threat.gridHeader.NAME"),
          field: "name",
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: { innerRenderer: eventCellRenderer },
          width: 230
        },
        {
          headerName: $translate.instant("audit.gridHeader.LEVEL"),
          field: "level",
          cellRenderer: renderLevel,
          width: 95,
          minWidth: 95,
          maxWidth: 95
        },
        {
          headerName: "",
          field: "workload_domain",
          hide: true
        },
        {
          headerName: "",
          field: "workload_name",
          hide: true
        },
        {
          headerName: "",
          field: "host_name",
          hide: true
        },
        {
          headerName: "",
          field: "registry",
          hide: true
        },
        {
          headerName: "",
          field: "workload_image",
          hide: true
        },
        {
          headerName: "",
          field: "repository",
          hide: true
        },
        {
          headerName: "",
          field: "tag",
          hide: true
        },
        {
          headerName: "",
          field: "platform",
          hide: true
        },
        {
          headerName: "",
          field: "platform_version",
          hide: true
        },
        {
          headerName: $translate.instant("general.LOCATION"),
          cellRenderer: function(params) {
            let location = "";
            if (params.data) {
              if (params.data.project_name) {
                location += `<strong>${$translate.instant("audit.gridHeader.PROJECT")} :</strong><span>
                               ${params.data.project_name}
                             </span><br/>`;
              }
              if (params.data.region) {
                location += `<strong>${$translate.instant("audit.gridHeader.REGION")} :</strong><span>
                               ${params.data.region}
                             </span><br/>`;
              }
              if (params.data.host_name) {
                location += `<strong>${$translate.instant("audit.gridHeader.NODE")} :</strong><span>
                               ${params.data.host_name}
                             </span><br/>`;
              }
              if (params.data.workload_name) {
                location += `<strong>${$translate.instant("audit.gridHeader.CONTAINER")} :</strong><span>
                               ${params.data.workload_domain
                                  ? `${params.data.workload_domain}: ${params.data.workload_name}`
                                  : params.data.workload_name
                                }
                             </span><br/>`;
              }
              if (params.data.registry) {
                location += `<strong>${$translate.instant("audit.gridHeader.REGISTRY")} :</strong><span>
                               ${params.data.registry}
                             </span><br/>`;
              }
              if (params.data.workload_image) {
                location += `<strong>${$translate.instant("audit.gridHeader.IMAGE")} :</strong><span>
                               ${params.data.workload_domain
                                  ? `${params.data.workload_domain}: ${params.data.workload_image}`
                                  : params.data.workload_image
                                }
                             </span><br/>`;
              }
              if (params.data.repository && params.data.tag) {
                location += `<strong>${$translate.instant("audit.gridHeader.IMAGE")} :</strong><span>
                               ${params.data.repository}:${params.data.tag}
                             </span><br/>`;
              }
              if (params.data.platform) {
                location += `<strong>${$translate.instant("audit.gridHeader.PLATFORM")} :</strong><span>
                               ${params.data.platform_version ?
                                  `${params.data.platform} (${$translate.instant("audit.gridHeader.VERSION")}: ${params.data.platform_version})` :
                                  params.data.platform}
                             </span><br/>`;
              }
              const isFind = function(array, key) {
                let index = -1;
                array.forEach(function(elem, idx) {
                  if (elem.split(":")[0].toLowerCase() === key) index = idx;
                });
                return index;
              }
              if (params.data.items) {
                let index = isFind(params.data.items, "image");
                if (index >= 0) {
                  let indexOfColon = params.data.items[index].indexOf(":");
                  location += `<strong>${$translate.instant("audit.gridHeader.IMAGE")} :</strong><span>
                               ${params.data.items[index].substring(indexOfColon + 1)}
                             </span><br/>`;
                }
              }
            }

            return $sanitize(location);
          },
          width: 660
        },
        {
          headerName: $translate.instant("threat.gridHeader.TIME"),
          field: "reported_at",
          cellRenderer: function(params) {
            return $sanitize($filter("date")(params.value, "MMM dd, y HH:mm:ss"));
          },
          comparator: dateComparator,
          icons: {
            sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
            sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
          },
          minWidth: 160,
          maxWidth: 170
        }
      ];

      function renderLevel(params) {
        let color = colourMap[params.value];
        let eventLevel = params.value;
        return `<span class="label label-fs label-${color}">${$sanitize(Utils.getI18Name(
          eventLevel
        ))}</span>`;
      }

      function renderRegistry(params) {
        return params.value ? params.value : "";
      }

      function eventCellRenderer(params) {
        return `<span style="cursor: default;">${params.value}</span>`;
      }

      function FullWidthCellRenderer() {}

      FullWidthCellRenderer.prototype.init = function(params) {
        let eTemp = document.createElement("div");
        eTemp.innerHTML = this.getTemplate(params);
        this.eGui = eTemp.firstElementChild;

        this.consumeMouseWheelOnCenterText();
      };

      const item = $translate.instant("audit.gridHeader.ITEMS");
      const message = $translate.instant("audit.gridHeader.MESSAGE");
      const high_vuls = $translate.instant("audit.gridHeader.HIGH_VUL_CNT");
      const medium_vuls = $translate.instant("audit.gridHeader.MEDIUM_VUL_CNT");
      const command = $translate.instant("audit.gridHeader.COMMAND");

      FullWidthCellRenderer.prototype.getTemplate = function(params) {
        let data = params.node.data;
        let className = iconMap[data.name];
        let colorName = colourMap[data.level];
        if (data.name.toLowerCase().indexOf("compliance") >= 0) {
          let items = "";
          for (let i = 0; i < data.items.length; i += 2) {
            items += `
              <div class="row ml mr">
                <div class="col-lg-6 pl0">
                  ${data.items[i]}
                </div>
                <div class="col-lg-6 pl0">
                  ${data.items[i + 1] ? data.items[i + 1] : ""}
                </div>
              </div>
            `;
          }
          return `<div class="full-width-panel">
                    <div class="full-width-summary" style="width: 220px;">
                      <div class="col-sm-6">
                        <span class="label label-${colorName}">${$sanitize(item)}</span>
                      </div>
                      <div class="col-sm-6 p0">
                        <span class="total">${$translate.instant(
                          "general.TOTAL"
                        )}: ${data.items.length}</span>
                      </div>
                      <div class="mt-sm col-sm-12" ng-click="exportBenchCsv(data)" ng-show="data.items.length>0">
                        <em
                          class="fa fa-file-excel-o xls-color hand"
                        ></em>
                        <span class="text-gray-label link">CSV</span>
                      </div>
                    </div>
                    <div class="full-width-center" style="font-size: 12px;">
                      ${items}
                    </div>
                  </div>`;
        } else if (data.name.toLowerCase().indexOf("scan") >= 0) {
          return `<div class="full-width-panel">
                    <div class="full-width-summary" style="width: 220px;">
                      <div class="col-sm-6">
                        <span class="label label-danger" uib-tooltip="{{'audit.gridHeader.HIGH_VUL' | translate}}">${$sanitize(high_vuls)}</span>
                      </div>
                      <div class="col-sm-6 p0">
                        <span class="total mt-lg">${$translate.instant(
                          "general.TOTAL"
                        )}: ${$sanitize(data.high_vul_cnt)}</span>
                      </div>
                      <div class="col-sm-6">
                        <span class="label label-warning" uib-tooltip="{{'audit.gridHeader.MEDIUM_VUL' | translate}}">${$sanitize(medium_vuls)}</span>
                      </div>
                      <div class="col-sm-6 p0">
                        <span class="total mt">${$translate.instant(
                          "general.TOTAL"
                        )}: ${$sanitize(data.medium_vul_cnt)}</span>
                      </div>
                      <div class="mt-sm col-sm-12" ng-click="exportCveCsv(data)" ng-show="data.medium_vul_cnt > 0 || data.high_vul_cnt > 0">
                        <em
                          class="fa fa-file-excel-o xls-color hand"
                        ></em>
                        <span class="text-gray-label link">CSV</span>
                      </div>
                      <div class="mt0 col-sm-12 cve-db-version"><strong>${$translate.instant(
                        "dashboard.heading.CVE_DB_VERSION"
                      )}:</strong>&nbsp;&nbsp;${$sanitize(data.cvedb_version)}</div>
                    </div>
                    ${
                      data.image_id ||
                      data.base_os ||
                      data.level.toLowerCase() === "error" ||
                      data.high_vuls ||
                      data.medium_vuls ||
                      data.items && data.items.length > 0
                        ? `<div class="full-width-center" style="font-size: 12px;">
                        <div class="ml mr">${
                          data.image_id
                            ? `<strong>${$translate.instant(
                                "audit.gridHeader.IMAGE_ID"
                              )}:</strong> ${$sanitize(data.image_id)}<br/>`
                            : ""
                        }</div>
                        <div class="ml mr">${
                          data.base_os
                            ? `<strong>${$translate.instant(
                                "audit.gridHeader.BASE_OS"
                              )}:</strong> ${$sanitize(data.base_os)}<br/>`
                            : ""
                        }</div>
                        <div class="ml mr">${
                          data.level.toLowerCase() === "error"
                            ? `<strong class="text-danger">${$translate.instant(
                                "audit.gridHeader.ERR"
                              )}:</strong> <span class="text-danger">${
                                $sanitize(data.error)
                              }</span>`
                            : ""
                        }</div>
                        <div class="ml mr">${
                          data.high_vul_cnt > 0
                            ? `<strong>${$translate.instant(
                                "audit.gridHeader.HIGH_VUL"
                              )}:</strong>
                          <span>
                            ${
                              $sanitize(data.high_vul_cnt > 5
                                ? `${data.high_vuls.slice(0, 5).join(", ")}...`
                                : data.high_vuls)
                            }
                          </span>`
                            : ""
                        }</div>
                        <div class="ml mr">${
                          data.medium_vul_cnt > 0
                            ? `<strong>${$translate.instant(
                                "audit.gridHeader.MEDIUM_VUL"
                              )}:</strong>
                          <span>
                            ${
                              $sanitize(data.medium_vul_cnt > 5
                                ? `${data.medium_vuls
                                    .slice(0, 5)
                                    .join(", ")}...`
                                : data.medium_vuls)
                            }
                          </span>`
                            : ""
                        }</div>
                        <div class="ml mr">${
                          data.items && data.items.length > 0
                            ? `<strong>${$translate.instant(
                                "audit.gridHeader.HIGH_PERMISSION_STATE"
                              )}:</strong>
                              ${
                                data.items.map(item => {
                                  return `<div>${$sanitize(item)}</div>`;
                                }).join("")
                              }`
                            : ""
                        }</div>
                      </div>`
                        : ""
                    }
                  </div>`;
        } else if (data.name.toLowerCase().indexOf("admission") >= 0) {
          let items = "";
          if (data.items) {
            data.items.forEach(function(item) {
              let indexOfColon = item.indexOf(":");
              let title = `audit.gridHeader.${item
                .substring(0, indexOfColon)
                .toUpperCase()}`;
              let value = item.substring(indexOfColon + 1);
              if (value.trim() && item.substring(0, indexOfColon).toLowerCase() !== "image") {
                items += `<div class="ml mr"><strong>${$translate.instant(
                  title
                )}:</strong>${$sanitize(value)}</div>`;
              }
            });
          }

          let repository = data.repository
            ? `<div class="ml mr"><strong>${$translate.instant(
                "audit.gridHeader.REPO"
              )}: </strong>{{data.repository}}</div>`
            : "";
          let imageId = data.image_id
            ? `<div class="ml mr"><strong>${$translate.instant(
                "audit.gridHeader.IMAGE_ID"
              )}: </strong>{{data.image_id}}</div>`
            : "";
          let baseOs = data.base_os
            ? `<div class="ml mr"><strong>${$translate.instant(
                "audit.gridHeader.BASE_OS"
              )}: </strong>{{data.base_os}}</div>`
            : "";
          let tag = data.tag
            ? `<div class="ml mr"><strong>${$translate.instant(
                "audit.gridHeader.TAG"
              )}: </strong>{{data.tag}}</div>`
            : "";
          let message = data.message
            ? `<div class="ml mr"><strong>${$translate.instant(
              "audit.gridHeader.DESCRIPTION"
            )}: </strong>{{data.message}}</div>`
            : "";
          let user = data.user
            ? `<div class="ml mr"><strong>${$translate.instant(
              "audit.gridHeader.USER"
            )}: </strong>{{data.user}}</div>`
            : "";
          let responseRuleId = data.response_rule_id
            ? `<div class="ml mr"><strong>${$translate.instant(
              "audit.gridHeader.RESPONSE_RULE_ID"
            )}: </strong>{{data.response_rule_id}}</div>`
            : "";
          let aggregatedCount = data.count && data.count > 1
            ? `<div class="ml mr"><strong>${$translate.instant(
              "audit.gridHeader.OCCURRENCES"
            )}: </strong>{{data.count}}</div>`
            : "";
          let aggregatedDuration = data.aggregation_from && data.count && data.count > 1
            ? `<div class="ml mr"><strong>${$translate.instant(
              "audit.gridHeader.DURATION"
            )}: </strong>{{data.aggregation_from * 1000 | date:'MMM dd, y HH:mm:ss'}} ~ {{data.reported_timestamp * 1000 | date:'MMM dd, y HH:mm:ss'}}</div>`
            : "";

          return `<div class="full-width-panel">
                    <div class="full-width-summary" style="width: 220px;">
                      <div class="col-sm-6">
                        <span class="label label-danger" uib-tooltip="{{'audit.gridHeader.HIGH_VUL' | translate}}">${$sanitize(high_vuls)}</span>
                      </div>
                      <div class="col-sm-6 p0">
                        <span class="total mt-lg">${$translate.instant(
                          "general.TOTAL"
                        )}: ${$sanitize(data.high_vul_cnt)}</span>
                      </div>
                      <div class="col-sm-6">
                        <span class="label label-warning" uib-tooltip="{{'audit.gridHeader.MEDIUM_VUL' | translate}}">${$sanitize(medium_vuls)}</span>
                      </div>
                      <div class="col-sm-6 p0">
                        <span class="total mt">${$translate.instant(
                          "general.TOTAL"
                        )}: ${$sanitize(data.medium_vul_cnt)}</span>
                      </div>
                    </div>
                    <div class="full-width-center" style="font-size: 12px;">
                      ${$sanitize(items)}
                      ${$sanitize(message)}
                      ${$sanitize(user)}
                      ${$sanitize(responseRuleId)}
                      ${$sanitize(repository)}
                      ${$sanitize(imageId)}
                      ${$sanitize(baseOs)}
                      ${$sanitize(tag)}
                      ${$sanitize(aggregatedCount)}
                      ${$sanitize(aggregatedDuration)}
                    </div>
                  </div>`;
        }
      };

      FullWidthCellRenderer.prototype.getGui = function() {
        return this.eGui;
      };

      FullWidthCellRenderer.prototype.consumeMouseWheelOnCenterText = function() {
        let eFullWidthCenter = this.eGui.querySelector(".full-width-center");
        let eFullWidthCenterHalf = this.eGui.querySelector(
          ".full-width-center-half"
        );

        let mouseWheelListener = function(event) {
          event.stopPropagation();
        };
        if (eFullWidthCenter) {
          // event is 'mousewheel' for IE9, Chrome, Safari, Opera
          eFullWidthCenter.addEventListener("mousewheel", mouseWheelListener);
          // event is 'DOMMouseScroll' Firefox
          eFullWidthCenter.addEventListener(
            "DOMMouseScroll",
            mouseWheelListener
          );
        }

        if (eFullWidthCenterHalf) {
          // event is 'mousewheel' for IE9, Chrome, Safari, Opera
          eFullWidthCenterHalf.addEventListener(
            "mousewheel",
            mouseWheelListener
          );
          // event is 'DOMMouseScroll' Firefox
          eFullWidthCenterHalf.addEventListener(
            "DOMMouseScroll",
            mouseWheelListener
          );
        }
      };

      const isExternalFilterPresent = function() {
        return !_isFilterCleared();
      };

      const doesExternalFilterPass = function(node) {
        if (_isFilterCleared()) return true;
        return _filterFn(node.data);
      };

      $scope.gridOptions = {
        headerHeight: 30,
        enableSorting: true,
        isFullWidthCell: function(rowNode) {
          return rowNode.flower;
        },
        fullWidthCellRenderer: FullWidthCellRenderer,
        getRowHeight: function(params) {
          let rowIsNestedRow = params.node.flower;
          return rowIsNestedRow ? 100 : 90;
        },
        animateRows: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        suppressScrollOnNewData: true,
        columnDefs: columnDefs,
        rowData: null,
        isExternalFilterPresent: isExternalFilterPresent,
        doesExternalFilterPass: doesExternalFilterPass,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
            params.api.onGroupExpandedOrCollapsed();
          }, 2000);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
        doesDataFlower: function(dataItem) {
          return (
            (dataItem.name.toLowerCase().indexOf("compliance") >= 0 &&
              dataItem.items && dataItem.items.length) > 0 ||
            dataItem.name.toLowerCase().indexOf("scan") >= 0 ||
            dataItem.name.toLowerCase().indexOf("admission") >= 0
          );
          // (dataItem.high_vuls && dataItem.high_vuls.length > 0 || dataItem.medium_vuls && dataItem.medium_vuls.length > 0);
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
      };

      $scope.getIconCode = function(name) {
        return iconMap[name];
      };

      function dateComparator(value1, value2, node1, node2) {
        return (
          Date.parse(node1.data.reported_at) -
          Date.parse(node2.data.reported_at)
        );
      }

      let timer4Filter = null;
      $scope.onFilterChanged = function(value) {
        $scope.isOnQuickFilter = !!value;
        $scope.progress = 0;
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        $scope.filteredAudits = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.map(node => node.data);
        let filteredCount = $scope.filteredAudits.length;
        $scope.count =
          filteredCount === $scope.audits.length || value === ""
            ? `${$scope.audits.length} ${getEntityName($scope.audits.length)}`
            : `${found} ${filteredCount} / ${$scope.audits.length} ${getEntityName(
                $scope.audits.length
              )}`;

        $scope.count4Pdf =
          filteredCount === $scope.audits.length || value === ""
            ? `${$scope.audits.length} ${getEntityName4Pdf($scope.audits.length)}`
            : `${found} ${filteredCount} / ${$scope.audits.length} ${getEntityName4Pdf(
                $scope.audits.length
              )}`;

        if (timer4Filter) {
          $timeout.cancel(timer4Filter);
        }

        timer4Filter = $timeout(function() {
          if ($scope.eof) {
            getPdfInWebWorker();
          }
        }, 2000);
      };

      const _getProjectAutoCompleteData = function(audits) {
        let projects = new Set(audits.map(audit => audit.project_name));
        $scope.autocompletProjects =
          Array.from(projects)
          .filter(projects => !!projects)
          .sort()
          .map(function(project) {
            return {
              value: project,
              display: project
            };
          });
      };

      const _getRegionAutoCompleteData = function(audits) {
        let regions = new Set(audits.map(audit => audit.region));
        $scope.autocompleteRegions =
          Array.from(regions)
          .filter(regions => !!regions)
          .sort()
          .map(function(region) {
            return {
              value: region,
              display: region
            };
          });
      };

      const _getNodeAutoCompleteData = function(audits) {
        let nodes = new Set(audits.map(audit => audit.host_name));
        $scope.autocompleteNodes =
          Array.from(nodes)
          .filter(node => !!node)
          .sort()
          .map(function(node) {
            return {
              value: node,
              display: node
            };
          });
      };

      const _getContainerAutoCompleteData = function(audits) {
        let containers = new Set(audits.map(audit => audit.workload_name));
        $scope.autocompleteContainers =
          Array.from(containers)
          .filter(container => !!container)
          .sort()
          .map(function(container) {
            return {
              value: container,
              display: container
            };
          });
      };

      const _getImageAutoCompleteData = function(audits) {
        let images = new Set(audits.map(audit => audit.workload_image));
        $scope.autocompleteImages =
          Array.from(images)
          .filter(image => !!image)
          .sort()
          .map(function(image) {
            return {
              value: image,
              display: image
            };
          });
      };

      const _getNamesapceAutoCompleteData = function(audits) {
        let namespaces = new Set(audits.map(audit => audit.workload_domain));
        $scope.domainList =
          Array.from(namespaces)
          .filter(namespace => !!namespace)
          .sort();
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

      $scope.getAudits = function() {
        $scope.auditErr = false;
        $http
          .get(AUDIT_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            $scope.audits = response.data.audits.filter(function(audit) {
              let validAudit = typeof audit.name !== "undefined";

              if (!validAudit) {
                console.warn(
                  "Invalid risk report data from controller was found.",
                  audit
                );
              }

              return validAudit;
            });

            _getProjectAutoCompleteData($scope.audits);
            _getRegionAutoCompleteData($scope.audits);
            _getNodeAutoCompleteData($scope.audits);
            _getContainerAutoCompleteData($scope.audits);
            _getImageAutoCompleteData($scope.audits);
            _getNamesapceAutoCompleteData($scope.audits);

            $scope.gridOptions.api.setRowData($scope.audits);
            $scope.eof = true;

            $scope.count = `${$scope.audits.length} ${getEntityName(
              $scope.audits.length
            )}`;

            $scope.onFilterChanged(filter);
          })
          .catch(function(err) {
            console.warn(err);
            $scope.auditErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.getAudits();

      const _levelFilter = function(level, levelFilter) {
        if (
          !levelFilter.isFilteringError &&
          !levelFilter.isFilteringCritical &&
          !levelFilter.isFilteringWarning &&
          !levelFilter.isFilteringInfo
        ) {
          return true;
        } else {
          let res = false;
          if (levelFilter.isFilteringError) res = res || level.toLowerCase() === "error";
          if (levelFilter.isFilteringCritical) res = res || level.toLowerCase() === "critical";
          if (levelFilter.isFilteringWarning) res = res || level.toLowerCase() === "warning";
          if (levelFilter.isFilteringInfo) res = res || level.toLowerCase() === "info";
          return res;
        }
      };

      const _categoryFilter = function(logName, categoryFilter) {
        if (
          !categoryFilter.isFilteringCompliance &&
          !categoryFilter.isFilteringScan &&
          !categoryFilter.isFilteringAdmission
        ) {
          return true;
        } else {
          let res = false;
          if (categoryFilter.isFilteringCompliance) res = res || logName.toLowerCase().includes("compliance");
          if (categoryFilter.isFilteringScan) res = res || logName.toLowerCase().includes("scan");
          if (categoryFilter.isFilteringAdmission) res = res || logName.toLowerCase().includes("admission");
          return res;
        }
      };

      const _nodeFilter = function(hostName, selectedSearchingHostName, typedSearchingHostName) {
        if (selectedSearchingHostName) {
          return hostName.toLowerCase() === selectedSearchingHostName.value.toLowerCase();
        } else if (typedSearchingHostName) {
          return hostName.toLowerCase() === typedSearchingHostName.toLowerCase();
        } else {
          return true;
        }
      };

      const _containerFilter = function(audit, selectedSearchingContainer, typedSearchingContainer) {
        if (selectedSearchingContainer) {
          if (audit.workload_name) return audit.workload_name.toLowerCase() === selectedSearchingContainer.value.toLowerCase();
          else return false;
        } else if (typedSearchingContainer) {
          if (audit.workload_name) return audit.workload_name.toLowerCase() === typedSearchingContainer.toLowerCase();
          else return false;
        }else {
          return true;
        }
      };

      const _imageFilter = function(audit, selectedSearchingImage, typedSearchingImage) {
        if (selectedSearchingImage) {
          if (audit.workload_image) return audit.workload_image.toLowerCase() === selectedSearchingImage.value.toLowerCase();
          else return false;
        } else if (typedSearchingImage) {
          if (audit.workload_image) return audit.workload_image.toLowerCase() === typedSearchingImage.toLowerCase();
          else return false;
        } else {
          return true;
        }
      };

      const _projectFilter = function(audit, selectedSearchingProject, typedSearchingProject) {
        if (selectedSearchingProject) {
          if (audit.project_name) return audit.project_name.toLowerCase() === selectedSearchingProject.value.toLowerCase();
          else return false;
        } else if (typedSearchingProject) {
          if (audit.project_name) return audit.project_name.toLowerCase() === typedSearchingProject.toLowerCase();
          else return false;
        } else {
          return true;
        }
      };

      const _regionFilter = function(audit, selectedSearchingRegion, typedSearchingRegion) {
        // console.log(audit, selectedSearchingRegion, typedSearchingRegion)
        if (selectedSearchingRegion) {
          if (audit.region) return audit.region.toLowerCase() === selectedSearchingRegion.value.toLowerCase();
          else return false;
        } else if (typedSearchingRegion) {
          if (audit.region) return audit.region.toLowerCase() === typedSearchingRegion.toLowerCase();
          else return false;
        } else {
          return true;
        }
      };

      const _functionFilter = function(audit, selectedSearchingFunction, typedSearchingFunction) {
        console.log(audit, selectedSearchingFunction, typedSearchingFunction)
        if (selectedSearchingFunction) {
          if (audit.workload_name) return audit.workload_name.toLowerCase() === selectedSearchingFunction.value.toLowerCase();
          else return false;
        } else if (typedSearchingFunction) {
          if (audit.workload_name) return audit.workload_name.toLowerCase() === typedSearchingFunction.toLowerCase();
          else return false;
        } else {
          return true;
        }
      };

      const _domainFilter = function(audit, searchingDomains) {
        if (searchingDomains.length > 0) {
          if (audit.workload_domain) {
            return searchingDomains.map(domain => domain.name).indexOf(audit.workload_domain) >= 0;
          } else {
            return false;
          };
        } else {
          return true;
        }
      };

      const _keyword = function(audit, keyword) {
        if (!keyword) return true;
        let _audit = angular.copy(audit);
        if (_audit.items) _audit.items = audit.items.join(",");
        _audit.reported_at = $filter("date")(audit.reported_at, "MMM dd, y HH:mm:ss");
        let valueString = Object.values(_audit).join(";");
        return valueString.toLowerCase().includes(keyword.toLowerCase());
      };

      const _excludedword = function(audit, keyword) {
        if (!keyword) return true;
        let _audit = angular.copy(audit);
        if (_audit.items) _audit.items = audit.items.join(",");
        _audit.reported_at = $filter("date")(audit.reported_at, "MMM dd, y HH:mm:ss");
        let valueString = Object.values(_audit).join(";");
        return !valueString.toLowerCase().includes(keyword.toLowerCase());
      };

      const _dateFilter = function(reportedTimestamp, selectedFrom, selectedTo) {
        if (selectedFrom && selectedTo) {
          return (reportedTimestamp <= Math.floor((selectedTo.getTime() + 24*60*60*1000) /1000) &&
                  reportedTimestamp >= Math.floor(selectedFrom.getTime() / 1000));
        } else if (selectedFrom) {
          return reportedTimestamp >= Math.floor(selectedFrom.getTime() / 1000);
        } else if (selectedTo) {
          return reportedTimestamp <= Math.floor((selectedTo.getTime() + 24*60*60*1000) / 1000);
        } else {
          return true;
        }
      };

      const _filterFn = function(audit) {
        // if (index < 10) {
        //   console.log(
        //     "_levelFilter", _levelFilter(audit.level, $scope.levelFilter),
        //     "_categoryFilter", _categoryFilter(audit.name, $scope.categoryFilter),
        //     "_nodeFilter", _nodeFilter(audit.host_name, $scope.selectedItemNode),
        //     "_containerFilter", _containerFilter(audit, $scope.selectedItemContainer),
        //     "_imageFilter", _imageFilter(audit, $scope.selectedItemImage),
        //     "_domainFilter", _domainFilter(audit, $scope.selectedDomains),
        //     "_keyword", _keyword(audit, $scope.otherKey)
        //   );
        // }

        return (
          _dateFilter(audit.reported_timestamp, $scope.reportedFrom, $scope.reportedTo) &&
          _levelFilter(audit.level, $scope.levelFilter) &&
          _categoryFilter(audit.name, $scope.categoryFilter) &&
          _nodeFilter(audit.host_name, $scope.selectedItemNode, $scope.searchTextNode) &&
          _containerFilter(audit, $scope.selectedItemContainer, $scope.searchTextContainer) &&
          _imageFilter(audit, $scope.selectedItemImage, $scope.searchTextImage) &&
          _projectFilter(audit, $scope.selectedItemProject, $scope.searchTextProject) &&
          _regionFilter(audit, $scope.selectedItemRegion, $scope.searchTextRegion) &&
          _functionFilter(audit, $scope.selectedItemFunction, $scope.searchTextFunction) &&
          _domainFilter(audit, $scope.selectedDomains) &&
          _keyword(audit, $scope.otherKey) &&
          _excludedword(audit, $scope.excludedKey)
        );
      };

      const _isFilterCleared =function() {
        return (
          !$scope.levelFilter.isFilteringError &&
          !$scope.levelFilter.isFilteringCritical &&
          !$scope.levelFilter.isFilteringWarning &&
          !$scope.levelFilter.isFilteringInfo &&

          !$scope.categoryFilter.isFilteringCompliance &&
          !$scope.categoryFilter.isFilteringScan &&
          !$scope.categoryFilter.isFilteringAdmission &&

          ($scope.selectedItemNode === null ||
          $scope.searchTextNode === "") &&
          ($scope.selectedItemContainer === null ||
          $scope.searchTextContainer === "") &&
          ($scope.selectedItemImage === null ||
          $scope.searchTextImage === "") &&
          ($scope.selectedItemProject === null ||
          $scope.searchTextProject === "") &&
          ($scope.selectedItemRegion === null ||
          $scope.searchTextRegion === "") &&
          ($scope.selectedItemFunction === null ||
          $scope.searchTextFunction === "") &&
          $scope.selectedDomains.length === 0 &&
          !$scope.otherKey &&
          !$scope.excludedKey &&


          $scope.reportedFrom === null &&
          $scope.reportedTo === null
        );
      };

      $scope.format = "dd-MMMM-yyyy";

      const disabled4From = function(data) {
        console.log("datepicker-data: ", data);
        let date = data.date;
        let mode = data.mode;
        return $scope.reportedTo && data.date > $scope.reportedTo;
      };

      const disabled4To = function(data) {
        console.log("datepicker-data: ", data);
        let date = data.date;
        let mode = data.mode;
        return $scope.reportedFrom && data.date < $scope.reportedFrom;
      };

      $scope.dateOptionsFrom = {
        dateDisabled: disabled4From,
        formatYear: "yy",
        maxDate: new Date(),
        minDate: new Date(2000, 1, 1),
        startingDay: 1
      };

      $scope.dateOptionsTo = {
        dateDisabled: disabled4To,
        formatYear: "yy",
        maxDate: new Date(),
        minDate: new Date(2000, 1, 1),
        startingDay: 1
      };

      $scope.openDate1 = function() {
        $scope.popup.opened1 = true;
      };
      $scope.openDate2 = function() {
        $scope.popup.opened2 = true;
      };

      $scope.checkDateRange = function() {
        if ($scope.reportedFrom && $scope.reportedTo) {
          console.log("Comparing: ", $scope.reportedFrom > $scope.reportedTo);
          $scope.isInvalidDateRange = $scope.reportedFrom > $scope.reportedTo;
        } else {
          $scope.isInvalidDateRange = false;
        }
        console.log("$scope.isInvalidDateRange: ", $scope.isInvalidDateRange, $scope.reportedFrom, $scope.reportedTo);
      };

      $scope.setPublishedType = function(publishedType) {
        $scope.advFilter.publishedType = publishedType;
      };

      $scope.onAdvFilterChanged = function() {
        $scope.progress = 0;
        $scope.search = "";
        filter = "";
        $scope.gridOptions.api.onFilterChanged();
        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        console.log("adv filtered cnt: ", filteredCount);
        $scope.count =
          filteredCount === $scope.audits.length
            ? `${$scope.audits.length} ${getEntityName($scope.audits.length)}`
            : `${found} ${filteredCount} / ${$scope.audits.length} ${getEntityName(
                $scope.audits.length
              )}`;

        $scope.count4Pdf =
          filteredCount === $scope.audits.length
            ? `${$scope.audits.length} ${getEntityName4Pdf($scope.audits.length)}`
            : `${found} ${filteredCount} / ${$scope.audits.length} ${getEntityName4Pdf(
                $scope.audits.length
              )}`;

        $scope.onAdvFilter = false;
        $scope.isAdvFilterInUse = !_isFilterCleared();
        if (timer4Filter) {
          $timeout.cancel(timer4Filter);
        }
        timer4Filter = $timeout(function() {
          getPdfInWebWorker();
        }, 2000);
      };

      $scope.resetAdvFilter = function() {
        $scope.progress = 0;
        _initializeAdvFilter();
        $scope.gridOptions.api.setRowData($scope.audits);
        $scope.count = `${$scope.audits.length} ${getEntityName(
          $scope.audits.length
        )}`;

        $scope.onAdvFilter = false;
        $scope.isAdvFilterInUse = false;
        if (timer4Filter) {
          $timeout.cancel(timer4Filter);
        }
        timer4Filter = $timeout(function() {
          getPdfInWebWorker();
        }, 2000);
      };

      $scope.exportCsv = function() {
        if ($scope.filteredAudits && $scope.filteredAudits.length > 0) {
          let audits4Csv = JSON.parse(JSON.stringify($scope.filteredAudits));
          audits4Csv = audits4Csv.map(function(audit) {
            if (audit.items) {
              let count = audit.items.length;
              audit.items = audit.items.slice(0, MAX_ITEMS);
              audit.items = audit.items.map(function(item) {
                return `${item.replace(/\"/g, "'").replace(/\n/g, "")}`;
              });
              if (count > 9) {
                audit.items.push(`......Total: ${count} items`);
              }
              audit.items = `${audit.items.join("\n")}`;
            } else {
              audit.items = "";
            }
            delete audit.high_vuls;
            delete audit.medium_vuls;
            return audit;
          });
          console.log(audits4Csv);
          let csv = Utils.arrayToCsv(angular.copy(audits4Csv));
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(blob, `Risk Reports_${Utils.parseDatetimeStr(new Date())}.csv`);
        }
      };

      function getCveUrl(baseOS, cveName) {
        let os = baseOS ? baseOS.toLowerCase() : "";
        if (os.indexOf("ubuntu") >= 0) {
          return `${UBUNTO}${cveName}`;
        } else if (os.indexOf("debian") >= 0) {
          return `${DEBIAN}${cveName}`;
        } else if (os.indexOf("centos") >= 0 || os.indexOf("rhel") >= 0) {
          return `${CENTOS_REDHAT}${cveName}`;
        } else {
          return `${OTHER}${cveName}`;
        }
      }

      $scope.exportCveCsv = function(report) {
        let outputArray = [];
        let reportCopy = JSON.parse(JSON.stringify(report));
        if (reportCopy.high_vuls) {
          reportCopy.high_vuls.forEach(function(high_vul) {
            if (reportCopy.medium_vuls && reportCopy.medium_vuls.length > 0) {
              outputArray.push({
                high_vulnerability: `=HYPERLINK(""${getCveUrl(
                  reportCopy.base_os,
                  high_vul
                )}"", ""${high_vul}"")`,
                medium_vulnerability: `=HYPERLINK(""${getCveUrl(
                  reportCopy.base_os,
                  reportCopy.medium_vuls[0]
                )}"", ""${reportCopy.medium_vuls[0]}"")`
              });
              reportCopy.medium_vuls.splice(0, 1);
            } else {
              outputArray.push({
                high_vulnerability: `=HYPERLINK(""${getCveUrl(
                  reportCopy.base_os,
                  high_vul
                )}"", ""${high_vul}"")`,
                medium_vulnerability: ""
              });
            }
          });
        }

        if (reportCopy.medium_vuls && reportCopy.medium_vuls.length > 0) {
          reportCopy.medium_vuls.map(function(medium_vul, index) {
            outputArray.push({
              high_vulnerability: "",
              medium_vulnerability: `=HYPERLINK(""${getCveUrl(
                reportCopy.base_os,
                reportCopy.medium_vuls[index]
              )}"", ""${reportCopy.medium_vuls[index]}"")`
            });
          });
        }
        let csv = Utils.arrayToCsv(angular.copy(outputArray));
        let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        FileSaver.saveAs(
          blob,
          `${report.name}${
            report.base_os ? `-${report.base_os}` : ""
          }-${report.reported_at.replace(/\:|-|T|Z/g, "")}.csv`
        );
      };
      $scope.exportBenchCsv = function(report) {
        if ($scope.audits && $scope.audits.length > 0) {
          let outputArray = [];
          let reportCopy = JSON.parse(JSON.stringify(report.items));
          reportCopy.forEach(function(bench) {
            outputArray.push({ compliance: bench.replace(/\"/g, "'") });
          });
          console.log(outputArray);
          let csv = Utils.arrayToCsv(angular.copy(outputArray));
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(
            blob,
            `${report.name}${
              report.base_os ? `-${report.base_os}` : ""
            }-${report.reported_at.replace(/\:|-|T|Z/g, "")}.csv`
          );
        }
      };
    }

    function getChartsForPDF() {
      let bySeverity = document.getElementById("bySeverity").toDataURL();
      let byScanType = document.getElementById("byScanType").toDataURL();

      return {
        canvas: {
          bySeverity: bySeverity,
          byScanType: byScanType
        }
      };
    }

    function renderChartsForPDF(data) {
      let levelsGroupedBy = Utils.groupBy(data, "level");

      let levelMap = new Map();

      for (let level in levelsGroupedBy) {
        if (levelsGroupedBy.hasOwnProperty(level)) {
          levelMap.set(level, levelsGroupedBy[level].length);
        }
      }

      const dictionary = {
        info: 1,
        warning: 2,
        error: 3,
        critical: 4
      };

      let sortedLevelMap = new Map(
        [...levelMap.entries()].sort(
          (a, b) =>
            dictionary[a[0].toLowerCase()] - dictionary[b[0].toLowerCase()]
        )
      );

      let labels = [];
      let sizes = [];
      let colors = [];

      for (let [k, v] of sortedLevelMap) {
        switch (k.toLowerCase()) {
          case "critical":
            labels.push($translate.instant("enum.CRITICAL"));
            sizes.push(v);
            colors.push("#dc4034");
            break;
          case "warning":
            labels.push($translate.instant("enum.WARNING"));
            sizes.push(v);
            colors.push("#ff9800");
            break;
          case "info":
            labels.push($translate.instant("enum.INFO"));
            sizes.push(v);
            colors.push("#2196f3");
            break;
          case "error":
            labels.push($translate.instant("enum.ERROR"));
            sizes.push(v);
            colors.push("#e91e63");
            break;
          default:
        }
      }

      $scope.pieLabels = labels;
      $scope.pieData = sizes;
      $scope.pieColors = colors;
      $scope.pieOptions = {
        title: {
          display: true,
          text: $translate.instant("audit.report.chartTitleByLevel"),
          position: "top",
          fontSize: 38
        },
        rotation: 0.8 * Math.PI,
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 25,
            fontSize: 32
          }
        },
        maintainAspectRatio: false
      };

      let levelArray = [];

      sortedLevelMap.forEach((v, k) => {
        levelArray.push([k, v]);
      });

      $scope.distByLevel = levelArray;

      let scanSummary = Utils.groupBy(data, "name");

      let scanMap = new Map();
      for (let item in scanSummary) {
        if (scanSummary.hasOwnProperty(item)) {
          scanMap.set(item, scanSummary[item].length);
        }
      }

      let sortedMap = new Map(
        [...scanMap.entries()].sort((a, b) => b[1] - a[1])
      );

      let scanLabels = [];
      let scanSizes = [];
      let scanColors = [];
      let sortedNameArray = [];

      sortedMap.forEach((v, k) => {
        scanLabels.push(k);
        scanSizes.push(v);
        scanColors.push("#ff9800");
        sortedNameArray.push([k, v]);
      });

      $scope.distByName = sortedNameArray;
      $scope.scanTypeChartData = scanSizes;
      $scope.scanTypeChartLabel = scanLabels;
      $scope.scanTypeChartColors = scanColors;

      $scope.scanTypeChartOptions = {
        title: {
          display: false,
          text: $translate.instant("audit.report.chartTitleByScanType"),
          position: "top",
          fontSize: 30
        },
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
        legend: {
          display: false
        },
        maintainAspectRatio: false
      };
    }

    function getPdfInWebWorker() {
      let filteredAudits = [];
      $scope.gridOptions.api.forEachNodeAfterFilterAndSort(node => {
        filteredAudits.push(node.data);
        // filteredAudits.push(Object.assign({},node.data,{reported_at:$filter("date")(node.data.reported_at, "MMM dd, y HH:mm:ss")}));
      });

      filteredAudits.forEach(o =>
        Object.assign(o, {
          reported_at: $filter("date")(o.reported_at, "MMM dd, y HH:mm:ss")
        })
      );

      $scope.filteredAudits = filteredAudits;

      renderChartsForPDF($scope.filteredAudits);

      $scope.isPdfPreparing = false;

      let timer = null;

      // $interval.cancel(timer);
      $scope.pdfBlob = null;
      //start - generate a pdf
      if ($scope.worker) {
        $scope.worker.terminate();
        console.info("killed an existing running worker...");
      }

      //web worker code start
      const _webWorkerJob = function() {
        console.log("Worker is starting...");
        self.onmessage = event => {
          let docData = JSON.parse(event.data);
          const showProgress = (function(self) {
            return function(progress) {
              if (Math.floor(progress * 100000) % 1000 === 0) {
                self.postMessage({progress: progress});
              }
            };
          })(self);
          let drawReportInWebWorker = function(docData) {
            let docDefinition = _formatContent(docData);

            let baseURL = event.srcElement.origin;
            self.importScripts(
              baseURL + "/vendor/pdfmake/build/pdfmake.js",
              baseURL + "/vendor/pdfmake/build/vfs_fonts.js"
            );

            let report = pdfMake.createPdf(docDefinition);

            report.getBlob(function(blob) {
              console.log("Worker is end...");
              self.postMessage({blob: blob, progress: 1});
              self.close();
            }, {progressCallback: showProgress});
          };

          const _formatContent = function(docData) {
            let metadata = docData.metadata;
            let images = docData.images;
            let charts = docData.charts;
            let distByName = docData.distByName;
            let distByLevel = docData.distByLevel;

            let docDefinition = {
              info: {
                title: metadata.title,
                author: "NeuVector",
                subject: "Audit Scan Summary",
                keywords:
                  "audit kubernetes compliance container violation risk report"
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
                fontSize: 7
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
                      text: " In this Scan Summary Report",
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
                  text: metadata.others.bySeverity,
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
                      image: charts.canvas.bySeverity,
                      width: 250
                    }
                  ]
                },

                {
                  text: metadata.others.byScannedType,
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
                      image: charts.canvas.byScanType,
                      width: 350
                    }
                  ],

                  pageBreak: "after"
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
                        margin: [80, 15, 0, 60]
                      }
                    },
                    {
                      text: `    ${metadata.others.detailsLimit}`,
                      color: "#fe6e6b",
                      fontSize: 10
                    }
                  ]
                },

                {
                  style: "tableExample",
                  table: {
                    headerRows: 1,
                    dontBreakRows: true,
                    widths: ["5%", "17%", "9%", "25%", "30%", "15%"],
                    body: [
                      [
                        { text: metadata.header.id, style: "tableHeader" },
                        { text: metadata.header.name, style: "tableHeader" },
                        { text: metadata.header.level, style: "tableHeader" },
                        {
                          text: metadata.header.location,
                          style: "tableHeader"
                        },
                        { text: metadata.header.detail, style: "tableHeader" },
                        { text: metadata.header.time, style: "tableHeader" }
                      ]
                    ]
                  }
                }
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
                danger: {
                  bold: true,
                  color: "#dc4034",
                  fontSize: 8
                },
                warning: {
                  bold: true,
                  color: "#ff9800",
                  fontSize: 8
                },
                info: {
                  bold: true,
                  color: "#2196f3",
                  fontSize: 8
                },
                error: {
                  bold: true,
                  color: "#e91e63",
                  fontSize: 8
                }
              }
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

            if (distByLevel.length) {
              for (let item of distByLevel) {
                docDefinition.content[7].columns[0].table.body.push(item);
              }
            } else {
              docDefinition.content[7].columns[0].table.body.push([]);
            }

            docDefinition.content[9].columns[0].layout = distLayout;
            docDefinition.content[9].columns[0].fontSize = 10;
            docDefinition.content[9].columns[0].table.widths = [250, 30];

            if (distByName.length) {
              for (let item of distByName) {
                docDefinition.content[9].columns[0].table.body.push(item);
              }
            } else {
              docDefinition.content[9].columns[0].table.body.push([]);
            }

            let index = 1;

            for (let item of docData.data) {
              docDefinition.content[11].table.body.push(
                _getRowData(item, index, metadata)
              );
              index++;
            }

            return docDefinition;
          };

          const _getLevelInfo = function(item) {
            let level = {};
            level.text = item.level;

            if (item.level === "Critical") {
              level.style = "danger";
            }
            if (item.level === "Warning") {
              level.style = "warning";
            }
            if (item.level === "Info") {
              level.style = "info";
            }
            if (item.level === "Error") {
              level.style = "error";
            }

            return level;
          };

          const _getLocationInfo = function(item, metadata) {
            let location = {};
            location.type = "none";
            location.ul = [];

            if (item.project_name) {
              let formattedText = {};
              let title = {};
              title.text = metadata.others.project;
              title.style = "title";
              formattedText.text = [title, ` : ${item.project_name}`];
              location.ul.push(formattedText);
            }
            if (item.workload_name) {
              let formattedText = {};
              let title = {};
              title.text = metadata.others.container;
              title.style = "title";
              formattedText.text = [title, ` : ${item.workload_name}`];
              location.ul.push(formattedText);
            }
            if (item.host_name) {
              let formattedText = {};
              let title = {};
              title.text = metadata.others.node;
              title.style = "title";
              formattedText.text = [title, ` : ${item.host_name}`];
              location.ul.push(formattedText);
            }
            if (item.registry) {
              let formattedText = {};
              let title = {};
              title.text = metadata.others.registry;
              title.style = "title";
              formattedText.text = [title, ` : ${item.registry}`];
              location.ul.push(formattedText);
            }
            if (item.repository && item.tag) {
              let formattedText = {};
              let title = {};
              title.text = metadata.others.image;
              title.style = "title";
              formattedText.text = [title, ` : ${item.repository}:${item.tag}`];
              location.ul.push(formattedText);
            }
            if (item.platform) {
              let formattedText = {};
              let title = {};
              title.text = metadata.others.platform;
              title.style = "title";
              formattedText.text = [title, ` : ${item.platform_version ? `${item.platform}: ${item.platform_version}`: item.platform } `];
              location.ul.push(formattedText);
            }

            return location;
          };

          const _getRiskDetails = function(item, metadata) {
            let details = [];

            if (item.high_vul_cnt > 0 || item.medium_vul_cnt > 0) {
              //scan report
              let os = {};
              if (item.base_os) {
                os = {
                  text: [
                    { text: metadata.others.baseOS, style: "title" },
                    ` : ${item.base_os}`
                  ]
                };
              }
              let cvedb = {};
              if (item.cvedb_version) {
                cvedb = {
                  text: [
                    { text: metadata.others.cveDBVersion, style: "title" },
                    ` : ${item.cvedb_version}`
                  ]
                };
              }

              let vulnerable;

              let highV = {};
              if (item.high_vul_cnt > 0) {
                highV.ul = [];
                let index = 0;
                if (item.high_vuls && Array.isArray(item.high_vuls)) {
                  for (let h of item.high_vuls) {
                    if (index < 3) {
                      highV.ul.push(h);
                      index++;
                    } else {
                      highV.ul.push("......");
                      highV.ul.push(
                        `( ${metadata.others.total} : ${item.high_vul_cnt} ${
                          metadata.others.items
                        })`
                      );
                      break;
                    }
                  }
                }
              } else {
                highV = { text: `${metadata.others.highVUL} : 0 ` };
              }

              let medV = {};
              if (item.medium_vul_cnt > 0) {
                medV.ul = [];
                let index = 0;
                if (item.medium_vuls && Array.isArray(item.medium_vuls)) {
                  for (let m of item.medium_vuls) {
                    if (index < 3) {
                      medV.ul.push(m);
                      index++;
                    } else {
                      medV.ul.push("......");
                      medV.ul.push(
                        `( ${metadata.others.total} : ${item.medium_vul_cnt} ${
                          metadata.others.items
                        })`
                      );
                      break;
                    }
                  }
                }
              } else {
                medV = { text: `${metadata.others.mediumVUL} : 0 ` };
              }

              if (item.medium_vul_cnt > 0 && item.high_vul_cnt > 0) {
                vulnerable = {
                  table: {
                    body: [
                      [
                        { text: metadata.others.highVUL },
                        { text: metadata.others.mediumVUL }
                      ],
                      [highV, medV]
                    ]
                  },
                  layout: {
                    hLineColor: "gray",
                    vLineColor: "gray"
                  }
                };
              } else if (item.medium_vul_cnt === 0 && item.high_vul_cnt > 0) {
                vulnerable = [{ text: metadata.others.highVUL }, highV, medV];
              } else if (item.medium_vul_cnt > 0 && item.high_vul_cnt === 0) {
                vulnerable = [highV, { text: metadata.others.mediumVUL }, medV];
              } else {
                vulnerable = [highV, medV];
              }

              details = [os, cvedb, vulnerable];
            }

            if (item.items) {
              //bench violation
              if (item.items.length > 0) {
                let ul = {};
                ul.ul = [];
                let index = 0;
                for (let v of item.items) {
                  if (index < 9) {
                    ul.ul.push(v);
                  } else {
                    ul.ul.push(
                      `...... ( ${metadata.others.total} : ${
                        item.items.length
                      } ${metadata.others.items})`
                    );
                    break;
                  }
                  index++;
                }
                details.push(ul);
              } else {
                details.push(
                  {text: `${metadata.others.total} : 0 ${metadata.others.items}`}
                );
              }
            }

            return details;
          };

          const _getRowData = function(item, id, metadata) {
            let name = item.name;
            let level = _getLevelInfo(item);
            let location = _getLocationInfo(item, metadata);
            let riskDetail = _getRiskDetails(item, metadata);
            let dateTime = item.reported_at;

            return [id, name, level, location, riskDetail, dateTime];
          };

          drawReportInWebWorker(docData);
        };
      };

      function run(fn) {
        try {
          return new Worker(URL.createObjectURL(new Blob(["(" + fn + ")()"])));
        } catch(err) {
          console.log(err);
        }
      }

      $scope.worker = run(_webWorkerJob);

      const _getI18NMessages = function(options) {
        return {
          title: $translate.instant("audit.report.reportTitle", {}, "", "en"),
          header: {
            id: $translate.instant("general.ID", {}, "", "en"),
            name: $translate.instant("general.NAME", {}, "", "en"),
            level: $translate.instant("audit.gridHeader.LEVEL", {}, "", "en"),
            location: $translate.instant("general.LOCATION", {}, "", "en"),
            detail: $translate.instant("audit.gridHeader.DETAIL", {}, "", "en"),
            time: $translate.instant("general.DATETIME", {}, "", "en")
          },
          others: {
            items: $translate.instant("audit.gridHeader.ITEMS", {}, "", "en"),
            baseOS: $translate.instant("audit.gridHeader.BASE_OS", {}, "", "en"),
            repo: $translate.instant("audit.gridHeader.REPO", {}, "", "en"),
            domain: $translate.instant("audit.gridHeader.DOMAIN", {}, "", "en"),
            container: $translate.instant("audit.gridHeader.CONTAINER", {}, "", "en"),
            node: $translate.instant("audit.gridHeader.NODE", {}, "", "en"),

            project: $translate.instant("audit.gridHeader.PROJECT", {}, "", "en"),
            region: $translate.instant("audit.gridHeader.REGION", {}, "", "en"),
            function: $translate.instant("audit.gridHeader.FUNCTION", {}, "", "en"),

            registry: $translate.instant("audit.gridHeader.REGISTRY", {}, "", "en"),
            imageID: $translate.instant("audit.gridHeader.IMAGE_ID", {}, "", "en"),
            image: $translate.instant("audit.gridHeader.IMAGE", {}, "", "en"),
            platform: $translate.instant("audit.gridHeader.PLATFORM", {}, "", "en"),
            cveDBVersion: $translate.instant("audit.gridHeader.CVE_DB_VERSION", {}, "", "en"),
            highVUL: $translate.instant("audit.gridHeader.HIGH_VUL", {}, "", "en"),
            mediumVUL: $translate.instant("audit.gridHeader.MEDIUM_VUL", {}, "", "en"),
            highVulCNT: $translate.instant("audit.gridHeader.HIGH_VUL_CNT", {}, "", "en"),
            mediumVulCNT: $translate.instant("audit.gridHeader.MEDIUM_VUL_CNT", {}, "", "en"),
            total: $translate.instant("general.TOTAL", {}, "", "en"),
            reportSummary: $translate.instant("audit.report.summaryHeader", {}, "", "en"),
            logoName: $translate.instant("partner.general.LOGO_NAME", {}, "", "en"),
            bySeverity: $translate.instant("audit.report.subHeaderBySevLevel", {}, "", "en"),
            byScannedType: $translate.instant(
              "audit.report.subHeaderByScanType", {}, "", "en"
            ),
            bySeverityExp: $translate.instant("audit.report.bySeverityExplain", {}, "", "en"),
            byScannedExp: $translate.instant(
              "audit.report.byScannedTypeExplain", {}, "", "en"
            ),
            footerText: $translate.instant("containers.report.footer", {}, "", "en"),
            headerText: $translate.instant("partner.containers.report.header", {}, "", "en"),
            subTitleDetails: $translate.instant("audit.report.details", {}, "", "en"),
            summaryRange:
              options.filteredCount === options.rangedCount
                ? $translate.instant("general.PDF_SUMMARY_RANGE", {
                    from: options.from,
                    to: options.to,
                    rangedCount: options.rangedCount
                  }, "", "en")
                : $translate.instant("general.PDF_SUMMARY_RANGE_FILTERED", {
                    from: options.from,
                    to: options.to,
                    rangedCount: options.rangedCount,
                    filteredCount: options.filteredCount
                  }, "", "en"),
            detailsLimit:
              options.filteredCount > $scope.REPORT_TABLE_ROW_LIMIT
                ? $translate.instant("general.PDF_TBL_ROW_LIMIT", {max: $scope.REPORT_TABLE_ROW_LIMIT}, "", "en")
                : ""
          }
        };
      };
      if ($scope.worker) {
        if ($scope.filteredAudits.length > 0) {
          setTimeout(function() {
            $scope.worker.postMessage(
              JSON.stringify(
                Object.assign(
                  {},
                  {
                    data:
                      $scope.filteredAudits.length >=
                      $scope.REPORT_TABLE_ROW_LIMIT
                        ? $scope.filteredAudits.slice(
                        0,
                        $scope.REPORT_TABLE_ROW_LIMIT
                        )
                        : $scope.filteredAudits
                  },
                  {
                    metadata: _getI18NMessages({
                      from:
                      $scope.filteredAudits[$scope.filteredAudits.length - 1]
                        .reported_at,
                      to: $scope.filteredAudits[0].reported_at,
                      filteredCount: $scope.filteredAudits.length,
                      rangedCount: $scope.count4Pdf
                    })
                  },
                  { images: imageMap },
                  { charts: getChartsForPDF() },
                  { distByLevel: $scope.distByLevel },
                  { distByName: $scope.distByName },
                  { rowLimit: $scope.REPORT_TABLE_ROW_LIMIT }
                )
              )
            );
          }, 2000);
        } else {
          console.warn("no data in audit.");
        }
        $scope.worker.onmessage = event => {
          $scope.pdfBlob = event.data.blob;
          $scope.progress = Math.floor(event.data.progress * 100);
          $scope.$apply();
        };
      } else {
        $scope.progress = 100;
      }

      $scope.downloadPdf = function() {
        $scope.isPdfPreparing = true;
        if ($scope.worker) {
          $interval.cancel(timer);
          timer = $interval(function() {
            if ($scope.pdfBlob) {
              $scope.isPdfPreparing = false;
              FileSaver.saveAs(
                $scope.pdfBlob,
                `${$translate.instant("audit.report.reportTitle")}_${Utils.parseDatetimeStr(new Date())}.pdf`
              );
              $interval.cancel(timer);
            }
          }, 1000);
        } else {
          let docData = Object.assign(
            {},
            {
              data:
                $scope.filteredAudits.length >=
                $scope.REPORT_TABLE_ROW_LIMIT
                  ? $scope.filteredAudits.slice(
                  0,
                  $scope.REPORT_TABLE_ROW_LIMIT
                  )
                  : $scope.filteredAudits
            },
            {
              metadata: _getI18NMessages({
                from:
                $scope.filteredAudits[$scope.filteredAudits.length - 1]
                  .reported_at,
                to: $scope.filteredAudits[0].reported_at,
                filteredCount: $scope.filteredAudits.length,
                rangedCount: $scope.count4Pdf
              })
            },
            { images: imageMap },
            { charts: getChartsForPDF() },
            { distByLevel: $scope.distByLevel },
            { distByName: $scope.distByName },
            { rowLimit: $scope.REPORT_TABLE_ROW_LIMIT }
          );

          drawReport(docData);
        }
      };

      const drawReport = function(docData) {
        let docDefinition = _formatContent(docData);

        let report = pdfMake.createPdf(docDefinition);

        report.getBlob(function(blob) {
          $scope.isPdfPreparing = false;
          FileSaver.saveAs(
            blob,
            `${$translate.instant("audit.report.reportTitle")}_${Utils.parseDatetimeStr(new Date())}.pdf`
          );
        });
      };
      const _formatContent = function(docData) {
        let metadata = docData.metadata;
        let images = docData.images;
        let charts = docData.charts;
        let distByName = docData.distByName;
        let distByLevel = docData.distByLevel;

        let docDefinition = {
          info: {
            title: metadata.title,
            author: "NeuVector",
            subject: "Audit Scan Summary",
            keywords:
              "audit kubernetes compliance container violation risk report"
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
            fontSize: 7
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
                  text: " In this Scan Summary Report",
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
              text: metadata.others.bySeverity,
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
                  image: charts.canvas.bySeverity,
                  width: 250
                }
              ]
            },

            {
              text: metadata.others.byScannedType,
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
                  image: charts.canvas.byScanType,
                  width: 350
                }
              ],

              pageBreak: "after"
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
                    margin: [80, 15, 0, 60]
                  }
                },
                {
                  text: `    ${metadata.others.detailsLimit}`,
                  color: "#fe6e6b",
                  fontSize: 10
                }
              ]
            },

            {
              style: "tableExample",
              table: {
                headerRows: 1,
                dontBreakRows: true,
                widths: ["5%", "17%", "9%", "25%", "30%", "15%"],
                body: [
                  [
                    { text: metadata.header.id, style: "tableHeader" },
                    { text: metadata.header.name, style: "tableHeader" },
                    { text: metadata.header.level, style: "tableHeader" },
                    {
                      text: metadata.header.location,
                      style: "tableHeader"
                    },
                    { text: metadata.header.detail, style: "tableHeader" },
                    { text: metadata.header.time, style: "tableHeader" }
                  ]
                ]
              }
            }
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
            danger: {
              bold: true,
              color: "#dc4034",
              fontSize: 8
            },
            warning: {
              bold: true,
              color: "#ff9800",
              fontSize: 8
            },
            info: {
              bold: true,
              color: "#2196f3",
              fontSize: 8
            },
            error: {
              bold: true,
              color: "#e91e63",
              fontSize: 8
            }
          }
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

        if (distByLevel.length) {
          for (let item of distByLevel) {
            docDefinition.content[7].columns[0].table.body.push(item);
          }
        } else {
          docDefinition.content[7].columns[0].table.body.push([]);
        }

        docDefinition.content[9].columns[0].layout = distLayout;
        docDefinition.content[9].columns[0].fontSize = 10;
        docDefinition.content[9].columns[0].table.widths = [250, 30];

        if (distByName.length) {
          for (let item of distByName) {
            docDefinition.content[9].columns[0].table.body.push(item);
          }
        } else {
          docDefinition.content[9].columns[0].table.body.push([]);
        }

        let index = 1;

        for (let item of docData.data) {
          docDefinition.content[11].table.body.push(
            _getRowData(item, index, metadata)
          );
          index++;
        }

        return docDefinition;
      };

      const _getLevelInfo = function(item) {
        let level = {};
        level.text = item.level;

        if (item.level === "Critical") {
          level.style = "danger";
        }
        if (item.level === "Warning") {
          level.style = "warning";
        }
        if (item.level === "Info") {
          level.style = "info";
        }
        if (item.level === "Error") {
          level.style = "error";
        }

        return level;
      };

      const _getLocationInfo = function(item, metadata) {
        let location = {};
        location.type = "none";
        location.ul = [];

        if (item.workload_name) {
          let formattedText = {};
          let title = {};
          title.text = metadata.others.container;
          title.style = "title";
          formattedText.text = [title, ` : ${item.workload_name}`];
          location.ul.push(formattedText);
        }
        if (item.host_name) {
          let formattedText = {};
          let title = {};
          title.text = metadata.others.node;
          title.style = "title";
          formattedText.text = [title, ` : ${item.host_name}`];
          location.ul.push(formattedText);
        }
        if (item.registry) {
          let formattedText = {};
          let title = {};
          title.text = metadata.others.registry;
          title.style = "title";
          formattedText.text = [title, ` : ${item.registry}`];
          location.ul.push(formattedText);
        }
        if (item.repository && item.tag) {
          let formattedText = {};
          let title = {};
          title.text = metadata.others.image;
          title.style = "title";
          formattedText.text = [title, ` : ${item.repository}:${item.tag}`];
          location.ul.push(formattedText);
        }
        if (item.platform) {
          let formattedText = {};
          let title = {};
          title.text = metadata.others.platform;
          title.style = "title";
          formattedText.text = [title, ` : ${item.platform_version ? `${item.platform}: ${item.platform_version}`: item.platform } `];
          location.ul.push(formattedText);
        }

        return location;
      };

      const _getRiskDetails = function(item, metadata) {
        let details;
        if (item.items) {
          //bench violation
          if (item.items.length > 0) {
            let ul = {};
            ul.ul = [];
            let index = 0;
            for (let v of item.items) {
              if (index < 9) {
                ul.ul.push(v);
              } else {
                ul.ul.push(
                  `...... ( ${metadata.others.total} : ${
                    item.items.length
                    } ${metadata.others.items})`
                );
                break;
              }
              index++;
            }
            details = ul;
          } else {
            details = {
              text: `${metadata.others.total} : 0 ${metadata.others.items}`
            };
          }
        } else {
          //scan report
          let os = {};
          if (item.base_os) {
            os = {
              text: [
                { text: metadata.others.baseOS, style: "title" },
                ` : ${item.base_os}`
              ]
            };
          }
          let cvedb = {};
          if (item.cvedb_version) {
            cvedb = {
              text: [
                { text: metadata.others.cveDBVersion, style: "title" },
                ` : ${item.cvedb_version}`
              ]
            };
          }

          let vulnerable;

          let highV = {};
          if (item.high_vul_cnt > 0) {
            highV.ul = [];
            let index = 0;
            if (item.high_vuls && Array.isArray(item.high_vuls)) {
              for (let h of item.high_vuls) {
                if (index < 3) {
                  highV.ul.push(h);
                  index++;
                } else {
                  highV.ul.push("......");
                  highV.ul.push(
                    `( ${metadata.others.total} : ${item.high_vul_cnt} ${
                      metadata.others.items
                      })`
                  );
                  break;
                }
              }
            }
          } else {
            highV = { text: `${metadata.others.highVUL} : 0 ` };
          }

          let medV = {};
          if (item.medium_vul_cnt > 0) {
            medV.ul = [];
            let index = 0;
            if (item.medium_vuls && Array.isArray(item.medium_vuls)) {
              for (let m of item.medium_vuls) {
                if (index < 3) {
                  medV.ul.push(m);
                  index++;
                } else {
                  medV.ul.push("......");
                  medV.ul.push(
                    `( ${metadata.others.total} : ${item.medium_vul_cnt} ${
                      metadata.others.items
                      })`
                  );
                  break;
                }
              }
            }
          } else {
            medV = { text: `${metadata.others.mediumVUL} : 0 ` };
          }

          if (item.medium_vul_cnt > 0 && item.high_vul_cnt > 0) {
            vulnerable = {
              table: {
                body: [
                  [
                    { text: metadata.others.highVUL },
                    { text: metadata.others.mediumVUL }
                  ],
                  [highV, medV]
                ]
              },
              layout: {
                hLineColor: "gray",
                vLineColor: "gray"
              }
            };
          } else if (item.medium_vul_cnt === 0 && item.high_vul_cnt > 0) {
            vulnerable = [{ text: metadata.others.highVUL }, highV, medV];
          } else if (item.medium_vul_cnt > 0 && item.high_vul_cnt === 0) {
            vulnerable = [highV, { text: metadata.others.mediumVUL }, medV];
          } else {
            vulnerable = [highV, medV];
          }

          details = [os, cvedb, vulnerable];
        }

        return details;
      };

      const _getRowData = function(item, id, metadata) {
        let name = item.name;
        let level = _getLevelInfo(item);
        let location = _getLocationInfo(item, metadata);
        let riskDetail = _getRiskDetails(item, metadata);
        let dateTime = item.reported_at;

        return [id, name, level, location, riskDetail, dateTime];
      };

      $scope.$on("$destroy", function() {
        $interval.cancel(timer);
        $scope.pdfBlob = null;
        if ($scope.worker) {
          $scope.worker.terminate();
        }
      });

      //end - generate a pdf
    }
  }
})();
