import {
  Component,
  OnInit,
  Inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { UpdateType } from '@common/types/network-rules/enum';
import { NetworkRulesService } from '@services/network-rules.service';


@Component({
  standalone: false,
  selector: 'app-add-edit-network-rule-modal',
  templateUrl: './add-edit-network-rule-modal.component.html',
  styleUrls: ['./add-edit-network-rule-modal.component.scss'],
  
})
export class AddEditNetworkRuleModalComponent implements OnInit {
  modalOp: any;
  addEditNetworkRuleForm: FormGroup;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredApps: Observable<Array<string>>;
  filteredFromEndpoints: Observable<Array<string>>;
  filteredToEndpoints: Observable<Array<string>>;
  applications: Array<string> = [];
  isAllow: boolean = false;
  enable: boolean = true;
  submittingUpdate: boolean = false;
  @ViewChild('applicationsInput')
  applicationsInput: ElementRef<HTMLInputElement>;

  constructor(
    private networkRulesService: NetworkRulesService,
    public dialogRef: MatDialogRef<AddEditNetworkRuleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.selectedNetworkRule) {
      this.addEditNetworkRuleForm = new FormGroup({
        id: new FormControl(this.data.selectedNetworkRule.id),
        comment: new FormControl(this.data.selectedNetworkRule.comment),
        from: new FormControl(
          this.data.selectedNetworkRule.from,
          Validators.required
        ),
        to: new FormControl(
          this.data.selectedNetworkRule.to,
          Validators.required
        ),
        applicationsCtrl: new FormControl(),
        ports: new FormControl(this.data.selectedNetworkRule.ports),
      });
      this.applications = JSON.parse(
        JSON.stringify(this.data.selectedNetworkRule.applications)
      );
      this.isAllow =
        this.data.selectedNetworkRule.action ===
        GlobalConstant.PROCESS_PROFILE_RULE.ACTION.ALLOW;
      this.enable = !this.data.selectedNetworkRule.disable;
    } else {
      this.addEditNetworkRuleForm = new FormGroup({
        comment: new FormControl(''),
        from: new FormControl('', Validators.required),
        to: new FormControl('', Validators.required),
        applicationsCtrl: new FormControl(),
        ports: new FormControl(''),
      });
    }
    this.filteredApps = this.addEditNetworkRuleForm
      .get('applicationsCtrl')!
      .valueChanges.pipe(
        startWith(null),
        map((app: string | null) =>
          app
            ? this.filter(
                app,
                this.excludesSelectedApps(
                  this.data.networkRuleOptions.appList,
                  this.applications
                )
              )
            : this.excludesSelectedApps(
                this.data.networkRuleOptions.appList,
                this.applications
              ).slice()
        )
      );
    let enpointList =
      this.data.source === GlobalConstant.NAV_SOURCE.FED_POLICY
        ? this.data.networkRuleOptions.groupList.map(group => group.name)
        : this.data.networkRuleOptions.hostList
            .map(host => `Host:${host.name}`)
            .concat(
              this.data.networkRuleOptions.groupList.map(group => group.name)
            );
    this.filteredFromEndpoints = this.addEditNetworkRuleForm
      .get('from')!
      .valueChanges.pipe(
        startWith(''),
        map((from: string) => this.filter(from, enpointList))
      );
    this.filteredToEndpoints = this.addEditNetworkRuleForm
      .get('to')!
      .valueChanges.pipe(
        startWith(''),
        map((to: string) => this.filter(to, enpointList))
      );
  }

  ngOnInit(): void {
    this.modalOp = GlobalConstant.MODAL_OP;
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  toggleType = () => {};

  removeApp = (app: string) => {
    const index = this.applications.indexOf(app);
    if (index >= 0) {
      this.applications.splice(index, 1);
      this.addEditNetworkRuleForm.get('applicationsCtrl')!.setValue(null);
    }
  };

  selected = (event: MatAutocompleteSelectedEvent) => {
    this.applications.push(event.option.viewValue);
    this.applicationsInput.nativeElement.value = '';
    this.addEditNetworkRuleForm.get('applicationsCtrl')!.setValue(null);
  };

  private filter = (
    value: string,
    availableOptions: Array<string>
  ): Array<string> => {
    const filterValue = value.toLowerCase();
    return availableOptions.filter(availableOption =>
      availableOption.toLowerCase().includes(filterValue)
    );
  };

  private excludesSelectedApps = (
    appOptionList: Array<string>,
    applications: Array<string>
  ): Array<string> => {
    return appOptionList.filter(appOption => {
      return (
        applications
          .map(app => app.toLowerCase())
          .indexOf(appOption.toLowerCase()) < 0
      );
    });
  };

  updateRule = () => {
    this.submittingUpdate = true;
    if (this.data.opType === this.modalOp.EDIT) {
      let payload = this.getUpdatedPayload();
      this.data.updateGridData([payload], this.data.index, UpdateType.Edit);
    } else {
      let payload = this.getAddedPayload();
      this.data.updateGridData(
        [payload],
        this.data.index + 1,
        UpdateType.Insert
      );
    }
    this.submittingUpdate = false;
    this.dialogRef.close(true);
  };

  private getAddedPayload = () => {
    return {
      ...this.addEditNetworkRuleForm.value,
      applications: this.applications,
      action: this.isAllow
        ? GlobalConstant.PROCESS_PROFILE_RULE.ACTION.ALLOW
        : GlobalConstant.PROCESS_PROFILE_RULE.ACTION.DENY,
      state: GlobalConstant.NETWORK_RULES_STATE.NEW,
      disable: false,
      learned: false,
      id: this.networkRulesService.squence++,
    };
  };

  private getUpdatedPayload = () => {
    return {
      ...this.addEditNetworkRuleForm.value,
      applications: this.applications,
      action: this.isAllow
        ? GlobalConstant.PROCESS_PROFILE_RULE.ACTION.ALLOW
        : GlobalConstant.PROCESS_PROFILE_RULE.ACTION.DENY,
      state:
        this.addEditNetworkRuleForm.value.id >=
        GlobalConstant.NEW_ID_SEED.NETWORK_RULE
          ? GlobalConstant.NETWORK_RULES_STATE.NEW
          : GlobalConstant.NETWORK_RULES_STATE.MODIFIED,
      disable: !this.enable,
      learned: false,
    };
  };
}
