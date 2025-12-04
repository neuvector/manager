import { Component } from '@angular/core';
import { ApikeyExpiration } from '@common/types';
import { UtilsService } from '@common/utils/app.utils';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import * as moment from 'moment';

@Component({
  standalone: false,
  selector: 'app-apikeys-grid-expiration-cell',
  templateUrl: './apikeys-grid-expiration-cell.component.html',
  styleUrls: ['./apikeys-grid-expiration-cell.component.scss'],
})
export class ApikeysGridExpirationCellComponent
  implements ICellRendererAngularComp
{
  params!: ICellRendererParams;
  expiration_type!: ApikeyExpiration;
  expiration_duration!: string;

  constructor(private utils: UtilsService) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.expiration_type = this.params.data.expiration_type;
    this.expiration_duration = this.utils.getRelativeDuration(
      moment.unix(this.params.data.expiration_timestamp)
    );
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
}
