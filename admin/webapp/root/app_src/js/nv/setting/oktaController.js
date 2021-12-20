(function() {
  "use strict";

  angular.module("app.login").controller("OktaController", OktaController);

  OktaController.$inject = [
    "$scope",
    "$http",
    "Alertify",
    "$translate",
    "$sanitize",
    "Utils",
    "$location",
    "$controller",
    "$state",
    "$timeout",
    "AuthorizationFactory"
  ];
  function OktaController(
    $scope,
    $http,
    Alertify,
    $translate,
    $sanitize,
    Utils,
    $location,
    $controller,
    $state,
    $timeout,
    AuthorizationFactory
  ) {
    let vm = this;
    $scope.copied = false;
    vm.server = {};

    $scope.isSubmitSettingAuthorized = AuthorizationFactory.getDisplayFlag("write_auth_server");

    const parseRole = function(role) {
      if (role) return role;
      else return "none";
    };

    const onRoleMapRowChanged = function() {
      let selectedRow = $scope.groupRoleGridOptions.api.getSelectedRows()[0];
      $scope.roleName = parseRole(selectedRow.groupRole);
      $scope.roleId = selectedRow.groupRole;
      $scope.groupRoleHint = $translate.instant("ldap.GP_ROLE_HINT", {role: $scope.roleName});
      $scope.groups = selectedRow.groups.map(namespace => {
        return {name: namespace}
      });
      $scope.$apply();
    };

    const groupRoleColumnDefs = [
      {
        headerName: $translate.instant("ldap.GROUP_ROLE"),
        field: "groupRole",
        cellRenderer: (params) => {
          if (params && params.value) {
            return parseRole(params.value);
          }
        },
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
        },
        width: 100
      },
      {
        headerName: $translate.instant("ldap.GROUPS"),
        field: "groups",
        cellRenderer: function(params) {
          if (params && params.value) {
            console.log(params.value)
            return params.value.map(group => {
              return (
                `<span class="mr-sm pull-left label label-info" style="display: inline-block">${group}</span>`
              );
            }).join("");
          }
        },
        icons: {
          sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
          sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
        },
        width: 300
      }
    ];
    $scope.groupRoleGridOptions = Utils.createGridOptions(groupRoleColumnDefs);
    $scope.groupRoleGridOptions.onSelectionChanged = onRoleMapRowChanged;

    activate();

    $scope.redirectBackToSetting = function() {
      $state.go("app.settingsHome");
    };

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });
    baseCtl.doOnClusterRedirected4Setting($scope.redirectBackToSetting);
    // baseCtl.doOnClusterRedirected(loadServer);

    function getCallbackUri() {
      const protocol = $location.protocol();
      const port = $location.port();
      if (
        (protocol.toLowerCase() === "https" && port === 443) ||
        (protocol.toLowerCase() === "http" && port === 80)
      ) {
        return `${$location.protocol()}://${$location.host()}/token_auth_server`;
      }
      return `${$location.protocol()}://${$location.host()}:${$location.port()}/token_auth_server`;
    }

    function activate() {
      $scope.callbackUrl = getCallbackUri();
      loadServer();
    }

    $scope.success = function() {
      $scope.copied = true;
      setTimeout(function() {
        $scope.copied = false;
        $scope.$apply();
      }, 3000);
    };

    function initialSaml(response) {
      vm.server.default_role = "none";
      vm.server.sso_url = "";
      vm.server.issuer = "";
      vm.server.x509_cert = "";
      vm.server.group_claim = "";
      $scope.groupRoleMapData = JSON.stringify({
        isWriteGroupsAuthorized: $scope.isSubmitSettingAuthorized,
        groupRoleMap: [],
        mappableRoles: response.data.mappable_roles
      });
      console.log("Group map initialized");
    }

    function loadServer() {
      $http
        .get(LDAP_URL)
        .then(function(response) {
          vm.onCreate = true;
          initialSaml(response);
          $scope.groupMapData = [];
          $scope.groupMapData = response.data.mappable_roles.group_roles.map(group_roles => {
            return {groupRole: group_roles, groups: []};
          });
          vm.roles = response.data.mappable_roles.default_roles.map(default_role => {
            return parseRole(default_role);
          });
          vm.server.default_role = "none";
          if (response.data.servers && response.data.servers.length > 0) {
            for (let server of response.data.servers) {
              if (server.hasOwnProperty("saml")) {
                if (server.saml.group_mapped_roles) {
                  $scope.groupRoleMapData = JSON.stringify({
                    isWriteGroupsAuthorized: $scope.isSubmitSettingAuthorized,
                    groupRoleMap: server.saml.group_mapped_roles,
                    mappableRoles: response.data.mappable_roles
                  });
                }
                console.log("$scope.role_groups: ", $scope.role_groups)
                server.saml.default_role = server.saml.default_role ? $sanitize(server.saml.default_role) : "none";
                server.saml.sso_url = $sanitize(server.saml.sso_url) || "";
                server.saml.issuer = $sanitize(server.saml.issuer) || "";
                server.saml.x509_cert = $sanitize(server.saml.x509_cert) || "";
                server.saml.group_claim = $sanitize(server.saml.group_claim) || "";
                vm.server = server.saml;
                vm.server.name = server.server_name;
                vm.onCreate = false;
              }
            }
          }
        })
        .catch(function(err) {
          console.warn(err);
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.alert(
              Utils.getAlertifyMsg(err, $translate.instant("okta.message.GET_SAML_ERR"), true)
            );
          }
        });
    }

    $scope.tagChanging = function($tag) {
      $timeout(() => {
        let roleGroupRow = {
          groupRole: $scope.roleId,
          groups: $scope.groups.map(group => group.name)
        }
        console.log("roleGroupRow: ", roleGroupRow)
        let updateGroupIndex = $scope.groupMapData.findIndex(row => {
          return row.groupRole === $scope.roleId;
        });
        $scope.groupMapData.splice(updateGroupIndex, 1, roleGroupRow);
        $scope.role_groups = getRoleMap($scope.groupMapData);
        console.log($scope.groupMapData, $scope.role_groups);
      }, 200);
    };

    vm.addOrUpdate = function(samlServer) {

      if($scope.oktaForm.cert.$dirty){
        samlServer.x509_cert = $scope.oktaForm.cert.$viewValue;
      }else{
        samlServer.x509_cert = null;
      }

      if (vm.onCreate) {
        vm.addServer(samlServer);
      } else {
        vm.updateServer(samlServer);
      }
    };

    vm.addServer = function(samlServer) {
      samlServer.role_groups = $scope.role_groups;
      let samlServerConfig = angular.copy(samlServer);
      samlServerConfig.group_mapped_roles = JSON.parse($scope.groupRoleMapData).groupRoleMap;
      samlServerConfig.default_role = samlServerConfig.default_role === "none" ? "" : samlServerConfig.default_role;
      $http
        .post(LDAP_URL, {
          config: { name: "saml1", saml: samlServerConfig }
        })
        .then(function() {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          Alertify.success($translate.instant("ldap.SERVER_SAVED"));
          vm.onCreate = false;
          $scope.oktaForm.$setPristine();
          $scope.oktaForm.$setUntouched();
          $timeout(() => {
            loadServer();
          }, 1000);
        })
        .catch(function(err) {
          console.warn(err);
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("ldap.SERVER_SAVE_FAILED"), false)
            );
          }
        });
    };

    vm.updateServer = function(samlServer) {
      samlServer.role_groups = $scope.role_groups;
      let samlServerConfig = angular.copy(samlServer);
      samlServerConfig.group_mapped_roles = JSON.parse($scope.groupRoleMapData).groupRoleMap;
      samlServerConfig.default_role = samlServerConfig.default_role === "none" ? "" : samlServerConfig.default_role;
      $http
        .patch(LDAP_URL, {
          config: { name: samlServerConfig.name, saml: samlServerConfig }
        })
        .then(function() {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          Alertify.success($translate.instant("ldap.SERVER_SAVED"));
          $scope.oktaForm.$setPristine();
          $scope.oktaForm.$setUntouched();
          $timeout(() => {
            loadServer();
          }, 1000);
        })
        .catch(function(err) {
          console.warn(err);
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(err, $translate.instant("ldap.SERVER_SAVE_FAILED"), false)
            );
          }
        });
    };

    const getRoleMap = function(groupRoles) {
      let roleMap = {};
      groupRoles.forEach(groupRole => {
        roleMap[groupRole.groupRole] = groupRole.groups;
      });
      return roleMap;
    }
  }
})();
