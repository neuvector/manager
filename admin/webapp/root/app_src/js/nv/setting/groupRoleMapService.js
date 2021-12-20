(function() {
  "use strict";
  angular
    .module("app.login")
    .factory("GroupRoleMapService", function GroupRoleMapService(
      $rootScope,
      $http,
      $translate,
      $sanitize,
      Utils
    ) {
      GroupRoleMapService.groups = [];
      GroupRoleMapService.moveGroup = function() {

      };
      GroupRoleMapService.addGroup = function(group, order) {

      };
      GroupRoleMapService.editGroup = function(group) {

      };
      GroupRoleMapService.removeGroup = function(group) {

      };
      GroupRoleMapService.setGrid = function(isWriteGroupsAuthorized) {
        console.log("isWriteGroupsAuthorized: ", isWriteGroupsAuthorized);
        const columnDefs4Groups = [
            {
                headerName: $translate.instant("ldap.gridHeader.GROUP"),
                field: "group",
                width: 60,
                minWidth: 40
            },
            {
                headerName: $translate.instant("ldap.gridHeader.GLOBAL_ROLE"),
                field: "global_role",
                width: 100,
                minWidth: 80
            },
            {
                cellClass: "grid-right-align",
                suppressSorting: true,
                cellRenderer: function(params) {
                    if (params && !params.data.reserved) {
                        return (
                          '<div class="rule-actions-expand fade-in-right">' +
                          '       <em class="fa fa-plus-circle fa-lg mr-sm text-action" ' +
                          '         ng-click="addGroup(data.id)" uib-tooltip="{{\'policy.TIP.ADD\' | translate}}">' +
                          "       </em>" +
                          '       <em class="fa fa-edit fa-lg mr-sm text-action"' +
                          '         ng-click="editGroup(data)" uib-tooltip="{{\'role.EDIT\' | translate}}">' +
                          "       </em>" +
                          '       <em class="fa fa-trash fa-lg mr-sm text-action" id="remove-form-action"' +
                          '         ng-click="removeGroup(data)" uib-tooltip="{{\'role.REMOVE\' | translate}}">' +
                          "       </em>" +
                          "     </div>" +
                          '     <div class="rule-actions-collapse">' +
                          '       <em class="fa fa-ellipsis-h fa-lg mr-sm text-action hand">' +
                          "       </em>" +
                          "     </div>"
                        );
                    }
                },
                hide: !isWriteGroupsAuthorized,
                width: 90,
                minWidth: 90,
                maxWidth: 90
            }
        ];

        const columnDefs4DomainRoles = [
            {
                headerName: $translate.instant("ldap.gridHeader.DOMAIN_ROLES"),
                field: "domain_role",
                width: 40,
                minWidth: 40
            },
            {
                headerName: $translate.instant("ldap.gridHeader.DOMAINS"),
                field: "domains",
                width: 120,
                minWidth: 120
            },
        ];

        let grids = {
            gridOptions4Groups: Utils.createGridOptions(columnDefs4Groups),
            gridOptions4DomainRoles: Utils.createGridOptions(columnDefs4DomainRoles)
        };
        return grids;
      };
      GroupRoleMapService.setDialogGrid = function() {
        const columnDefs4DomainRoles = [
            {
                headerName: $translate.instant("ldap.gridHeader.DOMAIN_ROLES"),
                field: "domain_role",
                width: 40,
                minWidth: 40
            },
            {
                headerName: $translate.instant("ldap.gridHeader.DOMAINS"),
                field: "domains",
                cellRenderer: (params) => {
                  if (params && params.value) {
                    return params.value.map(domain => {
                      return `<span style="display: inline-block" class="label label-success mr-sm">${$sanitize(domain)}</span>`;
                    }).join("");
                  }
                },
                width: 200,
                minWidth: 200
            },
        ];
        let grids = {
            gridOptions4DomainRoles: Utils.createGridOptions(columnDefs4DomainRoles)
        };
        return grids;
      };
      return GroupRoleMapService;
    });
})();
