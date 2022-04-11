(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("ContainerFactory", function(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      $sanitize,
      Utils
    ) {
      let ContainerFactory = {};

      ContainerFactory.prepareGrids = function() {
        let _gridOptions = null;
        let _processGridOptions = null;

        function getIps(interfaces) {
          let ips = "";
          for (let key in interfaces) {
            if (interfaces.hasOwnProperty(key)) {
              ips += interfaces[key].reduce(function(result, ip) {
                return result + ip.ip + ",";
              }, "");
            }
          }
          return ips;
        }

        function innerCellRenderer(params) {
          return $sanitize(params.data.brief.display_name);
        }

        function dateComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.started_at */
          return (
            node1.data.security.scan_summary.scanned_timestamp -
            node2.data.security.scan_summary.scanned_timestamp
          );
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

        const containerColumns = [
          {
            headerName: $translate.instant("containers.detail.NAME"),
            field: "brief.display_name",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: { innerRenderer: innerCellRenderer }
          },
          {
            headerName: $translate.instant("containers.detail.NAME"),
            field: "brief.name",
            hide: true
          },
          {
            headerName: "Id",
            field: "brief.id",
            hide: true
          },
          {
            headerName: $translate.instant("group.gridHeader.DOMAIN"),
            field: "brief.domain"
          },
          {
            headerName: $translate.instant("containers.detail.HOST_NAME"),
            field: "brief.host_name"
          },
          {
            headerName: $translate.instant(
              "containers.detail.NETWORK_INTERFACES"
            ),
            valueGetter: function(params) {
              /** @namespace params.data.attributes.interfaces */
              return getIps(params.data.attributes.interfaces);
            },
            hide: true
          },
          {
            headerName: $translate.instant("containers.detail.APPLICATIONS"),
            field: "attributes.applications"
          },
          {
            headerName: $translate.instant("containers.detail.STATE"),
            field: "brief.state",
            cellRenderer: function(params) {
              let displayState = Utils.getI18Name(params.value);

              let labelCode = colourMap[params.value];
              if (!labelCode) labelCode = "inverse";
              return `<span class="label label-fs label-${labelCode}">${$sanitize(
                displayState
              )}</span>`;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("scan.gridHeader.STATUS"),
            field: "security.scan_summary.status",
            cellRenderer: function(params) {
              let labelCode = colourMap[params.value];
              if (!labelCode) return null;
              else {
                if (
                  params.data.security.scan_summary.result &&
                  params.data.security.scan_summary.result !== "succeeded"
                ) {
                  let html = $sanitize(
                    `<div>${params.data.scan_summary.result}</div>`
                  );
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
            headerName: $translate.instant("scan.gridHeader.HIGH"),
            field: "security.scan_summary.high",
            cellRenderer: function(params) {
              if (
                params.data.children &&
                params.data.children.length > 0 &&
                (params.data.security.scan_summary.hidden_high ||
                  params.data.security.scan_summary.hidden_high === 0)
              ) {
                return $sanitize(
                  `${params.value} (${params.data.security.scan_summary.hidden_high})`
                );
              } else {
                return $sanitize(params.value);
              }
            },
            sort: "desc",
            comparator: highComparator,
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
            field: "security.scan_summary.medium",
            cellRenderer: function(params) {
              if (
                params.data.children &&
                params.data.children.length > 0 &&
                (params.data.security.scan_summary.hidden_medium ||
                  params.data.security.scan_summary.hidden_medium === 0)
              ) {
                return $sanitize(
                  `${params.value} (${params.data.security.scan_summary.hidden_medium})`
                );
              } else {
                return $sanitize(params.value);
              }
            },
            comparator: mediumComparator,
            icons: {
              sortAscending: '<em class="fa fa-sort-amount-asc"></em>',
              sortDescending: '<em class="fa fa-sort-amount-desc"></em>'
            },
            width: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("scan.gridHeader.TIME"),
            field: "security.scan_summary.scanned_at",
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

        function highComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.security.scan_summary.hidden_high */
          return (
            node1.data.security.scan_summary.hidden_high -
            node2.data.security.scan_summary.hidden_high
          );
        }

        function mediumComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.security.scan_summary.hidden_medium */
          return (
            node1.data.security.scan_summary.hidden_medium -
            node2.data.security.scan_summary.hidden_medium
          );
        }

        ContainerFactory.getGridOptions = function() {
          const gridOptions = Utils.createGridOptions(containerColumns);
          gridOptions.getNodeChildDetails = getWorkloadChildDetails
          return gridOptions;
        };

      };

      ContainerFactory.prepareProcessGrids = function() {
        const procColumns = [
          {
            headerName: $translate.instant("containers.process.PID"),
            field: "pid",
            cellRenderer: "agGroupCellRenderer",
            cellRendererParams: {
              suppressCount: true
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
            }
          },
          {
            headerName: $translate.instant("containers.process.COMMAND"),
            field: "cmdline"
          },
          {
            headerName: $translate.instant("containers.process.USER"),
            field: "user",
            cellRenderer: function(params) {
              if (params.value === "root")
                return `<em class="fa fa-exclamation text-danger mr-sm"></em>${$sanitize(
                  params.value
                )}`;
              else return $sanitize(params.value);
            },
            width: 80
          },
          {
            headerName: $translate.instant("containers.process.STATUS"),
            field: "status"
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
            headerName: $translate.instant("containers.detail.STARTED_AT"),
            field: "start_timestamp",
            cellRenderer: function(params) {
              if (params.value) {
                const date = new Date(params.value * 1000);
                return $sanitize($filter("date")(date, "MMM dd, y HH:mm:ss"));
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"></em>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"></em>'
            },
            minWidth: 160,
            maxWidth: 170
          }
        ];

        function getNodeChildDetails(rowItem) {
          if (rowItem.children && rowItem.children.length > 0) {
            /** @namespace rowItem.pid */
            return {
              group: true,
              children: rowItem.children,
              expanded: rowItem.children.length > 0,
              field: "pid",
              key: rowItem.pid
            };
          } else {
            return null;
          }
        }

        ContainerFactory.getProcessGridOptions = () => {
          const gridOptions = Utils.createGridOptions(procColumns);
          gridOptions.getNodeChildDetails = getNodeChildDetails;
          return gridOptions;
        };
      };

      ContainerFactory.buildTree = function(treeData, key, parentKey) {
        let keys = [];
        treeData.map(function(x) {
          x.children = [];
          keys.push(x[key]);
        });
        let roots = treeData.filter(function(x) {
          return keys.indexOf(x[parentKey]) === -1;
        });
        let nodes = [];
        roots.map(function(x) {
          nodes.push(x);
        });
        while (nodes.length > 0) {
          let node = nodes.pop();
          let children = treeData.filter(function(x) {
            return x[parentKey] === node[key];
          });
          children.map(function(x) {
            node.children.push(x);
            nodes.push(x);
          });
        }
        return roots;
      };

      ContainerFactory.defineDoc = function(pdfData) {
        let docDefinition = {
          info: {
            title: $translate.instant("containers.report.title", {}, "", "en"),
            author: "NeuVector",
            subject: $translate.instant(
              "containers.report.title",
              {},
              "",
              "en"
            ),
            keywords: "Quarantine Report"
          },
          header: function(currentPage) {
            if (currentPage === 2 || currentPage === 3) {
              return {
                text: $translate.instant(
                  "partner.containers.report.header",
                  {},
                  "",
                  "en"
                ),
                alignment: "center",
                italics: true,
                style: "pageHeader"
              };
            }
          },
          footer: function(currentPage) {
            if (currentPage > 1) {
              return {
                stack: [
                  {
                    image: imageMap.FOOTER_LINE,
                    width: 650,
                    height: 1,
                    margin: [50, 5, 0, 10]
                  },
                  {
                    text: [
                      {
                        text: $translate.instant(
                          "containers.report.footer",
                          {},
                          "",
                          "en"
                        ),
                        italics: true
                      },
                      { text: " |   " + currentPage }
                    ],
                    alignment: "right",
                    style: "pageFooter"
                  }
                ]
              };
            }
          },
          pageSize: "LETTER",
          pageOrientation: "landscape",
          pageMargins: [50, 50, 50, 45],
          defaultStyle: {
            fontSize: 7
          },
          content: [
            {
              image: imageMap.BACKGROUND,
              width: 1000,
              absolutePosition: { x: 0, y: 300 }
            },
            {
              image: imageMap.ABSTRACT,
              width: 450
            },
            {
              image: imageMap[$translate.instant("partner.general.LOGO_NAME")],
              width: 400,
              absolutePosition: { x: 350, y: 180 }
            },
            {
              text: $translate.instant("containers.report.title", {}, "", "en"),
              fontSize: 40,
              color: "#777",
              bold: true,
              absolutePosition: { x: 150, y: 450 },
              pageBreak: "after"
            },

            {
              toc: {
                title: {
                  text: "In this Quarantine Report",
                  style: "tocTitle"
                },
                numberStyle: "tocNumber"
              },
              margin: [60, 35, 20, 60],
              pageBreak: "after"
            },

            {
              text: $translate.instant(
                "containers.report.summaryHeader",
                {},
                "",
                "en"
              ),
              style: "contentHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: "#4863A0",
                margin: [80, 15, 0, 60]
              }
            },

            {
              text: $translate.instant(
                "containers.report.subHeaderByReason",
                {},
                "",
                "en"
              ),
              style: "contentSubHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 12,
                italic: true,
                color: "black",
                margin: [95, 10, 0, 60]
              }
            },

            {
              columns: [
                [
                  {
                    text: "" // $translate.instant("containers.report.userConfig")
                  },
                  {
                    table: {
                      body: []
                    }
                  },
                  {
                    text: "" // $translate.instant("containers.report.ruleTriggered")
                  },
                  {
                    table: {
                      body: []
                    }
                  }
                ],
                {
                  image: pdfData.canvas.byQuarantineReason,
                  // text: 'here is an image',
                  width: 350,
                  margin: [5, 0, 15, 0]
                }
              ]
            },
            {
              text: $translate.instant(
                "containers.report.details",
                {},
                "",
                "en"
              ),
              style: "contentHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: "#4863A0",
                margin: [80, 15, 0, 60]
              }
            },

            {
              style: "tableExample",
              table: {
                headerRows: 1,
                dontBreakRows: true,
                widths: ["5%", "12%", "12%", "12%", "25%", "10%", "12%", "12%"],
                body: [
                  [
                    { text: "Id", style: "tableHeader" },
                    {
                      text: $translate.instant(
                        "containers.detail.NAME",
                        {},
                        "",
                        "en"
                      ),
                      style: "tableHeader"
                    },
                    {
                      text: $translate.instant(
                        "group.gridHeader.DOMAIN",
                        {},
                        "",
                        "en"
                      ),
                      style: "tableHeader"
                    },
                    {
                      text: $translate.instant(
                        "containers.detail.HOST_NAME",
                        {},
                        "",
                        "en"
                      ),
                      style: "tableHeader"
                    },
                    {
                      text: $translate.instant(
                        "containers.detail.IMAGE",
                        {},
                        "",
                        "en"
                      ),
                      style: "tableHeader"
                    },
                    {
                      text: $translate.instant(
                        "containers.detail.APPLICATIONS",
                        {},
                        "",
                        "en"
                      ),
                      style: "tableHeader"
                    },
                    {
                      text: $translate.instant(
                        "containers.report.reason",
                        {},
                        "",
                        "en"
                      ),
                      style: "tableHeader"
                    },
                    {
                      text: $translate.instant(
                        "containers.detail.STARTED_AT",
                        {},
                        "",
                        "en"
                      ),
                      style: "tableHeader"
                    }
                  ]
                ]
              }
            }
          ],
          styles: {
            pageHeader: {
              fontSize: 14,
              italic: true,
              bold: true,
              color: "grey",
              margin: [0, 10, 5, 5]
            },
            pageFooter: {
              fontSize: 12,
              color: "grey",
              margin: [0, 5, 55, 5]
            },
            pageFooterImage: {
              width: 750,
              height: 1,
              margin: [50, 5, 10, 10]
            },
            tocTitle: {
              fontSize: 22,
              color: "#566D7E",
              lineHeight: 2
            },
            tocNumber: {
              italics: true,
              fontSize: 15
            },
            tableHeader: {
              bold: true,
              fontSize: 10,
              alignment: "center"
            },
            contentHeader: {
              fontSize: 16,
              bold: true,
              color: "#3090C7",
              margin: [0, 10, 0, 10]
            },
            contentSubHeader: {
              fontSize: 14,
              color: "black",
              margin: [0, 10, 0, 10]
            },
            content: {
              fontSize: 10
            },
            title: {
              bold: true,
              fontSize: 8
            },
            subTitle: {
              bold: true,
              fontSize: 7
            },
            danger: {
              bold: true,
              color: "#dc4034",
              fontSize: 8
            },
            warning: {
              bold: true,
              color: "#ff9800",
              fontSize: 8
            },
            info: {
              bold: true,
              color: "#2196f3",
              fontSize: 8
            }
          }
        };

        let distributionLayout = {
          fillColor: function(i, node) {
            return i % 2 === 0 ? "#CBF8C0" : "#E9FFDE";
          },
          hLineColor: function(i, node) {
            return "white";
          },
          vLineColor: function(i, node) {
            return "white";
          }
        };

        let userDefinedArray = [];
        let onResponseRuleArray = [];

        pdfData.quarantineByReason.forEach((v, k) => {
          if (k === "user-configured") {
            userDefinedArray.push([k, v]);
          } else {
            onResponseRuleArray.push([k, v]);
          }
        });

        if (userDefinedArray.length > 0) {
          docDefinition.content[7].columns[0][0].text = $translate.instant(
            "containers.report.userConfig",
            {},
            "",
            "en"
          );
          docDefinition.content[7].columns[0][0].fontSize = 12;
          docDefinition.content[7].columns[0][0].margin = [0, 10, 0, 8];
          docDefinition.content[7].columns[0][1].layout = distributionLayout;
          docDefinition.content[7].columns[0][1].fontSize = 10;
          docDefinition.content[7].columns[0][1].table.widths = [180, 110];
          docDefinition.content[7].columns[0][1].table.body.push([
            {
              text: $translate.instant(
                "containers.report.reason",
                {},
                "",
                "en"
              ),
              style: "bold:true"
            },
            {
              text: $translate.instant(
                "containers.report.number",
                {},
                "",
                "en"
              ),
              style: "bold:true"
            }
          ]);
          for (let item of userDefinedArray) {
            docDefinition.content[7].columns[0][1].table.body.push(item);
          }
        } else {
          docDefinition.content[7].columns[0][1].table.body.push([]);
        }

        if (onResponseRuleArray.length > 0) {
          docDefinition.content[7].columns[0][2].text = $translate.instant(
            "containers.report.ruleTriggered",
            {},
            "",
            "en"
          );
          docDefinition.content[7].columns[0][2].fontSize = 12;
          docDefinition.content[7].columns[0][2].margin = [0, 10, 0, 8];
          docDefinition.content[7].columns[0][3].layout = distributionLayout;
          docDefinition.content[7].columns[0][3].fontSize = 10;
          docDefinition.content[7].columns[0][3].table.widths = [220, 70];
          docDefinition.content[7].columns[0][3].table.body.push([
            {
              text: $translate.instant(
                "containers.report.reason",
                {},
                "",
                "en"
              ),
              style: ""
            },
            {
              text: $translate.instant(
                "containers.report.number",
                {},
                "",
                "en"
              ),
              style: ""
            }
          ]);
          let count = 0;
          for (let item of onResponseRuleArray) {
            if (count < 5) {
              docDefinition.content[7].columns[0][3].table.body.push(item);
            } else {
              break;
            }
            count++;
          }

          if (count === 5) {
            docDefinition.content[7].columns[0][2].text = $translate.instant(
              "containers.report.top5",
              {},
              "",
              "en"
            );
          }
        } else {
          docDefinition.content[7].columns[0][3].table.body.push([]);
        }

        for (let row of pdfData.details) {
          docDefinition.content[9].table.body.push(row);
        }

        return docDefinition;
      };

      ContainerFactory.getContainer = id => {
        return $http
          .get(PLAIN_CONTAINER_URL, { params: { id: id } })
          .then(function(response) {
            let container = response.data.workload;
            if (
              response.data.workload.rt_attributes.labels &&
              response.data.workload.rt_attributes.labels["io.kubernetes.container.name"] ===
                "POD"
            ) {
              container.images = [];
            } else {
              container.images = [response.data.workload.brief.image];
            }
            if (container.children && container.children.length > 0) {
              container.children.forEach(function(child) {
                container.images.push(child.image);
              });
            }
            return container;
          })
          .catch(function(err) {
            console.warn(err);
            return {};
          });
      };

      ContainerFactory.getWorkloadMap = () => {
        return $http
          .get(PLAIN_CONTAINER_URL)
          .then(function(response) {
            const workloads = response.data.workloads;
            const workloadMap = new Map();
            const workloadMap4Pdf = {};
            const imageMap4Pdf = {};
            workloads.forEach(workload => {
              workloadMap.set(workload.id, workload);
              workloadMap4Pdf[workload.id] = {
                id: workload.id,
                pod_id: workload.id || "",
                pod_name: workload.display_name || workload.pod_name || workload.name,
                domain: workload.domain || "",
                applications: workload.applications || [],
                policy_mode: workload.policy_mode || "",
                service: workload.service || "",
                service_group: workload.service_group || "",
                image_id: workload.image_id,
                image: workload.image,
                scanned_at: workload.scan_summary ? $filter("date")(workload.scan_summary.scanned_at, "MMM dd, y HH:mm:ss") : "",
                high: 0,
                medium: 0,
                evaluation: 0, //0: compliant, 1: risky
                complianceCnt: 0,
                vulnerabilites: [],
                complianceList: []
              };
              if (workload.state !== "exit") {
                imageMap4Pdf[workload.image_id] = {
                  image_id: workload.image_id,
                  image_name: workload.image,
                  high: 0,
                  medium: 0,
                  evaluation: 0, //0: compliant, 1: risky
                  complianceCnt: 0,
                  vulnerabilites: [],
                  complianceList: []
                };
                if (workload.children) {
                  workload.children.forEach(child => {
                    workloadMap.set(child.id, workload);
                    workloadMap4Pdf[child.id] = {
                      id: child.id,
                      pod_id: workload.id || "",
                      pod_name: workload.display_name || workload.pod_name || workload.name,
                      domain: workload.domain || "",
                      applications: workload.applications || [],
                      policy_mode: workload.policy_mode || "",
                      service: workload.service || "",
                      service_group: workload.service_group || "",
                      image: workload.image,
                      scanned_at: workload.scan_summary ? $filter("date")(workload.scan_summary.scanned_at, "MMM dd, y HH:mm:ss") : "",
                      high: 0,
                      medium: 0,
                      evaluation: 0, //0: compliant, 1: risky
                      complianceCnt: 0,
                      vulnerabilites: [],
                      complianceList: []
                    };
                  });
                }
              }
            });
            return {
              workloadMap,
              workloadMap4Pdf,
              imageMap4Pdf
            };
          })
          .catch(function(err) {
            console.warn(err);
            return {
              workloadMap: new Map(),
              workloadMap4Pdf: {},
              imageMap4Pdf: {}
            };
          });
      };

      return ContainerFactory;
    });
})();
