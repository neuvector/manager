(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("RegistryScanFactory", function(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      $q,
      $sanitize,
      Utils
    ) {
      const resizeEvent = "resize.ag-grid";
      let $win = $($window);

      let RegistryScanFactory = {};

      let registryTypes = [];

      RegistryScanFactory.jfrogModes = ["Repository Path", "Subdomain", "Port"];

      const state = {
        loaded: false,
        promiseInFlight: false,
        loadingPromise: null
      };

      RegistryScanFactory.setGrid = function(isWriteRegistryAuthorized) {
        let _complianceGridOptions = null;
        let _moduleGridOptions = null;
        let _moduleCveGridOptions = null;
        let _registryTestInfoGridOptions = null;
        function dateComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.scanned_at */
          /** @namespace node1.data.scanned_timestamp */
          if (!node1.data.scanned_at && !node2.data.scanned_at) return 0;
          else if (!node1.data.scanned_at) return 100;
          else if (!node2.data.scanned_at) return -100;
          else
            return node1.data.scanned_timestamp - node2.data.scanned_timestamp;
        }

        /** @namespace params.data.error_message */
        const registryColumns = [
          {
            headerName: $translate.instant("general.NAME"),
            field: "name",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("registry.gridHeader.REGISTRY"),
            field: "registry",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("registry.gridHeader.FILTER"),
            field: "filters",
            cellRenderer: function(params) {
              if (params.value) {
                let filters = params.value.map(filter => {
                  if (typeof filter === "string") return filter;
                  else return filter.name;
                });
                return $sanitize(filters.join(", "));
              } else return null;
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("registry.gridHeader.USERNAME"),
            field: "username",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("scan.gridHeader.STATUS"),
            field: "status",
            cellRenderer: function(params) {
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else {
                if (params.data.errMsg) {
                  let html = $sanitize(`<div>${params.data.errMsg}</div>`);
                  return `<span class="label label-fs label-${labelCode}" uib-tooltip-html="'${html}'" tooltip-class="customClass">${Utils.getI18Name(
                    $sanitize(params.value)
                  )}</span>`;
                } else {
                  return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
                    $sanitize(params.value)
                  )}</span>`;
                }
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            },
            width: 100,
            minWidth: 100
          },
          {
            headerName: $translate.instant("registry.gridHeader.QUEUED"),
            field: "scheduled",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("registry.gridHeader.FINISHED"),
            field: "scanned",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("registry.gridHeader.FAILED"),
            field: "failed",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: "",
            cellRenderer: (params) => {
              if (params && params.data) {
                return (
                  `     <div>
                          <em class="fa fa-edit fa-lg mr-sm text-action" ng-if="${isWriteRegistryAuthorized}"
                            ng-click="editRepo($event, data, true)" uib-tooltip="{{\'registry.TIP.EDIT\' | translate}}">
                          </em>
                          <em class="fa fa-newspaper-o fa-lg mr-sm text-action" ng-if="${!isWriteRegistryAuthorized}"
                            ng-click="editRepo($event, data, false)" uib-tooltip="{{\'registry.TIP.VIEW\' | translate}}">
                          </em>
                          <em class="fa fa-trash fa-lg mr-sm text-action" ng-if="${isWriteRegistryAuthorized}"
                            ng-click="deleteRepo(data.name)" uib-tooltip="{{\'registry.TIP.DELETE\' | translate}}">
                          </em>
                        </div>`
                );
              }
            },
            maxWidth: 60,
            minWidth: 60,
            width: 60
          }
        ];

        const overlay = $translate.instant("general.NO_ROWS");

        RegistryScanFactory.registryGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          suppressScrollOnNewData: true,
          columnDefs: registryColumns,
          rowData: null,
          rowSelection: "single",
          rowStyle: { cursor: "pointer" },
          onGridReady: function(params) {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 3000);
            $win.on(resizeEvent, function() {
              $timeout(function() {
                params.api.sizeColumnsToFit();
              }, 1000);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${overlay}</span>`
        };

        const registryImageSummaryColumns = [
          {
            headerName: $translate.instant("registry.gridHeader.REPOSITORY"),
            cellRenderer: (params) => {
              if (params && params.data) {
                return `${params.data.repository}:${params.data.tag}`;
              }
            },
            valueGetter: "data.repository + ':' + data.tag",
            sort: "asc",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            },
            width: 200
          },
          {
            headerName: $translate.instant("registry.gridHeader.IMAGE_ID"),
            field: "image_id",
            cellRenderer: function(params) {
              return $sanitize(Utils.truncateString(params.value, 15));
            },
            cellStyle: {
              "font-family": "monospace"
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            },
            width: 130
          },
          {
            headerName: $translate.instant("scan.gridHeader.OS"),
            field: "base_os",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            },
            width: 150
          },
          {
            headerName: $translate.instant("registry.gridHeader.SIZE"),
            field: "size",
            valueFormatter: (params) => {
              if (params && params.value) {
                return $filter("bytesBy1000")(params.value);
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
            },
            width: 90
          },
          {
            headerName: $translate.instant("registry.gridHeader.VUL"),
            cellRenderer: (params) => {
              if (params && params.data) {
                let high = params.data.high;
                let medium = params.data.medium;
                return `<span ng-if="${high > 0}" class="label label-danger">
                          ${high}
                        </span><span ng-if="${medium >
                          0}" class="label label-warning">
                          ${medium}
                        </span>
                        <span ng-if="${medium === 0 && high === 0}" class="label label-success">
                          0
                        </span>`;
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            comparator: (value1, value2, node1, node2) => {
              let total1 = node1.data.high + node1.data.medium;
              let total2 = node2.data.high + node2.data.medium;
              return total1 - total2;
            },
            width: 100,
          },
          {
            headerName: $translate.instant("scan.gridHeader.STATUS"),
            field: "status",
            cellRenderer: function(params) {
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else
                return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
                  $sanitize(params.value)
                )}</span>`;
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            },
            width: 100,
            minWidth: 100
          },
          {
            headerName: $translate.instant("scan.gridHeader.TIME"),
            field: "scanned_at",
            cellRenderer: function(params) {
              return $sanitize($filter("date")(params.value, "MMM dd, y HH:mm:ss"));
            },
            comparator: dateComparator,
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
            },
            minWidth: 160,
            maxWidth: 170
          }
        ];

        RegistryScanFactory.registryImageSummaryGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          suppressScrollOnNewData: true,
          columnDefs: registryImageSummaryColumns,
          rowData: null,
          rowSelection: "single",
          rowStyle: { cursor: "pointer" },
          onGridReady: function(params) {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 3000);
            $win.on(resizeEvent, function() {
              $timeout(function() {
                params.api.sizeColumnsToFit();
              }, 1000);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "scan.NOT_SCANNED"
          )}</span>`
        };

        RegistryScanFactory.registryImageBriefColumns = [
          {
            headerName: $translate.instant("registry.gridHeader.REPOSITORY"),
            field: "repository",
            sort: "asc",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
            },
            width: 60
          },
          {
            headerName: $translate.instant("registry.gridHeader.TAG"),
            field: "tag",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
            },
            width: 30
          },
          {
            headerName: "",
            field: "layers",
            cellRenderer: function(params) {
              if (params.value && params.value.length > 0) {
                return `<span class='fa fa-archive text-muted' aria-hidden='true'
                          ng-click='showLayers($event, data)'
                          uib-tooltip="Show image layers">
                        </span>`;
              }
              return "";
            },
            width: 25,
            maxWidth: 25,
            minWidth: 25
          }
        ];

        RegistryScanFactory.registryImageBriefGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: RegistryScanFactory.registryImageBriefColumns,
          rowData: null,
          rowSelection: "single",
          rowStyle: { cursor: "pointer" },
          onGridReady: function(params) {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 3000);
            $win.on(resizeEvent, function() {
              $timeout(function() {
                params.api.sizeColumnsToFit();
              }, 1000);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${overlay}</span>`
        };

        const cveColumns = [
          {
            headerName: $translate.instant("scan.gridHeader.CVE_NAME"),
            field: "name"
          },
          {
            headerName: $translate.instant("scan.gridHeader.SEVERITY"),
            field: "severity",
            cellRenderer: function(params) {
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else
                if (params && params.data && params.data.tags && params.data.tags.some(tag => tag === "accepted")) {
                  return `<span class="label label-fs disabled-action">${Utils.getI18Name(
                    $sanitize(params.value)
                  )}</span>`;
                } else {
                  return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
                    $sanitize(params.value)
                  )}</span>`;
                }
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("scan.gridHeader.SCORE"),
            field: "score",
            cellRenderer: function(params) {
              /** @namespace params.data.score_v3 */
              if (params.data.score_v3) {
                if (params.value)
                  return $sanitize(`${params.value}/${params.data.score_v3}`);
                else return $sanitize(`${params.data.score_v3}`);
              } else return $sanitize(params.value);
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 110,
            minWidth: 110
          },
          {
            headerName: $translate.instant("scan.gridHeader.PACKAGE_NAME"),
            field: "package_name"
          },
          {
            headerName: $translate.instant("scan.gridHeader.PACKAGE_VERSION"),
            field: "package_version"
          },
          {
            headerName: $translate.instant("scan.gridHeader.FIXED_BY"),
            field: "fixed_version"
          },
          {
            headerName: $translate.instant("scan.gridHeader.PUBLISHED_TIME"),
            field: "published_timestamp",
            cellRenderer: params => {
              return $sanitize(
                $filter("date")(params.value * 1000, "MMM dd, y")
              );
            },
            width: 180,
            maxWidth: 180,
            minWidth: 110
          },
          {
            headerName: "",
            // cellRenderer: params => {
            //   if (params && params.data && params.data.tags && params.data.tags.some(tag => tag === "accepted")) {
            //     return null;
            //   } else {
            //     return `<div>
            //       <em class="fa fa-tag fa-lg mr-sm text-action" ng-click="acceptVulnerability($event, data)" uib-tooltip="{{\'cveProfile.ACCEPT\' | translate}}"></em>
            //     </div>`;
            //   }
            // },
            comparator: (value1, value2, node1, node2) => {
              let rc1 = 0, rc2 = 0;
              if (node1 && node1.data && node1.data.tags && node1.data.tags.some(tag => tag === "accepted")) {
                rc1 = 1;
              }
              if (node2 && node2.data && node2.data.tags && node2.data.tags.some(tag => tag === "accepted")) {
                rc2 = 1;
              }
              return rc2 - rc1;
            },
            hide: true,
            sort: "asc",
            maxWidth: 30,
            minWidth: 30
          }
        ];

        RegistryScanFactory.cveGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: cveColumns,
          rowData: null,
          rowSelection: "single",
          rowStyle: { cursor: "pointer" },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          onGridReady: function(params) {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 100);
            $win.on(resizeEvent, function() {
              $timeout(function() {
                params.api.sizeColumnsToFit();
              }, 100);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "scan.NO_VULNERABILITIES"
          )}</span>`
        };

        // Deprecated on 11/13/2020 for NVSHAS-4815
        // RegistryScanFactory.getRegistryTypes = function() {
        //   if (state.promiseInFlight) {
        //     return state.loadingPromise;
        //   }
        //   if (!state.loaded) {
        //     state.promiseInFlight = true;
        //     state.loadingPromise = $http({
        //       method: "GET",
        //       url: REGISTRY_TYPE_URL
        //     })
        //       .then(resp => resp.data)
        //       .then(data => {
        //         state.promiseInFlight = false;
        //         state.loaded = true;
        //         /** @namespace data.list.registry_type */
        //         registryTypes = data.list.registry_type.sort();
        //         return registryTypes;
        //       });
        //     return state.loadingPromise;
        //   }
        //
        //   return $q.when(registryTypes);
        // };

        RegistryScanFactory.getRegistryTypes = function() {
          return $http({
            method: "GET",
            url: REGISTRY_TYPE_URL
          });
        };

        let layersColumns = [
          {
            headerName: $translate.instant("registry.gridHeader.DIGEST"),
            field: "digest",
            cellRenderer: function(params) {
              return `<span class="monospace" uib-tooltip="${
                params.data.digestFull
              }">${$sanitize(params.value)}</span>`;
            },
            width: 260
          },
          {
            headerName: $translate.instant("registry.gridHeader.CVE"),
            field: "vulnerabilities",
            cellRenderer: function(params) {
              if (params.value) {
                let high = 0;
                let medium = 0;
                let vuls = params.value;
                if (vuls.length > 0) {
                  high = vuls.filter(function(vul) {
                    return vul.severity.toLowerCase() === "high";
                  }).length;
                  medium = vuls.filter(function(vul) {
                    return vul.severity.toLowerCase() === "medium";
                  }).length;
                }
                return `<span ng-if="${high > 0}" class="label label-danger">
                          ${high}
                        </span><span ng-if="${medium >
                          0}" class="label label-warning">
                          ${medium}
                        </span><span ng-if="${medium === 0 && high === 0}"
                        class="label label-success">
                          0
                        </span>`;
              }
            },
            width: 100,
            maxWidth: 140,
            minWidth: 80
          },
          {
            headerName: $translate.instant("registry.gridHeader.SIZE"),
            field: "size",
            cellRenderer: function(params) {
              if (params.value) {
                return $sanitize($filter("bytes")(params.value));
              }
            },
            width: 70,
            maxWidth: 70,
            minWidth: 70
          }
        ];

        RegistryScanFactory.layersGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: false,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: layersColumns,
          rowData: null,
          rowSelection: "single",
          rowStyle: { cursor: "pointer" },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          onGridReady: function(params) {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 100);
            $win.on(resizeEvent, function() {
              $timeout(function() {
                params.api.sizeColumnsToFit();
              }, 100);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "registry.NO_LAYERS"
          )}</span>`
        };

        RegistryScanFactory.layerVulsGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: cveColumns,
          rowData: null,
          rowSelection: "single",
          rowStyle: { cursor: "pointer" },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          rowClassRules: {
            "disabled-row": function(params) {
              if (!params.data || !params.data.tags) return;
              return params.data.tags.some(tag => tag.toLowerCase() === "accepted");
            }
          },
          onGridReady: function(params) {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 100);
            $win.on(resizeEvent, function() {
              $timeout(function() {
                params.api.sizeColumnsToFit();
              }, 100);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "registry.NO_VULS"
          )}</span>`
        };

        const level1 = $translate.instant("cis.LEVEL1");
        const scored = $translate.instant("cis.SCORED");

        let complianceColumns = [
          {
            headerName: $translate.instant("nodes.gridHeader.CATEGORY"),
            field: "category",
            cellRenderer: function(params) {
              if (params.value) {
                return `<span class="label label-fs label-info">${$sanitize(
                  params.value
                )}</span>`;
              } else return null;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("nodes.gridHeader.TEST_NUM"),
            field: "test_number",
            width: 70,
            minWidth: 50
          },
          {
            headerName: $translate.instant("nodes.gridHeader.LEVEL"),
            field: "level",
            cellRenderer: function(params) {
              if (params.value) {
                let className = colourMap[params.value];
                if (className)
                  return `<span class="label label-fs label-${className}">${$sanitize(
                    params.value
                  )}</span>`;
                else return null;
              } else return null;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("cis.report.gridHeader.SCORED") + "<em class='fa fa-info text-primary pl-sm'> </em>",
            field: "scored",
            headerTooltip: scored,
            cellRenderer: function(params) {
              let htmlValue = params.value ? "Y" : "N";
              return `<span >${htmlValue}</span>`;
            },
            getQuickFilterText: function(params) {
              if (params.value) return "scored";
            },
            maxWidth: 90,
            minWidth: 70
          },
          {
            headerName: $translate.instant("cis.report.gridHeader.PROFILE") + "<em class='fa fa-info text-primary pl-sm'> </em>",
            field: "profile",
            headerTooltip: level1,
            getQuickFilterText: function(params) {
              if (params.value === "Level 1") return "level1";
              else return "level2"
            },
            maxWidth: 90,
            minWidth: 80
          },
          {
            headerName: $translate.instant("registry.gridHeader.DESC"),
            field: "description"
          }//,
          // {
          //   headerName: $translate.instant("registry.gridHeader.REMEDIATION"),
          //   field: "remediation",
          //   width: 100
          // }
        ];

        RegistryScanFactory.getComplianceGridOptions = () => {
          if (_complianceGridOptions === null) _complianceGridOptions = Utils.createGridOptions(complianceColumns);
          _complianceGridOptions.rowHeight = 90;
          _complianceGridOptions.defaultColDef = {
            flex: 1,
            cellClass: 'cell-wrap-text-fix-height',
            sortable: true,
            resizable: true,
          };
          return _complianceGridOptions;
        };

        function moduleCellRenderer(params) {
          return `<span style="cursor: default;">${$sanitize(params.value)}</span>`;
        }

        function FullWidthCellRenderer() {}

        FullWidthCellRenderer.prototype.init = function(params) {
          let eTemp = document.createElement("div");
          eTemp.innerHTML = this.getTemplate(params);
          this.eGui = eTemp.firstElementChild;

          this.consumeMouseWheelOnCenterText();
        };

        FullWidthCellRenderer.prototype.getTemplate = function(params) {
          let data = params.node.data;
          let title = $translate.instant("registry.gridHeader.CPES");
          let cpes = data.cpes.map(cpe => {
            return `<div>${cpe}</div>`;
          }).join("");

          return (
            '<div class="full-width-panel">' +
            '  <div class="full-width-flag">' +
            '    <em class="fa fa-server'+
            ' fa-2x text-primary mr-lg"></em>' +
            "  </div>" +
            '  <div class="full-width-summary">' +
            '    <span class="label label-primary' +
            '">' +
            $sanitize(title) +
            "</span><br/>" +
            "  </div>" +
            '  <div class="full-width-center">' +
            $sanitize(cpes) +
            "  </div>" +
            "</div>"
          );
        };

        FullWidthCellRenderer.prototype.getGui = function() {
          return this.eGui;
        };

        FullWidthCellRenderer.prototype.consumeMouseWheelOnCenterText = function() {
          let eFullWidthCenter = this.eGui.querySelector(".full-width-center");

          let mouseWheelListener = function(event) {
            event.stopPropagation();
          };

          // event is 'mousewheel' for IE9, Chrome, Safari, Opera
          eFullWidthCenter.addEventListener("mousewheel", mouseWheelListener);
          // event is 'DOMMouseScroll' Firefox
          eFullWidthCenter.addEventListener("DOMMouseScroll", mouseWheelListener);
        };

        let moduleColumns = [
          {
            headerName: $translate.instant("registry.gridHeader.NAME"),
            field: "name",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: { innerRenderer: moduleCellRenderer },
            width: 130
          },
          {
            headerName: $translate.instant("registry.gridHeader.SOURCE"),
            field: "source",
            width: 60
          },
          {
            headerName: $translate.instant("registry.gridHeader.VERSION"),
            field: "version",
            width: 80
          },
          {
            headerName: $translate.instant("registry.gridHeader.VUL"),
            field: "cves",
            sort: "desc",
            cellRenderer: (params) => {
              if (params && params.value) {
                let total = params.value.length;
                let typedVulCnt = {};
                params.value.forEach(cve => {
                  typedVulCnt[cve.status.toLowerCase()] = isNaN(typedVulCnt[cve.status.toLowerCase()]) ? 1 : typedVulCnt[cve.status.toLowerCase()] + 1;
                });
                let fixable = typedVulCnt[CVE_ST.FIXABLE.toLowerCase()] ? typedVulCnt[CVE_ST.FIXABLE.toLowerCase()] : 0;
                let unpatched = typedVulCnt[CVE_ST.UNPATCHED.toLowerCase()] ? typedVulCnt[CVE_ST.UNPATCHED.toLowerCase()] : 0;
                let willNotFix = typedVulCnt[CVE_ST.WILL_NOT_FIX.toLowerCase()] ? typedVulCnt[CVE_ST.WILL_NOT_FIX.toLowerCase()] : 0;
                let unaffected = typedVulCnt[CVE_ST.UNAFFECTED.toLowerCase()] ? typedVulCnt[CVE_ST.UNAFFECTED.toLowerCase()] : 0;

                return `<span class="text-danger text-bold">
                          ${$translate.instant("registry.gridHeader.FIXABLE")}: ${fixable}
                        </span>/
                        <span class="text-bold">
                          ${$translate.instant("registry.gridHeader.TOTAL")}: ${total}
                        </span>`;
              } else {
                return `<span class="text-success text-bold">${$translate.instant("registry.gridHeader.TOTAL")}: 0</span>`;
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            comparator: (value1, value2, node1, node2) => {
              let total1 = node1.data.cves ? node1.data.cves.length : 0;
              let total2 = node2.data.cves ? node2.data.cves.length : 0;
              return total1 - total2;
            },
            width: 120
          }
        ];

        RegistryScanFactory.getModuleGridOptions = () => {
          if (_moduleGridOptions === null) _moduleGridOptions = Utils.createGridOptions(moduleColumns);
          _moduleGridOptions.isFullWidthCell = function(rowNode) {
            return rowNode.flower;
          };
          _moduleGridOptions.fullWidthCellRenderer = FullWidthCellRenderer;
          _moduleGridOptions.getRowHeight = function(params) {
            let rowIsNestedRow = params.node.flower;
            return rowIsNestedRow ? 80 : 30;
          },
          _moduleGridOptions.doesDataFlower = function(dataItem) {
            return dataItem.cpes && dataItem.cpes.length > 0;
          };
          return _moduleGridOptions;
        };

        let moduleCveColumns = [
          {
            headerName: $translate.instant("registry.gridHeader.CVES"),
            field: "name",
            width: 100
          },
          {
            headerName: $translate.instant("registry.gridHeader.STATUS"),
            field: "status",
            cellRenderer: (params) => {
              if (params && params.data) {
                let status = params.data.status;
                let statusLabelColor = "";
                let statusText = "";
                switch(params.data.status.toLowerCase()) {
                  case CVE_ST.FIXABLE.toLowerCase():
                    statusLabelColor = "label-danger";
                    statusText = $translate.instant("registry.gridHeader.FIXABLE");
                    break;
                  case CVE_ST.UNPATCHED.toLowerCase():
                    statusLabelColor = "label-warning";
                    statusText = $translate.instant("registry.gridHeader.UNPATCHED");
                    break;
                  case CVE_ST.WILL_NOT_FIX.toLowerCase():
                    statusLabelColor = "label-success";
                    statusText = $translate.instant("registry.gridHeader.WILL_NOT_FIX");
                    break;
                }

                return `<div class="ml-sm label ${statusLabelColor}" style="width: 70px;">${statusText}</div>`;
              }
            },
            width: 60
          },
          {
            headerName: $translate.instant("scan.gridHeader.FIXED_BY"),
            field: "fixed_version",
            width: 80
          },
        ];

        RegistryScanFactory.getModuleCveGridOptions = () => {
          if (_moduleCveGridOptions === null) _moduleCveGridOptions = Utils.createGridOptions(moduleCveColumns);
          return _moduleCveGridOptions;
        };

        let registryTestInfoColumns = [
          {
            headerName: "",
            field: "step_type",
            cellRenderer: (params) => {
              if (params && params.value) {
                if (params.value === "stop") {
                  return `<span style="display: inline-block; width: 90px;" class="text-center"><em class="fa fa-ban text-danger"></em></span>`;
                } else if (params.data.step_type !== "stage" && params.data.step_type !== "other-images") {
                  return `<span style="display:
                                inline-block; width: 90px;"
                                class="pt-sm pb-sm label label-${colourMap[params.value]}">
                                ${$translate.instant(`registry.test_label.${params.value.toUpperCase()}`)}
                          </span>`;
                }
              }
            },
            minWidth: 105,
            maxWidth: 105,
            width: 105
          },
          {
            headerName: "",
            field: "step_content",
            cellRenderer: (params) => {
              let content = "";
              let label = "";
              if (params && params.value && params.data && params.node) {
                if (params.data.step_type === "response") {
                  let escapedResponse = Utils.escapeHtml(params.value);
                  if (params.data.isExpanded) {
                    content = `<span class="text-muted">${escapedResponse}</span><br/>
                      <span class="link" ng-click="collapseRow(data, ${params.node.rowIndex})">(${$translate.instant("general.VIEW_LESS")})</span>`;
                  } else {
                    content = `<span class="text-muted">${escapedResponse.length > 200 ?
                      `${escapedResponse.substring(0, 200)}...<span class="link" ng-click="expandRow(data, ${params.node.rowIndex})">(${$translate.instant("general.VIEW_MORE")})</span>` :
                      escapedResponse}</span>`;
                  }
                } else if (params.data.step_type === "stage") {
                  content = `<span class="text-bold">${params.value}</span>`;
                } else if (params.data.step_type === "stop") {
                  content = `<span class="text-bold text-danger">${params.value}</span>`;
                } else if (params.data.step_type === "error") {
                  content = Utils.escapeHtml(params.value);
                } else if (params.data.step_type === "comment" || params.data.step_type === "images") {
                  content = Utils.escapeHtml(params.value).replace(/\r?\n|\r/g, "<br/>");
                } else {
                  content = Utils.escapeHtml(params.value);
                }
              } else {
                if (params.value === "" && params.data.step_type === "") {
                  content = `<span class="text-center" style="display: inline-block; width: 100%;"><em class="fa fa-spinner fa-spin"></em></span>`;
                }
              }

              // if (params.data.step_type === "stop") {
              //   label = `<span style="display: inline-block; width: 90px;" class="text-center"><em class="fa fa-ban text-danger"></em></span>`;
              // } else if (params.data.step_type !== "stage") {
              //   label = `<span style="display: inline-block; width: 90px;" class="pt-sm pb-sm label label-${colourMap[params.data.step_type]}">${$translate.instant(`registry.test_label$.{params.data.step_type.toUpperCase()}`)}</span>`;
              // }

              return label ? `<span>${label}</span><br/><span>${content}</span>` : content;
            },
            width: 500
          }
        ];

        RegistryScanFactory.getRegistryTestInfoGridOptions = () => {
          if (_registryTestInfoGridOptions === null) _registryTestInfoGridOptions = Utils.createGridOptions(registryTestInfoColumns);
          _registryTestInfoGridOptions.defaultColDef = {
            flex: 1,
            cellClass: 'cell-wrap-text-break-word',
            autoHeight: true,
            sortable: true,
            resizable: true,
          };
          _registryTestInfoGridOptions.onColumnResized = function(params) {
            params.api.resetRowHeights();
          };
          _registryTestInfoGridOptions.headerHeight = 0;
          _registryTestInfoGridOptions.enableSorting = false;
          _registryTestInfoGridOptions.suppressScrollOnNewData = true;
          return _registryTestInfoGridOptions;
        };
      };

      return RegistryScanFactory;
    });
})();
