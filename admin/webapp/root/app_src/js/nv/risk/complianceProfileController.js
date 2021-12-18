(function () {
  "use strict";

  angular
    .module("app.assets")
    .controller("ComplianceProfileController", ComplianceProfileController);

  ComplianceProfileController.$inject = [
    "$scope",
    "$rootScope",
    "$translate",
    "$http",
    "$window",
    "$timeout",
    "$interval",
    "$state",
    "ComplianceProfileFactory",
    "PlatformFactory",
    "Utils",
    "Alertify",
    "$controller",
    "AuthorizationFactory",
  ];

  function ComplianceProfileController(
    $scope,
    $rootScope,
    $translate,
    $http,
    $window,
    $timeout,
    $interval,
    $state,
    ComplianceProfileFactory,
    PlatformFactory,
    Utils,
    Alertify,
    $controller,
    AuthorizationFactory
  ) {
    let $win = $($window);

    let baseCtl = $controller("BaseMultiClusterController", { $scope: $scope });

    baseCtl.doOnClusterRedirected($state.reload);

    const mergeArrays = (p, ...arrays) =>
      []
        .concat(...arrays)
        .reduce(
          (a, b) => (!a.filter((c) => b[p] === c[p]).length ? [...a, b] : a),
          []
        );

    ComplianceProfileFactory.canConfigProfile = AuthorizationFactory.getDisplayFlag(
      "write_compliance_profile"
    );
    $scope.canConfigProfile = ComplianceProfileFactory.canConfigProfile;
    $scope.isNamespaceUserOnly =
      AuthorizationFactory.userPermission.isNamespaceUser;
    console.log($scope.isNamespaceUserOnly);
    activate();
    function activate() {
      ComplianceProfileFactory.prepareGrids();
      PlatformFactory.prepareGrids();
      $scope.profileGridOptions = ComplianceProfileFactory.getGridOptions();
      $scope.domainGridOptions = PlatformFactory.getDomainGridOptions();
      $scope.profileGridOptions.onGridReady = (params) => {
        setTimeout(() => {
          params.api.sizeColumnsToFit();
          params.api.resetRowHeights();
        }, 500);
        $win.on("resize.#agGrid", () => {
          setTimeout(() => {
            params.api.sizeColumnsToFit();
            params.api.resetRowHeights();
          }, 300);
        });
      };

      let getEntityName = function (count) {
        return Utils.getEntityName(
          count,
          $translate.instant("cis.COUNT_POSTFIX")
        );
      };

      const found = $translate.instant("enum.FOUND");

      $scope.profileGridOptions.onSelectionChanged = () => {
        if ($scope.profileGridOptions && $scope.profileGridOptions.api) {
          $scope.onAccept = false;
          $scope.selectRows = $scope.profileGridOptions.api.getSelectedRows();
          if ($scope.selectRows && $scope.selectRows.length > 0) {
            $scope.onAccept = true;
            setTimeout(function () {
              $scope.$apply();
            }, 50);
          }
        }
      };

      $scope.templateOption = {
        all: true,
        pci: false,
        gdpr: false,
        hipaa: false,
        nist: false,
        disabled: false,
      };
      $scope.regulations = [];
      $scope.updatedBenchSet = new Set();

      $scope.profileGridOptions.isExternalFilterPresent = function () {
        return !$scope.templateOption.all;
      };

      $scope.profileGridOptions.doesExternalFilterPass = function (node) {
        if (
          node.data.tags &&
          node.data.tags.length > 0 &&
          $scope.regulations.length > 0
        )
          return !!node.data.tags.find(
            (tag) =>
              !!$scope.regulations.find((regulation) => regulation === tag)
          );
        else return false;
      };

      $scope.onFilterChanged = (value) => {
        if (value.toLowerCase() === "level 1")
          $scope.profileGridOptions.api.setQuickFilter("level1");
        else if (value.toLowerCase() === "level 2")
          $scope.profileGridOptions.api.setQuickFilter("level2");
        else $scope.profileGridOptions.api.setQuickFilter(value);
        if(!value)
          $scope.profileGridOptions.api.onFilterChanged();
        let filteredCount = $scope.profileGridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count =
          filteredCount === $scope.benches.length || filteredCount === 0
            ? `${$scope.benches.length} ${getEntityName($scope.benches.length)}`
            : `${found} ${filteredCount} / ${
                $scope.benches.length
              } ${getEntityName($scope.benches.length)}`;
      };

      $scope.onDomainFilterChanged = (value) => {
        $scope.domainGridOptions.api.setQuickFilter(value);
      };

      $scope.filterRegulation = (checked, type) => {
        if (type !== "all") {
          checked
            ? $scope.regulations.push(type)
            : ($scope.regulations = $scope.regulations.filter(
                (item) => item !== type
              ));
        }
        if (checked && type === "all") {
          $scope.regulations.length = 0;
          $scope.templateOption.pci = false;
          $scope.templateOption.gdpr = false;
          $scope.templateOption.hipaa = false;
          $scope.templateOption.nist = false;
        } else {
          $scope.templateOption.all = $scope.regulations.length === 0;
        }

        $scope.profileGridOptions.api.onFilterChanged();
        let filteredCount = $scope.profileGridOptions.api.getModel().rootNode
          .childrenAfterFilter.length;
        $scope.count = `${found} ${filteredCount} / ${
          $scope.benches.length
        } ${getEntityName($scope.benches.length)}`;
      };

      const regulationList = ["GDPR", "HIPAA", "NIST", "PCI"];
      const colorMap = {
        PCI: "green",
        GDPR: "warning",
        HIPAA: "monitor",
        NIST: "inverse",
      };
      const iconMap = {
        _images: "fa-archive",
        _nodes: "fa-server",
        _containers: "fa-square-o",
      };
      const assetNameMap = {
        _images: $translate.instant("cis.report.data.IMAGES"),
        _nodes: $translate.instant("cis.report.data.NODES"),
        _containers: $translate.instant("cis.report.data.CONTAINERS"),
      };

      $scope.templatesTags = regulationList;

      $scope.getLabelClass = (name) => `label-${colorMap[name]}`;

      $scope.getLabelColor = (name) => {
        if ($scope.onDomain) return "label-idle";
        else return `label-${colorMap[name]}`;
      };

      const prepareTags = (domain) => {
        $scope.availableTags = regulationList.filter((item) => {
          if (domain.tags && domain.tags.length > 0) {
            return !!!domain.tags.find((tag) => tag === item);
          } else return true;
        });
        console.log($scope.availableTags);
        $scope.tags = domain.tags === null ? [] : angular.copy(domain.tags);
      };

      $scope.editRegulation = (event, bench) => {
        $scope.onEdit = true;
        $scope.bench = bench;

        prepareTags(bench);
      };

      $scope.getAssetIcon = (name) => {
        if ($scope.onAsset) return iconMap[name];
        else return "fa-building-o";
      };

      $scope.updateAsset = (asset) => {
        $scope.onAsset = true;
        $scope.onDomainEdit = true;
        $scope.domain = asset;
        $scope.domain.displayName = assetNameMap[asset.name];
        prepareTags(asset);
      };

      $scope.editTemplate = (event, domain) => {
        event.stopPropagation();
        $scope.onDomainEdit = true;
        $scope.domain = domain;
        $scope.domain.displayName = domain.name;
        $scope.onAsset = false;
        prepareTags(domain);
      };

      $scope.addTag = (tag) => {
        $scope.availableTags = $scope.availableTags
          .filter((item) => item !== tag)
          .sort();
        $scope.tags.push(tag);
        $scope.tags.sort();
      };

      $scope.removeTag = (tag) => {
        $scope.availableTags.push(tag);
        $scope.availableTags.sort();
        $scope.tags = $scope.tags.filter((item) => item !== tag).sort();
      };

      $scope.save = (bench) => {
        bench.tags = $scope.tags;
        $scope.updatedBenchSet.add(bench.test_number);
        bench.modified = true;
        let rowId = $scope.benches.findIndex(
          (item) => item.test_number === bench.test_number
        );
        let rowNode = $scope.profileGridOptions.api.getRowNode(rowId);
        $scope.profileGridOptions.api.redrawRows({ rowNodes: [rowNode] });
        $scope.onEdit = false;
      };

      $scope.onToggleSys = () => {
        $scope.updatedBenchSet.has("disable_system")
          ? $scope.updatedBenchSet.delete("disable_system")
          : $scope.updatedBenchSet.add("disable_system");
        $scope.onAccept = $scope.updatedBenchSet.size > 0;
      };

      const callback = () => {
        $scope.updatedBenchSet = new Set();
        $scope.refresh();
      };

      $scope.itemChanged = (bench) =>
        $scope.updatedBenchSet.has(bench.test_number);

      $scope.accept = () => {
        console.log($scope.lastEntries);

        let entries = $scope.benches
          .filter((bench) => bench.modified)
          .map((bench) => {
            return {
              test_number: bench.test_number,
              tags: bench.tags,
            };
          });
        const finalEntries = mergeArrays(
          "test_number",
          entries,
          $scope.lastEntries
        );
        const payload = {
          name: $scope.profile.name,
          disable_system: $scope.profile.disable_system,
          entries: finalEntries,
        };
        ComplianceProfileFactory.saveTemplate(payload, callback);
      };

      $scope.resetTemplate = () => {
        const payload = {
          name: $scope.profile.name,
          disable_system: $scope.profile.disable_system,
          entries: [],
        };
        ComplianceProfileFactory.resetTemplate(payload, callback);
      };

      const resourceList = ["_images", "_nodes", "_containers"];
      $scope.getDomains = () => {
        $scope.onEdit = false;
        $scope.hasDomain = true;
        $scope.images = { name: "_images", tags: [] };
        $scope.nodes = { name: "_nodes", tags: [] };
        $scope.containers = { name: "_containers", tags: [] };

        PlatformFactory.getDomains()
          .then((response) => {
            setTimeout(() => {
              $scope.onDomain = response.tag_per_domain;
              $scope.images = response.domains.find(
                (domain) => domain.name === "_images"
              );
              $scope.nodes = response.domains.find(
                (domain) => domain.name === "_nodes"
              );
              $scope.containers = response.domains.find(
                (domain) => domain.name === "_containers"
              );
              $scope.domains = response.domains.filter(
                (domain) => !resourceList.includes(domain.name)
              );
              $scope.hasDomain = !!$scope.domains.length;
              $scope.domainGridOptions.api.setRowData($scope.domains);
              $scope.domainGridOptions.columnApi.setColumnVisible(
                "action",
                $scope.onDomain
              );
              $scope.domainGridOptions.api.sizeColumnsToFit();
            }, 50);
          })
          .catch((err) => {
            console.error(err);
            $scope.domains = [];
            $scope.domainGridOptions.api.setRowData($scope.domains);
          });
      };

      $scope.toggleAction = () => {
        console.log($scope.onDomain);
        $scope.onDomain = !$scope.onDomain;
        $scope.domainGridOptions.columnApi.setColumnVisible(
          "action",
          $scope.onDomain
        );
        $scope.domainGridOptions.api.sizeColumnsToFit();

        const payload = { tag_per_domain: $scope.onDomain };
        PlatformFactory.toggleDomainTagging(payload).then(() => {
          $scope.onDomainEdit = false;
        });
      };

      $scope.onTemplates = () => $scope.onDomainEdit = false;

      $scope.saveTemplate = (domain) => {
        domain.tags = $scope.tags;
        const payload = {
          name: domain.name,
          tags: domain.tags,
        };
        PlatformFactory.updateDomain(payload).then(() => {
          let rowId = $scope.domains.findIndex(
            (item) => item.name === domain.name
          );
          let rowNode = $scope.domainGridOptions.api.getRowNode(rowId);
          $scope.domainGridOptions.api.redrawRows({ rowNodes: [rowNode] });
          $scope.onDomainEdit = false;
        });
      };

      $scope.refresh = () => {
        $scope.gridErr = false;
        Promise.all([
          ComplianceProfileFactory.getProfile(),
          ComplianceProfileFactory.getComplianceList(),
        ])
          .then(([profile, benchList]) => {
            $scope.profile = profile;
            $scope.benches = [];
            if(profile) {
              $scope.lastEntries = profile.entries;
              if (profile.entries && profile.entries.length > 0) {
                $scope.benches = benchList.map((bench) => {
                  const result = profile.entries.find(
                    (entry) => entry.test_number === bench.test_number
                  );
                  if (result) bench.tags = result.tags;
                  return bench;
                });
              } else $scope.benches = benchList;
            }
            $scope.count = `${$scope.benches.length} ${getEntityName(
              $scope.benches.length
            )}`;
            $scope.profileGridOptions.api.setRowData($scope.benches);
          })
          .catch((err) => {
            $scope.gridErr = true;
            console.warn(err);
            $scope.profileGridOptions.api.setRowData();
          });
      };

      $scope.refresh();
    }

    $scope.$on("$locationChangeStart", function ($event, next, current) {
      if (
        $scope.updatedBenchSet &&
        $scope.updatedBenchSet.size > 0 &&
        !confirm($translate.instant("policy.dialog.reminder.MESSAGE"))
      ) {
        $event.preventDefault();
        $scope.selectedIndex = 0;
      }
    });
  }
})();
