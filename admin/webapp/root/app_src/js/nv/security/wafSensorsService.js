(function() {
    "use strict";
    angular
        .module("app.assets")
        .factory("wafSensorsService", wafSensorsService);

    function wafSensorsService($translate, $window, $timeout, Utils, $sanitize) {
        return {
            id: null,
            getIndex: function(array, name) {
                for (let i = 0; i < array.length; i++) {
                    if (array[i].name === name) return i;
                }
            },
            getPattern: function(event) {
                let pattern = [];
                let conditionOptioins = this.conditionOptioins;
                conditionOptioins[event].types.forEach(function(type) {
                    if (type !== "level" && type !== "name") {
                        if (type === "cve-high" || type === "item") {
                            pattern.push(`^${type}:[0-9]+[\.][0-9]+$|^${type}:[0-9]+$`);
                        } else {
                            pattern.push(`^${type}:.+$`);
                        }
                    }
                });
                if (conditionOptioins[event].name) {
                    conditionOptioins[event].name.forEach(function(name) {
                        pattern.push(`^${name}$`);
                    });
                } else {
                    if (conditionOptioins[event].types.includes("name")) {
                        pattern.push("^name:.+$");
                    }
                }
                if (conditionOptioins[event].level) {
                    conditionOptioins[event].level.forEach(function(level) {
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
            wafRulesStringToTag: function(conditions) {
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
            wafRulesObjToString: function(criteria, isBooleanCriteria, isSingleValueCriterion) {
                if (isBooleanCriteria) {
                    return $translate.instant(
                        `admissionControl.names.${Utils.parseDivideStyle(
                            criteria.name
                        ).toUpperCase()}`);
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
            setGrid: function(isWriteWAFSensorAuthorized) {
                let columnDefs = [
                    {
                        headerName: $translate.instant("waf.gridHeader.SENSOR_NAME"),
                        field: "name",
                        headerCheckboxSelection: isWriteWAFSensorAuthorized,
                        headerCheckboxSelectionFilteredOnly: isWriteWAFSensorAuthorized,
                        checkboxSelection: isWriteWAFSensorAuthorized,
                        width: 100,
                        minWidth: 100
                    },
                    {
                        headerName: $translate.instant("waf.gridHeader.COMMENT"),
                        field: "comment",
                        width: 320,
                        minWidth: 320
                    },
                    {
                        headerName: $translate.instant("waf.gridHeader.GROUPS"),
                        field: "groups",
                        cellRenderer: function(params) {
                            if (params && params.value) {
                                return $sanitize(params.value.join(", "));
                            }
                        },
                        width: 200
                    },
                    {
                        headerName: $translate.instant("admissionControl.TYPE"),
                        field: "cfg_type",
                        cellRenderer: (params) => {
                          if (params) {
                            let cfgType = params.value ? params.value.toUpperCase() : CFG_TYPE.CUSTOMER.toUpperCase();
                            let type = colourMap[cfgType];
                            return `<div class="action-label nv-label ${type}">${$sanitize(
                              $translate.instant(`group.${cfgType}`)
                            )}</div>`;
                          }
                        },
                        width: 90,
                        minWidth: 90,
                        maxWidth: 90
                    },
                    {
                        cellClass: "grid-right-align",
                        suppressSorting: true,
                        cellRenderer: function(params) {
                            if (params && !params.data.predefine) {
                                return (
                                  '<div>' +
                                  '       <em class="fa fa-edit fa-lg mr-sm text-action"' +
                                  '         ng-click="editSensor()" uib-tooltip="{{\'waf.TIP.EDIT_SENSOR\' | translate}}">' +
                                  "       </em>" +
                                  '       <em class="fa fa-trash fa-lg mr-sm text-action" id="remove-form-action"' +
                                  '         ng-click="removeSensor(data)" uib-tooltip="{{\'waf.TIP.DELETE_SENSOR\' | translate}}">' +
                                  "       </em>" +
                                  "     </div>"
                                );
                            }
                        },
                        hide: !isWriteWAFSensorAuthorized,
                        width: 60,
                        minWidth: 60,
                        maxWidth: 60
                    }
                ];


                let columnDefs4Rules = [
                    {
                        headerName: $translate.instant("waf.gridHeader.PATTERN_NAME"),
                        field: "name",
                        width: 120,
                        minWidth: 120
                    },
                    {
                        cellClass: "grid-right-align",
                        suppressSorting: true,
                        cellRenderer: function(params) {
                          return (
                            '<div>' +
                            '       <em ng-if="!isPredefine" class="fa fa-edit fa-lg mr-sm text-action"' +
                            '         ng-click="addEditRule(sensor, data, \'edit\')" uib-tooltip="{{\'waf.TIP.EDIT_RULE\' | translate}}">' +
                            "       </em>" +
                            '       <em ng-if="!isPredefine" class="fa fa-trash fa-lg mr-sm text-action" id="remove-form-action"' +
                            '         ng-click="removeRule(sensor, data)" uib-tooltip="{{\'waf.TIP.DELETE_RULE\' | translate}}">' +
                            "       </em>" +
                            "     </div>"
                          );
                        },
                        hide: !isWriteWAFSensorAuthorized,
                        width: 60,
                        minWidth: 60,
                        maxWidth: 60
                    }
                ];

                let columnDefs4Patterns = [
                  {
                    headerName: $translate.instant("waf.patternGrid.LOGIC_IS_NOT"),
                    field: "op",
                    cellRenderer: function(params) {
                      if (params && params.value) {
                        return $translate.instant(`waf.patternGrid.${params.value.toUpperCase()}`);
                      }
                    },
                    width: 120,
                    maxWidth: 120,
                    minWidth: 120
                  },
                  {
                      headerName: $translate.instant("waf.patternGrid.PATTERN"),
                      field: "value",
                      cellRenderer: function(params) {
                          if (params && params.value) {
                              return $sanitize(params.value.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"));
                          }
                      },
                      suppressSorting: true,
                      width: 400,
                      minWidth: 350
                  },
                  {
                    headerName: $translate.instant("waf.patternGrid.CONTEXT"),
                    field: "context",
                    width: 100,
                    maxWidth: 100,
                    minWidth: 100
                  }

                ];

                let editPatternColumn = [
                  {
                    headerName: "",
                    cellRenderer: (params) => {
                      return '<div>' +
                      '       <em class="fa fa-trash fa-lg mr-sm text-action" id="remove-form-action"' +
                      '         ng-click="removePattern(data)" uib-tooltip="{{\'waf.TIP.DELETE_PATTERN\' | translate}}">' +
                      "       </em>" +
                      "     </div>"
                    },
                    hide: !isWriteWAFSensorAuthorized,
                    width: 30,
                    maxWidth: 30,
                    minWidth: 30
                  }
                ];

                let grid = {
                    gridOptions: Utils.createGridOptions(columnDefs),
                    gridOptions4Rules: Utils.createGridOptions(columnDefs4Rules),
                    gridOptions4Patterns: Utils.createGridOptions(columnDefs4Patterns),
                    gridOptions4EditPatterns: Utils.createGridOptions([...columnDefs4Patterns, ...editPatternColumn])
                };

                grid.gridOptions.rowSelection = "multiple";

                grid.gridOptions.rowClassRules = {
                    "disabled-row": function(params) {
                        if (!params.data) return;
                        if (params.data.disable) {
                            return true;
                        }
                        return false;
                    },
                    "critical-row": function(params) {
                        if (!params.data) return;
                        return params.data.id === "" && params.data.critical;
                    }
                };
                return grid;
            }
        };
    }
})();
