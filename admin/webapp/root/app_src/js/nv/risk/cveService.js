(function () {
  "use strict";
  angular
    .module("app.assets")
    .factory(
      "CveFactory",
      function (
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
        let CveFactory = {};

        CveFactory.prepareGrids = () => {
          const compareScore = (node1, score1, node2, score2) => {
            if (node1.data.severity === "High") score1 = score1 + 10;
            if (node2.data.severity === "High") score2 = score2 + 10;
            return score1 - score2;
          };

          const scoreComparator = (value1, value2, node1, node2) => {
            /** @namespace node1.data.score */
            let score1 = node1.data.score;
            let score2 = node2.data.score;
            return compareScore(node1, score1, node2, score2);
          };

          const scoreV3Comparator = (value1, value2, node1, node2) => {
            /** @namespace node1.data.score_v3 */
            let score1 = node1.data.score_v3;
            let score2 = node2.data.score_v3;
            return compareScore(node1, score1, node2, score2);
          };

          CveFactory.compareImpact = (cve1, cve2) => {
            if (cve1.platforms.length === cve2.platforms.length) {
              if (cve1.images.length === cve2.images.length) {
                if (cve1.nodes.length === cve2.nodes.length) {
                  return cve1.workloads.length - cve2.workloads.length;
                } else return cve1.nodes.length - cve2.nodes.length;
              } else return cve1.images.length - cve2.images.length;
            } else {
              return cve1.platforms.length - cve2.platforms.length;
            }
          };

          CveFactory.compareWorkloadImpact = (cve1, cve2) =>
            cve1.workloads.length - cve2.workloads.length;

          CveFactory.impactComparator = (value1, value2, node1, node2) =>
            CveFactory.compareImpact(node1.data, node2.data);

          CveFactory.impactRenderer = (params) => {
            let victims = "";
            if (params.data.platforms.length) {
              victims += `<em class="fa fa-building-o text-discover mh-sm"></em>${params.data.platforms.length}`;
            }
            if (params.data.images.length) {
              victims += `<em class="fa fa-archive text-discover mh-sm"></em>${params.data.images.length}`;
            }
            if (params.data.nodes.length) {
              victims += `<em class="fa fa-server text-discover mh-sm"></em>${params.data.nodes.length}`;
            }
            if (params.data.workloads.length) {
              victims += `<em class="fa fa-square-o text-discover mh-sm"></em>${params.data.workloads.length}`;
            }
            return victims;
          };

          const getDistribution = (entities, dis) => {
            if (entities.length) {
              entities.forEach((entity) => {
                if (entity.policy_mode === "") dis.empty += 1;
                if (entity.policy_mode === "Discover") dis.discover += 1;
                if (
                  entity.policy_mode === "Monitor" ||
                  entity.policy_mode === "Protect"
                )
                  dis.protect += 1;
              });
            }
          };

          const getDistributionAndRate = (node) => {
            let dis = { empty: 0, discover: 0, protect: 0 };
            getDistribution(node.data.images, dis);
            getDistribution(node.data.nodes, dis);
            getDistribution(node.data.workloads, dis);
            const rate =
              dis.discover / (dis.discover + dis.empty + dis.protect);
            return { dis, rate };
          };

          CveFactory.shieldComparator = (value1, value2, node1, node2) => {
            const dr1 = getDistributionAndRate(node1);
            const dr2 = getDistributionAndRate(node2);
            if (dr1.rate === dr2.rate) {
              return dr1.dis.protect - dr2.dis.protect;
            } else return dr1.rate - dr2.rate;
          };

          CveFactory.shieldRenderer = (params) => {
            let dis = { empty: 0, discover: 0, protect: 0 };
            getDistribution(params.data.images, dis);
            getDistribution(params.data.nodes, dis);
            getDistribution(params.data.workloads, dis);
            return `<div class="mt-sm ml">
                        <span
                          data-peity='{
                            "fill": ["#263238", "#D9534F", "#4CAF50"],
                            "innerRadius": 4, "radius": 11}'
                            class="pie mt-sm">${dis.empty},${dis.discover},${dis.protect}</span></div>`;
          };

          CveFactory.publishedTimeRenderer = (params) => {
            if (params.value > 0) {
              return $sanitize(
                $filter("date")(params.value * 1000, "MMM dd, y")
              );
            }
          };

          const cveColumns = [
            {
              headerName: $translate.instant("scan.gridHeader.CVE_NAME"),
              field: "name",
              cellRenderer: function (params) {
                let isAcceptedVuls = params && params.data && params.data.tags && params.data.tags.some(tag => tag === "accepted");
                return `<span class="pr-sm">
                          <em class='fa fa-lg fa-info-circle pr-sm' ng-click="showDetails($event, data)" ng-class="{'text-action': !isAcceptedVuls, 'text-muted': isAcceptedVuls}">
                          </em>${params.value}
                        </span>`;
              },
              maxWidth: 160,
              minWidth: 100,
            },
            {
              headerName: $translate.instant("scan.gridHeader.SEVERITY"),
              field: "severity",
              cellRenderer: function (params) {
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
              minWidth: 90,
            },
            {
              headerName: $translate.instant("scan.gridHeader.SCORE_V3"),
              field: "score_v3",
              cellRenderer: function (params) {
                if (params.data.score_v3) {
                  let labelCode = colourMap[params.data.severity];
                  let isAcceptedVuls = params && params.data && params.data.tags && params.data.tags.some(tag => tag === "accepted");
                  const barClass = isAcceptedVuls ? "progress-bar-disabled" : `progress-bar-${labelCode}`;
                  const v3Percentage = params.data.score_v3 * 10 + "%";
                  return `<div class="progress mb0" style="width: 100px; background-color: #e0d8d8">
                             <div class="progress-bar ${barClass}" role="progressbar"
                                  style="width:${v3Percentage}">${params.value}
                             </div>
                           </div>`;
                } else {
                  return "";
                }
              },
              icons: {
                sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
                sortDescending: '<em class="fa fa-sort-amount-desc"></em>',
              },
              comparator: scoreV3Comparator,
              width: 120,
              maxWidth: 120,
              minWidth: 110,
            },
            {
              headerName: $translate.instant("scan.gridHeader.SCORE_V2"),
              field: "score",
              hide: true,
              cellRenderer: function (params) {
                if (params.data.score) {
                  let labelCode = colourMap[params.data.severity];
                  const barClass = `progress-bar-${labelCode}`;
                  const v2Percentage = params.data.score * 10 + "%";
                  return `<div class="progress mb0" style="width: 100px; background-color: #e0d8d8">
                             <div class="progress-bar ${barClass}" role="progressbar"
                                  style="width:${v2Percentage}">${params.value}
                             </div>
                           </div>`;
                } else {
                  return "";
                }
              },
              icons: {
                sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
                sortDescending: '<em class="fa fa-sort-amount-desc"></em>',
              },
              comparator: scoreComparator,
              width: 120,
              maxWidth: 120,
              minWidth: 110,
            },
            {
              headerName: $translate.instant("scan.gridHeader.PACKAGE_NAME"),
              field: "domains",
              getQuickFilterText: (params) => params.value.join(", "),
              hide: true,
            },
            {
              headerName: $translate.instant("scan.gridHeader.PACKAGE_NAME"),
              field: "services",
              getQuickFilterText: (params) => params.value.join(", "),
              hide: true,
            },
            {
              headerName: $translate.instant("scan.gridHeader.PUBLISHED_TIME"),
              field: "published_timestamp",
              cellRenderer: CveFactory.publishedTimeRenderer,
              maxWidth: 150,
              minWidth: 110,
            },
            {
              headerName: $translate.instant("scan.gridHeader.VICTIM"),
              cellRenderer: CveFactory.impactRenderer,
              comparator: CveFactory.impactComparator,
              icons: {
                sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
                sortDescending: '<em class="fa fa-sort-amount-desc"></em>',
              },
              width: 110,
              maxWidth: 130,
              minWidth: 110,
            },
            {
              headerName:
                '<em class="fa fa-shield fa-lg text-primary" style="margin-left: 13px"></em>',
              cellRenderer: CveFactory.shieldRenderer,
              comparator: CveFactory.shieldComparator,
              icons: {
                sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
                sortDescending: '<em class="fa fa-sort-amount-desc"></em>',
              },
              maxWidth: 50,
              minWidth: 50,
            },
            {
              headerName: "",
              cellRenderer: (params) => {
                return `<em class="fa fa-download text-muted" ng-click="exportCsv(data)"></em>`
              },
              maxWidth: 30,
              minWidth: 30
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
              sort: "asc",
              hide: true,
              maxWidth: 30,
              minWidth: 30
            }
          ];

          CveFactory.getGridOptions = () => {
            let options = Utils.createGridOptions(cveColumns);
            options.rowClassRules = {
              "disabled-row": function(params) {
                if (!params.data || !params.data.tags) return;
                return params.data.tags.some(tag => tag.toLowerCase() === "accepted");
              }
            };
            return options;
          };
        };

        CveFactory.getDomains = () => $http.get(DOMAIN_URL);

        CveFactory.getCveReport = (isShowingAccepted) =>
          $http
            .get(RISK_CVE_URL, { params: { show: isShowingAccepted ? "accepted" : null } })
            .then(function (response) {
              if (response.data.vulnerabilities) {
                const vulnerabilities = Utils.mapAssetsBrief(response.data, "vulnerabilities");
                let _imageMap = new Map();
                let _hostMap = new Map();
                let countDistribution = {
                  high: 0,
                  medium: 0,
                  platform: 0,
                  image: 0,
                  node: 0,
                  container: 0,
                };
                vulnerabilities.forEach((cve) => {
                  if (cve.nodes.length > 0) {
                    cve.nodes.forEach((host) => {
                      let exist = _hostMap.get(host.display_name);
                      if (!exist)
                        _hostMap.set(host.display_name, {
                          high: cve.severity === "High" ? 1 : 0,
                          medium: cve.severity === "Medium" ? 1 : 0,
                        });
                      else {
                        if (cve.severity === "High") {
                          exist.high += 1;
                          _hostMap.set(host.display_name, exist);
                        } else {
                          exist.medium += 1;
                          _hostMap.set(host.display_name, exist);
                        }
                      }
                    });
                  }
                  if (cve.images.length > 0) {
                    cve.images.forEach((image) => {
                      let exist = _imageMap.get(image.display_name);
                      if (!exist)
                        _imageMap.set(image.display_name, {
                          high: cve.severity === "High" ? 1 : 0,
                          medium: cve.severity === "Medium" ? 1 : 0,
                        });
                      else {
                        if (cve.severity === "High") {
                          exist.high += 1;
                          _imageMap.set(image.display_name, exist);
                        } else {
                          exist.medium += 1;
                          _imageMap.set(image.display_name, exist);
                        }
                      }
                    });
                    countDistribution.image += 1;
                  }
                  if (cve.severity === "High") countDistribution.high += 1;
                  if (cve.severity === "Medium") countDistribution.medium += 1;
                  if (cve.platforms.length) countDistribution.platform += 1;
                  if (cve.nodes.length) countDistribution.node += 1;
                  if (cve.workloads.length) countDistribution.container += 1;
                });
                const topNodes = [..._hostMap]
                  .sort((a, b) => {
                    if (a[1].high === b[1].high) {
                      return b[1].medium - a[1].medium;
                    } else return b[1].high - a[1].high;
                  })
                  .slice(0, 5);
                const topImages = [..._imageMap]
                  .sort((a, b) => {
                    if (a[1].high === b[1].high) {
                      return b[1].medium - a[1].medium;
                    } else return b[1].high - a[1].high;
                  })
                  .slice(0, 5);
                const topCve = vulnerabilities
                  .sort((a, b) => CveFactory.compareImpact(a, b) * -1)
                  .slice(0, 5);
                return {
                  cve: vulnerabilities,
                  counts: countDistribution,
                  topImages: topImages,
                  topNodes: topNodes,
                  topCve: topCve,
                };
              } else
                return {
                  cve: [],
                  counts: {
                    high: 0,
                    medium: 0,
                    platform: 0,
                    image: 0,
                    node: 0,
                    container: 0,
                  },
                  topImages: [],
                  topCve: [],
                };
            })
            .catch(function (err) {
              throw err;
            });

        return CveFactory;
      }
    );
})();
