(function() {
  "use strict";
  angular
    .module("app.login")
    .controller("RolesController", RolesController);

  RolesController.$inject = [
    "$rootScope",
    "$scope",
    "$translate",
    "$http",
    "$mdDialog",
    "$timeout",
    "Alertify",
    "$window",
    "Utils",
    "RolesService",
    "$controller",
    "$sanitize",
    "$state",
    "AuthorizationFactory"
  ];

  function RolesController(
    $rootScope,
    $scope,
    $translate,
    $http,
    $mdDialog,
    $timeout,
    Alertify,
    $window,
    Utils,
    RolesService,
    $controller,
    $sanitize,
    $state,
    AuthorizationFactory
  ) {

    $scope.hasSelectedRole = false;
    $scope.gridHeight = $window.innerHeight - 310;
    angular.element($window).bind("resize", function() {
      $scope.gridHeight = $window.innerHeight - 310;
      $scope.$digest();
    });

    let hasRolePermission = AuthorizationFactory.getDisplayFlag("roles");
    let isNamespaceUser = AuthorizationFactory.userPermission.isNamespaceUser;
    console.log(hasRolePermission, isNamespaceUser)
    $scope.isWriteRolesAuthorized = hasRolePermission && !isNamespaceUser && !$rootScope.isRemote;

    let filter = "";

    let getEntityName = function(count) {
      return Utils.getEntityName(
        count,
        $translate.instant("role.COUNT_POSTFIX")
      );
    };
    const found = $translate.instant("enum.FOUND");

    // const onSelectionChanged = function() {
    //   let selectedRows = $scope.gridOptions.api.getSelectedRows();
    //   $scope.role = angular.copy(selectedRows[0]);
    //   $scope.hasSelectedRole = true;
    //   $timeout(function() {
    //     $scope.gridOptions4Permissions.api.setRowData($scope.role.permissions);
    //   }, 50);
    //   $scope.$apply();
    // };

    let grid = RolesService.setGrid($scope.isWriteRolesAuthorized);
    $scope.gridOptions = grid.gridOptions;
    $scope.gridOptions.defaultColDef = {
      flex: 1,
      cellClass: 'cell-wrap-text',
      autoHeight: true,
      sortable: true,
      resizable: true,
    };
    $scope.gridOptions.onColumnResized = function(params) {
      params.api.resetRowHeights();
    };
    // $scope.gridOptions.onSelectionChanged = onSelectionChanged;
    // $scope.gridOptions4Permissions = grid.gridOptions4Permissions;

    const reorderPermissionOptionList = function(permissionOptions) {
      let permissonOptionList = {
        authentication: null,
        authorization: null,
        config: null,
        rt_scan: null,
        reg_scan: null,
        ci_scan: null,
        rt_policy: null,
        admctrl: null,
        vulnerability: null,
        compliance: null,
        audit_events: null,
        security_events: null,
        events: null
      };
      permissionOptions.forEach(permissionOption => {
        if (permissonOptionList.hasOwnProperty(permissionOption.id)) {
          permissonOptionList[permissionOption.id] = {
            id: permissionOption.id,
            desc: $translate.instant(`role.permissions.description.${permissionOption.id.toUpperCase()}`),
            read_supported: permissionOption.read_supported,
            write_supported: permissionOption.write_supported
          }
        }
      });

      console.log("Object.values(permissonOptionList)", Object.values(permissonOptionList));

      return Object.values(permissonOptionList);
    };

    $scope.reload = function(index) {
      RolesService.getPermissionOptions()
      .then(res => {
        console.log(res.data);
        RolesService.permissionOptions = reorderPermissionOptionList(res.data.options.global_options);
      })
      .catch();

      RolesService.getRoles()
      .then(res => {
        console.log(res.data);
        $scope.roles = res.data.roles;
        $scope.gridOptions.api.setRowData($scope.roles);
        $timeout(function() {
          $scope.gridOptions.api.sizeColumnsToFit();
          if (index) {
            let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(
              index
            );
            rowNode.setSelected(true);
            $scope.gridOptions.api.ensureNodeVisible(rowNode, "middle");
          } else {
            let rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
            rowNode.setSelected(true);
            $scope.gridOptions.api.ensureNodeVisible(rowNode, "middle");
          }
        }, 50);
        $scope.count = `${$scope.roles.length} ${getEntityName(
          $scope.roles.length
        )}`;
      })
      .catch(err => {
        if (err.status === 404 || err.status === 403) {
          $scope.gridOptions.overlayNoRowsTemplate = `<span class="overlay">${$translate.instant(
            "general.NO_ROWS"
          )}</span>`;
        } else {
          $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(err);
        }
        $scope.gridOptions.api.setRowData();
      });
    }

    $scope.reload();

    $scope.addRole = function() {
      let success = function() {
        $mdDialog
          .show({
            controller: DialogController4AddEditRole,
            controllerAs: "addEditRoleCtrl",
            templateUrl: "dialog.addEditRole.html",
            locals: {
              selectedRole: null
            }
          })
          .then(
            function() {
              $timeout(function() {
                $scope.reload($scope.roles.length);
              }, 3000);
            },
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.editRole = function(role) {
      let success = function() {
        let rowNode = null;
        let index4edit = RolesService.getIndex(
          $scope.roles,
          role.name
        );
        rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4edit);

        rowNode.setSelected(true);
        $mdDialog
          .show({
            controller: DialogController4AddEditRole,
            controllerAs: "addEditRoleCtrl",
            templateUrl: "dialog.addEditRole.html",
            locals: {
              selectedRole: role
            }
          })
          .then(
            function() {
              $timeout(() => {
                $scope.reload(index4edit);
              }, 1000);
            },
            function() {}
          );
      };

      let error = function() {};

      Utils.keepAlive(success, error);
    };

    $scope.removeRole = function(role) {
      let rowNode = null;
      let index4delete = RolesService.getIndex(
        $scope.roles,
        role.name
      );
      rowNode = $scope.gridOptions.api.getDisplayedRowAtIndex(index4delete);
      rowNode.setSelected(true);
      let confirmBox =
        $translate.instant("role.msg.REMOVE_CFM") + $sanitize(role.name);
      Alertify.confirm(confirmBox).then(
        function toOK() {
          RolesService.removeRole(role.name)
          .then(function(response) {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("role.msg.REMOVE_OK"));
            $timeout(() => {
              if (index4delete === $scope.roles.length - 1)
                index4delete -= 1;
              $scope.reload(index4delete);
            }, 1000);
          })
          .catch(function(e) {
            rowNode.setSelected(false);
            if (USER_TIMEOUT.indexOf(e.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(e, $translate.instant("role.msg.REMOVE_NG"), false)
              );
            }
          });
        },
        function toCancel() {
          let node = $scope.gridOptions.api.getDisplayedRowAtIndex(0);
          if (node) {
            $scope.hasSelectedrole = true;
            node.setSelected(true);
          } else {
            $scope.hasSelectedrole = false;
          }
        }
      );
    };

    $scope.reset = function() {
      $scope.gridOptions.api.stopEditing();
      $scope.reload();
    };
    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });
    baseCtl.doOnClusterRedirected($state.reload);
  }

  DialogController4AddEditRole.$inject = [
    "$scope",
    "$mdDialog",
    "$translate",
    "$timeout",
    "RolesService",
    "Alertify",
    "Utils",
    "selectedRole"
  ];

  function DialogController4AddEditRole(
    $scope,
    $mdDialog,
    $translate,
    $timeout,
    RolesService,
    Alertify,
    Utils,
    selectedRole
  ) {
    $scope.isEdit = !!selectedRole;
    $scope.permissionOptions = {};
    RolesService.permissionOptions.forEach(permissionOption => {
      return $scope.permissionOptions[permissionOption.id] = {
        id: permissionOption.id,
        displayName: $translate.instant(`role.permissions.${permissionOption.id.toUpperCase()}`),
        desc: permissionOption.desc,
        read_supported: permissionOption.read_supported,
        write_supported: permissionOption.write_supported,
        read: false,
        write: false
      };
    });
    console.log($scope.permissionOptions)
    $scope.permissionOptionList = Object.values($scope.permissionOptions);

    const getPermissionTags = function(permissions) {
      return permissions.map(permission => {
        return {
          name: `${$translate.instant(`role.permissions.${permission.id.toUpperCase()}`)} (${permission.write ? "M" : "V"})`,
          value: {
            id: permission.id,
            read: permission.read,
            write: permission.write
          }
        }
      });
    }

    const mapPermission2Options = function(existingPermissions, permissionOptionList) {
      return permissionOptionList.map(permissionOption => {
        let index = existingPermissions.findIndex(existingPermission => {
          return existingPermission.id === permissionOption.id;
        });
        return {
          id: permissionOption.id,
          displayName: $translate.instant(`role.permissions.${permissionOption.id.toUpperCase()}`),
          desc: permissionOption.desc,
          read_supported: permissionOption.read_supported,
          write_supported: permissionOption.write_supported,
          read: index > -1 ? existingPermissions[index].read : false,
          write: index > -1 ? existingPermissions[index].write : false
        };
      });
    }

    if ($scope.isEdit) {
      $scope.role = {
        name: selectedRole.name,
        comment: selectedRole.comment,
        permissionTags: getPermissionTags(selectedRole.permissions),
        permissions: selectedRole.permissions
      };
      $scope.permissionOptionList = mapPermission2Options(selectedRole.permissions, $scope.permissionOptionList);
      console.log($scope.permissionOptionList)
      $timeout(() => {
        $scope.role.permissionTags.forEach((tag, permissionIndex) => {
          if (!tag.value.write) {
            let tagElem = angular.element("ul.tag-list > li")[permissionIndex];
            tagElem.classList.remove("tag-item");
            tagElem.classList.add("selected-tag");
          }
        });
      }, 200);
    } else {
      $scope.role = {
        name: "",
        comment: "",
        permissionTags: [],
        permissions: {}
      };
    }

    $scope.removeTag = function(tag) {
      console.log(tag)
      let index = $scope.permissionOptionList.findIndex(permissionOption => permissionOption.id === tag.value.id);
      $scope.permissionOptionList[index].write = false;
      $scope.permissionOptionList[index].read = false;
    };

    $scope.chooseOperation = function(permissionId, index) {
      $timeout(() => {
        let tagIndex = $scope.role.permissionTags.findIndex(permissionTag => permissionTag.value.id === permissionId);
        console.log("tagIndex: ",tagIndex)
        if (tagIndex >= 0) $scope.role.permissionTags.splice(tagIndex, 1);

        if ($scope.permissionOptionList[index].read || $scope.permissionOptionList[index].write) {
          if ($scope.permissionOptionList[index].write && $scope.permissionOptionList[index].read_supported) $scope.permissionOptionList[index].read = true;
          $scope.role.permissionTags.push({
            name: `${$translate.instant(`role.permissions.${permissionId.toUpperCase()}`)} (${$scope.permissionOptionList[index].write ? "M" : "V"})`,
            value: {
              id: permissionId,
              read: $scope.permissionOptionList[index].read,
              write: $scope.permissionOptionList[index].write
            }
          });
        }
        $timeout(() => {
          $scope.role.permissionTags.forEach((tag, permissionIndex) => {
            if (!tag.value.write) {
              let tagElem = angular.element("ul.tag-list > li")[permissionIndex];
              tagElem.classList.remove("tag-item");
              tagElem.classList.add("selected-tag");
            }
          });
        }, 200);
      }, 200);
    };

    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.addEditRole = function(ev) {
      console.log($scope.role.name, $scope.role.comment, $scope.role.permissionTags);

      let payload = {
        config: {
          name: $scope.role.name,
          comment: $scope.role.comment,
          permissions: $scope.role.permissionTags.map(permissionTag => permissionTag.value)
        }
      };

      let okMsg = "";
      let ngMsg = "";

      const writeRole = function(payload) {
        if ($scope.isEdit) {
          okMsg = $translate.instant("role.msg.UPDATE_OK");
          ngMsg = $translate.instant("role.msg.UPDATE_NG");
          return RolesService.updateRole(payload);
        } else {
          okMsg = $translate.instant("role.msg.INSERT_OK");
          ngMsg = $translate.instant("role.msg.INSERT_NG");
          return RolesService.addRole(payload);
        }
      }

      writeRole(payload)
      .then(res => {
        Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
        Alertify.success(okMsg);
      })
      .catch(err => {
        console.warn(err);
        if (USER_TIMEOUT.indexOf(err.status) < 0) {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.error(
            Utils.getAlertifyMsg(err, ngMsg, false)
          );
        }
      });

      $mdDialog.hide();
    };
  }
})();
