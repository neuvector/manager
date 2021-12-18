(function() {
  "use strict";
  angular.module("app.assets").factory("policyService", policyService);

  function policyService($translate) {
    const _webWorkerJob = function(hasWorker = true) {
      console.log("Worker is starting...");
      const _formatContent = function(docData) {
        let metadata = docData.metadata;
        let images = docData.images;
        let charts = docData.charts;
        let distByType = docData.distByType;

        let docDefinition = {
          info: {
            title: metadata.title,
            author: "NeuVector",
            subject: "Network Rules Summary",
            keywords:
              "kubernetes network rule policy"
          },
          header: function(currentPage) {
            if (currentPage === 2 || currentPage === 3) {
              return {
                text: metadata.others.headerText,
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
                    image: images.FOOTER_LINE,
                    width: 650,
                    height: 1,
                    margin: [50, 5, 0, 10]
                  },
                  {
                    text: [
                      { text: metadata.others.footerText, italics: true },
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
              image: images.BACKGROUND,
              width: 1000,
              absolutePosition: { x: 0, y: 300 }
            },
            {
              image: images.ABSTRACT,
              width: 450
            },
            {
              image: images[metadata.others.logoName],
              width: 400,
              absolutePosition: { x: 350, y: 180 }
            },
            {
              text: metadata.title,
              fontSize: 40,
              color: "#777",
              bold: true,
              absolutePosition: { x: 150, y: 450 },
              pageBreak: "after"
            },
            {
              toc: {
                title: {
                  text: " In Network Rules Summary Report",
                  style: "tocTitle"
                },
                numberStyle: "tocNumber"
              },
              margin: [60, 35, 20, 60],
              pageBreak: "after"
            },
            {
              text: [
                {
                  text: metadata.others.reportSummary,
                  style: "contentHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 16,
                    bold: true,
                    color: "#4863A0",
                    margin: [80, 15, 0, 60]
                  }
                }
              ]
            },
            {
              text: metadata.others.byType,
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
                {
                  table: {
                    body: []
                  }
                },
                {
                  image: charts.canvas.byType,
                  width: 250
                }
              ],
              pageBreak: "after"
            },
            {
              text: [
                {
                  text: metadata.others.subTitleDetails,
                  style: "contentHeader",
                  tocItem: true,
                  tocStyle: {
                    fontSize: 16,
                    bold: true,
                    color: "#4863A0",
                    margin: [80, 15, 0, 60]
                  }
                }
              ]
            },

            {
              style: "tableExample",
              table: {
                headerRows: 1,
                dontBreakRows: true,
                widths: ["5%", "5%", "16%", "13%", "13%", "13%", "11%", "5%", "5%", "6%", "8%"],
                body: [
                  [
                    { text: metadata.header.seq, style: "tableHeader" },
                    { text: metadata.header.id, style: "tableHeader" },
                    { text: metadata.header.comment, style: "tableHeader" },
                    { text: metadata.header.from, style: "tableHeader" },
                    {
                      text: metadata.header.to,
                      style: "tableHeader"
                    },
                    { text: metadata.header.applications, style: "tableHeader" },
                    { text: metadata.header.ports, style: "tableHeader" },
                    { text: metadata.header.action, style: "tableHeader" },
                    { text: metadata.header.type, style: "tableHeader" },
                    { text: metadata.header.disabled, style: "tableHeader" },
                    { text: metadata.header.updateAt, style: "tableHeader" }
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
              bold: true,
              color: "black",
              margin: [0, 10, 0, 10]
            },
            content: {
              fontSize: 10,
              margin: [5, 5, 5, 5]
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
            success: {
              bold: true,
              color: "#8bc34a",
              fontSize: 8
            },
            learned: {
              bold: true,
              color: "#d2aff1",
              fontSize: 8
            },
            custom: {
              bold: true,
              color: "#a1a105",
              fontSize: 8
            },
            ground: {
              bold: true,
              color: "#ff8a65",
              fontSize: 8
            },
            fed: {
              bold: true,
              color: "#45505c",
              fontSize: 8
            },
            grey: {
              bold: true,
              color: "#7e8da2",
              fontSize: 8
            }
          }
        };

        let distLayout = {
          fillColor: function(i, node) {
            return i % 2 == 0 ? "#CBF8C0" : "#E9FFDE";
          },
          hLineColor: function(i, node) {
            return "white";
          },
          vLineColor: function(i, node) {
            return "white";
          }
        };

        // add distribute data
        docDefinition.content[7].columns[0].layout = distLayout;
        docDefinition.content[7].columns[0].fontSize = 10;
        docDefinition.content[7].columns[0].table.widths = [250, 30];

        if (distByType.length) {
          for (let item of distByType) {
            docDefinition.content[7].columns[0].table.body.push(item);
          }
        } else {
          docDefinition.content[7].columns[0].table.body.push([]);
        }

        // docDefinition.content[9].columns[0].layout = distLayout;
        // docDefinition.content[9].columns[0].fontSize = 10;
        // docDefinition.content[9].columns[0].table.widths = [250, 30];
        //
        // if (distByName.length) {
        //   for (let item of distByName) {
        //     docDefinition.content[9].columns[0].table.body.push(item);
        //   }
        // } else {
        //   docDefinition.content[9].columns[0].table.body.push([]);
        // }

        let index = 1;
        for (let item of docData.data) {
          // docDefinition.content[11].table.body.push(
          docDefinition.content[9].table.body.push(
            _getRowData(item, index, metadata)
          );
          index++;
        }

        return docDefinition;
      };

      const _getActionInfo = function(action) {
        let style = "";

        if (action.toLowerCase() === "allow") {
          style = "success";
        }
        if (action.toLowerCase() === "deny") {
          style = "danger";
        }

        return {
          text: action,
          style: style
        };
      };

      const _getTypeInfo = function(type, metadata) {
        let style = "";

        if (type.toLowerCase() === metadata.others.cfgType["learned"].toLowerCase()) {
          style = "learned";
        }
        if (type.toLowerCase() === metadata.others.cfgType["user_created"].toLowerCase()) {
          style = "custom";
        }
        if (type.toLowerCase() === metadata.others.cfgType["ground"].toLowerCase()) {
          style = "ground";
        }
        if (type.toLowerCase() === metadata.others.cfgType["federal"].toLowerCase()) {
          style = "fed";
        }

        return {
          text: type.split("_").join(" "),
          style: style
        };
      };

      const _getStatusInfo = function(status) {
        let style = "";

        if (status.toLowerCase() === "enabled") {
          style = "success";
        }
        if (status.toLowerCase() === "disabled") {
          style = "grey";
        }
        return {
          text: status,
          style: style
        };
      };

      const _getRowData = function(item, seq, metadata) {
        let id = item.id;
        let comment = item.comment;
        let from = item.from;
        let to = item.to;
        let applications = item.applications.join(", ");
        let portList = item.ports.split(",");
        let ports = `${portList.slice(0, portList.length > 5 ? 5 : portList.length).join(",")}${portList.length > 5 ? `(Total: ${portList.length})` : ""}`;
        let action = _getActionInfo(item.action);
        let type = _getTypeInfo(item.cfg_type, metadata);
        let disabled = _getStatusInfo(item.disabled);
        let updateTime = item.updateTime;

        return [seq, id, comment, from, to, applications, ports, action, type, disabled, updateTime];
      };

      const _drawReport = function(pdfMake, FileSaver, docData) {
        let docDefinition = _formatContent(docData);

        let report = pdfMake.createPdf(docDefinition);

        report.getBlob(function(blob) {
          FileSaver.saveAs(
            blob,
            $translate.instant("policy.report.REPORT_TITLE") + ".pdf"
          );
          return true;
        });
      };

      if (hasWorker) {
        self.onmessage = event => {
          let docData = JSON.parse(event.data);
          const showProgress = (function(self) {
            return function(progress) {
              if (Math.floor(progress * 100000) % 1000 === 0) {
                self.postMessage({progress: progress});
              }
            };
          })(self);
          const drawReportInWebWorker = function(docData) {
            let docDefinition = _formatContent(docData);

            let baseURL = event.srcElement.origin;
            self.importScripts(
              baseURL + "/vendor/pdfmake/build/pdfmake.js",
              baseURL + "/vendor/pdfmake/build/vfs_fonts.js"
            );

            let report = pdfMake.createPdf(docDefinition);

            report.getBlob(function(blob) {
              console.log("Worker is end...");
              self.postMessage({blob: blob, progress: 1});
              self.close();
            }, {progressCallback: showProgress});
          };
          drawReportInWebWorker(docData);
        };
      } else {
        return {
          drawReport: _drawReport
        };
      }
    };

    const _getI18NMessages = function(options) {
      return {
        title: $translate.instant("policy.report.REPORT_TITLE", {}, "", "en"),
        header: {
          seq: $translate.instant("policy.gridHeader.SEQ", {}, "", "en"),
          id: $translate.instant("policy.gridHeader.ID", {}, "", "en"),
          comment: $translate.instant("policy.editPolicy.COMMENT", {}, "", "en"),
          from: $translate.instant("policy.gridHeader.FROM", {}, "", "en"),
          to: $translate.instant("policy.gridHeader.TO", {}, "", "en"),
          applications: $translate.instant("policy.gridHeader.APPLICATIONS", {}, "", "en"),
          ports: $translate.instant("policy.gridHeader.PORT", {}, "", "en"),
          action: $translate.instant("policy.gridHeader.ACTION", {}, "", "en"),
          type: $translate.instant("policy.gridHeader.TYPE", {}, "", "en"),
          updateAt: $translate.instant("policy.gridHeader.UPDATE_AT", {}, "", "en"),
          disabled: $translate.instant("policy.report.STATUS", {}, "", "en")
        },
        others: {
          reportSummary: $translate.instant("policy.report.SUMMARY_HEADER", {}, "", "en"),
          subTitleDetails: $translate.instant("policy.report.SUB_TITLE_DETAILS", {}, "", "en"),
          byType: $translate.instant("policy.report.BY_TYPE", {}, "", "en"),
          logoName: $translate.instant("partner.general.LOGO_NAME", {}, "", "en"),
          cfgType: DISPLAY_CFG_TYPE_MAP
        }
      };
    };

    const _getCharts4Pdf = function() {
      let byType = document.getElementById("byType").toDataURL();

      return {
        canvas: {
          byType: byType
        }
      };
    }

    return {
      rules: null,
      groupList: null,
      appList: null,
      serializedRules: null,
      index4Add: null,
      index4edit: null,
      isPolicyDirty: false,
      groupErr: false,
      policyAppErr: false,
      policyAppErrMSG: "",
      groupErrMSG: "",
      webWorkerJob: _webWorkerJob,
      getI18NMessages: _getI18NMessages,
      getCharts4Pdf: _getCharts4Pdf
    };
  }
})();

(function() {
  "use strict";
  angular.module("app.assets").factory("responseRulesService", responseRulesService);

  function responseRulesService() {
    return {
      rules: [],
      rulesBackup: [],
      updatedRule: null,
      groupList: null,
      categories: null,
      actions: null,
      conditionOptions: null,
      webhookList: null,
      conditionPatternSample: null,
      id: null,
      conditionOptionErr: false,
      containerGroupErr: false,
      conditionOptionErrMSG: "",
      containerGroupErrMSG: "",
      getIndex: function(array, id) {
        for(let i = 0; i < array.length; i++) {
          if(array[i].id === id)
            return i;
        }
      },
      getPattern: function(event, options) {
        let pattern = [];
        let conditionOptions = options;
        conditionOptions[event].types.forEach(function(type) {
          if (type !== 'level' && type !== 'name') {
            if (type === 'cve-high' || type === 'item') {
              pattern.push(`^${type}:[0-9]+[\.][0-9]+$|^${type}:[0-9]+$`);
            } else {
              pattern.push(`^${type}:.+$`);
            }
          }
        });
        if (conditionOptions[event].name) {
          if (event === "compliance") {
            pattern.push("^((?!name:<).)*$");
          } else {
            conditionOptions[event].name.forEach(function(name) {
              pattern.push(`^${name}$`);
            });
          }
        } else {
          if (conditionOptions[event].types.includes("name")) {
            pattern.push("^name:.+$");
          }
        }
        if (conditionOptions[event].level) {
          conditionOptions[event].level.forEach(function(level) {
              pattern.push(`^${level}$`);
          });
        }
        return new RegExp(pattern.join("|"));
      },
      conditionObjToString: function(conditions) {
        if (conditions !== null && conditions !== "" && typeof conditions !== "undefined") {
          conditions = conditions.map((condition) => {
            return condition.type + ":" + condition.value
          }).join(", ");
        } else {
          conditions = "";
        }
        return conditions;
      },
      conditionObjToTag: function(conditions) {
        if (conditions !== null && conditions !== "" && typeof conditions !== "undefined") {
          conditions = conditions.map((condition) => {
            return {name: condition.type + ":" + condition.value};
          })
        } else {
          conditions = [];
        }
        return conditions;
      },
      conditionTagToString: function(conditions) {
        if (conditions !== null && conditions !== "" && typeof conditions !== "undefined") {
          conditions = conditions.map((condition) => {
            return condition.name;
          }).join(", ");
        } else {
          conditions = "";
        }
        return conditions;
      },
      conditionStringToTag: function(conditions) {
        if (conditions !== null && conditions!== "" && typeof conditions !== "undefined" && conditions.length > 0) {
          conditions = conditions.split(",").map(function(condition, index) {
            return {name: condition, index: index};
          });
        } else {
          conditions = [];
        }
        return conditions;
      },
      createFilter: function(query) {
        let lowercaseQuery = angular.lowercase(query);
        return function filterFn(criteria) {
          return (criteria.toLowerCase().indexOf(lowercaseQuery) >= 0);
        };
      }
    };
  }
})();

(function() {
  "use strict";

  angular.module("app.assets").service("confirminator", confirminator);

  confirminator.$inject = ["$q", "$timeout", "$window"];
  function confirminator($q, $timeout, $window) {
    let currentModal = null;
    return {
      open: open
    };

    function open(message) {
      if (currentModal) {
        currentModal.reject();
      }

      currentModal = $q.defer();

      $timeout(
        function openConfirm() {
          $window.confirm(message)
            ? currentModal.resolve()
            : currentModal.reject();

          currentModal = null;
        },
        0,
        false
      );
      return currentModal.promise;
    }
  }
})();
