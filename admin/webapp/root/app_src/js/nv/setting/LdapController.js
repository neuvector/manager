(function() {
  "use strict";

  angular.module("app.login").controller("LdapController", LdapController);

  LdapController.$inject = [
    "$rootScope",
    "$scope",
    "$http",
    "$mdDialog",
    "$sanitize",
    "Alertify",
    "$translate",
    "Utils",
    "$controller",
    "$state",
    "$timeout",
    "AuthorizationFactory"
  ];
  function LdapController(
    $rootScope,
    $scope,
    $http,
    $mdDialog,
    $sanitize,
    Alertify,
    $translate,
    Utils,
    $controller,
    $state,
    $timeout,
    AuthorizationFactory
  ) {
    let vm = this;
    $scope.inputMaskDisabledClass = "";

    let isLdapAuth = AuthorizationFactory.getDisplayFlag("write_auth_server");
    $scope.isTestAuthorized = isLdapAuth;
    $scope.isSubmitSettingAuthorized = isLdapAuth;

    function resetEyeIcon() {
      $scope.showPassword = false;
    }

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

    function activate() {

      if ($rootScope.user.token.role !== "admin") {
        $scope.inputMaskDisabledClass = "input-mask-disabled";
      }

      vm.server = {};

      function initialLdap(response) {
        vm.server.default_role = "none";
        vm.server.hostname = "";
        vm.server.port = null;
        vm.server.bind_dn = "";
        vm.server.bind_password = "";
        vm.server.base_dn = "";
        vm.server.username_attr = "";
        vm.server.group_member_attr = "";
        $scope.isIntialized = true;
        $scope.groupRoleMapData = JSON.stringify({
          isWriteGroupsAuthorized: $scope.isSubmitSettingAuthorized,
          groupRoleMap: [],
          mappableRoles: response.data.mappable_roles
        });
        console.log("Group map initialized");
      }

      $scope.refresh = function() {
        $scope.groupMapData = [];
        $http
          .get(LDAP_URL)
          .then(function(response) {
            vm.onCreate = true;
            initialLdap(response);
            vm.roles = response.data.mappable_roles.default_roles.map(default_role => {
              return parseRole(default_role);
            });
            $scope.groupMapData = response.data.mappable_roles.group_roles.map(group_roles => {
              return {groupRole: group_roles, groups: []};
            });
            vm.server.default_role = "none";
            if (response.data.servers && response.data.servers.length > 0) {
              for (let server of response.data.servers) {
                if (server.hasOwnProperty("ldap")) {
                  if (server.ldap.group_mapped_roles) {
                    $scope.groupRoleMapData = JSON.stringify({
                      isWriteGroupsAuthorized: $scope.isSubmitSettingAuthorized,
                      groupRoleMap: server.ldap.group_mapped_roles,
                      mappableRoles: response.data.mappable_roles
                    });
                  }
                  server.ldap.default_role = server.ldap.default_role ? $sanitize(server.ldap.default_role) : "none";
                  server.ldap.hostname = $sanitize(server.ldap.hostname) || "";
                  server.ldap.bind_dn = $sanitize(server.ldap.bind_dn) || "";
                  server.ldap.bind_password = $sanitize(server.ldap.bind_password) || "";
                  server.ldap.base_dn = $sanitize(server.ldap.base_dn) || "";
                  server.ldap.username_attr = $sanitize(server.ldap.username_attr) || "";
                  server.ldap.group_member_attr = $sanitize(server.ldap.group_member_attr) || "";
                  vm.server = server.ldap;
                  console.log(vm.server);
                  vm.server.name = server.server_name;
                  vm.onCreate = false;
                }
              }
            }
            vm.server.directory =
              vm.server.directory === "" ||
              vm.server.directory === null ||
              typeof vm.server.directory === "undefined"
                ? "OpenLDAP"
                : vm.server.directory;
          })
          .catch(function(err) {
            console.warn(err);
            if (USER_TIMEOUT.indexOf(err.status) < 0) {
              Alertify.alert(
                Utils.getAlertifyMsg(err, $translate.instant("ldap.message.GET_LDAP_ERR"), true)
              );
            }
          });
      };

      $scope.refresh();

      const getRoleMap = function(groupRoles) {
        let roleMap = {};
        groupRoles.forEach(groupRole => {
          roleMap[groupRole.groupRole] = groupRole.groups;
        });
        return roleMap;
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
        ldapServer
      ) {
        // ldapServer.port = parseInt(ldapServer.port, 10);

        resetEyeIcon();
        if (form.ldapPassword.$dirty) {
          ldapServer.bind_password = form.ldapPassword.$viewValue;
        } else {
          ldapServer.bind_password = null;
        }
        if (vm.onCreate) {
          vm.addServer(form, ldapServer);
        } else {
          vm.updateServer(
            form,
            ldapServer
          );
        }
      };

      vm.addServer = function(
        form,
        ldapServer
      ) {
        ldapServer.role_groups = $scope.role_groups;
        let ldapServerConfig = angular.copy(ldapServer);
        ldapServerConfig.group_mapped_roles = JSON.parse($scope.groupRoleMapData).groupRoleMap;
        ldapServerConfig.default_role = ldapServerConfig.default_role === "none" ? "" : ldapServerConfig.default_role;
        let config = {
          config: { name: "ldap1", ldap: ldapServerConfig }
        };
        $http
          .post(LDAP_URL, config)
          .then(function() {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("ldap.SERVER_SAVED"));
            vm.server.name = config.config.name;
            vm.onCreate = false;
            ldapServer.bind_password = "";
            form.$setPristine();
            form.$setUntouched();
            $timeout(() => {
              $scope.refresh();
            }, 1000);
          })
          .catch(function(err) {
            handlerError(err);
          });
      };

      function handlerError(err) {
        console.warn(err);
        if (USER_TIMEOUT.indexOf(err.status) < 0) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(err, $translate.instant("ldap.SERVER_SAVE_FAILED"), false)
          );
        }
      }

      vm.updateServer = function(
        form,
        ldapServer
      ) {
        console.log("update:", ldapServer);
        ldapServer.role_groups = $scope.role_groups;
        let ldapServerConfig = angular.copy(ldapServer);
        ldapServerConfig.group_mapped_roles = JSON.parse($scope.groupRoleMapData).groupRoleMap;
        ldapServerConfig.default_role = ldapServerConfig.default_role === "none" ? "" : ldapServerConfig.default_role;
        $http
          .patch(LDAP_URL, {
            config: { name: ldapServerConfig.name, ldap: ldapServerConfig }
          })
          .then(function() {
            ldapServer.bind_password = "";
            form.$setPristine();
            form.$setUntouched();
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("ldap.SERVER_SAVED"));
            $timeout(() => {
              $scope.refresh();
            }, 1000);
          })
          .catch(function(err) {
            handlerError(err);
          });
      };

      vm.test = function(ev) {
        vm.server.role_groups = $scope.role_groups;
        vm.server.bind_password = $scope.ldapForm.ldapPassword.$dirty
          ? vm.server.bind_password
          : null;
        $mdDialog
          .show({
            locals: { server: vm.server },
            controller: LDAPTestController,
            templateUrl: "dialog.ldap.html",
            targetEvent: ev
          })
          .then(
            function() {},
            function() {}
          );
      };
    }

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    LDAPTestController.$inject = ["$scope", "server", "$http", "$mdDialog"];
    function LDAPTestController($scope, server, $http, $mdDialog) {
      activate();

      function activate() {
        $scope.testFinished = false;
        $scope.inprogress = false;

        // server.port = parseInt(server.port, 10);
        $scope.server = server;
        $scope.hide = function() {
          $mdDialog.hide();
        };

        $scope.cancel = function() {
          $mdDialog.cancel();
        };

        $scope.check = function(user) {
          $scope.testFinished = false;
          $scope.inprogress = true;
          let payload;
          if ($scope.server) {
            let serverInfo = angular.copy($scope.server);
            console.log(serverInfo)
            serverInfo.default_role = serverInfo.default_role === "none" ? "" : serverInfo.default_role;
            payload = {
              test: {
                name: "ldap1",
                ldap: serverInfo,
                test_ldap: { username: user.username, password: user.password }
              }
            };
          } else {
            payload = {
              test: {
                name: "ldap1",
                test_ldap: { username: user.username, password: user.password }
              }
            };
          }
          $http
            .post(DEBUG_URL, payload)
            .then(function(response) {
              $scope.testFinished = true;
              $scope.inprogress = false;
              $scope.failed = false;
              $scope.groups = response.data.result.groups;
              if ($scope.groups && $scope.groups.length > 0)
                $scope.connectedMessage = $translate.instant(
                  "ldap.test.SUCCEEDED_GROUP"
                );
              else
                $scope.connectedMessage = $translate.instant(
                  "ldap.test.SUCCEEDED"
                );
            })
            .catch(function(err) {
              let message = Utils.getErrorMessage(err);
              $scope.testFinished = true;
              $scope.inprogress = false;
              $scope.failed = true;
              $scope.errorMessage = message;
            });
        };
      }
    }
  }
})();
