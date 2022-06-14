(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("NodeFactory", function(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      $sanitize,
      Utils
    ) {
      let NodeFactory = {};

      NodeFactory.prepareGrids = function() {
        function dateComparator(value1, value2, node1, node2) {
          if (
            !node1.data.scan_summary.scanned_at &&
            !node2.data.scan_summary.scanned_at
          )
            return 0;
          else if (!node1.data.scan_summary.scanned_at) return 100;
          else if (!node2.data.scan_summary.scanned_at) return -100;
          else
            return (
              node1.data.scan_summary.scanned_timestamp -
              node2.data.scan_summary.scanned_timestamp
            );
        }

        const columnDefs = [
          {
            headerName: $translate.instant("nodes.detail.NAME"),
            field: "name",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("containers.detail.STATE"),
            field: "state",
            cellRenderer: function(params) {
              if (params.value)
                return '<span><em class="fa fa-circle text-warning"></em> </span>';
              else
                return '<span><em class="fa fa-circle text-success"></em> </span>';
            },
            cellClass: "grid-center-align",
            headerClass: "grid-center-header",
            width: 80,
            maxWidth: 80,
            minWidth: 60
          },
          {
            headerName: $translate.instant("nodes.detail.OS"),
            field: "os",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("nodes.detail.PLATFORM"),
            field: "platform",
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("nodes.detail.NUM_OF_CONTAINERS"),
            field: "pods",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("scan.gridHeader.STATUS"),
            field: "scan_summary.status",
            cellRenderer: function(params) {
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else {
                if (
                  params.data.scan_summary.result &&
                  params.data.scan_summary.result !== "succeeded"
                ) {
                  let html = $sanitize(
                    `<div>${params.data.scan_summary.result}</div>`
                  );
                  return `<span class="label label-fs label-${labelCode}" uib-tooltip-html="'${html}'" tooltip-class="customClass">${Utils.getI18Name(
                    $sanitize(params.value
                  ))}</span>`;
                } else {
                  return `<span class="label label-fs label-${labelCode}">${Utils.getI18Name(
                    $sanitize(params.value
                  ))}</span>`;
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
            headerName: $translate.instant("scan.gridHeader.HIGH"),
            field: "scan_summary.high",
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
            field: "scan_summary.medium",
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 80,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.TIME"),
            field: "scan_summary.scanned_at",
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
        NodeFactory.getGridOptions = function() {
          return Utils.createGridOptions(columnDefs);
        };
      };


      NodeFactory.getHost = id => {
        return $http
          .get(NODES_URL, { params: { id: id } })
          .then(function(response) {
            return response.data.host;
          }).catch(function (error) {
            console.warn(error);
            return {};
          });
      };

      NodeFactory.getHostMap = () => {
        return $http
          .get(NODES_URL)
          .then(function(response) {
            const hostMap4Pdf = {};
            response.data.hosts.forEach((host) => {
              hostMap4Pdf[host.id] = {
                id: host.id,
                name: host.name,
                containers: host.containers,
                cpus: host.cpus,
                memory: host.memory,
                os: host.os || "",
                kernel: host.kernel || "",
                policy_mode: host.policy_mode || "",
                scanned_at: host.scan_summary ? $filter("date")(host.scan_summary.scanned_at, "MMM dd, y HH:mm:ss") : "",
                high: 0,
                medium: 0,
                evaluation: 0, //0: compliant, 1: risky
                complianceCnt: 0,
                vulnerabilites: [],
                complianceList: []
              };
            });
            return hostMap4Pdf;
          }).catch(function (error) {
            console.warn(error);
            return {};
          });
      };

      return NodeFactory;
    });
})();
