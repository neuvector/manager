(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("ScanFactory", function(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      $q,
      Utils,
      $sanitize
    ) {
      let _isScanEnable;
      let ScanFactory = {};
      let _scanConfig;

      ScanFactory.setGrids = function() {
        function dateComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.scanned_at */
          /** @namespace node1.data.scanned_timestamp */
          if (!node1.data.scanned_at && !node2.data.scanned_at) return 0;
          else if (!node1.data.scanned_at) return 100;
          else if (!node2.data.scanned_at) return -100;
          else
            return node1.data.scanned_timestamp - node2.data.scanned_timestamp;
        }

        function highComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.hidden_high */
          return node1.data.hidden_high - node2.data.hidden_high;
        }

        function mediumComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.hidden_medium */
          return node1.data.hidden_medium - node2.data.hidden_medium;
        }

        function innerCellRenderer(params) {
          if (params.data.status === "finished") {
            if (params.data.high && params.data.high > 0)
              return `<span class="text-danger">${$sanitize(
                params.value
              )}</span>`;
            else if (params.data.medium && params.data.medium > 0)
              return `<span class="text-warning">${$sanitize(
                params.value
              )}</span>`;
            else
              return `<span class="text-success">${$sanitize(
                params.value
              )}</span>`;
          } else {
            return `<span>${$sanitize(params.value)}</span>`;
          }
        }

        const workloadColumns = [
          {
            headerName: $translate.instant("scan.gridHeader.NAME"),
            field: "display_name",
            sort: "asc",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: { innerRenderer: innerCellRenderer },
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: "Id",
            field: "id",
            hide: true
          },
          {
            headerName: "ShareWith",
            field: "share_ns_with",
            hide: true
          },
          {
            headerName: $translate.instant("scan.gridHeader.DOMAIN"),
            field: "domain",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("scan.gridHeader.OS"),
            field: "base_os",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("scan.gridHeader.NODE"),
            field: "host",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("scan.gridHeader.IMAGE"),
            field: "image",
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
            maxWidth: 110,
            minWidth: 100
          },
          {
            headerName: $translate.instant("scan.gridHeader.HIGH"),
            field: "high",
            cellRenderer: function(params) {
              if (
                params.data.children &&
                params.data.children.length > 0 &&
                (params.data.hidden_high || params.data.hidden_high === 0)
              ) {
                return $sanitize(
                  `${params.value} (${params.data.hidden_high})`
                );
              } else {
                return $sanitize(params.value);
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            comparator: highComparator,
            width: 80,
            maxWidth: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.MEDIUM"),
            field: "medium",
            cellRenderer: function(params) {
              if (
                params.data.children &&
                params.data.children.length > 0 &&
                (params.data.hidden_medium || params.data.hidden_medium === 0)
              ) {
                return $sanitize(
                  `${params.value} (${params.data.hidden_medium})`
                );
              } else {
                return $sanitize(params.value);
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            comparator: mediumComparator,
            width: 80,
            maxWidth: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.TIME"),
            field: "scanned_at",
            cellRenderer: function(params) {
              return $sanitize(
                $filter("date")(params.value, "MMM dd, y HH:mm:ss")
              );
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

        const hostColumns = [
          {
            headerName: $translate.instant("scan.gridHeader.NAME"),
            field: "display_name",
            cellRenderer: function(params) {
              if (params.data.status === "finished") {
                if (params.data.high && params.data.high > 0)
                  return `<span class="text-danger">${$sanitize(
                    params.value
                  )}</span>`;
                else if (params.data.medium && params.data.medium > 0)
                  return `<span class="text-warning">${$sanitize(
                    params.value
                  )}</span>`;
                else
                  return `<span class="text-success">${$sanitize(
                    params.value
                  )}</span>`;
              } else {
                return `<span>${$sanitize(params.value)}</span>`;
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: "Id",
            field: "id",
            hide: true
          },
          {
            headerName: $translate.instant("scan.gridHeader.OS"),
            field: "base_os",
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
            headerName: $translate.instant("scan.gridHeader.HIGH"),
            field: "high",
            sort: "desc",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 80,
            maxWidth: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.MEDIUM"),
            field: "medium",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.TIME"),
            field: "scanned_at",
            cellRenderer: function(params) {
              return $sanitize(
                $filter("date")(params.value, "MMM dd, y HH:mm:ss")
              );
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

        const platformColumns = [
          {
            headerName: $translate.instant("scan.gridHeader.NAME"),
            field: "name"
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
            headerName: $translate.instant("scan.gridHeader.HIGH"),
            field: "high",
            sort: "desc",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 80,
            maxWidth: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.MEDIUM"),
            field: "medium",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.TIME"),
            field: "scanned_at",
            cellRenderer: function(params) {
              return $sanitize(
                $filter("date")(params.value, "MMM dd, y HH:mm:ss")
              );
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

        function getWorkloadChildDetails(rowItem) {
          if (rowItem.children && rowItem.children.length > 0) {
            return {
              group: true,
              children: rowItem.children,
              expanded: rowItem.children.length > 0
            };
          } else {
            return null;
          }
        }

        ScanFactory.gridOptions = Utils.createGridOptions(workloadColumns);
        ScanFactory.gridOptions.getNodeChildDetails = getWorkloadChildDetails;

        ScanFactory.hostGridOptions = Utils.createGridOptions(hostColumns);

        ScanFactory.platformGridOptions = Utils.createGridOptions(
          platformColumns
        );

        let cveColumns = [
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
                  console.log("accepted")
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
            width: 120,
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
              if (params.value > 0) {
                return $sanitize(
                  $filter("date")(params.value * 1000, "MMM dd, y")
                );
              }
            },
            maxWidth: 120,
            minWidth: 80
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

        ScanFactory.cveGridOptions = Utils.createGridOptions(cveColumns);
        ScanFactory.cveGridOptions.rowClassRules = {
          "disabled-row": function(params) {
            if (!params.data || !params.data.tags) return;
            return params.data.tags.some(tag => tag.toLowerCase() === "accepted");
          }
        };
        ScanFactory.cveGridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
          "scan.NO_VULNERABILITIES"
        )}</span>`;
      };

      ScanFactory.getScanLicense = function() {
        return $http
          .get(LICENSE_URL)
          .then(function(response) {
            if (response.data.license && response.data.license.info)
              _isScanEnable = response.data.license.info.scan;
            return _isScanEnable;
          })
          .catch(function(err) {
            console.warn(err);
          });
      };

      ScanFactory.startScan = function(url, id) {
        return $http
          .post(url, id)
          .then(function() {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("scan.START_SCAN"));
          })
          .catch(function(err) {
            console.warn(err);
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(err, $translate.instant("scan.FAILED_SCAN"), false)
              );
            }
          });
      };

      ScanFactory.getScanConfig = function() {
        return $http
          .get(SCAN_CONFIG_URL)
          .then(function(response) {
            _scanConfig = response.data.config;
            return _scanConfig;
          })
          .catch(function(err) {
            console.warn(err);
            console.log("err.status", err.status)
            if (USER_TIMEOUT.indexOf(err.status) < 0 && err.status !== ACC_FORBIDDEN) {
              Alertify.alert(
                Utils.getAlertifyMsg(err, $translate.instant("scan.message.CONFIG_ERR"), true)
              );
            } else if (err.status === ACC_FORBIDDEN) {
              throw(err);
            }
          });
      };

      ScanFactory.configAutoScan = function(scanConfig) {
        return $http
          .post(SCAN_CONFIG_URL, { config: scanConfig })
          .then(function(response) {
            console.log(response);
          })
          .catch(function(err) {
            console.warn(err);
          });
      };

      ScanFactory.getWorkloadReport = function(id, isShowingAccepted) {
        return $http
          .get(SCAN_URL, { params: { id: id, show: isShowingAccepted ? "accepted" : null } })
          .then(function(response) {
            let vulnerabilities = [];
            if (response.data.report)
              vulnerabilities = response.data.report.vulnerabilities;
            return vulnerabilities;
          })
          .catch(function(err) {
            console.error(err);
          });
      };

      return ScanFactory;
    });
})();
