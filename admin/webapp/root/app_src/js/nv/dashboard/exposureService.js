(function() {
  "use strict";
  angular
    .module("app.dashboard")
    .factory("ExposureFactory", function ExposureFactory(
      $translate,
      $filter,
      $window,
      $timeout,
      $http,
      $sanitize,
      Utils,
      Alertify
    ) {
      ExposureFactory.init = function() {
        ExposureFactory.exposure = {
          currScore: {
            value: 0,
            test: ""
          },
          futureScore: {
            value: 0,
            test: ""
          },
          description: [
            $translate.instant("dashboard.improveScoreModal.exposure.DESCRIPTION_1"),
            $translate.instant("dashboard.improveScoreModal.exposure.DESCRIPTION_2"),
            $translate.instant("dashboard.improveScoreModal.exposure.DESCRIPTION_3"),
            $translate.instant("dashboard.improveScoreModal.exposure.DESCRIPTION_4")
          ],
          progressNames: [
            $translate.instant("dashboard.improveScoreModal.exposure.PROCESS_1"),
            $translate.instant("dashboard.improveScoreModal.exposure.PROCESS_2"),
            $translate.instant("dashboard.improveScoreModal.exposure.PROCESS_3"),
            $translate.instant("dashboard.improveScoreModal.exposure.PROCESS_4")
          ]
        };
      }

      let resizeEvent = "resize.ag-grid";
      let $win = $($window);

      function innerCellRenderer(params) {
        const serviceColorArray = [
          "text-danger",
          "text-warning",
          "text-caution",
          "text-monitor",
          "text-protect"
        ];
        const levelMap = {
          protect: 4,
          monitor: 3,
          discover: 2,
          violate: 1,
          warning: 1,
          deny: 0,
          critical: 0
        };

        let level = [];
        if (params.data.children) {
          params.data.children.forEach(function(child) {
            if (child.severity) {
              level.push(levelMap[child.severity.toLowerCase()]);
            } else if (
              child.policy_action &&
              (child.policy_action.toLowerCase() === "deny" || child.policy_action.toLowerCase()==="violate")
            ) {
              level.push(levelMap[child.policy_action.toLowerCase()]);
            } else {
              if (!child.policy_mode) child.policy_mode = "discover";
              level.push(levelMap[child.policy_mode.toLowerCase()]);
            }
          });
          let serviceColor = serviceColorArray[Math.min(...level)];
          return `<span class="${serviceColor}"></em>${
            $sanitize(params.data.service)
            }</span>`;
        } else {
          const podColorArray = [
            "text-danger",
            "text-warning",
            "text-caution",
            "text-monitor",
            "text-protect"
          ];
          const levelMap = {
            protect: 4,
            monitor: 3,
            discover: 2,
            violate: 1,
            warning: 1,
            deny: 0,
            critical: 0
          };
          const actionTypeIconMap = {
            discover: "fa icon-size-2 fa-exclamation-triangle",
            violate: "fa icon-size-2 fa-ban",
            protect: "fa icon-size-2 fa-shield",
            monitor: "fa icon-size-2 fa-bell",
            deny: "fa icon-size-2 fa-minus-circle",
            threat: "fa icon-size-2 fa-bug"
          };
          let actionType = "";
          let level = 0;
          if (params.data.severity) {
            level = levelMap[params.data.severity.toLowerCase()];
            actionType = actionTypeIconMap["threat"];
          } else if (
            params.data.policy_action &&
            (params.data.policy_action.toLowerCase() === "deny" || params.data.policy_action.toLowerCase()==="violate")
          ) {
            level = levelMap[params.data.policy_action.toLowerCase()];
            actionType =
              actionTypeIconMap[params.data.policy_action.toLowerCase()];
          } else {
            if (!params.data.policy_mode) params.data.policy_mode = "discover";
            level = levelMap[params.data.policy_mode.toLowerCase()];
            actionType =
              actionTypeIconMap[params.data.policy_mode.toLowerCase()];
          }
          return `<span class="${
            podColorArray[level]
            }">&nbsp;&nbsp;&nbsp;&nbsp;<em class="${actionType}"></em>&nbsp;&nbsp;${
            $sanitize(params.data.display_name)
            }</span>`;
        }
      }

      ExposureFactory.exposedContainerColumnDefs = [
        {
          headerName: $translate.instant("dashboard.body.panel_title.SERVICE"),
          field: "service",
          width: 450,
          cellRendererParams: { innerRenderer: innerCellRenderer },
          cellRenderer: "agGroupCellRenderer"
        },
        {
          headerName: $translate.instant(
            "dashboard.body.panel_title.APPLICATIONS"
          ),
          field: "applications",
          cellRenderer: function(params) {
            if (params.value) {
              return $sanitize(
                params.data.ports
                  ? params.value.concat(params.data.ports).join(", ")
                  : params.value.join(", ")
              );
            }
          },
          width: 300,
          suppressSorting: true
        },
        {
          headerName: $translate.instant(
            "dashboard.body.panel_title.POLICY_MODE"
          ),
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
          width: 95,
          minWidth: 95,
          suppressSorting: true
        },
        {
          headerName: $translate.instant(
            "dashboard.body.panel_title.POLICY_ACTION"
          ),
          field: "policy_action",
          cellRenderer: function(params) {
            if (params.value) {
              return `<span ng-class="{\'policy-remove\': data.remove}"
                    class="action-label ${
                colourMap[params.value.toLowerCase()]
                }">
                  ${$sanitize($translate.instant(
                    "policy.action." + params.value.toUpperCase()
                  ))}
                </span>`;
            }
          },
          width: 80,
          maxWidth: 80,
          minWidth: 80,
          suppressSorting: true
        },
        {
          headerName: "",
          field: "policy_action",
          cellRenderer: function(params) {
            if (params.value) {
              return `<em class="fa fa-trash fa-lg mr-sm text-action"
                       ng-click="clearConversation(data.id)" uib-tooltip="{{'dashboard.improveScoreModal.REMOVE' | translate}}">
                     </em>`;
            }
          },
          width: 45,
          maxWidth: 45,
          minWidth: 45,
          suppressSorting: true
        }
      ];

      function getWorkloadChildDetails(rowItem) {
        if (rowItem.children && rowItem.children.length > 0) {
          return {
            group: true,
            children: rowItem.children,
            expanded: true
          };
        } else {
          return null;
        }
      }

      ExposureFactory.gridIngressContainer = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        animateRows: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: ExposureFactory.exposedContainerColumnDefs,
        getNodeChildDetails: getWorkloadChildDetails,
        rowData: null,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS"),
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 100);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 500);
          });
        }
      };

      ExposureFactory.gridEgressContainer = {
        headerHeight: 30,
        rowHeight: 30,
        enableSorting: true,
        enableColResize: true,
        animateRows: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: ExposureFactory.exposedContainerColumnDefs,
        getNodeChildDetails: getWorkloadChildDetails,
        rowData: null,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS"),
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
          }, 100);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 500);
          });
        }
      };

      function filterExposedConversations(exposedConversations, filter) {
        let res = [];
        if (filter) {
          if (exposedConversations && exposedConversations.length > 0) {
            exposedConversations.forEach(function(conversation, index) {
              let children = [];
              if (conversation.children && conversation.children.length > 0) {
                children = conversation.children.filter(function(child) {
                  if (filter === "threat" && child.severity) {
                    return true;
                  } else if (
                    filter === "violation" && (
                      (child.policy_action && child.policy_action.toLowerCase() === "violate" || child.policy_action.toLowerCase() === "deny")
                    )
                  ) {
                    return true;
                  } else if (filter === "normal" &&
                    (!child.severity || child.severity.length === 0) &&
                    (!child.policy_action || (child.policy_action.toLowerCase() !== "violate" && child.policy_action.toLowerCase() !== "deny"))
                  ) {
                    return true;
                  }
                  return false;
                });
              }
              if (children.length > 0) {
                conversation.children = children;
                conversation.seq = index;
                res.push(conversation);
              }
            });
          }
          return res;
        }
        return exposedConversations;
      }

      ExposureFactory.generateGrid = function(exposedConversations, filter, tabs) {
        console.log("ExposureFactory.generateGrid perams: ", exposedConversations, filter, tabs);
        let ingress = filterExposedConversations(exposedConversations.ingress, filter);
        let egress = filterExposedConversations(exposedConversations.egress, filter);
        console.log("ingress, egress: ", ingress, egress);
        ExposureFactory.gridIngressContainer.api.setRowData(
          ingress
        );
        ExposureFactory.gridEgressContainer.api.setRowData(
          egress
        );
        if (ingress.length === 0 && egress.length > 0) {
          tabs[filter] = 1;
        }
      };

      ExposureFactory.removeConversationFromGrid = function(exposedConversations, workloadId) {
        console.log("ExposureFactory.removeConversationFromGrid params: ", exposedConversations, workloadId);
        let res = [];
        if (exposedConversations && exposedConversations.length > 0) {
          exposedConversations.forEach(function(conversation, index) {
            let children = [];
            if (conversation.children && conversation.children.length > 0) {
              children = conversation.children.filter(function(child) {
                 return !(child.id === workloadId);
              });
            }
            if (children.length > 0) {
              conversation.children = children;
              res.push(conversation);
            }
          });
        }
        return res;
      };

      ExposureFactory.clearSessions = function(filter, tabs, endPoint1, endPoint2) {
        console.log("clearSessions parameter: ", filter, tabs, endPoint1, endPoint2);
        let from = endPoint2;
        let to = endPoint1;
        if (tabs[filter] === 1) {
          from = endPoint1;
          to = endPoint2;
        }
        $http
          .delete(CONVERSATION_SNAPSHOT_URL, {
            params: { from: encodeURIComponent(from), to: encodeURIComponent(to) }
          })
          .then(function() {
            setTimeout(function() {
              console.log("ExposureFactory.exposedConversations: ", ExposureFactory.exposedConversations);
              if (endPoint1 === "external") {
                ExposureFactory.exposedConversations.ingress = ExposureFactory.removeConversationFromGrid(ExposureFactory.exposedConversations.ingress, endPoint1);
              } else {
                ExposureFactory.exposedConversations.egress = ExposureFactory.removeConversationFromGrid(ExposureFactory.exposedConversations.egress, endPoint1);
              }
              ExposureFactory.generateGrid(ExposureFactory.exposedConversations, filter, tabs);
            }, 500);
          })
          .catch(function(err) {
            console.warn(err);
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("network.popup.SESSION_CLEAR_FAILURE"), false)
            );
          });
      };


      return ExposureFactory;
    });
})();
