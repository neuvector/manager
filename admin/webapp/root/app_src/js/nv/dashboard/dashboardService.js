(function() {
  "use strict";
  angular
    .module("app.dashboard")
    .factory("DashboardFactory", function DashboardFactory(
      $translate,
      $filter,
      $sanitize,
      Utils
    ) {
      let _rbacErrorGridOptions = null;
      DashboardFactory.setGrid = function() {
        const rbacErrorColumn = [
          {
            headerName: "",
            field: "errorType",
            cellRenderer: (params) => {
              if (params && params.value) {
                return `<span class="pt-sm pb-sm label label-danger">
                              ${$translate.instant(`dashboard.body.message.${params.value.toUpperCase()}`)}
                        </span>`;
              }
            },
            minWidth: 130,
            maxWidth: 130,
            width: 130
          },
          {
            headerName: "",
            field: "errorDetail",
            cellRenderer: (params) => {
              if (params && params.value) {
                return `<span class="text-danger">${$sanitize(params.value)}</span>`
              }
            },
            width: 500
          }
        ];

        DashboardFactory.rbacErrorGridOptions = function() {
          if (_rbacErrorGridOptions === null) {
            _rbacErrorGridOptions = Utils.createGridOptions(rbacErrorColumn);
            _rbacErrorGridOptions.defaultColDef = {
              flex: 1,
              cellClass: 'cell-wrap-text-break-word',
              autoHeight: true,
              sortable: true,
              resizable: true,
            };
            _rbacErrorGridOptions.onColumnResized = function(params) {
              params.api.resetRowHeights();
            };
            _rbacErrorGridOptions.headerHeight = 0;
            _rbacErrorGridOptions.enableSorting = false;
            _rbacErrorGridOptions.suppressScrollOnNewData = true;
          }
          return _rbacErrorGridOptions;
        };
      };
      DashboardFactory.defineDoc = function(pdfData) {
        return {
          info: {
            title: "Security Event and Risk Report",
            author: "NeuVector",
            subject: "Security Event and Risk Report",
            keywords: "Security Event and Risk Report"
          },
          header: function(currentPage) {
            if (currentPage === 2 || currentPage === 3) {
              return {
                text: $translate.instant("partner.containers.report.header", {}, "", "en"),
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
                        text: $translate.instant("containers.report.footer", {}, "", "en"),
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
            fontSize: 6
          },
          styles: {
            tableHeader: {
              bold: true,
              alignment: "center",
              fontSize: 22
            },
            indexName: {
              alignment: "left",
              fontSize: 16,
              color: "#999"
            },
            indexPage: {
              alignment: "right",
              fontSize: 16,
              color: "#999"
            },
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
            tocTitle: {
              fontSize: 22,
              color: "#566D7E",
              lineHeight: 2
            },
            tocNumber: {
              italics: true,
              fontSize: 15
            },
            contentHeader: {
              fontSize: 16,
              bold: true,
              color: "#3090C7",
              margin: [0, 10, 0, 10]
            },
            contentSubHeader: {
              fontSize: 14,
              color: "#aaa",
              margin: [0, 10, 0, 10]
            }
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
              text: $translate.instant("dashboard.GENERAL_REPORT", {}, "", "en"),
              fontSize: 40,
              color: "#777",
              bold: true,
              absolutePosition: { x: 150, y: 450 },
              pageBreak: "after"
            },
            {
              toc:{
                title:{
                  text: $translate.instant("dashboard.TOC", {}, "", "en"),
                  style: "tocTitle"
                },
                numberStyle:"tocNumber"
              },
              margin: [60, 35, 20, 60],
              pageBreak: "after"
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.CONTAINER_SEC", {}, "", "en"
              ),
              style: "contentHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: "#4863A0",
                margin: [80, 15, 0, 60]
              },
              width: 350
            },
            {
              columns: [
                // {
                //   width: "30%",
                //   columns: [
                //     {
                //       image: pdfData.canvas.ingressEgressConnCanvas,
                //       width: 250
                //     }
                //   ]
                // },
                {
                  width: "30%",
                  columns: [
                    {
                      image: pdfData.canvas.ingressEgressConnCanvas2,
                      width: 250
                    },
                    {
                      text: pdfData.details.noExposedContainers,
                      fontSize: 12,
                      color: "#8bc34a",
                      width: 350,
                      alignment: "center",
                      absolutePosition: { x: -485, y: 130 }
                    }
                  ]
                },
                {
                  width: "70%",
                  columns: [
                    {
                      text:
                        $translate.instant("dashboard.help.exposure.txt1", {}, "", "en") +
                        "\n" +
                        $translate.instant("dashboard.help.exposure.txt2", {}, "", "en"),
                      fontSize: 11,
                      color: "#999",
                      margin: [70, 0, 0, 0]
                    }
                  ]
                }
              ]
            },
            {
              columns: [
                [
                  {
                    text:
                      pdfData.details.noExposedContainers === ""
                        ? $translate.instant(
                        "dashboard.body.panel_title.INGRESS", {}, "", "en"
                        )
                        : "",
                    fontSize: 11,
                    color: "#999",
                    width: 350,
                    margin: [0, 10, 0, 0]
                  },
                  {
                    fontSize: 9,
                    margin: [0, 5, 5, 0],
                    layout: "lightHorizontalLines",
                    table: {
                      widths: ["20%", "40%", "20%", "10%", "10%"],
                      body: pdfData.details.ingressPdfGridData || [
                        "",
                        "",
                        "",
                        "",
                        ""
                      ]
                    }
                  }
                ]
              ]
            },
            {
              columns: [
                [
                  {
                    text:
                      pdfData.details.noExposedContainers === ""
                        ? $translate.instant(
                            "dashboard.body.panel_title.EGRESS", {}, "", "en"
                          )
                        : "",
                    fontSize: 11,
                    color: "#999",
                    width: 350,
                    margin: [0, 10, 0, 0]
                  },
                  {
                    fontSize: 9,
                    margin: [0, 5, 0, 0],
                    layout: "lightHorizontalLines",
                    table: {
                      widths: ["20%", "40%", "20%", "10%", "10%"],
                      body: pdfData.details.egressPdfGridData || [
                        "",
                        "",
                        "",
                        "",
                        ""
                      ]
                    }
                  }
                ]
              ],
              pageBreak: "after"
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.CRITICAL_SECURITY_EVENT", {}, "", "en"
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
              image: pdfData.canvas.criticalSecurityEventCanvas,
              width: 700
            },
            {
              text:
                $translate.instant("dashboard.help.criticalEvent.txt1", {}, "", "en") +
                "\n" +
                $translate.instant("dashboard.help.criticalEvent.txt2", {}, "", "en"),
              fontSize: 11,
              color: "#999",
              margin: [10, 10, 10, 10]
            },
            {
              text: pdfData.details.noCriticalSecurityEvent,
              fontSize: 12,
              color: "#8bc34a",
              width: 750,
              alignment: "center",
              absolutePosition: { x: 0, y: 100 }
            },
            {
              text: $translate.instant("dashboard.body.panel_title.TOP_SEC_EVENTS", {}, "", "en"),
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: "#4863A0",
                margin: [80, 15, 0, 60]
              },
              style: "contentHeader",
              pageBreak: "before"
            },
            {
              text: $translate.instant("threat.gridHeader.SOURCE", {}, "", "en"),
              style: "contentSubHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 12,
                italic: true,
                color: "black",
                margin: [95, 10, 0, 60]
              },
              width: 350
            },
            {
              columns: [
                [
                  {
                    image: pdfData.canvas.topSecurityEventSourceCanvas,
                    width: 350
                  },
                  {
                    text: pdfData.details.topSecurityEventsSource,
                    fontSize: 9,
                    color: "#999",
                    width: 350
                  },
                  {
                    text: pdfData.details.noCriticalSecurityEvent,
                    fontSize: 12,
                    color: "#8bc34a",
                    width: 350,
                    alignment: "center",
                    absolutePosition: { x: -385, y: 130 }
                  }
                ],
                [
                  {
                    text:
                      $translate.instant("dashboard.help.top_security_events.txt1", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_security_events.txt2", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_security_events.txt2_1", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_security_events.txt2_2", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.partner.top_security_events.txt2_3", {}, "", "en"),
                    fontSize: 9,
                    color: "#999",
                    margin: [10, 10, 10, 10]
                  }
                ]
              ]
            },
            {
              text: $translate.instant("threat.gridHeader.DESTINATION", {}, "", "en"),
              style: "contentSubHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 12,
                italic: true,
                color: "black",
                margin: [95, 10, 0, 60]
              },
              width: 350
            },
            {
              columns: [
                [
                  {
                    text:
                      $translate.instant("dashboard.help.top_security_events.txt3", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_security_events.txt4", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_security_events.txt4_1", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_security_events.txt4_2", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.partner.top_security_events.txt4_3", {}, "", "en"),
                    fontSize: 9,
                    color: "#999",
                    margin: [10, 10, 10, 10]
                  }
                ],
                [
                  {
                    image: pdfData.canvas.topSecurityEventDestinationCanvas,
                    width: 350
                  },
                  {
                    text: pdfData.details.topSecurityEventsDestination,
                    fontSize: 9,
                    color: "#999",
                    width: 350
                  },
                  {
                    text: pdfData.details.noCriticalSecurityEvent,
                    fontSize: 12,
                    color: "#8bc34a",
                    width: 350,
                    alignment: "center",
                    absolutePosition: { x: 370, y: 370 }
                  }
                ]
              ],
              pageBreak: "after"
            },
            {
              stack:[
                {
                  text: $translate.instant(
                    "dashboard.body.panel_title.TOP_VULNERABILITY", {}, "", "en"
                  ),
                  style: "contentHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 16,
                    bold: true,
                    color: "#4863A0",
                    margin: [80, 15, 0, 60]
                  },
                  width: 350
                },
                {
                  text: $translate.instant(
                    "dashboard.body.panel_title.BY_PODS", {}, "", "en"
                  ),
                  style: "contentSubHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 12,
                    italic: true,
                    color: "black",
                    margin: [95, 10, 0, 60]
                  },
                  width: 350
                }
              ]

            },
            {
              columns: [
                [
                  {
                    image: pdfData.canvas.topVulsContainerCanvas,
                    width: 350
                  },
                  {
                    text: pdfData.details.topVulsContainer,
                    fontSize: 9,
                    color: "#999",
                    width: 350
                  },
                  {
                    text: pdfData.details.noTopVulnerabileContainers,
                    fontSize: 12,
                    color: "#8bc34a",
                    width: 350,
                    alignment: "center",
                    absolutePosition: { x: -385, y: 130 }
                  }
                ],
                [
                  {
                    text:
                      $translate.instant("dashboard.help.top_vulnerable_pod.txt1", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_vulnerable_pod.txt2", {}, "", "en"),
                    fontSize: 11,
                    color: "#999",
                    margin: [10, 10, 10, 10]
                  }
                ]
              ]
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.BY_NODES", {}, "", "en"
              ),
              style: "contentSubHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 12,
                italic: true,
                color: "black",
                margin: [95, 10, 0, 60]
              },
              width: 350
            },
            {
              columns: [
                [
                  {
                    text:
                      $translate.instant("dashboard.help.top_vulnerable_node.txt1", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.top_vulnerable_node.txt2", {}, "", "en"),
                    fontSize: 11,
                    color: "#999",
                    margin: [10, 10, 10, 10]
                  }
                ],
                [
                  {
                    image: pdfData.canvas.topVulsNodeCanvas,
                    width: 350
                  },
                  {
                    text: pdfData.details.topVulsNode,
                    fontSize: 9,
                    color: "#999",
                    width: 350
                  },
                  {
                    text: pdfData.details.noTopVulnerabileNodes,
                    fontSize: 12,
                    color: "#8bc34a",
                    width: 350,
                    alignment: "center",
                    absolutePosition: { x: 370, y: 370 }
                  }
                ]
              ],
              pageBreak: "after"
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.SERVICE_CONTAINER_POLICY_MODE", {}, "", "en"
              ),
              style: "contentHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: "#4863A0",
                margin: [80, 15, 0, 60]
              },
              width: 350
            },
            {
              columns: [
                {
                  columns: [
                    [
                      {
                        text: $translate.instant(
                          "dashboard.body.panel_title.SERVICE_VIEW", {}, "", "en"
                        ),
                        fontSize: 11,
                        alignment: "center",
                        color: "#999",
                        margin: [0, 10, 0, 10]
                      },
                      {
                        image: pdfData.canvas.policyMode4ServicesCanvas,
                        width: 180
                      },
                      {
                        text: pdfData.details.noManagedServices,
                        fontSize: 12,
                        color: "#dfc808",
                        width: 350,
                        alignment: "center",
                        absolutePosition: { x: -545, y: 130 }
                      }
                    ],
                    [
                      {
                        text: $translate.instant(
                          "dashboard.body.panel_title.POD_VIEW", {}, "", "en"
                        ),
                        fontSize: 11,
                        alignment: "center",
                        color: "#999",
                        margin: [0, 10, 0, 10]
                      },
                      {
                        image: pdfData.canvas.policyMode4PodsCanvas,
                        width: 180
                      },
                      {
                        text: pdfData.details.noManagedContainers,
                        fontSize: 12,
                        color: "#dfc808",
                        width: 350,
                        alignment: "center",
                        absolutePosition: { x: -160, y: 130 }
                      }
                    ]
                  ]
                },
                {
                  text:
                    $translate.instant("dashboard.help.policy_mode_pod.txt1", {}, "", "en") +
                    "\n" +
                    $translate.instant("dashboard.help.policy_mode_pod.txt2", {}, "", "en"),
                  fontSize: 11,
                  color: "#999",
                  margin: [30, 10, 0, 10]
                }
              ],
              pageBreak: "after"
            },
            {
              text: $translate.instant(
                "dashboard.body.panel_title.PROTOCOL_APPS_IN_POLICY", {}, "", "en"
              ),
              style: "contentHeader",
              tocItem: true,
              tocStyle: {
                fontSize: 16,
                bold: true,
                color: "#4863A0",
                margin: [80, 15, 0, 60]
              },
              width: 350
            },
            {
              margin: [0, 0, 0, 20],
              columns: [
                [
                  {
                    text: $translate.instant(
                      "dashboard.body.panel_title.POLICY_COUNT", {}, "", "en"
                    ),
                    fontSize: 11,
                    width: 350,
                    color: "#999",
                    margin: [10, 10, 10, 10]
                  },
                  {
                    image: pdfData.canvas.protocolAppCoverageCanvas,
                    width: 350
                  },
                  {
                    text: pdfData.details.noPolicyApplication,
                    fontSize: 12,
                    color: "#dfc808",
                    width: 350,
                    alignment: "center",
                    absolutePosition: { x: -385, y: 130 }
                  }
                ],
                [
                  {
                    text:
                      $translate.instant("dashboard.help.application.txt1", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.application.txt2", {}, "", "en"),
                    fontSize: 11,
                    color: "#999",
                    margin: [30, 10, 0, 10]
                  }
                ]
              ]
            },
            {
              columns: [
                [
                  {
                    text:
                      $translate.instant("dashboard.help.application.txt3", {}, "", "en") +
                      "\n" +
                      $translate.instant("dashboard.help.application.txt4", {}, "", "en"),
                    fontSize: 11,
                    color: "#999",
                    margin: [30, 10, 0, 10]
                  }
                ],
                [
                  {
                    text: $translate.instant(
                      "dashboard.body.panel_title.BYTES", {}, "", "en"
                    ),
                    fontSize: 11,
                    width: 350,
                    color: "#999",
                    margin: [10, 10, 10, 10]
                  },
                  {
                    image: pdfData.canvas.protocolAppVolumeCanvas,
                    width: 350
                  },
                  {
                    text: pdfData.details.noPolicyApplication,
                    fontSize: 12,
                    color: "#dfc808",
                    width: 350,
                    alignment: "center",
                    absolutePosition: { x: 370, y: 370 }
                  }
                ]
              ]
            }
          ]
        };
      };
      return DashboardFactory;
    });
})();
