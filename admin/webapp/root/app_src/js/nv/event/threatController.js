(function() {
  "use strict";

  angular.module("app.assets").controller("ThreatController", ThreatController);

  ThreatController.$inject = [
    "$rootScope",
    "$filter",
    "$scope",
    "$http",
    "$translate",
    "$window",
    "$timeout",
    "Utils",
    "FileSaver",
    "Blob",
    "$stateParams"
  ];
  function ThreatController(
    $rootScope,
    $filter,
    $scope,
    $http,
    $translate,
    $window,
    $timeout,
    Utils,
    FileSaver,
    Blob,
    $stateParams
  ) {

    let filter = "";
    activate();

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window); // cache reference for resize
      let getEntityName = function(count) {
        return Utils.getEntityName(count, $translate.instant("threat.COUNT_POSTFIX"));
      }

      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");

      let threatName = $stateParams.threatName;

      $scope.graphHeight = $window.innerHeight - 225;
      $scope.onPacketPreview = false;
      $scope.loadingPacket = false;

      angular.element($window).bind("resize", function() {
        $scope.graphHeight = $window.innerHeight - 225;
        $scope.$digest();
      });

      let iconMap = {
        Info: "fa-info",
        Low: "fa-support",
        Medium: "fa-bell",
        High: "fa-bug",
        Critical: "fa-bomb"
      };

      $scope.getIconCode = function(severity) {
        return iconMap[severity];
      };

      let columnDefs = [
        {
          headerName: $translate.instant("threat.gridHeader.NAME"),
          field: "name",
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: { innerRenderer: eventCellRenderer }
        },
        {
          headerName: $translate.instant("threat.gridHeader.SEVERITY"),
          field: "severity",
          cellRenderer: function(params) {
            let labelClass = colourMap[params.value];
            return (
              `<span class="label label-fs label-${labelClass}">${Utils.getI18Name(params.value)}</span>`
            );
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("threat.gridHeader.ACTION"),
          field: "action",
          cellRenderer: function(params) {
            return (
              `<span class="label label-fs label-info">${Utils.getI18Name(params.value)}</span>`
            );
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("threat.gridHeader.SOURCE"),
          field: "source_workload_name",
          cellRenderer: function(params) {
            let source = "";
            if (params.data && params.value) {
              let displayName =
                Utils.getEndPointType(params.value) +
                Utils.getDisplayName(params.value);
              if (params.value !== params.data.source_ip)
                displayName =
                  `${Utils.getEndPointType(params.value) +
                  Utils.getDisplayName(params.value)} (${params.data.source_ip})`;
              if (params.data.source_workload_id === "external") {
                source = `<a href="https://www.whois.com/whois/${params.data.source_ip}" target="_blank">${displayName}</a>`;
              } else {
                source = displayName;
              }
            }
            return params.data.domain.source ? `${params.data.domain.source}: ${source}` : source;
          },
          width: 230
        },
        {
          headerName: $translate.instant("threat.gridHeader.DESTINATION"),
          field: "destination_workload_name",
          cellRenderer: function(params) {
            let destination = "";
            if (params.data && params.value) {
              let displayName =
                Utils.getEndPointType(params.value) +
                Utils.getDisplayName(params.value);
              if (params.value !== params.data.destination_ip)
                displayName =
                  Utils.getEndPointType(params.value) +
                  Utils.getDisplayName(params.value) +
                  " (" +
                  params.data.destination_ip +
                  ")";
              if (params.data.destination_workload_id === "external") {
                destination = `<a href="https://www.whois.com/whois/${params.data.destination_ip}" target="_blank">${displayName}</a>`;
              } else {
                if (params.data.target === "server") {
                  if (
                    params.data.destination_port ===
                    params.data.destination_conn_port
                  )
                    destination = `${Utils.getEndPointType(
                        params.data.destination_workload_name
                      )}${Utils.getDisplayName(params.value)}:${params.data.destination_port}`;
                  else
                    destination = `${Utils.getEndPointType(params.data.destination_workload_name
                      )}${Utils.getDisplayName(params.value)}:${params.data.destination_port}(${params.data.destination_conn_port})`;
                } else {
                  destination = displayName;
                }
              }
            }
            return params.data.domain.destination ? `${params.data.domain.destination}: ${destination}` : destination;
          }
        },
        {
          headerName: "Destination IP",
          hide: true,
          field: 'destination_ip'
        },
        {
          headerName: $translate.instant("threat.gridHeader.APPLICATION"),
          field: "application",
          width: 120
        },
        {
          headerName: $translate.instant("threat.gridHeader.COUNT"),
          field: "count",
          width: 60
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

      function dateComparator(value1, value2, node1, node2) {
        return node1.data.reported_timestamp - node2.data.reported_timestamp;
      }

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

      FullWidthCellRenderer.prototype.getTemplate = function(params) {
        let data = params.node.data;
        let className = $scope.getIconCode(data.severity);
        let colorName = colourMap[data.severity];
        const src = $translate.instant("threat.gridHeader.SOURCE");
        const dst = $translate.instant("threat.gridHeader.DESTINATION");
        const viewPacket = $translate.instant("threat.VIEW_PACKET");
        let srcLink = data.source_ip + ":" + data.source_port;
        if (
          data.target === "client" &&
          data.source_port !== data.source_conn_port
        )
          srcLink =
            data.source_ip +
            ":" +
            data.source_port +
            "(" +
            data.source_conn_port +
            ")";

        let dstLink = data.destination_ip + ":" + data.destination_port;
        if (
          data.target === "server" &&
          data.destination_port !== data.destination_conn_port
        )
          dstLink =
            data.destination_ip +
            ":" +
            data.destination_port +
            "(" +
            data.destination_conn_port +
            ")";

        let title =
          '<span class="full-width-title mr-xl">' + data.name + "</span><br/>";

        if (data.cap_len && $rootScope.user.token.role === "admin") {
          let packet =
            '<button class="btn btn-info btn-xs" ng-click="showPacket(data.id)" >' +
            '<em class="icon-envelope-letter mr-sm"></em>' +
            viewPacket +
            "</button>";
          title =
            '<span class="full-width-title mr-xl">' +
            data.name +
            "</span>" +
            packet +
            "<br/>";
        }

        return (
          '<div class="full-width-panel">' +
          '  <div class="full-width-flag">' +
          '    <em class="fa ' +
          className +
          " fa-2x text-" +
          colorName +
          ' mr-lg"></em>' +
          "  </div>" +
          '  <div class="full-width-summary">' +
          title +
          "    <label><b>" +
          src +
          ":</b> " +
          srcLink +
          "</label><br/>" +
          "    <label><b>" +
          dst +
          ":</b> " +
          dstLink +
          "</label><br/>" +
          "  </div>" +
          '  <div class="full-width-center">' +
          data.message +
          "  </div>" +
          "</div>"
        );
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
        onSelectionChanged: onSelectionChanged,
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
          return (
            (dataItem.message && dataItem.message.length > 0) ||
            dataItem.cap_len
          );
        },
        overlayNoRowsTemplate: $translate.instant("general.NO_ROWS")
      };

      function onSelectionChanged() {
        let selectedNodes = $scope.gridOptions.api.getSelectedNodes();
        if (selectedNodes && selectedNodes.length === 1) {
          let selectedNode = selectedNodes[0];
          if (
            $scope.lastIndex !== undefined &&
            selectedNode.childIndex !== undefined
          ) {
            if ($scope.lastIndex !== selectedNode.childIndex) {
              $scope.onPacketPreview = false;
              $scope.$apply();
            }
          }
          if (selectedNode.childIndex !== undefined)
            $scope.lastIndex = selectedNode.childIndex;
        }
      }

      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        let filteredCount = $scope.gridOptions.api.getModel().rootNode.childrenAfterFilter.length;
        $scope.count = (filteredCount === $scope.threats.length || value === '')?
          `${$scope.threats.length} ${getEntityName($scope.threats.length)}` :
          `${found} ${filteredCount} ${getEntityName(filteredCount)} ${outOf} ${$scope.threats.length} ${getEntityName($scope.threats.length)}`;
      };

      $scope.toHex = function(number, length) {
        let s = number.toString(16).toUpperCase();
        while (s.length < length) {
          s = "0" + s;
        }
        return s;
      };

      $scope.toChar = function(number) {
        return number <= 32 ? " " : String.fromCharCode(number);
      };

      $scope.setCurrent = function(index) {
        $scope.current = index;
      };

      $scope.showPacket = function(id) {
        $scope.packetErr = false;
        $scope.packetErrMSG = "";
        $scope.loadingPacket = true;
        $http
          .get(THREAT_URL, { params: { id: id } })
          .then(function(response) {
            $scope.packet = Utils.decode(response.data.threat.packet);
            $scope.rawPacket = response.data.threat.packet;
            $scope.hexItems = [];
            $scope.chars = [];
            $scope.positions = [];
            if ($scope.packet.length > 0) {
              for (let i in $scope.packet) {
                $scope.hexItems.push($scope.toHex($scope.packet[i], 2));
                $scope.chars.push($scope.toChar($scope.packet[i]));
              }
              $scope.offset = $scope.current = 0;
              $scope.cols = Math.ceil($scope.packet.length / 16);
              for (let i = 0; i < $scope.cols; i += 1) {
                $scope.positions.push($scope.toHex($scope.offset + i * 16, 8));
              }
            }
            $scope.gridOptions.api.forEachNode(node => {
              if (node.data.id === id) {
                node.setSelected(true);
                $scope.lastIndex = node.childIndex;
              }
            });
            $scope.onPacketPreview = true;
            $scope.loadingPacket = false;
          })
          .catch(function(err) {
            console.warn(err);
            $scope.packetErr = true;
            $scope.loadingPacket = false;
            $scope.onPacketPreview = true;
            $scope.packetErrMSG = Utils.getErrorMessage(err);
          });
      };

      $scope.refresh = function() {
        $scope.threatsErr = false;
        $http
          .get(THREAT_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant("general.NO_ROWS");
            $scope.threats = response.data.threats;
            $scope.gridOptions.api.setRowData($scope.threats);

            if (threatName && threatName !== "null") {
              $scope.search = threatName;
              $scope.onFilterChanged(threatName);
            }
            $scope.count = `${$scope.threats.length} ${getEntityName($scope.threats.length)}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function(err) {
            console.warn(err);
            $scope.threatsErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.refresh();

      $scope.exportCsv = function() {
        if ($scope.threats && $scope.threats.length > 0) {
          let threats4Csv = JSON.parse(JSON.stringify($scope.threats));
          threats4Csv = threats4Csv.map(function(threat) {
            threat.message = `"${threat.message.replace(/\"/g, "\'")}"`;
            return threat;
          });
          let csv = Utils.arrayToCsv(angular.copy(threats4Csv));
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(blob, "threats.csv");
        }
      };

      $scope.exportPcap = function() {
        if ($scope.packet && $scope.packet.length > 0) {
          let pcap = $scope.packet;

          let blockHeader = new Uint32Array(8);
          //Dummy block header
          blockHeader[0] = 0xA1B2C3D4;
          blockHeader[1] = 0x00040002;
          blockHeader[2] = 0x00000000;
          blockHeader[3] = 0x00000000;
          blockHeader[4] = 0x0000FFFF;
          blockHeader[5] = 0x00000001;
          blockHeader[6] = 0x4F6EBC6B;
          blockHeader[7] = 0x00069967;

          let lengthHex = Number($scope.packet.length).toString(16).padStart(8, '0');
          let lengthHesSection = lengthHex.match(/.{1,2}/g).reverse();
          let sectionLen = new Uint8Array(4);
          for (let i = 0; i < 4; i++) {
            sectionLen[i] = parseInt(lengthHesSection[i], 16);
          }

          let blob = new Blob([blockHeader, sectionLen, sectionLen, pcap], { type: "application/octet-stream" });
          FileSaver.saveAs(blob, "pocket.pcap");
        }
      };
    }
  }
})();
