(function() {
  "use strict";
  angular
    .module("app.login")
    .factory("RolesService", function RolesService(
      $rootScope,
      $http,
      $translate,
      $sanitize,
      Utils
    ) {
      RolesService.getPermissionOptions = function() {
        return $http.get(PERMISSION_OPTIONS);
      };
      RolesService.getRoles = function(name) {
        return $http.get(ROLES, {params: {name: name}});
      };
      RolesService.addRole = function(payload) {
        return $http.post(ROLES, payload);
      };
      RolesService.updateRole = function(payload) {
        return $http.patch(ROLES, payload);
      }
      RolesService.removeRole = function(name) {
        return $http.delete(ROLES, {params: {name: name}});
      }
      RolesService.getIndex =  function(array, name) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].name === name) return i;
        }
      },
      RolesService.permissionOptions = [];
      RolesService.setGrid = function(isWriteRolesAuthorized) {
        const columnDefs = [
            {
                headerName: $translate.instant("role.gridHeader.ROLE_NAME"),
                field: "name",
                cellRenderer: (params) => {
                  if (params) {
                    return $sanitize(params.value === "" ? "none" : params.value);
                  }
                },
                width: 80,
                minWidth: 80
            },
            {
                headerName: $translate.instant("role.gridHeader.COMMENT"),
                field: "comment",
                width: 120,
                minWidth: 120
            },
            {
                headerName: $translate.instant("role.gridHeader.PERMISSIONS"),
                field: "permissions",
                cellRenderer: (params) => {
                  if (params && params.value) {
                    return params.value.map((permission) => {
                      return `<span class="label ${permission.write ? "modify-permission" : "view-permission"} mr-sm" style="display: inline-block;">
                          ${$translate.instant(`role.permissions.${$sanitize(permission.id.toUpperCase())}`)} (${permission.write ? "M" : "V"})
                        </span>`;
                    }).join("");
                  }
                },
                width: 350,
                minWidth: 350
            },
            {
                cellClass: "grid-right-align",
                suppressSorting: true,
                cellRenderer: function(params) {
                    if (params && !params.data.reserved) {
                        return (
                          '<div class="rule-actions-expand fade-in-right">' +
                          '       <em class="fa fa-edit fa-lg mr-sm text-action"' +
                          '         ng-click="editRole(data)" uib-tooltip="{{\'role.EDIT\' | translate}}">' +
                          "       </em>" +
                          '       <em class="fa fa-trash fa-lg mr-sm text-action" id="remove-form-action"' +
                          '         ng-click="removeRole(data)" uib-tooltip="{{\'role.REMOVE\' | translate}}">' +
                          "       </em>" +
                          "     </div>" +
                          '     <div class="rule-actions-collapse">' +
                          '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                          "       </em>" +
                          "     </div>"
                        );
                    }
                },
                hide: !isWriteRolesAuthorized,
                width: 60,
                minWidth: 60,
                maxWidth: 60
            }
        ];

        let grid = {
            gridOptions: Utils.createGridOptions(columnDefs)
            // gridOptions4Permissions: Utils.createGridOptions(columnDefs4Permissions)
        };
        return grid;
      }
      return RolesService;
    });
})();
