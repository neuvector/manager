(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("SecurityEventsFactory", function SecurityEventsFactory(
      $http,
      Alertify,
      $translate,
      $timeout,
      $window,
      $filter,
      $sanitize,
      Utils,
      AuthorizationFactory
    ) {
      const EVENT_TYPE = {
        THREAT: "threat",
        VIOLATION: "violation",
        INCIDENT: "incident"
      };

      const ENDPOINT = {
        DESTINATION: "destination",
        SOURCE: "source"
      };

      const TARGET = {
        SERVER: "server",
        CLIENT: "client"
      };

      const LABELS = {
        NETWORK: "network",
        PRIVILEGE: "privilege",
        FILE: "file",
        TUNNEL: "tunnel",
        PROCESS: "process",
        HOST: "host",
        CONTAINER: "container",
        PACKAGE: "package",
        OTHER: "other"
      };

      let resizeEvent = "resize.ag-grid";
      let $win = $($window);

      SecurityEventsFactory.LABELS = LABELS;

      SecurityEventsFactory.displayedSecurityEvents = [];

      SecurityEventsFactory.filterByLevels = function(level, ...checkedArray) {
        let res = false;
        let hasCheckedItems = false;
        for (let checkedItem of checkedArray) {
          if (checkedItem.value) {
            hasCheckedItems = true;
            if (level.toLowerCase() === checkedItem.key.toLowerCase()) {
              res = true;
            }
          }
        }
        return hasCheckedItems ? res : true;
      };

      SecurityEventsFactory.filterByLabels = function(labels, ...checkedArray) {
        let res = false;
        let hasCheckedItems = false;
        for (let checkedItem of checkedArray) {
          if (checkedItem.value) {
            hasCheckedItems = true;
            if (labels.indexOf(checkedItem.key) >= 0) {
              res = true;
            }
          }
        }
        return hasCheckedItems ? res : true;
      };

      SecurityEventsFactory.editDisplayedThreat = function(threat, ipMap) {
        let displayedThreat = {
          name: "",
          name4Pdf: "",
          type: {
            name: "",
            cssColor: ""
          },
          reportedAt: "",
          reportedTimestamp: 0,
          relativeDate: "",
          endpoint: {
            source: {},
            destination: {}
          },
          applications: "",
          hostId: "",
          hostName: "",
          enforcerId: "",
          enforcerName: "",
          details: {}
        };
        let source = _getEndpointDirection(
          threat,
          EVENT_TYPE.THREAT,
          ENDPOINT.SOURCE
        );
        let destination = _getEndpointDirection(
          threat,
          EVENT_TYPE.THREAT,
          ENDPOINT.DESTINATION
        );
        displayedThreat.id = threat.id;
        displayedThreat.name = threat.name;
        displayedThreat.name4Pdf = threat.name;
        displayedThreat.type.name = EVENT_TYPE.THREAT;
        displayedThreat.type.cssColor = "fa icon-size-2 fa-bug text-danger";
        displayedThreat.reportedAt = $filter("date")(
          threat.reported_at,
          "MMM dd, y HH:mm:ss"
        );
        displayedThreat.relativeDate = $filter("relativeDate")(
          displayedThreat.reportedAt
        );
        displayedThreat.orgReportedAt = $filter("date")(
          threat.reported_at,
          "yyyy-MM-ddTHH:mm:ss"
        );
        displayedThreat.reportedOn = $filter("date")(
          threat.reported_at,
          "yyyyMMdd"
        );
        displayedThreat.reportedTimestamp = threat.reported_timestamp;
        displayedThreat.endpoint.source = _getEndpointInfo(
          source,
          ENDPOINT.SOURCE,
          ipMap
        );
        displayedThreat.endpoint.destination = _getEndpointInfo(
          destination,
          ENDPOINT.DESTINATION,
          ipMap
        );
        displayedThreat.applications =
          threat.application.length > 0 ? $sanitize(threat.application) : null;
        displayedThreat.hostId = threat.host_id || "";
        displayedThreat.hostName = $sanitize(threat.host_name) || "";
        displayedThreat.enforcerId = threat.enforcer_id || "";
        displayedThreat.enforcerName = threat.enforcer_name || "";
        displayedThreat.details = _editThreatDetails(
          threat,
          source,
          destination
        );
        return displayedThreat;
      };

      SecurityEventsFactory.editDisplayedViolation = function(
        violation,
        ipMap
      ) {
        let displayedViolation = {
          name: "",
          name4Pdf: "",
          ruleId: 0,
          reviewRulePermission: "",
          type: {
            name: "",
            cssColor: ""
          },
          reportedAt: "",
          reportedTimestamp: 0,
          relativeDate: "",
          endpoint: {
            source: {},
            destination: {}
          },
          applications: "",
          hostId: "",
          hostName: "",
          enforcerId: "",
          enforcerName: "",
          details: {}
        };

        let source = _getEndpointDirection(
          violation,
          EVENT_TYPE.VIOLATION,
          ENDPOINT.SOURCE
        );
        let destination = _getEndpointDirection(
          violation,
          EVENT_TYPE.VIOLATION,
          ENDPOINT.DESTINATION
        );
        displayedViolation.name =
          violation.policy_id === 0
            ? $translate.instant("securityEvent.VIOLATION_NAME_DEFAULT")
            : $translate.instant("securityEvent.VIOLATION_NAME", {
                policy_id: violation.policy_id
              });
        displayedViolation.name4Pdf =
          violation.policy_id === 0
            ? $translate.instant(
                "securityEvent.VIOLATION_NAME_DEFAULT",
                {},
                "",
                "en"
              )
            : $translate.instant(
                "securityEvent.VIOLATION_NAME",
                {
                  policy_id: violation.policy_id
                },
                "",
                "en"
              );
        displayedViolation.reviewRulePermission = getReviewRulePermission(source.domain_name, destination.domain_name);
        displayedViolation.ruleId = violation.policy_id;
        displayedViolation.type.name = EVENT_TYPE.VIOLATION;
        displayedViolation.type.cssColor = "fa icon-size-2 fa-ban text-warning";
        displayedViolation.reportedAt = $filter("date")(
          violation.reported_at,
          "MMM dd, y HH:mm:ss"
        );
        displayedViolation.relativeDate = $filter("relativeDate")(
          displayedViolation.reportedAt
        );
        displayedViolation.orgReportedAt = $filter("date")(
          violation.reported_at,
          "yyyy-MM-ddTHH:mm:ss"
        );
        displayedViolation.reportedOn = $filter("date")(
          violation.reported_at,
          "yyyyMMdd"
        );
        displayedViolation.reportedTimestamp = violation.reported_timestamp;
        displayedViolation.endpoint.source = _getEndpointInfo(
          source,
          ENDPOINT.SOURCE,
          ipMap
        );
        displayedViolation.endpoint.destination = _getEndpointInfo(
          destination,
          ENDPOINT.DESTINATION,
          ipMap
        );
        let violationApps = violation.applications
          ? $sanitize(violation.applications.sort().join(", "))
          : null;
        displayedViolation.applications =
          violationApps.length > 0 ? violationApps : "";
        displayedViolation.hostId = violation.host_id || "";
        displayedViolation.hostName = $sanitize(violation.host_name) || "";
        displayedViolation.enforcerId = violation.enforcer_id || "";
        displayedViolation.enforcerName = violation.enforcer_name || "";
        displayedViolation.details = _editViolationDetails(violation);
        return displayedViolation;
      };

      SecurityEventsFactory.editDisplayedIncident = function(incident, ipMap) {
        let source = _getEndpointDirection(
          incident,
          EVENT_TYPE.INCIDENT,
          ENDPOINT.SOURCE
        );
        let destination = _getEndpointDirection(
          incident,
          EVENT_TYPE.INCIDENT,
          ENDPOINT.DESTINATION
        );
        let container = {
          domain: "",
          name: "",
          icon: "",
          id: "",
          service: "",
          isHyperlinkEnabled: false
        };
        if (source.workload_id || destination.workload_id) {
          if (source.workload_id) {
            container.domain = $sanitize(source.domain_name
              ? `${source.domain_name}`
              : "");
            container.name = $sanitize(source.workload_name
              ? Utils.getDisplayName(source.workload_name)
              : source.workload_id);
            container.id = source.workload_id;
            container.service = $sanitize(source.service);
            container.isHyperlinkEnabled = source.workload_id !== source.client_ip;
          } else if (!source.workload_id && destination.workload_id) {
            container.domain = $sanitize(destination.domain_name
              ? `${destination.domain_name}`
              : "");
            container.name = $sanitize(destination.workload_name
              ? Utils.getDisplayName(destination.workload_name)
              : destination.workload_id);
            container.id = destination.workload_id;
            container.service = $sanitize(destination.service);
            container.isHyperlinkEnabled = destination.workload_id !== destination.client_ip;
          }
        }

        let displayedIncident = {
          name: "",
          name4Pdf: "",
          reviewRulePermission: "",
          type: {
            name: "",
            cssColor: ""
          },
          reporteAt: "",
          reportedTimestamp: 0,
          relativeDate: "",
          endpoint: {
            source: {},
            destination: {}
          },
          host_name: "",
          container: {},
          applications: "",
          hostId: "",
          hostName: "",
          enforcerId: "",
          enforcerName: "",
          details: {}
        };

        displayedIncident.name = $translate.instant(
          `securityEvent.${incident.name.replace(/\./g, "_").toUpperCase()}`,
          {
            host_name: incident.host_name || "",
            container: container.id
              ? `${container.domain ? `${container.domain}:` : ""}${
                  container.service ? `${container.service}:` : ""
                }${container.name}`
              : "",
            file_path: incident.file_path || "",
            proc_name: incident.proc_name || "",
            proc_cmd: incident.proc_cmd || ""
          }
        );
        displayedIncident.name4Pdf = $translate.instant(
          `securityEvent.${incident.name.replace(/\./g, "_").toUpperCase()}`,
          {
            host_name: incident.host_name || "",
            container: container.id
              ? `${container.domain ? `${container.domain}:` : ""}${
                  container.service ? `${container.service}:` : ""
                }${container.name}`
              : "",
            file_path: incident.file_path || "",
            proc_name: incident.proc_name || "",
            proc_cmd: incident.proc_cmd || ""
          },
          "",
          "en"
        );
        displayedIncident.reviewRulePermission = getReviewRulePermission(source.domain_name, destination.domain_name);
        displayedIncident.type.name = EVENT_TYPE.INCIDENT;
        displayedIncident.type.cssColor =
          "fa icon-size-2 fa-exclamation-triangle text-muted";
        displayedIncident.reportedAt = $filter("date")(
          incident.reported_at,
          "MMM dd, y HH:mm:ss"
        );
        displayedIncident.relativeDate = $filter("relativeDate")(
          displayedIncident.reportedAt
        );
        displayedIncident.orgReportedAt = $filter("date")(
          incident.reported_at,
          "yyyy-MM-ddTHH:mm:ss"
        );
        displayedIncident.reportedOn = $filter("date")(
          incident.reported_at,
          "yyyyMMdd"
        );
        displayedIncident.reportedTimestamp = incident.reported_timestamp;
        displayedIncident.endpoint.source = _getEndpointInfo(
          source,
          ENDPOINT.SOURCE,
          ipMap
        );
        displayedIncident.endpoint.destination = _getEndpointInfo(
          destination,
          ENDPOINT.DESTINATION,
          ipMap
        );
        displayedIncident.host_name = $sanitize(incident.host_name);
        displayedIncident.container = container;
        displayedIncident.applications = $sanitize(incident.proc_path) || null;
        displayedIncident.hostId = incident.host_id || "";
        displayedIncident.hostName = $sanitize(incident.host_name) || "";
        displayedIncident.enforcerId = incident.enforcer_id || "";
        displayedIncident.enforcerName = incident.enforcer_name || "";
        displayedIncident.details = _editIncidentDetails(
          incident,
          source,
          destination
        );
        return displayedIncident;
      };

      SecurityEventsFactory.getSecurityEvents = function() {
        return $http.get(SECURITY_EVENTS_URL_2);
      };

      SecurityEventsFactory.getContainer = function(id) {
        return $http.get(`${CONTAINER_URL}${CONTAINER_BY_ID}`, {
          params: { id: id }
        });
      };

      SecurityEventsFactory.getHost = function(id) {
        return $http.get(NODES_URL, {
          params: { id: id }
        });
      }

      SecurityEventsFactory.getEnforcer = function(id) {
        return $http.get(SINGLE_ENFORCER, {
          params: { id: id }
        });
      }

      SecurityEventsFactory.getProcess = function(id) {
        return $http.get(CONTAINER_PROCESS_URL, { params: { id: id } });
      };

      let _getEndpointDirection = function(secEvent, type, side) {
        switch (type) {
          case EVENT_TYPE.THREAT:
            if (
              (secEvent.target === TARGET.SERVER && side == ENDPOINT.SOURCE) ||
              (secEvent.target !== TARGET.SERVER &&
                side == ENDPOINT.DESTINATION)
            ) {
              return {
                domain_name: $sanitize(secEvent.client_workload_domain) || "",
                workload_id: $sanitize(secEvent.client_workload_id) || "",
                workload_name: $sanitize(secEvent.client_workload_name) || "",
                ip: $sanitize(secEvent.client_ip) || "",
                port: secEvent.client_port || 0,
                server_conn_port: 0,
                service: $sanitize(secEvent.client_workload_service) || "",
                isHyperlinkEnabled: secEvent.client_ip !== secEvent.client_workload_id
              };
            } else {
              return {
                domain_name: $sanitize(secEvent.server_workload_domain) || "",
                workload_id: $sanitize(secEvent.server_workload_id) || "",
                workload_name: $sanitize(secEvent.server_workload_name) || "",
                ip: $sanitize(secEvent.server_ip) || "",
                port: secEvent.server_port || 0,
                server_conn_port: secEvent.server_conn_port || 0,
                service: $sanitize(secEvent.server_workload_service) || "",
                isHyperlinkEnabled: secEvent.server_ip !== secEvent.server_workload_id
              };
            }
          case EVENT_TYPE.VIOLATION:
            if (side == ENDPOINT.SOURCE) {
              return {
                domain_name: $sanitize(secEvent.client_domain) || "",
                workload_id: $sanitize(secEvent.client_id) || "",
                workload_name: $sanitize(secEvent.client_name) || "",
                ip: $sanitize(secEvent.client_ip) || "",
                port: 0,
                server_conn_port: 0,
                service: $sanitize(secEvent.client_service) || "",
                isHyperlinkEnabled: secEvent.client_ip !== secEvent.client_id
              };
            } else {
              return {
                domain_name: $sanitize(secEvent.server_domain) || "",
                workload_id: $sanitize(secEvent.server_id) || "",
                workload_name: $sanitize(secEvent.server_name) || "",
                ip: $sanitize(secEvent.server_ip) || "",
                port: secEvent.server_port || 0,
                server_conn_port: 0,
                service: $sanitize(secEvent.server_service) || "",
                isHyperlinkEnabled: secEvent.server_ip !== secEvent.server_id
              };
            }
          case EVENT_TYPE.INCIDENT:
            if (
              (secEvent.conn_ingress && side == ENDPOINT.SOURCE) ||
              (!secEvent.conn_ingress && side == ENDPOINT.DESTINATION)
            ) {
              return {
                domain_name: $sanitize(secEvent.remote_workload_domain) || "",
                workload_id: $sanitize(secEvent.remote_workload_id) || "",
                workload_name: $sanitize(secEvent.remote_workload_name) || "",
                ip: $sanitize(secEvent.server_ip) || "",
                port: secEvent.server_port || 0,
                server_conn_port: secEvent.server_conn_port || 0,
                service: $sanitize(secEvent.remote_workload_service) || "",
                isHyperlinkEnabled: secEvent.server_ip !== secEvent.remote_workload_id
              };
            } else {
              return {
                domain_name: $sanitize(secEvent.workload_domain) || "",
                workload_id: $sanitize(secEvent.workload_id) || "",
                workload_name: $sanitize(secEvent.workload_name) || "",
                ip: $sanitize(secEvent.client_ip) || "",
                port: secEvent.client_port || 0,
                server_conn_port: 0,
                service: $sanitize(secEvent.workload_service) || "",
                isHyperlinkEnabled: secEvent.client_ip !== secEvent.workload_id
              };
            }
          default:
            return null;
        }
      };

      let _getEndpointInfo = function(endpoint, side, ipMap) {
        /*
          function: prepareGroup
          description: It only serves for propose rule
        */
        const prepareGroup = function(service, endpointName) {
          console.log("service, endpointName: ",service, endpointName);
          if (service) {
            return service === securityEventLocation.EXTERNAL
              ? service //external
              : (endpointName.indexOf(securityEventLocation.IP_GROUP) === 0 ?
                `nv.ip.${service}`.replace(/\/|\?|\%|\&|\s/g, ":") /* Add 'nv.ip.' for IP service */:
                `nv.${service}`.replace(/\/|\?|\%|\&|\s/g, ":")); /* Add 'nv.' for learnt service */
                // replace(/\/|\?|\%|\&|\s/g, ":") is for resolving irregular symbol in service name
          } else {
            if (
              endpointName.indexOf(securityEventLocation.HOST) === 0//Host format is like Host:<host_name or IP>:host ID
            ) {
              return "nodes";
            } else if (
              endpointName.indexOf(securityEventLocation.WORKLOAD) === 0 // IP workload format is Workload:<workload IP>
            ) {
              let endpointNameParts = endpointName.split(":");
              return `${endpointNameParts[0].trim()}:${endpointNameParts[1].trim()}`;
            } else {
              return ""; //Exception fallback
            }
          }
        };
        if (endpoint.workload_id) {
          let id = $sanitize(endpoint.workload_id);
          let domain = $sanitize(endpoint.domain_name);
          let name = $sanitize(endpoint.workload_name) || "";
          let ip = $sanitize(endpoint.ip) || "";
          let port = $sanitize(endpoint.port).toString() || "0";
          let server_conn_port = $sanitize(endpoint.server_conn_port).toString() || "0";
          let service = $sanitize(endpoint.service) || "";
          let displayName = "";
          let group4Rule = "";
          let endpointOut = {
            id: "",
            domain: "",
            icon: "",
            displayName: "",
            externalURL: "",
            service: "",
            countryCode: "",
            countryName: "",
            ip: "",
            group4Rule: "",
            hasDetail: false,
            isHyperlinkEnabled: endpoint.isHyperlinkEnabled
          };
          if (side === ENDPOINT.SOURCE) {
            displayName = Utils.getDisplayName(name);
            if (name !== ip && ip) {
              if (displayName) {
                displayName = `${displayName} (${ip})`;
              } else {
                displayName = ip;
              }
            }
            if (id === securityEventLocation.EXTERNAL) {
              if (ip) {
                endpointOut.countryCode = ipMap[ip].country_code.toLowerCase();
                endpointOut.countryName = ipMap[ip].country_name;
                endpointOut.ip = ip;
                displayName = Utils.getDisplayName(name);
              }
              endpointOut.externalURL = `https://www.whois.com/whois/${ip}`;
            }
          } else {
            displayName = Utils.getDisplayName(name);
            if (name !== ip && ip) {
              if (displayName) {
                displayName = `${displayName} (${ip})`;
              } else {
                displayName = ip;
              }
            }
            if (id === securityEventLocation.EXTERNAL) {
              if (ip) {
                endpointOut.countryCode = ipMap[ip].country_code.toLowerCase();
                endpointOut.countryName = ipMap[ip].country_name;
                endpointOut.ip = ip;
                displayName = Utils.getDisplayName(name);
              }
              endpointOut.externalURL = `https://www.whois.com/whois/${ip}`;
            } else {
              displayName = Utils.getDisplayName(name);
              if (port === server_conn_port && port) {
                if (displayName) {
                  displayName = `${displayName}${port !== "0" ? `:${port}` : ""}`;
                } else {
                  displayName = port;
                }
              } else {
                if (displayName) {
                  displayName = `${displayName}${port !== "0" ? `:${port}` : ""}${server_conn_port !== "0" ? `(${server_conn_port})` : ""}`;
                } else {
                  displayName = `${port !== "0" ? `${port}` : ""}${server_conn_port !== "0" ? `(${server_conn_port})` : ""}`;
                }
              }
            }
          }
          if (service) {
            endpointOut.service = $sanitize(service);
          }
          endpointOut.id = id;
          if (name.indexOf(securityEventLocation.HOST) === 0) {
            endpointOut.icon = "fa-server";
            endpointOut.hasDetail = true;
          }
          else if (name.indexOf(securityEventLocation.WORKLOAD) === 0) {
            endpointOut.icon = "fa-square";
          }
          else if (name.indexOf(securityEventLocation.EXTERNAL) === 0)
            endpointOut.icon = "fa-cloud";
          else if (name.indexOf(securityEventLocation.IP_GROUP) === 0)
            endpointOut.icon = "fa-th-large";
          else {
            endpointOut.icon = "fa-square-o";
            endpointOut.hasDetail = true;
          }
          endpointOut.displayName = $sanitize(displayName);
          endpointOut.domain = $sanitize(domain);
          endpointOut.group4Rule = prepareGroup(service, name);
          return endpointOut;
        }
        return "";
      };

      let _convertThreatAction = function(action) {
        if (action.toLowerCase() === "monitor") return "alert";
        if (action.toLowerCase() === "block") return "deny";
        return action.toLowerCase();
      };

      let _editThreatDetails = function(threat, source, destination) {
        const iconMap = {
          Info: "fa-info",
          Low: "fa-support",
          Medium: "fa-bell",
          High: "fa-bug",
          Critical: "fa-bomb"
        };
        let details = {
          id: "",
          level: {
            name: "",
            cssColor: ""
          },
          action: {
            name: "",
            name4Pdf: "",
            cssColor: ""
          },
          count: 0,
          clusterName: "",
          message: {
            sourceLink: "",
            destinationLink: "",
            icon: "",
            cssColor: "",
            content: "",
            cap_len: 0
          },
          labels: []
        };
        details.id = threat.id;
        details.level.name = threat.level;
        details.level.cssColor =
          `label-${colourMap[threat.level]}` || "label-info";
        details.action.name = Utils.getI18Name(
          _convertThreatAction(threat.action)
        );
        details.action.name4pdf = _convertThreatAction(threat.action);
        details.action.cssColor =
          `${colourMap[_convertThreatAction(threat.action)]}` || "info";
        details.count = threat.count;
        details.clusterName = $sanitize(threat.cluster_name);
        details.message.sourceLink = $sanitize(`${source.ip}:${source.port}`);
        details.message.destinationLink = $sanitize(
          destination.port !== destination.server_conn_port
            ? `${destination.ip}:${destination.port}(${
                destination.server_conn_port
              })`
            : `${destination.ip}:${destination.port}`);
        details.message.icon = iconMap[threat.severity];
        details.message.cssColor = colourMap[threat.severity];
        details.message.content = $sanitize(threat.message)
                                  .replace("&amp;", "&")
                                  .replace("&lt;", "<")
                                  .replace("&gt;", ">");
        details.message.cap_len = threat.cap_len;
        details.labels.push(LABELS.NETWORK);
        return details;
      };

      let _editViolationDetails = function(violation) {
        let details = {
          level: {
            name: "",
            cssColor: ""
          },
          port: 0,
          serverPort: "",
          servers: "",
          serverImage: "",
          clusterName: "",
          action: {
            name: "",
            name4Pdf: "",
            cssColor: ""
          },
          message: {
            cssColor: ""
          },
          labels: []
        };
        details.level.name = violation.level;
        details.level.cssColor =
          `label-${colourMap[violation.level]}` || "label-info";
        details.message.cssColor = colourMap[violation.level];
        details.port = violation.server_port || 0;
        details.serverPort = _getViolationPort(
          violation.ip_proto,
          violation.server_port
        );
        details.serverImage = $sanitize(violation.server_image
          ? violation.server_image
          : null);
        details.clusterName = $sanitize(violation.cluster_name);
        details.action.name = Utils.getI18Name(violation.policy_action);
        details.action.name4Pdf = violation.policy_action;
        details.action.cssColor = colourMap[violation.policy_action] || "info";
        details.labels.push(LABELS.NETWORK);
        return details;
      };

      const getReviewRulePermission = function(sourceDomain, destinationDomain) {
        let sourceDomainPermission = AuthorizationFactory.getRowBasedPermission(sourceDomain, "rt_policy");
        let destinationDomainPermission = AuthorizationFactory.getRowBasedPermission(destinationDomain, "rt_policy");
        if (sourceDomainPermission === "w" && destinationDomainPermission === "w") {
          return "w";
        } else if (sourceDomainPermission === "" && destinationDomainPermission === "") {
          return "";
        } else {
          return "r";
        }
      };

      let _editIncidentDetails = function(incident, source, destination) {
        const iconMap = {
          "Host.File.Modified": "fa-server",
          "Host.Package.Updated": "fa-server",
          "Host.Privilege.Escalation": "fa-server",
          "Host.Suspicious.Process": "fa-server",
          "Host.Tunnel.Detected": "fa-server",
          "Host.FileAccess.Violation": "fa-server",
          "Container.Tunnel.Detected": "fa-cube",
          "Container.Suspicious.Process": "fa-cube",
          "Container.Privilege.Escalation": "fa-cube",
          "Container.File.Modified": "fa-cube",
          "Container.Package.Updated": "fa-cube",
          "Container.FileAccess.Violation": "fa-cube"
        };
        const messageCategoryMap = {
          "Host.File.Modified": "hostFileModified",
          "Host.Package.Updated": "hostPackageUpdated",
          "Host.Privilege.Escalation": "hostPrivilegeEscalation",
          "Container.Privilege.Escalation": "containerPrivilegeEscalation",
          "Host.Suspicious.Process": "hostSuspiciousProcess",
          "Container.Suspicious.Process": "containerSuspiciousProcess",
          "Host.Tunnel.Detected": "hostTunnelDetected",
          "Container.Tunnel.Detected": "containerTunnelDetected",
          "Container.File.Modified": "containerFileModified",
          "Container.Package.Updated": "containerPackageUpdated",
          "Process.Profile.Violation": "processProfileViolation",
          "Host.Process.Violation": "hostProcessViolation",
          "Container.FileAccess.Violation": "containerFileAccessViolation",
          "Host.FileAccess.Violation": "hostFileAccessViolation"
        };
        const labelMap = {
          "Host.File.Modified": [LABELS.HOST, LABELS.FILE],
          "Host.Package.Updated": [LABELS.HOST, LABELS.PACKAGE],
          "Host.Privilege.Escalation": [LABELS.HOST, LABELS.PRIVILEGE],
          "Container.Privilege.Escalation": [
            LABELS.CONTAINER,
            LABELS.PRIVILEGE
          ],
          "Host.Suspicious.Process": [LABELS.HOST, LABELS.PROCESS],
          "Container.Suspicious.Process": [LABELS.CONTAINER, LABELS.PROCESS],
          "Host.Tunnel.Detected": [LABELS.HOST, LABELS.TUNNEL],
          "Container.Tunnel.Detected": [LABELS.CONTAINER, LABELS.TUNNEL],
          "Container.File.Modified": [LABELS.CONTAINER, LABELS.FILE],
          "Container.Package.Updated": [LABELS.CONTAINER, LABELS.PACKAGE],
          "Process.Profile.Violation": [LABELS.CONTAINER, LABELS.PROCESS],
          "Host.Process.Violation": [LABELS.HOST, LABELS.PROCESS],
          "Host.FileAccess.Violation": [
            LABELS.HOST,
            LABELS.PROCESS,
            LABELS.FILE
          ],
          "Container.FileAccess.Violation": [
            LABELS.CONTAINER,
            LABELS.PROCESS,
            LABELS.FILE
          ]
        };
        const getAction = function(action) {
          return {
            name: Utils.getI18Name(action ? action.toUpperCase() : "ALERT"),
            name4Pdf: action ? action : "Alert",
            color: action ? action.toLowerCase() : "alert"
          };
        };
        let action = getAction(incident.action);
        let details = {
          level: {
            name: "",
            cssColor: ""
          },
          action: {
            name: "",
            name4Pdf: "",
            cssColor: ""
          },
          clusterName: "",
          message: {
            content: "",
            icon: "",
            cssColor: "",
            group: "",
            procName: "",
            procPath: "",
            procCmd: "",
            procRealUid: "",
            procRealUser: "",
            procEffectiveUid: "",
            procEffectiveUser: "",
            procParentName: "",
            procParentPath: "",
            etherType: "",
            ipProto: "",
            localIP: "",
            remoteIP: "",
            localPort: "",
            remotePort: "",
            filePath: "",
            fileNames: "",
            messageCategory: "",
            labels: [],
            count: 0
          }
        };
        details.level.name = incident.level;
        details.level.cssColor =
          `label-${colourMap[incident.level]}` || "label-info";
        details.action.name = action.name;
        details.action.name4Pdf = action.name4Pdf;
        details.action.cssColor = colourMap[action.color];
        details.clusterName = $sanitize(incident.cluster_name);
        details.message.content = $sanitize(incident.message)
                                  .replace("&amp;", "&")
                                  .replace("&lt;", "<")
                                  .replace("&gt;", ">");
        details.message.icon = iconMap[incident.name];
        details.message.cssColor = colourMap[incident.level];
        details.message.messageCategory = messageCategoryMap[incident.name];
        details.message.group = $sanitize(incident.group) || "";
        details.message.procName = $sanitize(incident.proc_name) || "";
        details.message.procPath = $sanitize(incident.proc_path) || "";
        details.message.procCmd = $sanitize(incident.proc_cmd) || "";
        details.message.procRealUid = $sanitize(incident.proc_real_uid) || "";
        details.message.procEffectiveUid = $sanitize(incident.proc_effective_uid) || "";
        details.message.procRealUser = $sanitize(incident.proc_real_user) || "";
        details.message.procEffectiveUser = $sanitize(incident.proc_effective_user) || "";
        details.message.procParentName = $sanitize(incident.proc_parent_name) || "";
        details.message.procParentPath = $sanitize(incident.proc_parent_path) || "";
        details.message.etherType = incident.ether_type || "";
        details.message.ipProto = incident.ip_proto || "";
        if (
          incident.server_ip &&
          incident.client_ip &&
          incident.server_port &&
          incident.client_port
        ) {
          details.message.localIP = source.ip;
          details.message.remoteIP = destination.ip;
          details.message.localPort = source.port;
          details.message.remotePort = destination.port;
        } else {
          details.message.localIP = "";
          details.message.remoteIP = "";
          details.message.localPort = "";
          details.message.remotePort = "";
        }
        details.message.filePath = incident.file_path || "";
        details.message.fileNames = incident.file_name
          ? incident.file_name.join(", ")
          : "";
        details.message.count = incident.count ? incident.count : 0;
        details.labels = labelMap[incident.name];
        return details;
      };

      let _getViolationPort = function(ipProto, port) {
        let protocol = ipProto;
        if (protocol === 1) return "icmp";
        else if (protocol === 6) return "tcp/" + port;
        else if (protocol === 17) return "udp/" + port;
        else return port;
      };

      return SecurityEventsFactory;
    });
})();
