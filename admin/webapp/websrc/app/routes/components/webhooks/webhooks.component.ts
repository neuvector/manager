import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { GlobalConstant } from '@common/constants/global.constant';
import { MultiClusterService } from '@services/multi-cluster.service';
import { WebhookService } from '@services/webhook.service';
import { repeatWhen } from 'rxjs/operators';
import { Webhook } from '@common/types';
import { MatDialog } from '@angular/material/dialog';
import { AddEditWebhookModalComponent } from '@components/webhooks/partial/add-edit-webhook-modal/add-edit-webhook-modal.component';
import { GlobalVariable } from '@common/variables/global.variable';
import { GridOptions } from 'ag-grid-community';
import { AuthUtilsService } from '@common/utils/auth.utils';

@Component({
  selector: 'app-webhooks',
  templateUrl: './webhooks.component.html',
  styleUrls: ['./webhooks.component.scss'],
})
export class WebhooksComponent implements OnInit, OnDestroy {
  @Input() source!: string;
  public navSource = GlobalConstant.NAV_SOURCE;
  public webhooks!: Webhook[];
  public agGridHeight: number = GlobalVariable.window.innerHeight - 300;
  public agGridOptions: GridOptions = <GridOptions>{};
  public context;
  public isLoading = false;

  private _switchClusterSubscription;

  refresh$ = new Subject();

  constructor(
    private _multiClusterService: MultiClusterService,
    private _authUtilsService: AuthUtilsService,
    private _webhookService: WebhookService,
    private _dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.context = { componentParent: this };
    this.agGridOptions = this._webhookService.gridOptions(
      this._authUtilsService.getDisplayFlag('multi_cluster_w')
    );
    this.getWebhooks();

    //refresh the page when it switched to a remote cluster
    this._switchClusterSubscription = this._multiClusterService.onClusterSwitchedEvent$.subscribe(
      data => {
        this.refresh();
      }
    );
  }

  ngOnDestroy(): void {
    if (this._switchClusterSubscription) {
      this._switchClusterSubscription.unsubscribe();
    }
  }

  getWebhooks(): void {
    this._webhookService
      .getFedWebhooks()
      .pipe(repeatWhen(() => this.refresh$))
      .subscribe({
        next: data => {
          this.refresh$.next(false);
          this.isLoading = false;
          this.webhooks = data.fed_config.webhooks;
        },
        error: error => {
          this.refresh$.next(false);
          this.isLoading = false;
        },
      });
  }

  addWebhook = () => {
    const dialogRef = this._dialog.open(AddEditWebhookModalComponent, {
      width: '80%',
      data: {
        opType: GlobalConstant.MODAL_OP.ADD,
      },
    });
    dialogRef.afterClosed().subscribe(refresh => {
      if (refresh) {
        this.refresh();
      }
    });
  };

  refresh() {
    if (!this.isLoading) {
      this.isLoading = true;
      this.refresh$.next(true);
    }
  }
}
