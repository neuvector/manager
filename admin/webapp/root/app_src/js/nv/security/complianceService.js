(function () {
  "use strict";
  angular
    .module("app.assets")
    .factory("ComplianceFactory", function (
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
      let ComplianceFactory = {};

      ComplianceFactory.getBenchItems = function (items, prefixLength) {
        if (items) {
          let roots = items.filter(function (item) {
            return item.test_number && item.test_number.length === prefixLength;
          });

          let i = 0;
          return roots.map(function (x) {
            let children = [];
            x.children = children;
            let lastChild = {};
            lastChild.children = [];

            for (i; i < items.length; i++) {
              if (
                items[i].test_number &&
                items[i].test_number !== x.test_number &&
                items[i].test_number.startsWith(x.test_number)
              ) {
                lastChild = items[i];
                lastChild.children = [];
                children.push(lastChild);
              }
              if (items[i].test_number === "") {
                lastChild.children.push(items[i]);
              }
              if (
                items[i].test_number &&
                items[i].test_number !== x.test_number &&
                items[i].test_number.length === prefixLength
              ) {
                break;
              }
            }
            return x;
          });
        }
      };

      ComplianceFactory.prepareGrids = function (kubeType) {
        let gridOptions = null;

        const level1 = $translate.instant("cis.LEVEL1");
        const scored = $translate.instant("cis.SCORED");

        const getWorkloadChildDetails = function(rowItem) {
          if (rowItem.children && rowItem.children.length > 0) {
            return {
              group: true,
              children: rowItem.children,
              expanded: false
            };
          } else {
            return null;
          }
        };

        const innerCellRenderer = function(params) {
          if (params.data && params.value) {
            let category = params.value;
            if (kubeType) {
              if (kubeType.includes("-")) {
                let kubeCisVersionStrArray = kubeType.split("-");
                category = kubeCisVersionStrArray[0];
              }
            }
            if (params.data.children && params.data.children.length > 1) {
              return `<span class="label label-fs label-info">${$sanitize(
                category
              )}</span>`;
            } else {
              return `<span class="ml-lg label label-fs label-info">${$sanitize(
                category
              )}</span>`;
            }
          } else return null;
        };

        const columnDefs = [
          {
            headerName: $translate.instant("nodes.gridHeader.CATEGORY"),
            field: "category",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: {
              suppressCount: true,
              innerRenderer: innerCellRenderer
            },
            width: 130,
            maxWidth: 130,
            minWidth: 130,
          },
          {
            headerName: $translate.instant("nodes.gridHeader.TEST_NUM"),
            field: "test_number",
            cellRenderer: function (params) {
              if (params.data.remediation) {
                const postfix = `  <em class="fa fa-lg fa-lightbulb-o text-success pr-sm"
                         ng-click="showRemediation($event, data)">
                    </em>${params.value}
                  </span>`;
                if (params.data.disabled) {
                  return `<span class="pr-sm text-muted">${postfix}`;
                } else {
                  return `<span class="pr-sm">${postfix}`;
                }
              } else {
                if (params.data.disabled) {
                  return `<span class="text-muted">${params.value}</span>`;
                } else return params.value;
              }
            },
            width: 50,
            minWidth: 30
          },
          {
            headerName: $translate.instant("nodes.gridHeader.LEVEL"),
            field: "level",
            cellRenderer: function (params) {
              if (params.value) {
                let className = colourMap[params.value];
                if (className)
                  return `<span class="label label-fs label-${className}">${$sanitize(
                    params.value
                  )}</span>`;
                else return null;
              } else return null;
            },
            cellClass: "grid-right-align",
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName:
              $translate.instant("cis.report.gridHeader.SCORED") +
              "<em class='fa fa-info text-primary pl-sm'> </em>",
            field: "scored",
            headerTooltip: scored,
            cellRenderer: function (params) {
              let htmlValue = params.value ? "Y" : "N";
              return `<span >${htmlValue}</span>`;
            },
            getQuickFilterText: function (params) {
              if (params.value) return "scored";
            },
            maxWidth: 90,
            minWidth: 70
          },
          {
            headerName:
              $translate.instant("cis.report.gridHeader.PROFILE") +
              "<em class='fa fa-info text-primary pl-sm'> </em>",
            field: "profile",
            headerTooltip: level1,
            getQuickFilterText: function (params) {
              if (params.value === "Level 1") return "level1";
              else return "level2";
            },
            maxWidth: 100,
            minWidth: 80
          },
          {
            headerName: $translate.instant("nodes.gridHeader.DESCRIPTION"),
            field: "description",
            cellRenderer: (params) => {
              if (params.value && params.data) {
                return `<span ng-class="{'text-muted': ${params.data.children && params.data.children.length > 1}}">${params.value}</span>`;
              }
              return "";
            }
          }//,
          // {
          //   headerName: $translate.instant("registry.gridHeader.REMEDIATION"),
          //   field: "remediation",
          //   width: 150
          // }
        ];
        gridOptions = Utils.createGridOptions(columnDefs);
        // gridOptions.defaultColDef = {
        //   flex: 1,
        //   cellClass: 'cell-wrap-text',
        //   autoHeight: true,
        //   sortable: true,
        //   resizable: true,
        // };
        gridOptions.getNodeChildDetails = getWorkloadChildDetails;
        ComplianceFactory.getGridOptions = function () {
          return gridOptions;
        };
      };

      ComplianceFactory.getCompliance = function (id) {
        return $http
          .get(CONTAINER_COMPLIANCE_URL, { params: { id: id } });
      };

      ComplianceFactory.getNodeCompliance = function (id) {
        return $http
          .get(NODE_COMPLIANCE_URL, { params: { id: id } });
      };

      ComplianceFactory.accept = (benches) => {
        let disables = benches.map((bench) => {
          return { test_number: bench.test_number };
        });

        const payload = {
          name: "default",
          disables: disables,
        };
        ComplianceProfileFactory.saveTemplate(payload);
      };

      ComplianceFactory.remodelCompliance = (compliance) => {
        let hierarchicalData = [];
        let groupedData = Utils.groupBy(compliance, "test_number");
        Object.entries(groupedData).forEach(([k, v]) => {
          let entry = angular.copy(v[0]);
          if (v.length > 1) entry.description = `${v.length} reported entries in the check`;
          entry.children = v.length > 1 ? v : [];
          hierarchicalData.push(entry);
        });
        console.log("hierarchicalData:", hierarchicalData);
        return hierarchicalData;
      };

      return ComplianceFactory;
    });
})();
