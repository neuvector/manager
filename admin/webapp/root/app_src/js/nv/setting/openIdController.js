(function() {
  "use strict";

  angular.module("app.login").controller("OpenIdController", OpenIdController);

  OpenIdController.$inject = [
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
  function OpenIdController(
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

    vm.scopes = ["openid", "profile", "email"];
    let scopesCopy = angular.copy(vm.scopes);
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
        return `${$location.protocol()}://${$location.host()}/openId_auth`;
      }
      return `${$location.protocol()}://${$location.host()}:${$location.port()}/openId_auth`;
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

    $scope.onRemovedChip = function(chip) {
      if (chip === "openid") {
        vm.server.scopes.push(chip);
      }
    };

    $scope.resetEyeIcon = function() {
      $scope.showPassword = false;
    };

    $scope.showPasswordFn = function() {
      if (!vm.onCreate) {
        vm.local.client_secret = "********";
      }
    };

    function initialOpenId(response) {
      vm.server.default_role =  "none";
      vm.server.issuer = "";
      vm.server.client_id = "";
      vm.server.client_secret = "";
      vm.server.group_claim = "";
      vm.scopes = angular.copy(scopesCopy);
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
          vm.local = { client_secret: "" };
          initialOpenId(response);
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
              if (server.hasOwnProperty("oidc")) {
                if (server.oidc.group_mapped_roles) {
                  $scope.groupRoleMapData = JSON.stringify({
                    isWriteGroupsAuthorized: $scope.isSubmitSettingAuthorized,
                    groupRoleMap: server.oidc.group_mapped_roles,
                    mappableRoles: response.data.mappable_roles
                  });
                }
                server.oidc.default_role = server.oidc.default_role ? $sanitize(server.oidc.default_role) : "none";
                console.log("$scope.role_groups: ", $scope.role_groups)
                server.oidc.issuer = $sanitize(server.oidc.issuer) || "";
                server.oidc.client_id = $sanitize(server.oidc.client_id) || "";
                server.oidc.client_secret = $sanitize(server.oidc.client_secret) || "";
                server.oidc.group_claim = $sanitize(server.oidc.group_claim) || "";
                server.oidc.scopes = server.oidc.scopes.map(scope => $sanitize(scope));

                vm.server = server.oidc;
                if (vm.server.scopes) vm.scopes = vm.server.scopes;
                /** @namespace server.server_name */
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

    vm.addOrUpdate = function(
      form,
      server
    ) {

      if (form.oidcSecret.$dirty) {
        server.client_secret = form.oidcSecret.$viewValue;
      } else {
        server.client_secret = null;
      }

      if (vm.onCreate) {
        vm.addServer(server);
      } else {
        vm.updateServer(server);
      }
    };

    vm.addServer = function(server) {
      server.role_groups = $scope.role_groups;
      let serverConfig = angular.copy(server);
      serverConfig.group_mapped_roles = JSON.parse($scope.groupRoleMapData).groupRoleMap;
      serverConfig.default_role = serverConfig.default_role === "none" ? "" : serverConfig.default_role;
      serverConfig.scopes = vm.scopes;
      console.log(serverConfig.scope);
      $http
        .post(LDAP_URL, {
          config: { name: "openId1", oidc: serverConfig }
        })
        .then(function() {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          Alertify.success($translate.instant("ldap.SERVER_SAVED"));
          vm.onCreate = false;
          vm.local = { client_secret: "" };
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

    vm.updateServer = function(server) {
      server.role_groups = $scope.role_groups;
      let serverConfig = angular.copy(server);
      serverConfig.group_mapped_roles = JSON.parse($scope.groupRoleMapData).groupRoleMap;
      serverConfig.default_role = serverConfig.default_role === "none" ? "" : serverConfig.default_role;
      serverConfig.scopes = vm.scopes;
      console.log(serverConfig.scope);
      $http
        .patch(LDAP_URL, {
          config: { name: serverConfig.name, oidc: serverConfig }
        })
        .then(function() {
          Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
          Alertify.success($translate.instant("ldap.SERVER_SAVED"));
          vm.local = { client_secret: "" };
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
