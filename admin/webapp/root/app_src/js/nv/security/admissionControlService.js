(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("admissionControlService", admissionControlService);

  function admissionControlService($translate, $filter, Utils) {
    const setGrid = function() {
      const columnDefs4MatchingTest = [
        {
          headerName: $translate.instant("admissionControl.matchingTestGrid.INDEX"),
          field: "index",
          width: 60,
          minWidth: 60,
          maxWidth: 60
        },
        {
          headerName: $translate.instant("admissionControl.matchingTestGrid.KIND"),
          field: "kind",
          width: 120,
        },
        {
          headerName: $translate.instant("admissionControl.matchingTestGrid.NAME"),
          field: "name",
          width: 120,
        },
        {
          headerName: $translate.instant("admissionControl.matchingTestGrid.ALLOWED"),
          field: "allowed",
          cellRenderer: (params) => {
            return params.value ?
              `<em class="fa fa-check text-success" aria-hidden="true"></em>` :
              `<em class="fa fa-times text-danger" aria-hidden="true"></em>`;
          },
          width: 80,
          minWidth: 80,
          maxWidth: 80
        },
        {
          headerName: $translate.instant("admissionControl.matchingTestGrid.MSG"),
          field: "message",
          width: 400
        }
      ];
      let gridOptions4MatchingTest = Utils.createGridOptions(columnDefs4MatchingTest);
      gridOptions4MatchingTest.defaultColDef = {
        flex: 1,
        cellClass: 'cell-wrap-text',
        autoHeight: true,
        sortable: true,
        resizable: true,
      };
      gridOptions4MatchingTest.onColumnResized = function(params) {
        params.api.resetRowHeights();
      };
      return gridOptions4MatchingTest;
    };
    return {
      admissionRules: [],
      id: null,
      setGrid: setGrid,
      admissionRule4Edit: null,
      getIndex: function(array, id) {
        for (let i = 0; i < array.length; i++) {
          if (array[i].id === id) return i;
        }
      },
      getPattern: function(event) {
        let pattern = [];
        let conditionOptions = this.conditionOptions;
        conditionOptions[event].types.forEach(function(type) {
          if (type !== "level" && type !== "name") {
            if (type === "cve-high" || type === "item") {
              pattern.push(`^${type}:[0-9]+[\.][0-9]+$|^${type}:[0-9]+$`);
            } else {
              pattern.push(`^${type}:.+$`);
            }
          }
        });
        if (conditionOptions[event].name) {
          conditionOptions[event].name.forEach(function(name) {
            pattern.push(`^${name}$`);
          });
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
      conditionObjToTag: function(conditions) {
        if (conditions !== null && conditions !== "" && typeof conditions !== "undefined") {
          conditions = conditions.map((condition) => {
            return `${$translate.instant(
              `admissionControl.names.${Utils.parseDivideStyle(
                condition.name
              ).toUpperCase()}`
            )} ${$translate.instant(
              `admissionControl.operators.${condition.op.toUpperCase()}`
            )} ${condition.value}`;
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
      admissionConditionStringToTag: function(conditions) {
        if (
          conditions !== null &&
          conditions !== "" &&
          typeof conditions !== "undefined" &&
          conditions.length > 0
        ) {
          conditions = conditions.split(";").map(function(condition) {
            return { name: condition };
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
      },
      admissionConditionObjToString: function(criteria, isBooleanCriteria, hasSubOptions, isSingleValueCriterion) {
        if (isBooleanCriteria) {
          return $translate.instant(
            `admissionControl.names.${Utils.parseDivideStyle(
              criteria.name
            ).toUpperCase()}`);
        } else if (hasSubOptions) {
          if (criteria.name === "cveScoreCount") {
            return $translate.instant(
              `admissionControl.display.${Utils.parseDivideStyle(
                criteria.name
              ).toUpperCase()}_WITH_COUNT`,
              {
                score: criteria.value,
                count: criteria.sub_criteria[0].value,
                countComparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${criteria.op}`)),
                scoreComparison: $translate.instant(`admissionControl.display.cveScore.${criteria.sub_criteria[0].op}`)
              }
            );
          } else if (
            criteria.name === "cveHighCount" ||
            criteria.name === "cveHighWithFixCount" ||
            criteria.name === "cveMediumCount"
          ) {
            return $translate.instant(
                    `admissionControl.display.${Utils.parseDivideStyle(
                      criteria.name
                    ).toUpperCase()}_WITH_REPORT_DAYS`,
                    {
                      comparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${criteria.op}`)),
                      count: criteria.value
                    }
                  ) + " " +
                  $translate.instant(
                    `admissionControl.display.${Utils.parseDivideStyle(
                      criteria.op)}`,
                    {
                      days: criteria.sub_criteria[0].value
                    }
                  );
          } else if (
            criteria.name === "resourceLimit"
          ) {
            console.log("criteria", criteria);
            return $translate.instant(
              `admissionControl.display.${Utils.parseDivideStyle(
                criteria.name
              ).toUpperCase()}`,
              {
                details: criteria.sub_criteria.map((subCriterion) => {
                  return `${$translate.instant(`admissionControl.names.${Utils.parseDivideStyle(subCriterion.name).toUpperCase()}_S`)}${subCriterion.op}${$filter("bytes")(subCriterion.value)}`
                }).join(", ")
              }
            ).replace(/\&gt\;/g, ">").replace(/\&lt\;/g, "<");
          }
        }
        let value = criteria.value.length > 30 ? `${criteria.value.substring(0, 30)}...` : criteria.value;
        value = criteria.op.toLowerCase().indexOf("contains") >= 0 ? `[${value}]` : value;
        return `${$translate.instant(
          `admissionControl.names.${Utils.parseDivideStyle(
            criteria.name
          ).toUpperCase()}`
        )} ${$translate.instant(
          `admissionControl.operators.${isSingleValueCriterion ? `${criteria.op.toUpperCase()}_SINGLE` : criteria.op.toUpperCase()}`
        )} ${value}`;
      },
      PSP_CRITERIA: [
        {
          name: {
            originalName: "runAsPrivileged",
            displayName: "run_As_Privileged"
          },
          operator: "=",
          value: "true"
        },
        {
          name: {
            originalName: "runAsRoot",
            displayName: "run_As_Root"
          },
          operator: "=",
          value: "true"
        },
        {
          name: {
            originalName: "shareIpcWithHost",
            displayName: "share_Ipc_With_Host"
          },
          operator: "=",
          value: "true"
        },
        {
          name: {
            originalName: "shareNetWithHost",
            displayName: "share_Net_With_Host"
          },
          operator: "=",
          value: "true"
        },
        {
          name: {
            originalName: "sharePidWithHost",
            displayName: "share_Pid_With_Host"
          },
          operator: "=",
          value: "true"
        },
        {
          name: {
            originalName: "allowPrivEscalation",
            displayName: "allow_Priv_Escalation"
          },
          operator: "=",
          value: "true"
        }
      ]
    };
  }
})();
