(function() {
  "use strict";

  angular.module("app.utils").service("Utils", Utils);

  Utils.$inject = [
    "$http",
    "$window",
    "NV_MEDIA_QUERY",
    "$translate",
    "$filter",
    "$sanitize"
  ];

  function Utils(
    $http,
    $window,
    NV_MEDIA_QUERY,
    $translate,
    $filter,
    $sanitize
  ) {
    let $html = angular.element("html"),
      $win = angular.element($window),
      $body = angular.element("body");

    const topBar = 65;
    const sectionPadding = 20 * 2;
    const verticalPadding = 15 * 2;
    const header = 53;
    const title = 40;
    const marginInBoxes = 18;

    return {

      isOnMobile: function() {
        return $win.width() < NV_MEDIA_QUERY.tablet;
      },

      isTouchable: function() {
        return $html.hasClass("touch");
      },

      isSubmenuCollapsed: function() {
        return $body.hasClass("aside-collapsed");
      },

      isSidebarToggled: function() {
        return $body.hasClass("aside-toggled");
      },

      /**
       * @return {string}
       */
      arrayToCsv: function(array, title = "") {
        let line = "";
        let result = "";
        let columns = [];
        if (title.length > 0) {
          result += title + "\r\n";
        }
        let i = 0;
        for (let key in array[0]) {
          let keyString = key + ",";
          columns[i] = key;
          line += keyString;
          i++;
        }

        line = line.slice(0, -1);
        result += line + "\r\n";

        for (let i = 0; i < array.length; i++) {
          let line = "";

          for (let j = 0; j < columns.length; j++) {
            let value = array[i][columns[j]];
            if (value === undefined || value === null) value = "";
            line += `"${value}"` + ",";
          }

          line = line.slice(0, -1);
          result += line + "\r\n";
        }
        return result;
      },

      getEndPointType: function(name) {
        if (name) {
          if (name.indexOf("Host:") === 0)
            return '<em class="fa fa-server text-primary mr-sm"></em>';
          else if (name.indexOf("Workload:") === 0)
            return '<em class="fa fa-square text-primary mr-sm"></em>';
          else if (name.indexOf("external") === 0)
            return '<em class="fa fa-cloud text-primary mr-sm"></em>';
          else if (name.indexOf("IP-Group:") === 0)
            return '<em class="fa fa-th-large text-primary mr-sm"></em>';
          else return '<em class="fa fa-square-o text-primary mr-sm"></em>';
        }
        return "";
      },

      _keyStr:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

      /* will return a  Uint8Array type */
      decodeArrayBuffer: function(input) {
        let bytes = (input.length / 4) * 3;
        let ab = new ArrayBuffer(bytes);
        this.decode(input, ab);

        return ab;
      },

      removePaddingChars: function(input) {
        let lkey = this._keyStr.indexOf(input.charAt(input.length - 1));
        if (lkey === 64) {
          return input.substring(0, input.length - 1);
        }
        return input;
      },

      decode: function(input, arrayBuffer) {
        //get last chars to see if are valid
        input = this.removePaddingChars(input);
        input = this.removePaddingChars(input);

        let bytes = parseInt((input.length / 4) * 3, 10);

        let uarray;
        let chr1, chr2, chr3;
        let enc1, enc2, enc3, enc4;
        let i = 0;
        let j = 0;

        if (arrayBuffer) uarray = new Uint8Array(arrayBuffer);
        else uarray = new Uint8Array(bytes);

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        for (i = 0; i < bytes; i += 3) {
          //get the 3 octets in 4 ascii chars
          enc1 = this._keyStr.indexOf(input.charAt(j++));
          enc2 = this._keyStr.indexOf(input.charAt(j++));
          enc3 = this._keyStr.indexOf(input.charAt(j++));
          enc4 = this._keyStr.indexOf(input.charAt(j++));

          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;

          uarray[i] = chr1;
          if (enc3 !== 64) uarray[i + 1] = chr2;
          if (enc4 !== 64) uarray[i + 2] = chr3;
        }

        return uarray;
      },

      numericTextInputOnly: function(evt) {
        let event = evt || window.event;
        // event.persist();
        let key = event.keyCode || event.which;
        let isRemoving = key === 8;
        key = String.fromCharCode(key);
        let regex = /[0-9]|\./;
        if (!regex.test(key) && !isRemoving) {
          event.returnValue = false;
          if (event.preventDefault) event.preventDefault();
        } else {
          return true;
        }
      },
      threeWayMerge: function(arr1, arr2, arr3, comparer, target) {
        let params = [arr1, arr2, arr3];
        params.sort(function(a, b) {
          if (a.length && b.length && a[0][comparer] > b[0][comparer]) {
            return 1;
          } else if (a.length && b.length && a[0][comparer] < b[0][comparer]) {
            return -1;
          } else if (!a.length || !b.length) {
            return 1;
          } else {
            return 0;
          }
        });
        arr1 = params[0];
        arr2 = params[1];
        arr3 = params[2];

        let p1 = 0;
        let p2 = 0;
        let p3 = 0;
        let res = [];
        let end1 = arr1.length;
        let end2 = arr2.length;
        let end3 = arr3.length;

        while (p1 < end1 && p2 < end2 && p3 < end3) {
          if (arr1[p1][comparer] < arr2[p2][comparer]) {
            if (arr1[p1][comparer] < arr3[p3][comparer]) {
              res.push(
                target || target === 0 ? arr1[p1++][target] : arr1[p1++]
              );
            } else {
              res.push(
                target || target === 0 ? arr3[p3++][target] : arr3[p3++]
              );
            }
          } else {
            if (arr2[p2][comparer] < arr3[p3][comparer]) {
              res.push(
                target || target === 0 ? arr2[p2++][target] : arr2[p2++]
              );
            } else {
              res.push(
                target || target === 0 ? arr3[p3++][target] : arr3[p3++]
              );
            }
          }
        }
        while (p1 < end1 && p2 < end2) {
          if (arr1[p1][comparer] < arr2[p2][comparer]) {
            res.push(target || target === 0 ? arr1[p1++][target] : arr1[p1++]);
          } else {
            res.push(target || target === 0 ? arr2[p2++][target] : arr2[p2++]);
          }
        }
        while (p2 < end2 && p3 < end3) {
          if (arr2[p2][comparer] < arr3[p3][comparer]) {
            res.push(target || target === 0 ? arr2[p2++][target] : arr2[p2++]);
          } else {
            res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
          }
        }
        while (p1 < end1 && p3 < end3) {
          if (arr1[p1][comparer] < arr3[p3][comparer]) {
            res.push(target || target === 0 ? arr1[p1++][target] : arr1[p1++]);
          } else {
            res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
          }
        }
        while (p1 < end1) {
          res.push(target || target === 0 ? arr1[p1++][target] : arr1[p1++]);
        }
        while (p2 < end2) {
          res.push(target || target === 0 ? arr2[p2++][target] : arr2[p2++]);
        }
        while (p3 < end3) {
          res.push(target || target === 0 ? arr3[p3++][target] : arr3[p3++]);
        }
        return res.filter(
          (value, index, self) => self.indexOf(value) === index
        );
      },
      getDisplayName: function(originalName) {
        if (originalName) {
          const kube = "k8s";
          let nameSec = originalName.split("_");
          if (nameSec[0] === kube) {
            return nameSec[2];
          } else {
            return originalName;
          }
        }
        return "";
      },
      getI18Name: function(name) {
        return $translate.instant("enum." + name.toUpperCase());
      },
      truncateString: function(str, num) {
        if (str.length > num && num >= 3) {
          return str.slice(0, num - 3) + "...";
        }

        if (str.length > num && num <= 3) {
          return str.slice(0, num) + "...";
        } else {
          return str.slice(0);
        }
      },
      stringToColour: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let colour = "";
        for (let i = 0; i < 3; i++) {
          let value = (hash >> (i * 8)) & 0xff;
          colour += ("00" + value.toString(16)).substr(-2);
        }
        return colour;
      },
      isAuthorized(userRoles, resource) {
        let max = 0;
        for (let roleType in userRoles) {
          if (userRoles[roleType] >= resource[roleType]) {
            return true;
          }
          //Temporary for 2.0.0 which is without namespace level details of authorization
          if (resource.namespace && roleType !== "global") {
            max = Math.max(parseInt(userRoles[roleType], 10), max);
            if (max >= resource.namespace) {
              return true;
            }
          }
        }
        return false;
      },
      getEntityName(count, entityName) {
        return count > 1
          ? entityName
          : singularMap[entityName]
          ? singularMap[entityName]
          : entityName;
      },
      keepAlive(success, error) {
        $http
          .patch(HEART_BEAT_URL)
          .then(function(response) {
            if (success) success(response);
          })
          .catch(function(err) {
            console.warn(err);
            if (error) error(err);
          });
      },
      getErrorMessage(err) {
        let contentType = err.headers("Content-Type");
        if(contentType) {
          if (contentType.includes("text/plain")) {
            return $sanitize(err.data);
          } else if (contentType.includes("application/json")) {
            return $sanitize(err.data.message);
          } else {
            return $translate.instant("general.UNFORMATTED_ERR");
          }
        } else  {
          return $translate.instant("general.UNFORMATTED_ERR");
        }
      },
      getAlertifyMsg(error, errBrief, isHtml) {
        let message = "";
        if (typeof(error) === "string") {
          message = error;
        } else {
          message = this.getErrorMessage(error);
        }
        if (isHtml) {
          return '<div class="server-error" style="padding: 0">' +
            '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
            '<div><span class="error-text">' +
            errBrief +
            ": " +
            message.charAt(0).toUpperCase() +
            message.slice(1) +
            "</span></div></div>";
        } else {
          return errBrief +
            ": " +
            message.charAt(0).toUpperCase() +
            message.slice(1);
        }
      },
      getOverlayTemplateMsg(error) {
        let message = this.getErrorMessage(error);
        return '<div class="server-error">' +
          '<div><em class="fa fa-times-circle error-signal" aria-hidden="true"></em></div>' +
          '<div><span class="error-text">' +
          message +
          "</span></div></div>";
      },
      restrictLength4Autocomplete(str, maxLength) {
        if (typeof str === "string") {
          return str.substring(0, maxLength);
        }
      },
      parseLocalDate(datetime) {
        return datetime.split("T")[0].replace(/-/g, "");
      },
      getDuration(date1, date2) {
        //date format: "yyyymmdd"
        let a = moment([
          parseInt(date1.substring(0, 4), 10),
          parseInt(date1.substring(4, 6), 10) - 1,
          parseInt(date1.substring(6, 8), 10)
        ]);
        let b = moment([
          parseInt(date2.substring(0, 4), 10),
          parseInt(date2.substring(4, 6), 10) - 1,
          parseInt(date2.substring(6, 8), 10)
        ]);
        return a.diff(b, "days");
      },
      CALENDAR: {
        YEARS: "years",
        MONTHS: "months",
        DAYS: "days",
        HOURS: "hours",
        MINUTES: "minutes",
        SECONDS: "seconds"
      },
      getDateByInterval(base, interval, intervalUnit, pattern) {
        //base format: "yyyymmddHHmmss"
        let resDateObj = moment([
          parseInt(base.substring(0, 4), 10),
          parseInt(base.substring(4, 6), 10) - 1,
          parseInt(base.substring(6, 8), 10),
          base.length > 8 ? parseInt(base.substring(8, 10)) : 0,
          base.length > 8 ? parseInt(base.substring(10, 12)) : 0,
          base.length > 8 ? parseInt(base.substring(12, 14)) : 0
        ]).add(interval, intervalUnit);
        return $filter("date")(
          resDateObj.toDate(),
          pattern ? pattern : "yyyyMMddHHmmss"
        );
      },
      groupBy(array, key) {
        return array.reduce(function(res, elem) {
          (res[elem[key]] = res[elem[key]] || []).push(elem);
          return res;
        }, {});
      },
      parseDatetimeStr(datetimeObj, pattern) {
        return $filter("date")(
          datetimeObj,
          pattern ? pattern : "yyyyMMddHHmmss"
        );
      },
      capitalizeWord(word) {
        return `${word.charAt(0).toUpperCase()}${word.substring(1)}`;
      },
      parseCamelStyle(str, divider, isCapitalInit) {
        return str
          .split(divider)
          .map((elem, index) => {
            return !isCapitalInit && index === 0
              ? elem
              : this.capitalizeWord(elem);
          })
          .join("");
      },
      isUpperCase(letter) {
        return letter === letter.toUpperCase();
      },
      parseDivideStyle(str, divider = "_") {
        return str
          .replace(/([a-z0-9])([A-Z])/g, "$1" + divider + "$2")
          .toLowerCase();
      },
      shortenString(str, limit) {
        if (str.length > limit) {
          return `${str.substring(0, limit - 3)}...${str.substring(
            str.length - 3,
            str.length
          )}`;
        }
        return str;
      },
      getMessageFromItemError(message) {
        let indexOfErrorBody = message.indexOf("{");
        let errorBodyStr = message.substring(indexOfErrorBody);
        console.log(errorBodyStr);
        let errorBodyObj = JSON.parse(errorBodyStr);
        console.log(errorBodyObj.error || errorBodyObj.message);
        return errorBodyObj.error || errorBodyObj.message;
      },
      createGridOptions(columnDefs) {
        let option;
        option = {
          headerHeight: 30,
          rowHeight: 30,
          enableSorting: true,
          animateRows: true,
          enableColResize: true,
          angularCompileRows: true,
          suppressDragLeaveHidesColumns: true,
          columnDefs: columnDefs,
          rowSelection: "single",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
          },
          onGridReady: function(params) {
            setTimeout(function() {
              params.api.sizeColumnsToFit();
            }, 500);
            $win.on("resize.#agGrid", function() {
              setTimeout(function() {
                params.api.sizeColumnsToFit();
              }, 300);
            });
          },
          overlayNoRowsTemplate: `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`
        };
        return option;
      },
      removeGroupExceptions(groups, policyType) {
        let groupExceptions = KIND_EXCEPTION_MAP[policyType];
        groupExceptions.forEach(groupException => {
          let index = groups.indexOf(groupException);
          if (index >= 0) groups.splice(index, 1);
        });
        return groups;
      },
      getMasterDetailHeight() {
        return $window.innerHeight - topBar - sectionPadding - header;
      },
      getMasterGridHeight() {
        return (
          0.5 * this.getMasterDetailHeight() -
          verticalPadding -
          title -
          marginInBoxes
        );
      },
      getDetailViewHeight() {
        return 0.5 * this.getMasterDetailHeight() - verticalPadding - title;
      },
      renameKey(obj, old_key, new_key) {
        if (old_key !== new_key) {
          Object.defineProperty(
            obj,
            new_key,
            Object.getOwnPropertyDescriptor(obj, old_key)
          );
          delete obj[old_key];
        }
      },
      isEmptyObj(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
      },
      setRisks(risks, workloadMap) {
        return risks.map(risk => {
          if (risk.workloads.length) {
            let domains = new Set(),
              services = new Set();
            risk.workloads.forEach(workload => {
              const theWorkload = workloadMap.get(workload.id);
              if (theWorkload && theWorkload.domain) {
                domains.add(theWorkload.domain);
                workload.domain = theWorkload.domain;
              }
              if (theWorkload && theWorkload.service_group.substring(3)) {
                services.add(theWorkload.service_group.substring(3));
                workload.service = theWorkload.service_group.substring(3);
              }
              if (theWorkload && theWorkload.image) {
                workload.image = theWorkload.image;
              }
            });
            risk.domains = Array.from(domains);
            risk.services = Array.from(services);
            return risk;
          } else {
            risk.domains = [];
            risk.services = [];
            return risk;
          }
        });
      },
      onHover(points, evt) {
        if (points.length === 0) {
          evt.toElement.attributes.style.nodeValue = evt.toElement.attributes.style.nodeValue.replace(
            "cursor: pointer;",
            ""
          );
          return;
        }
        let res = evt.toElement.attributes.style.nodeValue.match(
          /cursor: pointer;/
        );
        if (res === null) {
          evt.toElement.attributes.style.nodeValue += "cursor: pointer;";
        }
      },
      createFilter(query) {
        let lowercaseQuery = angular.lowercase(query);
        return function filterFn(criteria) {
          return (criteria.toLowerCase().indexOf(lowercaseQuery) >= 0);
        };
      },
      makeWorkloadData(workload, isChild) {
        return {
          layer: isChild ? "      Children" : "Parent",
          id: workload.id,
          display_name: workload.display_name,
          namespace: workload.domain,
          host_name: workload.host_name,
          image: workload.image,
          applications: workload.applications ? `'${workload.applications.join(", ")}'` : "",
          service_group: workload.service_group,
          network_mode: workload.network_mode,
          enforcer_name: workload.enforcer_name,
          privileged: workload.privileged,
          interfaces: workload.interfaces ? `'${Object.entries(workload.interfaces).map(([key, value]) => {
            //IP: ${value.ip}/${value.ip_prefix}, Gateway: ${value.gateway ? value.gateway : ""}
            return `${key} -> ${
              value.map(ipInfo => {
                return `IP: ${ipInfo.ip}/${ipInfo.ip_prefix}, Gateway: ${ipInfo.gateway ? ipInfo.gateway : "None"}`
              }).join(", ")
            }`;
          })}'` : "",
          ports: workload.ports ? `'${workload.ports.map(port => {
            return `${port.host_ip}:${port.host_port} -> ${port.ip_proto === 6 ? 'TCP' : 'UDP'}/${port.port}`
          }).join(", ")}'` : "",
          labels: workload.labels ? `'${Object.entries(workload.labels).map(([key, value]) => {
            return `${key}: ${value}`;
          }).join(", ")}'` : "",
          vulnerability: workload.scan_summary ? `'Medium: ${workload.scan_summary.medium}, High: ${workload.scan_summary.high}'` : "",
          state: workload.state,
          started_at: `'${$filter("date")(workload.started_at, "MMM dd, y HH:mm:ss")}'`
        };
      },
      makeWorkloadsCsvData(workloads) {
        let workloadsCsvData = [];
        workloads.forEach(workload => {
          workloadsCsvData.push(this.makeWorkloadData(workload, false));
          if (workload.children && workload.children.length > 0) {
            workload.children.forEach(workload => {
              workloadsCsvData.push(this.makeWorkloadData(workload, true));
            });
          }
        });
        return workloadsCsvData;
      },
      loadPagedData(url, params, arrayName, cb, handleError, options = {}) {
        $http
          .get(url, {params: params})
          .then((res) => {
            let data = arrayName ? res.data[arrayName] : res.data;
            let length = arrayName ? res.data[arrayName].length : res.data.length;
            cb(data, options);
            if (length === params.limit) {
              params.start += params.limit;
              this.loadPagedData(url, params, arrayName, cb, options);
            }
          })
          .catch((e) => {
            handleError(e);
          });
      },
      escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;");

      },
      numberWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      },
      removeLeadingZero(str, exceptZero = false) {
        if (str && str.length > 0 && str !== "0") {
          return str.replace(/^[0]+/g, "");
        } else if (!exceptZero) {
          return str;
        }
      },
      validateUrl(url) {
        const pattern = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/);
        return pattern.test(url);
      },
      validateObjName(name) {
        const pattern = new RegExp(/^[a-zA-Z0-9]+[.:a-zA-Z0-9_-]*$/);
        return pattern.test(name);
      },
      dragElement(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(elmnt.id + "Header")) {
          document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
        } else {
          elmnt.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
          e = e || window.event;
          e.preventDefault();
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
          e = e || window.event;
          e.preventDefault();
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
          elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
          document.onmouseup = null;
          document.onmousemove = null;
        }
      },
      mapAssetsBrief(report, reportType) {
        let start = new Date(); //For profiling
        let count = 0;//For profiling
        let res = report[reportType].map(record => {
          record.platforms = record.platforms.map(platformId => {
            report.platforms[platformId][0].id = platformId;
            count++;
            return report.platforms[platformId][0];
          });
          record.images = record.images.map(imageId => {
            report.images[imageId][0].id = imageId;
            count++;
            return report.images[imageId][0];
          });
          record.nodes = record.nodes.map(nodeId => {
            report.nodes[nodeId][0].id = nodeId;
            count++;
            return report.nodes[nodeId][0];
          });
          record.workloads = record.workloads.map(workloadId => {
            report.workloads[workloadId][0].id = workloadId;
            count++;
            return report.workloads[workloadId][0];
          });
          return record;
        });
        console.log("mapAssetsBrief - Duration, Count", new Date() - start, count);
        return res;
      },
      sortByDisplayName(a,b) {
          const name_a = a.display_name.toLowerCase();
          const name_b = b.display_name.toLowerCase();
          if (name_a === name_b) return 0;
          return name_a > name_b ? 1 : -1;
      }
    };
  }
})();
