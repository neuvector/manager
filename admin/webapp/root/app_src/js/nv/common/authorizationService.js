(function() {
  "use strict";
  angular
    .module("app.common")
    .factory("AuthorizationFactory", function(
      $rootScope,
      $translate,
      $sanitize,
      Utils
    ) {
      let AuthorizationFactory = {};
      AuthorizationFactory.tokenBakeup = "";
      AuthorizationFactory.userPermission = {
        globalPermissions: null,
        ownedPermissions: null,
        isNamespaceUser: false
      }
      const permissionMap = PERMISSION_MAP;

      const parseGlobalPermission = function(g_permissions) {
        return g_permissions.map(permission => {
          return `${permission.id}_${permission.write ? "w" : permission.read ? "r" : ""}`;
        });
      };

      const parseDomainPermission = function(d_permission) {
        let permissionArray = Object.values(d_permission).flat();
        console.log("permissionArray: ", permissionArray)
        let permissionGroup = Utils.groupBy(permissionArray, "id");
        console.log("permissionGroup: ", permissionGroup)
        let permissionIds = Object.keys(permissionGroup);
        let mergedPermission =  permissionIds.map(permissionId => {
          return permissionGroup[permissionId].reduce((res, curr) => {
            res.id = curr.id;
            res.read = res.read || curr.read;
            res.write = res.write || curr.write;
            return res;
          });
        });
        return mergedPermission.map(perimssion => {
          if (perimssion.write) {
            return `${perimssion.id}_w`;
          } else {
            return `${perimssion.id}_r`;
          }
        });
      };

      const getNamespaces4NamespaceUser = function (d_permission) {
        let namespacesByPermission = {};
        Object.keys(d_permission).forEach(namespace => {
          let permissions = d_permission[namespace];
          permissions.forEach(permission => {
            let permissionKey = `${permission.id}_${permission.write ? "w" : "r"}`
            if (namespacesByPermission[permissionKey]) {
              namespacesByPermission[`${permission.id}_${permission.write ? "w" : "r"}`].push(namespace);
            } else {
              namespacesByPermission[`${permission.id}_${permission.write ? "w" : "r"}`] = [namespace];
            }
          });
        });
        console.log("namespacesByPermission: ", namespacesByPermission);
        return namespacesByPermission;
      };

      const isSubArray = function(arr1, arr2) {
        let res = true;
        arr1.forEach(str => {
          res = res && arr2.indexOf(str) > -1;
        });
        return res;
      };


      const getCacheUserPermission = function() {
        if (!AuthorizationFactory.userPermission.ownedPermissions || AuthorizationFactory.tokenBakeup !== $rootScope.user.token.token) {
          let globalPermissions = parseGlobalPermission($rootScope.user.global_permissions);
          let domainPermissions = parseDomainPermission($rootScope.user.domain_permissions);
          $rootScope.namespaces4NamespaceUser = getNamespaces4NamespaceUser($rootScope.user.domain_permissions);
          AuthorizationFactory.userPermission.isNamespaceUser = globalPermissions.length === 0 && domainPermissions.length > 0;
          AuthorizationFactory.userPermission.globalPermissions = globalPermissions;
          AuthorizationFactory.userPermission.ownedPermissions = domainPermissions.concat(globalPermissions);
          AuthorizationFactory.tokenBakeup = $rootScope.user.token.token;
        }
        return AuthorizationFactory.userPermission;
      };

      AuthorizationFactory.getRowBasedPermission = function(domain, neededPermission) {
        let gPermissions = $rootScope.user.global_permissions;
        let dPermissions = $rootScope.user.domain_permissions;
        let result = "";
        for (let gPermission of gPermissions) {
          if (neededPermission === gPermission.id) {
            result = gPermission.write ? "w" : "r";
            break;
          }
        };
        if (result === "w") return result;
        if (dPermissions[domain]) {
          for (let dPermission of dPermissions[domain]) {
            if (neededPermission === dPermission.id) {
              result = dPermission.write ? "w" : "r";
              break;
            }
          }
        }
        return result;
      };

      AuthorizationFactory.getDisplayFlag = function(displayControl) {
        console.log("Authorize - ", displayControl, $rootScope.user.global_permissions);
        if ($rootScope.user) {
          let ownedPermissions = getCacheUserPermission().ownedPermissions;
          console.log("ownedPermissions:", ownedPermissions)
          if (ownedPermissions.length > 0) {
            return ownedPermissions.map(permission => {
              return permissionMap[displayControl].indexOf(permission) > -1;
            }).reduce((res, curr) => res = res || curr);
          }
        }
      };

      AuthorizationFactory.getDisplayFlagByMultiPermission = function(displayControl, isWithDomainPermission = false) {
        console.log("Authorize - ", displayControl, $rootScope.user.global_permissions);
        if ($rootScope.user) {
          let ownedPermissions = null;
          if (isWithDomainPermission) {
            ownedPermissions = getCacheUserPermission().ownedPermissions;
          } else {
            ownedPermissions = getCacheUserPermission().globalPermissions;
          }
          console.log("ownedPermissions:", permissionMap[displayControl], ownedPermissions)
          if (ownedPermissions.length > 0) {
            return isSubArray(permissionMap[displayControl], ownedPermissions);
          }
        }
        return false;
      };

      return AuthorizationFactory;
    });
})();
