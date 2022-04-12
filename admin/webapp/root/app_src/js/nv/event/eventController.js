(function() {
  "use strict";

  angular.module("app.assets").controller("EventController", EventController);

  EventController.$inject = [
    "$scope",
    "$filter",
    "$http",
    "$translate",
    "$window",
    "$timeout",
    "Utils",
    "FileSaver",
    "Blob",
    "$controller",
    "$state",
    "$sanitize"
  ];
  function EventController(
    $scope,
    $filter,
    $http,
    $translate,
    $window,
    $timeout,
    Utils,
    FileSaver,
    Blob,
    $controller,
    $state,
    $sanitize
  ) {
    const MIN_UNIT64 = 0;
    let filter = "";
    activate();

    let baseCtl = $controller('BaseMultiClusterController',{ $scope: $scope});

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window); // cache reference for resize
      let getEntityName = function(count) {
        return Utils.getEntityName(
          count,
          $translate.instant("event.COUNT_POSTFIX")
        );
      };
      const outOf = $translate.instant("enum.OUT_OF");
      const found = $translate.instant("enum.FOUND");
      $scope.filteredEvents = [];
      $scope.graphHeight = $window.innerHeight - 230;

      angular.element($window).bind("resize", function() {
        $scope.graphHeight = $window.innerHeight - 230;
        $scope.$digest();
      });

      $scope.getColorCode = function(level) {
        return colourMap[level];
      };

      $scope.isOnQuickFilter = false;

      const _initializeAdvFilter = function() {
        $scope.levelFilter = {
          isFilteringError: false,
          isFilteringCritical: false,
          isFilteringWarning: false,
          isFilteringInfo: false,
          isFilteringNotice: false
        };

        $scope.selectedItemName = null;
        $scope.searchTextName = "";
        $scope.selectedItemUserName = null;
        $scope.searchTextUserName = "";
        $scope.selectedItemNode = null;
        $scope.searchTextNode = "";
        $scope.selectedItemContainer = null;
        $scope.searchTextContainer = "";
        $scope.selectedItemImage = null;
        $scope.searchTextImage = "";
        $scope.selectedDomains = [];
        $scope.popup = { opened: false };
        $scope.otherKey = "";
        $scope.excludedKey = "";

        $scope.reportedFrom = null;
        $scope.reportedTo = null;
      }

      _initializeAdvFilter();

      let iconMap = {
        AUTH: "fa-key",
        ENFORCER: "fa-shield",
        RESTFUL: "fa-gears",
        CONTROLLER: "fa-magic",
        WORKLOAD: "fa-cube",
        LICENSE: "fa-gavel",
        SCANNER: "fa-files-o",
        INCIDENT: "fa-bell"
      };

      $scope.getIconCode = function(category) {
        return iconMap[category];
      };

      let hashTable4UserDomainRole = {};

      const put2hashTable = function(entry) {
        if (!hashTable4UserDomainRole[entry.key]) {
          hashTable4UserDomainRole[entry.key] = [entry.value];
        } else {
          hashTable4UserDomainRole[entry.key].push(entry.value);
        }
      };

      const renderUserRoles = function(userRolesMap) {
        let userRoles = [];
        let domainRoles = [];
        hashTable4UserDomainRole = {};
        Object.entries(userRolesMap).forEach(([key, value]) => {
          if (!key && value) {
            userRoles.push(`${$sanitize(value)}(Global)`);
          }
          if (key) {
            let entry = {key: value, value: key};
            put2hashTable(entry);
          }
        });
        Object.entries(hashTable4UserDomainRole).forEach(([key, value]) => {
          userRoles.push(`${key}(${value.join(",")})`);
        });
        return `<strong>${$translate.instant("event.gridHeader.USER_ROLES")} :</strong><span>
                       ${$sanitize(userRoles.join(", "))}
                     </span><br/>`;
      };

      let columnDefs = [
        {
          headerName: $translate.instant("event.gridHeader.NAME"),
          field: "name",
          cellRenderer: "agGroupCellRenderer",
          cellRendererParams: { innerRenderer: eventCellRenderer },
          width: 170
        },
        {
          headerName: $translate.instant("event.gridHeader.LEVEL"),
          field: "level",
          cellRenderer: function(params) {
            let eventLevel = params.value;
            let className = $scope.getColorCode(eventLevel);
            return `<span class="label label-fs label-${className}">${$sanitize(Utils.getI18Name(
              eventLevel
            ))}</span>`;
          },
          width: 90,
          maxWidth: 90,
          minWidth: 90
        },
        {
          headerName: $translate.instant("event.gridHeader.USER"),
          field: "user",
          cellRenderer: function(params) {
            let user = "";
            if (params.data) {
              if (params.data.user) {
                user += `<strong>${$translate.instant("event.gridHeader.USER_NAME")} :</strong><span>
                               ${$sanitize(params.data.user)}
                             </span><br/>`;
              }
              if (params.data.user_roles) {
                user += renderUserRoles(params.data.user_roles);
              }
            }
            return $sanitize(user);
          },
          width: 200
        },
        {
          headerName: $translate.instant("event.gridHeader.LOCATION"),
          field: "workload_name",
          cellRenderer: function(params) {
            let location = "";
            if (params.data) {
              if (params.data.host_name) {
                location += `<strong>${$translate.instant("event.gridHeader.NODE")} :</strong><span>
                               ${params.data.host_name}
                             </span><br/>`;
              }
              if (params.data.workload_name) {
                location += `<strong>${$translate.instant("event.gridHeader.CONTAINER")} :</strong><span>
                                ${params.data.workload_domain
                                  ? `${params.data.workload_domain}: ${$sanitize(Utils.getDisplayName(
                                      params.value
                                    ))}`
                                  : Utils.getDisplayName(params.value)}
                             </span><br/>`;
              }
              if (params.data.workload_image) {
                location += `<strong>${$translate.instant("event.gridHeader.IMAGE")} :</strong><span>
                               ${params.data.workload_domain
                                  ? `${params.data.workload_domain}: ${params.data.workload_image}`
                                  : params.data.workload_image
                                }
                             </span><br/>`;
              }
              if (params.data.name === "Controller.Memory.Pressure" || params.data.name === "Controller.Memory.Overusage") {
                if (params.data.controller_id) {
                  location += `<strong>${$translate.instant("event.gridHeader.CONTROLLER_ID")} :</strong><span>
                                 ${params.data.controller_id}
                               </span><br/>`;
                }
                if (params.data.enforcer_name) {
                  location += `<strong>${$translate.instant("event.gridHeader.ENFORCER_ID")} :</strong><span>
                                 ${params.data.enforcer_name}
                               </span><br/>`;
                }
              }
              if (params.data.name === "Agent.Memory.Pressure" || params.data.name === "Agent.Memory.Overusage") {
                if (params.data.enforcer_name) {
                  location += `<strong>${$translate.instant("event.gridHeader.ENFORCER_ID")} :</strong><span>
                                 ${params.data.enforcer_name}
                               </span><br/>`;
                }
              }
            }
            return $sanitize(location);
          },
          width: 250
        },
        {
          headerName: "",
          field: "host_name",
          hide: true
        },
        {
          headerName: "",
          field: "workload_name",
          hide: true
        },
        {
          headerName: "",
          field: "workload_domain",
          hide: true
        },
        // {
        //   headerName: "",
        //   field: "workload_service",
        //   hide: true
        // },
        {
          headerName: "",
          field: "workload_image",
          hide: true
        },
        // {
        //   headerName: "",
        //   field: "controller_name",
        //   hide: true
        // },
        {
          headerName: "",
          field: "user",
          hide: true
        },
        {
          headerName: "",
          field: "user_roles",
          hide: true
        },
        {
          headerName: "",
          field: "user_addr",
          hide: true
        },
        {
          headerName: "",
          field: "rest_method",
          hide: true
        },
        {
          headerName: "",
          field: "rest_request",
          hide: true
        },
        {
          headerName: "",
          field: "rest_body",
          hide: true
        },
        // {
        //   headerName: "",
        //   field: "enforcer_limit",
        //   hide: true
        // },
        // {
        //   headerName: "",
        //   field: "license_expire",
        //   hide: true
        // },
        {
          headerName: $translate.instant("event.gridHeader.TIME"),
          field: "reported_at",
          cellRenderer: function(params) {
            return $sanitize($filter("date")(params.value, "MMM dd, y HH:mm:ss"));
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
        /** @namespace node1.data.reported_timestamp */
        return node1.data.reported_timestamp - node2.data.reported_timestamp;
      }

      const convertName = function(name) {
        return name.replace(/Crd/g, "CRD");
      };

      function eventCellRenderer(params) {
        return `<span style="cursor: default;">${convertName($sanitize(params.value))}</span>`;
      }

      function FullWidthCellRenderer() {}

      FullWidthCellRenderer.prototype.init = function(params) {
        let eTemp = document.createElement("div");
        eTemp.innerHTML = this.getTemplate(params);
        this.eGui = eTemp.firstElementChild;

        this.consumeMouseWheelOnCenterText();
      };

      const convertMessage = function(msg) {
        return msg.replace(/CustomResourceDefinition/g, "CRD");
      };

      const renderMemoryPressureMessage = function(msg) {
        console.log("msg",msg)
        let description = "";
        const itemMap = {
          "Level": "",
          "NetUsage": "",
          "UsageLimit": "",
          "ActiveAnon": "",
          "InactiveAnon": "",
          "MaxUsage": "",
          "Cache": "",
          "RSS": "",
          "Failcnt": "",
          "PageFaults": ""
        };

        Object.entries(msg).forEach(([k, v]) => {
          if (k === "Description") {
            description = `<div class="col-sm-12 text-warning">${v}</div>`;
          } else {
            if (k !== "Level" && k !== "Failcnt" &&  k !== "PageFaults") {
                itemMap[k] = `<div class="col-sm-6"><span class="text-bold">${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:</span>&nbsp;<span>${$filter("bytes")(v)}</span></div>`;
            } else {
              itemMap[k] = `<div class="col-sm-6"><span class="text-bold">${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:</span>&nbsp;<span>${Utils.numberWithCommas(v)}</span></div>`;
            }
            if (k === "UsageLimit" && v === MIN_UNIT64) {
              itemMap[k] = `<div class="col-sm-6"><span class="text-bold">${$translate.instant("event.msg.NOT_SET_LIMIT")}</span></div>`;
            }
          }
        });
        let itemizedDetails = Object.values(itemMap).join("");
        return `${description}${itemizedDetails}`;
      };

      const renderMemoryOverusageMessage = function(msg) {
        const itemMap = {
          "Percentage": "",
          "SystemTotal": "",
          "Usage": "",
          "SystemFree": ""
        };
        Object.entries(msg).forEach(([k, v]) => {
          if (k === "Percentage") {
            itemMap[k] = `<div class="col-sm-6"><span class="text-bold">${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:</span>&nbsp;<span>${v}%</span></div>`;
          } else {
            itemMap[k] = `<div class="col-sm-6"><span class="text-bold">${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:</span>&nbsp;<span>${$filter("bytes")(v)}</span></div>`;
          }
        });
        return Object.values(itemMap).join("");
      };

      FullWidthCellRenderer.prototype.getTemplate = function(params) {
        let data = params.node.data;
        let className = $scope.getIconCode(data.category);
        let colorName = $scope.getColorCode(data.level);
        let msg = $translate.instant("nodes.gridHeader.MESSAGE");
        let from = $translate.instant("policy.addPolicy.FROM").toLowerCase();
        let message =
          (
            data.name === "Controller.Memory.Pressure" ||
            data.name === "Agent.Memory.Pressure" ||
            data.name === "Controller.Memory.Overusage" ||
            data.name === "Agent.Memory.Overusage"
          ) ?
          JSON.parse(data.message) :
          convertMessage(data.message).replace(/\n/g, "<br/>").replace(/\s/g, "&nbsp;");
        /** @namespace data.user_addr */
        if (data.user_addr) {
          message = message + " " + from + " " + data.user_addr;
        }

        if (data.rest_request) {
          message = `${message}<br/>
                     <strong>${$translate.instant("event.gridHeader.REST_REQ")}:</strong> \
                     ${data.rest_method ? `${data.rest_method.toUpperCase()} - ` : ""}${data.rest_request}<br/>
                     ${data.rest_body ? `<strong>${$translate.instant("event.gridHeader.REST_BODY")}:</strong> ${data.rest_body}` : ""}`
        }

        if (data.name === "Controller.Memory.Pressure" || data.name === "Agent.Memory.Pressure") {
          message = renderMemoryPressureMessage(message);
        }

        if (data.name === "Controller.Memory.Overusage" || data.name === "Agent.Memory.Overusage") {
          message = renderMemoryOverusageMessage(message);
        }

        return (
          '<div class="full-width-panel">' +
          '  <div class="full-width-flag">' +
          '    <em class="fa ' +
          className +
          ' fa-2x text-primary mr-lg"></em>' +
          "  </div>" +
          '  <div class="full-width-summary">' +
          '    <span class="label label-' +
          colorName +
          '">' +
          $sanitize(msg) +
          "</span><br/>" +
          "  </div>" +
          '  <div class="full-width-center">' +
          $sanitize(message) +
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

      const isExternalFilterPresent = function() {
        return !_isFilterCleared();
      };

      const doesExternalFilterPass = function(node) {
        if (_isFilterCleared()) return true;
        return _filterFn(node.data);
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
          return rowIsNestedRow ? 100 : 90;
        },
        animateRows: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs,
        rowData: null,
        isExternalFilterPresent: isExternalFilterPresent,
        doesExternalFilterPass: doesExternalFilterPass,
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

      $scope.onFilterChanged = function(value) {
        filter = value;
        $scope.gridOptions.api.setQuickFilter(value);
        $scope.filteredEvents = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.map(node => node.data);
        let filteredCount = $scope.filteredEvents.length;
        $scope.count =
          filteredCount === $scope.events.length || value === ""
            ? `${$scope.events.length} ${getEntityName($scope.events.length)}`
            : `${found} ${filteredCount} ${getEntityName(
                filteredCount
              )} ${outOf} ${$scope.events.length} ${getEntityName(
                $scope.events.length
              )}`;
      };

      const getValueString = function(event) {
        return Object.values(event).map(value => {
          if (typeof(value) === "object") {
            return JSON.stringify(value);
          } else {
            return value;
          }
        }).join(",");
      };

      const _levelFilter = function(level, levelFilter) {
        if (
          !levelFilter.isFilteringError &&
          !levelFilter.isFilteringCritical &&
          !levelFilter.isFilteringWarning &&
          !levelFilter.isFilteringInfo &&
          !levelFilter.isFilteringNotice
        ) {
          return true;
        } else {
          let res = false;
          if (levelFilter.isFilteringError) res = res || level.toLowerCase() === "error";
          if (levelFilter.isFilteringCritical) res = res || level.toLowerCase() === "critical";
          if (levelFilter.isFilteringWarning) res = res || level.toLowerCase() === "warning";
          if (levelFilter.isFilteringInfo) res = res || level.toLowerCase() === "info";
          if (levelFilter.isFilteringNotice) res = res || level.toLowerCase() === "notice";
          return res;
        }
      };

      const _nameFilter = function(name, selectedSearchingName, typedSearchingName) {
        if (selectedSearchingName) {
          return name.toLowerCase() === selectedSearchingName.value.toLowerCase();
        } else if (typedSearchingName) {
          return name.toLowerCase() === typedSearchingName.toLowerCase();
        } else {
          return true;
        }
      };

      const _userNameFilter = function(userName, selectedSearchingUserName, typedSearchingUserName) {
        if (selectedSearchingUserName) {
          return userName.toLowerCase() === selectedSearchingUserName.value.toLowerCase();
        } else if (typedSearchingUserName) {
          return userName.toLowerCase() === typedSearchingUserName.toLowerCase();
        } else {
          return true;
        }
      };

      const _nodeFilter = function(hostName, selectedSearchingHostName, typedSearchingHostName) {
        if (selectedSearchingHostName) {
          return hostName.toLowerCase() === selectedSearchingHostName.value.toLowerCase();
        } else if (typedSearchingHostName) {
          return hostName.toLowerCase() === typedSearchingHostName.toLowerCase();
        } else {
          return true;
        }
      };

      const _containerFilter = function(event, selectedSearchingContainer, typedSearchingContainer) {
        if (selectedSearchingContainer) {
          if (event.workload_name) return event.workload_name.toLowerCase() === selectedSearchingContainer.value.toLowerCase();
          else return false;
        } else if (typedSearchingContainer) {
          if (event.workload_name) return event.workload_name.toLowerCase() === typedSearchingContainer.toLowerCase();
          else return false;
        }else {
          return true;
        }
      };

      const _imageFilter = function(event, selectedSearchingImage, typedSearchingImage) {
        if (selectedSearchingImage) {
          if (event.workload_image) return event.workload_image.toLowerCase() === selectedSearchingImage.value.toLowerCase();
          else return false;
        } else if (typedSearchingImage) {
          if (event.workload_image) return event.workload_image.toLowerCase() === typedSearchingImage.toLowerCase();
          else return false;
        } else {
          return true;
        }
      };

      const _domainFilter = function(event, searchingDomains) {
        if (searchingDomains.length > 0) {
          if (event.workload_domain) {
            return searchingDomains.map(domain => domain.name).indexOf(event.workload_domain) >= 0;
          } else {
            return false;
          };
        } else {
          return true;
        }
      };

      const _keyword = function(event, keyword) {
        if (!keyword) return true;
        let _event = angular.copy(event);
        if (_event.items) _event.items = event.items.join(",");
        _event.reported_at = $filter("date")(event.reported_at, "MMM dd, y HH:mm:ss");
        let valueString = getValueString(_event);
        return valueString.toLowerCase().includes(keyword.toLowerCase());
      };

      const _excludedword = function(event, keyword) {
        console.log("event:", event)
        if (!keyword) return true;
        let _event = angular.copy(event);
        if (_event.items) _event.items = event.items.join(",");
        _event.reported_at = $filter("date")(event.reported_at, "MMM dd, y HH:mm:ss");
        let valueString = getValueString(_event);
        console.log("valueString:", valueString)
        return !valueString.toLowerCase().includes(keyword.toLowerCase());
      };

      const _dateFilter = function(reportedTimestamp, selectedFrom, selectedTo) {
        if (selectedFrom && selectedTo) {
          return (reportedTimestamp <= Math.floor((selectedTo.getTime() + 24*60*60*1000) /1000) &&
                  reportedTimestamp >= Math.floor(selectedFrom.getTime() / 1000));
        } else if (selectedFrom) {
          return reportedTimestamp >= Math.floor(selectedFrom.getTime() / 1000);
        } else if (selectedTo) {
          return reportedTimestamp <= Math.floor((selectedTo.getTime() + 24*60*60*1000) / 1000);
        } else {
          return true;
        }
      };

      const _filterFn = function(event) {
        return (
          _dateFilter(event.reported_timestamp, $scope.reportedFrom, $scope.reportedTo) &&
          _levelFilter(event.level, $scope.levelFilter) &&
          _nameFilter(event.name, $scope.selectedItemName, $scope.searchTextName) &&
          _userNameFilter(event.user, $scope.selectedItemUserName, $scope.searchTextUserName) &&
          _nodeFilter(event.host_name, $scope.selectedItemNode, $scope.searchTextNode) &&
          _containerFilter(event, $scope.selectedItemContainer, $scope.searchTextContainer) &&
          _imageFilter(event, $scope.selectedItemImage, $scope.searchTextImage) &&
          _domainFilter(event, $scope.selectedDomains) &&
          _keyword(event, $scope.otherKey) &&
          _excludedword(event, $scope.excludedKey)
        );
      };

      $scope.onAdvFilterChanged = function() {
        $scope.search = "";
        filter = "";
        $scope.gridOptions.api.onFilterChanged();
        $scope.filteredEvents = $scope.gridOptions.api.getModel().rootNode
          .childrenAfterFilter.map(node => node.data);
        let filteredCount = $scope.filteredEvents.length;
        console.log("adv filtered cnt: ", filteredCount);
        $scope.count =
          filteredCount === $scope.events.length
            ? `${$scope.events.length} ${getEntityName($scope.events.length)}`
            : `${found} ${filteredCount} / ${$scope.events.length} ${getEntityName(
                $scope.events.length
              )}`;

        $scope.onAdvFilter = false;
        $scope.isAdvFilterInUse = !_isFilterCleared();
      };

      $scope.resetAdvFilter = function() {
        _initializeAdvFilter();
        $scope.gridOptions.api.setRowData($scope.events);
        $scope.count = `${$scope.events.length} ${getEntityName(
          $scope.events.length
        )}`;

        $scope.onAdvFilter = false;
        $scope.isAdvFilterInUse = false;
      };

      const _isFilterCleared =function() {
        return (
          !$scope.levelFilter.isFilteringError &&
          !$scope.levelFilter.isFilteringCritical &&
          !$scope.levelFilter.isFilteringWarning &&
          !$scope.levelFilter.isFilteringInfo &&
          !$scope.levelFilter.isFilteringNotice &&

          ($scope.selectedItemName === null ||
          $scope.searchTextName === "") &&
          ($scope.selectedItemUserName === null ||
          $scope.searchTextUserName === "") &&
          ($scope.selectedItemNode === null ||
          $scope.searchTextNode === "") &&
          ($scope.selectedItemContainer === null ||
          $scope.searchTextContainer === "") &&
          ($scope.selectedItemImage === null ||
          $scope.searchTextImage === "") &&
          $scope.selectedDomains.length === 0 &&
          !$scope.otherKey &&
          !$scope.excludedKey &&

          $scope.reportedFrom === null &&
          $scope.reportedTo === null
        );
      };

      $scope.format = "dd-MMMM-yyyy";

      const disabled4From = function(data) {
        console.log("datepicker-data: ", data);
        let date = data.date;
        let mode = data.mode;
        return $scope.reportedTo && data.date > $scope.reportedTo;
      };

      const disabled4To = function(data) {
        console.log("datepicker-data: ", data);
        let date = data.date;
        let mode = data.mode;
        return $scope.reportedFrom && data.date < $scope.reportedFrom;
      };

      $scope.dateOptionsFrom = {
        dateDisabled: disabled4From,
        formatYear: "yy",
        maxDate: new Date(),
        minDate: new Date(2000, 1, 1),
        startingDay: 1
      };

      $scope.dateOptionsTo = {
        dateDisabled: disabled4To,
        formatYear: "yy",
        maxDate: new Date(),
        minDate: new Date(2000, 1, 1),
        startingDay: 1
      };

      $scope.openDate1 = function() {
        $scope.popup.opened1 = true;
      };
      $scope.openDate2 = function() {
        $scope.popup.opened2 = true;
      };

      $scope.checkDateRange = function() {
        if ($scope.reportedFrom && $scope.reportedTo) {
          console.log("Comparing: ", $scope.reportedFrom > $scope.reportedTo);
          $scope.isInvalidDateRange = $scope.reportedFrom > $scope.reportedTo;
        } else {
          $scope.isInvalidDateRange = false;
        }
        console.log("$scope.isInvalidDateRange: ", $scope.isInvalidDateRange, $scope.reportedFrom, $scope.reportedTo);
      };

      $scope.setPublishedType = function(publishedType) {
        $scope.advFilter.publishedType = publishedType;
      };

      const _getNameAutoCompleteData = function(events) {
        let names = new Set(events.map(event => event.name));
        $scope.autocompleteNames =
          Array.from(names)
          .filter(name => !!name)
          .sort()
          .map(function(name) {
            return {
              value: name,
              display: name
            };
          });
      };
      const _getUserNameAutoCompleteData = function(events) {
        let userNames = new Set(events.map(event => event.user));
        $scope.autocompleteUserNames =
          Array.from(userNames)
          .filter(userName => !!userName)
          .sort()
          .map(function(userName) {
            return {
              value: userName,
              display: userName
            };
          });
      };
      const _getNodeAutoCompleteData = function(events) {
        let nodes = new Set(events.map(event => event.host_name));
        $scope.autocompleteNodes =
          Array.from(nodes)
          .filter(node => !!node)
          .sort()
          .map(function(node) {
            return {
              value: node,
              display: node
            };
          });
      };

      const _getContainerAutoCompleteData = function(events) {
        let containers = new Set(events.map(event => event.workload_name));
        $scope.autocompleteContainers =
          Array.from(containers)
          .filter(container => !!container)
          .sort()
          .map(function(container) {
            return {
              value: container,
              display: container
            };
          });
      };

      const _getImageAutoCompleteData = function(events) {
        let images = new Set(events.map(event => event.workload_image));
        $scope.autocompleteImages =
          Array.from(images)
          .filter(image => !!image)
          .sort()
          .map(function(image) {
            return {
              value: image,
              display: image
            };
          });
      };

      const _getNamesapceAutoCompleteData = function(events) {
        let namespaces = new Set(events.map(event => event.workload_domain));
        $scope.domainList =
          Array.from(namespaces)
          .filter(namespace => !!namespace)
          .sort();
      };

      $scope.loadTags = function(query) {
        const createFilter = function(query) {
          let lowercaseQuery = angular.lowercase(query);
          return function filterFn(criteria) {
            return (criteria.toLowerCase().indexOf(lowercaseQuery) >= 0);
          };
        }
        let domains = $scope.domainList;
        return query
          ? domains.filter(createFilter(query))
          : [];
      };

      $scope.refresh = function() {
        $scope.eventsErr = false;
        $http
          .get(EVENT_URL)
          .then(function(response) {
            $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
              "general.NO_ROWS"
            );
            $scope.events = response.data.events;
            _getNameAutoCompleteData($scope.events);
            _getUserNameAutoCompleteData($scope.events);
            _getNodeAutoCompleteData($scope.events);
            _getContainerAutoCompleteData($scope.events);
            _getImageAutoCompleteData($scope.events);
            _getNamesapceAutoCompleteData($scope.events);
            $scope.gridOptions.api.setRowData($scope.events);
            $scope.count = `${$scope.events.length} ${getEntityName(
              $scope.events.length
            )}`;
            $scope.onFilterChanged(filter);
          })
          .catch(function(err) {
            console.warn(err);
            $scope.eventsErr = true;
            $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
            $scope.gridOptions.api.setRowData();
          });
      };

      $scope.refresh();

      const renderMemoryPressureMessage4Csv = function(msg) {
        let description = "";
        const itemMap = {
          "Description": "",
          "Level": "",
          "UsageRatio": "",
          "NetUsage": "",
          "UsageLimit": "",
          "ActiveAnon": "",
          "InactiveAnon": "",
          "MaxUsage": "",
          "Cache": "",
          "RSS": "",
          "Failcnt": "",
          "PageFaults": ""
        };

        Object.entries(msg).forEach(([k, v]) => {
          if (k === "Description") {
            itemMap[k] = v;
          } else {
            if (k !== "Level" && k !== "Failcnt" &&  k !== "PageFaults") {
              if (k === "UsageRatio") {
                itemMap[k] = `${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:${v}%`;
              } else {
                itemMap[k] = `${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:${$filter("bytes")(v)}`;
              }
            } else {
              itemMap[k] = `${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:${Utils.numberWithCommas(v)}`;
            }
            if (k === "UsageLimit" && v === MIN_UNIT64) {
              itemMap[k] = `${$translate.instant("event.msg.NOT_SET_LIMIT")}`;
            }
          }
        });
        return Object.values(itemMap).join(";");
      };

      const renderMemoryOverusageMessage4Csv = function(msg) {
        const itemMap = {
          "Percentage": "",
          "SystemTotal": "",
          "Usage": "",
          "SystemFree": ""
        };
        Object.entries(msg).forEach(([k, v]) => {
          if (k === "Percentage") {
            itemMap[k] = `${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:${v}`;
          } else {
            itemMap[k] = `${$translate.instant(`event.msg.${Utils.parseDivideStyle(k).toUpperCase()}`)}:${$filter("bytes")(v)}`;
          }
        });
        return Object.values(itemMap).join(";");
      };

      $scope.exportCsv = function() {
        if ($scope.filteredEvents && $scope.filteredEvents.length > 0) {
          let events4Csv = JSON.parse(JSON.stringify($scope.filteredEvents));
          events4Csv = events4Csv.map(function(event) {
            if (!event.enforcer_limit) event.enforcer_limit = 0;
            if (!event.license_expire) event.license_expire = "";
            if (event.user_roles) {
              console.log(event.user_roles)
              event.user_roles = JSON.stringify(event.user_roles).replace(/\"/g, "'");
              console.log(event.user_roles)
            }
            if (
              event.name === "Controller.Memory.Pressure" ||
              event.name === "Agent.Memory.Pressure"
            ) {
              event.message = renderMemoryPressureMessage4Csv(JSON.parse(event.message));
            } else if(
              event.name === "Controller.Memory.Overusage" ||
              event.name === "Agent.Memory.Overusage"
            ) {
              event.message = renderMemoryOverusageMessage4Csv(JSON.parse(event.message));
            } else {
              event.message = `${event.message.replace(/\"/g, "'")}`;
            }
            return event;
          });
          let csv = Utils.arrayToCsv(events4Csv);
          let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          FileSaver.saveAs(blob, `Events_${Utils.parseDatetimeStr(new Date())}.csv`);
        }
      };
    }
  }
})();
