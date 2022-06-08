(function () {
  "use strict";
  angular
    .module("app.assets")
    .factory("ComplianceProfileFactory", function (
      $http,
      $translate,
      $timeout,
      $window,
      $filter,
      $q,
      Utils,
      Alertify,
      $sanitize
    ) {
      let ComplianceProfileFactory = {};

      ComplianceProfileFactory.prepareGrids = () => {
        const level1 = $translate.instant("cis.LEVEL1");
        const scored = $translate.instant("cis.SCORED");

        const colorMap = {
          PCI: "green",
          GDPR: "warning",
          HIPAA: "monitor",
          NIST: "inverse",
        };

        let columns = [
          {
            headerName: $translate.instant("nodes.gridHeader.TEST_NUM"),
            field: "test_number",
            cellRenderer: function (params) {
              const postfix = `${params.value}</span>`;
              if (params.data.modified)
                return `<span class="text-primary text-bold">${postfix}`;
              else return `<span>${postfix}`;
            },
            width: 80,
            minWidth: 70,
          },
          {
            headerName: $translate.instant("cis.profile.REGULATIONS"),
            field: "tags",
            cellRenderer: (params) => {
              if (params.value && params.value.length > 0) {
                const tags = params.value.map((tag) => {
                  return (
                    `<span class="label label-${colorMap[tag]}"
                           style="padding-left: 3px;"/>
                       &#8942;&#8942;&nbsp;&nbsp;${tag}
                     </span>`);
                });
                return `${tags.join(" ")}`;
              } else return null;
            },
            maxWidth: 200,
            minWidth: 80,
          },
          {
            headerName: $translate.instant("nodes.gridHeader.CATEGORY"),
            field: "category",
            cellRenderer: function (params) {
              if (params.value) {
                return `<span class="label label-fs label-info">${$sanitize(
                  params.value
                )}</span>`;
              } else return null;
            },
            width: 90,
            maxWidth: 90,
            minWidth: 90,
          },
          {
            headerName:
              $translate.instant("cis.report.gridHeader.SCORED") +
              "<em class='fa fa-info text-primary pl-sm'> </em>",
            field: "scored",
            headerTooltip: scored,
            cellRenderer: function (params) {
              let htmlValue = params.value ? "Y" : "N";
              return `<span >${htmlValue}</span>`;
            },
            getQuickFilterText: function (params) {
              if (params.value) return "scored";
            },
            maxWidth: 90,
            minWidth: 70,
          },
          {
            headerName:
              $translate.instant("cis.report.gridHeader.PROFILE") +
              "<em class='fa fa-info text-primary pl-sm'> </em>",
            field: "profile",
            headerTooltip: level1,
            getQuickFilterText: function (params) {
              if (params.value === "Level 1") return "level1";
              else return "level2";
            },
            maxWidth: 90,
            minWidth: 70,
          },
          {
            headerName: $translate.instant("nodes.gridHeader.DESCRIPTION"),
            field: "description",
            cellClass: "cell-wrap-text",
            autoHeight: true,
          }
        ];

        let actionColumns = [
          {
            headerName: $translate.instant("user.gridHeader.ACTION"),
            cellRenderer: (params) => {
              return `<em class="fa fa-edit fa-lg mr-sm text-action"
                     ng-click="editRegulation($event, data)">
                 </em>`;
            },
            cellClass: "grid-right-align",
            suppressSorting: true,
            maxWidth: 60,
            minWidth: 50,
          }
        ];
        ComplianceProfileFactory.getGridOptions = () => {
          let columns2 = columns;
          if (ComplianceProfileFactory.canConfigProfile) columns2 = columns.concat(actionColumns);
          return Utils.createGridOptions(columns2);
        };
      };



      ComplianceProfileFactory.getProfile = () =>
        $http
          .get(COMPLIANCE_PROFILE_URL)
          .then(function (response) {
            return response.data.profiles[0];
          })
          .catch(function (err) {
            console.error(err);
          });

      ComplianceProfileFactory.getComplianceList = () =>
        $http
          .get(COMPLIANCE_TEMPLATE_URL)
          .then(function (response) {
            return response.data.list.compliance;
          })
          .catch(function (err) {
            console.error(err);
          });

      ComplianceProfileFactory.saveTemplate = (payload, callback) => {
        $http
          .patch(COMPLIANCE_PROFILE_URL, payload)
          .then(() => {
            Alertify.set({ delay: ALERTIFY_SUCCEED_DELAY });
            Alertify.success($translate.instant("cis.profile.DEPLOY_OK"));

            $timeout(function() {
              if (angular.isFunction(callback)) callback();
            }, 500);

          })
          .catch(function (error) {
            console.warn(error);
            if (angular.isFunction(callback)) callback();
            if (USER_TIMEOUT.indexOf(error.status) < 0) {
              Alertify.set({ delay: ALERTIFY_ERROR_DELAY });
              Alertify.error(
                Utils.getAlertifyMsg(
                  error,
                  $translate.instant("cis.profile.DEPLOY_FAILED"),
                  false
                )
              );
            }
          });
      };

      ComplianceProfileFactory.resetTemplate = (payload, callback) => {
        const confirmBox = $translate.instant("cis.profile.RESET_CONFIRM");
        Alertify.confirm(confirmBox).then(
          function toOK() {
            ComplianceProfileFactory.saveTemplate(payload, callback);
          },
          function toCancel() {}
        );
      };

      return ComplianceProfileFactory;
    });
})();
