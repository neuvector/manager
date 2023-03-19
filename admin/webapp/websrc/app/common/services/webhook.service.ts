import { Injectable, SecurityContext } from '@angular/core';
import { GlobalVariable } from '@common/variables/global.variable';
import { PathConstant } from '@common/constants/path.constant';
import { Webhook, WebhookTypes } from '@common/types';
import { Observable } from 'rxjs';
import { GridOptions } from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { ActionButtonsComponent } from '@components/webhooks/partial/action-buttons/action-buttons.component';
import { MapConstant } from '@common/constants/map.constant';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable()
export class WebhookService {
  constructor(
    private _translate: TranslateService,
    public sanitizer: DomSanitizer
  ) {}

  gridOptions = isEditable => {
    const columnDefs = [
      {
        headerName: this._translate.instant('setting.webhook.NAME'),
        field: 'name',
        width: 210,
        minWidth: 150,
      },
      {
        headerName: this._translate.instant('setting.webhook.URL'),
        field: 'url',
        width: 400,
      },
      {
        headerName: this._translate.instant('setting.webhook.WH_TYPE'),
        field: 'type',
        cellRenderer: params => {
          return this.webhookTypeRenderFunc(params);
        },
        width: 170,
        minWidth: 170,
        maxWidth: 170,
      },
      {
        headerName: this._translate.instant('setting.webhook.STATUS'),
        field: 'enable',
        cellRenderer: params => {
          return this.statusRenderFunc(params);
        },
        width: 140,
        minWidth: 140,
        maxWidth: 140,
      },
      {
        headerName: this._translate.instant('setting.webhook.TYPE'),
        field: 'cfg_type',
        cellRenderer: params => {
          return this.typeRenderFunc(params);
        },
        cellClass: 'grid-center-align',
        width: 165,
        minWidth: 165,
        maxWidth: 165,
      },
      {
        cellRenderer: ActionButtonsComponent,
        cellClass: ['grid-center-align'],
        width: 100,
        maxWidth: 100,
        minWidth: 100,
      },
    ];
    const $win = $(GlobalVariable.window);
    let gridOptions: GridOptions = {
      defaultColDef: {
        resizable: true,
        sortable: true,
      },
      headerHeight: 30,
      rowHeight: 30,
      animateRows: true,
      suppressDragLeaveHidesColumns: true,
      columnDefs: columnDefs,
      rowData: null,
      onGridReady: function(params) {
        params.api.sizeColumnsToFit();
      },
      overlayNoRowsTemplate: this._translate.instant('general.NO_ROWS'),
    };

    return gridOptions;
  };
  getFedWebhooks(): Observable<any> {
    return GlobalVariable.http
      .get(PathConstant.CONFIG_URL, { params: { scope: 'fed' } })
      .pipe();
  }

  addWebhook(payload: Webhook): Observable<Object> {
    return GlobalVariable.http.post(PathConstant.WEBHOOK, payload, {
      params: { scope: 'fed' },
    });
  }

  updateWebhook(payload: Webhook): Observable<Object> {
    return GlobalVariable.http.patch(PathConstant.WEBHOOK, payload, {
      params: { scope: 'fed' },
    });
  }

  deleteWebhook(name: string): Observable<Object> {
    return GlobalVariable.http.delete(PathConstant.WEBHOOK, {
      params: { name: name, scope: 'fed' },
    });
  }

  typeRenderFunc(params) {
    if (params && params.value) {
      return (
        '<div class="action-label px-1 fed-rule">' +
        this._translate.instant('group.FEDERAL') +
        '</div>'
      );
    }
    return '';
  }

  statusRenderFunc(params) {
    if (params) {
      let type = params.value ? 'ENABLED' : 'DISABLED';
      let result = `<span class="action-label px-1 ${
        params.data.enable
          ? MapConstant.colourMap['allow']
          : MapConstant.colourMap['disabled_color']
      }">${this.sanitizer.sanitize(
        SecurityContext.HTML,
        this._translate.instant('setting.' + type.toUpperCase())
      )}</span>`;
      return result;
    }
    return '';
  }

  webhookTypeRenderFunc(params) {
    if (params && params.value) {
      let em = params.value === 'Slack' ? '<em class="fa-slack fab"></em>' : '';
      return `<span class="ag-badge badge bg-info text-light ng-star-inserted">${em}${this.sanitizer.sanitize(
        SecurityContext.HTML,
        params.value
      )}</span>`;
    } else {
      return '<span>' + WebhookTypes[3].viewValue + '</span>';
    }
  }
}
