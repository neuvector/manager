import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SecurityEventsService } from '@common/services/security-events.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalConstant } from '@common/constants/global.constant';
import { MapConstant } from '@common/constants/map.constant';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-review-network-rule-modal',
  templateUrl: './review-network-rule-modal.component.html',
  styleUrls: ['./review-network-rule-modal.component.scss'],
})
export class ReviewNetworkRuleModalComponent implements OnInit {
  isReadOnlyRule: boolean = false;
  submittingUpdate: boolean = false;
  violatedRuleText: string;
  violatedImplicitRuleText: string;
  ruleTypeClass: string;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  ruleForm: FormGroup;
  newAction: boolean = true;

  constructor(
    public dialogRef: MatDialogRef<ReviewNetworkRuleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private securityEventsService: SecurityEventsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    console.log('this.data.networkRule', this.data.networkRule);
    console.log('this.data.secEvent', this.data.secEvent);
    this.isReadOnlyRule =
      this.data.networkRule.cfg_type === this.CFG_TYPE.FED ||
      this.data.networkRule.cfg_type === this.CFG_TYPE.GROUND ||
      this.data.secEvent.reviewRulePermission === 'r';
    if (!this.isReadOnlyRule) {
      this.ruleForm = new FormGroup({
        from: new FormControl(
          this.data.networkRule.id
            ? this.data.networkRule.from
            : this.data.secEvent.endpoint.source.group4Rule
        ),
        to: new FormControl(
          this.data.networkRule.id
            ? this.data.networkRule.to
            : this.data.secEvent.endpoint.destination.group4Rule
        ),
        applications: new FormControl(this.data.secEvent.applications),
        ports: new FormControl(this.data.secEvent.details.serverPort),
      });
      console.log('this.ruleForm', this.ruleForm);
    }
    this.prepareReviewRule();
  }

  prepareReviewRule = () => {
    if (this.data.networkRule.id) {
      this.prepareRegularNetworkRule();
    } else {
      this.prepareImplictNetworkRule();
    }
  };

  private prepareRegularNetworkRule = () => {
    this.violatedRuleText = `${this.translate.instant(
      'securityEvent.VIOLATED_RULE_BRIEF_1',
      {
        id: this.data.networkRule.id,
      }
    )} ${this.translate.instant(
      `securityEvent.${this.data.networkRule.action.toUpperCase()}`
    )}\
    ${
      this.data.networkRule.applications === 'any'
        ? this.translate.instant('securityEvent.ON_ANY_APPS')
        : this.translate.instant('securityEvent.ON_APPS', {
            applications: this.data.networkRule.applications.join(', '),
          })
    }\
    ${
      this.data.networkRule.ports === 'any'
        ? this.translate.instant('securityEvent.ON_ANY_PORTS')
        : this.translate.instant('securityEvent.ON_PORTS', {
            ports: this.data.networkRule.ports,
          })
    }\
    ${this.translate.instant('securityEvent.VIOLATED_RULE_BRIEF_2', {
      from: this.data.networkRule.from,
      to: this.data.networkRule.to,
    })}`;
    this.ruleTypeClass =
      MapConstant.colourMap[this.data.networkRule.cfg_type.toUpperCase()];
  };

  private prepareImplictNetworkRule = () => {
    let srcGroup = this.data.secEvent.endpoint.source.group4Rule;
    let destGroup = this.data.secEvent.endpoint.destination.group4Rule;
    this.violatedImplicitRuleText = this.translate.instant(
      'securityEvent.IMPLICIT_RULE_BRIEF',
      {
        from: srcGroup,
        to: destGroup,
      }
    );
    this.data.networkRule.from = srcGroup;
    this.data.networkRule.to = destGroup;
    this.data.networkRule.applications = [];
    this.data.networkRule.ports = '';
    this.data.networkRule.cfg_type = this.CFG_TYPE.CUSTOMER;
    this.data.networkRule.learned = false;
    this.data.networkRule.disable = false;
  };

  comparePortStr = (str1, str2) => {
    return (
      str1.split(',').sort().join(',') === str2.split(',').sort().join(',') ||
      !this.data.networkRule.id
    );
  };

  updateNetworkRule = () => {
    this.submittingUpdate = true;
    this.data.networkRule.action = 'allow';
    delete this.data.networkRule.id;
    this.data.networkRule.applications =
      this.data.secEvent.applications.length > 0
        ? this.data.secEvent.applications.split(', ')
        : [];
    this.data.networkRule.ports = this.data.secEvent.details.serverPort;
    this.securityEventsService
      .updateNetworkRule(this.data.networkRule)
      .subscribe(
        response => {
          this.dialogRef.close(true);
        },
        error => {},
        () => {
          this.submittingUpdate = false;
        }
      );
  };
}
