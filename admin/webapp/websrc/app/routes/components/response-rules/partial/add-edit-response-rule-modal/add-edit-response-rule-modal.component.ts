import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { map, startWith } from 'rxjs/operators';
import { GlobalConstant } from '@common/constants/global.constant';
import { ResponseRulesService } from '@services/response-rules.service';
import { MapConstant } from '@common/constants/map.constant';
import { UtilsService } from '@common/utils/app.utils';
import { GlobalVariable } from '@common/variables/global.variable';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@services/notification.service';
import { updateGridData, getCfgType } from '@common/utils/common.utils';

export interface AutoCompleteOption {
  name: string;
}

@Component({
  standalone: false,
  selector: 'app-add-edit-response-rule-modal',
  templateUrl: './add-edit-response-rule-modal.component.html',
  styleUrls: ['./add-edit-response-rule-modal.component.scss'],
})
export class AddEditResponseRuleModalComponent implements OnInit {
  private selectedRule: any;
  public formControl4Group = new FormControl();
  public formControl4Criteria = new FormControl();
  public groupOptions: Array<string>;
  private criteriaOptions: [];
  public filteredOptions4Group: Observable<Array<string>>;
  public filteredOptions4Criteria: Observable<string[]>;
  public separatorKeysCodes: number[] = [ENTER, COMMA];
  private enabled: boolean = false;
  public isValidCriteria: boolean = true;
  public type: string = '';
  public events: Array<string> = [];
  public actions: Array<string> = [];
  public responseRule: any;
  private fullCriteriaList: string[];
  public conditionPatternSample: string = '';
  public isWebhookSelected: boolean = false;
  public webhookOptions: Array<string> = [];
  public selectedResponseRule: any;
  EVENT_WITHOUT_GROUP = MapConstant.EVENT_WITHOUT_GROUP;
  @ViewChild('criteriaInput', { static: false })
  appsInput: ElementRef<HTMLInputElement>;
  @ViewChild('autoCriteria', { static: false })
  matAutocomplete: MatAutocomplete;
  shouldHideWebhookList: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddEditResponseRuleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private responseRulesService: ResponseRulesService,
    private utils: UtilsService,
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    console.log(this.data.autoCompleteData);
    this.type = this.data.type;
    this.prepareEventDropdown();
    this.InitializeVM(this.events[0]);
    this.prepareCriteriaSample(this.events[0]);
    if (this.type !== GlobalConstant.MODAL_OP.ADD) {
      this.prepareExistingValue4Update();
    }
    this.prepareActions(this.responseRule.event);
    this.prepareGroupAutoComplete();
    this.prepareCriteriaAutoComplete(this.responseRule.event);
  }

  InitializeVM = event => {
    this.responseRule = {
      id:
        this.responseRulesService.index4Add === -1
          ? 0
          : this.responseRulesService.responseRules[
              this.responseRulesService.index4Add
            ].id,
      event: event,
      group:
        GlobalConstant.NAV_SOURCE.FED_POLICY && GlobalVariable.selectedFedGroup
          ? { name: GlobalVariable.selectedFedGroup }
          : '',
      comment: '',
      criteria: [],
      actions: [false, false, false],
      enabled: true,
    };
  };

  private mapWebwooks = (
    webhooks: Array<string>,
    webhookOptions: Array<string>
  ): Array<boolean> => {
    return webhookOptions.map(option => {
      return webhooks.includes(option);
    });
  };

  prepareExistingValue4Update = () => {
    this.selectedResponseRule =
      this.responseRulesService.responseRules[
        this.responseRulesService.index4Edit
      ];
    this.prepareActions(this.selectedResponseRule.event);
    this.prepareCriteriaSample(this.selectedResponseRule.event);
    this.responseRule.id = this.selectedResponseRule.id;
    this.responseRule.event = this.selectedResponseRule.event;
    this.responseRule.group = this.selectedResponseRule.group;
    this.responseRule.comment = this.selectedResponseRule.comment;
    this.responseRule.enabled = this.selectedResponseRule.disable
      ? !this.selectedResponseRule.disable
      : true;
    this.responseRule.criteria = this.selectedResponseRule.conditions
      .split(', ')
      .filter(condition => !!condition);
    this.selectedResponseRule.actions.forEach(action => {
      this.responseRule.actions[this.actions.indexOf(action)] = true;
    });
    this.isWebhookSelected =
      this.selectedResponseRule.actions.includes('webhook');
    this.shouldHideWebhookList =
      this.type === GlobalConstant.MODAL_OP.EDIT &&
      (this.selectedResponseRule.cfg_type === GlobalConstant.CFG_TYPE.FED ||
        this.selectedResponseRule.cfg_type ===
          GlobalConstant.CFG_TYPE.GROUND) &&
      this.data.isReadonly &&
      this.data.source !== GlobalConstant.NAV_SOURCE.FED_POLICY;
  };

  prepareActions = event => {
    this.actions =
      GlobalConstant.RESPONSE_RULE[MapConstant.responseRuleActionMap[event]];
  };

  prepareCriteriaSample = event => {
    this.conditionPatternSample =
      MapConstant.responseRuleCriteriaSampleMap[event];
  };

  prepareEventDropdown = () => {
    this.events = GlobalConstant.RESPONSE_RULE.EVENTS_K8S; //TODO: Docker should use GlobalConstant.RESPONSE_RULE.EVENTS
  };

  prepareGroupAutoComplete = () => {
    this.groupOptions = (
      this.data.autoCompleteData[0] !== 'Error'
        ? this.data.autoCompleteData[0]
            .map(group => {
              return group.name;
            })
            .filter(
              groupName => groupName.toLowerCase() !== GlobalConstant.EXTERNAL
            )
        : []
    ).sort();
    this.filteredOptions4Group = this.formControl4Group.valueChanges.pipe(
      startWith(''),
      map(name =>
        name
          ? this._filter4Groups(name, this.groupOptions)
          : this.groupOptions.slice()
      )
    );
  };

  prepareCriteriaAutoComplete = event => {
    this.webhookOptions =
      this.data.autoCompleteData[1] !== 'Error'
        ? this.data.autoCompleteData[1].webhooks
        : [];
    this.responseRule.webhooks = this.mapWebwooks(
      this.selectedResponseRule ? this.selectedResponseRule.webhooks : [],
      this.webhookOptions
    );

    this.criteriaOptions =
      this.data.autoCompleteData[1] !== 'Error'
        ? this.data.autoCompleteData[1].response_rule_options
        : [];
    this.responseRulesService.conditionOptions = this.criteriaOptions;
    this.fullCriteriaList = AddEditResponseRuleModalComponent.buildCriteriaList(
      this.criteriaOptions,
      event
    );
    this.filteredOptions4Criteria = this.formControl4Criteria.valueChanges.pipe(
      startWith(''),
      map((criterion: string) =>
        criterion
          ? this._filter4Criteria(criterion, event)
          : this.preventDuplicated(
              this.responseRule.criteria,
              this.fullCriteriaList
            ).slice()
      )
    );
  };

  private _filter4Groups = (
    name: string,
    options: Array<string>
  ): Array<string> => {
    const filterValue = name.toLowerCase();
    return options.filter(
      option => option.toLowerCase().indexOf(filterValue) >= 0
    );
  };

  private preventDuplicated = (criteria: string[], options: string[]) =>
    options.filter(option => {
      return !criteria.includes(option);
    });

  private _filter4Criteria = (value: string, event: string): string[] => {
    const appValue = value.toLowerCase();
    return this.preventDuplicated(
      this.responseRule.criteria,
      this.fullCriteriaList
    ).filter(criterion => criterion.toLowerCase().indexOf(appValue) >= 0);
  };

  private static buildCriteriaList(options, event) {
    let name = options[event].name ? options[event].name : [];
    let level = options[event].level ? options[event].level : [];
    let list = name.concat(level);
    return list.sort();
  }

  onCancel = () => {
    this.dialogRef.close();
  };

  displayFn = (autoCompleteOption?: AutoCompleteOption): string | undefined =>
    autoCompleteOption ? autoCompleteOption.name : undefined;

  changeEvent = event => {
    this.InitializeVM(event);
    this.prepareCriteriaAutoComplete(event);
    this.prepareCriteriaSample(event);
    this.prepareActions(event);
  };

  criterionSelectedInChip = (event: MatAutocompleteSelectedEvent): void => {
    this.responseRule.criteria.push(event.option.viewValue);
    this.appsInput.nativeElement.value = '';
    this.formControl4Criteria.setValue(null);
  };

  addCriterionIntoChip = (event: MatChipInputEvent): void => {
    const input = event.input;
    const value = event.value.trim();
    if (!this.matAutocomplete.isOpen && this.validateChipElement(value)) {
      if ((value || '').trim()) {
        this.responseRule.criteria.push(value);
      }

      if (input) {
        input.value = '';
      }

      this.formControl4Criteria.setValue(null);
    }
  };

  private validateChipElement = value => {
    let result = this.responseRulesService
      .getPattern(this.responseRule.event)
      .test(value);
    console.log(
      'Pattern: ' +
        this.responseRulesService.getPattern(this.responseRule.event) +
        '\n',
      'Tag name: ' + value + '\n',
      'Test result: ' + result
    );
    this.isValidCriteria = result;
    return result;
  };

  removeCriterionFromChip = (app: string): void => {
    const index = this.responseRule.criteria.indexOf(app);

    if (index >= 0) {
      this.responseRule.criteria.splice(index, 1);
      console.log(this.responseRule.criteria);
      this.prepareCriteriaAutoComplete(this.responseRule.event);
    }
  };

  onActionsSelected = (actionVerification: Array<boolean>): void => {
    this.isWebhookSelected =
      actionVerification[
        this.actions.findIndex(action => action === 'webhook')
      ];
  };

  submitRule = () => {
    let typeText =
      this.type === GlobalConstant.MODAL_OP.ADD
        ? ['added', 'adding']
        : ['updated', 'updating'];
    this.responseRulesService
      .insertUpdateResponseRuleData(
        this.responseRule,
        this.actions,
        this.type,
        this.webhookOptions
      )
      .subscribe(
        response => {
          this.onCancel();
          this.notificationService.open(
            this.type === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant(
                  'responsePolicy.dialog.content.INSERT_OK'
                )
              : this.translate.instant(
                  'responsePolicy.dialog.content.UPDATE_OK'
                )
          );
          if (this.type === GlobalConstant.MODAL_OP.ADD) {
            setTimeout(() => {
              this.data.refresh();
            }, 1000);
          } else {
            updateGridData(
              this.responseRulesService.responseRules,
              [
                {
                  id: this.responseRule.id,
                  event: this.responseRule.event,
                  // comment: Option[String],
                  group: this.responseRule.group || '',
                  conditions: this.responseRulesService.parseConditions(
                    this.responseRule.criteria
                  ),
                  actions: this.responseRulesService.filterSelectedOptions(
                    this.responseRule.actions,
                    this.actions
                  ),
                  disable: !this.responseRule.enabled,
                  cfg_type:
                    this.data.source === GlobalConstant.NAV_SOURCE.FED_POLICY
                      ? GlobalConstant.CFG_TYPE.FED
                      : GlobalConstant.CFG_TYPE.CUSTOMER,
                  webhooks: this.responseRulesService.filterSelectedOptions(
                    this.responseRule.webhooks,
                    this.webhookOptions
                  ),
                },
              ],
              this.data.gridApi,
              'id',
              'edit'
            );
          }
        },
        error => {
          this.notificationService.openError(
            error.error,
            this.type === GlobalConstant.MODAL_OP.ADD
              ? this.translate.instant(
                  'responsePolicy.dialog.content.INSERT_NG'
                )
              : this.translate.instant(
                  'responsePolicy.dialog.content.UPDATE_NG'
                )
          );
        }
      );
  };
}
