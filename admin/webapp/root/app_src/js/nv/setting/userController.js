(function () {
  "use strict";

  angular.module("app.login").controller("UserController", UserController);

  UserController.$inject = [
    "$scope",
    "$http",
    "$mdDialog",
    "$rootScope",
    "$window",
    "$timeout",
    "$translate",
    "UserFactory",
    "Alertify",
    "Utils",
    "$sanitize",
    "$controller",
    "$state",
    "$q",
    "AuthorizationFactory",
    "PasswordProfileFactory"
  ];
  function UserController(
    $scope,
    $http,
    $mdDialog,
    $rootScope,
    $window,
    $timeout,
    $translate,
    UserFactory,
    Alertify,
    Utils,
    $sanitize,
    $controller,
    $state,
    $q,
    AuthorizationFactory,
    PasswordProfileFactory
  ) {
    const admin = $translate.instant("enum.ADMIN");
    const reader = $translate.instant("enum.READER");
    const ciops = $translate.instant("enum.CIOPS");
    const none = $translate.instant("enum.NONE");
    const fedAdmin = $translate.instant("enum.FEDADMIN");
    const defaultProvider = $translate.instant("partner.general.PROVIDER");
    const KUBE = "kubernetes";
    let getEntityName = function (count) {
      return Utils.getEntityName(
        count,
        $translate.instant("user.COUNT_POSTFIX")
      );
    };
    const found = $translate.instant("enum.FOUND");
    let isKube = $scope.summary.platform.toLowerCase().indexOf(KUBE) !== -1;
    let isFedAdmin = $scope.user.token.role === FED_ROLES.FEDADMIN;

    // $scope.roles = [
    //   { id: "admin", name: admin },
    //   { id: "reader", name: reader },
    //   { id: "ciops", name: ciops }
    // ];
    //
    // if (isFedAdmin) {
    //   $scope.roles.unshift({ id: "fedAdmin", name: fedAdmin });
    // }
    //

    const roleToName = {
      none: none,
      fedAdmin: fedAdmin,
      admin: admin,
      reader: reader,
      ciops: ciops,
    };

    const resource = {
      addUser: {
        global: 2,
        namespace: 2,
      },
      userAction: {
        global: 2,
        namespace: 2,
      },
      removeUser: {
        global: 2,
        namespace: 2,
      },
    };

    $scope.isAuthoredUserWrite = AuthorizationFactory.getDisplayFlag(
      "write_users"
    );
    $scope.isUpdatePasswordProfileAuthorized =
      AuthorizationFactory.getDisplayFlagByMultiPermission("update_password_profile");

    const isNamespaceOnlyUser = function (roles) {
      for (let range in roles) {
        if (range === "global") {
          if (parseInt(roles[range], 10) < 2) return true;
        }
      }
      return false;
    };

    const shouldLimitNamespaceOnlyAdminAccess = isNamespaceOnlyUser(
      $scope.user.roles
    );

    activate();

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    function activate() {
      let resizeEvent = "resize.ag-grid";
      let $win = $($window);

      $scope.getColorCode = function (level) {
        return colourMap[level];
      };

      const iconMap = {
        AUTH: "fa-key",
        ENFORCER: "fa-shield",
        RESTFUL: "fa-gears",
        CONTROLLER: "fa-magic",
        WORKLOAD: "fa-cube",
        LICENSE: "fa-gavel",
        SCANNER: "fa-files-o",
        INCIDENT: "fa-bell",
      };

      $scope.getIconCode = function (category) {
        return iconMap[category];
      };

      $scope.selectedUser = {};

      let headerClass = $scope.isAuthoredUserWrite ? "" : "grid-center-align";

      let columnDefs = [
        {
          headerName: $translate.instant("user.gridHeader.USER"),
          headerCheckboxSelection: true,
          resizable: true,
          checkboxSelection: true,
          cellRenderer: function (params) {
            return (
              '<img src="https://secure.gravatar.com/avatar/' +
              $sanitize(params.data.emailHash) +
              "?s=34&d=" +
              "https%3A%2F%2Fui-avatars.com%2Fapi%2F/" +
              $sanitize(params.data.username) +
              "/32/" +
              Utils.stringToColour(params.data.username) +
              "/fff" +
              '" class="img-thumbnail img-circle ' +
              $sanitize(
                (params.data.fullname === "admin" && $scope.isAuthoredUserWrite)
                  ? "left-margin-32"
                  : ""
              ) +
              '"/>'
            );
          },
          suppressSorting: true,
          cellClass: headerClass,
          width: 85,
          minWidth: 78,
          maxWidth: 100,
        },
        {
          headerName: $translate.instant("user.gridHeader.USER_NAME"),
          field: "username",
          editable: false,
          cellRenderer: (params) => {
            if (params && params.value && params.data) {
              let html1 = `<div>${$translate.instant("user.gridHeader.PWD_EXPIRED")}</div>`;
              let html2 = `<div>${$translate.instant("user.gridHeader.BLOCKED")}</div>`;
              // return `<span>
              //   ${params.value}
              //   <em ng-if="${params.data.blocked_for_password_expired}" class="fa fa-exclamation-circle text-warning"  uib-tooltip-html="'${html1}'" tooltip-class="userStatusClass"></em>
              //   <em ng-if="${params.data.blocked_for_failed_login}" class="fa fa-exclamation-circle text-warning"  uib-tooltip-html="'${html2}'" tooltip-class="userStatusClass"></em>
              // </span>`;
              return `<span>
                ${$sanitize(params.value)}
                <span ng-if="${params.data.blocked_for_password_expired}" class="label label-danger">${$translate.instant("user.gridHeader.PWD_EXPIRED")}</span>
                <span ng-if="${params.data.blocked_for_failed_login}" class="label label-danger">${$translate.instant("user.gridHeader.BLOCKED")}</span>
              </span>`;
            }
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>',
          },
          width: 130,
        },
        {
          headerName: $translate.instant("user.gridHeader.ROLE"),
          field: "role",
          width: 100,
        },
        {
          headerName: $translate.instant("user.gridHeader.IDENTITY_PROVIDER"),
          field: "server",
          cellRenderer: function (params) {
            const server = params.data.server;
            let result = "";
            if (server) {
              if (server.toLowerCase().includes(SERVER_TYPE.LDAP)) {
                result = AUTH_PROVIDER.LDAP;
              }
              if (server.toLowerCase().includes(SERVER_TYPE.OPENID)) {
                result = AUTH_PROVIDER.OPENID;
              }
              if (server.toLowerCase().includes(SERVER_TYPE.SAML)) {
                result = AUTH_PROVIDER.SAML;
              }
              if (server.toLowerCase().includes(SERVER_TYPE.OPENSHIFT)) {
                result = AUTH_PROVIDER.OPENSHIFT;
              }
              if (server.toLowerCase().includes(SERVER_TYPE.RANCHER)) {
                result = AUTH_PROVIDER.RANCHER;
              }
            } else {
              result = defaultProvider;
            }
            return result;
          },
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>',
          },
          width: 100,
        },
        // {
        //   headerName: $translate.instant("user.gridHeader.ADMIN_NS"),
        //   field: "role_domains.admin",
        //   hide: true
        // },
        // {
        //   headerName: $translate.instant("user.gridHeader.READER_NS"),
        //   field: "role_domains.reader",
        //   hide: true
        // },
        {
          headerName: $translate.instant("user.gridHeader.EMAIL"),
          field: "email",
          icons: {
            sortAscending: '<em class="fa fa-sort-alpha-asc"/>',
            sortDescending: '<em class="fa fa-sort-alpha-desc"/>',
          },
        },
        {
          headerName: $translate.instant("user.gridHeader.ACTION"),
          cellRenderer: actionRenderFunc,
          cellClass: "grid-right-align",
          suppressSorting: true,
          width: 100,
        },
      ];

      function editUser(ev, data) {
        Utils.keepAlive();
        $mdDialog
          .show({
            locals: {
              user: data,
              isKube: isKube,
              isFedAdmin: isFedAdmin,
              shouldLimitNamespaceOnlyAdminAccess: shouldLimitNamespaceOnlyAdminAccess,
              refresh: refresh,
              roles: $scope.roles,
              domainRoles: $scope.domainRoles,
              isReadOnly: false,
              namespaces: $scope.namespaces,
            },
            controller: EditUserDialogController,
            templateUrl: "dialog.editUser.html",
            targetEvent: ev,
          })
          .then(
            function () {
              refresh();
            },
            function () {}
          );
      }

      function viewUser(ev, data) {
        Utils.keepAlive();
        $mdDialog
          .show({
            locals: {
              user: data,
              isKube: isKube,
              isFedAdmin: isFedAdmin,
              shouldLimitNamespaceOnlyAdminAccess: shouldLimitNamespaceOnlyAdminAccess,
              refresh: refresh,
              roles: $scope.roles,
              domainRoles: $scope.domainRoles,
              isReadOnly: true,
              namespaces: $scope.namespaces,
            },
            controller: EditUserDialogController,
            templateUrl: "dialog.editUser.html",
            targetEvent: ev,
          })
          .then(
            function () {
              refresh();
            },
            function () {}
          );
      }

      function roleFormatter(params) {
        return roleToName[params.value];
      }

      function actionRenderFunc(params) {
        params.$scope.editUser = editUser;
        params.$scope.viewUser = viewUser;
        let result = "";

        if ($scope.isAuthoredUserWrite && !$rootScope.isRemote) {
          result =
            `<span class='mr-lg'>
              <em class="fa fa-lg fa-magic text-action mr-sm" ng-if="isUpdatePasswordProfileAuthorized && data.blocked_for_password_expired"
                uib-tooltip="${$translate.instant("user.tooltips.RESET_PASSWORD")}" ng-click="resetPassword(data.username)">
              </em>
              <em class="fa fa-lg fa-unlock-alt text-action mr-sm" ng-if="isUpdatePasswordProfileAuthorized && data.blocked_for_failed_login"
                uib-tooltip="${$translate.instant("user.tooltips.UNLOCK")}" ng-click="unlockUser(data.username)">
              </em>
              <em class="fa fa-lg fa-trash mr-sm text-action"
                ng-show=\"!(data.fullname === 'admin')\"
                uib-tooltip="${$translate.instant("user.tooltips.REMOVE")}" ng-click=\"!(data.fullname === 'admin') && removeUser(data)\">
              </em>
              <em class="fa fa-lg fa-edit text-action"
                uib-tooltip="${$translate.instant("user.tooltips.EDIT")}" ng-click="editUser($event, data)">
              </em>
             </span>`;
        } else {
          result =
            `<span class='mr-lg'>
              <em class="fa fa-lg fa-newspaper-o text-action"
                uib-tooltip="${$translate.instant("user.tooltips.VIEW")}" ng-click="viewUser($event, data)">
              </em>
            </span>`;
        }
        return result;
      }

      $scope.gridOptions = {
        headerHeight: 30,
        rowHeight: 40,
        enableSorting: true,
        enableColResize: true,
        angularCompileRows: true,
        suppressDragLeaveHidesColumns: true,
        columnDefs: columnDefs,
        rowData: null,
        editType: "fullRow",
        animateRows: true,
        rowSelection: "multiple",
        rowMultiSelectWithClick: true,
        suppressRowClickSelection: true,
        isRowSelectable: function (node) {
          return node.data
            ? node.data.fullname !== "admin" && $scope.isAuthoredUserWrite
            : false;
        },
        onSelectionChanged: onSelectionChanged,
        onCellClicked: (e) => {
          getEventsByUser(e.node.data.fullname);
        },
        onGridReady: function (params) {
          $timeout(function () {
            params.api.sizeColumnsToFit();
          }, 50);
          $win.on(resizeEvent, function () {
            $timeout(function () {
              params.api.sizeColumnsToFit();
            }, 100);
          });
        },
      };

      $scope.unlockUser = function(username) {
        Alertify.confirm(
          $translate.instant("passwordProfile.loginFailureAllowance.UNLOCK_WARNING")
        ).then(
          function onOk() {
            PasswordProfileFactory.clearUserBlock(username)
            .then((res) => {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.success($translate.instant("passwordProfile.msg.UNLOCK_USER_OK"));
              $timeout(() => {
                refresh();
              }, 1000);
            })
            .catch((err) => {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  err,
                  $translate.instant("passwordProfile.msg.UNLOCK_USER_NG"),
                  false
                )
              );
            })
            .finally(() => {
              vm.unlock_user = "";
              document.getElementById("unlock-user").click();
            });
          },
          function onCancel() {}
        );
      };

      $scope.onFilterChanged = function (value) {
        $scope.gridOptions.api.deselectAll();
        let filteredUsers = [];
        $scope.users.forEach(function (user) {
          let regex = null;
          if (value && value.length > 0) {
            regex = new RegExp("^.*" + value.toLowerCase() + ".*$");
          } else {
            regex = new RegExp(".*");
          }
          let filterableValue =
            user.fullname +
            " " +
            UserFactory.parseRole(user.role) +
            " " +
            user.email;
          if (regex.test(filterableValue.toLowerCase())) {
            filteredUsers.push(user);
          }
        });
        $scope.gridOptions.api.setRowData(filteredUsers);
        $scope.count =
          filteredUsers === $scope.users.length || value === "" || !value
            ? `${$scope.users.length} ${getEntityName($scope.users.length)}`
            : `${found} ${filteredUsers.length} / ${
                $scope.users.length
              } ${getEntityName($scope.users.length)}`;
      };

      function getEventsByUser(username) {
        $scope.eventErr = false;
        $http
          .get(EVENT_URL, { params: { start: 0, limit: 1000 } })
          .then(function (response) {
            let events = response.data.events.filter(function (event) {
              return event.user === username;
            });
            $scope.events = events.slice(0, 4);
          })
          .catch(function (err) {
            $scope.eventErr = true;
            $scope.eventErrMsg = Utils.getAlertifyMsg(
              err,
              $translate.instant("user.USER_EVENT_ERR"),
              false
            );
            console.warn(err);
          });
      }

      function onSelectionChanged() {
        $scope.removable = $scope.gridOptions.api.getSelectedRows().length > 0;
        $scope.gridOptions.api.sizeColumnsToFit();
        $scope.$apply();
      }

      function refresh() {
        $scope.userErr = false;
        $scope.removable = false;
        Promise.all([
          $http.get(USERS_URL),
          $http.get(DOMAIN_URL)
        ])
        .then(([usersRes, domainRes]) => {
          $scope.gridOptions.overlayNoRowsTemplate = $translate.instant(
            "general.NO_ROWS"
          );
          $scope.users = usersRes.data.users;
          $scope.count = `${$scope.users.length} ${getEntityName(
            $scope.users.length
          )}`;
          if (!AuthorizationFactory.userPermission.isNamespaceUser) {
            $scope.roles = usersRes.data.global_roles;
          } else {
            $scope.roles = [""];
          }
          $scope.roles = $scope.roles.map((role) => {
            let roleName = "";
            return { id: role, name: UserFactory.parseRole(role) };
          });
          if (!isKube) {
            let indexOfNone = $scope.roles.findIndex(
              (role) => role.id === ""
            );
            $scope.roles.splice(indexOfNone, 1);
          }
          if (usersRes.data.domain_roles) {
            $scope.domainRoles = usersRes.data.domain_roles;
            $scope.domainRoles = $scope.domainRoles.map((role) => {
              let roleName = "";
              return { id: role, name: UserFactory.parseRole(role) };
            });
          } else {
            $scope.domainRoles = [];
          }
          setTimeout(function () {
            $scope.gridOptions.api.setRowData($scope.users);
            $scope.gridOptions.api.forEachNode(function (node, index) {
              if (
                $scope.selectedUser &&
                !angular.equals($scope.selectedUser, {})
              ) {
                if (node.data.username === $scope.selectedUser.username) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node);
                }
              } else if (index === 0) {
                  node.setSelected(true);
                  $scope.gridOptions.api.ensureNodeVisible(node);
              }
            });
            $scope.gridOptions.api.sizeColumnsToFit();
          }, 500);

          const resourceList = ["_images", "_nodes", "_containers"];
          $scope.namespaces = domainRes.data.domains
            .filter((domain) => !resourceList.includes(domain.name))
            .map((domain) => domain.name);
          if (
            $scope.namespaces.length === 0 &&
            Object.keys($rootScope.namespaces4NamespaceUser).includes(
              "authorization_w"
            )
          ) {
            $scope.namespaces =
              $rootScope.namespaces4NamespaceUser["authorization_w"];
          }
        })
        .catch((err) => {
          console.warn(err);
          $scope.userErr = true;
          $scope.gridOptions.overlayNoRowsTemplate = Utils.getOverlayTemplateMsg(
            err
          );
          $scope.gridOptions.api.setRowData();
          $scope.namespaces = [];
        });
      }

      refresh();

      $scope.reset = function () {
        $scope.gridOptions.api.stopEditing();
        refresh();
        $scope.onEdit = false;
      };

      function refreshProfile(profile) {
        let token = JSON.parse($window.sessionStorage.getItem("token"));
        if (token.token.username === profile.token.username) {
          token.token.email = profile.token.email;
          token.emailHash = profile.emailHash;
          $window.sessionStorage.setItem("token", JSON.stringify(token));
          $rootScope.user = token;
        }
      }

      $scope.removeUsers = function () {
        let selectedRows = $scope.gridOptions.api.getSelectedRows();

        if (selectedRows.length > 0) {
          let confirmMessage =
            selectedRows.length > 1
              ? $translate.instant("user.deleteUser.group_prompt", {
                  count: selectedRows.length,
                })
              : $translate.instant("user.deleteUser.prompt", {
                  username: selectedRows[0].username,
                });
          Alertify.confirm(confirmMessage).then(function () {
            let promises = [];
            selectedRows.forEach((item) => {
              promises.push(
                $http.delete(USERS_URL, { params: { userId: item.fullname } })
              );
            });

            $q.all(promises)
              .then(function (response) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.success($translate.instant("user.REMOVE_USER_OK"));
                refresh();
              })
              .catch(function (error) {
                if (USER_TIMEOUT.indexOf(error.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      error,
                      $translate.instant("user.REMOVE_USER_ERR"),
                      false
                    )
                  );
                }
              });
          });
        }
      };

      $scope.removeUser = function (user) {
        Alertify.confirm(
          $translate.instant("user.deleteUser.prompt", {
            username: $sanitize(user.username),
          })
        ).then(function () {
          $http
            .delete(USERS_URL, { params: { userId: user.fullname } })
            .success(function () {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.success($translate.instant("user.REMOVE_USER_OK"));
              refresh();
            })
            .catch(function (error) {
              console.warn(error);
              if (USER_TIMEOUT.indexOf(error.status) < 0) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.error(
                  Utils.getAlertifyMsg(
                    error,
                    $translate.instant("user.REMOVE_USER_ERR"),
                    false
                  )
                );
              }
            });
        });
      };

      const getPublicPasswordProfile = function(cb) {
        PasswordProfileFactory.getPublicPasswordProfileData()
        .then((res) => {
          let passwordProfile = res.data.pwd_profile;
          cb(passwordProfile);
        })
        .catch((err) => {
          let passwordProfile = {
            min_len: 0,
            min_uppercase_count: 0,
            min_lowercase_count: 0,
            min_digit_count: 0,
            min_special_count: 0
          }
          cb(passwordProfile);
        });
      };

      $scope.resetPassword = function(username) {
        Utils.keepAlive();
        const openResetPasswordDialog = function(passwordProfile) {
          $mdDialog
            .show({
              locals: {
                username: username,
                passwordProfile: passwordProfile
              },
              controller: ResetPasswordDialogController,
              templateUrl: "dialog.resetPassword.html",
            })
            .then(
              function () {
                $timeout(() => {
                  refresh();
                }, 1000);
              },
              function () {}
            );
        };
        getPublicPasswordProfile(openResetPasswordDialog);
      };

      $scope.addUser = function (ev) {
        const openAddUserDialog = function(passwordProfile) {
          $mdDialog
            .show({
              locals: {
                isKube: isKube,
                isFedAdmin: isFedAdmin,
                shouldLimitNamespaceOnlyAdminAccess: shouldLimitNamespaceOnlyAdminAccess,
                roles: $scope.roles,
                domainRoles: $scope.domainRoles,
                namespaces: $scope.namespaces,
                passwordProfile: passwordProfile
              },
              controller: AddUserDialogController,
              templateUrl: "dialog.addUser.html",
              targetEvent: ev,
            })
            .then(
              function () {
                refresh();
              },
              function () {}
            );
        };
        Utils.keepAlive();
        getPublicPasswordProfile(openAddUserDialog);
      };
    }

    AddUserDialogController.$inject = [
      "$scope",
      "$http",
      "$mdDialog",
      "$rootScope",
      "$translate",
      "UserFactory",
      "isKube",
      "shouldLimitNamespaceOnlyAdminAccess",
      "roles",
      "domainRoles",
      "namespaces",
      "passwordProfile"
    ];
    function AddUserDialogController(
      $scope,
      $http,
      $mdDialog,
      $rootScope,
      $translate,
      UserFactory,
      isKube,
      shouldLimitNamespaceOnlyAdminAccess,
      roles,
      domainRoles,
      namespaces,
      passwordProfile
    ) {
      activate();

      function activate() {
        $scope.singleDomain = {
          value: "",
          index: -1
        };
        $scope.isKube = isKube;
        $scope.isFedAdmin = isFedAdmin;
        $scope.shouldLimitNamespaceOnlyAdminAccess = shouldLimitNamespaceOnlyAdminAccess;
        $scope.advSettingText = $translate.instant("user.SHOW_ADV_SETTING");
        $scope.showAdvSetting = false;
        $scope.roles = roles;
        $scope.domainRoles = domainRoles;
        $scope.namespaceRoleGirdOptions = UserFactory.setGrids();
        $scope.roles = roles;
        $scope.domainRoles = domainRoles;

        $scope.isReachingMinLength = false;
        $scope.isReachingMinUpper = false;
        $scope.isReachingMinLower = false;
        $scope.isReachingMinDigit = false;
        $scope.isReachingMinSpChar = false;

        const preparePasswordChecklist = function() {
          $scope.minLengthTxt = $translate.instant("user.passwordRequirement.MIN_LENGTH", {minLength: $scope.passwordProfile.min_len});
          $scope.minUpperTxt = $translate.instant("user.passwordRequirement.MIN_UPPER", {minUpper: $scope.passwordProfile.min_uppercase_count});
          $scope.minLowerTxt = $translate.instant("user.passwordRequirement.MIN_LOWER", {minLower: $scope.passwordProfile.min_lowercase_count});
          $scope.minDigitTxt = $translate.instant("user.passwordRequirement.MIN_DIGIT", {minDigit: $scope.passwordProfile.min_digit_count});
          $scope.minSpCharTxt = $translate.instant("user.passwordRequirement.MIN_SP_CHAR", {minSpChar: $scope.passwordProfile.min_special_count});
        };

        $scope.passwordProfile = passwordProfile;
        preparePasswordChecklist();

        $scope.checkPassword = function(password) {
          $scope.isReachingMinLength = password && password.length >= $scope.passwordProfile.min_len;
          $scope.isCharReqValid = PasswordProfileFactory.checkPassword(password, $scope.passwordProfile);
          $scope.isPasswordValid =
            $scope.isReachingMinLength &&
            $scope.isCharReqValid.isReachingMinUpper &&
            $scope.isCharReqValid.isReachingMinLower &&
            $scope.isCharReqValid.isReachingMinDigit &&
            $scope.isCharReqValid.isReachingMinSpChar;
        };

        UserFactory.setGrids();
        $scope.domainOptions4SingleDomainEditor = namespaces;
        $scope.loadTags = function (query) {
          let list = namespaces;
          return query ? list.filter(UserFactory.createFilter(query)) : [];
        };
        const onRoleMapRowChanged = function () {
          $scope.isShowingEditDomain = false;
          let selectedRow = $scope.namespaceRoleGirdOptions.api.getSelectedRows()[0];
          $scope.roleName = UserFactory.parseRole(selectedRow.domainRole);
          $scope.roleId = selectedRow.domainRole;
          $scope.namespaceRoleHint = $translate.instant(
            "user.addUser.NS_ROLE_HINT",
            { role: $scope.roleName }
          );
          $scope.namespaces = selectedRow.namespaces.map((namespace, index) => {
            return { name: namespace, index: index };
          });
          $scope.$apply();
        };
        $scope.namespaceRoleGirdOptions = UserFactory.getGridOptions4NamespaceRole();
        $scope.namespaceRoleGridData = UserFactory.getNamespaceRoleGridData(
          $scope.domainRoles
        );
        $scope.namespaceRoleGirdOptions.onSelectionChanged = onRoleMapRowChanged;
        $timeout(() => {
          $scope.namespaceRoleGirdOptions.api.setRowData(
            $scope.namespaceRoleGridData
          );
          $timeout(() => {
            $scope.namespaceRoleGirdOptions.api.sizeColumnsToFit();
            if ($scope.domainRoles.length > 0) {
              $scope.namespaceRoleGirdOptions.api
                .getRowNode(0)
                .setSelected(true);
            }
          }, 200);
        }, 200);

        $scope.changeRole = function () {
          $scope.namespaceRoleGridData = UserFactory.getNamespaceRoleGridData(
            $scope.domainRoles,
            $scope.user.role,
            $scope.user.role_domains
          );
          $scope.namespaceRoleGirdOptions.api.setRowData(
            $scope.namespaceRoleGridData
          );
          $timeout(() => {
            $scope.namespaceRoleGirdOptions.api.sizeColumnsToFit();
            if ($scope.domainRoles.length > 0) {
              $scope.namespaceRoleGirdOptions.api
                .getRowNode(0)
                .setSelected(true);
            }
          }, 200);
        };

        const initializeTagStyle = function() {
          let allTagsElem = angular.element("ul.tag-list > li");
          for (let i = 0; i < allTagsElem.length; i++) {
            allTagsElem[i].classList.remove("selected-tag");
            allTagsElem[i].classList.add("tag-item");
          }
        };

        const initializeSpecificTagStyle = function(insertIndex) {
          let elem = angular.element("ul.tag-list > li")[insertIndex];
          elem.classList.remove("selected-tag");
          elem.classList.add("tag-item");
        };

        const setFocusedTagStyle = function(focusedIndex) {
          let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
          tagElem.classList.remove("tag-item");
          tagElem.classList.add("selected-tag");
        };

        $scope.checkDuplicated = function() {
          let elem = angular.element("#tagEditor");
          if ($scope.namespaces) {
            for (let i = 0; i < $scope.namespaces.length; i++) {
              if (
                $scope.singleDomain.value === $scope.namespaces[i].name &&
                $scope.singleDomain.index !== $scope.namespaces[i].index
              ) {
                elem[0].classList.remove("ng-valid");
                elem[0].classList.add("ng-invalid");
                $scope.isInvalidTag = true;
                return;
              }
            }
          }
          elem[0].classList.remove("ng-invalid");
          elem[0].classList.add("ng-valid");
          $scope.isInvalidTag = false;
        };

        $scope.preventFormSubmit = function(event) {
          if (event.which === 13) {
            event.preventDefault();
            $scope.editDomain($scope.singleDomain);
          }
        };

        $scope.editDomain = function(singleDomain) {
          if (!$scope.namespaces)  $scope.namespaces = [];
          let insertIndex = singleDomain.index === -1 ? $scope.namespaces.length : singleDomain.index;
          let insertOrReplace = singleDomain.index === -1 ? 0 : 1;
          console.log("singleDomain.value: ", singleDomain.value);
          $scope.namespaces.splice(insertIndex, insertOrReplace, {
            name: singleDomain.value,
            index: insertIndex
          });
          $scope.singleDomain = {
            value: "",
            index: -1
          };
          $scope.isShowingEditDomain = false;
          initializeSpecificTagStyle(insertIndex);
          changeTag();
        };

        $scope.showTagDetail = function(tag) {
          initializeTagStyle();
          setFocusedTagStyle(tag.index);
          $scope.singleDomain.value = tag.name;
          $scope.singleDomain.index = tag.index;
          $scope.isShowingEditDomain = true;
          $scope.isInvalidTag = false;
          $timeout(() => {
            let tagEditorElem = angular.element("#tagEditor");
            tagEditorElem.focus();
          }, 200);
        };

        $scope.tagRemoving = function(tag) {
          $scope.namespaces.forEach(filter => {
            if (tag.index < filter.index) {
              filter.index -= 1;
            }
          });
          $timeout(() => {
            if (!$scope.namespaces)  $scope.namespaces = [];
            $scope.isShowingEditDomain = false;
            initializeTagStyle();
          }, 200);
        };

        const changeTag = function() {
          let roleNamespaceRow = {
            domainRole: $scope.roleId,
            namespaces: $scope.namespaces.map((namespace) => namespace.name),
          };
          console.log("roleNamespaceRow: ", roleNamespaceRow);
          let updateNamespaceIndex = $scope.namespaceRoleGridData.findIndex(
            (row) => {
              return row.domainRole === $scope.roleId;
            }
          );
          $scope.namespaceRoleGridData.splice(
            updateNamespaceIndex,
            1,
            roleNamespaceRow
          );
          $scope.namespaceRoleGirdOptions.api.setRowData(
            $scope.namespaceRoleGridData
          );
          $scope.user.role_domains = UserFactory.getRoleMap(
            $scope.namespaceRoleGridData
          );
          console.log($scope.namespaceRoleGridData);
          $timeout(() => {
            $scope.namespaceRoleGirdOptions.api
              .getRowNode(updateNamespaceIndex)
              .setSelected(true);
          }, 200);
        };

        $scope.tagChanging = function ($tag) {
          $timeout(() => {
            changeTag();
          }, 200);
        };

        $scope.language = $rootScope.language;

        $scope.hide = function () {
          $mdDialog.hide();
        };

        $scope.cancel = function () {
          $mdDialog.cancel();
        };

        $scope.toggleAdvSetting = function () {
          if ($scope.showAdvSetting) {
            $scope.advSettingText = $translate.instant("user.SHOW_ADV_SETTING");
            $scope.showAdvSetting = false;
          } else {
            $scope.advSettingText = $translate.instant("user.HIDE_ADV_SETTING");
            $scope.showAdvSetting = true;
          }
          $scope.namespaceRoleGirdOptions.api.sizeColumnsToFit();
        };

        $scope.add = function (user, adminNS, readerNS) {
          let hasSetAuthorized = false;
          user.fullname = user.username;
          user.server = "";
          user.default_password = false;
          user.modify_password = false;
          user.role_domains = {};
          user.role_domains = UserFactory.getRoleMap(
            $scope.namespaceRoleGridData
          );
          if (UserFactory.getHasSetAuthorized(user)) {
            $http
              .post(USERS_URL, user)
              .then(function (response) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.success($translate.instant("user.ADD_USER_OK"));
                $mdDialog.hide();
              })
              .catch(function (err) {
                console.warn(err);
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      err,
                      $translate.instant("user.ADD_USER_ERR"),
                      false
                    )
                  );
                  $scope.passwordProfile = err.data.password_profile_basic || passwordProfile;
                  preparePasswordChecklist();
                  $scope.checkPassword(user.password);
                }
              });
          } else {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error($translate.instant("user.UNAUTHORIZED"));
          }
        };

        function getRoleMap(adminNS, readerNS) {
          let adminMap = [],
            readerMap = [];
          if (adminNS && adminNS.length > 0) {
            adminMap = adminNS.map(function (item) {
              return item.name;
            });
          }
          if (readerNS && readerNS.length > 0) {
            readerMap = readerNS.map(function (item) {
              return item.name;
            });
          }
          return { admin: adminMap, reader: readerMap };
        }
      }
    }

    EditUserDialogController.$inject = [
      "$scope",
      "$http",
      "$mdDialog",
      "$rootScope",
      "$translate",
      "UserFactory",
      "user",
      "isKube",
      "refresh",
      "shouldLimitNamespaceOnlyAdminAccess",
      "roles",
      "domainRoles",
      "isReadOnly",
      "namespaces",
    ];
    function EditUserDialogController(
      $scope,
      $http,
      $mdDialog,
      $rootScope,
      $translate,
      UserFactory,
      user,
      isKube,
      refresh,
      shouldLimitNamespaceOnlyAdminAccess,
      roles,
      domainRoles,
      isReadOnly,
      namespaces
    ) {
      activate();

      function activate() {
        $scope.singleDomain = {
          value: "",
          index: -1
        };
        $scope.isReadOnly = isReadOnly;
        $scope.isKube = isKube;
        $scope.isFedAdmin = isFedAdmin;
        $scope.user = angular.copy(user);
        $scope.advSettingText = $translate.instant("user.SHOW_ADV_SETTING");
        $scope.showAdvSetting = false;
        $scope.roles = roles;
        $scope.domainRoles = domainRoles;
        UserFactory.setGrids();
        $scope.domainOptions4SingleDomainEditor = namespaces;
        $scope.loadTags = function (query) {
          let list = namespaces;
          return query ? list.filter(UserFactory.createFilter(query)) : [];
        };
        const onRoleMapRowChanged = function () {
          $scope.isShowingEditDomain = false;
          let selectedRow = $scope.namespaceRoleGirdOptions.api.getSelectedRows()[0];
          $scope.roleName = UserFactory.parseRole(selectedRow.domainRole);
          $scope.roleId = selectedRow.domainRole;
          $scope.namespaceRoleHint = $translate.instant(
            "user.addUser.NS_ROLE_HINT",
            { role: $scope.roleName }
          );
          $scope.namespaces = selectedRow.namespaces.map((namespace, index) => {
            return { name: namespace, index: index };
          });
          $scope.$apply();
        };
        $scope.namespaceRoleGirdOptions = UserFactory.getGridOptions4NamespaceRole();
        $scope.namespaceRoleGridData = UserFactory.getNamespaceRoleGridData(
          $scope.domainRoles,
          $scope.user.role,
          $scope.user.role_domains
        );
        $scope.namespaceRoleGirdOptions.onSelectionChanged = onRoleMapRowChanged;
        $timeout(() => {
          $scope.namespaceRoleGirdOptions.api.setRowData(
            $scope.namespaceRoleGridData
          );
          $timeout(() => {
            if ($scope.domainRoles.length > 0) {
              $scope.namespaceRoleGirdOptions.api
                .getRowNode(0)
                .setSelected(true);
            }
          }, 200);
        }, 200);

        $scope.changeRole = function () {
          $scope.namespaceRoleGridData = UserFactory.getNamespaceRoleGridData(
            $scope.domainRoles,
            $scope.user.role,
            $scope.user.role_domains
          );
          $scope.namespaceRoleGirdOptions.api.setRowData(
            $scope.namespaceRoleGridData
          );
          $timeout(() => {
            $scope.namespaceRoleGirdOptions.api.sizeColumnsToFit();
            if ($scope.domainRoles.length > 0) {
              $scope.namespaceRoleGirdOptions.api
                .getRowNode(0)
                .setSelected(true);
            }
          }, 200);
        };

        const initializeTagStyle = function() {
          let allTagsElem = angular.element("ul.tag-list > li");
          for (let i = 0; i < allTagsElem.length; i++) {
            allTagsElem[i].classList.remove("selected-tag");
            allTagsElem[i].classList.add("tag-item");
          }
        };

        const initializeSpecificTagStyle = function(insertIndex) {
          let elem = angular.element("ul.tag-list > li")[insertIndex];
          elem.classList.remove("selected-tag");
          elem.classList.add("tag-item");
        };

        const setFocusedTagStyle = function(focusedIndex) {
          let tagElem = angular.element("ul.tag-list > li")[focusedIndex];
          tagElem.classList.remove("tag-item");
          tagElem.classList.add("selected-tag");
        };

        $scope.checkDuplicated = function() {
          let elem = angular.element("#tagEditor");
          if ($scope.namespaces) {
            for (let i = 0; i < $scope.namespaces.length; i++) {
              if (
                $scope.singleDomain.value === $scope.namespaces[i].name &&
                $scope.singleDomain.index !== $scope.namespaces[i].index
              ) {
                elem[0].classList.remove("ng-valid");
                elem[0].classList.add("ng-invalid");
                $scope.isInvalidTag = true;
                return;
              }
            }
          }
          elem[0].classList.remove("ng-invalid");
          elem[0].classList.add("ng-valid");
          $scope.isInvalidTag = false;
        };

        $scope.preventFormSubmit = function(event) {
          if (event.which === 13) {
            event.preventDefault();
            $scope.editDomain($scope.singleDomain);
          }
        };

        $scope.editDomain = function(singleDomain) {
          if (!$scope.namespaces)  $scope.namespaces = [];
          let insertIndex = singleDomain.index === -1 ? $scope.namespaces.length : singleDomain.index;
          let insertOrReplace = singleDomain.index === -1 ? 0 : 1;
          console.log("singleDomain.value: ", singleDomain.value);
          $scope.namespaces.splice(insertIndex, insertOrReplace, {
            name: singleDomain.value,
            index: insertIndex
          });
          $scope.singleDomain = {
            value: "",
            index: -1
          };
          $scope.isShowingEditDomain = false;
          initializeSpecificTagStyle(insertIndex);
          changeTag();
        };

        $scope.showTagDetail = function(tag) {
          initializeTagStyle();
          setFocusedTagStyle(tag.index);
          $scope.singleDomain.value = tag.name;
          $scope.singleDomain.index = tag.index;
          $scope.isShowingEditDomain = true;
          $scope.isInvalidTag = false;
          $timeout(() => {
            let tagEditorElem = angular.element("#tagEditor");
            tagEditorElem.focus();
          }, 200);
        };

        $scope.tagRemoving = function(tag) {
          $scope.namespaces.forEach(filter => {
            if (tag.index < filter.index) {
              filter.index -= 1;
            }
          });
          $timeout(() => {
            if (!$scope.namespaces)  $scope.namespaces = [];
            $scope.isShowingEditDomain = false;
            initializeTagStyle();
          }, 200);
        };

        const changeTag = function() {
          let roleNamespaceRow = {
            domainRole: $scope.roleId,
            namespaces: $scope.namespaces.map((namespace) => namespace.name),
          };
          console.log("roleNamespaceRow: ", roleNamespaceRow);
          let updateNamespaceIndex = $scope.namespaceRoleGridData.findIndex(
            (row) => {
              return row.domainRole === $scope.roleId;
            }
          );
          $scope.namespaceRoleGridData.splice(
            updateNamespaceIndex,
            1,
            roleNamespaceRow
          );
          $scope.namespaceRoleGirdOptions.api.setRowData(
            $scope.namespaceRoleGridData
          );
          $scope.user.role_domains = UserFactory.getRoleMap(
            $scope.namespaceRoleGridData
          );
          console.log($scope.namespaceRoleGridData);
          $timeout(() => {
            $scope.namespaceRoleGirdOptions.api
              .getRowNode(updateNamespaceIndex)
              .setSelected(true);
          }, 200);
        };

        $scope.tagChanging = function ($tag) {
          $timeout(() => {
            changeTag();
          }, 200);
        };

        $scope.isEditAuthorized =
          $scope.user.role !== "fedAdmin" || $scope.isFedAdmin;

        $scope.language = $rootScope.language;

        $scope.hide = function () {
          $mdDialog.hide();
        };

        $scope.cancel = function () {
          $mdDialog.cancel();
        };

        $scope.toggleAdvSetting = function () {
          if ($scope.showAdvSetting) {
            $scope.advSettingText = $translate.instant("user.SHOW_ADV_SETTING");
            $scope.showAdvSetting = false;
          } else {
            $scope.advSettingText = $translate.instant("user.HIDE_ADV_SETTING");
            $scope.showAdvSetting = true;
          }
          $scope.namespaceRoleGirdOptions.api.sizeColumnsToFit();
        };

        $scope.update = function (user) {
          user.role_domains = {};
          user.role_domains = UserFactory.getRoleMap(
            $scope.namespaceRoleGridData
          );
          if (UserFactory.getHasSetAuthorized(user)) {
            $http
              .patch(USERS_URL, user)
              .then(function (response) {
                Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                Alertify.success($translate.instant("user.editUser.SUBMIT_OK"));
                $mdDialog.hide();
              })
              .catch(function (err) {
                console.warn(err);
                $mdDialog.hide();
                if (USER_TIMEOUT.indexOf(err.status) < 0) {
                  Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
                  Alertify.error(
                    Utils.getAlertifyMsg(
                      err,
                      $translate.instant("user.editUser.SUBMIT_NG"),
                      false
                    )
                  );
                }
              });
          } else {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error($translate.instant("user.UNAUTHORIZED"));
            refresh();
          }
        };
      }
    }

    ResetPasswordDialogController.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "PasswordProfileFactory",
      "username",
      "passwordProfile"
    ];
    function ResetPasswordDialogController(
      $scope,
      $mdDialog,
      $translate,
      PasswordProfileFactory,
      username,
      passwordProfile
    ) {

      activate();

      function activate() {
        $scope.hide = function () {
          $mdDialog.hide();
        };

        $scope.cancel = function () {
          $mdDialog.cancel();
        };

        $scope.username = username

        $scope.isReachingMinLength = false;
        $scope.isReachingMinUpper = false;
        $scope.isReachingMinLower = false;
        $scope.isReachingMinDigit = false;
        $scope.isReachingMinSpChar = false;

        $scope.passwordProfile = passwordProfile;

        $scope.minLengthTxt = $translate.instant("user.passwordRequirement.MIN_LENGTH", {minLength: $scope.passwordProfile.min_len});
        $scope.minUpperTxt = $translate.instant("user.passwordRequirement.MIN_UPPER", {minUpper: $scope.passwordProfile.min_uppercase_count});
        $scope.minLowerTxt = $translate.instant("user.passwordRequirement.MIN_LOWER", {minLower: $scope.passwordProfile.min_lowercase_count});
        $scope.minDigitTxt = $translate.instant("user.passwordRequirement.MIN_DIGIT", {minDigit: $scope.passwordProfile.min_digit_count});
        $scope.minSpCharTxt = $translate.instant("user.passwordRequirement.MIN_SP_CHAR", {minSpChar: $scope.passwordProfile.min_special_count});

        $scope.checkPassword = function(password) {
          $scope.isReachingMinLength = password && password.length >= $scope.passwordProfile.min_len;
          $scope.isCharReqValid = PasswordProfileFactory.checkPassword(password, $scope.passwordProfile);
          $scope.isPasswordValid =
            $scope.isReachingMinLength &&
            $scope.isCharReqValid.isReachingMinUpper &&
            $scope.isCharReqValid.isReachingMinLower &&
            $scope.isCharReqValid.isReachingMinDigit &&
            $scope.isCharReqValid.isReachingMinSpChar;
        };
      }

      $scope.resetPassword = function(username, password) {
        PasswordProfileFactory.resetExpiredPassword(username, password)
        .then((res) => {
          Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
          Alertify.success($translate.instant("user.resetPassword.RESET_OK"));
          $mdDialog.hide();
        })
        .catch((err) => {
          console.warn(err);
          $mdDialog.hide();
          if (USER_TIMEOUT.indexOf(err.status) < 0) {
            Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
            Alertify.error(
              Utils.getAlertifyMsg(
                err,
                $translate.instant("user.resetPassword.RESET_NG"),
                false
              )
            );
          }
        });
      };
    }
  }
})();
