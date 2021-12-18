(function () {
  "use strict";

  angular.module("app.lazyload").constant("APP_REQUIRES", {
    scripts: {
      whirl: ["vendor/whirl/dist/whirl.css"],
      classyloader: [
        "vendor/jquery-classyloader/js/jquery.classyloader.min.js",
      ],
      modernizr: ["vendor/modernizr/modernizr.custom.js"],
      icons: [
        "vendor/fontawesome/css/font-awesome.min.css",
        "vendor/simple-line-icons/css/simple-line-icons.css",
      ],
      screenfull: ["vendor/screenfull/dist/screenfull.min.js"],
      "jquery-ui": [
        "vendor/jquery-ui/ui/widget.js",
      ],
      "jquery-ui-widgets": [
        "vendor/jquery-ui/ui/widget.js",
        "vendor/jquery-ui/ui/mouse.js",
        "vendor/jquery-ui/ui/draggable.js",
        "vendor/jquery-ui/ui/droppable.js",
        "vendor/jquery-ui/ui/sortable.js",
      ],
      moment: ["vendor/moment/min/moment-with-locales.min.js"],
      ngTagsInput: [
        "vendor/ng-tags-input/ng-tags-input.min.css",
        "vendor/ng-tags-input/ng-tags-input.min.js",
      ],
      antv: ["vendor/@antv/g6/dist/g6.min.js"],
      filestyle: ["vendor/bootstrap-filestyle/src/bootstrap-filestyle.js"],
      peity: ["vendor/peity/jquery.peity.min.js"],
      pdfMake: ["vendor/pdfmake/build/pdfmake.js"],
      vfs: ["vendor/pdfmake/build/vfs_fonts.js"]
    },
    modules: [
      {
        name: "ngDialog",
        files: [
          "vendor/ngDialog/js/ngDialog.min.js",
          "vendor/ngDialog/css/ngDialog.min.css",
          "vendor/ngDialog/css/ngDialog-theme-default.min.css",
        ],
      },
      {
        name: "Alertify",
        files: [
          "vendor/ng-alertify/dist/ng-alertify.css",
          "vendor/ng-alertify/dist/ng-alertify.js",
        ],
      },
      {
        name: "ngToggle",
        files: [
          "vendor/ng-toggle/dist/nz-toggle.min.js",
          "vendor/ng-toggle/dist/nz-toggle.min.css",
        ],
      },
      {
        name: "vtortola.ng-terminal",
        files: [
          "vendor/ng-terminal-emulator/src/vtortola.ng-terminal.js",
          "vendor/ng-terminal-emulator/src/vtortola.ng-terminal.css",
        ],
      },
      {
        name: "angularFileUpload",
        files: ["vendor/angular-file-upload/dist/angular-file-upload.js"],
      },
      {
        name: "angularGrid",
        files: [
          "vendor/ag-grid/dist/styles/ag-grid.css",
          "vendor/ag-grid/dist/ag-grid.min.js",
        ],
      },
      {
        name: "chart.js",
        files: ["vendor/angular-chart.js/dist/angular-chart.min.js"],
      },
      {
        name: "angular-clipboard",
        files: ["vendor/angular-clipboard/angular-clipboard.js"],
      },
      {
        name: "relativeDate",
        files: [
          "vendor/angular-relative-date/dist/angular-relative-date.min.js",
        ],
      },
      {
        name: "ngFileSaver",
        files: [
          "vendor/angular-file-saver/dist/angular-file-saver.bundle.min.js",
        ],
      },
      {
        name: "angularSlider",
        files: [
          "vendor/angular-slider/dist/rzslider.min.css",
          "vendor/angular-slider/dist/rzslider.min.js",
        ],
      },
      {
        name: "angularjs-gauge",
        files: ["vendor/angularjs-gauge/src/angularjs-gauge.js"],
      },
      {
        name: "angular-carousel",
        files: [
          "vendor/angular-carousel/dist/angular-carousel.css",
          "vendor/angular-carousel/dist/angular-carousel.js",
        ],
      },
      {
        name: "angularBootstrapNavTree",
        files: [
          "vendor/angular-bootstrap-nav-tree/dist/abn_tree_directive.js",
          "vendor/angular-bootstrap-nav-tree/dist/abn_tree.css",
        ],
      },
      {
        name: "ng-countryflags",
        files: [
          "vendor/ng-country-flags/dist/css/flag-icon.min.css",
          "vendor/ng-country-flags/dist/js/ng-countryflags.min.js",
          "vendor/ng-country-flags/dist/flags/**/*",
        ],
      },
      {
        name: "ui.sortable",
        files: [
          "vendor/jquery-ui/jquery-ui.min.js",
          "vendor/angular-ui-sortable/sortable.js",
        ],
        serie: true,
      },
      {
        name: "xeditable",
        files: [
          "vendor/angular-xeditable/dist/js/xeditable.js",
          "vendor/angular-xeditable/dist/css/xeditable.css",
        ],
      },
    ],
  });
})();
