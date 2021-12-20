(function () {
  "use strict";
  angular
    .module("app.assets")
    .factory(
      "NetworkFactory",
      function (
        $http,
        Alertify,
        $translate,
        $filter,
        $timeout,
        $sanitize,
        Utils
      ) {
        let NetworkFactory = {};

        const largeNetworkNodeCount = 100;
        const EXPANDED = "-";
        const COLLAPSED = "+";

        let domains = [];

        let domainMap = new Map();
        let groupMap = new Map();

        function numberCellFormatter(params) {
          return $sanitize($filter("bytes")(params.value));
        }

        const ageFormatter = (params) =>
          moment.duration(params.value, "seconds").humanize();

        function ageComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.age */
          return node1.data.age - node2.data.age;
        }

        function bytesComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.bytes */
          return node1.data.bytes - node2.data.bytes;
        }

        function dateComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.last_seen_at */
          return (
            Date.parse(node1.data.last_seen_at) -
            Date.parse(node2.data.last_seen_at)
          );
        }

        function getMessage(id, serviceName) {
          return (
            $translate.instant("topbar.mode.MODE_SERVICE") +
            serviceName +
            $translate.instant("topbar.mode.SERVICE_TO") +
            $translate.instant("enum." + id.toUpperCase()) +
            $translate.instant("topbar.mode.MODE")
          );
        }

        NetworkFactory.initGroups = function () {
          if (groupMap && groupMap.size > 0) {
            groupMap.forEach(function (value) {
              value.status = COLLAPSED;
            });
          }
        };

        NetworkFactory.initDomains = function () {
          if (domainMap && domainMap.size > 0) {
            domainMap.forEach(function (value) {
              value.status = COLLAPSED;
            });
          }
        };

        NetworkFactory.collapseAllDomains = function (
          currentNodes,
          currentEdges
        ) {
          domains.forEach(function (domain) {
            if (domain.name === "external") return;
            let theDomain = domainMap.get(domain.name);
            // noinspection JSValidateTypes
            if (theDomain && isDomainExpanded(theDomain)) {
              NetworkFactory.collapseDomain(
                domain.name,
                currentNodes,
                currentEdges
              );
              theDomain.status = COLLAPSED;
              groupMap.forEach(function (value) {
                if (value.domain === domain.name) {
                  value.status = "";
                }
              });
              domainMap.set(domain.name, theDomain);
            }
          });
        };

        NetworkFactory.conHistoryColumnsPre = [];
        NetworkFactory.setGrids = function () {
          NetworkFactory.activeColumns = [
            {
              headerName: $translate.instant("network.gridHeader.APP"),
              field: "application",
            },
            {
              headerName: $translate.instant("network.gridHeader.CLIENT"),
              field: "client_ip",
              suppressSorting: true,
              cellRenderer: function (params) {
                /** @namespace params.data.client_ip */
                /** @namespace params.data.client_port */
                return $sanitize(
                  "<div>" +
                    params.data.client_ip +
                    ":" +
                    params.data.client_port +
                    "</div>"
                );
              },
            },
            {
              headerName: $translate.instant("network.gridHeader.SERVER"),
              field: "server_ip",
              suppressSorting: true,
              cellRenderer: function (params) {
                /** @namespace params.data.server_ip */
                /** @namespace params.data.server_port */
                return $sanitize(
                  "<div>" +
                    params.data.server_ip +
                    ":" +
                    params.data.server_port +
                    "</div>"
                );
              },
            },
            {
              headerName: $translate.instant("network.gridHeader.CLIENT_BYTES"),
              field: "client_bytes",
              valueFormatter: numberCellFormatter,
              cellClass: "grid-right-align",
              cellRenderer: "agAnimateShowChangeCellRenderer",
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
              width: 200,
            },
            {
              headerName: $translate.instant("network.gridHeader.SERVER_BYTES"),
              field: "server_bytes",
              valueFormatter: numberCellFormatter,
              cellClass: "grid-right-align",
              cellRenderer: "agAnimateShowChangeCellRenderer",
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
              width: 200,
            },
            {
              headerName: $translate.instant("network.gridHeader.POLICY"),
              field: "policy_id",
              cellRenderer: function (params) {
                if (params.value >= 10000)
                  return `<div class="label ${
                    colourMap["LEARNED"]
                  }">${$sanitize(params.value)}</div>`;
                else if (params.value > 0)
                  return `<div class="label ${colourMap["CUSTOM"]}">${$sanitize(
                    params.value
                  )}</div>`;
                else return null;
              },
              width: 70,
              minWidth: 70,
              maxWidth: 90,
            },
            {
              headerName: $translate.instant("network.gridHeader.ACTION"),
              field: "policy_action",
              cellRenderer: function (params) {
                if (params.value) {
                  let mode = Utils.getI18Name(params.value);
                  let labelCode = colourMap[params.value];
                  if (!labelCode) labelCode = "info";
                  return `<span class="label label-${labelCode}">${$sanitize(
                    mode
                  )}</span>`;
                } else return null;
              },
              width: 100,
              maxWidth: 110,
            },
            {
              headerName: $translate.instant("network.gridHeader.AGE"),
              field: "age",
              valueFormatter: ageFormatter,
              cellClass: "grid-right-align",
              cellRenderer: "agAnimateSlideCellRenderer",
              comparator: ageComparator,
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
            },
          ];

          NetworkFactory.conHistoryColumnsPre = [
            {
              headerName: " ",
              /**
               *
               * @param params {{data: {}}}
               * @returns {string}
               */
              cellRenderer: function (params) {
                /** @namespace params.data.severity */
                /** @namespace params.data.policy_action */
                const proxy = `<div class="label label-info"> Proxy </div>`;

                if (params.data.severity) {
                  if (params.data.to_sidecar)
                    /** @namespace params.data.threat_name */
                    return `<span><em class="fa fa-bug text-danger mr-sm"></em> ${params.data.threat_name}${proxy}</span>`;
                  else
                    return `<span><em class="fa fa-bug text-danger"></em> ${params.data.threat_name}</span>`;
                } else if (
                  params.data.policy_action === "violate" ||
                  params.data.policy_action === "deny"
                ) {
                  if (params.data.to_sidecar)
                    return `<span><em class="fa fa-ban text-warning mr-sm"></em>${proxy}</span>`;
                  else
                    return `<span><em class="fa fa-ban text-warning"></em></span>`;
                } else {
                  if (params.data.to_sidecar)
                    return `<span><em class="fa fa-check text-green mr-sm"></em>${proxy}</span>`;
                  else
                    return `<span><em class="fa fa-check text-green"></em></span>`;
                }
              },
              suppressSorting: true,
            },
            {
              headerName: $translate.instant("network.gridHeader.APP"),
              field: "application",
            },
          ];

          NetworkFactory.conHistoryColumnsPost = [
            {
              headerName: $translate.instant("network.gridHeader.PORT"),
              suppressSorting: true,
              cellRenderer: function (params) {
                /** @namespace params.data.mapped_port */
                if (params.data.mapped_port === params.data.port)
                  return params.data.port;
                else
                  return $sanitize(
                    "<span>" +
                      params.data.port +
                      ":" +
                      +params.data.mapped_port.substring(
                        params.data.mapped_port.indexOf("/") + 1,
                        params.data.mapped_port.length
                      ) +
                      "</span>"
                  );
              },
            },
            {
              headerName: $translate.instant("network.gridHeader.BYTES"),
              field: "bytes",
              cellRenderer: function (params) {
                return $sanitize($filter("bytes")(params.value));
              },
              comparator: bytesComparator,
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
            },
            {
              headerName: $translate.instant("network.edgeDetails.RULE_ID"),
              field: "policy_id",
              cellRenderer: function (params) {
                if (params.value >= 10000)
                  return `<div class="label ${
                    colourMap["LEARNED"]
                  }">${$sanitize(params.value)}</div>`;
                else if (params.value > 0)
                  return `<div class="label ${colourMap["CUSTOM"]}">${$sanitize(
                    params.value
                  )}</div>`;
                else return null;
              },
              width: 70,
              minWidth: 70,
              maxWidth: 90,
            },
            {
              headerName: $translate.instant("network.gridHeader.ACTION"),
              field: "policy_action",
              cellRenderer: function (params) {
                if (params.value) {
                  let mode = Utils.getI18Name(params.value);
                  let labelCode = colourMap[params.value];
                  if (!labelCode) labelCode = "info";
                  return `<span class="label label-${labelCode}">${$sanitize(
                    mode
                  )}</span>`;
                } else return null;
              },
              width: 100,
              maxWidth: 110,
            },
            {
              headerName: $translate.instant("network.gridHeader.TIME"),
              field: "last_seen_at",
              cellRenderer: function (params) {
                return $sanitize(
                  $filter("date")(params.value, "MMM dd, y HH:mm:ss")
                );
              },
              comparator: dateComparator,
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
              minWidth: 160,
              maxWidth: 170,
            },
          ];

          NetworkFactory.sniffColumns = [
            {
              headerName: $translate.instant("network.gridHeader.START_TIME"),
              field: "start_time",
              cellRenderer: function (params) {
                return $sanitize(
                  $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss")
                );
              },
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
              minWidth: 160,
              maxWidth: 170,
            },
            {
              headerName: $translate.instant("containers.process.STATUS"),
              field: "status",
            },
            {
              headerName: $translate.instant("network.gridHeader.FILE_SIZE"),
              field: "size",
              valueFormatter: numberCellFormatter,
              cellClass: "grid-right-align",
              cellRenderer: "agAnimateShowChangeCellRenderer",
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
            },
            {
              headerName: $translate.instant("network.gridHeader.STOP_TIME"),
              field: "stop_time",
              cellRenderer: function (params) {
                if (params.value > 0)
                  return $sanitize(
                    $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss")
                  );
                else return "";
              },
              icons: {
                sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
                sortDescending: '<em class="fa fa-sort-numeric-desc"></em>',
              },
              minWidth: 160,
              maxWidth: 170,
            },
          ];
        };

        const discoverColor = "#3CB9F0";
        const monitorColor = "#4E39C1";
        const protectColor = "#186d33";

        NetworkFactory.hasSystemAppOnly = function (applications) {
          if (
            !applications ||
            applications.length === 0 ||
            applications.length > 3
          )
            return false;
          else {
            if (applications.length === 1)
              return (
                applications.indexOf("DNS") > -1 ||
                applications.indexOf("DHCP") > -1 ||
                applications.indexOf("NTP") > -1
              );
            if (applications.length === 2)
              return (
                (applications.indexOf("DNS") > -1 &&
                  applications.indexOf("DHCP") > -1) ||
                (applications.indexOf("DNS") > -1 &&
                  applications.indexOf("NTP") > -1) ||
                (applications.indexOf("NTP") > -1 &&
                  applications.indexOf("DHCP") > -1)
              );
            if (applications.length === 3)
              return (
                applications.indexOf("DNS") > -1 &&
                applications.indexOf("DHCP") > -1 &&
                applications.indexOf("NTP") > -1
              );
          }
        };

        /**
         * Switch policy mode for service
         * @param mode the mode to switched to
         * @param serviceGroup the service name
         * @param callBack the callback function execute after switch
         */
        NetworkFactory.switchServiceMode = function (
          mode,
          serviceGroup,
          callBack
        ) {
          Alertify.confirm(
            getMessage(
              mode,
              $sanitize(
                serviceGroup === "nodes" ? serviceGroup : serviceGroup.slice(3)
              )
            )
          ).then(
            function onOk() {
              $http
                .patch(SERVICE_URL, {
                  config: {
                    services: [
                      serviceGroup === "nodes"
                        ? serviceGroup
                        : serviceGroup.slice(3),
                    ],
                    policy_mode: mode,
                  },
                })
                .then(function () {
                  Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                  Alertify.success($translate.instant("service.SUBMIT_OK"));
                  if (angular.isFunction(callBack)) {
                    $timeout(function () {
                      callBack();
                    }, 500);
                  }
                })
                .catch(function (err) {
                  console.warn(err);
                  if (USER_TIMEOUT.indexOf(err.status) < 0) {
                    Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                    Alertify.error(
                      $translate.instant("service.SUBMIT_FAILED") +
                        " " +
                        err.data.message
                    );
                  }
                });
            },
            function onCancel() {}
          );
        };

        NetworkFactory.largeNetworkNodeCount = largeNetworkNodeCount;
        NetworkFactory.EXPANDED = EXPANDED;
        NetworkFactory.COLLAPSED = COLLAPSED;
        return NetworkFactory;
      }
    );
})();
