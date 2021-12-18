(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("ViolationFactory", function(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      Utils
    ) {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window);

      let violations = [];

      let ViolationFactory = {};

      ViolationFactory.setGrids = function() {
        const violationColumns = [
          {
            headerName: $translate.instant("violation.gridHeader.RULE_ID"),
            field: "policy_id",
            cellRenderer: function(params) {
              let item = params.value;
              if(item >= 10000)
                return `<span class="label ${colourMap["LEARNED"]} label-fs" ng-mouseenter="showRule(${item})" >${item}</span>`;
              else if(item > 0)
                return `<span class="label ${colourMap["CUSTOM"]} label-fs" ng-mouseenter="showRule(${item})" >${item}</span>`;
              else
                return null;
            },
            width: 90,
            minWidth: 90,
            maxWidth: 90
          },
          {
            headerName: $translate.instant("violation.gridHeader.CLIENT"),
            field: "client_name",
            cellRenderer: function(params) {
              let client = "";
              let displayName =
                Utils.getEndPointType(params.value) +
                Utils.getDisplayName(params.value);
              if (params.value !== params.data.client_ip)
                displayName =
                  Utils.getEndPointType(params.value) +
                  Utils.getDisplayName(params.value) +
                  "(" +
                  params.data.client_ip +
                  ")";
              /** @namespace params.data.client_id */
              if (params.data.client_id === "external") {
                client = `<a href="https://www.whois.com/whois/${params.data.client_ip}" target="_blank">${displayName}</a>`;
              } else {
                client = displayName;
              }
              return params.data.client_domain ? `${params.data.client_domain}: ${client}` : client;
            },
            width: 230
          },
          { headerName: "Client IP", field: "client_ip", hide: true },
          {
            headerName: $translate.instant("violation.gridHeader.SERVER"),
            field: "server_name",
            cellRenderer: function(params) {
              let server = "";
              let displayName =
                Utils.getEndPointType(params.value) +
                Utils.getDisplayName(params.value);
              if (params.value !== params.data.server_ip)
                displayName =
                  Utils.getEndPointType(params.value) +
                  Utils.getDisplayName(params.value) +
                  "(" +
                  params.data.server_ip +
                  ")";
              /** @namespace params.data.server_id */
              if (params.data.server_id === "external") {
                server = `<a href="https://www.whois.com/whois/${params.data.server_ip}" target="_blank">${displayName}</a>`;
              } else {
                server = displayName;
              }
              return params.data.server_domain ? `${params.data.server_domain}: ${server}` : server;
            },
            width: 230
          },
          { headerName: "Server IP", field: "server_ip", hide: true },
          {
            headerName: $translate.instant("violation.gridHeader.SERVER_PORT"),
            valueGetter: portGetter,
            width: 100
          },
          {
            headerName: $translate.instant("violation.gridHeader.APPLICATIONS"),
            template: '<span>{{data.applications.join(", ")}}</span>',
            getQuickFilterText: function(params) {
              return params.data.applications.join(", ");
            },
            width: 100
          },
          {
            headerName: $translate.instant("violation.gridHeader.POLICY_ACTION"),
            field: "policy_action",
            cellRenderer: function(params) {
              if (params.value) {
                let mode = Utils.getI18Name(params.value);
                let labelCode = colourMap[params.value];
                if(!labelCode)
                  labelCode = "info";
                return `<span class="label label-fs label-${labelCode}">${mode}</span>`;
              } else return null;
            },
            getQuickFilterText: function(params) {
              return Utils.getI18Name(params.value);
            },
            width: 80,
            maxWidth: 90
          },
          {
            headerName: $translate.instant("violation.gridHeader.TIME"),
            field: "reported_at",
            cellRenderer: function(params) {
              return $filter("date")(params.value, "MMM dd, y HH:mm:ss");
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

        function dateComparator(value1, value2, node1, node2) {
          return node1.data.reported_timestamp - node2.data.reported_timestamp;
        }

        function portGetter(params) {
          /** @namespace params.data.ip_proto */
          let protocol = params.data.ip_proto;
          if (protocol === 1) return "icmp/" + params.data.server_port;
          else if (protocol === 6) return "tcp/" + params.data.server_port;
          else if (protocol === 17) return "udp/" + params.data.server_port;
          else return params.data.server_port;
        }

        ViolationFactory.violationGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          enableColResize: true,
          animateRows: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: violationColumns,
          rowData: null,
          rowSelection: "single",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
          },
          onGridReady: function(params) {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 2000);
            $win.on(resizeEvent, function() {
              $timeout(function() {
                params.api.sizeColumnsToFit();
              }, 1000);
            });
          },
          overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
        };

        ViolationFactory.getViolations = function () {
          return $http
            .get(VIOLATION_URL);
        };
      }

      return ViolationFactory;
    });
})();
