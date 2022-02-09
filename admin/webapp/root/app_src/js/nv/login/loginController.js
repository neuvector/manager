(function () {
  "use strict";

  angular
    .module("app.login")
    .controller("LoginFormController", LoginFormController);

  LoginFormController.$inject = [
    "$rootScope",
    "$http",
    "$state",
    "$location",
    "$window",
    "$sanitize",
    "$cookies",
    "$translate",
    "Utils",
    "$mdDialog",
  ];
  function LoginFormController(
    $rootScope,
    $http,
    $state,
    $location,
    $window,
    $sanitize,
    $cookies,
    $translate,
    Utils,
    $mdDialog
  ) {
    let vm = this;
    let now = Date.now();
    $window.localStorage.setItem("login_time", now.toString());
    const OPENSHIFT = "Kubernetes-OpenShift";
    const CIOPS_ROLE = "ciops";
    $rootScope.hasInitializedSummary = false;
    $rootScope.clusterName = "";

    if ($window.sessionStorage.getItem("cluster")) {
      $window.sessionStorage.removeItem("cluster");
    }

    activate();
    ////////////////

    function activate() {
      $mdDialog.cancel();
      vm.account = {};
      vm.authMsg = "";
      let cookie = $cookies.get("temp");
      if (cookie) {
        $http
          .patch(TOKEN_AUTH, { withCredentials: true })
          .then(function (response) {
            vm.inProgress = true;
            $rootScope.user = response.data;
            $rootScope.user.global_permissions =
              response.data.token.global_permissions;
            $rootScope.user.domain_permissions =
              response.data.token.domain_permissions;
            $rootScope.language.set($rootScope.user.token.locale);
            $window.sessionStorage.setItem(
              "token",
              JSON.stringify($rootScope.user)
            );
            $http.defaults.headers.common.Token = JSON.parse(
              $window.sessionStorage.getItem("token")
            ).token.token;
            $http.defaults.headers.common["Cache-Control"] = "no-cache";
            $http.defaults.headers.common.Pragma = "no-cache";
            $cookies.remove("temp");

            $http
              .get(EULA_URL)
              .then(function (response) {
                // noinspection JSUnresolvedVariable
                let eula = response.data.eula;
                $rootScope.isOpenShift = false;
                $http.get(DASHBOARD_SUMMARY_URL).then(function (response) {
                  $rootScope.isOpenShift =
                    response.data.summary.platform === OPENSHIFT;
                  $rootScope.summary = response.data.summary;
                  $rootScope.hasInitializedSummary = true;
                  if (eula === null) {
                    $state.go("page.eula");
                  } else {
                    if (eula.accepted) {
                      $state.go("app.dashboard");
                    } else {
                      $state.go("page.eula");
                    }
                  }
                });
              })
              .catch(function (err) {
                console.warn(err.data);
                $cookies.remove("temp");
                vm.authMsg = Utils.getErrorMessage(err);
                vm.inProgress = false;
              });
          })
          .catch(function (err) {
            console.warn(err.data);
            vm.authMsg = Utils.getErrorMessage(err);
            vm.inProgress = false;
          });
      }

      angular.element("#Email1").focus();

      if ($rootScope.sessionTimeout) {
        $rootScope.sessionTimeout = false;
        vm.authMsg = $translate.instant("login.SESSION_TIMEOUT");
      }

      //get TokenAuth server list
      $http
        .get(TOKEN_AUTH, { withCredentials: true })
        .then(function (response) {
          vm.servers = response.data.servers;
          if (vm.servers && vm.servers.length > 0) {
            vm.samlEnabled = vm.servers.find(function (server) {
              // noinspection JSUnresolvedVariable
              return server.server_type === "saml";
            });
            vm.oidcEnabled = vm.servers.find(function (server) {
              // noinspection JSUnresolvedVariable
              return server.server_type === "oidc";
            });
          }
        })
        .catch(function (err) {
          console.warn(err);
          vm.authMsg = Utils.getErrorMessage(err);
        });

      vm.login = function () {
        let original = JSON.parse($window.sessionStorage.getItem("from"));
        let version = $window.localStorage.getItem("version");
        let gpuEnabled = $window.localStorage.getItem("_gpuEnabled");
        clearToken();
        $window.localStorage.setItem("version", version);
        $window.localStorage.setItem("_gpuEnabled", gpuEnabled);
        vm.authMsg = "";
        // noinspection JSUnresolvedVariable
        if (vm.loginForm.$valid) {
          vm.inProgress = true;
          // Utils.generateKeyTable(1).then(function(response) {
          //   $rootScope.key = response;
          $http
            .get(`${VERSION_URL}?v=revisionHash`)
            .then((res) => {
              $rootScope.js_version = res.data.js_version;
            })
            .catch((err) => {});
          $http
            .post(LOGIN_URL, {
              username: $sanitize(vm.account.email),
              password: vm.account.password,
            })
            .then(function (response) {
              const role = response.data.token.role;
              // if(role === CIOPS_ROLE){
              //   vm.authMsg = $translate.instant('login.UNSUPPORTED_ROLE');
              //   vm.inProgress = false;
              // }else{
              //
              // }
              $rootScope.user = response.data;
              $rootScope.user.global_permissions =
                response.data.token.global_permissions;
              $rootScope.user.domain_permissions =
                response.data.token.domain_permissions;
              $rootScope.language.set($rootScope.user.token.locale);
              $rootScope.isSUSESSO = response.data.is_suse_authenticated;
              $window.sessionStorage.setItem(
                "token",
                JSON.stringify($rootScope.user)
              );
              $http.defaults.headers.common.Token = JSON.parse(
                $window.sessionStorage.getItem("token")
              ).token.token;
              $http.defaults.headers.common["Cache-Control"] = "no-cache";
              $http.defaults.headers.common.Pragma = "no-cache";
              // noinspection JSUnresolvedVariable
              $http
                .get(EULA_URL)
                .then(function (response) {
                  // noinspection JSUnresolvedVariable
                  let eula = response.data.eula;
                  $rootScope.isOpenShift = false;
                  $http
                    .get(CONFIG_URL)
                    .then((res) => {
                      $rootScope.clusterName = res.data.config.cluster_name;
                    })
                    .catch((err) => {
                      console.warn(err);
                    });
                  $http
                    .get(DASHBOARD_SUMMARY_URL)
                    .then(function (response) {
                      $rootScope.isOpenShift =
                        response.data.summary.platform === OPENSHIFT;
                      $rootScope.summary = response.data.summary;
                      $rootScope.hasInitializedSummary = true;
                      if (eula === null) {
                        $state.go("page.eula");
                      } else {
                        if (eula.accepted) {
                          if (original && original !== "/page/login") {
                            $location.url(original);
                          } else {
                            $state.go("app.dashboard");
                          }
                        } else {
                          $state.go("page.eula");
                        }
                      }
                    });
                })
                .catch(function (err) {
                  console.warn(err.data);
                });
              vm.inProgress = false;
          }).
          catch(function (err) {
            console.warn(err.data);
            vm.authMsg = Utils.getErrorMessage(err);
            vm.inProgress = false;
          });
        } else {
          // set as dirty if the user click directly to login so we show the validation messages
          /*jshint -W106*/
          /** @namespace vm.loginForm */
          vm.loginForm.account_email.$dirty = true;
          vm.loginForm.account_password.$dirty = true;
        }
      };

      //SAML login
      vm.oktaLogin = function () {
        clearToken();
        $http
          .get(TOKEN_AUTH, {
            params: { serverName: "saml1" },
            withCredentials: true,
          })
          .then(function (response) {
            vm.server = response.data.redirect;
            vm.inProgress = true;
            /** @namespace vm.server.redirect_url */
            $window.location.href = vm.server.redirect_url;
          })
          .catch(function (err) {
            vm.authMsg = Utils.getErrorMessage(err);
            vm.inProgress = false;
            console.warn(err);
          });
      };

      //OpenID login
      vm.oidcLogin = function () {
        clearToken();
        $http
          .get(OIDC_AUTH, {
            params: { serverName: "openId1" },
            withCredentials: true,
          })
          .then(function (response) {
            vm.server = response.data.redirect;
            vm.inProgress = true;
            $window.location.href = vm.server.redirect_url;
          })
          .catch(function (err) {
            vm.authMsg = Utils.getErrorMessage(err);
            vm.inProgress = false;
            console.warn(err);
          });
      };
    }

    function clearToken() {
      $window.localStorage.clear();
      $window.sessionStorage.clear();
      $rootScope.user = null;
      $rootScope.sidebarDone = false;
      $rootScope.versionDone = false;
      $rootScope.isFooterReady = false;
    }
  }
})();
