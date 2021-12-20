(function() {
  "use strict";

  angular
    .module("app.assets")
    .controller("IncidentController", IncidentController);

  IncidentController.$inject = [
    "$scope",
    "$filter",
    "$http",
    "$translate",
    "$window",
    "$timeout",
    "Utils",
    "FileSaver",
    "Blob"
  ];
  function IncidentController(
    $scope,
    $filter,
    $http,
    $translate,
    $window,
    $timeout,
    Utils,
    FileSaver,
    Blob
  ) {
    let filter = "";
    activate();

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window); // cache reference for resize
      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("incident.COUNT_POSTFIX")
        );
      };
      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");

      $scope.graphHeight = $window.innerHeight - 225;

      $scope.isAllFilesShown = false;

      angular.element($window).bind("resize", function() {
        $scope.graphHeight = $window.innerHeight - 225;
        $scope.$digest();
      });

      const iconMap = {
        "Container.Privilege.Escalation": "fa-cube",
        "Host.Privilege.Escalation": "fa-server"
      };

      let columnDefs = [
        {
          headerName: $translate.instant("threat.gridHeader.NAME"),
          field: "name",
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: { innerRenderer: eventCellRenderer }
        },
        {
          headerName: $translate.instant("incident.gridHeader.EFFECTIVE_USER"),
          field: "proc_effective_user"
        },
        {
          headerName: $translate.instant("incident.gridHeader.CLIENT"),
          field: "client_ip",
          cellRenderer: function(params) {
            let client = "";
            if (!params.value) return null;
            let client_domain = "";
            let client_name = "";
            let client_id = "";
            if (params.data.conn_ingress === true) {
              client_domain = params.data.remote_workload_domain;
              client_name = params.data.remote_workload_name;
              client_id = params.data.remote_workload_id;
            }
            if (params.data.conn_ingress === false) {
              client_domain = params.data.workload_domain;
              client_name = params.data.workload_name;
              client_id = params.data.workload_id;
            }
            let displayName =
              Utils.getEndPointType(client_name) +
              Utils.getDisplayName(client_name);
            if (params.value && client_name !== params.value)
              displayName =
                Utils.getEndPointType(client_name) +
                Utils.getDisplayName(client_name) +
                " (" +
                params.value +
                ")";
            if (client_id === "external") {
              client = `<a href="https://www.whois.com/whois/${
                params.value
              }" target="_blank">${displayName}</a>`;
            } else {
              client = displayName;
            }
            return client_domain ? `${client_domain}: ${client}` : client;
          },
          width: 230
        },
        {
          headerName: $translate.instant("incident.gridHeader.SERVER"),
          field: "server_ip",
          cellRenderer: function(params) {
            let server = "";
            if (!params.value) return null;
            let server_domain = "";
            let server_name = "";
            let server_id = "";
            if (params.data.conn_ingress === false) {
              server_domain = params.data.remote_workload_domain;
              server_name = params.data.remote_workload_name;
              server_id = params.data.remote_workload_id;
            }
            if (params.data.conn_ingress === true) {
              server_domain = params.data.workload_domain;
              server_name = params.data.workload_name;
              server_id = params.data.workload_id;
            }
            let displayName =
              Utils.getEndPointType(server_name) +
              Utils.getDisplayName(server_name) +
              ":" +
              params.data.server_port;
            if (params.value && server_name !== params.value)
              displayName =
                Utils.getEndPointType(server_name) +
                Utils.getDisplayName(server_name) +
                " (" +
                params.value +
                ":" +
                params.data.server_port +
                ")";

            if (server_id === "external") {
              server = `<a href="https://www.whois.com/whois/${
                params.value
              }" target="_blank">${displayName}</a>`;
            } else {
              server = displayName;
            }
            return server_domain ? `${server_domain}: ${server}` : server;
          },
          width: 230
        },
        {
          headerName: $translate.instant("event.gridHeader.NODE"),
          field: "host_name"
        },
        {
          headerName: $translate.instant("threat.gridHeader.CONTAINER"),
          field: "workload_name",
          cellRenderer: function(params) {
            return params.value
              ? Utils.getDisplayName(params.value)
              : params.data.workload_id;
          }
        },
        {
          headerName: $translate.instant("threat.gridHeader.TIME"),
          field: "reported_at",
          cellRenderer: function(params) {
            return $filter("date")(params.value, "MMM dd, y HH:mm:ss");
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

      function eventCellRenderer(params) {
        return `<span style="cursor: default;">${params.value}</span>`;
      }

      function FullWidthCellRenderer() {}

      FullWidthCellRenderer.prototype.init = function(params) {
        let eTemp = document.createElement("div");
        eTemp.innerHTML = this.getTemplate(params);
        this.eGui = eTemp.firstElementChild;

        this.consumeMouseWheelOnCenterText();
      };

      const msg = $translate.instant("nodes.gridHeader.MESSAGE");
      const command = $translate.instant("incident.gridHeader.COMMAND");

      FullWidthCellRenderer.prototype.getTemplate = function(params) {
        let data = params.node.data;
        let className = iconMap[data.name];
        let colorName = colourMap[data.level];

        let message = "";

        let hostPrivilegeEscalation = "";
        if (data.proc_cmd) {
          let messageContent = `<span>${data.message}</span>
                                <br/><span class="text-bold">Process command</span>: <span class="text-muted">${
                                  data.proc_cmd
                                }</span>`;
          if (data.proc_real_uid && data.proc_real_user) {
            messageContent += `&nbsp;<span class="text-bold">Process real UID</span>: <span class="text-muted">${
              data.proc_real_uid
            }</span>&nbsp;
                               <span class="text-bold">Process real user</span>: <span class="text-muted">${
                                 data.proc_real_user
                               }</span>`;
          }
          if (data.proc_effective_uid && data.proc_effective_user) {
            messageContent += `&nbsp;<span class="text-bold">Process effective UID</span>: <span class="text-muted">${
              data.proc_effective_uid
            }</span>&nbsp;
                               <span class="text-bold">Process effective user</span>: <span class="text-muted">${
                                 data.proc_effective_user
                               }</span>`;
          }
          hostPrivilegeEscalation = messageContent;
        }

        let containerPrivilegeEscalation = hostPrivilegeEscalation;

        let hostSuspiciousProcess = "";
        if (data.proc_name && data.proc_path && data.proc_cmd) {
          let messageContent = `<span>${data.message}</span>
                                <br/><span class="text-bold">Process Name</span>: <span class="text-muted">${
                                  data.proc_name
                                }</span>&nbsp;
                                <span class="text-bold">Process Path</span>: <span class="text-muted">${
                                  data.proc_path
                                }</span>&nbsp;
                                <span class="text-bold">Process command</span>: <span class="text-muted">${
                                  data.proc_cmd
                                }</span>`;
          if (data.proc_effective_uid && data.proc_effective_user) {
            messageContent += `&nbsp;<span class="text-bold">Process effective UID</span>: <span class="text-muted">${
              data.proc_effective_uid
            }</span>&nbsp;
                               <span class="text-bold">Process effective user</span>: <span class="text-muted">${
                                 data.proc_effective_user
                               }</span>`;
          }
          if (
            data.server_ip &&
            data.client_ip &&
            data.server_port &&
            data.client_port
          ) {
            let localIP = data.conn_ingress ? data.server_ip : data.client_ip;
            let remoteIP = data.conn_ingress ? data.client_ip : data.server_ip;
            let localPort = data.conn_ingress
              ? data.server_port
              : data.client_port;
            let remotePort = data.conn_ingress
              ? data.client_port
              : data.server_port;
            messageContent += `<br/><span class="text-bold">Local IP</span>: <span class="text-muted">${localIP}</span>&nbsp;
                                <span class="text-bold">Remote IP</span>: <span class="text-muted">${remoteIP}</span>&nbsp;
                                <span class="text-bold">Local port</span>: <span class="text-muted">${localPort}</span>&nbsp;
                                <span class="text-bold">Remote port</span>: <span class="text-muted">${remotePort}</span>&nbsp;
                                <span class="text-bold">Ether type</span>: <span class="text-muted">${
                                  data.ether_type
                                }</span>&nbsp;
                                <span class="text-bold">IP Protocol</span>: <span class="text-muted">${
                                  data.ip_proto
                                }</span>`;
          }
          hostSuspiciousProcess = messageContent;
        }

        let containerSuspiciousProcess = hostSuspiciousProcess;

        let hostTunnelDetected = hostSuspiciousProcess;

        let containerTunnelDetected = hostSuspiciousProcess;

        let hostFileModified = "";
        if (data.file_path) {
          let messageContent = `<span>${data.message}</span>
                                <br/><span class="text-bold">File path</span>: <span class="text-muted">${
                                  data.file_path
                                }</span>`;
          if (data.file_name) {
            let displayFileNames = "";
            let viewAll = `<br/><span class="link" ng-click="showAllFiles(data.file_name, $event)">
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(View all)</span>`;
            let fileNameStr = data.file_name.join(", ");
            if (fileNameStr.length > 100) {
              displayFileNames = `${fileNameStr.substring(
                0,
                101
              )}...${viewAll}`;
            } else {
              displayFileNames = `${fileNameStr}`;
            }

            messageContent += `<br/><span class="text-bold">Files</span>: <span class="text-muted">${displayFileNames}</span>`;
          }
          hostFileModified = messageContent;
        }

        let hostPackageUpdated = hostFileModified;

        let containerFileModified = hostFileModified;

        let containerPackageUpdated = hostFileModified;

        let messageMap = {
          "Host.File.Modified": hostFileModified,
          "Host.Package.Updated": hostPackageUpdated,
          "Host.Privilege.Escalation": hostPrivilegeEscalation,
          "Container.Privilege.Escalation": containerPrivilegeEscalation,
          "Host.Suspicious.Process": hostSuspiciousProcess,
          "Container.Suspicious.Process": containerSuspiciousProcess,
          "Host.Tunnel.Detected": hostTunnelDetected,
          "Container.Tunnel.Detected": containerTunnelDetected,
          "Container.File.Modified": containerFileModified,
          "Container.Package.Updated": containerPackageUpdated
        };

        message = messageMap[data.name] ? messageMap[data.name] : data.message;

        if (data.proc_cmd) {
          message += `<br/><span class="text-bold">${command}</span>: <span class="text-muted">${
            data.proc_cmd
          }</span>`;
        }

        return `<div class="full-width-panel">  <div class="full-width-flag">    <em class="fa ${className} fa-2x text-primary mr-lg"></em>  </div>  <div class="full-width-summary">    <span class="label label-${colorName}">${msg}</span><br/>  </div>  <div class="full-width-center">${message}  </div></div>`;
      };

      FullWidthCellRenderer.prototype.getGui = function() {
        return this.eGui;
      };

      FullWidthCellRenderer.prototype.consumeMouseWheelOnCenterText = function() {
        let eFullWidthCenter = this.eGui.querySelector(".full-width-center");

        let mouseWheelListener = function(event) {
          event.stopPropagation();
        };

        // event is 'mousewheel' for IE9, Chrome, Safari, Opera
        eFullWidthCenter.addEventListener("mousewheel", mouseWheelListener);
        // event is 'DOMMouseScroll' Firefox
        eFullWidthCenter.addEventListener("DOMMouseScroll", mouseWheelListener);
      };

      $scope.showAllFiles = function(files, ev) {
        $scope.currFiles = files.join(", ").toString();
        $timeout(() => {
          $scope.isGradientTopBottomShown =
            document.getElementById("all-files").clientHeight >= 300;
        }, 200);
        $scope.isAllFilesShown = true;
        $scope.panelPosition = {
          bottom: $window.innerHeight - ev.pageY - 100 + "px",
          left: ev.pageX - 200 + "px"
        };
      };

      $scope.hideAllFiles = function() {
        $scope.isAllFilesShown = false;
      };

      $scope.gridOptions = {
        headerHeight: 30,
        enableSorting: true,
        isFullWidthCell: function(rowNode) {
          return rowNode.flower;
        },
        fullWidthCellRenderer: FullWidthCellRenderer,
        getRowHeight: function(params) {
          let rowIsNestedRow = params.node.flower;
          return rowIsNestedRow ? 100 : 30;
        },
        animateRows: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs,
        rowData: null,
        rowSelection: "single",
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"/>'
        },
        onGridReady: function(params) {
          $timeout(function() {
            params.api.sizeColumnsToFit();
            params.api.onGroupExpandedOrCollapsed();
          }, 2000);
          $win.on(resizeEvent, function() {
            $timeout(function() {
              params.api.sizeColumnsToFit();
            }, 1000);
          });
        },
        doesDataFlower: function(dataItem) {
          return dataItem.message && dataItem.message.length > 0;
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
      };

      $scope.getIconCode = function(name) {
        return iconMap[name];
      };

      function dateComparator(value1, value2, node1, node2) {
        return (
          Date.parse(node1.data.reported_at) -
          Date.parse(node2.data.reported_at)
        );
      }

      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let filteredCount = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.incidents.length || value === ""
            ? `${$scope.incidents.length} ${getEntityName(
                $scope.incidents.length
              )}`
            : `${found} ${filteredCount} ${getEntityName(
                filteredCount
              )} ${outOf} ${$scope.incidents.length} ${getEntityName(
                $scope.incidents.length
              )}`;
      };

      $scope.getIncidents = function() {
        $scope.incidentsErr = false;
        $http
          .get(INCIDENT_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            $scope.incidents = response.data.incidents;
            $scope.gridOptions.api.setRowData($scope.incidents);
            $scope.count = `${$scope.incidents.length} ${getEntityName(
              $scope.incidents.length
            )}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function(err) {
            console.warn(err);
            $scope.incidentsErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.getIncidents();

      $scope.exportCsv = function() {
        if ($scope.incidents && $scope.incidents.length > 0) {
          let incidents4Csv = JSON.parse(JSON.stringify($scope.incidents));
          incidents4Csv = incidents4Csv.map(function(incident) {
            incident.message = `"${incident.message.replace(/\"/g, "'")}"`;
            return incident;
          });
          console.log(incidents4Csv)
          let csv = Utils.arrayToCsv(angular.copy(incidents4Csv));
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(blob, "incidents.csv");
        }
      };
    }
  }
})();
