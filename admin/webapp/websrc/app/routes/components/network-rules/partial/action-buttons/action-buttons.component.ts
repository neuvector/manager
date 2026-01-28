import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MatDialog } from '@angular/material/dialog';
import { GlobalConstant } from '@common/constants/global.constant';
import { AddEditNetworkRuleModalComponent } from '@components/network-rules/partial/add-edit-network-rule-modal/add-edit-network-rule-modal.component';
import { ConfirmDialogComponent } from '@components/ui/confirm-dialog/confirm-dialog.component';
import { NetworkRulesService } from '@common/services/network-rules.service';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonsComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  buttonDisplayMap: any;
  CFG_TYPE = GlobalConstant.CFG_TYPE;
  isOperatableRuleType: boolean;
  isPromotable: boolean;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    public networkRulesService: NetworkRulesService
  ) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isOperatableRuleType =
      this.params.data.cfg_type !== GlobalConstant.CFG_TYPE.GROUND &&
      !(
        this.params.context.componentParent.source ===
          GlobalConstant.NAV_SOURCE.SELF &&
        this.params.data.cfg_type === GlobalConstant.CFG_TYPE.FED
      );
    this.isPromotable =
      this.params.data.cfg_type === GlobalConstant.CFG_TYPE.GROUND &&
      !(
        this.params.context.componentParent.source ===
          GlobalConstant.NAV_SOURCE.SELF &&
        this.params.data.cfg_type === GlobalConstant.CFG_TYPE.FED
      );
    this.buttonDisplayMap = {
      add: this.isOperatableRuleType,
      edit:
        !this.params.data.remove &&
        !this.params.data.learned &&
        this.isOperatableRuleType,
      delete:
        this.params.data.state !==
          GlobalConstant.NETWORK_RULES_STATE.READONLY &&
        !this.params.data.remove &&
        this.isOperatableRuleType,
      undelete: this.params.data.remove && this.isOperatableRuleType,
      revert:
        this.params.data.state ===
          GlobalConstant.NETWORK_RULES_STATE.READONLY &&
        this.isOperatableRuleType,
      promote: this.isPromotable,
    };
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  addNetworkRule = id => {
    const addEditDialogRef = this.dialog.open(
      AddEditNetworkRuleModalComponent,
      {
        width: '80%',
        data: {
          opType: GlobalConstant.MODAL_OP.ADD,
          networkRuleOptions:
            this.params.context.componentParent.networkRuleOptions,
          index: this.params.context.componentParent.networkRules.findIndex(
            rule => rule.id === id
          ),
          source: this.params.context.componentParent.source,
          cfgType:
            this.params.context.componentParent.source ===
            GlobalConstant.NAV_SOURCE.FED_POLICY
              ? GlobalConstant.SCOPE.FED
              : GlobalConstant.SCOPE.LOCAL,
          updateGridData: this.params.context.componentParent.updateGridData,
        },
      }
    );
  };

  editNetworkRule = id => {
    const addEditDialogRef = this.dialog.open(
      AddEditNetworkRuleModalComponent,
      {
        width: '80%',
        data: {
          opType: GlobalConstant.MODAL_OP.EDIT,
          networkRuleOptions:
            this.params.context.componentParent.networkRuleOptions,
          index: this.params.context.componentParent.networkRules.findIndex(
            rule => rule.id === id
          ),
          source: this.params.context.componentParent.source,
          cfgType:
            this.params.context.componentParent.source ===
            GlobalConstant.NAV_SOURCE.FED_POLICY
              ? GlobalConstant.SCOPE.FED
              : GlobalConstant.SCOPE.LOCAL,
          updateGridData: this.params.context.componentParent.updateGridData,
          selectedNetworkRule:
            this.params.context.componentParent.networkRules.filter(
              rule => rule.id === id
            )[0],
        },
      }
    );
  };

  deleteNetworkRule = id => {
    let displayId =
      id >= GlobalConstant.NEW_ID_SEED.NETWORK_RULE
        ? `New-${id - GlobalConstant.NEW_ID_SEED.NETWORK_RULE + 1}`
        : id;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: `${this.translate.instant(
          'policy.dialog.REMOVE'
        )} ${displayId}`,
        isSync: true,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.toggleMaskingDeletedRow(id, true);
      }
    });
  };

  undeleteNetworkRule = id => {
    let displayId =
      id >= GlobalConstant.NEW_ID_SEED.NETWORK_RULE
        ? `New-${id - GlobalConstant.NEW_ID_SEED.NETWORK_RULE + 1}`
        : id;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '700px',
      data: {
        message: `${this.translate.instant(
          'policy.dialog.UNREMOVE'
        )} ${displayId}`,
        isSync: true,
      },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.toggleMaskingDeletedRow(id, false);
      }
    });
  };

  private toggleMaskingDeletedRow = (id: number, isMaskOn: boolean) => {
    let targetIndex =
      this.params.context.componentParent.networkRules.findIndex(
        rule => rule.id === id
      );
    let row =
      this.params.context.componentParent.gridApi!.getRowNode(targetIndex);
    this.params.context.componentParent.networkRules[targetIndex].remove =
      isMaskOn;
    this.params.context.componentParent.gridApi!.redrawRows({
      rowNodes: [row],
    });
    this.networkRulesService.isNetworkRuleChanged = true;
    setTimeout(() => {
      this.params.context.componentParent.gridApi!.ensureIndexVisible(
        targetIndex,
        'top'
      );
    }, 500);
  };

  revertNetworkRule = id => {
    let indexAtBackup = this.networkRulesService.networkRuleBackup.findIndex(
      rule => rule.id === id
    );
    let indexAtCurr =
      this.params.context.componentParent.networkRules.findIndex(
        rule => rule.id === id
      );
    this.params.context.componentParent.networkRules[indexAtCurr] = JSON.parse(
      JSON.stringify(this.networkRulesService.networkRuleBackup[indexAtBackup])
    );
    this.params.context.componentParent.gridApi!.setGridOption(
      'rowData',
      this.params.context.componentParent.networkRules
    );
    this.networkRulesService.isNetworkRuleChanged = false;
    setTimeout(() => {
      let row =
        this.params.context.componentParent.gridApi!.getDisplayedRowAtIndex(
          indexAtCurr
        );
      row.setSelected(true);
      this.params.context.componentParent.gridApi!.ensureIndexVisible(
        indexAtCurr,
        'top'
      );
    }, 500);
  };

  promoteNeworkRuleOnEntry = id => {
    let payload = {
      request: {
        ids: [id],
      },
    };
    this.networkRulesService.promoteNetworkRulesData(payload).subscribe(
      res => {
        setTimeout(() => {
          this.params.context.componentParent.gridApi!.redrawRows();
        }, 2000);
      },
      err => {}
    );
  };
}
