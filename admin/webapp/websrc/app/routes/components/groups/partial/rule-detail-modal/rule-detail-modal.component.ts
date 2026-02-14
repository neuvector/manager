import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RuleDetailModalService } from '@components/groups/partial/rule-detail-modal/rule-detail-modal.service';

@Component({
  standalone: false,
  selector: 'app-rule-detail-modal',
  templateUrl: './rule-detail-modal.component.html',
  styleUrls: ['./rule-detail-modal.component.scss'],
})
export class RuleDetailModalComponent implements OnInit {
  constructor(
    public ruleDetailModalService: RuleDetailModalService,
    public dialogRef: MatDialogRef<RuleDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {}

  ngOnInit(): void {
    if (this.data.ruleType === 'response') {
      this.data.rule.conditions = this.destructConditions(
        this.data.rule.conditions
      );
    }
  }

  private destructConditions = conditions => {
    let resCondition = '';
    if (
      conditions !== null &&
      conditions !== '' &&
      typeof conditions !== 'undefined'
    ) {
      conditions.forEach(function (condition) {
        resCondition += condition.type + ':' + condition.value + ', ';
      });
      resCondition = resCondition.substring(0, resCondition.length - 2);
    } else {
      resCondition = '';
    }
    return resCondition;
  };
}
