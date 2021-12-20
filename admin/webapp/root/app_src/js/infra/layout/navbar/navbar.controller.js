(function() {
  "use strict";
  angular
    .module("app.navbar")
    .controller("NavbarController", NavbarController)

  NavbarController.$inject = [
    "$rootScope",
    "$scope",
    "$state",
    "$http",
    "$translate",
    "$window",
    "$location",
    "Alertify",
    "$mdToast",
    "$timeout",
    "multiClusterService",
    "Utils",
    "AuthorizationFactory"
  ];
  function NavbarController(
    $rootScope,
    $scope,
    $state,
    $http,
    $translate,
    $window,
    $location,
    Alertify,
    $mdToast,
    $timeout,
    multiClusterService,
    Utils,
    AuthorizationFactory
  ) {
    const resource = {
      multiClusterOp: {
        global: 2
      },
    };

    const MAX_UNUPDATED_DAYS = 7;

    let currLocationView = "";

    $scope.canJoinLeaveCluster = Utils.isAuthorized(
      $scope.user.roles,
      resource.multiClusterOp
    );
    const docUrl = $translate.instant("partner.general.DOCUMENT_URL");
    $scope.date = new Date();
    $scope.closeList = function() {
      document.getElementById("notification-list").click();
    };
    let vm = this;
    let timer = null;

    //--------------------------------------------------------
    //--------------- MultiCluster initialization ------------
    //--------------------------------------------------------
    $rootScope.isMaster = false;
    $rootScope.isRemote = false;
    $scope.selectedCluster = {};

    //--------------------------------------------------------
    //--------------------- RBC Init -------------------------
    //--------------------------------------------------------
    const clusterResource = {
      redirectAuth: {
        global: 3
      },
      manageAuth: {
        global: 2
      },
      policyAuth: {
        global: 3
      }
    };

    $scope.isManageAuth = $scope.isRedirectAuth = Utils.isAuthorized(
      $scope.user.roles,
      clusterResource.manageAuth
    );
    $scope.isRedirectAuth = Utils.isAuthorized(
      $scope.user.roles,
      clusterResource.redirectAuth
    );
    $scope.isPolicyAuth = Utils.isAuthorized(
      $scope.user.roles,
      clusterResource.policyAuth
    );

    //--------------------------------------------------------
    //----------- MultiCluster Action definitions ------------
    //--------------------------------------------------------
    $scope.initClusters = function() {
      multiClusterService.getClusters().then(function(payload) {
        $scope.clusters = payload.data.clusters || [];
        $rootScope.isMaster = payload.data.fed_role === FED_ROLES.MASTER;
        $rootScope.isMember = payload.data.fed_role === FED_ROLES.MEMBER;
        $rootScope.isStandAlone = payload.data.fed_role === "";
        $scope.canJoinLeaveCluster =
          AuthorizationFactory.getDisplayFlag("multi_cluster") ||
          Utils.isAuthorized(
            $scope.user.roles,
            resource.multiClusterOp
          ) && payload.data.fed_role !== FED_ROLES.MASTER;

        if ($rootScope.isMaster) {
          clusterResource.manageAuth.global = 3;
          $scope.isManageAuth = Utils.isAuthorized(
            $scope.user.roles,
            clusterResource.manageAuth
          );
        }

        if ($rootScope.isMember) {
          $scope.managedCluster = $scope.clusters.find(cluster => {
            return cluster.clusterType === FED_ROLES.MEMBER;
          });
          $scope.masterCluster = $scope.clusters.find(cluster => {
            return cluster.clusterType === FED_ROLES.MASTER;
          });
        }

        let cluster = JSON.parse($window.sessionStorage.getItem("cluster"));

        if (cluster !== null) {
          $rootScope.isRemote = cluster.isRemote;
          $scope.selectedCluster.name = cluster.name;
          $scope.selectedCluster.id = cluster.id;
        } else {
          $scope.selectedCluster = $scope.clusters.find(cluster => {
            return cluster.clusterType === FED_ROLES.MASTER;
          });
        }
      });
    };

    $scope.refreshClusterList = function(clusters = null) {
      if (clusters) {
        $scope.clusters = clusters || [];
      } else {
        multiClusterService.getClusters().then(function(payload) {
          $scope.clusters = payload.data.clusters || [];
        });
      }
    };

    $scope.redirectCluster = function(id) {
      if (timer) {
        $timeout.cancel(timer);
      }

      timer = $timeout(function() {
        let currentID = $scope.selectedCluster.id;
        let selectedID = id;

        if (currentID !== selectedID) {
          if ($scope.selectedCluster.clusterType === FED_ROLES.MASTER) {
            currentID = "";
          }

          let selectedItem = $scope.clusters.find(cluster => {
            return cluster.id === id;
          });

          if (selectedItem.clusterType === FED_ROLES.MASTER) {
            selectedID = "";
          }

          multiClusterService
            .redirect(selectedID, currentID)
            .then(function() {
              $scope.selectedCluster = selectedItem;
              $rootScope.isRemote =
                $scope.selectedCluster.clusterType !== FED_ROLES.MASTER;

              //update the platform info after redirecting
              $http.get(DASHBOARD_SUMMARY_URL).then(function(response) {
                $rootScope.isOpenShift =
                  response.data.summary.platform === OPENSHIFT;
                $rootScope.summary = response.data.summary;
                $rootScope.hasInitializedSummary = true;
              });

              $rootScope.$broadcast("clusterRedirected");

              //save the selected cluster in sessionStorage
              const cluster = {
                isRemote: $rootScope.isRemote,
                id: $scope.selectedCluster.id,
                name: $scope.selectedCluster.name
              };
              $window.sessionStorage.setItem(
                "cluster",
                JSON.stringify(cluster)
              );

              $timeout(function() {
                $scope.refreshClusterList();
              }, 1200);
              Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
              Alertify.success(
                $translate.instant("multiCluster.messages.redirect_ok", {
                  name: $scope.selectedCluster.name
                })
              );
            })
            .catch(function(err) {
              if (err.status === "custom") {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  $translate.instant("multiCluster.messages.redirect_failure", {
                    name: selectedItem.name
                  }) + err.message
                );
              } else if (USER_TIMEOUT.indexOf(err.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(err, $translate.instant("multiCluster.messages.redirect_failure", {
                    name: selectedItem.name
                  }),false)
                );
              }
            });
        }
      });
    };

    //--------------------------------------------------------
    //---------------------- activation ----------------------
    //--------------------------------------------------------
    activate();

    function activate() {
      getLicense();
      //--------------------------------------------------------
      //-------------- MultiCluster on event -------------------
      //--------------------------------------------------------
      $scope.$on("reloadClusters", function(event, args) {
        $scope.refreshClusterList(args);
      });
      $scope.$on("manageRemoteCluster", function(event, data) {
        $rootScope.isMaster = true;
        $rootScope.isRemote = true;
        $scope.refreshClusterList();
        $scope.selectedCluster = data.cluster;
      });
      $scope.$on("updateClusterName", function(event, data) {
        if ($scope.clusters && $scope.clusters.length > 0) {
          const selectedClusterName = $scope.selectedCluster.name;
          const selectedClusterId = $scope.selectedCluster.id;
          if (data.name !== selectedClusterName) {
            $scope.clusters.forEach(cluster => {
              if (cluster.id === selectedClusterId) {
                cluster.name = data.name;
              }
            });
            $scope.selectedCluster.name = data.name;
          }
        }
      });

      //------- Multi-Cluster Initialization --------
      if ($scope.isManageAuth) {
        $scope.initClusters();
      }
      vm.homepage = docUrl;

    }

    const updateSummaryVersionData = function(cb) {
      let locationView = location.hash;
      if (currLocationView !== locationView) {
        if (locationView === "#/app/controllers") {
          Promise.all([
            $http.get(DASHBOARD_SUMMARY_URL),
            $http.get(MGR_VERSION)
          ])
          .then(([res4Summary, res4Version]) => {
            $rootScope.summary = res4Summary.data.summary;
            $rootScope.version = res4Version.data;
            cb();
          })
          .catch((err) => {
            console.warn(err);
            cb();
          });
        } else {
          cb();
        }
      }
      currLocationView = locationView;
    };

    $rootScope.toastWarnings = function() {
      let dateOfClosed = parseInt($window.localStorage.getItem($rootScope.user.token.token));
      if (dateOfClosed && dateOfClosed === (new Date).getDate()) return;
      const callback = function() {
        $mdToast.cancel().then(function() {
          $rootScope.isOnProfile = location.hash === "#/app/profile";
          let currentTime = new Date().getTime();
          let cveDBCreateTime = $rootScope.summary.cvedb_create_time ? Date.parse($rootScope.summary.cvedb_create_time) : 0;
          let unUpdateDays = cveDBCreateTime > 0 ? (currentTime - cveDBCreateTime) / (24 * 3600 * 1000) : 0;
          $rootScope.isScannerOld = unUpdateDays > MAX_UNUPDATED_DAYS;
          if (
            ($rootScope.expiredDays <= 60 && $rootScope.expiredDays > 0 && $rootScope.licenseModel !== 'metered') ||
            (!$rootScope.isOnProfile && $rootScope.user.token.default_password) ||
            (!$rootScope.isOnProfile && $rootScope.user.token.password_days_until_expire >= 0 && $rootScope.user.token.password_days_until_expire < 10) ||
            ($rootScope.expiredDays <= 0 && $rootScope.licenseModel !== 'metered') ||
            ($rootScope.summary.component_versions && ($rootScope.summary.component_versions.length > 1 || $rootScope.version !== $rootScope.summary.component_versions[0])) ||
            $rootScope.invalidLicense ||
            $rootScope.isScannerOld
          ) {
            $rootScope.passwordExpiringTxt =
              $translate.instant("login.CHANGE_EXPIRING_PASSWORD", {expiring_Days: $rootScope.user.token.password_days_until_expire + 1});
            $rootScope.oldScannerWarning =
              $translate.instant("login.CVE_DB_OLD", {day: Math.round(unUpdateDays)});
            $mdToast
              .show({
                hideDelay: 0,
                position: "bottom right",
                locals: {
                  expiredDays: $rootScope.expiredDays
                },
                controller: "ToastCtrl",
                controllerAs: "ctrl",
                bindToController: true,
                templateUrl: "toast.expiring.html"
              })
              .then(function(response) {
                //Do nothing
              });
          }
        });
      };

      updateSummaryVersionData(callback);
    }

    function getLicense() {
      $scope.licenseErr = false;
      $http
        .get(LICENSE_URL)
        .then(function(response) {
          if (response) {
            $scope.license = response.data.license;
            $scope.needLicense = !$scope.license;
            if ($scope.license) {
              $rootScope.expiredDays = $scope.license.day_to_expire;
              $rootScope.licenseModel = $scope.license.info.license_model;
              $rootScope.scanEnabled = $scope.license.info.scan;
            }
            $rootScope.invalidLicense = $scope.needLicense;
            $rootScope.toastWarnings();
          }
        })
        .catch(function(err) {
          console.warn(err);
          $scope.licenseErr = true;
          if (
            USER_TIMEOUT.indexOf(err.status) < 0 &&
            err.status !== UNAUTHORIZED
          ) {
            Alertify.alert(
              Utils.getAlertifyMsg(err, $translate.instant("license.message.GET_LICENSE_ERR"), true)
            );
          }
        });
    }
  }
})();
