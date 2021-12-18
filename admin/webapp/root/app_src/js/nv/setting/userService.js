(function() {
  "use strict";
  angular
    .module("app.login")
    .factory("UserFactory", function(
      $translate,
      $sanitize,
      Utils
    ) {
      let UserFactory = {};
      let gridOptions4NamespaceRole = null;
      const admin = $translate.instant("enum.ADMIN");
      const reader = $translate.instant("enum.READER");
      const ciops = $translate.instant("enum.CIOPS");
      const none = $translate.instant("enum.NONE");
      const fedAdmin = $translate.instant("enum.FEDADMIN");

      UserFactory.getNamespaceRoleGridData = function(domainRoleOptions, globalRole, domainRoles) {
        if (domainRoles) {
          let roleMap = Object.entries(domainRoles).map(([key, value]) => {
            return {
              domainRole: key,
              namespaces: value
            }
          });
          return domainRoleOptions.map(domainRoleOption => {
            let roleIndex = roleMap.findIndex(role => {return role.domainRole === domainRoleOption.id});
            if (roleIndex > -1) {
              return roleMap[roleIndex];
            } else {
              return {
                domainRole: domainRoleOption.id,
                namespaces: []
              };
            }
          }).filter(role => role.domainRole !== globalRole);
        } else {
          return domainRoleOptions.map(domainRoleOption => {
            return {
              domainRole: domainRoleOption.id,
              namespaces: []
            };
          }).filter(role => role.domainRole !== globalRole);
        }
      }

      UserFactory.getRoleMap = function(namespaceRoles) {
        let roleMap = {};
        namespaceRoles.forEach(namespaceRole => {
          roleMap[namespaceRole.domainRole] = namespaceRole.namespaces;
        });
        return roleMap;
      }

      UserFactory.getHasSetAuthorized = function(user) {
        let res = false;
        res = res || user.role !== "";
        Object.values(user.role_domains).forEach(namespaces => {
          res = res || namespaces.length > 0;
        });
        return res;
      };

      UserFactory.parseRole = function(role) {
        switch (role) {
          case "fedAdmin":
            return role;
          case "admin":
            return role;
          case "reader":
            return role;
          case "ciops":
            return role;
          case "":
            return "none";
          default:
            return role;
        }
      }

      UserFactory.setGrids = function() {
        const namespaceRoleColumnDefs = [
          {
            headerName: $translate.instant("user.namespaceRoleGrid.NAMESPACE_ROLE"),
            field: "domainRole",
            cellRenderer: (params) => {
              if (params && params.value) {
                return $sanitize(UserFactory.parseRole(params.value));
              }
            },
            icons: {
              sortAscending: '<em class="fa fa-sort-alpha-asc"></em>',
              sortDescending: '<em class="fa fa-sort-alpha-desc"></em>'
            },
            width: 100
          },
          {
            headerName: $translate.instant("user.namespaceRoleGrid.NAMESPACES"),
            field: "namespaces",
            cellRenderer: function(params) {
              if (params && params.value) {
                console.log(params.value)
                return params.value.map(namespace => {
                  return (
                    `<span class="mr-sm pull-left label label-info" style="display: inline-block">${$sanitize(namespace)}</span>`
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

        UserFactory.getGridOptions4NamespaceRole = function() {
          if (!gridOptions4NamespaceRole) return Utils.createGridOptions(namespaceRoleColumnDefs);
          else return gridOptions4NamespaceRole;
        };

        UserFactory.createFilter = function(query) {
          let lowercaseQuery = angular.lowercase(query);
          return function filterFn(criteria) {
            return (criteria.toLowerCase().indexOf(lowercaseQuery) >= 0);
          };
        }
      };

      return UserFactory;
    });
})();
