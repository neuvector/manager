import { Injectable } from '@angular/core';
import { MapConstant } from '@common/constants/map.constant';
import { GlobalVariable } from '@common/variables/global.variable';
import { Permission } from '@common/types/others/permission';
import { groupBy } from '@common/utils/common.utils';

@Injectable()
export class AuthUtilsService {
  private tokenBakeup: string;
  private permissionMap: any;
  public userPermission: any;

  constructor() {
    this.tokenBakeup = '';
    this.permissionMap = MapConstant.PERMISSION_MAP;
    this.userPermission = {
      globalPermissions: null,
      remoteGlobalPermissions: null,
      ownedPermissions: null,
      isNamespaceUser: false,
    };
  }

  private parseGlobalPermission(g_permissions) {
    return (
      g_permissions?.map(permission => {
        return `${permission.id}_${
          permission.write ? 'w' : permission.read ? 'r' : ''
        }`;
      }) ?? []
    );
  }

  private parseDomainPermission(d_permission: Map<string, Array<Permission>>) {
    let permissionArray = Object.values(d_permission).flat();
    let permissionGroup = groupBy(permissionArray, 'id');
    let permissionIds = Object.keys(permissionGroup);
    let mergedPermission = permissionIds.map(permissionId => {
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
  }

  private getNamespaces4NamespaceUser(d_permission) {
    let namespacesByPermission = {};
    Object.keys(d_permission).forEach(namespace => {
      let permissions = d_permission[namespace];
      permissions.forEach(permission => {
        let permissionKey = `${permission.id}_${permission.write ? 'w' : 'r'}`;
        if (namespacesByPermission[permissionKey]) {
          namespacesByPermission[
            `${permission.id}_${permission.write ? 'w' : 'r'}`
          ].push(namespace);
        } else {
          namespacesByPermission[
            `${permission.id}_${permission.write ? 'w' : 'r'}`
          ] = [namespace];
        }
      });
    });
    return namespacesByPermission;
  }

  private isSubArray(arr1, arr2) {
    let res = true;
    arr1.forEach(str => {
      res = res && arr2.indexOf(str) > -1;
    });
    return res;
  }

  private getCacheUserPermission() {
    if (
      GlobalVariable.isRemote ||
      !this.userPermission.ownedPermissions ||
      this.tokenBakeup !== GlobalVariable.user.token.token
    ) {
      let globalPermissions = this.parseGlobalPermission(
        GlobalVariable.user.global_permissions
      );
      let remoteGlobalPermissions = this.parseGlobalPermission(
        GlobalVariable.user.remote_global_permissions
      );
      let domainPermissions = this.parseDomainPermission(
        GlobalVariable.user.domain_permissions
      );

      GlobalVariable.namespaces4NamespaceUser =
        this.getNamespaces4NamespaceUser(
          GlobalVariable.user.domain_permissions
        );

      this.userPermission.isNamespaceUser =
        globalPermissions.length === 0 && domainPermissions.length > 0;
      this.userPermission.globalPermissions = globalPermissions;
      this.userPermission.remoteGlobalPermissions = remoteGlobalPermissions;
      this.userPermission.ownedPermissions =
        domainPermissions.concat(globalPermissions);
      this.tokenBakeup = GlobalVariable.user.token.token;
    }
    return this.userPermission;
  }

  getRowBasedPermission(domain, neededPermission) {
    let gPermissions = GlobalVariable.user.global_permissions;
    let rgPermissions = GlobalVariable.user.remote_global_permissions;
    let dPermissions = GlobalVariable.user.domain_permissions;
    let result = '';

    if (GlobalVariable.isRemote) {
      for (let rgPermission of rgPermissions) {
        if (neededPermission === rgPermission.id) {
          result = rgPermission.write ? 'w' : 'r';
          break;
        }
      }
    } else {
      for (let gPermission of gPermissions) {
        if (neededPermission === gPermission.id) {
          result = gPermission.write ? 'w' : 'r';
          break;
        }
      }
      if (result === 'w') return result;
      if (dPermissions[domain]) {
        for (let dPermission of dPermissions[domain]) {
          if (neededPermission === dPermission.id) {
            result = dPermission.write ? 'w' : 'r';
            break;
          }
        }
      }
    }
    return result;
  }

  getDisplayFlag(displayControl) {
    if (GlobalVariable.user) {
      let ownedPermissions;

      if (
        !GlobalVariable.isRemote ||
        this.isFedRole(GlobalVariable.user.token?.role)
      ) {
        ownedPermissions = this.getCacheUserPermission().ownedPermissions;
      } else {
        ownedPermissions =
          this.getCacheUserPermission().remoteGlobalPermissions;
      }

      if (ownedPermissions.length > 0) {
        return ownedPermissions
          .map(permission => {
            return this.permissionMap[displayControl].indexOf(permission) > -1;
          })
          .reduce((res, curr) => (res = res || curr));
      }
    }
  }

  getGlobalPermissionDisplayFlag(displayControl) {
    if (GlobalVariable.user) {
      let ownedPermissions = this.getCacheUserPermission().ownedPermissions;

      if (ownedPermissions.length > 0) {
        return ownedPermissions
          .map(permission => {
            return this.permissionMap[displayControl].indexOf(permission) > -1;
          })
          .reduce((res, curr) => (res = res || curr));
      }
    }
  }

  getDisplayFlagByMultiPermission(
    displayControl,
    isWithDomainPermission = false
  ) {
    console.log(
      'Authorize - ',
      displayControl,
      GlobalVariable.user.global_permissions
    );
    if (GlobalVariable.user) {
      let ownedPermissions = [];

      if (
        !GlobalVariable.isRemote ||
        this.isFedRole(GlobalVariable.user.token?.role)
      ) {
        ownedPermissions = isWithDomainPermission
          ? this.getCacheUserPermission().ownedPermissions
          : this.getCacheUserPermission().globalPermissions;
      } else {
        ownedPermissions =
          this.getCacheUserPermission().remoteGlobalPermissions;
      }
      console.log(
        'ownedPermissions:',
        this.permissionMap[displayControl],
        ownedPermissions
      );
      if (ownedPermissions.length > 0) {
        return this.isSubArray(
          this.permissionMap[displayControl],
          ownedPermissions
        );
      }
    }
    return false;
  }

  hasExtraPermission(tokenInfo) {
    return (
      (tokenInfo.extra_permissions &&
        Array.isArray(tokenInfo.extra_permissions) &&
        tokenInfo.extra_permissions.length > 0) ||
      (tokenInfo.extra_permissions_domains &&
        Object.keys(tokenInfo.extra_permissions_domains).length > 0)
    );
  }

  private isFedRole(role: string | null): boolean {
    if (!role) {
      return false;
    }
    return role.toLowerCase().includes('fed');
  }
}
