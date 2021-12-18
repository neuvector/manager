(function() {
  "use strict";

  angular
    .module("app.sidebar")
    .controller("SidebarController", SidebarController);

  SidebarController.$inject = [
    "$rootScope",
    "$scope",
    "$state",
    "SidebarService",
    "Utils"
  ];
  function SidebarController(
    $rootScope,
    $scope,
    $state,
    SidebarService,
    Utils
  ) {
    const activate = () => {

      const hasAdminAccess = roles => {
        for (let key in roles) {
          if (roles[key] === "2" || roles[key] === "4") return true;
        }
        return false;
      };

      const openCurrOnly = index => {
        index += "";
        for (let i in submenuGroupList) {
          if (index < 0 || index.indexOf(i) < 0) submenuGroupList[i] = true;
        }
      };

      const isSelected = item => {
        if (item) {
          if (!item.stateName || item.stateName === "_") {
            let foundSelected = false;
            item.submenu.forEach(function (value) {
              if (isSelected(value)) foundSelected = true;
            });
            return foundSelected;
          } else {
            return $state.is(item.stateName) || $state.includes(item.stateName);
          }
        }
      };

      const isChild = index => typeof index === "string" && !(index.indexOf("-") < 0);

      const isSidebarRendered = items => {
        $scope.menuItems = items;
        $rootScope.sidebarDone = true;
      };

      let submenuGroupList = [];
      if ($scope.user) {
        let isAdmin = hasAdminAccess($scope.user.roles);

        $rootScope.$watch("app.layout.asideHover", (oldVal, newVal) => {
          if (newVal === false && oldVal === true) {
            openCurrOnly(-1);
          }
        });

        SidebarService.getMenu(isAdmin, isSidebarRendered);
      }

      $scope.getMenuItemClass = item => `${item.heading ? "nav-heading" : ""} ${isSelected(item) ? " active" : ""}`;

      $scope.addSubmenu = (index, item) => {
        submenuGroupList[index] = $rootScope.app.layout.asideHover
            ? true
            : !isSelected(item);
      };

      $scope.isCollapse = index => submenuGroupList[index];

      $scope.toggleSubmenuCollapse = (index, isUpperLevelItem) => {
        if (Utils.isSubmenuCollapsed() || $rootScope.app.layout.asideHover)
          return true;

        if (typeof submenuGroupList[index] !== "undefined") {
          if (!$scope.isLastEventFromSubmenu) {
            submenuGroupList[index] = !submenuGroupList[index];
            openCurrOnly(index);
          }
        } else if (isUpperLevelItem) {
          openCurrOnly(-1);
        }

        $scope.isLastEventFromSubmenu = isChild(index);

        return true;
      };
    };

    activate();

    $rootScope.$watch('app.layout.isCollapsed', newValue => {
      if (newValue === false)
        $rootScope.$broadcast('closeSidebarMenu');
    });

  }
})();
