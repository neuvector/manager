(function() {
    "use strict";
    angular
        .module("app.assets")
        .controller("FederalPolicyAdmissionRulesController", FederalPolicyAdmissionRulesController);
    FederalPolicyAdmissionRulesController.$inject = [
        "$rootScope",
        "$scope",
        "$state",
        "$location",
        "$timeout",
        "$translate",
        "$http",
        "$localStorage",
        "$mdDialog",
        "Alertify",
        "$window",
        "Utils",
        "filterFilter",
        "admissionControlService",
        "$sanitize",
        "AuthorizationFactory"
    ];
    function FederalPolicyAdmissionRulesController(
        $rootScope,
        $scope,
        $state,
        $location,
        $timeout,
        $translate,
        $http,
        $localStorage,
        $mdDialog,
        Alertify,
        $window,
        Utils,
        filterFilter,
        admissionControlService,
        $sanitize,
        AuthorizationFactory
    ) {
        $scope.isSupported = false;
        $scope.graphHeight = $window.innerHeight - 310;
        angular.element($window).bind("resize", function() {
            $scope.graphHeight = $window.innerHeight - 310;
            $scope.$digest();
        });

        const INTERNAL_ERR_CODE = {
            UNSUPPORTED: 30,
            CLUSTER_ROLE_NOT_CONFIG: 31,
            WEBHOOK_NOT_CONFIG: 32,
            NO_UPD_PROMISSION: 33,
            ERR_SRV2WEBHOOK: 34,
            CONFIG_K8S_FAIL: 28
        };

        const KUBE = "Kubernetes";
        $scope.RULE_TYPE = {
            DENY: "deny",
            EXCEPTION: "exception"
        };
        const SINGLE_VALUE_CRITERIA = [
            "user",
            "image",
            "imageRegistry",
            "namespace"
        ];
        $scope.showedRuleType = $scope.RULE_TYPE.DENY;
        let isFed = AuthorizationFactory.getDisplayFlag("multi_cluster");
        $scope.isWriteAdmissionRuleAuthorized = AuthorizationFactory.getDisplayFlag("write_admission") && isFed;
        let filter = "";
        let exceptionRulesCount = 0;
        let denyRulesCount = 0;
        let vm = this;

        const isSingleValueCriterion = function(name) {
            for (let i = 0; i < SINGLE_VALUE_CRITERIA.length; i++) {
                if (SINGLE_VALUE_CRITERIA[i].toLowerCase() === name.toLowerCase()) {
                    return true;
                }
            }
            return false;
        };

        activate();
        function activate() {
            let resizeEvent = "resize.ag-grid";
            let $win = $($window);
            let getEntityName = function(count) {
                return Utils.getEntityName(
                    count,
                    $translate.instant("policy.COUNT_POSTFIX")
                );
            };
            const outOf = $translate.instant("enum.OUT_OF");
            const found = $translate.instant("enum.FOUND");
            let columnDefs = [
                {
                    headerName: $translate.instant("admissionControl.ID"),
                    field: "id",
                    width: 60,
                    minWidth: 60,
                    maxWidth: 60
                },
                {
                    headerName: $translate.instant("admissionControl.COMMENT"),
                    field: "comment",
                    width: 240,
                    minWidth: 150,
                    cellRenderer: function(params) {
                        if (params && params.value) {
                            return $sanitize(params.value.length > 60
                                ? `${params.value.substring(0, 60)}...`
                                : params.value);
                        }
                    }
                },
                {
                    headerName: $translate.instant("admissionControl.CRITERIA"),
                    field: "criteria",
                    cellRenderer: criteriaRenderFunc,
                    width: 550
                },
                {
                    headerName: $translate.instant("admissionControl.RULE_TYPE"),
                    field: "rule_type",
                    cellRenderer: typeRenderFunc,
                    width: 85,
                    minWidth: 85,
                    maxWidth: 85
                },
                {
                    headerName: $translate.instant("admissionControl.TYPE"),
                    field: "cfg_type",
                    cellRenderer: cfgTypeRenderFunc,
                    width: 85,
                    minWidth: 85,
                    maxWidth: 85
                },
                {
                    cellRenderer: actionsRenderFunc,
                    cellClass: "grid-right-align",
                    suppressSorting: true,
                    width: 100,
                    maxWidth: 100,
                    minWidth: 100
                }
            ];
            function cfgTypeRenderFunc(params) {
                if (params && params.value) {
                    let type = params.data.disable ? colourMap["disabled-rule"] : colourMap[params.value.toUpperCase()];
                    return `<div class="action-label nv-label ${type}">${$sanitize($translate.instant(
                      `group.${params.value.toUpperCase()}`
                    ))}</div>`;
                }
            }
            function typeRenderFunc(params) {
                let type = params.value === "exception" ? "Allow" : params.value;
                if (params.value && params.data) {
                    return `<span ng-class="{\'policy-remove\': data.remove}" class="action-label ${
                        params.data.disable
                            ? colourMap["disabled_background"]
                            : colourMap[type.toLowerCase()]
                        }">${$sanitize($translate.instant(
                        "admissionControl." + type.toUpperCase()
                    ))}</span>`;
                }
            }
            function actionsRenderFunc(params) {
                if ($scope.isWriteAdmissionRuleAuthorized) {
                    if (params.data && params.data.critical) {
                        if (params.data.category === "Global action") {
                            // return (
                            //   '<div class="rule-actions-expand fade-in-right">' +
                            //   '       <em class="fa fa-ban fa-lg mr-sm text-action" ng-if="default_action===\'allow\' && state"' +
                            //   '         ng-click="toggleAction(\'deny\')" uib-tooltip="{{\'admissionControl.TIP.DENY\' | translate}}">' +
                            //   "       </em>" +
                            //   '       <em class="fa fa-check-circle-o fa-lg mr-sm text-action" ng-if="default_action!==\'allow\' && state"' +
                            //   '         ng-click="toggleAction(\'allow\')" uib-tooltip="{{\'admissionControl.TIP.ALLOW\' | translate}}">' +
                            //   "       </em>" +
                            //   "     </div>" +
                            //   '     <div class="rule-actions-collapse" ng-if="state">' +
                            //   '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                            //   "       </em>" +
                            //   "     </div>"
                            // );
                        } else {
                            return (
                                '<div class="rule-actions-expand fade-in-right">' +
                                '       <em class="fa fa-newspaper-o fa-lg mr-sm text-action"' +
                                '         ng-click="editPolicy($event, data, true)" uib-tooltip="{{\'admissionControl.TIP.VIEW_RULE\' | translate}}">' +
                                "       </em>" +
                                '       <em class="fa fa-times fa-lg mr-sm text-action" ng-if="!data.disable"' +
                                '         ng-click="toggleRuleItem($event, data, true)" uib-tooltip="{{\'policy.TIP.DISABLE\' | translate}}">' +
                                "       </em>" +
                                '       <em class="fa fa-check fa-lg mr-sm text-action" ng-if="data.disable"' +
                                '         ng-click="toggleRuleItem($event, data, true)" uib-tooltip="{{\'policy.TIP.ENABLE\' | translate}}">' +
                                "       </em>" +
                                "     </div>" +
                                '     <div class="rule-actions-collapse">' +
                                '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                                "       </em>" +
                                "     </div>"
                            );
                        }
                    } else {
                        return (
                            '<div class="rule-actions-expand fade-in-right">' +
                            '       <em class="fa fa-edit fa-lg mr-sm text-action"' +
                            '         ng-click="editPolicy($event, data)" uib-tooltip="{{\'policy.TIP.EDIT\' | translate}}">' +
                            "       </em>" +
                            '       <em class="fa fa-times fa-lg mr-sm text-action" ng-if="!data.disable"' +
                            '         ng-click="toggleRuleItem($event, data, false)" uib-tooltip="{{\'policy.TIP.DISABLE\' | translate}}">' +
                            "       </em>" +
                            '       <em class="fa fa-check fa-lg mr-sm text-action" ng-if="data.disable"' +
                            '         ng-click="toggleRuleItem($event, data, false)" uib-tooltip="{{\'policy.TIP.ENABLE\' | translate}}">' +
                            "       </em>" +
                            '       <em class="fa fa-trash fa-lg mr-sm text-action" ' +
                            '         ng-click="deleteRuleItem($event, data)" uib-tooltip="{{\'policy.TIP.DELETE\' | translate}}">' +
                            "       </em>" +
                            "     </div>" +
                            '     <div class="rule-actions-collapse">' +
                            '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                            "       </em>" +
                            "     </div>"
                        );
                    }
                } else {
                    return (
                        '     <div class="rule-actions-expand">' +
                        '       <em class="fa fa-newspaper-o fa-lg mr-sm text-action"' +
                        '         ng-click="editPolicy($event, data, true)" uib-tooltip="{{\'admissionControl.TIP.VIEW_RULE\' | translate}}">' +
                        "       </em>" +
                        "     </div>" +
                        '     <div class="rule-actions-collapse">' +
                        '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                        "       </em>" +
                        "     </div>"
                    );
                }
            }

            function criteriaRenderFunc(params) {
                let criteriaArray = [];
                params.value.forEach(function(criteria) {
                    if (typeof criteria === "string") {
                        criteriaArray.push(criteria);
                    } else {
                        if (
                            criteria.name === "imageSigned" ||
                            criteria.name === "runAsRoot" ||
                            criteria.name === "runAsPrivileged" ||
                            criteria.name === "allowPrivEscalation" ||
                            criteria.name === "pspCompliance"
                        ) {
                            criteriaArray.push(
                                $translate.instant(
                                    `admissionControl.names.${Utils.parseDivideStyle(
                                        criteria.name
                                    ).toUpperCase()}`
                                )
                            );
                        } else if (
                          (
                            criteria.name === "cveHighCount" ||
                            criteria.name === "cveHighWithFixCount" ||
                            criteria.name === "cveMediumCount"
                          ) && criteria.sub_criteria
                        ) {
                          criteriaArray.push(
                            $translate.instant(
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
                              )
                          );
                        } else {
                            let value =
                                criteria.value.length > 30
                                    ? `${criteria.value.substring(0, 30)}...`
                                    : criteria.value;
                            value =
                                criteria.op.toLowerCase().indexOf("contains") >= 0
                                    ? `[${value}]`
                                    : value;
                            criteriaArray.push(
                                `${$translate.instant(
                                    `admissionControl.names.${Utils.parseDivideStyle(
                                        criteria.name
                                    ).toUpperCase()}`
                                )} ${
                                    isSingleValueCriterion(criteria.name)
                                        ? $translate.instant(
                                        `admissionControl.operators.${criteria.op.toUpperCase()}_SINGLE`
                                        )
                                        : $translate.instant(
                                        `admissionControl.operators.${criteria.op.toUpperCase()}`
                                        )
                                    } ${value}`
                            );
                        }
                    }
                });
                return $sanitize(criteriaArray.join(", "));
            }

            $scope.gridOptions = {
                headerHeight: 56,
                rowHeight: 56,
                animateRows: true,
                enableColResize: true,
                angularCompileRows: true,
                suppressDragLeaveHidesColumns: true,
                columnDefs: columnDefs,
                rowData: null,
                rowClassRules: {
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
                },
                onGridReady: function(params) {
                    $timeout(function() {
                        params.api.sizeColumnsToFit();
                    }, 100);
                    $win.on(resizeEvent, function() {
                        $timeout(function() {
                            params.api.sizeColumnsToFit();
                        }, 1000);
                    });
                },
                overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
            };

            $scope.exceptionGridOptions = {
                headerHeight: 56,
                rowHeight: 56,
                animateRows: true,
                enableColResize: true,
                angularCompileRows: true,
                suppressDragLeaveHidesColumns: true,
                columnDefs: columnDefs,
                rowData: null,
                rowClassRules: {
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

            $scope.requestAdmissionRules = function(index) {
                requestAdmissionRules(index);
            };
            function requestAdmissionRules(index) {
                $http
                    .get(ADMISSION_URL, {params: {scope: "fed"}})
                    .then(function(response) {
                        $scope.isSupported = true;
                        $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
                            "general.NO_ROWS"
                        );
                        admissionControlService.admissionRules = response.data.rules;
                        $scope.admissionRules = admissionControlService.admissionRules;
                        // let globalActionRule = {
                        //     id: "",
                        //     comment:
                        //         $scope.default_action === "allow"
                        //             ? "Allow deployments that don't match any of above rules."
                        //             : "Deny deployments that don't match any of above rules.",
                        //     criteria: [],
                        //     critical: true,
                        //     category: "Global action",
                        //     rule_type: $scope.default_action,
                        //     disable: false
                        // };
                        // $scope.admissionRules.push(globalActionRule);
                        if ($scope.gridOptions && $scope.gridOptions.api) {
                            $scope.gridOptions.api.setRowData($scope.admissionRules);
                        }
                        $scope.count = `${$scope.admissionRules.length} ${getEntityName(
                            $scope.admissionRules.length
                        )}`;
                        $scope.onFilterChanged(filter);
                        if (index) {
                            $scope.gridOptions.api.ensureIndexVisible(index, "middle");
                        }
                    })
                    .catch(function(error) {
                        console.log(error);
                        $scope.admissionRuleErr = true;
                        $scope.isSupported = false;
                        if (error.status === 404) {
                            switch (error.data.code) {
                                case INTERNAL_ERR_CODE.UNSUPPORTED:
                                    $scope.gridOptions.overlayNoRowsTemplate =
                                        '<div class="server-error">' +
                                        '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                                        '<div><span class="error-text">' +
                                        $translate.instant("admissionControl.msg.UNSUPPORTED") +
                                        "</span></div></div>";
                                    break;
                                case INTERNAL_ERR_CODE.CLUSTER_ROLE_NOT_CONFIG:
                                    $scope.gridOptions.overlayNoRowsTemplate =
                                        '<div class="server-error">' +
                                        '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                                        '<div><span class="error-text">' +
                                        $translate.instant(
                                            "partner.admissionControl.msg.CLUSTER_ROLE_NOT_CONFIG"
                                        ) +
                                        "</span></div></div>";
                                    break;
                                case INTERNAL_ERR_CODE.WEBHOOK_NOT_CONFIG:
                                    $scope.gridOptions.overlayNoRowsTemplate =
                                        '<div class="server-error">' +
                                        '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                                        '<div><span class="error-text">' +
                                        $translate.instant(
                                            "partner.admissionControl.msg.WEBHOOK_NOT_CONFIG"
                                        ) +
                                        "</span></div></div>";
                                    break;
                                default:
                                    $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(error);
                            }
                        } else {
                            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(error);
                        }
                        if ($scope.gridOptions && $scope.gridOptions.api) {
                            $scope.gridOptions.api.setRowData();
                        }
                    });
            }
            function requestConditionOption() {
                admissionControlService.conditionOptionErr = false;
                $http
                    .get(ADMCTL_CONDITION_OPTION_URL, {params: {scope: "fed"}})
                    .then(function(response) {
                        admissionControlService.conditionDenyOptions =
                            response.data.admission_options.deny_options.k8s_options.rule_options;
                        admissionControlService.conditionExceptionOptions =
                            response.data.admission_options.exception_options.k8s_options.rule_options;
                        admissionControlService.psp_collection = response.data.admission_options.psp_collection;
                    })
                    .catch(function(err) {
                        console.warn(err);
                        admissionControlService.conditionOptionErr = true;
                        admissionControlService.conditionOptionErrMSG = Utils.getErrorMessage(
                            err
                        );
                    });
                requestAdmissionRules();
                // $http
                //     .get(ADMCTL_STATE_URL)
                //     .then(function(response) {
                //         admissionControlService.state = response.data.state.enable;
                //         admissionControlService.mode = response.data.state.mode;
                //         vm.state = admissionControlService.state;
                //         $scope.mode = admissionControlService.mode
                //             ? admissionControlService.mode
                //             : "monitor";
                //         $scope.isProtect = admissionControlService.mode === "protect";
                //         $scope.default_action = response.data.state.default_action;
                //         $scope.adm_client_mode_options =
                //             response.data.state.adm_client_mode_options;
                //         $scope.adm_client_mode = response.data.state.adm_client_mode;
                //         requestAdmissionRules();
                //     })
                //     .catch(function(error) {
                //         console.log(error);
                //         $scope.admissionRuleErr = true;
                //         if (
                //             error.status === 404 &&
                //             error.data.code === INTERNAL_ERR_CODE.UNSUPPORTED
                //         ) {
                //             $scope.isSupported = false;
                //             $scope.gridOptions.overlayNoRowsTemplate =
                //                 '<div class="server-error">' +
                //                 '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
                //                 '<div><span class="error-text">' +
                //                 $translate.instant("admissionControl.msg.UNSUPPORTED") +
                //                 "</span></div></div>";
                //             $scope.gridOptions.api.setRowData();
                //         } else {
                //             $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(error);
                //             if ($scope.gridOptions && $scope.gridOptions.api) {
                //                 $scope.gridOptions.api.setRowData();
                //             }
                //         }
                //     });
            }
            $scope.reload = function() {
                requestConditionOption();
            };
            $scope.onFilterChanged = function(value) {
                filter = value;
                $scope.gridOptions.api.setQuickFilter(value);
                $scope.filteredServices = filterFilter($scope.services, {
                    name: value
                });
                let filteredCount = $scope.gridOptions.api.getModel().rootNode
                    .childrenAfterFilter.length;
                $scope.count =
                    filteredCount === $scope.admissionRules.length || value === ""
                        ? `${$scope.admissionRules.length} ${getEntityName(
                        $scope.admissionRules.length
                        )}`
                        : `${found} ${filteredCount} ${getEntityName(
                        filteredCount
                        )} ${outOf} ${$scope.admissionRules.length} ${getEntityName(
                        $scope.admissionRules.length
                        )}`;
            };
        }
        $scope.reload();

        $scope.switchState = function(state) {
            let payload = {
                state: {
                    enable: state,
                    mode: $scope.mode,
                    default_action: $scope.default_action,
                    adm_client_mode: $scope.adm_client_mode,
                    adm_client_mode_options: $scope.adm_client_mode_options
                }
            };
            vm.state = state;
            $http
                .patch(ADMCTL_STATE_URL, payload)
                .then(function(response) {
                    Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                    if (state) {
                        Alertify.success(
                            $translate.instant("admissionControl.msg.G_ENABLE_OK")
                        );
                    } else {
                        Alertify.success(
                            $translate.instant("admissionControl.msg.G_DISABLE_OK")
                        );
                    }
                })
                .catch(function(err) {
                    if (
                        USER_TIMEOUT.indexOf(err.status) < 0
                    ) {
                        if (
                            err.status === 500 &&
                            err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
                        ) {
                            err = $translate.instant(
                                "admissionControl.msg.CONFIG_K8S_FAIL"
                            );
                        }
                        Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                        if (!state) {
                            Alertify.error(
                              Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.G_DISABLE_NG"), false)
                            );
                        } else {
                            Alertify.error(
                              Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.G_ENABLE_NG"), false)
                            );
                        }
                        $timeout(function() {
                            document.getElementById("adm-state").checked = !state;
                            vm.state = !state;
                            $scope.$apply();
                        }, 4000);
                    }
                });
        };

        $scope.switchMode = function(isProtect) {
            let payload = {
                state: {
                    enable: vm.state,
                    mode: isProtect ? "protect" : "monitor",
                    default_action: $scope.default_action,
                    adm_client_mode: $scope.adm_client_mode,
                    adm_client_mode_options: $scope.adm_client_mode_options
                }
            };

            $scope.mode = isProtect ? "protect" : "monitor";
            let sendReq4TogglingMode = function(payload, isProtect) {
                $http
                    .patch(ADMCTL_STATE_URL, payload)
                    .then(function(response) {
                        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                        Alertify.success(
                            $translate.instant("admissionControl.msg.MODE_SWITCH_OK")
                        );
                        $scope.isProtect = isProtect;
                    })
                    .catch(function(err) {
                        if (
                            USER_TIMEOUT.indexOf(err.status) < 0
                        ) {
                            if (
                                err.status === 500 &&
                                err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
                            ) {
                                message = $translate.instant(
                                    "admissionControl.msg.CONFIG_K8S_FAIL"
                                );
                            }
                            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                            Alertify.error(
                              Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.MODE_SWITCH_NG"), false)
                            );
                            $timeout(function() {
                                $scope.isProtect = !isProtect;
                                $scope.$apply();
                            }, 4000);
                        }
                    });
            };
            if ($scope.isProtect !== isProtect) {
                if (isProtect) {
                    let confirmBox = $translate.instant(
                        "admissionControl.msg.PROTECT_CONFIRM"
                    );
                    Alertify.confirm(confirmBox).then(
                        function toOK() {
                            sendReq4TogglingMode(payload, isProtect);
                        },
                        function toCancel() {}
                    );
                } else {
                    sendReq4TogglingMode(payload, isProtect);
                }
            }
        };

        $scope.addPolicy = function(ev, id) {
            let success = function() {
                $mdDialog
                    .show({
                        controller: DialogController4AddAdmRules,
                        controllerAs: "addAdmCtrl",
                        templateUrl: "dialog.addAdmRule.html",
                        targetEvent: ev,
                        locals: {
                            ruleType: $scope.showedRuleType,
                            RULE_TYPE: $scope.RULE_TYPE,
                            SINGLE_VALUE_CRITERIA: SINGLE_VALUE_CRITERIA,
                            isSingleValueCriterion: isSingleValueCriterion
                        }
                    })
                    .then(
                        function() {
                            $timeout(() => {
                                $scope.index4Add = $scope.admissionRules.length;
                                $scope.requestAdmissionRules();
                            }, 3000);
                        },
                        function() {}
                    );
            };

            let error = function() {};

            Utils.keepAlive(success, error);
        };

        $scope.editPolicy = function(ev, data, isViewOnly) {
            $scope.isViewOnly = isViewOnly;
            let success = function() {
                let rowNode = null;
                $scope.index4edit = admissionControlService.getIndex(
                    $scope.admissionRules,
                    data.id
                );
                rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                    $scope.index4edit
                );

                rowNode.setSelected(true);
                admissionControlService.admissionRule4Edit = angular.copy(data);
                $mdDialog
                    .show({
                        controller: DialogController4EditAdmRules,
                        controllerAs: "editAdmCtrl",
                        templateUrl: "dialog.editAdmRule.html",
                        targetEvent: ev,
                        locals: {
                            ruleType: $scope.showedRuleType,
                            isViewOnly: $scope.isViewOnly,
                            SINGLE_VALUE_CRITERIA: SINGLE_VALUE_CRITERIA,
                            isSingleValueCriterion: isSingleValueCriterion
                        }
                    })
                    .then(
                        function() {
                            $timeout(() => {
                                $scope.requestAdmissionRules($scope.index4edit);
                            }, 1000);
                        },
                        function() {
                            admissionControlService.admissionRule4Edit = angular.copy(data);
                        }
                    );
            };

            let error = function() {};

            Utils.keepAlive(success, error);
        };

        $scope.showGlobalActions = function(ev) {
            let success = function() {
                $mdDialog
                    .show({
                        controller: DialogController4GlobalActions,
                        controllerAs: "gblActCtrl",
                        templateUrl: "dialog.globalActions.html",
                        targetEvent: ev,
                        locals: {
                            enable: vm.state,
                            isProtectMode: $scope.isProtect,
                            default_action: $scope.default_action,
                            adm_client_mode_options: $scope.adm_client_mode_options,
                            adm_client_mode: $scope.adm_client_mode,
                            INTERNAL_ERR_CODE,
                            reload: $scope.reload
                        }
                    })
                    .then(
                        function() {},
                        function() {
                            $timeout(function() {
                                $scope.reload();
                            }, 2000);
                        }
                    );
            };

            let error = function() {};

            Utils.keepAlive(success, error);
        };

        $scope.deleteRuleItem = function(event, data) {
            let rowNode = null;
            $scope.index4delete = admissionControlService.getIndex(
                $scope.admissionRules,
                data.id
            );
            rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
                $scope.index4delete
            );
            rowNode.setSelected(true);
            let confirmBox =
                $translate.instant("admissionControl.msg.REMOVE_CONFIRM") + data.id;
            Alertify.confirm(confirmBox).then(
                function toOK() {
                    $http
                        .delete(
                            `${ADMISSION_SINGLE_URL}?scope=fed&id=${data.id}&ruleType=${
                                data.type === "deny" ? "deny" : "exception"
                                }`
                        )
                        .then(function(response) {
                            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                            Alertify.success(
                                $translate.instant("admissionControl.msg.REMOVE_OK")
                            );
                            $timeout(() => {
                                if ($scope.index4delete === $scope.admissionRules.length)
                                    $scope.index4delete--;
                                $scope.requestAdmissionRules($scope.index4delete);
                            }, 1000);
                        })
                        .catch(function(e) {
                            rowNode.setSelected(false);
                            if (
                                USER_TIMEOUT.indexOf(e.status) < 0
                            ) {
                                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                                Alertify.error(
                                  Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.REMOVE_NG"), false)
                                );
                            }
                        });
                },
                function toCancel() {
                    rowNode.setSelected(false);
                }
            );
        };

        $scope.toggleRuleItem = function(event, rule, isCritical) {
            let index4Toggle = admissionControlService.getIndex(
                $scope.admissionRules,
                rule.id
            );
            let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4Toggle);
            if (isCritical) {
                let namespace = "";
                let criteriaStr = JSON.stringify(rule.criteria).toLowerCase();
                if (
                    criteriaStr.indexOf("system") >= 0 ||
                    criteriaStr.indexOf("kube") >= 0
                ) {
                    namespace = "system";
                } else if (criteriaStr.indexOf("neuvector") >= 0) {
                    namespace = "NeuVector";
                }
                let confirmBox = rule.disable
                    ? $translate.instant("admissionControl.msg.ENABLE_CONFIRM_DEFAULT", {
                        namespace: $sanitize(namespace)
                    })
                    : $translate.instant("admissionControl.msg.DISABLE_CONFIRM_DEFAULT", {
                        namespace: $sanitize(namespace)
                    });
                Alertify.confirm(confirmBox).then(
                    function toOK() {
                        sentToggleEnablementReq(event, rule, rowNode);
                    },
                    function toCancel() {}
                );
            } else {
                sentToggleEnablementReq(event, rule, rowNode);
            }
        };

        $scope.toggleAction = function(action) {
            if (action) {
                let payload = {
                    state: {
                        enable: vm.state,
                        mode: $scope.mode,
                        default_action: action
                    }
                };
                $http
                    .patch(ADMCTL_STATE_URL, payload)
                    .then(function(response) {
                        $timeout(function() {
                            $scope.reload($scope.admissionRules.length - 1);
                        }, 2000);
                        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                        Alertify.success(
                            $translate.instant("admissionControl.msg.ACTION_SWITCH_OK")
                        );
                    })
                    .catch(function(err) {
                        if (
                            USER_TIMEOUT.indexOf(err.status) < 0
                        ) {
                            if (
                                err.status === 500 &&
                                err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
                            ) {
                                err = $translate.instant(
                                    "admissionControl.msg.CONFIG_K8S_FAIL"
                                );
                            }
                            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                            Alertify.error(
                              Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.ACTION_SWITCH_NG"), false)
                            );
                        }
                    });
            }
        };

        function sentToggleEnablementReq(event, rule, rowNode) {
            let payload = {
                config: {
                    id: rule.id,
                    category: KUBE,
                    disable: !rule.disable,
                    comment: rule.comment,
                    criteria: rule.criteria,
                    rule_type: rule.rule_type === "deny" ? "deny" : "exception",
                    cfg_type: CFG_TYPE.FED
                }
            };
            let index = admissionControlService.getIndex(
                admissionControlService.admissionRules,
                rule.id
            );
            $http
                .patch(ADMISSION_SINGLE_URL, payload)
                .then(function(response) {
                    Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                    if (rule.disable) {
                        rule.disable = false;
                        Alertify.success(
                            $translate.instant("admissionControl.msg.ENABLE_OK") +
                            " - ID=" +
                            $sanitize(payload.config.id)
                        );
                    } else {
                        rule.disable = true;
                        Alertify.success(
                            $translate.instant("admissionControl.msg.DISABLE_OK") +
                            " - ID=" +
                            $sanitize(payload.config.id)
                        );
                    }
                    $timeout(() => {
                        $scope.requestAdmissionRules(index);
                    }, 2000);
                })
                .catch(function(e) {
                    if (USER_TIMEOUT.indexOf(e.status) < 0 ) {
                        rowNode.setSelected(true);
                        Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                        if (rule.disable) {
                            Alertify.error(
                              Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.DISABLE_NG"), false)
                            );
                        } else {
                            Alertify.error(
                              Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.ENABLE_NG"), false)
                            );
                        }
                    }
                });
        }

        $scope.reset = function() {
            $scope.gridOptions.api.stopEditing();
            $scope.reload();
            $scope.removable = false;
        };

        DialogController4AddAdmRules.$inject = [
            "$scope",
            "$mdDialog",
            "$translate",
            "$sanitize",
            "admissionControlService",
            "ruleType",
            "SINGLE_VALUE_CRITERIA",
            "isSingleValueCriterion",
            "Utils"
        ];
        function DialogController4AddAdmRules(
            $scope,
            $mdDialog,
            $translate,
            $sanitize,
            admissionControlService,
            ruleType,
            SINGLE_VALUE_CRITERIA,
            isSingleValueCriterion,
            Utils
        ) {
            let vm = this;
            const KUBE = "Kubernetes";
            const initializeCriteriaName = function() {
              $scope.names = getCriteriaName($scope.isAllowed ?
                admissionControlService.conditionExceptionOptions :
                admissionControlService.conditionDenyOptions);
            };

            $scope.hasMultiValue = false;
            $scope.isValueSetValid = true;
            $scope.conditionOptionErr = admissionControlService.conditionOptionErr;
            $scope.conditionOptionErrMSG =
                admissionControlService.conditionOptionErrMSG;
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
            if (!$scope.conditionOptionErr) {
                activate();
            }
            $scope.enable = true;
            $scope.newRule = {
                comment: "",
                conditions: [],
                actions: [],
                disable: false
            };
            function getCriteriaName(options) {
              return Object.entries(options).map(
                    ([name, obj]) => {
                      return {
                        originalName: name,
                        displayName: Utils.parseDivideStyle(name),
                        matchSrc: obj.match_src || "",
                        hasMatchSrc: obj.match_src && obj.match_src.length > 0
                      };
                    }
                  );
            }

            $scope.validateValueSet = function(valueSet) {
              let res = true;
              if (
                $scope.newRule.name.originalName.toLowerCase() === "imageregistry"
              ) {
                valueSet.split(",").forEach(curr => {
                  let currValid = /localhost|.+\..+/gm.test(curr.trim());
                  res = res && currValid;
                });
              }
              $scope.isValueSetValid = res;
            };

            function activate() {
                makeAutoCompleteList();
                $scope.isAllowed = false;
                initializeCriteriaName();
                $scope.subNames = [];
                $scope.operators = [];
                $scope.subOperators = [];
                $scope.values = [];
                $scope.pspCriteria = `${$translate.instant("admissionControl.PSP_CRITERIA")} ${admissionControlService.psp_collection.map(pspCriterion => {
                  return $translate.instant(`admissionControl.names.${Utils.parseDivideStyle(pspCriterion.name).toUpperCase()}`);
                }).join(", ")}`;

                $scope.cutStringByMaxLength = function(str, itemName) {
                    let cutStr = Utils.restrictLength4Autocomplete(
                        str,
                        parseInt($translate.instant("general.FILTER_MAX_LEN"), 10)
                    );
                    if (itemName === "searchTextValue") {
                        vm.searchTextValue = cutStr;
                    }
                };
            }

            $scope.tagRemoving = function(tag) {
              if (tag.criteria.name === "pspCompliance") {
                $scope.isPspInstructionVisible = false;
              }
            };

            $scope.showTagDetail = function(tag) {
                if (
                    !$scope.newRule.name ||
                    tag.criteria.name !== $scope.newRule.name.originalName
                ) {
                    $scope.newRule.name = {
                        originalName: tag.criteria.name,
                        displayName: Utils.parseDivideStyle(tag.criteria.name)
                    };
                }

                $timeout(function() {
                    if (tag.criteria.sub_criteria && Array.isArray(tag.criteria.sub_criteria) && tag.criteria.sub_criteria.length > 0) {
                      $scope.newRule.subName = {
                        originalName: tag.criteria.sub_criteria[0].name,
                        displayName: Utils.parseDivideStyle(tag.criteria.sub_criteria[0].name)
                      };
                      $timeout(function() {
                        $scope.newRule.subOperator = tag.criteria.sub_criteria[0].op;
                        $scope.newRule.subValue = tag.criteria.sub_criteria[0].value;
                      }, 200);
                    }

                    if (isSingleValueCriterion(tag.criteria.name)) {
                        $scope.newRule.operator = `${tag.criteria.op}_SINGLE`;
                    } else {
                        $scope.newRule.operator = tag.criteria.op;
                    }
                    $scope.hasMultiValue =
                        $scope.newRule.operator.toLowerCase().indexOf("contains") >= 0;
                    $timeout(function() {
                        $scope.newRule.value = tag.criteria.value;
                    }, 200);
                }, 200);
            };

            $scope.toggleType = function(isAllowed) {
                vm.searchTextValue = "";
                vm.selectedItemValue = null;
                $scope.newRule.value = null;
                $scope.newRule.name = null;
                $scope.newRule.subName = null;
                $scope.newRule.operator = null;
                $scope.newRule.subOperator = null;
                initializeCriteriaName();
                $scope.newRule.conditions = [];
                $scope.subNames = [];
                $scope.operators = [];
                $scope.subOperators = [];
                $scope.values = [];
            };
            $scope.changeName = function(name) {
                vm.searchTextValue = "";
                vm.selectedItemValue = null;
                $scope.newRule.value = null;
                $scope.newRule.operator = null;
                $scope.newRule.subName = null;
                $scope.newRule.subOperator = null;
                $scope.newRule.subValue = null;

                $scope.operators = $scope.isAllowed
                    ? admissionControlService.conditionExceptionOptions[
                        name.originalName
                        ].ops
                    : admissionControlService.conditionDenyOptions[name.originalName]
                        .ops;

                if ($scope.isAllowed) {
                  if (admissionControlService.conditionExceptionOptions[name.originalName] &&
                    admissionControlService.conditionExceptionOptions[name.originalName].sub_options) {
                    $scope.subNames = getCriteriaName(
                      admissionControlService
                      .conditionExceptionOptions[name.originalName]
                      .sub_options
                    );
                  }
                } else {
                  if (admissionControlService.conditionDenyOptions[name.originalName] &&
                    admissionControlService.conditionDenyOptions[name.originalName].sub_options) {
                    $scope.subNames = getCriteriaName(
                      admissionControlService
                      .conditionDenyOptions[name.originalName]
                      .sub_options
                    );
                  }
                }

                $scope.values =
                  $scope.isAllowed
                      ? admissionControlService.conditionExceptionOptions[
                      name.originalName
                      ].values || []
                      : admissionControlService.conditionDenyOptions[name.originalName]
                      .values || [];

                if (isSingleValueCriterion(name.originalName)) {
                    $scope.operators = $scope.operators.map(function(op) {
                        return `${op}_SINGLE`;
                    });
                }

                $scope.hasMultiValue = false;
                if ($scope.operators.length === 1) {
                    $scope.newRule.operator = $scope.operators[0];
                    if (
                        $scope.newRule.name.originalName === "imageSigned"
                    ) {
                        $scope.newRule.value = "false";
                    }
                    if (
                        $scope.newRule.name.originalName === "runAsRoot" ||
                        $scope.newRule.name.originalName === "runAsPrivileged" ||
                        $scope.newRule.name.originalName === "allowPrivEscalation" ||
                        $scope.newRule.name.originalName === "pspCompliance"
                    ) {
                        $scope.newRule.value = "true";
                    }
                }

                if ($scope.subNames.length === 1) {
                  $scope.newRule.subName = $scope.subNames[0];
                  $scope.changeSubNames(name, $scope.newRule.subName);
                }

                if (
                    $scope.newRule.name.originalName === "imageSigned" ||
                    $scope.newRule.name.originalName === "runAsRoot" ||
                    $scope.newRule.name.originalName === "runAsPrivileged" ||
                    $scope.newRule.name.originalName === "allowPrivEscalation" ||
                    $scope.newRule.name.originalName === "pspCompliance"

                ) {
                    $scope.isBooleanCriteria = true;
                } else {
                    $scope.isBooleanCriteria = false;
                }
            };

            $scope.changeSubNames = function(name, subName) {
              if ($scope.isAllowed) {
                if (admissionControlService.conditionExceptionOptions[name.originalName] &&
                  admissionControlService.conditionExceptionOptions[name.originalName].sub_options) {
                  $scope.subOperators = admissionControlService
                                        .conditionExceptionOptions[name.originalName]
                                        .sub_options[subName.originalName]
                                        .ops;
                }
              } else {
                if (admissionControlService.conditionDenyOptions[name.originalName] &&
                  admissionControlService.conditionDenyOptions[name.originalName].sub_options) {
                  $scope.subOperators = admissionControlService
                                        .conditionDenyOptions[name.originalName]
                                        .sub_options[subName.originalName]
                                        .ops;
                }
              }
              console.log("$scope.subOperators: ", $scope.subOperators)
              if ($scope.subOperators.length === 1) {
                $scope.newRule.subOperator = $scope.subOperators[0];
              }
            };

            $scope.getSubOperatorText = function(subName, op) {
              if (subName.originalName === "publishDays") {
                return $translate.instant(`admissionControl.operators.text.${op}`);
              } else {
                return $translate.instant(`admissionControl.operators.${op}`);
              }
            };

            $scope.changeOperator = function(op) {
                $scope.hasMultiValue = op.toLowerCase().indexOf("contains") >= 0;
                if (
                    $scope.newRule.name.originalName !== "imageSigned" &&
                    $scope.newRule.name.originalName !== "runAsRoot" &&
                    $scope.newRule.name.originalName !== "runAsPrivileged" &&
                    $scope.newRule.name.originalName !== "allowPrivEscalation" &&
                    $scope.newRule.name.originalName !== "pspCompliance"
                ) {
                    vm.searchTextValue = "";
                    vm.selectedItemValue = null;
                    $scope.newRule.value = null;
                }
            };

            function makeAutoCompleteList() {
                vm.autoValues = loadAll();
                vm.selectedItemValue = null;
                vm.searchTextValue = null;
                function loadAll() {
                    let allGroup = admissionControlService.groupList
                        ? admissionControlService.groupList
                        : [];
                    return allGroup.map(function(group) {
                        return {
                            value: group,
                            display: group
                        };
                    });
                }
            }

            const checkAndPushCriteria = function(name, newRule) {
              let isDuplicated = false;
              $scope.newRule.conditions = $scope.newRule.conditions.filter(function(
                condition
              ) {
                return (
                  condition.criteria.name !== newRule.name.originalName ||
                  condition.criteria.op !== newRule.operator
                );
              });
              $scope.newRule.conditions.forEach(function(condition) {
                if (name === condition.name) isDuplicated = true;
              });
              if (!isDuplicated) {
                let subCriteia = [];
                if (newRule.subValue) {
                  subCriteia.push({
                    name: newRule.subName.originalName,
                    op: newRule.subOperator,
                    value: newRule.subValue
                  });
                }
                $scope.newRule.conditions.push({
                  name: name,
                  criteria: {
                    sub_criteria: subCriteia,
                    name: newRule.name.originalName,
                    op: newRule.operator,
                    value: newRule.value
                  }
                });
              }
            };

            vm.addCriteria = function() {
                // if ($scope.values.length === 0) {
                //   if (vm.selectedItemValue === null) {
                //     $scope.newRule.value = vm.searchTextValue;
                //   } else {
                //     $scope.newRule.value = vm.selectedItemValue.value;
                //   }
                // }
                if (isSingleValueCriterion($scope.newRule.name.originalName)) {
                    $scope.newRule.operator = $scope.newRule.operator.split("_SINGLE")[0];
                }
                let name = "";
                if (
                    $scope.newRule.name.originalName === "imageSigned" ||
                    $scope.newRule.name.originalName === "runAsRoot" ||
                    $scope.newRule.name.originalName === "runAsPrivileged" ||
                    $scope.newRule.name.originalName === "allowPrivEscalation" ||
                    $scope.newRule.name.originalName === "pspCompliance"
                ) {
                    if ($scope.newRule.name.originalName === "pspCompliance") {
                      $scope.isPspInstructionVisible = true;
                    }
                    name = $translate.instant(
                        `admissionControl.names.${$scope.newRule.name.displayName.toUpperCase()}`
                    );
                    checkAndPushCriteria(name, $scope.newRule);
                } else if (
                  (
                    $scope.newRule.name.originalName === "cveHighCount" ||
                    $scope.newRule.name.originalName === "cveHighWithFixCount" ||
                    $scope.newRule.name.originalName === "cveMediumCount"
                  ) && $scope.newRule.subValue
                ) {
                  name = $translate.instant(
                    `admissionControl.display.${Utils.parseDivideStyle(
                      $scope.newRule.name.originalName
                    ).toUpperCase()}_WITH_REPORT_DAYS`,
                    {
                      comparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${$scope.newRule.operator}`)),
                      count: $scope.newRule.value
                    }
                  ) + " " +
                  $translate.instant(
                    `admissionControl.display.${Utils.parseDivideStyle(
                      $scope.newRule.operator)}`,
                    {
                      days: $scope.newRule.subValue
                    }
                  );
                  checkAndPushCriteria(name, $scope.newRule);
                } else {
                    let value =
                        $scope.newRule.value.length > 30
                            ? `${$scope.newRule.value.substring(0, 30)}...`
                            : $scope.newRule.value;
                    value =
                        $scope.newRule.operator.toLowerCase().indexOf("contains") >= 0
                            ? `[${value}]`
                            : value;
                    name = `${$translate.instant(
                        `admissionControl.names.${$scope.newRule.name.displayName.toUpperCase()}`
                    )} ${$translate.instant(
                        `admissionControl.operators.${
                            isSingleValueCriterion($scope.newRule.name.originalName)
                                ? `${$scope.newRule.operator.toUpperCase()}_SINGLE`
                                : $scope.newRule.operator.toUpperCase()
                            }`
                    )} ${value}`;
                    checkAndPushCriteria(name, $scope.newRule);
                }

                vm.searchTextValue = "";
                vm.selectedItemValue = null;
                $scope.newRule.value = null;
                $scope.newRule.name = null;
                $scope.newRule.operator = null;
                $scope.operators = [];
                $scope.values = [];
                $scope.hasMultiValue = false;
                $scope.isBooleanCriteria = false;
            };

            //
            $scope.addNewRule = function(ev) {
                $scope.newRule.disable = !$scope.enable;

                let payload = {
                    config: {
                        id: 0,
                        category: KUBE,
                        comment: $scope.newRule.comment,
                        criteria: $scope.newRule.conditions.map(function(condition) {
                            return condition.criteria;
                        }),
                        disable: $scope.newRule.disable,
                        rule_type: $scope.isAllowed ? "exception" : "deny",
                        cfg_type: CFG_TYPE.FED
                    }
                };
                $http
                    .post(ADMISSION_SINGLE_URL, payload)
                    .then(function(response) {
                        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                        Alertify.success(
                            $translate.instant("admissionControl.msg.INSERT_OK")
                        );
                    })
                    .catch(function(e) {
                        console.warn(e);
                        if (USER_TIMEOUT.indexOf(e.status) < 0 ) {
                            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                            Alertify.error(
                              Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.INSERT_NG"), false)
                            );
                        }
                    });
                $mdDialog.hide();
                $scope.isPspInstructionVisible = false;
            };
        }
        DialogController4EditAdmRules.$inject = [
            "$scope",
            "$mdDialog",
            "$translate",
            "$sanitize",
            "admissionControlService",
            "ruleType",
            "isViewOnly",
            "SINGLE_VALUE_CRITERIA",
            "isSingleValueCriterion",
            "Utils"
        ];
        function DialogController4EditAdmRules(
            $scope,
            $mdDialog,
            $translate,
            $sanitize,
            admissionControlService,
            ruleType,
            isViewOnly,
            SINGLE_VALUE_CRITERIA,
            isSingleValueCriterion,
            Utils
        ) {
            let vm = this;
            let isAllowed = false;
            const KUBE = "Kubernetes";
            $scope.isViewOnly = isViewOnly;
            $scope.isValueSetValid = true;
            $scope.hasMultiValue = false;
            $scope.conditionOptionErr = admissionControlService.conditionOptionErr;
            $scope.conditionOptionErrMSG =
                admissionControlService.conditionOptionErrMSG;
            $scope.hide = function() {
                $mdDialog.hide();
            };
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
            function getCriteriaName(options) {
              return Object.entries(options).map(
                    ([name, obj]) => {
                      return {
                        originalName: name,
                        displayName: Utils.parseDivideStyle(name),
                        matchSrc: obj.match_src || "",
                        hasMatchSrc: obj.match_src && obj.match_src.length > 0
                      };
                    }
                  );
            }

            $scope.validateValueSet = function(valueSet) {
              let res = true;
              if (
                $scope.admissionRule.name.originalName.toLowerCase() ===
                "imageregistry"
              ) {
                valueSet.split(",").forEach(curr => {
                  let currValid = /localhost|.+\..+/gm.test(curr.trim());
                  res = res && currValid;
                });
              }
              $scope.isValueSetValid = res;
            };

            if (!$scope.conditionOptionErr) {
                activate();
            }
            function activate() {
                makeAutoCompleteList();
                $scope.admissionRule = admissionControlService.admissionRule4Edit;
                isAllowed = $scope.admissionRule.rule_type === "exception";
                $scope.labelColor = colourMap[$scope.admissionRule.rule_type.toLowerCase()];
                $scope.labeValue = $translate.instant(
                    "admissionControl." + $scope.admissionRule.rule_type.toUpperCase()
                );
                $scope.names = getCriteriaName($scope.isAllowed ?
                  admissionControlService.conditionExceptionOptions :
                  admissionControlService.conditionDenyOptions);
                $scope.subNames = [];
                $scope.operators = [];
                $scope.subOperators = [];
                $scope.values = [];
                $scope.pspCriteria = `${$translate.instant("admissionControl.PSP_CRITERIA")} ${admissionControlService.psp_collection.map(pspCriterion => {
                  return $translate.instant(`admissionControl.names.${Utils.parseDivideStyle(pspCriterion.name).toUpperCase()}`);
                }).join(", ")}`;

                vm.enable = !$scope.admissionRule.disable;

                $scope.admissionRule.criteria = $scope.admissionRule.criteria.map(
                    function(criteria) {
                        let isBooleanCriteria =
                            criteria.name === "imageSigned" ||
                            criteria.name === "runAsRoot" ||
                            criteria.name === "runAsPrivileged" ||
                            criteria.name === "allowPrivEscalation" ||
                            criteria.name === "pspCompliance";
                        let hasSubOptions =
                        (
                          criteria.name === "cveHighCount" ||
                          criteria.name === "cveHighWithFixCount" ||
                          criteria.name === "cveMediumCount"
                        ) && criteria.sub_criteria;
                        if (criteria.name === "pspCompliance") {
                          $scope.isPspInstructionVisible = true;
                        }
                        return {
                            origin: criteria,
                            tagged: admissionControlService.admissionConditionObjToString(
                                criteria,
                                isBooleanCriteria,
                                hasSubOptions,
                                isSingleValueCriterion(criteria.name)
                            )
                        };
                    }
                );

                $scope.cutStringByMaxLength = function(str, itemName) {
                    let cutStr = Utils.restrictLength4Autocomplete(
                        str,
                        parseInt($translate.instant("general.FILTER_MAX_LEN"), 10)
                    );
                    if (itemName === "searchTextValue") {
                        vm.searchTextValue = cutStr;
                    }
                };
            }

            let prevTag = null;

            $scope.tagRemoving = function(tag) {
              if (tag.origin.name === "pspCompliance") {
                $scope.isPspInstructionVisible = false;
              }
            };

            $scope.showTagDetail = function(tag) {
                if (
                    !$scope.admissionRule.name ||
                    tag.origin.name !== $scope.admissionRule.name.originalName
                ) {
                    $scope.admissionRule.name = {
                        originalName: tag.origin.name,
                        displayName: Utils.parseDivideStyle(tag.origin.name)
                    };
                }

                $timeout(function() {
                    if (tag.origin.sub_criteria && Array.isArray(tag.origin.sub_criteria) && tag.origin.sub_criteria.length > 0) {
                      $scope.admissionRule.subName = {
                        originalName: tag.origin.sub_criteria[0].name,
                        displayName: Utils.parseDivideStyle(tag.origin.sub_criteria[0].name)
                      };
                      $timeout(function() {
                        $scope.admissionRule.subOperator = tag.origin.sub_criteria[0].op;
                        $scope.admissionRule.subValue = tag.origin.sub_criteria[0].value;
                      }, 200);
                    }

                    if (isSingleValueCriterion(tag.origin.name)) {
                        $scope.admissionRule.operator = `${tag.origin.op}_SINGLE`;
                    } else {
                        $scope.admissionRule.operator = tag.origin.op;
                    }
                    $scope.hasMultiValue =
                        $scope.admissionRule.operator.toLowerCase().indexOf("contains") >=
                        0;
                    $timeout(function() {
                        $scope.admissionRule.value = tag.origin.value;
                    }, 200);
                }, 200);
                prevTag = tag;
            };

            $scope.changeName = function(name) {
                vm.searchTextValue = "";
                vm.selectedItemValue = null;
                $scope.admissionRule.value = null;
                $scope.admissionRule.operator = null;
                $scope.admissionRule.subName = null;
                $scope.admissionRule.subOperator = null;
                $scope.admissionRule.subValue = null;
                $scope.operators = isAllowed
                    ? admissionControlService.conditionExceptionOptions[
                        name.originalName
                        ].ops
                    : admissionControlService.conditionDenyOptions[name.originalName]
                        .ops;

                if ($scope.isAllowed) {
                  if (admissionControlService.conditionExceptionOptions[name.originalName] &&
                    admissionControlService.conditionExceptionOptions[name.originalName].sub_options) {
                    $scope.subNames = getCriteriaName(
                      admissionControlService
                      .conditionExceptionOptions[name.originalName]
                      .sub_options
                    );
                  }
                } else {
                  if (admissionControlService.conditionDenyOptions[name.originalName] &&
                    admissionControlService.conditionDenyOptions[name.originalName].sub_options) {
                    $scope.subNames = getCriteriaName(
                      admissionControlService
                      .conditionDenyOptions[name.originalName]
                      .sub_options
                    );
                  }
                }

                $scope.values =
                  $scope.isAllowed
                      ? admissionControlService.conditionExceptionOptions[
                      name.originalName
                      ].values || []
                      : admissionControlService.conditionDenyOptions[name.originalName]
                      .values || [];

                if (isSingleValueCriterion(name.originalName)) {
                    $scope.operators = $scope.operators.map(function(op) {
                        return `${op}_SINGLE`;
                    });
                }

                $scope.hasMultiValue = false;
                if ($scope.operators.length === 1) {
                    $scope.admissionRule.operator = $scope.operators[0];
                    if (
                        $scope.admissionRule.name.originalName === "imageSigned"
                    ) {
                        $scope.admissionRule.value = "false";
                    }
                    if (
                        $scope.admissionRule.name.originalName === "runAsRoot" ||
                        $scope.admissionRule.name.originalName === "runAsPrivileged" ||
                        $scope.admissionRule.name.originalName === "allowPrivEscalation" ||
                        $scope.admissionRule.name.originalName === "pspCompliance"
                    ) {
                        $scope.admissionRule.value = "true";
                    }
                }

                if ($scope.subNames.length === 1) {
                  $scope.admissionRule.subName = $scope.subNames[0];
                  $scope.changeSubNames(name, $scope.admissionRule.subName);
                }

                if (
                    $scope.admissionRule.name.originalName === "imageSigned" ||
                    $scope.admissionRule.name.originalName === "runAsRoot" ||
                    $scope.admissionRule.name.originalName === "runAsPrivileged" ||
                    $scope.admissionRule.name.originalName === "allowPrivEscalation" ||
                    $scope.admissionRule.name.originalName === "pspCompliance"
                ) {
                    $scope.isBooleanCriteria = true;
                } else {
                    $scope.isBooleanCriteria = false;
                }
            };

            $scope.changeSubNames = function(name, subName) {
              console.log(name, subName)
              if ($scope.isAllowed) {
                if (admissionControlService.conditionExceptionOptions[name.originalName] &&
                  admissionControlService.conditionExceptionOptions[name.originalName].sub_options) {
                  $scope.subOperators = admissionControlService
                                        .conditionExceptionOptions[name.originalName]
                                        .sub_options[subName.originalName]
                                        .ops;
                }
              } else {
                if (admissionControlService.conditionDenyOptions[name.originalName] &&
                  admissionControlService.conditionDenyOptions[name.originalName].sub_options) {
                  $scope.subOperators = admissionControlService
                                        .conditionDenyOptions[name.originalName]
                                        .sub_options[subName.originalName]
                                        .ops;
                }
              }
              if ($scope.subOperators.length === 1) {
                $scope.admissionRule.subOperator = $scope.subOperators[0];
              }
            };

            $scope.getSubOperatorText = function(subName, op) {
              if (subName.originalName === "publishDays") {
                return $translate.instant(`admissionControl.operators.text.${op}`);
              } else {
                return $translate.instant(`admissionControl.operators.${op}`);
              }
            };

            $scope.changeOperator = function(op) {
                $scope.hasMultiValue = op.toLowerCase().indexOf("contains") >= 0;
                if (
                    $scope.admissionRule.name.originalName !== "imageSigned" &&
                    $scope.admissionRule.name.originalName !== "runAsRoot" &&
                    $scope.admissionRule.name.originalName !== "runAsPrivileged" &&
                    $scope.admissionRule.name.originalName !== "allowPrivEscalation" &&
                    $scope.admissionRule.name.originalName !== "pspCompliance"
                ) {
                    vm.searchTextValue = "";
                    vm.selectedItemValue = null;
                    $scope.admissionRule.value = null;
                }
            };

            function makeAutoCompleteList() {
                vm.autoValues = loadAll();
                vm.selectedItemValue = null;
                vm.searchTextValue = null;
                function loadAll() {
                    let allGroup = admissionControlService.groupList
                        ? admissionControlService.groupList
                        : [];
                    return allGroup.map(function(group) {
                        return {
                            value: group,
                            display: group
                        };
                    });
                }
            }

            const checkAndPushCriteria = function(name, admissionRule) {
              let isDuplicated = false;
              $scope.admissionRule.criteria = $scope.admissionRule.criteria.filter(function(
                condition
              ) {
                return (
                  condition.origin.name !== admissionRule.name.originalName ||
                  condition.origin.op !== admissionRule.operator
                );
              });
              $scope.admissionRule.criteria.forEach(function(condition) {
                if (name === condition.tagged) isDuplicated = true;
              });
              if (!isDuplicated) {
                let subCriteia = [];
                if (admissionRule.subValue) {
                  subCriteia.push({
                    name: admissionRule.subName.originalName,
                    op: admissionRule.subOperator,
                    value: admissionRule.subValue
                  });
                }
                $scope.admissionRule.criteria.push({
                  tagged: name,
                  origin: {
                    sub_criteria: subCriteia,
                    name: admissionRule.name.originalName,
                    op: admissionRule.operator,
                    value: admissionRule.value
                  }
                });
              }
            };

            vm.addCriteria = function() {
                // if ($scope.values.length === 0) {
                //   if (vm.selectedItemValue === null) {
                //     $scope.admissionRule.value = vm.searchTextValue;
                //   } else {
                //     $scope.admissionRule.value = vm.selectedItemValue.value;
                //   }
                // }
                if (isSingleValueCriterion($scope.admissionRule.name.originalName)) {
                    $scope.admissionRule.operator = $scope.admissionRule.operator.split(
                        "_SINGLE"
                    )[0];
                }

                let tag = "";
                if (
                    $scope.admissionRule.name.originalName === "imageSigned" ||
                    $scope.admissionRule.name.originalName === "runAsRoot" ||
                    $scope.admissionRule.name.originalName === "runAsPrivileged" ||
                    $scope.admissionRule.name.originalName === "allowPrivEscalation" ||
                    $scope.admissionRule.name.originalName === "pspCompliance"
                ) {
                    if ($scope.admissionRule.name.originalName === "pspCompliance") {
                      $scope.isPspInstructionVisible = true;
                    }
                    tag = $translate.instant(
                        `admissionControl.names.${$scope.admissionRule.name.displayName.toUpperCase()}`
                    );
                    checkAndPushCriteria(tag, $scope.admissionRule);
                } else if (
                  (
                    $scope.admissionRule.name.originalName === "cveHighCount" ||
                    $scope.admissionRule.name.originalName === "cveHighWithFixCount" ||
                    $scope.admissionRule.name.originalName === "cveMediumCount"
                  ) && $scope.admissionRule.subValue
                ) {
                  tag = $translate.instant(
                    `admissionControl.display.${Utils.parseDivideStyle(
                      $scope.admissionRule.name.originalName
                    ).toUpperCase()}_WITH_REPORT_DAYS`,
                    {
                      comparison: Utils.capitalizeWord($translate.instant(`admissionControl.operators.text.${$scope.admissionRule.operator}`)),
                      count: $scope.admissionRule.value
                    }
                  ) + " " +
                  $translate.instant(
                    `admissionControl.display.${Utils.parseDivideStyle(
                      $scope.admissionRule.operator)}`,
                    {
                      days: $scope.admissionRule.subValue
                    }
                  );
                  checkAndPushCriteria(tag, $scope.admissionRule);
                } else {
                    let value =
                        $scope.admissionRule.value.length > 30
                            ? `${$scope.admissionRule.value.substring(0, 30)}...`
                            : $scope.admissionRule.value;
                    value = $scope.hasMultiValue ? `[${value}]` : value;
                    tag = `${$translate.instant(
                        `admissionControl.names.${$scope.admissionRule.name.displayName.toUpperCase()}`
                    )} ${$translate.instant(
                        `admissionControl.operators.${
                            isSingleValueCriterion($scope.admissionRule.name.originalName)
                                ? `${$scope.admissionRule.operator.toUpperCase()}_SINGLE`
                                : $scope.admissionRule.operator.toUpperCase()
                            }`
                    )} ${value}`;
                    checkAndPushCriteria(tag, $scope.admissionRule);
                }

                vm.searchTextValue = "";
                vm.selectedItemValue = null;
                $scope.admissionRule.value = null;
                $scope.admissionRule.name = null;
                $scope.admissionRule.operator = null;
                $scope.operators = [];
                $scope.values = [];
                $scope.hasMultiValue = false;
                $scope.isBooleanCriteria = false;
            };

            $scope.editRule = function(ev) {
                let payload = {
                    config: {
                        id: $scope.admissionRule.id,
                        category: KUBE,
                        comment: $scope.admissionRule.comment,
                        criteria: $scope.admissionRule.criteria.map(function(condition) {
                            return condition.origin;
                        }),
                        disable: !vm.enable,
                        rule_type: isAllowed ? "exception" : "deny",
                        cfg_type: CFG_TYPE.FED
                    }
                };

                $http
                    .patch(ADMISSION_SINGLE_URL, payload)
                    .then(function(response) {
                        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                        Alertify.success(
                            $translate.instant("admissionControl.msg.UPDATE_OK") +
                            " - ID=" +
                            $sanitize(payload.config.id)
                        );
                    })
                    .catch(function(e) {
                        if (USER_TIMEOUT.indexOf(e.status) < 0 ) {
                            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                            console.log(e.data);
                            Alertify.error(
                              Utils.getAlertifyMsg(e, $translate.instant("admissionControl.msg.UPDATE_NG"), false)
                            );
                        }
                    });
                $mdDialog.hide();
                $scope.isPspInstructionVisible = false;
            };
        }
    }

    DialogController4GlobalActions.$inject = [
        "$scope",
        "$mdDialog",
        "$translate",
        "$http",
        "$timeout",
        "Utils",
        "Alertify",
        "enable",
        "isProtectMode",
        "default_action",
        "adm_client_mode_options",
        "adm_client_mode",
        "INTERNAL_ERR_CODE",
        "reload"
    ];

    function DialogController4GlobalActions(
        $scope,
        $mdDialog,
        $translate,
        $http,
        $timeout,
        Utils,
        Alertify,
        enable,
        isProtectMode,
        default_action,
        adm_client_mode_options,
        adm_client_mode,
        INTERNAL_ERR_CODE,
        reload
    ) {
        let vm = this;
        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.copied = {
            service: false,
            url: false
        };
        $scope.isTesting = false;
        $scope.submitClientMode = function(form) {
            let payload = {
                state: {
                    enable: enable,
                    mode: isProtectMode ? "protect" : "monitor",
                    default_action: default_action,
                    adm_client_mode: vm.adm_client_mode,
                    adm_client_mode_options: adm_client_mode_options
                }
            };
            $http
                .patch(ADMCTL_STATE_URL, payload)
                .then(function(response) {
                    Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                    Alertify.success(
                        $translate.instant("admissionControl.msg.CLIENT_MODE_SWITCH_OK")
                    );
                    reload();
                    form.$setPristine(true);
                })
                .catch(function(err) {
                    if (
                        USER_TIMEOUT.indexOf(err.status) < 0
                    ) {
                        if (
                            err.status === 500 &&
                            err.data.code === INTERNAL_ERR_CODE.CONFIG_K8S_FAIL
                        ) {
                            err = $translate.instant(
                                "admissionControl.msg.CONFIG_K8S_FAIL"
                            );
                        }
                        Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                        Alertify.error(
                          Utils.getAlertifyMsg(err, $translate.instant("admissionControl.msg.CLIENT_MODE_SWITCH_NG"), false)
                        );
                        $timeout(function() {
                            $scope.isProtect = !isProtect;
                            $scope.$apply();
                        }, 4000);
                    }
                });
        };

        $scope.success = function(mode) {
            $scope.copied[mode] = true;
            setTimeout(function() {
                $scope.copied[mode] = false;
                $scope.$apply();
            }, 3000);
        };

        $scope.testK8s = function() {
            $scope.isK8sTestErr = false;
            $scope.isK8sTestOK = false;
            $scope.isTesting = true;
            $http
                .get(ADM_CTRL_K8S_TEST)
                .then(function(response) {
                    $scope.isK8sTestOK = true;
                    $scope.isTesting = false;
                })
                .catch(function(error) {
                    console.log(error);
                    $scope.isTesting = false;
                    $scope.isK8sTestErr = true;
                    if (error.status === 404) {
                        switch (error.data.code) {
                            case INTERNAL_ERR_CODE.CLUSTER_ROLE_NOT_CONFIG:
                                $scope.testErrMsg = $translate.instant(
                                    "partner.admissionControl.msg.CLUSTER_ROLE_NOT_CONFIG"
                                );
                                break;
                            case INTERNAL_ERR_CODE.WEBHOOK_NOT_CONFIG:
                                $scope.testErrMsg = $translate.instant(
                                    "partner.admissionControl.msg.WEBHOOK_NOT_CONFIG"
                                );
                                break;
                            case INTERNAL_ERR_CODE.NO_UPD_PROMISSION:
                                $scope.testErrMsg = $translate.instant(
                                    "partner.admissionControl.msg.NO_UPD_PROMISSION"
                                );
                                break;
                            case INTERNAL_ERR_CODE.ERR_SRV2WEBHOOK:
                                $scope.testErrMsg = $translate.instant(
                                    "admissionControl.msg.ERR_SRV2WEBHOOK"
                                );
                                break;
                            default:
                                $scope.testErrMsg = Utils.getErrorMessage(error);
                        }
                    } else {
                        $scope.testErrMsg = Utils.getErrorMessage(error);
                    }
                });
        };

        activate();
        function activate() {
            $scope.isProtect = isProtectMode;
            $scope.adm_client_mode_options = adm_client_mode_options;
            vm.adm_client_mode = adm_client_mode;
        }
    }
})();
