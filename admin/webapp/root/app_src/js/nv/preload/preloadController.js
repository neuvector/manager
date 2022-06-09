(function() {
  "use strict";

  angular
    .module("app.preload")
    .controller("PreloadController", PreloadController);

  PreloadController.$inject = [
    "$rootScope",
    "$state",
    "$window",
    "$http",
    "Utils",
    "$location"
  ];
  function PreloadController(
    $rootScope,
    $state,
    $window,
    $http,
    Utils,
    $location
  ) {
    let token = null;
    let vm = this;
    vm.authMsg = {};
    const OPENSHIFT = "Kubernetes-OpenShift";
    $rootScope.hasInitializedSummary = false;
    $rootScope.clusterName = "";

    activate();

    ////////////////

    function activate() {
      token = JSON.parse($window.sessionStorage.getItem("token"));
      let origin = JSON.parse($window.sessionStorage.getItem("from"));
      // const hash = $window.location.hash;
      // let neuToken;
      // if (hash) {
      //   if (hash.indexOf("neuToken=") > 0) {
      //     neuToken = decodeURIComponent(
      //       hash.substring(hash.indexOf("neuToken=") + 9)
      //     );
      //   }
      // }
      $http
        .get(`${VERSION_URL}?v=revisionHash`)
        .then(res => {
          $rootScope.js_version = res.data.js_version;
          $window.localStorage.setItem("version", $rootScope.js_version);
        })
        .catch(err => {});

      if (token !== null && typeof token !== "undefined") {
        $rootScope.language.set(token.token.locale);
        $http.defaults.headers.common.Token = token.token.token;
        $http.defaults.headers.common["Cache-Control"] = "no-cache";
        $http.defaults.headers.common.Pragma = "no-cache";
        $rootScope.user = token;
        $rootScope.user.global_permissions = token.global_permissions;
        $rootScope.user.domain_permissions = token.domain_permissions;

        $http.get(SELF_URL, { params: { isOnNV: "true" } }).then(
          function(response) {
            $rootScope.isOpenShift = false;
            token.token = response.data.token;
            $rootScope.user.global_permissions = token.token.global_permissions;
            $rootScope.user.domain_permissions = token.token.domain_permissions;
            token.roles = $rootScope.user.roles;
            $rootScope.user.token = token.token;
            $window.sessionStorage.setItem("token", JSON.stringify(token));
            $rootScope.isSUSESSO = response.data.is_suse_authenticated;

            $http
              .get(CONFIG_URL)
              .then(res => {
                $rootScope.clusterName = res.data.config.cluster_name;
              })
              .catch(err => {
                console.warn(err);
              });
            $http
              .get(DASHBOARD_SUMMARY_URL)
              .then(function(response) {
                $rootScope.isOpenShift =
                  response.data.summary.platform === OPENSHIFT || response.data.summary.platform ===  RANCHER;
                $rootScope.summary = response.data.summary;
                $rootScope.hasInitializedSummary = true;
              })
              .catch(function(err) {
                if (origin !== "/page/login") {
                  $window.sessionStorage.setItem(
                    "from",
                    JSON.stringify($location.url())
                  );
                  $window.sessionStorage.removeItem("token");
                  $window.sessionStorage.removeItem("cluster");
                }
              });
            console.log("token login");
          },
          function(err) {
            console.warn(err);
            vm.authMsg = "Server Request Error";
            if (err.status === 403) {
              vm.authMsg = "Session expired. Please login again.";
            }
            $state.go("page.login");
          }
        );
      } else {
        $window.location.href = "#/pages/login";
      }
    }
  }
})();
