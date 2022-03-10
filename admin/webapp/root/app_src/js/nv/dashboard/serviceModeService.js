(function() {
  "use strict";
  angular
    .module("app.dashboard")
    .factory("ServiceModeFactory", function ServiceModeFactory(
      $translate,
      $filter,
      $window,
      $timeout,
      $http,
      $sanitize,
      Utils,
      Alertify
    ) {

      ServiceModeFactory.init = function() {
        ServiceModeFactory.serviceMode = {
          currScore: {
            value: 0,
            test: ""
          },
          futureScore: {
            value: 0,
            test: ""
          },
          description: $translate.instant("dashboard.improveScoreModal.serviceMode.DESCRIPTION")
        };
      }

      ServiceModeFactory.constructGrids = function() {
        let resizeEvent = "resize.ag-grid";
        let $win = $($window);
        let isCheckAll = false;
        ServiceModeFactory.isMultipleSelecting = false;

        ServiceModeFactory.filterKey = "";
        ServiceModeFactory.isSwitchingMode = [false];
        ServiceModeFactory.prevSelectedName = "";

        ServiceModeFactory.forAll = false;

        function dateComparator(value1, value2, node1, node2) {
          /** @namespace node1.data.last_modified_timestamp */
          return (
            node1.data.last_modified_timestamp -
            node2.data.last_modified_timestamp
          );
        }

        ////// Service-rules grid
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
                return `<span class="label label-fs label-${labelCode}">${$sanitize(mode)}</span>`;
              } else return null;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          },
          {
            headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
            field: "last_modified_timestamp",
            cellRenderer: function(params) {
              if (params.value) {
                return $sanitize($filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss"));
              }
            },
            comparator: dateComparator,
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
            },
            minWidth: 160,
            maxWidth: 170
          }
        ];

        let profileColumnDefs = [
          {
            headerName: $translate.instant("service.gridHeader.NAME"),
            field: "name"
          },
          {
            headerName: $translate.instant("service.gridHeader.PATH"),
            field: "path"
          },
          {
            headerName: $translate.instant("policy.addPolicy.DENY_ALLOW"),
            field: "action",
            cellRenderer: function(params) {
              if (params.value) {
                let mode = Utils.getI18Name(params.value);
                let labelCode = colourMap[params.value];
                if (!labelCode) labelCode = "info";
                return `<span class="label label-fs label-${labelCode}">${$sanitize(mode)}</span>`;
              } else return null;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          }
        ];

        let fileColumnDefs = [
          {
            headerName: $translate.instant("service.gridHeader.FILTER"),
            field: "filter"
          },
          {
            headerName: $translate.instant("policy.gridHeader.UPDATE_AT"),
            field: "last_modified_timestamp",
            cellRenderer: function(params) {
              if (params.value) {
                return $sanitize($filter("date")(params.value * 1000, "MMM dd, y HH:mm:ss"));
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
            },
            comparator: dateComparator
          },
          {
            headerName: $translate.instant("policy.addPolicy.DENY_ALLOW"),
            cellRenderer: function() {
              if (ServiceModeFactory.service && ServiceModeFactory.service.policy_mode === "Protect") {
                return `<span class="label label-fs label-danger">${Utils.getI18Name(
                  "deny"
                )}</span>`;
              } else
                return `<span class="label label-fs label-deny">${Utils.getI18Name(
                  "deny"
                )}</span>`;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90
          }
        ];

        ServiceModeFactory.toggleSystemService = function(hideService) {
          ServiceModeFactory.hideSystemService = hideService;
          if (hideService) {
            if (ServiceModeFactory.services) {
              ServiceModeFactory.services = ServiceModeFactory.services.filter(function(item) {
                return !item.platform_role;
              });
              ServiceModeFactory.gridService.api.setRowData(ServiceModeFactory.services.filter(service => !service.platform_role));

              ServiceModeFactory.onFilterChanged(ServiceModeFactory.filterKey);
            }
          } else ServiceModeFactory.refresh();
        };

        ServiceModeFactory.reviewRule = function() {
          ServiceModeFactory.onRule = true;
          ServiceModeFactory.rule.allowed = ServiceModeFactory.rule.action === "allow";
        };

        function onSelectionChanged4Rule() {
          if (ServiceModeFactory.gridRules && ServiceModeFactory.gridRules.api) {
            let selectedRows = ServiceModeFactory.gridRules.api.getSelectedRows();
            if (selectedRows.length > 0) {
              $timeout(function() {
                ServiceModeFactory.rule = selectedRows[0];
                ServiceModeFactory.rule.allowed = ServiceModeFactory.rule.action === "allow";
                ServiceModeFactory.ruleReady = true;
              });
            }
          }
        }

        function onSelectionChanged4Profile() {
          if (ServiceModeFactory.gridProfile && ServiceModeFactory.gridProfile.api) {
            let selectedRows = ServiceModeFactory.gridProfile.api.getSelectedRows();
            if (selectedRows.length > 0) {
              $timeout(function() {
                ServiceModeFactory.profileEntry = selectedRows[0];
              });
            }
          }
        }

        function onSelectionChanged4File() {
          if (ServiceModeFactory.gridFile && ServiceModeFactory.gridFile.api) {
            let selectedRows = ServiceModeFactory.gridFile.api.getSelectedRows();
            if (selectedRows.length > 0) {
              $timeout(function() {
                ServiceModeFactory.fileEntry = selectedRows[0];
              });
            }
          }
        }

        ServiceModeFactory.gridRules = {
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
          onSelectionChanged: onSelectionChanged4Rule,
          onGridReady: function(params) {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
            $win.on(resizeEvent, function() {
              setTimeout(function() {
                params.api.sizeColumnsToFit();
              }, 500);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`
        };

        ServiceModeFactory.gridProfile = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: false,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: profileColumnDefs,
          rowData: null,
          animateRows: true,
          rowSelection: "single",
          onSelectionChanged: onSelectionChanged4Profile,
          onGridReady: function(params) {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
            $win.on(resizeEvent, function() {
              setTimeout(function() {
                params.api.sizeColumnsToFit();
              }, 500);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`
        };

        ServiceModeFactory.gridFile = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: fileColumnDefs,
          rowData: null,
          animateRows: true,
          rowSelection: "single",
          onSelectionChanged: onSelectionChanged4File,
          onGridReady: function(params) {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
            $win.on(resizeEvent, function() {
              setTimeout(function() {
                params.api.sizeColumnsToFit();
              }, 500);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`
        };

        ServiceModeFactory.renderServices = function(services, filter) {
          $timeout(function() {
            ServiceModeFactory.gridService.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
              "general.NO_ROWS"
            )}</span>`;
            ServiceModeFactory.services = services;
            ServiceModeFactory.isAllProtectMode[0] =
              services.map(service => service.policy_mode)
                      .filter(serviceMode => serviceMode.toLowerCase() !== "protect")
                      .length === 0;
            if (services) {
              ServiceModeFactory.gridService.api.setRowData(services.filter(service => !service.platform_role));
              setTimeout(function() {
                if (ServiceModeFactory.gridService.api) {
                  ServiceModeFactory.gridService.api.forEachNode(function(node, index) {
                    if (ServiceModeFactory.service) {
                      if (node.data.name === ServiceModeFactory.service.name) {
                        node.setSelected(true);
                        ServiceModeFactory.gridService.api.ensureNodeVisible(node);
                      }
                    } else if (index === 0) {
                      node.setSelected(true);
                      ServiceModeFactory.gridService.api.ensureNodeVisible(node);
                    }
                  });
                }
              }, 50);
              ServiceModeFactory.onFilterChanged(ServiceModeFactory.filterKey);
            }
          });
        };

        ServiceModeFactory.renderServiceRules = function(rules) {
          $timeout(function() {
            ServiceModeFactory.gridRules.api.setRowData(rules);
            ServiceModeFactory.gridRules.api.forEachNode(function(node, index) {
              if (ServiceModeFactory.rule) {
                if (node.data.id === ServiceModeFactory.rule.id) {
                  node.setSelected(true);
                  ServiceModeFactory.gridRules.api.ensureNodeVisible(node);
                }
              } else if (index === 0) {
                node.setSelected(true);
                ServiceModeFactory.gridRules.api.ensureNodeVisible(node);
              }
            });
            ServiceModeFactory.gridRules.api.sizeColumnsToFit();
          });
        };
        ////// Service-rules grid end

        ServiceModeFactory.renderFileProfile = function(fileProfile) {
          $timeout(function() {
            ServiceModeFactory.gridFile.api.setRowData(fileProfile);
            ServiceModeFactory.gridFile.api.forEachNode(function(node, index) {
              if (ServiceModeFactory.fileEntry) {
                if (node.data.filter === ServiceModeFactory.fileEntry.filter) {
                  node.setSelected(true);
                  ServiceModeFactory.gridFile.api.ensureNodeVisible(node);
                }
              } else if (index === 0) {
                node.setSelected(true);
                ServiceModeFactory.gridFile.api.ensureNodeVisible(node);
              }
            });
            ServiceModeFactory.gridFile.api.sizeColumnsToFit();
          });
        };

        ServiceModeFactory.renderProcessProfile = function(process_list) {
          $timeout(function() {
            if (ServiceModeFactory.gridProfile.api) {
              ServiceModeFactory.gridProfile.api.setRowData(process_list);
              ServiceModeFactory.gridProfile.api.forEachNode(function(node, index) {
                if (ServiceModeFactory.profileEntry) {
                  if (
                    node.data.name === ServiceModeFactory.profileEntry.name &&
                    node.data.path === ServiceModeFactory.profileEntry.path
                  ) {
                    node.setSelected(true);
                    ServiceModeFactory.gridProfile.api.ensureNodeVisible(node);
                  }
                } else if (index === 0) {
                  node.setSelected(true);
                  ServiceModeFactory.gridProfile.api.ensureNodeVisible(node);
                }
              });
              ServiceModeFactory.gridProfile.api.sizeColumnsToFit();
            }
          });
        };

        const relativeDate = $filter("relativeDate");

        ////// Services grid
        function memberComparator(value1, value2, node1, node2) {
          return node1.data.members.length - node2.data.members.length;
        }

        function memberDateComparator(value1, value2, node1, node2) {
          function getDate(node) {
            const rules = node.data.policy_rules;
            if (rules && rules.length > 0) {
              let lastTimes = rules.map(function(rule) {
                return rule.last_modified_timestamp;
              });
              return Math.max(...lastTimes);
            } else return 0;
          }

          return getDate(node1) - getDate(node2);
        }

        let columnDefs = [
          {
            headerName: $translate.instant("group.gridHeader.NAME"),
            field: "name",
            headerCheckboxSelection: true,
            headerCheckboxSelectionFilteredOnly: true,
            checkboxSelection: true
          },
          {
            headerName: $translate.instant("group.gridHeader.DOMAIN"),
            field: "domain"
          },
          {
            headerName: $translate.instant("group.gridHeader.POLICY_MODE"),
            field: "policy_mode",
            cellRenderer: function(params) {
              let mode = "";
              if (params.value) {
                mode = Utils.getI18Name(params.value);
                let labelCode = colourMap[params.value];
                if (!labelCode) return null;
                else
                  return `<span class="label label-fs label-${labelCode}">${$sanitize(mode)}</span>`;
              } else return null;
            },
            width: 100,
            minWidth: 100
          },
          {
            headerName: $translate.instant("service.gridHeader.MEMBERS"),
            cellRenderer: function(params) {
              return params.data.members.length;
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
            },
            comparator: memberComparator
          },
          {
            headerName: $translate.instant("service.gridHeader.LAST_UPDATED_AT"),
            cellRenderer: function(params) {
              const rules = params.data.policy_rules;
              if (rules && rules.length > 0) {
                let lastTimes = rules.map(function(rule) {
                  return $sanitize(rule.last_modified_timestamp);
                });
                return $sanitize(relativeDate(Math.max(...lastTimes) * 1000));
              } else return null;
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-numeric-asc"/>',
              sortDescending: '<em class="fa fa-sort-numeric-desc"/>'
            },
            comparator: memberDateComparator
          }
        ];

        ServiceModeFactory.gridService = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: columnDefs,
          rowData: null,
          animateRows: true,
          rowSelection: "multiple",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
          },
          onGridReady: function(params) {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 0);
            $win.on(resizeEvent, function() {
              setTimeout(function() {
                params.api.sizeColumnsToFit();
              }, 500);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`
        };

        ServiceModeFactory.onFilterChanged = function(value) {
          ServiceModeFactory.gridService.api.setQuickFilter(value);
          ServiceModeFactory.filterKey = value;
        };

        function getMessage(id) {
          return (
            $translate.instant("topbar.mode.SWITCH") +
            $translate.instant("enum." + id.toUpperCase()) +
            $translate.instant("topbar.mode.MODE") +
            "?"
          );
        }

        function getMessage4NodesSelected(id) {
          return (
            $translate.instant("group.SELECT_ALL_ALERT") +
            $translate.instant("enum." + id.toUpperCase()) +
            $translate.instant("group.MODE_NODES")
          );
        }

        const suppressShowNodesAlerts = function(mode, nodesGroup) {
          const modeGradeMap = {
            discover: 0,
            monitor: 1,
            protect: 2
          };
          let currMode = nodesGroup.policy_mode.toLowerCase();
          let targetMode = mode.toLowerCase();
          let isSwitchingSameMode = currMode === targetMode;
          let isDowngradingMode = modeGradeMap[targetMode] === 0;
          console.log(
            "isSwitchingSameMode: ",
            isSwitchingSameMode,
            "isDowngradingMode: ",
            isDowngradingMode
          );
          return (
            isSwitchingSameMode ||
            isDowngradingMode ||
            !ServiceModeFactory.isMultipleSelecting
          );
        };

        const suppressSwitchMode = function(mode) {
          let modeCountMap = {
            discover: 0,
            monitor: 0,
            protect: 0
          };
          ServiceModeFactory.gridService.api.getSelectedRows().forEach(group => {
            if (group.cap_change_mode)
              modeCountMap[group.policy_mode.toLowerCase()]++;
          });
          let areAllGroupsInSameTargetMode =
            modeCountMap[mode.toLowerCase()] ===
            Object.values(modeCountMap).reduce(
              (accumulator, currentValue) => accumulator + currentValue
            );
          return areAllGroupsInSameTargetMode;
        };

        const selectNodesAlert = function(cb, mode, nodesGroup, isExposure) {
          if (!suppressShowNodesAlerts(mode, nodesGroup)) {
            Alertify.confirm(getMessage4NodesSelected(mode)).then(
              function onOk() {
                cb(mode, true, isExposure);
              },
              function onCancel() {}
            );
          } else {
            cb(mode, false, isExposure);
          }
        };

        const switchAllMode = function(mode, isAlerted, isExposure) {
          ServiceModeFactory.isSwitchingMode[0] = true;
          const switchAll = function(mode, isExposure) {
            $http
              .patch(SERVICE_ALL, { policy_mode: mode })
              .then(function() {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success($translate.instant("service.ALL_SUBMIT_OK"));
                $timeout(function() {
                  ServiceModeFactory.refresh(isExposure);
                  ServiceModeFactory.isSwitchingMode[0] = false;
                  isCheckAll = false;
                }, 2000);
              })
              .catch(function(error) {
                console.warn(error);
                if (USER_TIMEOUT.indexOf(error.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(error, $translate.instant("service.ALL_SUBMIT_FAILED"), false)
                  );
                }
                ServiceModeFactory.isSwitchingMode[0] = false;
                isCheckAll = false;
              });
          }
          if (isAlerted) {
            switchAll(mode, isExposure);
          } else {
            if (!suppressSwitchMode(mode)) {
              Alertify.confirm(getMessage
              (mode)).then(
                function onOk() {
                  switchAll(mode, isExposure);
                },
                function onCancel() {}
              );
            }
          }
        };

        const switchSomeMode = function(mode, isAlerted, isExposure) {
          const switchSome = function(mode, isExposure) {
            let serviceList = ServiceModeFactory.gridService.api.getSelectedRows().map(function(element) {
              return element.name.indexOf("nv.") >= 0
                ? element.name.substring(3)
                : element.name;
            });
            let data = {
              config: { services: serviceList, policy_mode: mode }
            };
            data = pako.gzip(JSON.stringify(data));
            data = new Blob([data], {type: 'application/gzip'});
            let config = {
              headers: {
                'Content-Type': 'application/json',
                'Content-Encoding': 'gzip'
              }
            };
            ServiceModeFactory.isSwitchingMode[0] = true;
            $http
              .patch(SERVICE_URL, data, config)
              .then(function() {
                Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
                Alertify.success(
                  $translate.instant("service.ALL_SUBMIT_OK")
                );
                $timeout(function() {
                  ServiceModeFactory.refresh(isExposure);
                  ServiceModeFactory.isSwitchingMode[0] = false;
                  isCheckAll = false;
                }, 2000);
              })
              .catch(function(error) {
                console.warn(error);
                if (USER_TIMEOUT.indexOf(error.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(error, $translate.instant("service.ALL_SUBMIT_FAILED"), false)
                  );
                }
                ServiceModeFactory.isSwitchingMode[0] = false;
                isCheckAll = false;
              });
          }
          if (isAlerted) {
            switchSome(mode, isExposure);
          } else {
            if (!suppressSwitchMode(mode)) {
              Alertify.confirm(getMessage(mode)).then(
                function onOk() {
                  switchSome(mode, isExposure);
                },
                function onCancel() {}
              );
            }
          }
        };

        ServiceModeFactory.switchServiceMode = function(mode, isExposure) {
          if (ServiceModeFactory.filterKey.length > 0) ServiceModeFactory.forAll = false;
          let nodesGroup = ServiceModeFactory.gridService.api.getSelectedRows().filter(
            group => group.name === "nodes"
          );
          if (nodesGroup.length > 0) {
            if (ServiceModeFactory.forAll) {
              selectNodesAlert(switchAllMode, mode, nodesGroup[0], isExposure);
            } else {
              selectNodesAlert(switchSomeMode, mode, nodesGroup[0], isExposure);
            }
          } else {
            switchSomeMode(mode, false, isExposure);
          }
        };
      };

      ServiceModeFactory.getConfig = function() {
        $http
          .get(CONFIG_URL)
          .then(function(response) {
            ServiceModeFactory.currentNewServiceMode[0] = response.data.config.new_service_policy_mode;
            ServiceModeFactory.originalMode = ServiceModeFactory.currentNewServiceMode[0];
          })
          .catch(function(error) {
            console.warn(error);
            if (
              USER_TIMEOUT.indexOf(error.status) < 0
            ) {
              Alertify.alert(
                Utils.getAlertifyMsg(error, $translate.instant("setting.message.GET_SYS_LOG_ERR"), true)
              );
            }
          });
      };

      ServiceModeFactory.switchNewServiceMode = function(mode) {
        if (ServiceModeFactory.originalMode !== mode) {
          let configBody = {
            new_service_policy_mode: mode
          };
          $http
            .patch(CONFIG_URL, configBody)
            .then(function() {
              ServiceModeFactory.originalMode = mode;
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success($translate.instant("setting.SUBMIT_OK"));
            })
            .catch(function(error) {
              console.warn(error);
              if (
                USER_TIMEOUT.indexOf(error.status) < 0
              ) {
                ServiceModeFactory.currentNewServiceMode[0] = ServiceModeFactory.originalMode;
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(error, $translate.instant("setting.SUBMIT_FAILED"), false)
                );
              }
            });
        }
      };

      ServiceModeFactory.getServicesData = function (success, error, isExposure) {
        return $http
          .get(isExposure ? SERVICE_URL : GROUP_URL, isExposure ? {params: {with_cap: true}} : {params: {scope: "local", with_cap: true}})
          .then(function(response) {
            let services = isExposure ? response.data.services : response.data;
            services = services.map((service) => {
              service.name = service.name === "nodes" ? service.name : "nv." + service.name;
              return service;
            });
            console.log("before: ",services);
            if (isExposure) {
              services = services.filter(function(serivce) {
                return serivce.ingress_exposure || serivce.egress_exposure;
              });
            } else {
              services = services.filter(function(serivce) {
                return serivce.cap_change_mode;
              }).map(service => {
                service.name = service.name === "nodes" ? service.name : service.name.substring(3);
                return service;
              });
            }
            console.log("after: ",services)
            success(services);
            ServiceModeFactory.renderServices(services);
          })
          .catch(function(err) {
            console.warn(err);
            error(err);
            ServiceModeFactory.gridService.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            ServiceModeFactory.gridService.api.setRowData();
          });
      };

      ServiceModeFactory.getProcessProfile = function(serviceName, selectedIndex) {
        serviceName = ServiceModeFactory.service.name;
        ServiceModeFactory.selectedIndex = selectedIndex;
        $http
          .get(PROCESS_PROFILE_URL, {
            params: { name: serviceName }
          })
          .then(function(response) {
            if (ServiceModeFactory.gridProfile.api) {
              ServiceModeFactory.gridProfile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                "general.NO_ROWS"
              )}</span>`;
              if (serviceName === "") {
                ServiceModeFactory.gridProfile.api.setRowData([]);
              } else {
                ServiceModeFactory.renderProcessProfile(response.data.process_profile.process_list);
              }
            }
          })
          .catch(function(err) {
            console.warn(err);
            if (err.status !== 404) {
              ServiceModeFactory.gridProfile.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            }
            ServiceModeFactory.gridProfile.api.setRowData();
          });
      };

      ServiceModeFactory.getFileProfile = function(serviceName, selectedIndex) {
        serviceName = ServiceModeFactory.service.name;
        ServiceModeFactory.selectedIndex = selectedIndex;
        $http
          .get(FILE_PROFILE_URL, {
            params: { name: serviceName }
          })
          .then(function(response) {
            if (ServiceModeFactory.gridFile.api) {
              ServiceModeFactory.gridFile.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
                "general.NO_ROWS"
              )}</span>`;
              if (serviceName === "") {
                ServiceModeFactory.gridFile.api.setRowData([]);
              } else {
                ServiceModeFactory.renderFileProfile(response.data.profile.filters);
              }
            }

          })
          .catch(function(err) {
            console.warn(err);
            if (err.status !== 404) {
              ServiceModeFactory.gridFile.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            }
            if (ServiceModeFactory.gridProfile.api) {
              ServiceModeFactory.gridProfile.api.setRowData();
            }
          });
      };

      ServiceModeFactory.getServiceRules = function(serviceName, selectedIndex) {
        ServiceModeFactory.selectedIndex = selectedIndex;
        serviceName = ServiceModeFactory.service.name.indexOf("nv.") >= 0
          ? ServiceModeFactory.service.name.substring(3)
          : ServiceModeFactory.service.name;
        $http
          .get(SERVICE_URL, { params: { name: serviceName } })
          .then(function(response) {
            ServiceModeFactory.gridRules.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
              "general.NO_ROWS"
            )}</span>`;

            if (serviceName === "") {
              ServiceModeFactory.gridRules.api.setRowData([]);
            } else {
              ServiceModeFactory.renderServiceRules(response.data.service.policy_rules);
            }
          })
          .catch(function(err) {
            console.warn(err);
            if (err.status !== 404) {
              ServiceModeFactory.gridRules.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            }
            if (ServiceModeFactory.gridRules.api) {
              ServiceModeFactory.gridRules.api.setRowData();
            }
          });
      };

      return ServiceModeFactory;
    });
})();
