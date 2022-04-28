(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("ComplianceAssetFactory", function(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      $q,
      Utils,
      CveFactory,
      $sanitize
    ) {
      let ComplianceAssetFactory = {};

      CveFactory.prepareGrids();

      ComplianceAssetFactory.getDomains = () => $http.get(DOMAIN_URL);

      ComplianceAssetFactory.prepareGrids = () => {

        const level1 = $translate.instant("cis.LEVEL1");
        const scored = $translate.instant("cis.SCORED");

        const columns = [
          {
            headerName: $translate.instant("nodes.gridHeader.CATEGORY"),
            field: "catalog",
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
            field: "name",
            width: 80,
            minWidth: 60
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
            maxWidth: 100,
            minWidth: 80
          },
          {
            headerName: $translate.instant("scan.gridHeader.VICTIM"),
            cellRenderer: CveFactory.impactRenderer,
            comparator: CveFactory.impactComparator,
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            }
          },
          {
            headerName:
              '<em class="fa fa-shield fa-lg text-primary" style="margin-left: 13px"></em>',
            cellRenderer: CveFactory.shieldRenderer,
            comparator: CveFactory.shieldComparator,
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            maxWidth: 65,
            minWidth: 65
          },
          {
            headerName: "",
            cellRenderer: (params) => {
              return `<em class="fa fa-download text-muted" ng-click="exportCsv(data)"></em>`
            },
            maxWidth: 30,
            minWidth: 30
          },
        ];
        ComplianceAssetFactory.getGridOptions = () => {
          return Utils.createGridOptions(columns);
        };
      };


      ComplianceAssetFactory.getReport = name => $http
        .get(RISK_COMPLIANCE_URL, {params: {id: name}})
        .then(function (response) {
          if (response.data.compliances) {
            const complianceList = Utils.mapAssetsBrief(response.data, "compliances");

            let countDis = {
              error: 0,
              high: 0,
              warning: 0,
              note: 0,
              pass: 0,
              info: 0,
              platform: 0,
              image: 0,
              node: 0,
              container: 0
            };

            complianceList.forEach(compliance => {
              if (compliance.level === "WARN") countDis.warning += 1;
              if (compliance.level === "INFO") countDis.info += 1;
              if (compliance.level === "PASS") countDis.pass += 1;
              if (compliance.level === "NOTE") countDis.note += 1;
              if (compliance.level === "ERROR") countDis.error += 1;
              if (compliance.level === "HIGH") countDis.high += 1;
              if (compliance.platforms.length) countDis.platform += 1;
              if (compliance.images.length) countDis.image += 1;
              if (compliance.nodes.length) countDis.node += 1;
              if (compliance.workloads.length) countDis.container += 1;
            });

            const topWorkloadCompliance = complianceList
              .sort((a, b) => CveFactory.compareWorkloadImpact(a, b) * -1)
              .slice(0, 5);
            const topCompliance = complianceList
              .sort((a, b) => CveFactory.compareImpact(a, b) * -1)
              .slice(0, 5);
            return {
              complianceList: complianceList,
              counts: countDis,
              topWorkloadCompliance: topWorkloadCompliance,
              topCompliance: topCompliance
            };
          } else {
            return {
              complianceList: [],
              counts: {
                warning: 0,
                info: 0,
                platform: 0,
                image: 0,
                node: 0,
                container: 0
              },
              topWorkloadCompliance: [],
              topCompliance: []
            };
          }
        })
        .catch(function (err) {
          console.error(err);
        });

      return ComplianceAssetFactory;
    });
})();
