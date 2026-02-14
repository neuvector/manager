import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { GroupsService } from '@common/services/groups.service';
import { NotificationService } from '@services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RuleDetailModalComponent } from '@components/groups/partial/rule-detail-modal/rule-detail-modal.component';
import { RuleDetailModalService } from '@components/groups/partial/rule-detail-modal/rule-detail-modal.service';

@Component({
  standalone: false,
  selector: 'app-group-response-rules',
  templateUrl: './group-response-rules.component.html',
  styleUrls: ['./group-response-rules.component.scss'],
})
export class GroupResponseRulesComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  constructor(
    private groupsService: GroupsService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private ruleDetailModalService: RuleDetailModalService,
    private translate: TranslateService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  openResponseRuleDetailModal = (ruleId: number) => {
    this.groupsService.getResponseRuleById(ruleId).subscribe(
      (response: any) => {
        this.ruleDetailModalService.ruleDialog = this.dialog.open(
          RuleDetailModalComponent,
          {
            width: '70vw',
            hasBackdrop: false,
            data: {
              rule: response.rule,
              ruleType: 'response',
            },
          }
        );
      },
      error => {
        this.notificationService.openError(
          error.error,
          this.translate.instant('group.GET_RULE_ERR')
        );
      }
    );
  };
}
