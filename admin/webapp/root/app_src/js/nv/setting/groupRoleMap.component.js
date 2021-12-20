(function() {
    'use strict';

    angular
        .module('app.login')
        .component("groupRoleMap", {
          controller: GroupRoleMapController,
          controllerAs: "grpMapCtrl",
          templateUrl: "/app/views/components/group-role-map.html",
          bindings: {
            connection: '='
          }
        });
    GroupRoleMapController.$inject = [
      "$scope",
      "$timeout",
      "$mdDialog",
      "$http",
      "Utils",
      "GroupRoleMapService"
    ];
    function GroupRoleMapController(
      $scope,
      $timeout,
      $mdDialog,
      $http,
      Utils,
      GroupRoleMapService
    ) {

      let groupRoleMapData = {};
      let self = this;
      $scope.groups = [];
      GroupRoleMapService.groups = [];

      $scope.$watch("grpMapCtrl.connection", function(newValue, oldValue){
        if(newValue != oldValue){
          console.log("newValue: ", newValue);
          getParentElementInput(newValue);
        }
      });

      const onGroupChanged = function() {
        $scope.group = $scope.gridOptions4Groups.api.getSelectedRows()[0];
        console.log("selected group:", $scope.group);
        let domainRoles = [];
        if ($scope.group.role_domains) {
          domainRoles = Object.entries($scope.group.role_domains).map(([k, v]) => {
            return {
              domain_role: k,
              domains: v.join(", ")
            };
          });
        }
        $scope.gridOptions4DomainRoles.api.setRowData(domainRoles);
      };

      const getDomains = function() {
        const success = function(response) {
          const resourceList = ["_images", "_nodes", "_containers"];
          $scope.namespaces = response.data.domains.filter(
            (domain) => !resourceList.includes(domain.name)
          ).map(domain => domain.name);
        };
        const error = function(err) {
          console.warn(err);
        };
        $http
        .get(DOMAIN_URL)
        .then((response) => {
          success(response);
        })
        .catch((err) => {
          error(err);
        });
      }

      const initialGrid = function() {
        console.log("groupRoleMapData.isWriteGroupsAuthorized: ", groupRoleMapData.isWriteGroupsAuthorized);
        let grids = GroupRoleMapService.setGrid(groupRoleMapData.isWriteGroupsAuthorized);
        $scope.gridOptions4Groups = grids.gridOptions4Groups;
        $scope.gridOptions4Groups.onSelectionChanged = onGroupChanged;
        $scope.gridOptions4DomainRoles = grids.gridOptions4DomainRoles;
      };

      const getGridData = function() {
        $timeout(function () {
          $scope.gridOptions4Groups.api.setRowData(groupRoleMapData.groupRoleMap);
          $timeout(function () {
            $scope.gridOptions4Groups.api.sizeColumnsToFit();
            $scope.gridOptions4Groups.api.forEachNode(function(node, index) {
              if ($scope.group) {
                if (node.data.name === $scope.group.name) {
                  node.setSelected(true);
                  $scope.gridOptions4Groups.api.ensureNodeVisible(node);
                }
              } else if (index === 0) {
                node.setSelected(true);
                $scope.gridOptions4Groups.api.ensureNodeVisible(node);
              }
            });
          }, 200);
        }, 1000);
      };

      const getSortableData = function(groups) {
        $scope.groups = groups
          .map((group, index) => {
            if (group.global_role === "") group.global_role = "none";
            if (group.role_domains) {
              group.domainRoles = Object.entries(group.role_domains).map(([k, v]) => {
                return {
                  domain_role: k,
                  domains: v
                };
              });
            }
            return group;
          });
        GroupRoleMapService.groups = $scope.groups;
        console.log("$scope.groups: ", $scope.groups);
        $scope.sortableOptions = {
          placeholder: 'box-placeholder m0',
          update: function(e, ui) {
            console.log("e, ui", e, ui)
            if (!$scope.isWriteGroupsAuthorized) {
              ui.item.sortable.cancel();
            }
          }
        };
      };

      const getParentElementInput = function(newVal) {
        groupRoleMapData =  JSON.parse(newVal);
        $scope.isWriteGroupsAuthorized = groupRoleMapData.isWriteGroupsAuthorized;
        console.log("$scope.isWriteGroupsAuthorized: ", $scope.isWriteGroupsAuthorized);
        // if (groupRoleMapData.groupRoleMap.length > 0) {
          getSortableData(groupRoleMapData.groupRoleMap);
        // }
      };

      const submit = function(groups) {
        let obj = {
          isWriteGroupsAuthorized: groupRoleMapData.isWriteGroupsAuthorized,
          groupRoleMap: groups,
          mappableRoles: groupRoleMapData.mappableRoles
        }
        console.log("obj: ", obj);
        obj.groupRoleMap = obj.groupRoleMap.map(row => {
          row.global_role = row.global_role === "none" ? "" : row.global_role;
          return row;
        });
        let json = JSON.stringify(obj);
        console.log("json: ", json);
        self.connection = json;
      };

      getDomains();

      $scope.onOrderUpdate = function() {
        $timeout(() => {
          console.log("reorder")
          getSortableData($scope.groups);
          submit(angular.copy($scope.groups));
        }, 400);
      };

      $scope.editGroup = function(selectedGroup, fromIndex) {
        let success = function() {
          $mdDialog
            .show({
              controller: DialogController4AddEditGroup,
              templateUrl: "dialog.addEditGroup.html",
              locals: {
                selectedGroup: selectedGroup,
                fromIndex: fromIndex,
                mappableRoles: groupRoleMapData.mappableRoles,
                op: "edit",
                namespaces: $scope.namespaces
              }
            })
            .then(
              function() {
                $timeout(() => {
                  $scope.groups = GroupRoleMapService.groups;
                  getSortableData($scope.groups);
                  submit(angular.copy($scope.groups));
                }, 200);
              },
              function() {}
            );
        };

        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.addGroup = function(fromIndex) {
        let success = function() {
          $mdDialog
            .show({
              controller: DialogController4AddEditGroup,
              templateUrl: "dialog.addEditGroup.html",
              locals: {
                selectedGroup: {},
                fromIndex: fromIndex,
                mappableRoles: groupRoleMapData.mappableRoles,
                op: "add",
                namespaces: $scope.namespaces
              }
            })
            .then(
              function() {
                $timeout(() => {
                  $scope.groups = GroupRoleMapService.groups;
                  getSortableData($scope.groups);
                  submit(angular.copy($scope.groups));
                }, 200);
              },
              function() {}
            );
        };

        let error = function() {};

        Utils.keepAlive(success, error);
      };

      $scope.removeGroup = function(fromIndex) {
        groupRoleMapData.groupRoleMap.splice(fromIndex, 1);
        $scope.groups = groupRoleMapData.groupRoleMap;
        getSortableData($scope.groups);
        submit(angular.copy($scope.groups));
      }

    }

    DialogController4AddEditGroup.$inject = [
      "$scope",
      "$mdDialog",
      "$translate",
      "$http",
      "$sanitize",
      "$timeout",
      "Utils",
      "Alertify",
      "GroupRoleMapService",
      "selectedGroup",
      "fromIndex",
      "op",
      "mappableRoles",
      "namespaces"
    ];
    function DialogController4AddEditGroup(
      $scope,
      $mdDialog,
      $translate,
      $http,
      $sanitize,
      $timeout,
      Utils,
      Alertify,
      GroupRoleMapService,
      selectedGroup,
      fromIndex,
      op,
      mappableRoles,
      namespaces
    ) {
      $scope.singleDomain = {
        value: "",
        index: -1
      };
      $scope.op = op;
      $scope.domainList = namespaces;
      $scope.domainOptions4SingleDomainEditor = namespaces;
      $scope.globalRoleList = mappableRoles.group_roles.map((groupRole) => {
        return groupRole === "" ? "none" : groupRole;
      });
      let domainRoleList = mappableRoles.group_domain_roles;
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        if ($scope.op === "edit") $scope.group = angular.copy(selectedGroup);
        $mdDialog.cancel();
      };
      activate();
      function activate() {
        if ($scope.op === "edit") $scope.group = angular.copy(selectedGroup);
        else $scope.group = {
          group: "",
          global_role: ""
        }
        console.log($scope.group);
        const onDomainRoleChanged = function() {
          $scope.isShowingEditDomain = false;
          let selectedRow = $scope.gridOptions4DomainRoles.api.getSelectedRows()[0];
          $scope.selectedDomainRole = selectedRow.domain_role;
          $scope.domainRoleHint = $translate.instant("ldap.DM_ROLE_HINT", {role: $scope.selectedDomainRole});
          $scope.domains = selectedRow.domains;
          $scope.domainTags = selectedRow.domains.map((namespace, index) => {
            return {name: namespace, index: index};
          });
          $scope.$apply();
        };
        $scope.gridOptions4DomainRoles = GroupRoleMapService.setDialogGrid().gridOptions4DomainRoles;
        $scope.gridOptions4DomainRoles.onSelectionChanged = onDomainRoleChanged;
        $scope.gridOptions4DomainRoles.defaultColDef = {
          flex: 1,
          cellClass: 'cell-wrap-text',
          autoHeight: true,
          sortable: true,
          resizable: true,
        };
        $scope.gridOptions4DomainRoles.onColumnResized = function(params) {
          params.api.resetRowHeights();
        };

        const renderRoleDomainMap = function() {
          $timeout(() => {
            $scope.group.domainRoles = $scope.group.domainRoles || [];
            let domainRolesWithDomain = $scope.group.domainRoles.map(domainRole => domainRole.domain_role);
            $scope.group.domainRoles = domainRoleList.map(domainRole => {
              let index = domainRolesWithDomain.findIndex(domainRoleWithDomain => domainRoleWithDomain === domainRole);
              if (domainRole !== $scope.group.global_role) {
                if (index >= 0) return $scope.group.domainRoles[index];
                else return {domain_role: domainRole, domains: []};
              }
            }).filter(domainRole => !!domainRole);
            $scope.gridOptions4DomainRoles.api.setRowData($scope.group.domainRoles);
            $timeout(function () {
              $scope.gridOptions4DomainRoles.api.sizeColumnsToFit();
              let node = $scope.gridOptions4DomainRoles.api.getRowNode(0);
              node.setSelected(true);
            }, 200);
          },200);
        };

        const getRoleMap = function(domainRoles) {
          let roleMap = {};
          domainRoles.forEach(domainRole => {
            roleMap[domainRole.domain_role] = domainRole.domains;
          });
          return roleMap;
        }

        renderRoleDomainMap();

        $scope.changeGlobalRole = function() {
          renderRoleDomainMap();
        };

        $scope.loadTags = function(query) {
          const createFilter = function(query) {
            let lowercaseQuery = angular.lowercase(query);
            return function filterFn(criteria) {
              return (criteria.toLowerCase().indexOf(lowercaseQuery) >= 0);
            };
          }
          let domains = $scope.domainList;
          return query
            ? domains.filter(createFilter(query))
            : [];
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
          if ($scope.domainTags) {
            for (let i = 0; i < $scope.domainTags.length; i++) {
              if (
                $scope.singleDomain.value === $scope.domainTags[i].name &&
                $scope.singleDomain.index !== $scope.domainTags[i].index
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
          if (!$scope.domainTags)  $scope.domainTags = [];
          let insertIndex = singleDomain.index === -1 ? $scope.domainTags.length : singleDomain.index;
          let insertOrReplace = singleDomain.index === -1 ? 0 : 1;
          console.log("singleDomain.value: ", singleDomain.value);
          $scope.domainTags.splice(insertIndex, insertOrReplace, {
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
          $scope.domainTags.forEach(filter => {
            if (tag.index < filter.index) {
              filter.index -= 1;
            }
          });
          $timeout(() => {
            if (!$scope.domainTags)  $scope.domainTags = [];
            $scope.isShowingEditDomain = false;
            initializeTagStyle();
          }, 200);
        };

        const changeTag = function() {
          let roleDomainRow4Update = {
            domain_role: $scope.selectedDomainRole,
            domains: $scope.domainTags.map(domainTag => domainTag.name)
          }
          console.log("roleDomainRow4Update: ", roleDomainRow4Update)
          let updateDomainIndex = $scope.group.domainRoles.findIndex(row => {
            return row.domain_role === $scope.selectedDomainRole;
          });
          $scope.group.domainRoles.splice(updateDomainIndex, 1, roleDomainRow4Update);
          $scope.gridOptions4DomainRoles.api.setRowData($scope.group.domainRoles);

          $timeout(() => {
            $scope.gridOptions4DomainRoles.api.getRowNode(updateDomainIndex).setSelected(true);
          },200);
        };

        $scope.tagChanging = function($tag) {
          $timeout(() => {
            changeTag();
          }, 200);
        };

        $scope.addGroupRoleMap = function() {
          //Could put in submit diaplg
          $scope.role_domains = getRoleMap($scope.group.domainRoles.filter(domainRole => domainRole.domains.length > 0));
          console.log($scope.group.domainRoles, $scope.role_domains);
          let entry = {
            group: $scope.group.group,
            global_role: $scope.group.global_role
          };
          if ($scope.role_domains) {
            entry.role_domains = $scope.role_domains;
          }
          GroupRoleMapService.groups.splice(fromIndex + 1, 0, entry);
          console.log("GroupRoleMapService.groups (after add): ", GroupRoleMapService.groups);
          $scope.hide();
        };
        $scope.editGroupRoleMap = function() {
          //Could put in submit diaplg
          $scope.role_domains = getRoleMap($scope.group.domainRoles.filter(domainRole => domainRole.domains.length > 0));
          console.log($scope.group.domainRoles, $scope.role_domains);
          let entry = {
            group: $scope.group.group,
            global_role: $scope.group.global_role
          };
          if ($scope.role_domains) {
            entry.role_domains = $scope.role_domains;
          }
          GroupRoleMapService.groups.splice(fromIndex, 1, entry);
          console.log("GroupRoleMapService.groups (after edit): ", GroupRoleMapService.groups);
          $scope.hide();
        };
      }
    }
})();
