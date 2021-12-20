(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("PlatformFactory", function(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      $sanitize,
      Utils
    ) {
      let PlatformFactory = {};

      PlatformFactory.prepareGrids = () => {
        const colorMap = {
          PCI: "green",
          GDPR: "warning",
          HIPAA: "monitor",
          NIST: "inverse",
        };

        const dateComparator = (value1, value2, node1, node2) => {
          /** @namespace node1.data.scanned_at */
          /** @namespace node1.data.scanned_timestamp */
          if (!node1.data.scanned_at && !node2.data.scanned_at) return 0;
          else if (!node1.data.scanned_at) return 100;
          else if (!node2.data.scanned_at) return -100;
          else return node1.data.scanned_timestamp - node2.data.scanned_timestamp;
        };

        const columnDefs = [
          {
            headerName: $translate.instant("scan.gridHeader.NAME"),
            field: "platform"
          },
          {
            headerName: $translate.instant("scan.gridHeader.VERSION"),
            cellRenderer: function(params) {
              if (params && params.data) {
                if (params.data.platform.toLowerCase().includes(KUBE)) {
                  if (params.data.platform.toLowerCase().includes(OC)) {
                    return params.data.openshift_version;
                  } else {
                    return params.data.kube_version;
                  }
                }
              }
            },
            getQuickFilterText: function(params) {
              if (params && params.data) {
                if (params.data.platform.toLowerCase().includes(KUBE)) {
                  if (params.data.platform.toLowerCase().includes(OC)) {
                    return "openshift_version";
                  } else {
                    return "kube_version";
                  }
                }
              }
            }
          },
          {
            headerName: $translate.instant("scan.gridHeader.STATUS"),
            field: "status",
            cellRenderer: function(params) {
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else
                return `<span class="label label-fs label-${labelCode}">${$sanitize(Utils.getI18Name(
                  params.value
                ))}</span>`;
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
              sortAscending: `<em class="fa fa-sort-amount-asc"></em>`,
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 80,
            minWidth: 80
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

        let domainColumns = [
          {
            headerName: $translate.instant("scan.gridHeader.NAME"),
            field: "name"
          },
          {
            headerName: $translate.instant("cis.profile.TEMPLATES"),
            field: "tags",
            cellRenderer: (params) => {
              if (params.value && params.value.length > 0) {
                const tags = params.value.map((tag) => {
                  return (
                    `<span class="label label-${colorMap[tag]}"
                           style="padding-left: 3px;"/>
                       &#8942;&#8942;&nbsp;&nbsp;${tag}
                     </span>`);
                });
                return `${tags.join(" ")}`;
              } else
                return (
                  `<div class="label label-primary label-fs">
                    &#8942;&#8942;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;All&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                   </div>`
                );
            },
            maxWidth: 200,
            minWidth: 80,
          },
          {
            headerName: $translate.instant("multiCluster.summary.TOTAL_WORKLOAD"),
            field: "workloads",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            maxWidth: 150,
            minWidth: 100
          },
          {
            headerName: $translate.instant("multiCluster.summary.RUNNING_POD"),
            field: "running_pods",
            icons: {
              sortAscending: `<em class="fa fa-sort-amount-asc"></em>`,
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            maxWidth: 150,
            minWidth: 100
          },
          {
            headerName: $translate.instant("dashboard.summary.SERVICE"),
            field: "services",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            maxWidth: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("user.gridHeader.ACTION"),
            field: "action",
            cellRenderer: (params) => {
              return `<em class="fa fa-edit fa-lg mr-sm text-action"
                     ng-click="editTemplate($event, data)">
                 </em>`;
            },
            cellClass: "grid-right-align",
            suppressSorting: true,
            hide: true,
            maxWidth: 70,
            minWidth: 60,
          }
        ];
        PlatformFactory.getGridOptions = () => {
          return Utils.createGridOptions(columnDefs);
        };

        PlatformFactory.getDomainGridOptions = () => Utils.createGridOptions(domainColumns);
      };

      PlatformFactory.getPlatforms = () => $http.get(SCAN_PLATFORM_URL);

      PlatformFactory.getScanReport = (platform, isShowingAccepted) => $http
        .get(SCAN_PLATFORM_URL, {params: {platform: platform, show: isShowingAccepted ? "accepted" : null}})
        .then(function (response) {
          let vulnerabilities = [];
          if (response.data.report)
            vulnerabilities = response.data.report.vulnerabilities;
          return vulnerabilities;
        })
        .catch(function (err) {
          console.error(err);
        });

        PlatformFactory.getPlatformMap = () => $http
          .get(SCAN_PLATFORM_URL)
          .then(function (response) {
            const platformMap4Pdf = {};
            response.data.platforms.forEach((platform) => {
              platformMap4Pdf[platform.platform] = {
                platform: platform.platform,
                base_os: platform.base_os || "",
                kube_version: platform.kube_version || "",
                openshift_version: platform.openshift_version || "",
                high: 0,
                medium: 0,
                complianceCnt: 0,
                vulnerabilites: [],
                complianceList: []
              };
            });
            return platformMap4Pdf;
          })
          .catch(function (err) {
            console.error(err);
            return {};
          });

      PlatformFactory.getDomains = () => $http
        .get(DOMAIN_URL)
        .then(function (response) {
          return response.data;
        })
        .catch(function (err) {
        });

      PlatformFactory.updateDomain = (payload, callback) =>
        $http
          .patch(DOMAIN_URL, payload)
          .then(() => {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("general.DEPLOY_OK"));
            if (angular.isFunction(callback)) callback();
          })
          .catch(function (error) {
            console.warn(error);
            if (angular.isFunction(callback)) callback();
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  error,
                  $translate.instant("general.FAILED_TO_UPDATE"),
                  false
                )
              );
            }
          });

      PlatformFactory.toggleDomainTagging = (payload) =>
        $http
          .post(DOMAIN_URL, payload)
          .then(() => {
            // Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            // Alertify.success($translate.instant("general.DEPLOY_OK"));
          })
          .catch(function (error) {
            console.warn(error);
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  error,
                  $translate.instant("general.FAILED_TO_UPDATE"),
                  false
                )
              );
            }
          });

      return PlatformFactory;
    });
})();
