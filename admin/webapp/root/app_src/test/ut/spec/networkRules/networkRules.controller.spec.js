
describe('Network rule - ', function() {
  let PolicyController;
  let DialogController;
  let BaseMultiClusterController;
  let $scope;
  let $scope2;
  let $mdDialog;
  let $sanitize;
  let _policyService;
  let policyService2;
  let spy;
  // const input = network_rules_controller_input;
  // const output = network_rules_controller_output;
  // let UiFramework;
  beforeEach(angular.mock.module('app.assets'));
  beforeEach(angular.mock.module('app.utils'));
  beforeEach(angular.mock.module('app.common'));


  //Make mock for dependencies
  beforeEach(module('app.assets', ($provide) => {
    // emulation of making translate mock
    const injector = angular.injector(['ng']),
    $q = injector.get('$q');

    let $translateMock = jasmine.createSpy().and.callFake(() => $q.when());

    $translateMock.storageKey = () => '';
    $translateMock.storage = () => { get: () => ''; };
    $translateMock.preferredLanguage = function () {
      return 'en';
    };
    $translateMock.use = () => '';
    $translateMock.instant = () => '';
    $translateMock.refresh = () => '';

    let $mdDialogMock = jasmine.createSpy().and.callFake(() => $q.when());
    $mdDialogMock.show = ({
      controller,
      templateUrl,
      targetEvent
    }) => {
      DialogController = controller;
      return {
        then: function (callBack) {
                callBack(true); //return the value to be assigned.
              }
      }
    };

    let $mdToastMock = jasmine.createSpy().and.callFake(() => $q.when());

    let $stateMock = jasmine.createSpy().and.callFake(() => $q.when());

    let alertifyMock = jasmine.createSpy().and.callFake(() => $q.when());
    alertifyMock.confirm = (msg) => {
      return {
        then: (ok, ng) => {
          ok();
        }
      };
    };
    alertifyMock.set = (obj) => {};
    alertifyMock.success = (str) => {};

    let utilsMock = jasmine.createSpy().and.callFake(() => $q.when());
    utilsMock.keepAlive = (success, error) => {
      success();
    };
    utilsMock.getEntityName = (str) => {};

    let $sanitizeMock = jasmine.createSpy().and.callFake(() => $q.when());
    let authorizationFactoryMock = jasmine.createSpy().and.callFake(() => $q.when());
    authorizationFactoryMock.getDisplayFlag = (permission) => true;
    let fileSaverMock = jasmine.createSpy().and.callFake(() => $q.when());

    $provide.value('$translate', $translateMock);
    $provide.value('$mdDialog', $mdDialogMock);
    $provide.value('Alertify', alertifyMock);
    $provide.value('Utils', utilsMock);
    $provide.value('$mdToast', $mdToastMock);
    $provide.value('$state', $stateMock);
    $provide.value('$sanitize', $sanitizeMock);
    $provide.value('FileSaver', fileSaverMock);
    $provide.value('AuthorizationFactory', authorizationFactoryMock);
  }));

  //Instantiate main controller
	beforeEach(function(){
    inject(function(
      $httpBackend,
      $rootScope,
      $controller,
      $timeout,
      $translate,
      $http,
      $mdDialog,
      $window,
      Alertify,
      policyService,
      Utils,
      $filter,
      $sanitize,
      AuthorizationFactory,
      $mdToast,
      $state,
      FileSaver
    ) {
      $scope = $rootScope.$new();
      $scope2 = $rootScope.$new();
      _policyService = policyService;

      $httpBackend.expectGET("/group-list?scope=local").respond(200);
      $httpBackend.expectPATCH("/policy?scope=local").respond(200);

      $rootScope.toastWarnings = () => {};

      BaseMultiClusterController = $controller('BaseMultiClusterController', {
        $rootScope,
        $scope,
        $http,
        $mdToast,
        $translate
      });

      PolicyController = $controller('PolicyController', {
        $rootScope,
        $scope,
        $state,
        $timeout,
        $translate,
        $http,
        $mdDialog,
        _policyService,
        Alertify,
        FileSaver,
        $window,
        Utils,
        $filter,
        $sanitize,
        $controller,
        AuthorizationFactory
      });

      $scope.gridOptions.api = {
        getDisplayedRowAtIndex: () => {
          const setSelected = (isSelected) => {};
          return {
            setSelected
          }
        },
        refreshInfiniteCache: () => {},
        redrawRows: () => {},
        setRowData: () => {},
        deselectAll: () => {},
        ensureIndexVisible: () => {}
      };
    });
	});

  it('Add rule to top', function() {
    console.info("Add rule to top");
    policyService2 = _policyService;
    policyService2.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(policyService2.rules);
    console.log("Before added: ", JSON.stringify(policyService2));
    //Open Add rule dialog
    $scope.addPolicy(null, -1);
    console.log("Insert position: ", policyService2.index4Add);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.selectedItemFrom = {value: networkRulesController.input.insertRule_1.from};
    $scope2.selectedItemTo = {value: networkRulesController.input.insertRule_1.to};
    console.log("From->to: ", $scope2.selectedItemFrom, $scope2.selectedItemTo)
    $scope2.newRule = networkRulesController.input.insertRule_1;
    //Click add rule button in Add rule dialog
    $scope2.addNewRule();
    console.log("After added", JSON.stringify(policyService2));
    //Submit all the changes
    $scope.submit();
    console.log("Actual result: ", JSON.stringify($scope.payload));
    expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case1));
    console.log();
  });

  it('Edit rule', function() {
    console.info("Edit rule");
    policyService2 = _policyService;
    policyService2.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(policyService2.rules);
    console.log("Before edited: ", JSON.stringify(policyService2));
    //Open Edit rule dialog
    $scope.editPolicy(null, 2);
    console.log("Edit position: ", policyService2.index4edit);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    //Changed a field
    $scope2.editComment = "test edit";
    //Click add rule button in Add rule dialog
    $scope2.editRule();
    console.log("After edited", JSON.stringify(policyService2));
    //Submit all the changes
    $scope.submit();
    console.log("Actual result: ", JSON.stringify($scope.payload));
    expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case2));
    console.log();
  });

  it('Delete rule', inject(function($timeout) {
    console.info("Delete rule");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 10004);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
      $scope.payload = null;
      $scope.submit();
      console.log("Actual result: ", JSON.stringify($scope.payload));
      expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case3));
    }, 300);
    $timeout.flush();
    console.log();
  }));

  it('Undelete rule', inject(function($timeout) {
    console.info("Undelete rule");
    policyService2 = _policyService;
    policyService2.rules = angular.copy(networkRulesController.input.initialRules);
    policyService2.rulesBackup = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(policyService2.rules);
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 2);
    $scope.deleteRuleItem({target:{id: ""}}, 10004);
    $timeout(() => {
      console.log("After deleted", JSON.stringify(policyService2));
      $scope.undeleteRuleItem({target:{id: ""}}, 10004);
      $timeout(() => {
        console.log("After undeleted", JSON.stringify(policyService2));
        $scope.submit();
        console.log("Actual result: ", JSON.stringify($scope.payload));
        expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case4));
      }, 300);
      $timeout.flush();
    }, 300);
    $timeout.flush();
    console.log();
  }));

  it('Move rule', function() {
    console.info("Move rule");
    policyService2 = _policyService;
    policyService2.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(policyService2.rules);
    console.log("Before moved: ", JSON.stringify(policyService2));
    document.getElementById = jasmine.createSpy().and.callFake((id) => {
      switch(id) {
        case "before": return {value: ""};
        case "after": return {value: "2"};
        case "policy-move-list": return {click: () => {}};
      }
    });
    $scope.selectedRules = networkRulesController.input.selectedRules_1;
    $scope.moveRules();
    console.log("After moved", JSON.stringify(policyService2));
    $scope.submit();
    console.log("Actual result: ", JSON.stringify($scope.payload));
    expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case5));
    console.log();
  });

  it('Multi-operations for rule', inject(function($timeout) {
    console.info("Multi-operations for rule");
    /*
      0. Existing rules [10004, 2, 3, 10001]
      1. Add one rule to top [0(New), 10004, 2, 3, 10001]
      2. Modifiy one rule "10003" [0(New), 10004, 2, 3(Modified), 10001]
      3. Insert one rule after "2" [0(New), 10004, 2, 0(New), 3(Modified), 10001]
      5. Delete 2 rules "10004", "100002" [0(New), 10004(Removed), 2(Removed), 0(New), 3(Modified), 10001]
      6. Undelete one rule "10004" [0(New), 10004, 2(Removed), 0(New), 3(Modified), 10001]
      7. Move "10001", "3" before "100002" [0(New), 10004, 3(Modified), 10001(Moved), 2(Removed), 0(New)]
      8. Move "10004" after "3" [0(New), 3(Modified), 10004(Moved), 10001(Moved), 2(Removed), 0(New)]

      X.Submit [0(Details), 3(Details), 10004(ID only), 10001(ID only), 0(Details)]
    */
    policyService2 = _policyService;
    policyService2.rules = angular.copy(networkRulesController.input.initialRules);
    policyService2.rulesBackup = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(policyService2.rules);
    console.log("Before Operated: ", JSON.stringify(policyService2));
    // Operation1:
    $scope.addPolicy(null, -1);
    console.log("Insert position: ", policyService2.index4Add);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.selectedItemFrom = {value: networkRulesController.input.insertRule_1.from};
    $scope2.selectedItemTo = {value: networkRulesController.input.insertRule_1.to};
    console.log("From->to: ", $scope2.selectedItemFrom, $scope2.selectedItemTo)
    $scope2.newRule = networkRulesController.input.insertRule_1;
    $scope2.addNewRule();
    console.log("After added", JSON.stringify(policyService2.rules));
    // Oeration2:
    $scope.editPolicy(null, 3);
    console.log("Edit position: ", policyService2.index4edit);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.editComment = "test edit, Multiple";
    $scope2.editRule();
    console.log("After edited", JSON.stringify(policyService2.rules));
    // Operation3:
    $scope.addPolicy(null, 2);
    console.log("Insert position: ", policyService2.index4Add);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.selectedItemFrom = {value: networkRulesController.input.insertRule_2.from};
    $scope2.selectedItemTo = {value: networkRulesController.input.insertRule_2.to};
    console.log("From->to: ", $scope2.selectedItemFrom, $scope2.selectedItemTo)
    $scope2.newRule = networkRulesController.input.insertRule_2;
    $scope2.addNewRule();
    console.log("After added2", JSON.stringify(policyService2.rules));
    // Operatino4:
    $scope.deleteRuleItem({target:{id: ""}}, 2);
    console.log("Delete position: ", policyService2.index4Delete);
    $scope.selectedRules = networkRulesController.input.selectedRules_1;
    $scope.deleteRuleItem({target:{id: "remove-selected-row"}});
    console.log("Delete position: ", policyService2.index4Delete);
    $timeout(() => {
      console.log("After deleted", JSON.stringify(policyService2.rules));
      $scope.undeleteRuleItem({target:{id: ""}}, 10004);
      $timeout(() => {
      console.log("After undeleted", JSON.stringify(policyService2.rules));
    // Operation 5:
        $scope.selectedRules = networkRulesController.input.selectedRules_2;
        document.getElementById = jasmine.createSpy().and.callFake((id) => {
          switch(id) {
            case "before": return {value: "2"};
            case "after": return {value: ""};
            case "policy-move-list": return {click: () => {}};
          }
        });
        $scope.moveRules();
        console.log("After moved1", JSON.stringify(policyService2.rules));
        $scope.selectedRules = networkRulesController.input.selectedRules_1;
        document.getElementById = jasmine.createSpy().and.callFake((id) => {
          switch(id) {
            case "before": return {value: ""};
            case "after": return {value: "3"};
            case "policy-move-list": return {click: () => {}};
          }
        });
        $scope.moveRules();
        console.log("After operated", JSON.stringify(policyService2));
        $scope.submit();
        console.log("Actual result: ", JSON.stringify($scope.payload));
        console.log("Expected result: ", JSON.stringify(networkRulesController.output.case6));
        expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case6));
      }, 400);
      $timeout.flush();
    }, 400);
    $timeout.flush();
    console.log();
  }));

  it('Delete rule - only delete', inject(function($timeout) {
    console.info("Delete rule - only delete");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 10004);
    $scope.deleteRuleItem({target:{id: ""}}, 2);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
      $scope.payload = null;
      $scope.submit();
      console.log("Actual result: ", JSON.stringify($scope.payload));
      expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case7));
    }, 300);
    $timeout.flush();
    console.log();
  }));

  it('Delete rule - add then delete', inject(function($timeout) {
    console.info("Delete rule - add then delete");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    //Add rule
    $scope.addPolicy(null, 2);
    console.log("Insert position: ", policyService2.index4Add);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.selectedItemFrom = {value: networkRulesController.input.insertRule_2.from};
    $scope2.selectedItemTo = {value: networkRulesController.input.insertRule_2.to};
    console.log("From->to: ", $scope2.selectedItemFrom, $scope2.selectedItemTo)
    $scope2.newRule = networkRulesController.input.insertRule_2;
    $scope2.addNewRule();
    console.log("After added2", JSON.stringify(policyService2.rules));
    //Delete rule
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 3);
    $scope.deleteRuleItem({target:{id: ""}}, 2);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
      $scope.payload = null;
      $scope.submit();
      console.log("Actual result: ", JSON.stringify($scope.payload));
      expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case8));
    }, 300);
    $timeout.flush();
    console.log();
  }));

  it('Delete rule - edit then delete', inject(function($timeout) {
    console.info("Delete rule - edit then delete");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    // Edit rule
    $scope.editPolicy(null, 3);
    console.log("Edit position: ", policyService2.index4edit);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.editComment = "test edit, Multiple";
    $scope2.editRule();
    console.log("After edited", JSON.stringify(policyService2.rules));
    // Delete rule
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 10004);
    $scope.deleteRuleItem({target:{id: ""}}, 2);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
      $scope.payload = null;
      $scope.submit();
      console.log("Actual result: ", JSON.stringify($scope.payload));
      expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case9));
    }, 300);
    $timeout.flush();
    console.log();
  }));

  it('Delete rule - move then delete', inject(function($timeout) {
    console.info("Delete rule - move then delete");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    // Move rule
    document.getElementById = jasmine.createSpy().and.callFake((id) => {
      switch(id) {
        case "before": return {value: ""};
        case "after": return {value: "2"};
        case "policy-move-list": return {click: () => {}};
      }
    });
    $scope.selectedRules = networkRulesController.input.selectedRules_1;
    $scope.moveRules();
    console.log("After moved", JSON.stringify(policyService2));
    // Delete rule
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 3);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
      $scope.payload = null;
      $scope.submit();
      console.log("Actual result: ", JSON.stringify($scope.payload));
      expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case10));
    }, 300);
    $timeout.flush();
    console.log();
  }));

  it('Delete rule - delete then add', inject(function($timeout) {
    console.info("Delete rule - delete then add");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    //Delete rule
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 3);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
    }, 300);
    $timeout.flush();
    //Add rule
    $scope.addPolicy(null, 2);
    console.log("Insert position: ", policyService2.index4Add);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.selectedItemFrom = {value: networkRulesController.input.insertRule_2.from};
    $scope2.selectedItemTo = {value: networkRulesController.input.insertRule_2.to};
    console.log("From->to: ", $scope2.selectedItemFrom, $scope2.selectedItemTo)
    $scope2.newRule = networkRulesController.input.insertRule_2;
    $scope2.addNewRule();
    console.log("After added2", JSON.stringify(policyService2.rules));
    $scope.payload = null;
    $scope.submit();
    console.log("Actual result: ", JSON.stringify($scope.payload));
    expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case11));
    console.log();
  }));

  it('Delete rule - edit then delete', inject(function($timeout) {
    console.info("Delete rule - edit then delete");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    // Delete rule
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 10004);
    $scope.deleteRuleItem({target:{id: ""}}, 2);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
    }, 300);
    $timeout.flush();
    // Edit rule
    $scope.editPolicy(null, 3);
    console.log("Edit position: ", policyService2.index4edit);
    DialogController($scope2, $mdDialog, $sanitize, policyService2);
    $scope2.editComment = "test edit, Multiple";
    $scope2.editRule();
    console.log("After edited", JSON.stringify(policyService2.rules));
    $scope.payload = null;
    $scope.submit();
    console.log("Actual result: ", JSON.stringify($scope.payload));
    expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case9));
    console.log();
  }));

  it('Delete rule - delete then move', inject(function($timeout) {
    console.info("Delete rule - delete then move");
    policyService2 = _policyService;
    _policyService.rules = angular.copy(networkRulesController.input.initialRules);
    $scope.refreshCache(_policyService.rules);
    // Delete rule
    console.log("Before deleted: ", JSON.stringify(policyService2));
    $scope.deleteRuleItem({target:{id: ""}}, 3);
    $timeout(() => {
      console.log("Delete position: ", policyService2.index4Delete);
      console.log("After deleted", JSON.stringify(policyService2));
    }, 300);
    $timeout.flush();
    // Move rule
    document.getElementById = jasmine.createSpy().and.callFake((id) => {
      switch(id) {
        case "before": return {value: ""};
        case "after": return {value: "2"};
        case "policy-move-list": return {click: () => {}};
      }
    });
    $scope.selectedRules = networkRulesController.input.selectedRules_1;
    $scope.moveRules();
    console.log("After moved", JSON.stringify(policyService2));
    $scope.payload = null;
    $scope.submit();
    console.log("Actual result: ", JSON.stringify($scope.payload));
    expect(JSON.stringify($scope.payload)).toEqual(JSON.stringify(networkRulesController.output.case10));
    console.log();
  }));
});
