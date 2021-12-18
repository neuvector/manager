(function() {
  "use strict";
  angular
    .module("app.settingsHome")
    .controller("settingsHomeController", [
      "$rootScope",
      "$scope",
      "$translate",
      "Utils",
      "$controller",
      "$state",
      "AuthorizationFactory",
      function($rootScope, $scope, $translate, Utils, $controller, $state, AuthorizationFactory) {

        let baseCtl = $controller('BaseMultiClusterController',{ $scope: $scope});
        baseCtl.doOnClusterRedirected($state.reload);

        let isConfigAuth = AuthorizationFactory.getDisplayFlag("read_config");
        let isAuthenticationAuth = AuthorizationFactory.getDisplayFlag("read_auth_server");
        let isNamespaceUser = AuthorizationFactory.userPermission.isNamespaceUser;
        let licenseDisabled = isConfigAuth ? "" : "disabled";
        let configDisabled = isConfigAuth && !isNamespaceUser ? "" : "disabled";
        let authenticationDisabled = isAuthenticationAuth ? "" : "disabled";

        $scope.openid = {
          title: $translate.instant("sidebar.nav.OPENID"),
          imageType: "image",
          image: isAuthenticationAuth ? "openid-image" : "openid-d-image",
          description: $translate.instant("setting.description.OPENID"),
          link: isAuthenticationAuth ? "#/app/openId" : "#/app/settings",
          disabled: authenticationDisabled
        };
        $scope.users = {
          title: $translate.instant("sidebar.nav.USERS"),
          imageType: "image",
          image: "users-image",
          description: $translate.instant("setting.description.USERS"),
          link: "#/app/users",
          disabled: ""
        };
        $scope.configuration = {
          title: $translate.instant("sidebar.nav.CONFIGURATION"),
          imageType: "image",
          image: !configDisabled ? "config-image" : "config-d-image",
          description: $translate.instant("setting.description.CONFIGURATION"),
          link: !configDisabled ? "#/app/configuration" : "#/app/settings",
          disabled: configDisabled
        };
        $scope.ldapSettings = {
          title: $translate.instant("sidebar.nav.LDAP"),
          imageType: "image",
          image: isAuthenticationAuth ? "ldap-image" : "ldap-d-image",
          description: $translate.instant("setting.description.LDAP"),
          link: isAuthenticationAuth ? "#/app/ldap" : "#/app/settings",
          disabled: authenticationDisabled
        };
        $scope.samlSettings = {
          title: $translate.instant("sidebar.nav.OKTA"),
          imageType: "image",
          image: isAuthenticationAuth ? "saml-image" : "saml-d-image",
          description: $translate.instant("setting.description.SAML"),
          link: isAuthenticationAuth ? "#/app/saml" : "#/app/settings",
          disabled: authenticationDisabled
        };
        $scope.license = {
          title: $translate.instant("sidebar.nav.LICENSE"),
          imageType: "image",
          image: !licenseDisabled ? "license-image" : "license-d-image",
          description: $translate.instant("setting.description.LICENSE"),
          link: !licenseDisabled ? "#/app/license" : "#/app/settings",
          disabled: licenseDisabled
        };

        //shield-check,
      }
    ])
    .directive("settingsWidget", function() {
      return {
        restrict: "E",
        scope: {
          submenu: "=submenu"
        },
        templateUrl: "/app/views/components/settings-widget.html"
      };
    });
})();
