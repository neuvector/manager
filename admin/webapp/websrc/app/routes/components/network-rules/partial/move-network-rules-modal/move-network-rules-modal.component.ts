import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UpdateType } from '@common/types/network-rules/enum';
import { GlobalConstant } from '@common/constants/global.constant';

@Component({
  standalone: false,
  selector: 'app-move-network-rules-modal',
  templateUrl: './move-network-rules-modal.component.html',
  styleUrls: ['./move-network-rules-modal.component.scss'],
})
export class MoveNetworkRulesModalComponent implements OnInit {
  movingPosition: UpdateType;
  idFormCtrl: FormControl;
  submittingUpdate: boolean = false;
  updateType = UpdateType;

  constructor(
    public dialogRef: MatDialogRef<MoveNetworkRulesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.idFormCtrl = new FormControl(null, Validators.required);
    this.movingPosition = UpdateType.MoveBefore;
  }

  onCancel = () => {
    this.dialogRef.close(false);
  };

  moveNetworkRules = () => {
    let targetIndex = this.data.networkRules.findIndex(
      rule => rule.id === this.idFormCtrl.value
    );
    this.data.selectedNetworkRules = this.data.selectedNetworkRules.map(
      rule => {
        if (
          rule.state !== GlobalConstant.NETWORK_RULES_STATE.MODIFIED &&
          rule.state !== GlobalConstant.NETWORK_RULES_STATE.NEW
        ) {
          rule.state = GlobalConstant.NETWORK_RULES_STATE.MOVED;
        }
        return rule;
      }
    );
    this.data.updateGridData(
      this.data.selectedNetworkRules,
      0,
      this.movingPosition,
      this.idFormCtrl.value
    );
    this.dialogRef.close(true);
  };
}
