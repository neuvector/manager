(function () {
  'use strict';

  angular.module("app.assets")
    .controller("PolicyGraphController", PolicyGraphController);

  /**
   *  Dependencies Injector
   */
  PolicyGraphController.$inject = ["$scope", "$http"];

  /**
   *  Type: controller
   *  Name: nodeChartController
   */
  function PolicyGraphController($scope, $http) {
    let positions = null;
    let network = null;
    let nodeIds = [], edgeIds = [], groupIds = [], nodes, edges;
    $scope.onNode = false;
    $scope.onRule = false;

    let doubleClickTime = 0;
    let threshold = 200;

    function doOnClick(event) {
      if (event.nodes.length === 0 && event.edges.length !== 0) {
        showRule(event.edges[0])
      } else if (event.nodes.length !== 0) {
        showGroupDetail(event.nodes[0]);
      } else {
        $scope.onNode = false;
        $scope.onRule = false;
        $scope.$apply();
      }
    }

    getGraph();

    function getGraph() {
      $http.get(POLICY_GRAPH_URL)
        .then(function (response) {
          return angular.toJson(response.data);
        })
        .then(function (networkInfo) {
          generateChart(networkInfo);
        })
        .catch(function (err) {
          console.log(err);
          // $state.go('page.login');
        });
    }

    function showGroupDetail(groupName) {
      $http.get(GROUP_URL, {params: {name: groupName}})
        .then(function (response) {
          $scope.group = response.data.group;
          $scope.onRule = false;
          $scope.onNode = true;
        }).catch(function (err) {
        console.log(err);
      })
    }

    function expandGroup(groupName) {
      if(!groupIds) {
        expand(groupName);
        groupIds.push(groupName);
      } else {
        if(groupIds.indexOf(groupName) === -1) {
          expand(groupName);
          groupIds.push(groupName);
        }
      }
    }

    function expand(groupName) {
      $http.get(GROUP_URL, {params: {name: groupName}})
        .then(function (response) {
          angular.forEach(response.data.group.members, function (member) {
            if(member.state !== "exit") {
              if (!nodeIds) {
                nodes.add({id: member.id, label: member.display_name, group: 'container'});
                nodeIds.push(member.id);
                addEdge(groupName, member);
              } else {
                if (nodeIds.indexOf(member.id) === -1) {
                  nodes.add({id: member.id, label: member.display_name, group: 'container'});
                  nodeIds.push(member.id);
                  addEdge(groupName, member);
                } else {
                  addEdge(groupName, member);
                  nodes.update([{id: member.id, group: 'sharedContainer'}]);
                }
              }
            }
          });
        }).catch(function (err) {
        console.log(err);
      })
    }

    function addEdge(groupName, member) {
      if(!edgeIds) {
        let newId = member.id + groupName;
        edges.add({id: newId, from: member.id, to: groupName, color: '#949FB1', dashes: true});
        edgeIds.push(newId)
      } else if(edgeIds.indexOf(member.id + groupName) === -1) {
        edges.add({id: member.id + groupName, from: member.id, to: groupName, color: '#949FB1', dashes: true});
        edgeIds.push(member.id + groupName)
      }
    }

    function showRule(id) {
      $http.get(POLICY_RULE_URL, {params: {id: id}})
        .then(function (response) {
          $scope.rule = response.data.rule;
          $scope.onNode = false;
          $scope.onRule = true;
          $scope.rule.allowed = ($scope.rule.action === 'allow');
        }).catch(function (err) {
        console.log(err);
      });
    }

    function generateChart(networkInfo) {
      networkInfo = angular.fromJson(networkInfo);
      $scope.nodes = networkInfo.nodes;
      $scope.edges = networkInfo.edges;
      let container = document.getElementById("policyGraph");

      for (let i = 0; i < $scope.edges.length; i++) {
        $scope.edges[i].color = EDGE_STATUS_MAP[$scope.edges[i].status];
      }

      if(positions !== null) {
        $scope.nodes = $scope.nodes.map(function (element) {
          if(positions[element.id]) {
            element.x = positions[element.id].x;
            element.y = positions[element.id].y;
          }
          return element;
        })
      }

      nodes = new vis.DataSet($scope.nodes);
      edges = new vis.DataSet($scope.edges);
      let data = {
        nodes: nodes,
        edges: edges
      };

      let options = {
        nodes: {
          shape: 'icon',
          icon: {
            face: 'FontAwesome',
            code: '\uf24d'
          },
          scaling: {
            min: 10,
            max: 30
          },
          shadow: true
        },
        edges: {
          color: {inherit: 'from'},
          smooth: {
            type: 'continuous'
          },
          arrowStrikethrough: false,
          shadow: true
        },
        groups: {
          learned: {
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf24d'
            }
          },
          external: {
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf0c2',
              color: '#03A9F4'
            }
          },
          container: {
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf096',
              color: '#949FB1'
            }
          },
          sharedContainer: {
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf096',
              color: '#FDB45C'
            }
          },
          custom: {
            shape: 'icon',
            icon: {
              face: 'FontAwesome',
              code: '\uf247',
              color: '#009688'
            }
          }
        },

        manipulation: {
          enabled: false,
          addEdge: function (data, callback) {
            if (data.from == data.to) {
              let r = confirm("Do you want to connect the node to itself?");
              if (r == true) {
                callback(data);
              }
            }
            else {
              callback(data);
            }
          }
        },

        interaction: {
          multiselect: true,
          hover: true
        },

        layout:{randomSeed: 2},
        physics: {
          adaptiveTimestep: false,
          stabilization: false,
          forceAtlas2Based:{
            avoidOverlap: 1
          },
          solver: 'forceAtlas2Based'
        }
      };

      network = new vis.Network(container, data, options);

      network.on('dragEnd', function (params) {
        for (let i = 0; i < params.nodes.length; i++) {
          let nodeId = params.nodes[i];
          if(nodeId.indexOf('cluster:') === -1)
            nodes.update({id: nodeId, fixed: {x: true, y: true}});
        }
      });
      network.on('dragStart', function(params) {
        for (let i = 0; i < params.nodes.length; i++) {
          let nodeId = params.nodes[i];
          if(nodeId.indexOf('cluster:') === -1)
            nodes.update({id: nodeId, fixed: {x: false, y: false}});
        }
      });

      network.on("click", function(event){
        let t0 = new Date();
        if (t0 - doubleClickTime > threshold) {
          setTimeout(function () {
            if (t0 - doubleClickTime > threshold) {
              doOnClick(event);
            }
          },threshold);
        }
      });

      network.on("doubleClick", function (event) {
        doubleClickTime = new Date();
        expandGroup(event.nodes[0]);
      });
    }

    $scope.addRule = function () {
      network.addEdgeMode();
    };

    $scope.refresh = function () {
      $scope.takeSnapshot();
      nodeIds = [];
      edgeIds = [];
      groupIds = [];
      getGraph();
    };

    $scope.takeSnapshot = function () {
      let nodeIds = $scope.nodes.map(function (element) {
        return element.id;
      });
      positions = network.getPositions(nodeIds);
    };
  }
})();