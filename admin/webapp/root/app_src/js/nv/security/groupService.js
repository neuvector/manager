(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("GroupFactory", function(
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

      let GroupFactory = {};

      GroupFactory.setGrid = function() {

        let columnDefs4Members = [
          {
            headerName: $translate.instant("group.gridHeader.NAME"),
            field: "display_name",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: { innerRenderer: innerCellRenderer }
          },
          {
            headerName: "id",
            field: "id",
            cellRenderer: params => {
              if (params.value)
                return `<span uib-tooltip="'${params.value}'">${Utils.shortenString(params.value, 20)}</span>`
            },
            width: 200
          },
          {
            headerName: $translate.instant("group.gridHeader.DOMAIN"),
            field: "domain"
          },
          {
            headerName: $translate.instant("containers.detail.STATE"),
            field: "state",
            cellRenderer: function(params) {
              let displayState = getDisplayName(params.value);
              if (params.value === "disconnected")
                return `<span class="label label-warning">${$sanitize(
                  displayState
                )}</span>`;
              else if (
                params.value === "discover" ||
                params.value === "protect" ||
                params.value === "monitor"
              )
                return `<span class="label ${params.value}">${$sanitize(
                  displayState
                )}</span>`;
              else if (params.value === "unmanaged")
                return `<span class="label label-danger">${$sanitize(
                  displayState
                )}</span>`;
              else if (params.value === "quarantined")
                return `<span class="label label-pink">${$sanitize(
                  displayState
                )}</span>`;
              else
                return `<span class="label label-inverse">${$sanitize(
                  displayState
                )}</span>`;
            },
            width: 70
          },
          {
            headerName: $translate.instant("group.gridHeader.VULNERABILITIES"),
            field: "scan_summary",
            cellRenderer: function(params) {
              let display = "";
              if (params.value && params.value.high)
                display += `<span class="label label-danger mr-sm">${
                  params.value.high
                }</span>`;
              if (params.value && params.value.medium)
                display += `<span class="label label-warning">${
                  params.value.medium
                }</span>`;
              return $sanitize(display);
            },
            width: 120,
            maxWidth: 130
          }
        ];

        let columnDefs4NodesMembers = [
          {
            headerName: $translate.instant("group.gridHeader.NAME"),
            field: "display_name",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: { innerRenderer: innerCellRenderer }
          },
          {
            headerName: "Id",
            field: "id",
            cellRenderer: params => {
              if (params.value)
                return `<span uib-tooltip="'${params.value}'">${Utils.shortenString(params.value, 20)}</span>`
            },
            width: 200
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
            width: 70,
            maxWidth: 80
          },
          {
            headerName: $translate.instant("group.gridHeader.VULNERABILITIES"),
            field: "scan_summary",
            cellRenderer: function(params) {
              let display = "";
              if (params.value && params.value.high)
                display += `<span class="label label-danger mr-sm">${
                  params.value.high
                }</span>`;
              if (params.value && params.value.medium)
                display += `<span class="label label-warning">${
                  params.value.medium
                }</span>`;
              return $sanitize(display);
            },
            width: 120,
            maxWidth: 130
          }
        ];

        function getDisplayName(name) {
          return $translate.instant("enum." + name.toUpperCase());
        }

        function dateComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.last_modified_timestamp */
          return (
            node1.data.last_modified_timestamp -
            node2.data.last_modified_timestamp
          );
        }

        function innerCellRenderer(params) {
          if (params.data.display_name) {
            return $sanitize(params.data.display_name);
          } else {
            return $sanitize(params.data.name);
          }
        }

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

        GroupFactory.memberGridOptions = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: columnDefs4Members,
          rowData: null,
          getNodeChildDetails: getWorkloadChildDetails,
          animateRows: true,
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
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "group.NO_MEMBERS"
          )}</span>`
        };

        let ruleColumnDefs = [
          {
            headerName: $translate.instant("policy.addPolicy.POLICY_ID"),
            field: "id",
            width: 70,
            maxWidth: 80,
            cellRenderer: function(params) {
              if (params.data) {
                return (
                  '<div ng-class="{\'policy-remove\': data.remove}" uib-tooltip="' +
                  $sanitize(params.data.comment) +
                  '">' +
                  $sanitize(params.value) +
                  "</div>"
                );
              }
            }
          },
          {
            headerName: $translate.instant("policy.addPolicy.FROM"),
            field: "from"
          },
          {
            headerName: $translate.instant("policy.addPolicy.TO"),
            field: "to"
          },
          {
            headerName: $translate.instant("policy.addPolicy.APP"),
            field: "applications"
          },
          {
            headerName: $translate.instant("policy.addPolicy.PORT"),
            field: "ports"
          },
          {
            headerName: $translate.instant("policy.addPolicy.DENY_ALLOW"),
            field: "action",
            cellRenderer: function(params) {
              if (params.value) {
                let mode = Utils.getI18Name(params.value);
                let labelCode = colourMap[params.value];
                if (!labelCode) labelCode = "info";
                return `<span class="label label-fs label-${labelCode}">${$sanitize(
                  mode
                )}</span>`;
              } else return null;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("policy.gridHeader.TYPE"),
            field: "cfg_type",
            cellRenderer: typeRenderFunc,
            cellClass: "grid-center-align",
            width: 90,
            minWidth: 90,
            maxWidth: 90
          },
          {
            headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
            field: "last_modified_timestamp",
            cellRenderer: function(params) {
              if (params.value) {
                return $sanitize(
                  $filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss")
                );
              }
            },
            comparator: dateComparator,
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
            },
            width: 160,
            maxWidth: 180,
            minWidth: 160
          }
        ];

        function typeRenderFunc(params) {
          if (params && params.value) {
            let type = params.data.disable
              ? colourMap["disabled-rule"]
              : colourMap[params.value.toUpperCase()];
            return `<div class="action-label nv-label ${type}">${$sanitize(
              $translate.instant(`group.${params.value.toUpperCase()}`)
            )}</div>`;
          }
        }

        GroupFactory.gridRules = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: false,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: ruleColumnDefs,
          rowData: null,
          animateRows: true,
          rowSelection: "single",
          onGridReady: function(params) {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
            $win.on(resizeEvent, function() {
              setTimeout(function() {
                params.api.sizeColumnsToFit();
              }, 0);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`
        };

        let responseRuleColumnDefs = [
          {
            headerName: $translate.instant("responsePolicy.gridHeader.ID"),
            field: "id",
            width: 60,
            minWidth: 60,
            maxWidth: 60
          },
          {
            headerName: $translate.instant("responsePolicy.gridHeader.TYPE"),
            field: "event",
            cellRenderer: eventRenderFunc,
            width: 105,
            minWidth: 105,
            maxWidth: 105
          },
          {
            headerName: $translate.instant("responsePolicy.gridHeader.GROUP"),
            field: "group",
            cellRenderer: function(params) {
              if (params.value) {
                return `<div style="word-wrap: break-word;">${$sanitize(
                  params.value
                )}</div>`;
              }
            },
            cellClass: ["wrap-word-in-cell"],
            width: 200
          },
          {
            headerName: $translate.instant("responsePolicy.gridHeader.CRITERIA"),
            field: "conditions",
            cellRenderer: function(params) {
              if (params.value) {
                return `<div style="word-wrap: break-word;">${$sanitize(
                  params.value
                )}</div>`;
              }
            },
            cellClass: ["wrap-word-in-cell"],
            width: 430
          },
          {
            headerName: $translate.instant("policy.gridHeader.TYPE"),
            field: "cfg_type",
            cellRenderer: typeRenderFunc,
            cellClass: "grid-center-align",
            width: 90,
            minWidth: 90,
            maxWidth: 90
          },
          {
            headerName: $translate.instant("responsePolicy.gridHeader.ACTION"),
            field: "actions",
            cellRenderer: actionRenderFunc,
            width: 220,
            minWidth: 220
          }
        ];

        function eventRenderFunc(params) {
          return (
            '<div class="type-label type-label-lg ' +
            (params.data.disable
              ? colourMap["disabled_background"]
              : colourMap[params.data.event.toLowerCase()]) +
            '">' +
            $sanitize(
              $translate.instant(
                "responsePolicy.categories." + params.data.event.toUpperCase()
              )
            ) +
            "</div>"
          );
        }

        function actionRenderFunc(params) {
          let actions = "";
          params.data.actions.forEach(action => {
            actions +=
              '<div style="display: table; margin: 2px 2px; float: left"><div class="resp-rule-action-label ' +
              (params.data.disable
                ? colourMap["disabled_color"]
                : colourMap[action.toLowerCase()]) +
              '">' +
              $sanitize(
                $translate.instant(
                  "responsePolicy.actions." + action.toUpperCase()
                )
              ) +
              "</div></div>";
          });
          return actions;
        }

        GroupFactory.gridResponseRules = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: false,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: responseRuleColumnDefs,
          rowData: null,
          animateRows: true,
          rowSelection: "single",
          onGridReady: function(params) {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
            $win.on(resizeEvent, function() {
              setTimeout(function() {
                params.api.sizeColumnsToFit();
              }, 0);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`
        };

      };
      return GroupFactory;
    });
})();
