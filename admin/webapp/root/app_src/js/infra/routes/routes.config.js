(function () {
  "use strict";

  angular.module("app.routes").config(routesConfig);

  routesConfig.$inject = [
    "$stateProvider",
    "$locationProvider",
    "$urlRouterProvider",
    "RouteHelpersProvider",
  ];
  function routesConfig(
    $stateProvider,
    $locationProvider,
    $urlRouterProvider,
    helper
  ) {
    $locationProvider.html5Mode(false);

    $urlRouterProvider.otherwise("/page/login");

    $stateProvider
      .state("app", {
        url: "/app",
        abstract: true,
        templateUrl: helper.basePath("app.html"),
        resolve: helper.resolveFor(
          "moment",
          "icons",
          "screenfull",
          "Alertify",
          "classyloader",
          "whirl"
        ),
      })
      .state("app.dashboard", {
        url: "/dashboard",
        title: "Dashboard",
        templateUrl: helper.basePath("dashboard.html"),
        resolve: helper.resolveFor(
          "chart.js",
          "angularGrid",
          "relativeDate",
          "ngFileSaver",
          "Alertify",
          "pdfMake",
          "vfs",
          "angularjs-gauge"
        ),
      })
      .state("app.fedPolicy", {
        url: "/fed-policy",
        title: "Federal policy",
        templateUrl: helper.basePath("fed-policy.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "Alertify",
          "relativeDate",
          "ngTagsInput",
          "xeditable"
        ),
      })
      .state("app.hosts", {
        url: "/hosts",
        params: {
          nodeId: null,
        },
        title: "Hosts",
        templateUrl: helper.basePath("hosts.html"),
        resolve: helper.resolveFor("angularGrid", "ngFileSaver"),
      })
      .state("app.platforms", {
        url: "/platforms",
        params: {
          nodeId: null,
        },
        title: "Platforms",
        templateUrl: helper.basePath("platforms.html"),
        resolve: helper.resolveFor("angularGrid", "ngFileSaver"),
      })
      .state("app.devices", {
        url: "/devices",
        title: "Agents",
        templateUrl: helper.basePath("devices.html"),
        resolve: helper.resolveFor("angularGrid", "chart.js"),
      })
      .state("app.controllers", {
        url: "/controllers",
        title: "Controllers",
        templateUrl: helper.basePath("controllers.html"),
        resolve: helper.resolveFor("angularGrid", "relativeDate", "chart.js"),
      })
      .state("app.securityEvent", {
        url: "/security-event",
        title: "SecurityEvent",
        params: {
          selectedRow: null,
        },
        templateUrl: helper.basePath("securityEvent.html"),
        resolve: helper.resolveFor(
          "chart.js",
          "angularGrid",
          "ngFileSaver",
          "relativeDate",
          "angularSlider",
          "pdfMake",
          "ngToggle",
          "vfs",
          "ng-countryflags",
          "ngTagsInput",
          "chart.js"
        ),
      })
      .state("app.event", {
        url: "/event",
        title: "Events",
        templateUrl: helper.basePath("event.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "ngFileSaver",
          "relativeDate",
          "ngTagsInput"
        ),
      })
      .state("app.threat", {
        url: "/threat",
        params: {
          threatName: null,
        },
        title: "Threats",
        templateUrl: helper.basePath("threat.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "relativeDate",
          "ngFileSaver"
        ),
      })
      .state("app.violation", {
        url: "/violations",
        params: {
          clientId: null,
        },
        title: "Policy Violations",
        templateUrl: helper.basePath("conversation.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "relativeDate",
          "ngFileSaver"
        ),
      })
      .state("app.incident", {
        url: "/incident",
        title: "Incidents",
        templateUrl: helper.basePath("incident.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "relativeDate",
          "ngFileSaver"
        ),
      })
      .state("app.audit", {
        url: "/audit",
        title: "Audit log",
        templateUrl: helper.basePath("audit.html"),
        resolve: helper.resolveFor(
          "chart.js",
          "angularGrid",
          "relativeDate",
          "ngFileSaver",
          "pdfMake",
          "vfs",
          "ngTagsInput",
          "ngTagsInput"
        ),
      })
      .state("app.workloads", {
        url: "/workloads",
        params: {
          imageId: null,
        },
        title: "Workloads",
        templateUrl: helper.basePath("workloads.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "chart.js",
          "ngFileSaver",
          "pdfMake",
          "vfs",
          "relativeDate"
        ),
      })
      .state("app.nodechart", {
        url: "/nodechart",
        title: "Network Graph",
        templateUrl: helper.basePath("graph.html"),
        resolve: helper.resolveFor(
          "antv",
          "ngToggle",
          "angularGrid",
          "angularSlider",
          "ngTagsInput",
          "ng-countryflags"
        ),
      })
      .state("app.service", {
        url: "/service",
        title: "Services",
        templateUrl: helper.basePath("service.html"),
        resolve: helper.resolveFor(
          "ngToggle",
          "angularGrid",
          "peity",
          "relativeDate",
          "ngTagsInput"
        ),
      })
      .state("app.group", {
        url: "/group",
        title: "Group",
        params: {
          groupName: null,
          from: null
        },
        templateUrl: helper.basePath("group.html"),
        resolve: helper.resolveFor(
          "ngTagsInput",
          "ngToggle",
          "angularGrid",
          "ngFileSaver",
          "filestyle",
          "angularFileUpload"
        ),
      })
      .state("app.policy", {
        url: "/policy",
        title: "Policy",
        templateUrl: helper.basePath("policy.html"),
        resolve: helper.resolveFor(
          "chart.js",
          "jquery-ui",
          // "jquery-ui-widgets",
          "ngToggle",
          "ngDialog",
          "ngTagsInput",
          "angularGrid",
          "ngFileSaver",
          "pdfMake",
          "vfs"
        ),
      })
      .state("app.responsePolicy", {
        url: "/response-policy",
        title: "ResponsePolicy",
        templateUrl: helper.basePath("responsePolicy.html"),
        resolve: helper.resolveFor(
          "jquery-ui",
          // "jquery-ui-widgets",
          "ngToggle",
          "ngDialog",
          "ngTagsInput",
          "angularGrid"
        ),
      })
      .state("app.admissionControl", {
        url: "/admission-control",
        title: "AdmissionControl",
        templateUrl: helper.basePath("admissionControl.html"),
        resolve: helper.resolveFor(
          "jquery-ui",
          // "jquery-ui-widgets",
          "ngToggle",
          "ngDialog",
          "ngTagsInput",
          "angularGrid",
          "angular-clipboard",
          "filestyle",
          "angularFileUpload",
          "ngFileSaver",
          "pdfMake",
          "vfs"
        ),
      })
      .state("app.dlpSensors", {
        url: "/dlp-sensors",
        title: "DLPSensors",
        templateUrl: helper.basePath("dlpSensors.html"),
        resolve: helper.resolveFor(
          "jquery-ui",
          // "jquery-ui-widgets",
          "ngToggle",
          "xeditable",
          "ngDialog",
          "ngTagsInput",
          "angularGrid",
          "angular-clipboard",
          "filestyle",
          "angularFileUpload",
          "ngFileSaver"
        ),
      })
      .state("app.wafSensors", {
        url: "/waf-sensors",
        title: "WAFSensors",
        templateUrl: helper.basePath("wafSensors.html"),
        resolve: helper.resolveFor(
          "jquery-ui",
          // "jquery-ui-widgets",
          "ngToggle",
          "xeditable",
          "ngDialog",
          "ngTagsInput",
          "angularGrid",
          "angular-clipboard",
          "filestyle",
          "angularFileUpload",
          "ngFileSaver"
        ),
      })
      .state("app.scan", {
        url: "/scan",
        params: {
          imageId: null,
          tabId: null,
        },
        title: "Scan",
        templateUrl: helper.basePath("vulnerabilities.html"),
        resolve: helper.resolveFor(
          "chart.js",
          "peity",
          "angularSlider",
          "angularGrid",
          "ngFileSaver",
          "pdfMake",
          "vfs",
          "ngTagsInput"
        ),
      })
      .state("app.regScan", {
        url: "/regScan",
        params: {
          imageId: null,
          tabId: null,
        },
        title: "Registry Scan",
        templateUrl: helper.basePath("registryScan.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "ngFileSaver",
          "ngTagsInput",
          "chart.js",
          "pdfMake",
          "vfs"
        ),
      })
      .state("app.bench", {
        url: "/bench",
        title: "Bench",
        templateUrl: helper.basePath("complianceAsset.html"),
        resolve: helper.resolveFor(
          "chart.js",
          "peity",
          "angularSlider",
          "angularGrid",
          "ngFileSaver",
          "pdfMake",
          "vfs",
          "ngTagsInput"
        ),
      })
      .state("app.cisProfile", {
        url: "/cisProfile",
        title: "Compliance profile",
        templateUrl: helper.basePath("complianceProfile.html"),
        resolve: helper.resolveFor("angularGrid", "Alertify"),
      })
      .state("app.cveProfile", {
        url: "/cveProfile",
        title: "Vulnerability profile",
        templateUrl: helper.basePath("vulnerabilityProfile.html"),
        resolve: helper.resolveFor("angularGrid", "Alertify", "ngTagsInput"),
      })
      .state("app.users", {
        url: "/users",
        title: "Users",
        templateUrl: helper.basePath("rolesUsers.html"),
        resolve: helper.resolveFor(
          "angularGrid",
          "relativeDate",
          "ngTagsInput"
        ),
      })
      .state("app.license", {
        url: "/license",
        title: "License",
        templateUrl: helper.basePath("license.html"),
        resolve: helper.resolveFor("angular-clipboard", "Alertify"),
      })
      .state("app.console", {
        url: "/console",
        title: "Console",
        templateUrl: helper.basePath("console.html"),
        resolve: helper.resolveFor("vtortola.ng-terminal"),
      })
      .state("app.configuration", {
        url: "/configuration",
        title: "Configuration",
        templateUrl: helper.basePath("settings.html"),
        resolve: helper.resolveFor(
          "angularFileUpload",
          "filestyle",
          "ngFileSaver",
          "angularSlider",
          "angular-clipboard",
          "angularGrid",
          "xeditable"
        ),
      })
      .state("app.ldap", {
        url: "/ldap",
        title: "LDAP",
        templateUrl: helper.basePath("ldap.html"),
        resolve: helper.resolveFor("ngTagsInput", "angularGrid", "ui.sortable"),
      })
      .state("app.saml", {
        url: "/saml",
        title: "SAML",
        templateUrl: helper.basePath("okta.html"),
        resolve: helper.resolveFor(
          "angular-clipboard",
          "ngTagsInput",
          "angularGrid",
          "ui.sortable"
        ),
      })
      .state("app.openId", {
        url: "/openId",
        title: "OpenID",
        templateUrl: helper.basePath("openId.html"),
        resolve: helper.resolveFor(
          "angular-clipboard",
          "ngTagsInput",
          "angularGrid",
          "ui.sortable"
        ),
      })
      .state("app.customRoles", {
        url: "/custom-roles",
        title: "Custom roles",
        templateUrl: helper.basePath("customRoles.html"),
        resolve: helper.resolveFor("angularGrid", "ngTagsInput"),
      })
      .state("app.profile", {
        url: "/profile",
        title: "Profile",
        params: {
          isChangingPassword: null,
        },
        templateUrl: helper.basePath("profile.html"),
      })
      .state("app.settingsHome", {
        url: "/settings",
        title: "Settings",
        templateUrl: helper.basePath("settings-home.html"),
        resolve: helper.resolveFor("Alertify"),
      })
      .state("app.multiCluster", {
        url: "/multi-cluster",
        title: "multiCluster",
        templateUrl: helper.basePath("multiCluster.html"),
        resolve: helper.resolveFor(
          "jquery-ui",
          // "jquery-ui-widgets",
          "ngToggle",
          "ngDialog",
          "ngTagsInput",
          "angularGrid",
          "angular-clipboard"
        ),
      })
      .state("app.settingsWidget", {
        url: "/settings-widget",
        title: "SettingsWidget",
        templateUrl: helper.basePath("components/settings-widget.html"),
      })
      .state("page", {
        url: "/page",
        templateUrl: "app/pages/page.html",
        resolve: helper.resolveFor("icons"),
        controller: [
          "$rootScope",
          function ($rootScope) {
            $rootScope.app.layout.isBoxed = false;
          },
        ],
      })
      .state("page.login", {
        url: "/login",
        title: "Login",
        templateUrl: helper.pagePath("login.html"),
      })
      .state("page.eula", {
        url: "/eula",
        title: "EULA",
        templateUrl: helper.pagePath("eula.html"),
        resolve: helper.resolveFor("Alertify"),
      });
  }
})();
