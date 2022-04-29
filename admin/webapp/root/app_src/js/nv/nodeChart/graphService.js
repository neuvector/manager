(function() {
  "use strict";
  angular
    .module("app.assets")
    .factory("GraphFactory", function($http, $translate, $sanitize, Utils) {
      let GraphFactory = {};
      let _domains = [];
      let _groups = [];
      let _domainMap = new Map();
      let _clusterMap = new Map();

      let filteredDomainMap = new Map();
      let filteredClusterMap = new Map();

      let _nodeIdIndexMap = new Map();
      let _edgeIdIndexMap = new Map();
      const linkedNodeSet = new Set();
      // const connectedNodes = new Set();
      // const isolatedNodes = new Set();
      // let combos = [];

      const oneMillion = 1000 * 1000;

      const cveColors = {
        high: { fill: "#fa184a", stroke: "#f76987" },
        medium: { fill: "#ff9800", stroke: "#ffbc3e" }
      };

      GraphFactory.registerG6Components = () => {
        G6.registerNode(
          "markedNode",
          {
            afterDraw: (cfg, group) => {
              let width = cfg.size + 3,
                height = cfg.size / 2 + 2;
              const radius = cfg.kind === "group" ? 5 : 4;
              const colorSet = cfg.cve ? cveColors[cfg.cve.level] : null;
              if (colorSet) {
                group.addShape("circle", {
                  attrs: {
                    x: width / 2 - 3,
                    y: -height / 2 + 3,
                    r: radius,
                    fill: colorSet.fill,
                    lineWidth: 0.5,
                    cursor: "pointer",
                    stroke: colorSet.stroke
                  },
                  name: "tag-circle"
                });
              }

              let r = 30;
              if (angular.isNumber(cfg.size)) {
                r = cfg.size / 2;
              } else if (angular.isArray(cfg.size)) {
                r = cfg.size[0] / 2;
              }
              const style = cfg.style;
              group.addShape("circle", {
                attrs: {
                  x: 0,
                  y: 0,
                  r: r + 5,
                  fill: style.fill,
                  fillOpacity: 0.1,
                  stroke: "#f76987",
                  strokeOpacity: 0.85,
                  lineWidth: 1
                },
                name: "stroke-shape",
                visible: false
              });

              if (cfg.state === "quarantined") {
                const stroke = group.find(
                  e => e.get("name") === "stroke-shape"
                );
                stroke && stroke.show();
              }
            }
          },
          "circle"
        );

        G6.registerEdge(
          "circle-running",
          {
            afterDraw(cfg, group) {
              // get the first shape in the group, it is the edge's path here=
              const shape = group.get("children")[0];
              // the start position of the edge's path
              const startPoint = shape.getPoint(0);

              // add red circle shape
              const circle = group.addShape("circle", {
                attrs: {
                  x: startPoint.x,
                  y: startPoint.y,
                  fill: "#1890ff",
                  r: 3
                },
                name: "circle-shape"
              });

              // animation for the red circle
              circle.animate(
                ratio => {
                  // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
                  // get the position on the edge according to the ratio
                  const tmpPoint = shape.getPoint(ratio);
                  // returns the modified configurations here, x and y here
                  return {
                    x: tmpPoint.x,
                    y: tmpPoint.y
                  };
                },
                {
                  repeat: true, // Whether executes the animation repeatly
                  duration: 2000 // the duration for executing once
                }
              );
            }
          },
          "quadratic" // extend the built-in edge 'cubic'
        );
      };

      GraphFactory.getLineWidth = bytes => {
        const bytesInMB = Math.min(oneMillion, bytes / oneMillion);
        return bytesInMB < 10 ? 1 : Math.round(Math.log10(bytesInMB));
      };

      let advFilter = {};

      GraphFactory.initAdvFilter = () => {
        advFilter = {
          domains: [],
          groups: [],
          policyMode: {
            discover: true,
            monitor: true,
            protect: true
          },
          cve: "all",
          protocol: {
            tcp: true,
            udp: true,
            icmp: true
          },
          risk: "all"
        };
      };

      GraphFactory.advFilterApplied = () => {
        return (
          advFilter.domains.length > 0 ||
          advFilter.groups.length > 0 ||
          advFilter.cve !== "all" ||
          advFilter.risk !== "all" ||
          !advFilter.policyMode.discover ||
          !advFilter.policyMode.monitor ||
          !advFilter.policyMode.protect ||
          !advFilter.protocol.tcp ||
          !advFilter.protocol.udp ||
          !advFilter.protocol.icmp
        );
      };

      GraphFactory.getAdvFilter = () => advFilter;

      GraphFactory.setAdvFilter = filter => {
        advFilter = filter;
      };

      const blacklist = {
        domains: [],
        groups: [],
        endpoints: [],
        hideUnmanaged: false
      };

      GraphFactory.getBlacklist = () => blacklist;
      GraphFactory.setBlacklist = bl => {
        blacklist.domains = bl.domains;
        blacklist.groups = bl.groups;
        blacklist.endpoints = bl.endpoints;
        blacklist.hideUnmanaged = bl.hideUnmanaged;
      };

      GraphFactory.initBlacklist = () => {
        blacklist.domains = [];
        blacklist.groups = [];
        blacklist.endpoints = [];
        blacklist.hideUnmanaged = false;
      };

      /**
       * Filter edges by protocols, like TCP, UDP, ICMP
       * @param edge
       * @param protocols: in ["tcp", "udp", "icmp"]
       */
      const checkProtocol = (edge, protocols) => {
        if (
          protocols.length === 0 ||
          !edge.protocols ||
          edge.protocols.length === 0
        )
          return false;
        if (protocols.length === 3) return true;
        return protocols.some(r => edge.protocols.indexOf(r) >= 0);
      };

      /**
       * Filter edges by risks, like Violation, Threat, Exposure
       * @param edge
       * @param risk
       */
      const checkRisk = (edge, risk) => {
        if (risk !== "all")
          return edge.status !== "OK" && edge.status !== "intraGroup";
        else return true;
      };

      /**
       * Filter node by policy modes, like "Discover", "Monitor", "Protect"
       * @param node
       * @param modeFilters
       */
      const checkMode = (node, modeFilters) => {
        if (modeFilters.length === 0 || !node.group) return false;
        if (modeFilters.length === 3) return true;
        return modeFilters.some(mode => node.group.endsWith(mode));
      };

      const checkDomains = (node, domains) => {
        if (!domains || domains.length === 0) return true;
        else {
          return domains.some(domain => domain.name === node.domain);
        }
      };

      const checkGroups = (node, groups) => {
        if (!groups || groups.length === 0) return true;
        else {
          return groups.some(group => group.name === node.clusterId);
        }
      };

      const checkCve = (node, cve) => {
        if (cve === "all") return true;
        return !!node.cve.level;
      };

      /**
       * convert filter object to string array
       * @param filter
       * @returns {*[]}
       */
      const filterConverter = filter =>
        Object.keys(filter).reduce((result, key) => {
          if (filter[key]) result.push(key);
          return result;
        }, []);

      GraphFactory.applyAdvFilter = (dataSet, advFilter) => {
        const filteredNodesMap = new Map();
        let nodes = dataSet.nodes.filter(node => {
          let result =
            checkDomains(node, advFilter.domains) &&
            checkGroups(node, advFilter.groups) &&
            checkMode(node, filterConverter(advFilter.policyMode)) &&
            checkCve(node, advFilter.cve);
          if (result) filteredNodesMap.set(node.id, node);
          return result;
        });
        const firstLevelConnectedNodes = new Set();
        let edges = dataSet.edges.filter(edge => {
          const isSource = filteredNodesMap.has(edge.source);
          const isTarget = filteredNodesMap.has(edge.target);
          if (isSource && isTarget)
            return (
              checkProtocol(edge, filterConverter(advFilter.protocol)) &&
              checkRisk(edge, advFilter.risk)
            );
          else if (isSource) {
            firstLevelConnectedNodes.add(edge.target);
            return (
              checkProtocol(edge, filterConverter(advFilter.protocol)) &&
              checkRisk(edge, advFilter.risk)
            );
          } else if (isTarget) {
            firstLevelConnectedNodes.add(edge.source);
            return (
              checkProtocol(edge, filterConverter(advFilter.protocol)) &&
              checkRisk(edge, advFilter.risk)
            );
          } else return false;
        });
        let nodesToAppend = [];
        if (firstLevelConnectedNodes.size) {
          const nodeIds = [...firstLevelConnectedNodes];
          nodesToAppend = nodeIds
            .map(id => dataSet.nodes[_nodeIdIndexMap.get(id)])
            .filter(node => node !== undefined);
        }

        if (advFilter.risk !== "all") {
          if (edges.length > 0) {
            let riskyNodes = new Set();
            edges.forEach(edge => {
              riskyNodes.add(edge.source);
              riskyNodes.add(edge.target);
            });
            return {
              nodes: [...nodes.filter(node => riskyNodes.has(node.id))],
              firstLevelNodes: [
                ...nodesToAppend.filter(node => riskyNodes.has(node.id))
              ],
              edges: edges
            };
          } else
            return {
              nodes: [],
              firstLevelNodes: [],
              edges: []
            };
        }

        return {
          nodes: [...nodes],
          firstLevelNodes: [...nodesToAppend],
          edges: edges
        };
      };

      GraphFactory.formatText = (text, length = 10, ellipsis = "...") => {
        if (!text) return "";
        if (text.length > length) {
          return `${text.substr(0, length)}${ellipsis}`;
        }
        return text;
      };

      GraphFactory.labelFormatter = (text, minLength = 10) => {
        if (text && text.split("").length > minLength)
          return `${text.substr(0, minLength)}...`;
        return text;
      };

      GraphFactory.groupToIconType = {
        container: "container",
        containerDiscover: "container-d",
        containerMonitor: "container-m",
        containerProtect: "container-p",
        containerUnmanaged: "container-x",
        mesh: "serviceMesh",
        meshDiscover: "serviceMesh-d",
        meshMonitor: "serviceMesh-m",
        meshProtect: "serviceMesh-p",
        ip_service: "service",
        address: "address",
        node_ip: "host",
        host: "host",
        hostDiscover: "host-d",
        hostMonitor: "host-m",
        hostProtect: "host-p",
        workload_ip: "workload-ip",
        meshProxy: "meshProxy",
        external: "cloud"
      };

      GraphFactory.strokeColor = {
        Protect: "#3E6545",
        Monitor: "#4E39C1",
        Discover: "#65B2FF"
      };

      GraphFactory.fillColor = {
        Protect: "#a3bba5",
        Monitor: "#b7a7f0",
        Discover: "#EFF4FF"
      };

      GraphFactory.getLinkedNodeSet = edges =>
        edges.forEach(edge => {
          linkedNodeSet.add(edge.source);
          linkedNodeSet.add(edge.target);
        });

      GraphFactory.getIsolatedNodes = nodes =>
        nodes.filter(node => !linkedNodeSet.has(node.id));

      GraphFactory.getConnectedNodes = nodes =>
        nodes.filter(node => linkedNodeSet.has(node.id));

      GraphFactory.getEdgeStyle = (edge, stroke) => ({
        lineWidth: edge.bytes ? GraphFactory.getLineWidth(edge.bytes) : 1,
        stroke: stroke ? stroke : EDGE_STATUS_MAP["OK"],
        opacity: 0.3,
        endArrow: {
          path: G6.Arrow.triangle(3, 6, 6),
          d: 8
        }
      });

      /**
       * Get domain nodes/edges
       * @returns {{nodes: Array, edges: Array}}
       * @param dataSet the dataSet object {{nodes: Array, edges: Array}}
       * @param domain the domain name
       */
      GraphFactory.collapseDomain = (dataSet, domain, collapsedDomains) => {
        const nodes = dataSet.nodes.filter(node => node.domain === domain);

        const domainEdgeMap = new Map();
        dataSet.edges.forEach(edge => {
          if (edge.fromDomain !== domain && edge.toDomain !== domain) return;
          else if (edge.fromDomain === domain && edge.toDomain === domain) {
            const linkId = `${domain}${domain}`;
            let selfLink = domainEdgeMap.get(linkId);
            if (!selfLink)
              domainEdgeMap.set(linkId, {
                id: `${domain}${domain}`,
                source: domain,
                target: domain,
                bytes: edge.bytes,
                type: "loop",
                loopCfg: {
                  dist: 20
                },
                style: GraphFactory.getEdgeStyle(edge),
                value: 1
              });
            else {
              selfLink.value += 1;
              selfLink.bytes += edge.bytes;
              selfLink.style.lineWidth = GraphFactory.getLineWidth(
                selfLink.bytes
              );
            }
          } else if (edge.fromDomain === domain) {
            let target = edge.target;
            if (collapsedDomains.has(edge.toDomain)) target = edge.toDomain;
            const linkId = `${domain}${target}`;
            let sourceLink = domainEdgeMap.get(linkId);
            if (!sourceLink)
              domainEdgeMap.set(linkId, {
                id: linkId,
                source: domain,
                target: target,
                bytes: edge.bytes,
                type: "quadratic",
                style: GraphFactory.getEdgeStyle(edge),
                value: 1
              });
            else {
              sourceLink.value += 1;
              sourceLink.bytes += edge.bytes;
              sourceLink.style.lineWidth = GraphFactory.getLineWidth(
                sourceLink.bytes
              );
            }
          } else if (edge.toDomain === domain) {
            let source = edge.source;
            if (collapsedDomains.has(edge.fromDomain)) source = edge.fromDomain;

            const linkId = `${source}${domain}`;
            let targetLink = domainEdgeMap.get(linkId);
            if (!targetLink)
              domainEdgeMap.set(linkId, {
                id: linkId,
                source: source,
                target: domain,
                bytes: edge.bytes,
                type: "quadratic",
                style: GraphFactory.getEdgeStyle(edge),
                value: 1
              });
            else {
              targetLink.value += 1;
              targetLink.bytes += edge.bytes;
              targetLink.style.lineWidth = GraphFactory.getLineWidth(
                targetLink.bytes
              );
            }
          }
        });
        return { nodes: nodes, edges: [...domainEdgeMap.values()] };
      };

      GraphFactory.getDomainDataSet = (domain, dataSet) => {
        const nodes = dataSet.nodes.filter(node => node.domain === domain);

        const edges = dataSet.edges.filter(
          edge => edge.fromDomain === domain || edge.toDomain === domain
        );

        return { nodes: nodes, edges: edges };
      };

      const domainSizeMap = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];

      const getDomainNodeSize = memberCount => {
        if (memberCount > domainSizeMap.length)
          return domainSizeMap[domainSizeMap.length - 1];
        return domainSizeMap[memberCount - 1];
      };

      GraphFactory.nodeToDomain = node => {
        const domainMemberCount = _domainMap.get(node.domain).value;
        const nodeSize = getDomainNodeSize(domainMemberCount);
        return {
          id: node.domain,
          type: "image",
          size: [nodeSize, nodeSize],
          oriLabel: node.domain,
          label: GraphFactory.formatText(node.domain, 12, "..."),
          value: 1,
          img: "app/img/icons/graph/domain.svg",
          group: "domain",
          kind: "domain",
          domain: node.domain
        };
      };

      /**
       *`
       * @param node
       * @param node.scan_summary the vulnerability info
       * @param node.scanBrief the vulnerability info
       * @param node.children the containers inside pod
       * @returns {{level: String high: Number medium: Number}}
       */
      GraphFactory.getCveLevel = node => {
        let high = 0,
          medium = 0;
        let scanBrief = node.scan_summary || node.scanBrief;
        if (scanBrief) {
          high = scanBrief.high;
          medium = scanBrief.medium;
        }
        if (node.children) {
          high += node.children.reduce((acc, child) => {
            let scanBrief = child.scan_summary || child.scanBrief;
            if (scanBrief && scanBrief.high) return acc + scanBrief.high;
            else return acc;
          }, 0);

          medium += node.children.reduce((acc, child) => {
            let scanBrief = child.scan_summary || child.scanBrief;
            if (scanBrief && scanBrief.medium) return acc + scanBrief.medium;
            else return acc;
          }, 0);
        }
        if (high > 0) return { level: "high", high: high, medium: medium };
        else if (medium > 0)
          return { level: "medium", high: high, medium: medium };
        else return { level: "", high: 0, medium: 0 };
      };

      GraphFactory.getGroupVulnerabilities = group => {
        const members = group.members;
        let nodesInRisk;
        if (members && members.length > 0) {
          nodesInRisk = members.map(node => GraphFactory.getCveLevel(node));
        }
        if (nodesInRisk && nodesInRisk.length > 0) {
          return nodesInRisk.reduce(
            (acc, node) => {
              if (node) {
                acc.high += node.high;
                acc.medium += node.medium;
                return acc;
              } else return acc;
            },
            { high: 0, medium: 0 }
          );
        }
      };

      GraphFactory.formatNode = node => {
        if (node.oriLabel && node.oriLabel.length > node.label.length) return;
        const iconName = GraphFactory.groupToIconType[node.group];
        if (iconName)
          node.icon = {
            show: true,
            img: `app/img/icons/graph/${iconName}.svg`
          };

        node.style = {
          stroke: GraphFactory.strokeColor["Discover"]
        };

        if (node.group && node.group.endsWith("Protect"))
          node.style = {
            stroke: GraphFactory.strokeColor["Protect"],
            fill: GraphFactory.fillColor["Protect"]
          };
        else if (node.group && node.group.endsWith("Monitor"))
          node.style = {
            stroke: GraphFactory.strokeColor["Monitor"],
            fill: GraphFactory.fillColor["Monitor"]
          };

        node.oriLabel = node.label;
        node.label = GraphFactory.formatText(node.label, 10, "...");
        if (node.service_mesh) {
          node.size = 40;
          node.icon.width = 30;
          node.icon.height = 30;
          node.kind = "mesh";
        }
      };

      /**
       * Check if we need hide the node
       * @param node
       * @param settings
       * @returns {boolean|boolean} true if node need to be hidden, else false
       */
      const checkSettingsForNode = (node, settings) => {
        return settings.showSysNode ? false : node.platform_role === "System";
      };

      const hasSystemAppOnly = applications => {
        if (
          !applications ||
          applications.length === 0 ||
          applications.length > 3
        )
          return false;
        else {
          if (applications.length === 1)
            return (
              applications.indexOf("DNS") > -1 ||
              applications.indexOf("DHCP") > -1 ||
              applications.indexOf("NTP") > -1
            );
          if (applications.length === 2)
            return (
              (applications.indexOf("DNS") > -1 &&
                applications.indexOf("DHCP") > -1) ||
              (applications.indexOf("DNS") > -1 &&
                applications.indexOf("NTP") > -1) ||
              (applications.indexOf("NTP") > -1 &&
                applications.indexOf("DHCP") > -1)
            );
          if (applications.length === 3)
            return (
              applications.indexOf("DNS") > -1 &&
              applications.indexOf("DHCP") > -1 &&
              applications.indexOf("NTP") > -1
            );
        }
      };

      /**
       * Check if we need hide the edge
       * @param edge
       * @param settings
       * @returns {boolean|boolean}
       */
      const checkSettingsForEdge = (edge, settings) => {
        return settings.showSysApp
          ? false
          : hasSystemAppOnly(edge.applications);
      };

      GraphFactory.processNodes = (nodes, serverData, onRefresh, settings) => {
        let domains = [];
        let groups = [];
        const domainMap = new Map();
        const clusterMap = new Map();
        if (onRefresh) _nodeIdIndexMap.clear();

        nodes.forEach((node, i) => {
          node.cve = GraphFactory.getCveLevel(node);

          if (onRefresh) _nodeIdIndexMap.set(node.id, i);

          GraphFactory.formatNode(node);

          if (checkSettingsForNode(node, settings)) return;

          if (node.id === "external") {
            node.type = "image";
            node.img = "app/img/icons/graph/cloud.svg";
            node.size = [50, 50];
            delete node.icon;

            clusterMap.set(node.id, {
              name: node.id,
              domain: node.domain,
              group: "external",
              clusterName: "External Network",
              members: [node.id],
              value: 1,
              status: ""
            });
          } else {
            if (node.clusterId)
              if (node.domain) {
                // node.comboId = `co${node.clusterId}`;

                if (!domainMap.get(node.domain))
                  domainMap.set(node.domain, {
                    name: node.domain,
                    type: "domain",
                    value: 0,
                    members: [],
                    status: ""
                  });
              }
            if (node.clusterId) {
              let theGroup = clusterMap.get(node.clusterId);
              if (!theGroup) {
                clusterMap.set(node.clusterId, {
                  name: node.clusterId,
                  domain: node.domain,
                  group: node.group,
                  clusterName: node.clusterName,
                  members: [node.id],
                  value: 1,
                  cve: node.cve,
                  policyMode: node.policyMode,
                  status: "",
                  kind: "group",
                  quarantines: node.state === "quarantined" ? 1 : 0
                });
                let theDomain = domainMap.get(node.domain);
                if (theDomain) {
                  theDomain.value += 1;
                  theDomain.members.push(node.clusterId);
                }
              } else {
                theGroup.value += 1;
                theGroup.members.push(node.id);
                theGroup.cve.high += node.cve.high;
                theGroup.cve.medium += node.cve.medium;
                if (theGroup.cve.high > 0) theGroup.cve.level = "high";
                else if (theGroup.cve.medium > 0) theGroup.cve.level = "medium";
                theGroup.quarantines += node.state === "quarantined" ? 1 : 0;
              }
            } else {
              if (node.domain) {
                let theDomain = domainMap.get(node.domain);
                if (theDomain) {
                  theDomain.value += 1;
                  theDomain.members.push(node.id);
                }
              }
            }
          }
        });

        domains = [...domainMap.values()];
        groups = [...clusterMap.values()];

        if (onRefresh) {
          _clusterMap = clusterMap;
          _domainMap = domainMap;
          _domains = domains;
          _groups = groups;
        } else {
          filteredClusterMap = clusterMap;
          filteredDomainMap = domainMap;
        }

        //Deal with one node group
        nodes.forEach(node => {
          const nodeGroup = clusterMap.get(node.clusterId);
          if (node.comboId) {
            if (nodeGroup.value <= 1) {
              // node.comboId = `co${node.domain}`;
              delete node.comboId;
            }
          }
        });

        const sizeMap = [25, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

        const getComboSize = memberCount => {
          if (memberCount > sizeMap.length) return sizeMap[sizeMap.length - 1];
          return sizeMap[memberCount - 1];
        };

        const getClusterIcon = group => {
          if (!group) return "cluster.svg";
          if (group.endsWith("Discover")) return "cluster-d.svg";
          if (group.endsWith("Protect")) return "cluster-p.svg";
          if (group.endsWith("Monitor")) return "cluster-m.svg";
          return "cluster.svg";
        };

        const getStrokeColor = group => {
          if (!group) return GraphFactory.strokeColor["Discover"];
          if (group.endsWith("Protect"))
            return GraphFactory.strokeColor["Protect"];
          if (group.endsWith("Monitor"))
            return GraphFactory.strokeColor["Monitor"];
          return GraphFactory.strokeColor["Discover"];
        };

        const getFillColor = group => {
          if (!group) return GraphFactory.fillColor["Discover"];
          if (group.endsWith("Protect"))
            return GraphFactory.fillColor["Protect"];
          if (group.endsWith("Monitor"))
            return GraphFactory.fillColor["Monitor"];
          return GraphFactory.fillColor["Discover"];
        };

        const clusterNodes = groups.map(group => {
          if (group.name !== "external") {
            if (group.value === 1) {
              let clusterNode =
                serverData.nodes[_nodeIdIndexMap.get(group.members[0])];
              clusterNode.cluster = group.domain;
              return clusterNode;
            } else {
              let clusterNode = {
                id: group.name,
                type: "markedNode",
                size: getComboSize(group.value),
                oriLabel: group.clusterName,
                label: GraphFactory.formatText(group.clusterName, 15, "..."),
                icon: {
                  show: true,
                  img: `app/img/icons/graph/${getClusterIcon(group.group)}`,
                  width: Math.round(getComboSize(group.value) * 0.7),
                  height: Math.round(getComboSize(group.value) * 0.7)
                },
                style: {
                  stroke: getStrokeColor(group.group),
                  fill: getFillColor(group.group)
                },
                cve: group.cve,
                policyMode: group.policyMode,
                domain: group.domain,
                cluster: group.domain,
                clusterId: group.clusterId,
                kind: "group",
                quarantines: group.quarantines
              };
              if (clusterNode.quarantines) clusterNode.style.fill = "#ffcccb";
              return clusterNode;
            }
          } else
            return {
              id: "external",
              type: "image",
              label: group.name,
              group: "external",
              domain: "external",
              cluster: "external",
              clusterId: "external",
              img: "app/img/icons/graph/cloud.svg",
              size: [50, 50]
            };
        });

        console.log(clusterMap);
        console.log(domainMap);

        return clusterNodes;
      };

      const getEdgeId = (edge, onRefresh) => {
        const fromGroup = onRefresh
          ? _clusterMap.get(edge.fromGroup)
          : filteredClusterMap.get(edge.fromGroup);
        const toGroup = onRefresh
          ? _clusterMap.get(edge.toGroup)
          : filteredClusterMap.get(edge.toGroup);
        let edgeId, edgeSource, edgeTarget;
        if (fromGroup.value === 1 && toGroup.value === 1) {
          if (edge.id) edgeId = edge.id;
          else edgeId = `${edge.source}${edge.target}`;
        } else {
          if (fromGroup.value === 1 && toGroup.value > 1) {
            edgeSource = edge.source;
            edgeTarget = edge.toGroup;
          } else if (fromGroup.value > 1 && toGroup.value === 1) {
            edgeSource = edge.fromGroup;
            edgeTarget = edge.target;
          } else {
            edgeSource = edge.fromGroup;
            edgeTarget = edge.toGroup;
          }
          edgeId = `${edgeSource}${edgeTarget}`;
        }
        return { edgeId, edgeSource, edgeTarget };
      };

      const createClusterEdge = (
        serverData,
        edge,
        clusterEdgeMap,
        onRefresh
      ) => {
        let theEdge;
        let { edgeId, edgeSource, edgeTarget } = getEdgeId(edge, onRefresh);

        if (edgeId === `${edge.source}${edge.target}`) theEdge = edge;
        else
          theEdge = {
            id: edgeId,
            source: edgeSource,
            target: edgeTarget,
            type: "quadratic",
            style: GraphFactory.getEdgeStyle(
              edge,
              EDGE_STATUS_MAP[edge.status]
            ),
            label: "",
            oriLabel: edge.oriLabel,
            status: edge.status,
            members: [edge.id],
            kind: "group",
            fromDomain: edge.fromDomain,
            toDomain: edge.toDomain,
            bytes: edge.bytes,
            weight: 1
          };

        if (theEdge.style.stroke !== EDGE_STATUS_MAP["OK"])
          theEdge.stateStyles = {
            active: {
              stroke: EDGE_STATUS_MAP[theEdge.status],
              opacity: 1.0
            }
          };

        clusterEdgeMap.set(edgeId, theEdge);
        if (edge.fromGroup === edge.toGroup) {
          theEdge.type = "loop";
          theEdge.style.endArrow = true;
          theEdge.loopCfg = {
            dist: 20
          };
          const loopNode =
            serverData.nodes[GraphFactory.getNodeIdIndexMap().get(edge.source)];
          if (loopNode && loopNode.service_mesh) {
            theEdge.style.stroke = "#9FB8AD";
            theEdge.style.opacity = 0.8;
          }
        }
      };

      GraphFactory.aggregateLinks = (clusterEdge, edge) => {
        clusterEdge.weight += 1;
        clusterEdge.bytes += edge.bytes;
        clusterEdge.members.push(edge.id);
        clusterEdge.status =
          EDGE_STATUS_LEVEL_MAP[edge.status] >
          EDGE_STATUS_LEVEL_MAP[clusterEdge.status]
            ? edge.status
            : clusterEdge.status;
        clusterEdge.style.lineWidth = GraphFactory.getLineWidth(
          clusterEdge.bytes
        );
        clusterEdge.style.stroke =
          EDGE_STATUS_LEVEL_MAP[edge.status] >
          EDGE_STATUS_LEVEL_MAP[clusterEdge.status]
            ? EDGE_STATUS_MAP[edge.status]
            : EDGE_STATUS_MAP[clusterEdge.status];
        clusterEdge.oriLabel = "";

        if (clusterEdge.style.stroke !== EDGE_STATUS_MAP["OK"])
          clusterEdge.stateStyles = {
            active: {
              stroke: EDGE_STATUS_MAP[clusterEdge.status],
              opacity: 1.0
            }
          };
      };

      GraphFactory.formatEdge = edge => {
        if (edge.oriLabel && edge.oriLabel.length > 0) return;
        edge.oriLabel = edge.label;
        edge.label = "";
        edge.type = "quadratic";
        edge.style = GraphFactory.getEdgeStyle(
          edge,
          EDGE_STATUS_MAP[edge.status]
        );
        if (edge.style.stroke !== EDGE_STATUS_MAP["OK"])
          edge.stateStyles = {
            active: {
              stroke: EDGE_STATUS_MAP[edge.status],
              opacity: 1.0
            }
          };
      };

      GraphFactory.processEdges = (serverData, edges, onRefresh, settings) => {
        const clusterEdgeMap = new Map();
        const edgeIdIndexMap = new Map();
        edges.forEach((edge, i) => {
          edgeIdIndexMap.set(edge.id, i);

          GraphFactory.formatEdge(edge);

          //All the nodes have service group, so fromCluster and toCluster should be there
          const fromCluster = _clusterMap.get(edge.fromGroup);
          const toCluster = _clusterMap.get(edge.toGroup);

          if (!fromCluster || !toCluster) return;
          if (checkSettingsForEdge(edge, settings)) return;

          //check if cluster edge exist
          const { edgeId } = getEdgeId(edge, onRefresh);
          let clusterEdge = clusterEdgeMap.get(edgeId);
          if (clusterEdge) {
            GraphFactory.aggregateLinks(clusterEdge, edge);
          } else {
            //create line
            createClusterEdge(serverData, edge, clusterEdgeMap, onRefresh);
          }
        });

        if (onRefresh) _edgeIdIndexMap = edgeIdIndexMap;
        return [...clusterEdgeMap.values()];
      };

      GraphFactory.cacheNodePositions = nodes => {
        const positionMap = {};
        const nodeLength = nodes.length;
        for (let i = 0; i < nodeLength; i++) {
          const node = nodes[i].getModel();
          positionMap[node.id] = {
            x: node.x,
            y: node.y
          };
        }
        return positionMap;
      };

      GraphFactory.keepLive = () => {
        $http
          .patch(HEART_BEAT_URL)
          .then(response => {})
          .catch(err => {
            console.warn(err);
          });
      };

      GraphFactory.setDomainGrid = () => {
        const columnDefs4Domain = [
          {
            headerName: $translate.instant("group.gridHeader.NAME"),
            cellRenderer: params => {
              if (params && params.data) {
                if (
                  params.data.kind === "group" ||
                  (params.data.group && params.data.group === "ip_service")
                ) {
                  return params.data.id;
                } else if (
                  params.data.group.startsWith("container") ||
                  params.data.kind === "mesh"
                ) {
                  return params.data.clusterId;
                }
              }
            }
          },
          {
            headerName: $translate.instant("group.gridHeader.VULNERABILITIES"),
            field: "cve",
            cellRenderer: function(params) {
              let display = "";
              if (params.value && params.value.high)
                display += `<span class="label label-danger mr-sm">${params.value.high}</span>`;
              else
                display += `<span class="label label-success mr-sm">${params.value.high}</span>`;
              if (params.value && params.value.medium)
                display += `<span class="label label-warning">${params.value.medium}</span>`;
              else
                display += `<span class="label label-success mr-sm">${params.value.medium}</span>`;
              return $sanitize(display);
            },
            width: 120,
            maxWidth: 130
          },
          {
            headerName: $translate.instant("group.gridHeader.POLICY_MODE"),
            field: "policyMode",
            cellRenderer: function(params) {
              let mode = "";
              if (params.value) {
                mode = Utils.getI18Name(params.value);
                let labelCode = colourMap[params.value];
                if (!labelCode) return null;
                else
                  return `<span class="label label-fs label-${labelCode}">${$sanitize(
                    mode
                  )}</span>`;
              } else return null;
            },
            width: 100,
            maxWidth: 100,
            minWidth: 100
          }
        ];
        GraphFactory.getGridOptions4Domain = () => {
          return Utils.createGridOptions(columnDefs4Domain);
        };
      };

      GraphFactory.getDomains = () => _domains;

      GraphFactory.getGroups = () => _groups;

      GraphFactory.getDomainMap = () => _domainMap;

      GraphFactory.getClusterMap = () => _clusterMap;

      GraphFactory.getNodeIdIndexMap = () => _nodeIdIndexMap;

      GraphFactory.getEdgeIdIndexMap = () => _edgeIdIndexMap;

      // GraphFactory.getCombos = () => combos;

      return GraphFactory;
    });
})();
