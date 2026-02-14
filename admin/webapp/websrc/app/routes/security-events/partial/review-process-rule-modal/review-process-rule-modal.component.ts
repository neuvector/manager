import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalConstant } from '@common/constants/global.constant';
import { isEmptyObj } from '@common/utils/common.utils';
import { SecurityEventsService } from '@common/services/security-events.service';

@Component({
  standalone: false,
  selector: 'app-review-process-rule-modal',
  templateUrl: './review-process-rule-modal.component.html',
  styleUrls: ['./review-process-rule-modal.component.scss'],
})
export class ReviewProcessRuleModalComponent implements OnInit {
  isReviewRule: boolean;
  isReadOnlyRule: boolean;
  processRuleFromGroup: FormGroup;
  newAction: boolean;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  submittingUpdate: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ReviewProcessRuleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data,
    private securityEventsService: SecurityEventsService
  ) {}

  ngOnInit(): void {
    this.isReviewRule =
      this.data.processRule.length > 0 &&
      this.data.secEvent.details.message.messageCategory ===
        'processProfileViolation';
    this.isReadOnlyRule =
      (this.data.processRule.length > 0 &&
        (this.data.processRule[0].cfg_type === this.CFG_TYPE.FED ||
          this.data.processRule[0].cfg_type === this.CFG_TYPE.GROUND)) ||
      this.data.secEvent.reviewRulePermission === 'r';
    this.processRuleFromGroup = new FormGroup({
      group: new FormControl(this.data.secEvent.details.message.group),
      procName: new FormControl(this.data.secEvent.details.message.procName),
      procPath: new FormControl(this.data.secEvent.details.message.procPath),
    });
    this.newAction = true;
  }

  updateProcessRule = () => {
    if (this.isReviewRule && this.data.processRule.length > 0) {
      this.overwriteProcessRule();
    } else {
      this.proposeNewProcessRule();
    }
  };

  private overwriteProcessRule = () => {
    let action = 'allow';

    let originalProcessRule = {
      name: this.data.processRule[0].name || '',
      path: this.data.processRule[0].path || '',
      action: this.data.processRule[0].action || false,
    };

    let changedProcessRule = {
      name: this.data.processRule[0].name || '',
      path: this.data.processRule[0].path || '',
      action: action,
    };

    let payload = {
      process_profile_config: {
        group: this.data.secEvent.details.message.group,
        process_change_list: [changedProcessRule],
        process_delete_list: [originalProcessRule],
      },
    };
    this.sendProcessRuleUpdateRequest(payload);
  };

  private proposeNewProcessRule = () => {
    let action = 'allow';

    let payload = {
      process_profile_config: {
        group: this.data.secEvent.details.message.group,
        process_change_list: [
          {
            name: this.data.secEvent.details.message.procName || '',
            path: this.data.secEvent.details.message.procPath || '',
            action: action,
          },
        ],
      },
    };
    this.sendProcessRuleUpdateRequest(payload);
  };

  private sendProcessRuleUpdateRequest = (payload: any) => {
    this.submittingUpdate = true;
    this.securityEventsService.updateProcessRule(payload).subscribe(
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
