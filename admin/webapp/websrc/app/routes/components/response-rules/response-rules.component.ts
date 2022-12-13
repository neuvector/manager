import { Component, Input, OnInit } from '@angular/core';
import { ResponseRulesService } from '@services/response-rules.service';
import { TranslateService } from '@ngx-translate/core';
import { GridOptions } from 'ag-grid-community';
import { UtilsService } from '@common/utils/app.utils';
import { MatDialog } from '@angular/material/dialog';
import { AddEditResponseRuleModalComponent } from './partial/add-edit-response-rule-modal/add-edit-response-rule-modal.component';
import { GlobalVariable } from '@common/variables/global.variable';
import { GlobalConstant } from '@common/constants/global.constant';
import { getScope } from '@common/utils/common.utils';
import { GroupsService } from '@services/groups.service';
import { AuthUtilsService } from '@common/utils/auth.utils';
import { MultiClusterService } from '@services/multi-cluster.service';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-response-rules',
  templateUrl: './response-rules.component.html',
  styleUrls: ['./response-rules.component.scss'],
})
export class ResponseRulesComponent implements OnInit {
  @Input() source: string = '';
  @Input() groupName: string = '';
  @Input() resizableHeight: number = 0;
  refreshing$ = new Subject();
  private isModalOpen: boolean = false;
  public responsePolicyErr: boolean = false;
  public gridOptions: GridOptions = <GridOptions>{};
  public gridHeight: number = 0;
  public filtered: boolean = false;
  public filteredCount: number = 0;
  public context;
  public navSource = GlobalConstant.NAV_SOURCE;
  public isWriteResponseRuleAuthorized: boolean = false;
  private w: any;
  private switchClusterSubscription;

  constructor(
    public responseRulesService: ResponseRulesService,
    private groupsService: GroupsService,
    private authUtilsService: AuthUtilsService,
    private translate: TranslateService,
    private utils: UtilsService,
    private multiClusterService: MultiClusterService,
    public dialog: MatDialog
  ) {
    this.w = GlobalVariable.window;
  }

  ngOnInit(): void {
    this.source = this.source ? this.source : GlobalConstant.NAV_SOURCE.SELF;
    this.isWriteResponseRuleAuthorized =
      this.authUtilsService.getDisplayFlag('write_response_rule') &&
      (this.source !== GlobalConstant.NAV_SOURCE.GROUP &&
      this.source !== GlobalConstant.NAV_SOURCE.SELF
        ? this.authUtilsService.getDisplayFlag('multi_cluster')
        : true);
    this.gridOptions = this.responseRulesService.prepareGrid(
      this.isWriteResponseRuleAuthorized,
      this.source
    );
    this.context = { componentParent: this };
    this.responseRulesService.scope = getScope(this.source);
    this.refresh();

    //refresh the page when it switched to a remote cluster
    this.switchClusterSubscription =
      this.multiClusterService.onClusterSwitchedEvent$.subscribe(data => {
        this.refresh();
      });
  }

  ngOnDestroy(): void {
    if (this.switchClusterSubscription) {
      this.switchClusterSubscription.unsubscribe();
    }
  }

  refresh() {
    this.refreshing$.next(true);
    if (this.source === GlobalConstant.NAV_SOURCE.GROUP) {
      this.getGroupPolicy();
    } else {
      this.getResponseRules();
    }
  }

  filterCountChanged(results: number) {
    this.filteredCount = results;
    this.filtered =
      this.filteredCount !== this.responseRulesService.responseRules.length;
  }

  getResponseRules = (): void => {
    this.responsePolicyErr = false;
    this.responseRulesService
      .getResponseRulesData(this.responseRulesService.scope)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        (response: any) => {
          this.responseRulesService.responseRules =
            this.responseRulesService.destructConditions(response.rules);
          this.gridHeight =
            this.source === GlobalConstant.NAV_SOURCE.SELF
              ? this.w.innerHeight - 180 - 70
              : this.source === GlobalConstant.NAV_SOURCE.FED_POLICY
              ? this.w.innerHeight - 298
              : 0;
        },
        err => {
          this.responsePolicyErr = true;
        }
      );
  };

  addResponseRule2Top = (event): void => {
    if (!this.isModalOpen) {
      this.responseRulesService.index4Add = -1;
      this.responseRulesService.getAutoCompleteData().subscribe(
        response => {
          this.openAddResponseRuleModal(response);
        },
        err => {
          this.openAddResponseRuleModal();
        }
      );
      this.isModalOpen = true;
    }
  };

  private getGroupPolicy = () => {
    this.groupsService
      .getGroupInfo(this.groupName)
      .pipe(finalize(() => this.refreshing$.next(false)))
      .subscribe(
        (response: any) => {
          let convertedRules = this.responseRulesService.destructConditions(
            response.response_rules
          );
          this.gridOptions.api!.setRowData(convertedRules);
        },
        error => {}
      );
  };

  private openAddResponseRuleModal = (
    autoCompleteData: Object[] = []
  ): void => {
    let addDialogRef = this.dialog.open(AddEditResponseRuleModalComponent, {
      data: {
        autoCompleteData: autoCompleteData,
        source: this.source,
        type: 'add',
      },

      width: '70vw',
    });
    addDialogRef.afterClosed().subscribe(result => {
      setTimeout(() => {
        this.getResponseRules();
        this.isModalOpen = false;
      }, 1000);
    });
  };
}
