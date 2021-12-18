(function() {
  "use strict";
  angular
    .module("app.login")
    .factory("multiClusterService", function multiClusterService(
      $rootScope,
      $http,
      $translate
    ) {
      function getClusters() {
        return $http.get(FED_MEMBER_URL);
      }

      function updateCluster(data) {
        let payload = {
          poll_interval: 2,
          name: data.name,
          rest_info: {
            server: data.api_server,
            port: parseInt(data.api_port)
          }
        };
        return $http.patch(FED_CFG_URL, payload);
      }

      function getRemoteSummary(id){
        return $http.get(FED_SUMMARY, {params: {id: id}})
      }

      function getLocalSummary(){
        return $http.get(DASHBOARD_SUMMARY_URL)
      }

      function promote(data) {
        let payload = {
          name: data.name,
          master_rest_info: {
            server: data.server,
            port: parseInt(data.port)
          }
        };
        return $http.post(FED_PROMOTE_URL, payload);
      }

      function demote() {
        return $http.post(FED_DEMOTE_URL, "");
      }

      function join(data) {
        let payload = {
          name: data.name,
          server: data.master_server,
          port: parseInt(data.master_port),
          join_token: data.token,
          joint_rest_info: {
            server: data.server,
            port: parseInt(data.port)
          }
        };
        return $http.post(FED_JOIN_URL, payload);
      }

      function remove(data) {
        return $http.delete(FED_REMOVE_URL, { params: { id: data } });
      }

      function leave() {
        let payload = {
          force: true
        };
        return $http.post(FED_LEAVE_URL, payload);
      }

      function fetchRemote(selectedID, currentID) {
        if (selectedID.length > 0) {
          return $http
            .get(FED_REDIRECT_URL, { params: { id: selectedID } })
            .then(() => {
              return $http.patch(HEART_BEAT_URL);
            })
            .catch(function(err) {
              console.log("catch err:", err);
              let apiParams = [];
              if (currentID.length > 0) {
                apiParams = [FED_REDIRECT_URL, { params: { id: currentID } }];
              } else {
                apiParams = [FED_REDIRECT_URL];
              }
              return $http.get(...apiParams).then(function() {
                throw {name: "Exception", message:"", status:"custom"};
              });
            });
        } else {
          return $http.get(FED_REDIRECT_URL);
        }
      }

      function syncPolicy(id) {
        let payload = {
          ids: [id]
        };
        return $http.post(FED_DEPLOY, payload);
      }

      function getToken() {
        return $http.get(FED_JOIN_TOKEN);
      }

      //returned server object
      let service = {
        cluster4Edit: null,
        getClusters: getClusters,
        updateCluster: updateCluster,
        promote: promote,
        demote: demote,
        join: join,
        remove: remove,
        leave: leave,
        redirect: fetchRemote,
        syncPolicy: syncPolicy,
        generateToken: getToken,
        getRemoteSummary: getRemoteSummary,
        getLocalSummary: getLocalSummary
      };

      return service;
    });
})();
